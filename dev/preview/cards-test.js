// Reveal (first fold never hidden, later cards reveal staggered) + tilt.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:4173/collection.html', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const state = () => p.evaluate(() => [...document.querySelectorAll('[data-reveal]')].map((c) => (c.classList.contains('is-revealed') ? 'R' : c.classList.contains('is-pending') ? 'p' : '.')).join(''));
  console.log('at load  :', await state());
  await p.evaluate(() => window.scrollTo(0, 1400)); await p.waitForTimeout(1200);
  console.log('scrolled :', await state(), '| delays:', await p.evaluate(() => [...document.querySelectorAll('.is-revealed')].slice(0, 6).map((c) => c.style.getPropertyValue('--reveal-delay')).join(',')));
  const card = p.locator('.collection__item .product-media').nth(4);
  const box = await card.boundingBox();
  await p.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2); await p.waitForTimeout(80);
  await p.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.15); await p.waitForTimeout(900);
  const t = await p.evaluate(() => { const f = document.querySelectorAll('.collection__item .product-media__frame')[4]; const pill = f.querySelector('.product-media__pill'); return { transform: getComputedStyle(f).transform.slice(0, 50), glint: pill.style.getPropertyValue('--glint-x') }; });
  console.log('tilt:', JSON.stringify(t));
  await p.screenshot({ path: 'shot/tilt.png', clip: { x: box.x - 20, y: box.y - 20, width: box.width + 40, height: box.height + 40 } });
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
