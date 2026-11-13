// copy-swap probe for order 1.29 (review N4, ten weakest #10). On the
// copy-swap stage, the first CopyButton with a label is pressed; every
// animation and transition is paused at t ms. At each t:
// - border: the pixels any word paints on the button's top border row (the
//   row shot with the words shown and hidden); must be 0.
// - leaving, arriving: the pixels each word paints inside the button (one
//   word hidden at a time, against both hidden).
// A frame overlaps when both words paint more than 10% of their peak. The
// probe reports the overlap span in ms. Timers over 500ms are dropped on
// the page, so the button holds its result while the frames are shot.
//
//   node copy-swap.probe.cjs --out <file.json> [--base <url>]
// Exit code 1 when a word paints on the border.
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = { out: 'copy-swap.json', base: 'http://127.0.0.1:5182' };
for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];
const TIMES = Array.from({ length: 19 }, (_, i) => i * 10);

/** Pixels that differ; with `rows`, only in the first rows of the image. */
const diff = (a, b, rows = Infinity) => {
  const x = PNG.sync.read(a);
  const y = PNG.sync.read(b);
  let n = 0;
  const end = Math.min(x.data.length, rows * x.width * 4);
  for (let i = 0; i < end; i += 4) {
    if (Math.abs(x.data[i] - y.data[i]) + Math.abs(x.data[i + 1] - y.data[i + 1]) + Math.abs(x.data[i + 2] - y.data[i + 2]) > 30) n += 1;
  }
  return n;
};

async function seek(page, t) {
  await page.evaluate((t) => {
    for (const a of document.getAnimations()) {
      a.pause();
      const end = Number(a.effect?.getComputedTiming().endTime ?? 0);
      a.currentTime = Math.min(t, Math.max(0, end));
    }
  }, t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** Shows only the words named (idle, copied, failed): the others get visibility hidden. */
const show = (page, which) =>
  page.evaluate((which) => {
    for (const w of document.querySelectorAll("[data-probe='copy'] [data-copy-label]")) w.style.visibility = which.includes(w.getAttribute('data-copy-label')) ? '' : 'hidden';
  }, which);

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  let failed = false;
  for (const [style, lang] of [['neutral', 'en'], ['desk', 'en'], ['liquid', 'en'], ['studio', 'en'], ['neutral', 'ar']]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    await page.goto(`${opt.base}/interactions?focus=copy-swap&style=${style}&scheme=light&chrome=0&zoom=1`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-interaction-stage]');
    await page.waitForTimeout(500);
    const boxes = await page.evaluate((lang) => {
      // The stage's Arabic button sits in a Theme with lang ar.
      const btn = [...document.querySelectorAll("[data-ds='copy-button']")].find((b) => b.querySelector(":scope > [data-part='label']") && (b.closest('[lang]')?.getAttribute('lang') === 'ar') === (lang === 'ar'));
      btn.setAttribute('data-probe', 'copy');
      const r = btn.getBoundingClientRect();
      const bw = Number.parseFloat(getComputedStyle(btn).borderTopWidth) || 1;
      return {
        border: { x: Math.round(r.x + 6), y: r.y, width: Math.round(r.width - 12), height: bw },
        inside: { x: r.x, y: r.y, width: r.width, height: r.height },
      };
    }, lang);
    // The probe takes seconds of real time per run: the button's hold (delay.feedback, a timer) would bring it back to idle
    // midway. Timers over 500ms are dropped on this page, so the button stays on its result while the frames are shot.
    await page.evaluate(() => {
      const st = window.setTimeout.bind(window);
      window.setTimeout = (fn, d, ...rest) => (Number(d) > 500 ? 0 : st(fn, d, ...rest));
    });
    await page.click("[data-probe='copy']");
    // The word the button lands on: copied, or failed where the clipboard refuses.
    const landed = await page.evaluate(() => document.querySelector("[data-probe='copy']").getAttribute('data-state'));
    const frames = [];
    for (const t of TIMES) {
      await seek(page, t);
      await show(page, ['idle', 'copied', 'failed']);
      const all = await page.screenshot({ clip: boxes.inside });
      const borderAll = await page.screenshot({ clip: boxes.border });
      await show(page, []);
      const none = await page.screenshot({ clip: boxes.inside });
      const borderNone = await page.screenshot({ clip: boxes.border });
      await show(page, ['idle']);
      const leaving = diff(await page.screenshot({ clip: boxes.inside }), none);
      await show(page, [landed]);
      const arriving = diff(await page.screenshot({ clip: boxes.inside }), none);
      await show(page, ['idle', 'copied', 'failed']);
      // The outer device row of the border (2x): an antialiased clip edge on its inner row is not a crossing.
      frames.push({ t, border: diff(borderAll, borderNone, 1), leaving, arriving, any: diff(all, none) });
    }
    const peakL = Math.max(...frames.map((f) => f.leaving));
    const peakA = Math.max(...frames.map((f) => f.arriving));
    const overlap = frames.filter((f) => f.leaving > peakL * 0.1 && f.arriving > peakA * 0.1).map((f) => f.t);
    const border = Math.max(...frames.map((f) => f.border));
    if (border > 0) failed = true;
    rows.push({ style, lang, landed, borderPixelsMax: border, overlapMs: overlap.length ? [overlap[0], overlap[overlap.length - 1]] : null, frames });
    console.log(`${style} ${lang} (${landed}): border pixels ${border}, overlap ${overlap.length ? `${overlap[0]} to ${overlap[overlap.length - 1]}ms` : 'none'}`);
    await ctx.close();
  }
  fs.writeFileSync(opt.out, JSON.stringify({ base: opt.base, times: TIMES, rows }, null, 2) + '\n');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
