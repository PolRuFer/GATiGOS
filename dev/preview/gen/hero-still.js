// node gen/hero-still.js → assets/hero-fallback-{2400,1600,portrait}.webp from the live scene.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 2400, height: 1800 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.error(e.message));
  await p.goto('http://localhost:4173/gen/hero-still.html');
  await p.waitForFunction(() => window.ready);
  for (const [name, w, h] of [['2400', 2400, 1500], ['1600', 1600, 1000], ['portrait', 1080, 1800]]) {
    const data = await p.evaluate(([w, h]) => window.renderStill(w, h), [w, h]);
    const file = path.resolve(__dirname, '../../../assets', `hero-fallback-${name}.webp`);
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
    console.log(path.basename(file), (fs.statSync(file).size / 1024).toFixed(1), 'KB');
  }
  await b.close();
})();
