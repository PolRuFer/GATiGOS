// node shots.js <url> <prefix> <w1,w2,..> [scrollY] [action] [fullPage]
const { chromium } = require('playwright');
(async () => {
  const [,, url, prefix, widths, scrollY = '0', action = '', full = '0'] = process.argv;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const w of widths.split(',').map(Number)) {
    const h = w < 700 ? 780 : w < 1000 ? 1024 : 900;
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(url, { waitUntil: 'networkidle' });
    if (+scrollY) { await p.evaluate((y) => window.scrollTo(0, y), +scrollY); await p.waitForTimeout(900); }
    if (action === 'menu') { await p.click('[data-menu-open]'); await p.waitForTimeout(600); }
    if (action === 'tab') { for (let i = 0; i < 3; i++) await p.keyboard.press('Tab'); await p.waitForTimeout(300); }
    await p.waitForTimeout(400);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await p.screenshot({ path: `${prefix}-${w}.png`, fullPage: full === '1' });
    console.log(w, 'overflowX', ov, errors.length ? 'ERRORS ' + errors.join(' | ') : '');
    await p.close();
  }
  await b.close();
})();
