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
 * - Desktop dropdowns ([data-dropdown]): open on hover, click or keyboard;
 *   Escape, a click elsewhere or focus leaving close them.
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
    this.bindDropdowns();
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

  // Dark glass while a pine section sits under the header. Sections can
  // change their tone while scrolling (the manifesto) and announce it with
  // a `gatygos:tone` event.
  observeTone() {
    const toned = document.querySelectorAll('[data-header-tone]');
    if (!toned.length) return;
    const under = new Set();
    const update = () => this.classList.toggle('is-on-dark', [...under].some((el) => el.dataset.headerTone === 'dark'));
    this.toneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? under.add(entry.target) : under.delete(entry.target)));
        update();
      },
      { rootMargin: '-32px 0px -92% 0px' }
    );
    toned.forEach((section) => this.toneObserver.observe(section));
    document.addEventListener('gatygos:tone', update);
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

  bindDropdowns() {
    this.querySelectorAll('[data-dropdown]').forEach((item) => {
      const trigger = item.querySelector('[aria-expanded]');
      let timer;
      let hovered = false; // opened by hover: the click that follows must not close it
      const set = (open) => {
        clearTimeout(timer);
        if (!open) hovered = false;
        trigger.setAttribute('aria-expanded', String(open));
      };
      trigger.addEventListener('click', () => {
        if (hovered) return void (hovered = false);
        set(trigger.getAttribute('aria-expanded') !== 'true');
      });
      // Hover intent: open at once, close after a short grace period so the
      // pointer can travel from the trigger to the card.
      item.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;
        if (trigger.getAttribute('aria-expanded') !== 'true') hovered = true;
        set(true);
      });
      item.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'mouse') timer = setTimeout(() => set(false), 220);
      });
      item.addEventListener('focusout', (event) => {
        if (!item.contains(event.relatedTarget)) set(false);
      });
      item.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || trigger.getAttribute('aria-expanded') !== 'true') return;
        set(false);
        trigger.focus();
      });
      document.addEventListener('click', (event) => {
        if (!item.contains(event.target)) set(false);
      });
    });
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
