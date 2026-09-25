// Cat paw prints + featured turn; dog drag with inertia and lean.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:4173/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  const catTop = await p.evaluate(() => document.querySelector('.room--cat').closest('.pin-spacer').getBoundingClientRect().top + scrollY);
  await p.evaluate((y) => window.scrollTo(0, y + 40), catTop); await p.waitForTimeout(1500);
  for (let i = 0; i < 12; i++) { await p.mouse.move(420 + i * 40, 520 + i * 10); await p.waitForTimeout(60); }
  await p.waitForTimeout(500);
  const prints = await p.evaluate(() => [...document.querySelectorAll('.room__paw')].filter((el) => +getComputedStyle(el).opacity > 0.05).length);
  await p.screenshot({ path: 'shot/toy-paws.png' });
  await p.waitForTimeout(1000);
  const turn = await p.evaluate(() => getComputedStyle(document.querySelector('.room--cat .room__featured .product-media__frame')).transform);
  console.log('cat: paw prints visible', prints, '| featured transform', turn.slice(0, 40));
  const dogTop = await p.evaluate(() => document.querySelector('.room--dog').closest('.pin-spacer').getBoundingClientRect().top + scrollY);
  await p.evaluate((y) => window.scrollTo(0, y + 60), dogTop); await p.waitForTimeout(1500);
  const before = await p.evaluate(() => scrollY);
  const track = await p.locator('.room--dog [data-room-track]').boundingBox();
  await p.mouse.move(track.x + track.width * 0.6, track.y + track.height * 0.5);
  await p.mouse.down();
  for (let i = 1; i <= 10; i++) { await p.mouse.move(track.x + track.width * 0.6 + i * 30, track.y + track.height * 0.5); await p.waitForTimeout(16); }
  const skewDuring = await p.evaluate(() => getComputedStyle(document.querySelector('.room--dog .room__item')).transform);
  await p.mouse.up();
  await p.waitForTimeout(1600);
  const after = await p.evaluate(() => scrollY);
  const skewAfter = await p.evaluate(() => getComputedStyle(document.querySelector('.room--dog .room__item')).transform);
  console.log('dog: scroll moved by drag', before, '->', after, '| lean during', skewDuring.slice(0, 44), '| after', skewAfter.slice(0, 44));
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
