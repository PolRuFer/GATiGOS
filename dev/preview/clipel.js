// node clipel.js <url> <selector> <out> <widths> — screenshot one element (scrolled into view)
const { chromium } = require('playwright');
(async () => {
  const [,, url, sel, out, widths] = process.argv;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const w of widths.split(',').map(Number)) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(url, { waitUntil: 'networkidle' });
    const el = p.locator(sel).first();
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
    await el.screenshot({ path: `${out}-${w}.png` });
    await p.close();
  }
  await b.close();
})();
