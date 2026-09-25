// node hover.js <url> <selector> <out> [width] — hover and focus captures of one element
const { chromium } = require('playwright');
(async () => {
  const [,, url, sel, out, w = '1440'] = process.argv;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: +w, height: 900 } });
  await p.goto(url, { waitUntil: 'networkidle' });
  const el = p.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  const clip = { x: box.x - 16, y: box.y - 16, width: box.width + 32, height: box.height + 32 };
  await p.screenshot({ path: out + '-rest.png', clip });
  await el.hover(); await p.waitForTimeout(900);
  await p.screenshot({ path: out + '-hover.png', clip });
  const bf = await p.evaluate((s) => { const e = document.querySelector(s + ' .product-media__pill'); return e ? getComputedStyle(e, '::after').opacity : null; }, sel);
  await p.mouse.move(0, 0); await el.focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(900);
  await p.screenshot({ path: out + '-focus.png', clip });
  console.log('pill blur layer opacity on hover:', bf);
  await b.close();
})();
