/**
 * GatYGos — manifesto gesture and toy.
 * Gesture: pinned; the room turns from paper to pine, the panel from light
 * to dark glass, then the words are revealed line by line (reference:
 * Aesop, type as the material; the scroll only dims the light first).
 * Toy: words drift away from the pointer like leaves on water and float
 * back (reference: Active Theory's physical type, reduced to a nudge).
 * The visual words are aria-hidden; a visually hidden copy is read, and
 * the visible text stays selectable.
 */
export default function manifestoMotion({ gsap }) {
  const section = document.querySelector('[data-manifesto]');
  const panel = section.querySelector('[data-manifesto-panel]');
  const holder = section.querySelector('[data-manifesto-words]');
  const words = splitWords(holder);
  const lines = groupLines(words);
  section.classList.add('is-staged');
  section.dataset.headerTone = 'light';

  const setTone = (tone) => {
    if (section.dataset.headerTone === tone) return;
    section.dataset.headerTone = tone;
    document.dispatchEvent(new CustomEvent('gatygos:tone'));
  };

  const timeline = gsap.timeline({
    defaults: { ease: 'none' }, // scrubbed: the scroll carries the easing
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=160%',
      pin: true,
      scrub: true,
      onUpdate: (self) => setTone(self.progress > 0.15 ? 'dark' : 'light'),
    },
  });
  timeline
    .fromTo(section.querySelector('.manifesto__night'), { opacity: 0 }, { opacity: 1, duration: 0.24 }, 0)
    .fromTo(section.querySelector('.manifesto__glass--light'), { opacity: 1 }, { opacity: 0, duration: 0.24 }, 0)
    .fromTo(section.querySelector('.manifesto__glass--dark'), { opacity: 0 }, { opacity: 1, duration: 0.24 }, 0)
    .fromTo(section.querySelector('.manifesto__eyebrow'), { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.22);
  lines.forEach((line, index) => {
    timeline.fromTo(
      line,
      { opacity: 0, yPercent: 35 },
      { opacity: 1, yPercent: 0, duration: 0.14, stagger: 0.012, ease: 'power2.out' },
      0.26 + index * 0.1
    );
  });

  drift(panel, words, gsap);
}

function splitWords(holder) {
  const text = holder.textContent.trim();
  holder.textContent = '';
  return text.split(/\s+/).map((word, index, all) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = index < all.length - 1 ? `${word} ` : word;
    holder.append(span);
    return span;
  });
}

function groupLines(words) {
  const lines = [];
  let top = null;
  words.forEach((word) => {
    if (word.offsetTop !== top) {
      lines.push([]);
      top = word.offsetTop;
    }
    lines[lines.length - 1].push(word);
  });
  return lines;
}

function drift(panel, words, gsap) {
  const radius = 140;
  const movers = words.map((word) => ({
    word,
    x: gsap.quickTo(word, 'x', { duration: 1.6, ease: 'power3.out' }),
    y: gsap.quickTo(word, 'y', { duration: 1.6, ease: 'power3.out' }),
    r: gsap.quickTo(word, 'rotation', { duration: 1.8, ease: 'power3.out' }),
  }));

  const push = (event) => {
    const box = panel.getBoundingClientRect();
    const px = event.clientX - box.left;
    const py = event.clientY - box.top;
    movers.forEach((mover) => {
      const { word } = mover;
      // The panel is the words' offsetParent, and offsets ignore transforms.
      const cx = word.offsetLeft + word.offsetWidth / 2;
      const cy = word.offsetTop + word.offsetHeight / 2;
      const dx = cx - px;
      const dy = cy - py;
      const d = Math.hypot(dx, dy) || 1;
      const force = Math.max(0, 1 - d / radius) ** 2;
      mover.x((dx / d) * force * 28);
      mover.y((dy / d) * force * 18);
      mover.r((dx / d) * force * 4);
    });
  };
  const calm = () => movers.forEach((mover) => (mover.x(0), mover.y(0), mover.r(0)));
  panel.addEventListener('pointermove', push, { passive: true });
  panel.addEventListener('pointerdown', push, { passive: true });
  panel.addEventListener('pointerleave', calm, { passive: true });
}
