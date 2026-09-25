/**
 * GatYGos — hero gesture: the hero is pinned while the scroll raises the
 * camera from 25 cm off the floor to eye level, tilting down to reveal the
 * room (reference: Apple product pages, a camera directed by the scroll).
 * Without the 3D scene the still image drifts up gently instead.
 */
export default function heroMotion({ gsap, ScrollTrigger }) {
  const hero = document.querySelector('[data-hero]');
  const still = hero.querySelector('.hero__fallback');

  const trigger = ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: '+=100%',
    pin: true,
    scrub: true,
    onUpdate: (self) => hero.heroScene?.setProgress(self.progress),
  });

  hero.addEventListener('hero:ready', (event) => event.detail.setProgress(trigger.progress));

  if (still) {
    gsap.to(still, {
      yPercent: -4,
      scale: 1.06,
      ease: 'none', // scrubbed by the scroll
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=100%', scrub: true },
    });
  }
}
