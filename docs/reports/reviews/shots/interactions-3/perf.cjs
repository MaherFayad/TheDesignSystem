// Performance probe for the ds-qa review of order 1.23. For each interaction
// that animates filter, backdrop-filter, clip-path or box-shadow: a phone
// viewport (390 by 844, touch), 4x CPU throttling through CDP, one trigger,
// then a Chromium trace. Counts frames from the trace (PipelineReporter
// frames and their state), dropped frames, long tasks (over 50ms on the
// main thread), and rAF gaps over 2 frames as a cross check.
//   node perf.cjs <out.json> <style> <id> [<id> ...]
const { chromium } = require('playwright');
const fs = require('fs');
const [out, style, ...ids] = process.argv.slice(2);
const base = 'http://127.0.0.1:5191';
const ACTION = {
  'switch-drag': async (page) => {
    const b = await page.locator('[data-interaction-trigger]').first().boundingBox();
    const y = b.y + b.height / 2;
    await page.mouse.move(b.x + 6, y); await page.mouse.down();
    for (let i = 1; i <= 12; i++) { await page.mouse.move(b.x + 6 + (b.width - 12) * i / 12, y); await page.waitForTimeout(16); }
    await page.mouse.up();
  },
  'toast-stack': async (page) => { for (let i = 0; i < 3; i++) { await page.locator('[data-interaction-trigger]').first().click(); await page.waitForTimeout(120); } },
  'toast-expand': async (page) => {
    for (let i = 0; i < 3; i++) { await page.locator('[data-interaction-trigger]').first().click(); await page.waitForTimeout(150); }
    await page.waitForTimeout(500);
    const t = page.locator('[data-ds="toast"]').first();
    if (await t.count()) await t.hover();
  },
  'focus-glow': async (page) => { await page.locator('[data-interaction-trigger]').first().focus(); },
};
(async () => {
  const browser = await chromium.launch();
  const rows = [];
  for (const id of ids) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`${base}/interactions?focus=${id}&style=${style}&scheme=light&chrome=0`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-interaction-stage]');
    await page.waitForTimeout(800);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.evaluate(() => {
      window.__lt = []; window.__gaps = []; let last = performance.now(); window.__run = true;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({ type: 'longtask' });
      const tick = (t) => { window.__gaps.push(t - last); last = t; if (window.__run) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    const events = [];
    cdp.on('Tracing.dataCollected', (e) => events.push(...e.value));
    const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'benchmark', 'cc', 'viz'] }, transferMode: 'ReportEvents' });
    let animProps = [];
    try {
      if (ACTION[id]) await ACTION[id](page);
      else await page.locator('[data-interaction-trigger]').first().click({ timeout: 5000 });
      animProps = await page.evaluate(() => [...new Set(document.getAnimations().flatMap((a) => { try { return a.transitionProperty ? [a.transitionProperty] : a.effect.getKeyframes().flatMap((k) => Object.keys(k)); } catch { return []; } }))].filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)));
    } catch (e) { animProps = ['action failed: ' + e.message.split('\n')[0]]; }
    await page.waitForTimeout(1200);
    await cdp.send('Tracing.end');
    await done;
    const res = await page.evaluate(() => { window.__run = false; return { lt: window.__lt, gaps: window.__gaps }; });
    const frames = events.filter((e) => e.name === 'PipelineReporter' && e.ph === 'b');
    // One record per frame sequence (a FORKED twin shares the sequence).
    const bySeq = new Map();
    for (const f of frames) { const r = f.args?.frame_reporter; if (r && !bySeq.has(r.frame_sequence)) bySeq.set(r.frame_sequence, r); }
    const states = {};
    for (const r of bySeq.values()) states[r.state] = (states[r.state] || 0) + 1;
    const dropped = (states.STATE_DROPPED || 0) + (states.STATE_PRESENTED_PARTIAL || 0);
    const droppedSmooth = [...bySeq.values()].filter((r) => r.state === 'STATE_DROPPED' && r.affects_smoothness).length;
    const presented = states.STATE_PRESENTED_ALL || 0;
        const mainTid = (events.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain') || {}).tid;
    const mainLong = events.filter((e) => e.name === 'RunTask' && e.ph === 'X' && e.tid === mainTid && e.dur > 50000).map((e) => Math.round(e.dur / 1000));
    const gaps = res.gaps.slice(1);
    rows.push({ id, style, animProps, frames: bySeq.size, presented, frameStates: states, dropped, droppedSmooth, longTasksMain: mainLong, longTaskObserver: res.lt, rafFrames: gaps.length, rafOver33ms: gaps.filter((g) => g > 33.4).length, rafMaxMs: Math.round(Math.max(0, ...gaps)) });
    console.log(JSON.stringify(rows[rows.length - 1]));
    await ctx.close();
  }
  fs.writeFileSync(out, JSON.stringify({ viewport: '390x844 touch', cpuThrottle: 4, window: 'trigger plus 1200ms', rows }, null, 2));
  await browser.close();
})();
