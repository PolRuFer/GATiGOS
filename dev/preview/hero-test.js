// node hero-test.js [width] [height] [out] — waits for the 3D hero, measures fps, screenshots.
const { chromium } = require('playwright');
(async () => {
  const [,, w = '1440', h = '900', out = 'shot/hero3d', cpu = '1'] = process.argv;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  if (+cpu > 1) { const c = await p.context().newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: +cpu }); }
  await p.addInitScript(require('./gpu-shim.js'));
  await p.goto('http://localhost:4173/index.html', { waitUntil: 'load' });
  await p.mouse.move(5, 5);
  const t0 = Date.now();
  try { await p.waitForSelector('.hero__canvas.is-ready', { timeout: 30000 }); } catch { console.log('canvas never ready'); }
  console.log('scene ready after', Date.now() - t0, 'ms', '| cores', await p.evaluate(() => navigator.hardwareConcurrency));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}-${w}.png` });
  const fps = await p.evaluate(() => new Promise((res) => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s < 2000) requestAnimationFrame(f); else res(n / ((performance.now() - s) / 1000)); }; requestAnimationFrame(f); }));
  console.log('rAF fps (swiftshader, software GL):', fps.toFixed(1));
  // Pointer sweep across the bed and the beam.
  for (let i = 0; i <= 20; i++) { await p.mouse.move(+w * (0.15 + i * 0.03), +h * (0.72 - i * 0.02)); await p.waitForTimeout(30); }
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}-${w}-stir.png` });
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
