// Scroll through the home with motion on; capture key positions and errors.
const { chromium } = require('playwright');
(async () => {
  const [,, w = '1440', h = '900', prefix = 'shot/scroll'] = process.argv;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
  await p.goto('http://localhost:4173/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  const info = await p.evaluate(() => ({ motion: document.documentElement.classList.contains('motion-ok'), height: document.documentElement.scrollHeight, pins: document.querySelectorAll('.pin-spacer').length }));
  console.log(JSON.stringify(info));
  const stops = [0.5, 1.0, 1.6, 2.4, 3.0, 3.6, 4.4, 5.2];
  for (const f of stops) {
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(f * +h));
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${prefix}-${w}-${String(f).replace('.', '_')}.png` });
  }
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
