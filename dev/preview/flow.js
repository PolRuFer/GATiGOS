// Filter flow checks: desktop dropdown + Escape, mobile drawer + AJAX update.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const errors = [];
  const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
  d.on('pageerror', (e) => errors.push(e.message));
  await d.goto('http://localhost:4173/collection.html', { waitUntil: 'networkidle' });
  await d.evaluate(() => window.scrollTo(0, 500)); await d.waitForTimeout(300);
  await d.locator('[data-facet]').nth(1).locator('summary').click(); await d.waitForTimeout(400);
  await d.screenshot({ path: 'shot/flow-dropdown-1440.png', clip: { x: 0, y: 0, width: 1440, height: 520 } });
  await d.keyboard.press('Escape'); await d.waitForTimeout(200);
  console.log('desktop: dropdown closed on Esc:', await d.evaluate(() => !document.querySelector('[data-facet][open]')), '| focus:', await d.evaluate(() => document.activeElement.textContent.trim().slice(0, 20)));
  const m = await b.newPage({ viewport: { width: 360, height: 780 } });
  m.on('pageerror', (e) => errors.push(e.message));
  await m.goto('http://localhost:4173/collection.html', { waitUntil: 'networkidle' });
  await m.click('[data-filters-open]'); await m.waitForTimeout(500);
  await m.locator('.filter-drawer [data-facet]').nth(1).locator('summary').click(); await m.waitForTimeout(300);
  await m.screenshot({ path: 'shot/flow-drawer-360.png' });
  await m.locator('.filter-drawer input[value="Fieltro de lana"]').check(); await m.waitForTimeout(1200);
  const state = await m.evaluate(() => ({
    url: location.pathname + location.search,
    count: document.querySelector('[data-sync="count"]').textContent.trim(),
    show: document.querySelector('[data-sync="show"]').textContent.trim(),
    items: document.querySelectorAll('.collection__item').length,
    chips: [...document.querySelectorAll('.active-filters__chip')].map((c) => c.firstChild.textContent.trim()),
    focusInDrawer: !!document.activeElement.closest('dialog'),
  }));
  console.log('mobile after filter:', JSON.stringify(state));
  await m.screenshot({ path: 'shot/flow-drawer-after-360.png' });
  await m.click('.filter-drawer__foot [data-filters-close]'); await m.waitForTimeout(500);
  console.log('mobile: drawer closed:', await m.evaluate(() => !document.querySelector('[data-filters-drawer]').open), '| filters back home:', await m.evaluate(() => !!document.querySelector('[data-filters-home] [data-filters]')), '| focus:', await m.evaluate(() => document.activeElement.className));
  await m.screenshot({ path: 'shot/flow-results-360.png' });
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
