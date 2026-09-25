// Main-thread cost per frame of the 3D hero (JS + WebGL command submission),
// with and without 4x CPU throttling. GPU time is not measurable here
// (software rendering), see PROGRESO.md.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [label, w, h, rate] of [['desktop', 1440, 900, 1], ['mobile 4x', 390, 844, 4]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const cdp = await p.context().newCDPSession(p);
    await p.goto('http://localhost:4173/index.html', { waitUntil: 'load' });
    await p.waitForSelector('.hero__canvas.is-ready', { timeout: 30000 });
    if (rate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const stats = await p.evaluate(() => new Promise((resolve) => {
      const scene = document.querySelector('[data-hero]').heroScene;
      const samples = [];
      const originalRender = scene.canvas && scene;
      // Wrap the ticker callback by timing consecutive rAF callbacks' script work.
      const times = [];
      const obs = new PerformanceObserver((list) => list.getEntries().forEach((e) => times.push(e.duration)));
      try { obs.observe({ type: 'long-animation-frame', buffered: false }); } catch {}
      let last = performance.now(); let n = 0;
      const tick = () => { const now = performance.now(); samples.push(now - last); last = now; if (++n < 90) requestAnimationFrame(tick); else { obs.disconnect(); resolve({ samples, loaf: times }); } };
      requestAnimationFrame(tick);
    }));
    const sorted = stats.samples.slice(5).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    console.log(label, '| median frame interval', median.toFixed(1), 'ms | long animation frames (>50ms):', stats.loaf.length);
    // Pointer interaction cost: CPU time of the dust update is inside the frame.
    const profile = await cdp.send('Performance.enable').then(() => cdp.send('Performance.getMetrics'));
    const m = Object.fromEntries(profile.metrics.map((x) => [x.name, x.value]));
    console.log('   ScriptDuration total', m.ScriptDuration.toFixed(2), 's over', m.TaskDuration.toFixed(2), 's tasks');
    await p.close();
  }
  await b.close();
})();
