// N44 probe (order 1.29, lane overlays and toasts): hovering a stack of three
// toasts for 1.5s at 4x CPU throttle. Reports the longest frame (rAF to rAF),
// the long tasks, and how often writeStack forces a layout (offsetHeight
// reads). Run with the gallery on port 5183:
//   node docs/reports/fixes/interactions-3/overlays-toasts.n44-hover-perf.mjs [out.json]
// Exit code 1 when a frame passes 50ms in any style.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.GALLERY ?? 'http://localhost:5183';
const OUT = process.argv[2];
const styles = ['neutral', 'studio', 'desk', 'liquid'];
const browser = await chromium.launch();
const result = {};
let failed = 0;
for (const style of styles) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/interactions?focus=toast-expand&style=${style}&scheme=light&chrome=0`);
  await page.click('[data-interaction-trigger]');
  await page.waitForTimeout(1200);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    const w = window;
    w.__frames = [];
    w.__long = [];
    w.__reads = 0;
    const get = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight').get;
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        if (this.getAttribute('data-ds') === 'toast') w.__reads += 1;
        return get.call(this);
      },
    });
    new PerformanceObserver((list) => list.getEntries().forEach((e) => w.__long.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: false });
    let last = performance.now();
    const tick = (t) => {
      w.__frames.push(t - last);
      last = t;
      if (w.__frames.length < 2000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('[data-ds="toast"][data-state="open"]')].find((e) => e.style.getPropertyValue('--_toast-index') === '0');
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height };
  });
  // Rest on the front toast, then move over the list for 1.5s.
  await page.mouse.move(box.x, box.y);
  const start = Date.now();
  let i = 0;
  while (Date.now() - start < 1500) {
    await page.mouse.move(box.x + ((i % 10) - 5) * 4, box.y - (i % 3) * box.h * 0.6, { steps: 2 });
    i++;
  }
  const out = await page.evaluate(() => {
    const w = window;
    const frames = w.__frames.slice(2);
    return { maxFrame: Math.round(Math.max(...frames)), frames: frames.length, longTasks: w.__long.length, longTaskMs: w.__long.reduce((a, b) => a + b, 0), stackReads: w.__reads };
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  out.pass = out.maxFrame < 50;
  if (!out.pass) failed++;
  result[style] = out;
  await page.close();
}
await browser.close();
if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n');
for (const [k, v] of Object.entries(result)) console.log(k, v.pass ? 'pass' : 'FAIL', JSON.stringify(v));
process.exit(failed ? 1 : 0);
