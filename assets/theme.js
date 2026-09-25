/**
 * GatYGos — theme.js
 * Global behaviour shared by every page. Vanilla, no dependencies.
 */

/**
 * <site-header>
 * - `.is-compact` once the page has scrolled past the first 64px.
 * - `.is-past-hero` once a hero marked with [data-header-overlay] no longer
 *   sits under the header (the header shows its glass from then on).
 * - `.is-on-dark` while a section marked [data-header-tone="dark"] is under
 *   the header (the glass cross-fades to dark).
 * - Opens and closes the full-screen mobile menu (<dialog>).
 * Uses IntersectionObserver instead of scroll listeners.
 */
class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('[data-mobile-menu]');
    this.openButton = this.querySelector('[data-menu-open]');
    this.closeButton = this.querySelector('[data-menu-close]');

    this.observeScroll();
    this.observeHero();
    this.observeTone();
    this.bindMenu();
  }

  disconnectedCallback() {
    this.scrollObserver?.disconnect();
    this.heroObserver?.disconnect();
    this.toneObserver?.disconnect();
    this.desktopQuery?.removeEventListener('change', this.onDesktopChange);
    this.sentinel?.remove();
  }

  observeScroll() {
    this.sentinel = document.createElement('div');
    this.sentinel.setAttribute('aria-hidden', 'true');
    this.sentinel.style.cssText =
      'position:absolute;top:0;left:0;width:1px;height:64px;pointer-events:none;visibility:hidden;';
    document.body.prepend(this.sentinel);

    this.scrollObserver = new IntersectionObserver(([entry]) => {
      this.classList.toggle('is-compact', !entry.isIntersecting);
    });
    this.scrollObserver.observe(this.sentinel);
  }

  observeHero() {
    const hero = document.querySelector('[data-header-overlay]');
    if (!hero) {
      this.classList.add('is-past-hero');
      return;
    }

    // The root is shrunk to the top band of the viewport, where the header sits.
    this.heroObserver = new IntersectionObserver(
      ([entry]) => this.classList.toggle('is-past-hero', !entry.isIntersecting),
      { rootMargin: '0px 0px -90% 0px' }
    );
    this.heroObserver.observe(hero);
  }

  // Dark glass while a pine section sits under the header.
  observeTone() {
    const dark = document.querySelectorAll('[data-header-tone="dark"]');
    if (!dark.length) return;
    const under = new Set();
    this.toneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? under.add(entry.target) : under.delete(entry.target)));
        this.classList.toggle('is-on-dark', under.size > 0);
      },
      { rootMargin: '-32px 0px -92% 0px' }
    );
    dark.forEach((section) => this.toneObserver.observe(section));
  }

  bindMenu() {
    if (!this.dialog || !this.openButton) return;

    this.openButton.addEventListener('click', () => this.openMenu());
    this.closeButton?.addEventListener('click', () => this.closeMenu());
    this.dialog.addEventListener('close', () => {
      this.openButton.setAttribute('aria-expanded', 'false');
      document.dispatchEvent(new CustomEvent('gatygos:menu', { detail: { open: false } }));
      this.openButton.focus({ preventScroll: true });
    });
    this.dialog.addEventListener('click', (event) => {
      // Click on the 8px backdrop edge closes the menu.
      if (event.target === this.dialog) {
        const rect = this.dialog.getBoundingClientRect();
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!inside) this.closeMenu();
      }
    });

    this.desktopQuery = window.matchMedia('(min-width: 990px)');
    this.onDesktopChange = (event) => {
      if (event.matches && this.dialog.open) this.closeMenu();
    };
    this.desktopQuery.addEventListener('change', this.onDesktopChange);
  }

  openMenu() {
    if (this.dialog.open) return;
    this.dialog.showModal();
    this.openButton.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new CustomEvent('gatygos:menu', { detail: { open: true } }));
  }

  closeMenu() {
    if (this.dialog.open) this.dialog.close();
  }
}

if (!customElements.get('site-header')) {
  customElements.define('site-header', SiteHeader);
}
