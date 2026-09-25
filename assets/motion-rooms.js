/**
 * GatYGos — rooms gesture and toys.
 * Each room is pinned and the vertical scroll becomes a lateral walk past
 * its products (reference: darkroom.engineering's scroll feel; the head
 * stays in its column as in an exhibition wall text).
 * - Cat room toy: an unseen cat stalks the pointer, leaving small paw
 *   prints that fade behind it, and pounces with both paws when it catches
 *   up; the featured piece turns towards the pointer. A tap sends the cat
 *   to the tap; keyboard focus sends it to the focused piece.
 * - Dog room toy: the rail can be dragged with real inertia and a rubber
 *   band at both ends; pieces lean with the speed and settle when released
 *   (reference: Bruno Simon's physical playfulness, kept to a lean).
 * Keyboard focus inside a rail scrolls the page so the item is in view.
 */
export default function roomsMotion({ gsap, ScrollTrigger, lenis }) {
  document.querySelectorAll('[data-room]').forEach((room) => {
    const track = room.querySelector('[data-room-track]');
    const strip = room.querySelector('[data-room-strip]');
    if (!track || !strip) return;

    const mirrored = window.matchMedia('(min-width: 990px)');
    const reverse = () => room.dataset.room === 'dog' && mirrored.matches;
    const distance = () => Math.max(0, strip.scrollWidth - track.clientWidth);
    track.classList.add('is-driven');

    const walk = gsap.fromTo(
      strip,
      { x: () => (reverse() ? -distance() : 0) },
      { x: () => (reverse() ? 0 : -distance()), ease: 'none' } // scrubbed by the scroll
    );
    const lean = room.dataset.room === 'dog' ? leaner(strip, gsap) : null;
    const trigger = ScrollTrigger.create({
      trigger: room,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: true,
      animation: walk,
      invalidateOnRefresh: true,
      onUpdate: lean,
    });

    // Keep keyboard focus visible inside the walking rail.
    track.addEventListener('focusin', (event) => {
      const item = event.target.closest('.room__featured, .room__item');
      if (!item || !distance()) return;
      const offset = reverse() ? strip.scrollWidth - item.offsetLeft - item.offsetWidth : item.offsetLeft;
      const progress = gsap.utils.clamp(0, 1, (offset - track.clientWidth * 0.2) / distance());
      lenis.scrollTo(trigger.start + progress * (trigger.end - trigger.start), { duration: 0.8 });
    });

    if (room.dataset.room === 'cat') pawToy(room, gsap);
    if (room.dataset.room === 'dog') dragToy(room, track, strip, trigger, gsap, lenis);
  });
}

