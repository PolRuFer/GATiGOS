/**
 * GatYGos — <collection-filters>
 * Progressive enhancement of the native Storefront Filtering form:
 * - Without JavaScript the form submits as a normal GET request.
 * - With JavaScript, changes fetch the section through the Section Rendering
 *   API and swap the results in place (with a view transition when motion
 *   is allowed), keeping the URL in sync for back/forward.
 * - One set of inputs: on desktop the facets live in the sticky bar; below
 *   990px the same node moves into a <dialog> drawer while it is open.
 */
class CollectionFilters extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('[data-filters-form]');
    this.filters = this.querySelector('[data-filters]');
    this.home = this.querySelector('[data-filters-home]');
    this.drawer = this.querySelector('[data-filters-drawer]');
    this.drawerSlot = this.querySelector('[data-filters-drawer-slot]');
    this.openButton = this.querySelector('[data-filters-open]');
    if (!this.form || !this.filters) return;

    this.listeners = new AbortController();
    const { signal } = this.listeners;
    this.desktop = window.matchMedia('(min-width: 990px)');

    this.form.addEventListener('change', (event) => this.onChange(event), { signal });
    this.form.addEventListener('input', (event) => this.onInput(event), { signal });
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.update(this.formQuery());
    }, { signal });
    this.addEventListener('click', (event) => this.onClick(event), { signal });
    this.addEventListener('toggle', (event) => this.onFacetToggle(event), { capture: true, signal });
    document.addEventListener('click', (event) => this.closeFacetsOutside(event), { signal });
    document.addEventListener('keydown', (event) => this.onKeydown(event), { signal });
    window.addEventListener('popstate', () => this.update(window.location.search.slice(1), false), { signal });

    this.openButton?.addEventListener('click', () => this.openDrawer(), { signal });
    this.drawer?.addEventListener('close', () => this.onDrawerClose(), { signal });
    this.desktop.addEventListener('change', () => this.drawer?.open && this.drawer.close(), { signal });

    this.classList.add('is-enhanced');
  }

  disconnectedCallback() {
    this.listeners?.abort();
    this.request?.abort();
    clearTimeout(this.debounce);
  }

  /* Events ------------------------------------------------------------- */

  onChange(event) {
    if (event.target.matches('.facet__price-input')) return; // handled on input
    this.update(this.formQuery());
  }

  onInput(event) {
    if (!event.target.matches('.facet__price-input')) return;
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.update(this.formQuery()), 600);
  }

  onClick(event) {
    const close = event.target.closest('[data-filters-close]');
    if (close) {
      this.drawer?.close();
      return;
    }
    const link = event.target.closest('a[data-filter-link]');
    if (!link) return;
    event.preventDefault();
    this.update(new URL(link.href, window.location.origin).searchParams.toString());
  }

  // Desktop dropdowns: only one open at a time.
  onFacetToggle(event) {
    const facet = event.target;
    if (!facet.matches?.('[data-facet]') || !facet.open || !this.desktop.matches) return;
    this.querySelectorAll('[data-facet][open]').forEach((other) => {
      if (other !== facet) other.open = false;
    });
  }

  closeFacetsOutside(event) {
    if (!this.desktop.matches || event.target.closest('[data-facet]')) return;
    this.querySelectorAll('[data-facet][open]').forEach((facet) => (facet.open = false));
  }

  onKeydown(event) {
    if (event.key !== 'Escape' || !this.desktop.matches) return;
    const open = this.querySelector('[data-facet][open]');
    if (!open) return;
    open.open = false;
    open.querySelector('summary')?.focus();
  }

  /* Drawer ------------------------------------------------------------- */

  openDrawer() {
    this.drawerSlot.append(this.filters);
    this.drawer.showModal();
    this.openButton.setAttribute('aria-expanded', 'true');
  }

  onDrawerClose() {
    this.home.append(this.filters);
    this.openButton.setAttribute('aria-expanded', 'false');
    this.openButton.focus({ preventScroll: true });
  }

  /* Rendering ---------------------------------------------------------- */

  formQuery() {
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(this.form)) {
      if (value !== '') params.append(name, value);
    }
    return params.toString();
  }

  async update(query, push = true) {
    const url = `${this.dataset.url}?${query}`;
    const results = this.querySelector('[data-collection-results]');
    this.request?.abort();
    this.request = new AbortController();
    results.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(`${url}${query ? '&' : ''}section_id=${this.dataset.sectionId}`, {
        signal: this.request.signal,
      });
      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const swap = () => this.render(html);
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (document.startViewTransition && !calm) await document.startViewTransition(swap).updateCallbackDone;
      else swap();
      if (push) window.history.pushState({}, '', url);
    } catch (error) {
      if (error.name !== 'AbortError') window.location.href = url;
    } finally {
      results.removeAttribute('aria-busy');
    }
  }

  // Swap the results, then sync counters and input states from the response
  // without replacing the inputs (keeps focus where the user left it).
  render(html) {
    const next = html.querySelector('[data-collection-results]');
    if (next) this.querySelector('[data-collection-results]').replaceChildren(...next.childNodes);
    document.dispatchEvent(new CustomEvent('gatygos:results'));

    html.querySelectorAll('[data-sync]').forEach((source) => {
      const target = this.querySelector(`[data-sync="${source.dataset.sync}"]`);
      if (target) target.innerHTML = source.innerHTML;
    });

    html.querySelectorAll('[data-filters] input, [data-filters] select').forEach((source) => {
      const selector = source.type === 'checkbox'
        ? `input[name="${CSS.escape(source.name)}"][value="${CSS.escape(source.value)}"]`
        : `[name="${CSS.escape(source.name)}"]`;
      const target = this.form.querySelector(selector);
      if (!target) return;
      if (source.type === 'checkbox') {
        target.checked = source.checked;
        target.disabled = source.disabled;
      } else if (target !== document.activeElement) {
        target.value = source.value;
      }
    });
  }
}

if (!customElements.get('collection-filters')) {
  customElements.define('collection-filters', CollectionFilters);
}
