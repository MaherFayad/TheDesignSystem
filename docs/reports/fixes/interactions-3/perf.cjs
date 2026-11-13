// Performance probe for order 1.29 (B14), after the review's perf.cjs.
// For each interaction id: a phone viewport (390 by 844, touch), 4x CPU
// throttling through CDP, one trigger on
// /interactions?focus=<id>&style=<style>&chrome=0, then a Chromium trace of
// the trigger plus 1200ms. Writes, per id: the long tasks on the main thread
// (RunTask over 50ms, and the longtask observer as a cross check), the
// compositor frames of the window (one per frame sequence) by state, with
// presented and dropped counts, and the rAF gaps over two frames.
//
//   node perf.cjs --out <file.json> --style <studio|desk|neutral|liquid> [--base <url>] [--runs <n>] <id> [<id> ...]
//   node perf.cjs --out perf.after.liquid.json --style liquid tab-slide
//   node perf.cjs --out all.json --style neutral --ids button-press,switch-stretch,tab-slide
//
// With --runs n each id runs n times in a fresh context; the row keeps every
// run and the median of the largest long task. The machine load (1 minute
// average) is written next to the rows: runs at a load over 1 are noisy.
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');

const args = process.argv.slice(2);
const opt = { out: 'perf.json', style: 'neutral', base: 'http://127.0.0.1:5182', runs: '1', scheme: 'light' };
const ids = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const val = args[++i];
    if (key === 'ids') ids.push(...val.split(',').map((s) => s.trim()).filter(Boolean));
    else opt[key] = val;
  } else ids.push(a);
}
if (!ids.length) {
  console.error('usage: node perf.cjs --out <file> --style <style> <id> [<id> ...]');
  process.exit(1);
}

// Triggers that are not one press of the stage's first trigger (the review's set).
const ACTION = {
  'switch-drag': async (page) => {
    const b = await page.locator('[data-interaction-trigger]').first().boundingBox();
    const y = b.y + b.height / 2;
    await page.mouse.move(b.x + 6, y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(b.x + 6 + ((b.width - 12) * i) / 12, y);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
  },
  'toast-stack': async (page) => {
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-interaction-trigger]').first().click();
      await page.waitForTimeout(120);
    }
  },
  'toast-expand': async (page) => {
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-interaction-trigger]').first().click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(500);
    const t = page.locator('[data-ds="toast"]').first();
    if (await t.count()) await t.hover();
  },
  'focus-glow': async (page) => {
    await page.locator('[data-interaction-trigger]').first().focus();
  },
};

async function runOnce(browser, id) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${opt.base}/interactions?focus=${id}&style=${opt.style}&scheme=${opt.scheme}&chrome=0`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-interaction-stage]');
  await page.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    window.__lt = [];
    window.__gaps = [];
    let last = performance.now();
    window.__run = true;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration));
    }).observe({ type: 'longtask' });
    const tick = (t) => {
      window.__gaps.push(t - last);
      last = t;
      if (window.__run) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const events = [];
  cdp.on('Tracing.dataCollected', (e) => events.push(...e.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', {
    traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'benchmark', 'cc', 'viz'] },
    transferMode: 'ReportEvents',
  });
  let animProps = [];
  try {
    if (ACTION[id]) await ACTION[id](page);
    else await page.locator('[data-interaction-trigger]').first().click({ timeout: 5000 });
    animProps = await page.evaluate(() =>
      [
        ...new Set(
          document.getAnimations().flatMap((a) => {
            try {
              return a.transitionProperty ? [a.transitionProperty] : a.effect.getKeyframes().flatMap((k) => Object.keys(k));
            } catch {
              return [];
            }
          }),
        ),
      ].filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)),
    );
  } catch (e) {
    animProps = ['action failed: ' + e.message.split('\n')[0]];
  }
  await page.waitForTimeout(1200);
  await cdp.send('Tracing.end');
  await done;
  const res = await page.evaluate(() => {
    window.__run = false;
    return { lt: window.__lt, gaps: window.__gaps };
  });
  const frames = events.filter((e) => e.name === 'PipelineReporter' && e.ph === 'b');
  // One record per frame sequence (a FORKED twin shares the sequence).
  const bySeq = new Map();
  for (const f of frames) {
    const r = f.args?.frame_reporter;
    if (r && !bySeq.has(r.frame_sequence)) bySeq.set(r.frame_sequence, r);
  }
  const states = {};
  for (const r of bySeq.values()) states[r.state] = (states[r.state] || 0) + 1;
  const dropped = (states.STATE_DROPPED || 0) + (states.STATE_PRESENTED_PARTIAL || 0);
  const presented = states.STATE_PRESENTED_ALL || 0;
  const mainTid = (events.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain') || {}).tid;
  const longTasksMain = events.filter((e) => e.name === 'RunTask' && e.ph === 'X' && e.tid === mainTid && e.dur > 50000).map((e) => Math.round(e.dur / 1000));
  const gaps = res.gaps.slice(1);
  await ctx.close();
  return {
    animProps,
    frames: bySeq.size,
    presented,
    dropped,
    frameStates: states,
    longTasksMain,
    longTaskObserver: res.lt,
    rafFrames: gaps.length,
    rafOver33ms: gaps.filter((g) => g > 33.4).length,
    rafMaxMs: Math.round(Math.max(0, ...gaps)),
  };
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  const load = [os.loadavg()[0]];
  for (const id of ids) {
    const runs = [];
    for (let n = 0; n < Number(opt.runs); n++) runs.push(await runOnce(browser, id));
    load.push(os.loadavg()[0]);
    const row = {
      id,
      style: opt.style,
      presented: median(runs.map((r) => r.presented)),
      dropped: median(runs.map((r) => r.dropped)),
      largestLongTaskMs: median(runs.map((r) => Math.max(0, ...r.longTasksMain))),
      runs,
    };
    rows.push(row);
    console.log(JSON.stringify({ id, style: opt.style, presented: row.presented, dropped: row.dropped, largestLongTaskMs: row.largestLongTaskMs, longTasks: runs.map((r) => r.longTasksMain) }));
  }
  fs.writeFileSync(
    opt.out,
    JSON.stringify(
      { viewport: '390x844 touch', cpuThrottle: 4, window: 'trigger plus 1200ms', base: opt.base, style: opt.style, loadAvg1m: load.map((l) => Math.round(l * 100) / 100), rows },
      null,
      2,
    ) + '\n',
  );
  await browser.close();
})();
