const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const page of ['index.html', 'collection.html']) {
    for (const [w, h] of [[360, 780], [768, 1024], [1440, 900]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      const heavy = [];
      const errors = [];
      p.on('request', (r) => { if (/three|vendor-motion|hero-scene|motion-/.test(r.url())) heavy.push(r.url().split('/').pop().split('?')[0]); });
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(`http://localhost:4173/${page}`, { waitUntil: 'networkidle' });
      await p.mouse.move(100, 100); await p.mouse.wheel(0, 400); await p.waitForTimeout(1200);
      const st = await p.evaluate(() => ({ motionOk: document.documentElement.classList.contains('motion-ok'), pins: document.querySelectorAll('.pin-spacer').length, overflowX: document.documentElement.scrollWidth - innerWidth, staged: !!document.querySelector('.manifesto.is-staged'), hidden: document.querySelectorAll('.is-pending').length }));
      console.log(page, w, 'reduced →', JSON.stringify(st), '| heavy JS:', heavy.length ? heavy : 'none', errors.length ? '| ERR ' + errors : '');
      await p.screenshot({ path: `shot/reduced-${page.replace('.html', '')}-${w}.png`, fullPage: true });
      await ctx.close();
    }
  }
  await b.close();
})();
