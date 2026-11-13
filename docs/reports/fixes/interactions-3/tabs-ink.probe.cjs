// Tabs ink probe for order 1.29 (review B1 and B2), on the tab-slide stage.
//
// B1: the soft Tabs pill slides from General to Members. The pill then lives
// in the later trigger, so before the fix it painted over the label it
// leaves. Every animation is paused at t ms of the slide; the box of the
// leaving label is shot twice, as drawn and with the label and its ink twin
// hidden. The pixels the text changes are the text; the contrast of each
// against the pixel under it (WCAG relative luminance) is taken, and the
// median is the frame's contrast. A pill painted over the text leaves no
// text pixel: contrast 1. Every style, light and dark.
//
// B2: under forced colors (emulated), the SegmentedControl and the soft
// Tabs slide: no ink twin may be drawn, and the selected label ("Week",
// "Members") keeps its contrast on every frame.
//
//   node tabs-ink.probe.cjs --out <file.json> [--base <url>]
// B1 passes when no frame falls under the lower of the label's two rests
// (active before, inactive after) less 10 percent (antialiasing and a translucent pill shift the edge pixels). B2 passes when no twin is
// drawn and the selected labels stay at 4.5:1 or more. Exit code 1 otherwise.
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = { out: 'tabs-ink.json', base: 'http://127.0.0.1:5182' };
for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];
const TIMES = [0, 20, 40, 60, 80, 100, 120, 160, 200, 260, 320, 400];

const lum = (r, g, b) => {
  const c = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};

/** Median contrast of the pixels that differ between `withText` and `without`. */
function textContrast(withText, without) {
  const a = PNG.sync.read(withText);
  const b = PNG.sync.read(without);
  const ratios = [];
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d < 24) continue;
    const la = lum(a.data[i], a.data[i + 1], a.data[i + 2]);
    const lb = lum(b.data[i], b.data[i + 1], b.data[i + 2]);
    ratios.push((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05));
  }
  if (!ratios.length) return { contrast: 1, textPixels: 0 };
  ratios.sort((x, y) => x - y);
  // The upper half of the text pixels: the glyph cores, not their antialiased edges.
  return { contrast: Math.round(ratios[Math.floor(ratios.length * 0.75)] * 100) / 100, textPixels: ratios.length };
}

/** Pauses every animation of the page at `t` ms (clamped to each one's end). */
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

/** Shoots the box of `labelSel`'s element as drawn and with it (and every ink twin in its trigger) hidden. */
async function measure(page, mark) {
  const box = await page.evaluate((mark) => {
    const el = document.querySelector(`[data-probe='${mark}']`);
    const r = el.getBoundingClientRect();
    return { x: Math.floor(r.x) - 1, y: Math.floor(r.y) - 1, width: Math.ceil(r.width) + 2, height: Math.ceil(r.height) + 2 };
  }, mark);
  const withText = await page.screenshot({ clip: box, animations: 'allow' });
  await page.evaluate((mark) => {
    const el = document.querySelector(`[data-probe='${mark}']`);
    el.style.visibility = 'hidden';
    for (const t of el.parentElement.querySelectorAll("[data-part='label-ink']")) t.style.visibility = 'hidden';
  }, mark);
  const without = await page.screenshot({ clip: box, animations: 'allow' });
  await page.evaluate((mark) => {
    const el = document.querySelector(`[data-probe='${mark}']`);
    el.style.visibility = '';
    for (const t of el.parentElement.querySelectorAll("[data-part='label-ink']")) t.style.visibility = '';
  }, mark);
  return textContrast(withText, without);
}

async function open(browser, style, scheme, forced) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, forcedColors: forced ? 'active' : 'none' });
  const page = await ctx.newPage();
  await page.goto(`${opt.base}/interactions?focus=tab-slide&style=${style}&scheme=${scheme}&chrome=0&zoom=1`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-interaction-stage]');
  await page.waitForTimeout(500);
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch();
  const out = { base: opt.base, times: TIMES, b1: [], b2: [] };
  let failed = false;

  // B1: the leaving label of the soft Tabs, General, while the pill slides to Members.
  for (const style of ['desk', 'liquid', 'neutral', 'studio']) {
    for (const scheme of ['light', 'dark']) {
      const { ctx, page } = await open(browser, style, scheme, false);
      await page.evaluate(() => {
        const list = document.querySelector("[data-ds='tabs'][data-emphasis='soft'] > [data-part='list']");
        const general = [...list.querySelectorAll("[data-part='trigger']")].find((t) => t.textContent.trim() === 'General');
        general.querySelector(":scope > [data-part='label']").setAttribute('data-probe', 'leaving');
      });
      const rest = await measure(page, 'leaving');
      await page.click('[data-interaction-trigger]');
      const frames = [];
      for (const t of TIMES) {
        await seek(page, t);
        frames.push({ t, ...(await measure(page, 'leaving')) });
      }
      // The rest after the slide: General inactive. The label crosses from one rest to the other and never dips under both.
      await page.evaluate(() => {
        for (const a of document.getAnimations()) a.play();
      });
      await page.waitForTimeout(1000);
      const after = await measure(page, 'leaving');
      const floor = Math.min(rest.contrast, after.contrast) * 0.9;
      const min = Math.min(...frames.map((f) => f.contrast));
      const row = { style, scheme, label: 'General (leaving)', restBefore: rest.contrast, restAfter: after.contrast, min, pass: min >= floor, frames };
      if (!row.pass) failed = true;
      out.b1.push(row);
      console.log(`B1 ${style} ${scheme}: rest ${rest.contrast} then ${after.contrast}, min over the slide ${min}, ${row.pass ? 'pass' : 'FAIL'}`);
      await ctx.close();
    }
  }

  // B2: forced colors. The SegmentedControl goes from Day to Week, the soft Tabs from General to Members.
  for (const style of ['neutral', 'desk']) {
    const { ctx, page } = await open(browser, style, 'light', true);
    await page.evaluate(() => {
      const seg = document.querySelector("[data-ds='segmented-control']");
      const week = [...seg.querySelectorAll("[data-part='item']")].find((t) => t.textContent.trim() === 'Week');
      week.querySelector(":scope > [data-part='label']").setAttribute('data-probe', 'week');
      const list = document.querySelector("[data-ds='tabs'][data-emphasis='soft'] > [data-part='list']");
      const members = [...list.querySelectorAll("[data-part='trigger']")].find((t) => t.textContent.trim() === 'Members');
      members.querySelector(":scope > [data-part='label']").setAttribute('data-probe', 'members');
    });
    await page.click('[data-interaction-trigger]');
    const twins = await page.evaluate(() => document.querySelectorAll("[data-part='label-ink']").length);
    const frames = [];
    for (const t of TIMES) {
      await seek(page, t);
      frames.push({ t, week: (await measure(page, 'week')).contrast, members: (await measure(page, 'members')).contrast });
    }
    const min = Math.min(...frames.flatMap((f) => [f.week, f.members]));
    if (twins > 0 || min < 4.5) failed = true;
    out.b2.push({ style, forcedColors: 'active', twinsDrawn: twins, min, frames });
    console.log(`B2 ${style} forced colors: twins drawn ${twins}, min selected label contrast ${min}`);
    await ctx.close();
  }

  fs.writeFileSync(opt.out, JSON.stringify(out, null, 2) + '\n');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
