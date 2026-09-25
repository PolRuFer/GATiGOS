/**
 * GatYGos — product cards: staggered reveal and the magnetic tilt toy.
 * - Reveal: cards that start off screen are hidden, then fade in and rise
 *   16px as they enter, 60ms apart within each batch (IntersectionObserver).
 *   Cards already visible at start are never hidden, so a failure can not
 *   leave the grid empty and the first fold does not flash.
 * - Tilt (fine pointers only): the frame leans up to 6 degrees towards the
 *   pointer and the specular edge of the glass pill follows it (reference:
 *   Linear/Stripe micro-interactions; kept small so it reads as a well
 *   made object, not a gadget). Keyboard focus keeps the flat hover state.
 */
const STAGGER = 60;

export default function cardsMotion({ gsap }) {
  reveal();
  document.addEventListener('gatygos:results', reveal);
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) tilt(gsap);
}

let observer;
function reveal() {
  observer ??= new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry, index) => {
          entry.target.style.setProperty('--reveal-delay', `${index * STAGGER}ms`);
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
    },
    { rootMargin: '0px 0px -8% 0px' }
  );

  document.querySelectorAll('[data-reveal]:not(.is-pending):not(.is-revealed)').forEach((card) => {
    const box = card.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return; // already seen
    card.classList.add('is-pending');
    observer.observe(card);
  });
}

function tilt(gsap) {
  let active = null;

  const release = () => {
    if (!active) return;
    active.turnX(0);
    active.turnY(0);
    active.pill?.style.removeProperty('--glint-x');
    active = null;
  };

  document.addEventListener('pointerover', (event) => {
    const media = event.target.closest?.('.product-card .product-media');
    if (!media || active?.media === media) return;
    release();
    const frame = media.querySelector('.product-media__frame');
    gsap.set(frame, { transformPerspective: 900 });
    active = {
      media,
      frame,
      pill: media.querySelector('.product-media__pill'),
      turnX: gsap.quickTo(frame, 'rotationX', { duration: 0.6, ease: 'power3.out' }),
      turnY: gsap.quickTo(frame, 'rotationY', { duration: 0.6, ease: 'power3.out' }),
    };
  }, { passive: true });

  document.addEventListener('pointermove', (event) => {
    if (!active) return;
    const box = active.frame.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return release();
    active.turnY((x - 0.5) * 12);
    active.turnX((0.5 - y) * 12);
    active.pill?.style.setProperty('--glint-x', `${(x * 100).toFixed(1)}%`);
  }, { passive: true });
}
