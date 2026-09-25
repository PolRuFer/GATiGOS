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
  followFocus(lenis);

  const context = { gsap, ScrollTrigger, lenis };
  const gestures = [
    ['[data-hero]', '@gatygos/motion-hero'],
    ['[data-room]', '@gatygos/motion-rooms'],
    ['[data-reveal]', '@gatygos/motion-cards'],
    ['[data-manifesto]', '@gatygos/motion-manifesto'],
  ];
  // One gesture per task, so start-up never becomes a single long task.
  for (const [selector, specifier] of gestures) {
    if (!document.querySelector(selector)) continue;
    const module = await import(specifier);
    await yieldToMain();
    module.default(context);
  }
  await yieldToMain();
  ScrollTrigger.refresh();
}

const yieldToMain = () =>
  new Promise((resolve) => (window.scheduler?.yield ? scheduler.yield().then(resolve) : setTimeout(resolve, 0)));

// Keyboard focus drives Lenis. The browser's own focus scrolling moves the
// window behind Lenis's back (its stored position goes stale and it would
// pull the page back), so measure against the real scroll and hand the
// final position to Lenis. Rails handle their own items.
function followFocus(lenis) {
  document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest('[data-room-track], dialog, site-header')) return;
    const box = target.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const stale = Math.abs(window.scrollY - lenis.scroll) > 1;
    if (!stale && !lenis.isScrolling && box.top >= top && box.bottom <= window.innerHeight) return;
    const destination = box.top + window.scrollY - window.innerHeight * 0.3;
    lenis.scrollTo(Math.max(0, destination), { duration: 0.6, force: true });
  });
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
