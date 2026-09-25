// Tab through a page; report each stop: visible, in viewport, not under the header, has an outline.
const { chromium } = require('playwright');
(async () => {
  const [,, page = 'index.html', w = '1440', h = '900', reduced = ''] = process.argv;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:4173/${page}`, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const problems = [];
  let stops = 0;
  for (let i = 0; i < 90; i++) {
    await p.keyboard.press('Tab');
    await p.waitForTimeout(i < 3 ? 120 : 650);
    const s = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const header = document.querySelector('.site-header__bar')?.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const covered = header && !el.closest('site-header') && !el.classList.contains('skip-link') && r.top < header.bottom - 4 && r.bottom > header.top;
      return {
        name: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 34),
        inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0,
        covered,
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
        footer: !!el.closest('footer'),
      };
    });
    if (!s) break;
    stops++;
    if (!s.inView || s.covered || !s.outline) problems.push(`${stops}. ${s.name} ${!s.inView ? '[fuera de vista]' : ''}${s.covered ? '[bajo el header]' : ''}${!s.outline ? '[sin outline]' : ''}`);
    if (s.footer && /Devoluciones|Returns/.test(s.name)) break;
  }
  console.log(`${page} ${w}${reduced ? ' reduced' : ''}: ${stops} paradas, ${problems.length} problemas`);
  problems.forEach((x) => console.log('   ', x));
  await b.close();
})();
