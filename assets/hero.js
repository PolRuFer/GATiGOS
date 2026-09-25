/**
 * GatYGos — <hero-media>: loads the 3D hero only when it is worth it.
 * Three.js is imported dynamically when all of these hold:
 *   the visitor has shown intent (pointer, touch, scroll, key), the page is
 *   idle, the hero is on screen, the device has hardware WebGL2 and at
 *   least 4 CPU cores, and the visitor has not asked for reduced motion.
 * Until then (and forever otherwise) the static fallback image stays. The
 * render loop only runs while the hero is visible and the tab is shown.
 */
const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

// Cheap checks first; the WebGL probe runs only after the visitor shows
// intent, and software renderers (SwiftShader, llvmpipe…) are refused: they
// cannot hold the frame budget and would block the main thread.
function capable() {
  if (calm.matches || (navigator.hardwareConcurrency || 0) < 4) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

// The still has the scene's exact framing, so the 3D can wait for the first
// sign of intent (pointer, touch, scroll or key) and then for an idle slot.
const intent = new Promise((resolve) => {
  const events = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'];
  const go = () => {
    events.forEach((type) => window.removeEventListener(type, go));
    resolve();
  };
  events.forEach((type) => window.addEventListener(type, go, { once: true, passive: true }));
});

const whenIdle = () =>
  new Promise((resolve) => {
    if (window.requestIdleCallback) requestIdleCallback(resolve, { timeout: 1200 });
    else setTimeout(resolve, 200);
  });

class HeroMedia extends HTMLElement {
  async connectedCallback() {
    if (calm.matches) return;
    await intent;
    await whenIdle();
    if (!this.isConnected || !capable()) return;
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