function pawToy(room, gsap) {
  const layer = room.querySelector('[data-room-paws]');
  const featured = room.querySelector('.room__featured .product-media__frame');
  if (!layer) return;
  const SPEED = 520; // px per second at a trot
  const STRIDE = 30; // distance between prints
  const SIDE = 7; // left and right paws sit either side of the path
  const prints = Array.from({ length: 18 }, () => {
    const paw = document.createElement('span');
    paw.className = 'room__paw';
    layer.append(paw);
    return paw;
  });
  let next = 0;
  let cat = null; // { x, y, walked, left }
  let target = null;
  let ticking = false;
  const turnY = featured && gsap.quickTo(featured, 'rotationY', { duration: 1.2, ease: 'power3.out' });
  const turnX = featured && gsap.quickTo(featured, 'rotationX', { duration: 1.2, ease: 'power3.out' });
  if (featured) gsap.set(featured, { transformPerspective: 1200 });

  const stamp = (x, y, angle, side, scale = 1) => {
    const paw = prints[next];
    next = (next + 1) % prints.length;
    const rad = (angle * Math.PI) / 180;
    gsap.killTweensOf(paw);
    gsap.set(paw, { x: x - Math.sin(rad) * side, y: y + Math.cos(rad) * side, rotation: angle + 90 });
    gsap.fromTo(paw, { opacity: 0.55, scale: 0.7 * scale }, { scale, duration: 0.25, ease: 'power2.out' });
    gsap.to(paw, { opacity: 0, duration: 1.4, delay: 0.5, ease: 'power1.in' });
  };

  // One step of the stalk per frame on the shared ticker, only while the
  // cat is walking.
  const walk = (time, delta) => {
    const dx = target.x - cat.x;
    const dy = target.y - cat.y;
    const gap = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (gap < 18) {
      // Caught it: both front paws land together on the mouse.
      stamp(target.x, target.y, angle, cat.left ? -SIDE : SIDE, 1.15);
      stamp(target.x, target.y, angle, cat.left ? SIDE : -SIDE, 1.15);
      cat.x = target.x;
      cat.y = target.y;
      gsap.ticker.remove(walk);
      ticking = false;
      return;
    }
    const step = Math.min(gap, (SPEED * Math.min(delta, 50)) / 1000);
    cat.x += (dx / gap) * step;
    cat.y += (dy / gap) * step;
    cat.walked += step;
    if (cat.walked >= STRIDE) {
      cat.walked = 0;
      cat.left = !cat.left;
      stamp(cat.x, cat.y, angle, cat.left ? -SIDE : SIDE);
    }
  };

  const chase = (x, y) => {
    const box = room.getBoundingClientRect();
    // A new cat trots in from the nearer side of the room.
    if (!cat) cat = { x: x < box.width / 2 ? -20 : box.width + 20, y, walked: STRIDE, left: false };
    target = { x, y };
    if (!ticking) {
      ticking = true;
      gsap.ticker.add(walk);
    }
  };

  const follow = (event) => {
    const box = room.getBoundingClientRect();
    chase(event.clientX - box.left, event.clientY - box.top);
    if (!featured) return;
    const f = featured.getBoundingClientRect();
    turnY(gsap.utils.clamp(-1, 1, (event.clientX - (f.left + f.width / 2)) / box.width) * 10);
    turnX(gsap.utils.clamp(-1, 1, (event.clientY - (f.top + f.height / 2)) / box.height) * -6);
  };
  const rest = () => {
    turnY?.(0);
    turnX?.(0);
  };
  room.addEventListener('pointermove', follow, { passive: true });
  room.addEventListener('pointerdown', follow, { passive: true });
  room.addEventListener('pointerleave', rest, { passive: true });
  // Keyboard: the cat walks to whatever piece takes focus.
  room.addEventListener('focusin', (event) => {
    const box = room.getBoundingClientRect();
    const item = event.target.getBoundingClientRect();
    chase(item.left + item.width / 2 - box.left, item.bottom - box.top + 12);
  });
  // Off screen the cat wanders off; the next visit starts a fresh walk.
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) return;
    gsap.ticker.remove(walk);
    ticking = false;
    cat = null;
  }).observe(room);
}

// Pieces lean with the walking speed (scroll or drag) and settle when it
// stops. Driven by the pin's updates, so nothing runs off screen.
function leaner(strip, gsap) {
  const items = strip.querySelectorAll('.room__featured, .room__item');
  const lean = items.length ? gsap.quickTo(items, 'skewX', { duration: 0.6, ease: 'power3.out' }) : () => {};
  const settle = gsap.delayedCall(0.15, () => lean(0)).pause();
  return (self) => {
    lean(gsap.utils.clamp(-6, 6, self.getVelocity() / -150));
    settle.restart(true);
  };
}

function dragToy(room, track, strip, trigger, gsap, lenis) {
  const band = gsap.quickTo(strip, 'xPercent', { duration: 0.5, ease: 'power3.out' });
  const span = () => trigger.end - trigger.start;
  let drag = null;

  track.addEventListener('dragstart', (event) => event.preventDefault());

  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag = { x: event.clientX, scroll: lenis.scroll, moved: 0, last: event.clientX, time: performance.now(), velocity: 0 };
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    const now = performance.now();
    drag.velocity = (event.clientX - drag.last) / Math.max(1, now - drag.time);
    drag.last = event.clientX;
    drag.time = now;
    const ratio = span() / Math.max(1, strip.scrollWidth - track.clientWidth);
    const target = drag.scroll - dx * ratio;
    const clamped = gsap.utils.clamp(trigger.start, trigger.end, target);
    lenis.scrollTo(clamped, { immediate: true });
    // Rubber band past either end.
    band(((target - clamped) / ratio / track.clientWidth) * -12);
  });

  const release = () => {
    if (!drag) return;
    const ratio = span() / Math.max(1, strip.scrollWidth - track.clientWidth);
    const glide = gsap.utils.clamp(trigger.start, trigger.end, lenis.scroll - drag.velocity * 420 * ratio);
    lenis.scrollTo(glide, { duration: 1.2 });
    gsap.to(strip, { xPercent: 0, duration: 0.9, ease: 'elastic.out(1, 0.55)' });
    const moved = drag.moved;
    drag = null;
    // A real drag should not also open the product under the pointer.
    if (moved > 6) track.addEventListener('click', (event) => event.preventDefault(), { capture: true, once: true });
  };
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', release);
}
