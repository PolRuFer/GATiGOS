/**
 * GatYGos — <hero-media>: loads the 3D hero only when it is worth it.
 * Three.js is imported dynamically when all of these hold:
 *   the hero is on screen, the page has finished loading and is idle,
 *   the device has WebGL2 and at least 4 CPU cores, and the visitor has
 *   not asked for reduced motion.
 * Until then (and forever otherwise) the static fallback image stays. The
 * render loop only runs while the hero is visible and the tab is shown.
 */
const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

function capable() {
  if (calm.matches || (navigator.hardwareConcurrency || 0) < 4) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

const whenIdle = () =>
  new Promise((resolve) => {
    const idle = () => (window.requestIdleCallback ? requestIdleCallback(resolve, { timeout: 2500 }) : setTimeout(resolve, 600));
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
  });

class HeroMedia extends HTMLElement {
  connectedCallback() {
    if (!capable()) return;
    this.hero = this.closest('[data-hero]');
    this.visible = false;
    this.listeners = new AbortController();
    const { signal } = this.listeners;

    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.load();
      this.sync();
    });
    this.observer.observe(this);
    document.addEventListener('visibilitychange', () => this.sync(), { signal });
    calm.addEventListener('change', (event) => event.matches && this.teardown(), { signal });
  }

  disconnectedCallback() {
    this.teardown();
  }

  async load() {
    if (this.loading) return;
    this.loading = (async () => {
      await whenIdle();
      const { createHeroScene } = await import('@gatygos/hero-scene');
      if (!this.isConnected) return;
      this.scene = createHeroScene(this, { interactive: this.hero });
      this.hero.heroScene = this.scene;
      this.hero.dispatchEvent(new CustomEvent('hero:ready', { detail: this.scene, bubbles: true }));
      this.sync();
    })();
  }

  sync() {
    if (!this.scene) return;
    if (this.visible && !document.hidden) this.scene.start();
    else this.scene.stop();
  }

  teardown() {
    this.observer?.disconnect();
    this.listeners?.abort();
    this.scene?.dispose();
    this.scene = null;
    if (this.hero) this.hero.heroScene = null;
  }
}

if (!customElements.get('hero-media')) customElements.define('hero-media', HeroMedia);
