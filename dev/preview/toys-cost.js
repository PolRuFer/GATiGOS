// CPU cost per pointer event of each toy handler at 4x CPU throttling
// (synthetic pointermove events; GSAP work is scheduled on the ticker).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const cdp = await p.context().newCDPSession(p);
  await p.goto('http://localhost:4173/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const measure = (selector, n = 60) => p.evaluate(({ selector, n }) => {
    const el = document.querySelector(selector);
    const r = el.getBoundingClientRect();
    const t = performance.now();
    for (let i = 0; i < n; i++) {
      el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + r.width * (0.3 + (i % 10) * 0.04), clientY: r.top + r.height * 0.5 }));
    }
    return (performance.now() - t) / n;
  }, { selector, n });
  const frame = () => p.evaluate(() => new Promise((res) => { const t = []; let last = performance.now(); let i = 0; const f = () => { const now = performance.now(); t.push(now - last); last = now; if (++i < 30) requestAnimationFrame(f); else res(t.slice(3).sort((a, b) => a - b)[13]); }; requestAnimationFrame(f); }));
  const rows = [
    ['Sol (sala gato)', '.room--cat'],
    ['Palabras (manifiesto)', '[data-manifesto-panel]'],
    ['Tilt tarjetas', '.selection .product-card .product-media'],
  ];
  for (const [label, sel] of rows) {
    await p.evaluate((s) => document.querySelector(s).scrollIntoView(), sel);
    await p.waitForTimeout(600);
    const perEvent = await measure(sel);
    const median = await frame();
    console.log(`${label}: ${perEvent.toFixed(2)} ms/evento a 4x | frame mediano sin GPU ${median.toFixed(1)} ms`);
  }
  await b.close();
})();
