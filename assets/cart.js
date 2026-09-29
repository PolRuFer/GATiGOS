/**
 * GatYGos — <cart-page>
 * Progressive enhancement of the cart form: steppers, typed quantities and
 * "remove" links update the cart with /cart/update.js and re-render the
 * section through the Section Rendering API, without a page reload. Without
 * JavaScript (or if a request fails) the plain form still works.
 */
class CartPage extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.updateUrl = `${this.dataset.updateUrl}.js`;
    this.addEventListener('click', this.onClick);
    this.addEventListener('change', this.onChange);
  }

  get form() {
    return this.querySelector('[data-cart-form]');
  }

  onClick = (event) => {
    const step = event.target.closest('[data-step]');
    if (step) {
      const input = this.querySelector(`#${step.getAttribute('aria-controls')}`);
      input.value = Math.max(0, (parseInt(input.value, 10) || 0) + Number(step.dataset.step));
      this.schedule();
      return;
    }
    const remove = event.target.closest('[data-cart-remove]');
    if (remove) {
      event.preventDefault();
      const input = this.querySelector(`[data-cart-quantity="${remove.dataset.cartRemove}"]`);
      if (input) input.value = 0;
      this.update();
    }
  };

  onChange = (event) => {
    if (event.target.matches('[data-cart-quantity]')) this.schedule();
  };

  // Several quick taps on a stepper become a single request.
  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.update(), 350);
  }

  async update() {
    clearTimeout(this.timer);
    const updates = [...this.querySelectorAll('[data-cart-quantity]')].map((input) => Math.max(0, parseInt(input.value, 10) || 0));
    const note = this.querySelector('#CartNote')?.value;
    const focusedId = document.activeElement?.id;
    this.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(this.updateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ updates, note, sections: [this.sectionId], sections_url: window.location.pathname }),
      });
      if (!response.ok) throw new Error(response.statusText);
      const cart = await response.json();
      const html = cart.sections?.[this.sectionId];
      if (!html) throw new Error('missing section');
      const fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-cart-content]');
      this.querySelector('[data-cart-content]').replaceWith(fresh);
      this.syncHeader(cart.item_count);
      this.announce(this.dataset.updated);
      // Keep the keyboard where it was; fall back to the heading.
      const target = (focusedId && document.getElementById(focusedId)) || this.querySelector('h1');
      if (target === this.querySelector('h1')) target.setAttribute('tabindex', '-1');
      target?.focus({ preventScroll: true });
    } catch {
      // Hand the change to the server with a normal form submission.
      const form = this.form;
      if (form) form.requestSubmit(form.querySelector('[data-cart-update]'));
      else this.announce(this.dataset.error);
    } finally {
      this.removeAttribute('aria-busy');
    }
  }

  syncHeader(count) {
    document.querySelectorAll('.site-header__cart, .mobile-menu__cart').forEach((link) => {
      let badge = link.querySelector('.site-header__cart-count');
      if (count > 0 && !badge) {
        badge = document.createElement('span');
        badge.className = 'site-header__cart-count';
        badge.setAttribute('aria-hidden', 'true');
        link.append(badge);
      }
      if (badge) count > 0 ? (badge.textContent = count) : badge.remove();
      link.setAttribute('aria-label', link.getAttribute('aria-label').replace(/\d+/, count));
    });
  }

  announce(message) {
    const status = this.querySelector('[data-cart-status]');
    if (!status || !message) return;
    status.textContent = '';
    requestAnimationFrame(() => (status.textContent = message));
  }
}

if (!customElements.get('cart-page')) customElements.define('cart-page', CartPage);
