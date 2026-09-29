// node gen/figures-run.js → writes assets/menu-figure-{cat,dog}.png turntable
// strips (needs serve.js running). Convert to WebP afterwards.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const specs = [
  { kind: 'cat', color: '#cdb293', size: 160, frames: 24 },
  { kind: 'dog', color: '#b48c66', size: 160, frames: 24 },
];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  p.on('pageerror', (e) => console.error(e.message));
  await p.goto('http://localhost:4173/gen/figures.html');
  await p.waitForFunction(() => window.ready);
  for (const s of specs) {
    const data = await p.evaluate((spec) => window.renderStrip(spec), s);
    const out = path.join(__dirname, 'out', `menu-figure-${s.kind}.png`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
    console.log('wrote', out);
  }
  await b.close();
})();
