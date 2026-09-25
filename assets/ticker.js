/**
 * GatYGos — central ticker.
 * The only requestAnimationFrame loop on the page is GSAP's ticker. Every
 * animated piece (3D hero, Lenis, toys) subscribes here and unsubscribes
 * when it leaves the viewport or the tab is hidden.
 */
import { gsap } from 'vendor-motion';

const subscribers = new Set();

export const ticker = {
  /** @param {(time: number, deltaMs: number) => void} fn */
  add(fn) {
    if (subscribers.has(fn)) return;
    subscribers.add(fn);
    gsap.ticker.add(fn);
  },
  remove(fn) {
    if (!subscribers.delete(fn)) return;
    gsap.ticker.remove(fn);
  },
};

export { gsap };
