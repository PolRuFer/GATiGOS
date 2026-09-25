// node gen/run.js → writes dev/preview/media/*.jpg (needs serve.js running)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  p.on('pageerror', (e) => console.error(e.message));
  await p.goto('http://localhost:4173/gen/index.html');
  await p.waitForFunction(() => window.ready);
  const shots = await p.evaluate(() => window.shots);
  for (const s of shots) {
    const data = await p.evaluate((spec) => window.renderShot(spec), s);
    fs.writeFileSync(path.join(__dirname, '..', 'media', s.file + '.jpg'), Buffer.from(data.split(',')[1], 'base64'));
    console.log('wrote', s.file);
  }
  await b.close();
})();
