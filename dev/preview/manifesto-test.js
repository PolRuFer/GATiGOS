const { chromium } = require('playwright');
(async () => {
  const [,, w = '1440', h = '900'] = process.argv;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:4173/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  const geo = await p.evaluate(() => { const s = document.querySelector('[data-manifesto]').closest('.pin-spacer'); const r = s.getBoundingClientRect(); return { top: r.top + scrollY, height: s.offsetHeight }; });
  console.log('spacer', JSON.stringify(geo), 'vh', h);
  const span = geo.height - +h;
  for (const f of [0.02, 0.2, 0.45, 0.7, 0.98]) {
    const y = Math.round(geo.top + span * f);
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(1500);
    const st = await p.evaluate(() => { const m = document.querySelector('[data-manifesto]'); return { scrollY: Math.round(scrollY), sectionTop: Math.round(m.getBoundingClientRect().top), tone: m.dataset.headerTone, headerDark: document.querySelector('site-header').classList.contains('is-on-dark'), night: getComputedStyle(m.querySelector('.manifesto__night')).opacity.slice(0, 4), visibleWords: [...m.querySelectorAll('.word')].filter((x) => +getComputedStyle(x).opacity > 0.9).length }; });
    console.log(f, 'target', y, JSON.stringify(st));
    await p.screenshot({ path: `shot/man-${w}-${String(f).replace('.', '_')}.png` });
  }
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
