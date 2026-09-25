// Reduced motion: no Three.js request, still image visible.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    const js = [];
    p.on('request', (r) => { if (/three|hero-scene|vendor-motion/.test(r.url())) js.push(r.url().split('/').pop()); });
    await p.goto('http://localhost:4173/index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(3000);
    const img = await p.evaluate(() => { const i = document.querySelector('.hero__fallback'); return { src: i.currentSrc.split('/').pop(), complete: i.complete, w: i.naturalWidth }; });
    console.log(w, 'reduced-motion → heavy JS requested:', js.length ? js : 'none', '| fallback:', JSON.stringify(img), '| canvas:', await p.evaluate(() => !!document.querySelector('.hero__canvas')));
    await p.screenshot({ path: `shot/fallback-${w}.png` });
    await ctx.close();
  }
  await b.close();
})();
