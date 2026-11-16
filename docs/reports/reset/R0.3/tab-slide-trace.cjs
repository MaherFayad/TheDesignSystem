// Long task probe for order R0.3 (tab-slide, ToggleGroup, React).
//
// Method: Playwright Chromium with the Pixel 7 device profile (412 by 915,
// touch, mobile, device scale 2.625), 4x CPU slowdown through CDP
// (Emulation.setCPUThrottlingRate), a Chromium trace over the whole run.
// Twenty taps (touchscreen.tap) cycle across the segments, 700ms apart, so
// each slide settles before the next tap. For each tap the probe takes the
// main thread RunTask events that start in the 600ms after the tap, and
// keeps the longest one: that is the tap's long task. The table reports
// median, max and the number over 50ms and over 100ms.
//
// Fixtures:
//   group: /c/toggle-group?case=one, the single choice ToggleGroup alone,
//          taps on its three items in turn.
//   stage: /interactions?focus=tab-slide, the tab-slide stage (two Tabs
//          lists, a SegmentedControl and a ToggleGroup), taps on the
//          ToggleGroup items in turn.
//
//   node tab-slide-trace.cjs <base url> <out.json> <label> [style ...]
const { chromium, devices } = require('playwright');
const fs = require('fs');

const [base, out, label, ...styleArgs] = process.argv.slice(2);
const styles = styleArgs.length ? styleArgs : ['neutral', 'liquid'];
const TAPS = 20;
const GAP = 700;
const WINDOW = 600;

const fixtures = {
  group: { path: '/c/toggle-group', query: 'case=one', items: '[data-demo-case="one"] [data-ds="toggle-group"] > [data-part="item"]' },
  stage: { path: '/interactions', query: 'focus=tab-slide', items: '[data-interaction-stage] [data-ds="toggle-group"] > [data-part="item"]' },
};

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function run(browser, style, name) {
  const fx = fixtures[name];
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  await page.goto(`${base}${fx.path}?${fx.query}&style=${style}&scheme=light&chrome=0`, { waitUntil: 'networkidle' });
  await page.waitForSelector(fx.items);
  await page.waitForTimeout(1000);
  const items = page.locator(fx.items);
  const count = await items.count();
  const boxes = [];
  for (let i = 0; i < count; i++) boxes.push(await items.nth(i).boundingBox());
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const events = [];
  cdp.on('Tracing.dataCollected', (e) => events.push(...e.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', {
    traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink.user_timing'] },
    transferMode: 'ReportEvents',
  });
  const marks = [];
  let landed = 0;
  // Start on the item after the one that is on, so every tap changes the value.
  const start = await items.evaluateAll((els) => Math.max(0, els.findIndex((el) => el.getAttribute('data-state') === 'on')));
  for (let t = 0; t < TAPS; t++) {
    const i = (start + 1 + t) % count;
    const b = boxes[i];
    await page.evaluate((n) => performance.mark(`tap-${n}`), t);
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(GAP);
    // The pill lands on the pressed item: it is the one that is on, and the pill span inside it is drawn.
    const ok = await items.nth(i).evaluate((el) => {
      const pill = el.querySelector(':scope > span[aria-hidden="true"]:not([data-part])');
      if (el.getAttribute('data-state') !== 'on' || !pill) return false;
      const a = el.getBoundingClientRect();
      const p = pill.getBoundingClientRect();
      const running = pill.getAnimations().some((x) => x.playState === 'running');
      return !running && p.width > 0 && Math.abs(p.left + p.width / 2 - (a.left + a.width / 2)) < 2;
    });
    if (ok) landed++;
    marks.push(t);
  }
  await cdp.send('Tracing.end');
  await done;
  const mainTid = (events.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain') || {}).tid;
  const mainPid = (events.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain') || {}).pid;
  const tasks = events.filter((e) => e.name === 'RunTask' && e.ph === 'X' && e.tid === mainTid && e.pid === mainPid);
  const tapTs = marks.map((t) => {
    const m = events.find((e) => e.name === `tap-${t}` && e.pid === mainPid);
    return m ? m.ts : null;
  });
  const perTap = tapTs.map((ts) => {
    if (ts === null) return null;
    const inWin = tasks.filter((e) => e.ts >= ts && e.ts < ts + WINDOW * 1000);
    return Math.round(Math.max(0, ...inWin.map((e) => e.dur)) / 100) / 10;
  }).filter((x) => x !== null);
  await ctx.close();
  return {
    style,
    fixture: name,
    taps: perTap.length,
    landed,
    medianMs: median(perTap),
    maxMs: Math.max(...perTap),
    over50: perTap.filter((x) => x > 50).length,
    over100: perTap.filter((x) => x > 100).length,
    perTapMs: perTap,
  };
}

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  for (const style of styles) {
    for (const name of Object.keys(fixtures)) {
      const row = await run(browser, style, name);
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  }
  await browser.close();
  fs.writeFileSync(
    out,
    JSON.stringify(
      { label, device: 'Pixel 7 (412x915, touch, mobile, dpr 2.625)', cpuThrottle: 4, taps: TAPS, gapMs: GAP, windowMs: WINDOW, build: base, rows },
      null,
      2,
    ),
  );
})();
