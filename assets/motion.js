/**
 * GatYGos — motion core.
 * Lenis smooth scroll synced with ScrollTrigger on the central GSAP ticker,
 * layered parallax for the light orbs, and the per-section gestures, which
 * are imported only when their section is on the page.
 * With prefers-reduced-motion nothing here loads (see the inline check in
 * layout/theme.liquid that sets html.motion-ok).
 */
const root = document.documentElement;

async function init() {
  const { gsap, ScrollTrigger, Lenis } = await import('vendor-motion');
  gsap.registerPlugin(ScrollTrigger);

  // Soft, decelerating scroll (expo-out); the page never feels rubbery.
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    autoRaf: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Modal dialogs (mobile menu, filter drawer) freeze the page scroll.
  const syncDialogs = () => (document.querySelector('dialog[open]') ? lenis.stop() : lenis.start());
  new MutationObserver(syncDialogs).observe(document.body, { subtree: true, attributeFilter: ['open'] });

  parallaxOrbs(gsap);

  const context = { gsap, ScrollTrigger, lenis };
  const gestures = [
    ['[data-hero]', '@gatygos/motion-hero'],
    ['[data-room]', '@gatygos/motion-rooms'],
    ['[data-reveal]', '@gatygos/motion-cards'],
    ['[data-manifesto]', '@gatygos/motion-manifesto'],
  ];
  await Promise.all(
    gestures
      .filter(([selector]) => document.querySelector(selector))
      .map(([, specifier]) => import(specifier).then((module) => module.default(context)))
  );
  ScrollTrigger.refresh();
}

// Orbs are the deepest layer: they drift the least while the room passes.
function parallaxOrbs(gsap) {
  document.querySelectorAll('.orbs').forEach((layer) => {
    layer.querySelectorAll('.orb').forEach((orb, index) => {
      gsap.fromTo(
        orb,
        { yPercent: -10 - index * 4 },
        {
          yPercent: 10 + index * 4,
          ease: 'none', // scrubbed: the scroll itself (Lenis) carries the easing
          scrollTrigger: { trigger: layer.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    });
  });
}

if (root.classList.contains('motion-ok')) init();
