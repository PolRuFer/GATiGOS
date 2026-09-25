// Hero toy check: cursor over the bed (wool dent) and a sweep through the beam (dust).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4173/index.html', { waitUntil: 'load' });
  await p.waitForSelector('.hero__canvas.is-ready', { timeout: 30000 });
  await p.waitForTimeout(800);
  const clip = { x: 660, y: 330, width: 700, height: 330 };
  await p.mouse.move(100, 200); await p.waitForTimeout(600);
  await p.screenshot({ path: 'shot/toy-rest.png', clip });
  // Settle the cursor on the top of the bed: the wool gives.
  for (let i = 0; i < 8; i++) { await p.mouse.move(900 + i * 6, 470); await p.waitForTimeout(60); }
  await p.waitForTimeout(700);
  await p.screenshot({ path: 'shot/toy-press.png', clip });
  // Fast sweep through the beam: dust is carried along.
  for (let i = 0; i <= 12; i++) { await p.mouse.move(640 + i * 30, 250 + i * 12); await p.waitForTimeout(20); }
  await p.waitForTimeout(120);
  await p.screenshot({ path: 'shot/toy-stir.png', clip: { x: 520, y: 150, width: 700, height: 420 } });
  await b.close();
})();
