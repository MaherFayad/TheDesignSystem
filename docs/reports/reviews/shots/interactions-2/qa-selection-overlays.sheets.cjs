// ds-qa review of order 1.22: one contact sheet per interaction of the
// selection and overlays families. Rows: Studio (dark), Desk (dark), Neutral
// (light), LTR. Columns: the motion paused and seeked to 0, 40, 80, 130,
// 180, 240, 320 and 440ms after the trigger (every animation seeked to that
// time from its own start). Writes <id>.sheet.png next to this script.
//   node qa-selection-overlays.sheets.cjs <tmpDir> [ids...]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const L = require('./qa-selection-overlays.lib.cjs');

const TIMES = [0, 40, 80, 130, 180, 240, 320, 440];
const STYLES = [['studio', 'dark'], ['desk', 'dark'], ['neutral', 'light']];
const OVERLAY = "[role=menu],[role=dialog],[role=alertdialog],[role=tooltip],[role=listbox],[data-ds='popover'],[data-ds='hover-card'],[data-ds='tour'],[data-ds='window'],[data-ds='command-palette']";

(async () => {
  const tmp = process.argv[2];
  const only = process.argv.slice(3);
  const ids = only.length ? only : Object.keys(L.scenarios);
  fs.mkdirSync(tmp, { recursive: true });
  const browser = await chromium.launch();
  for (const id of ids) {
    const sc = L.scenarios[id];
    const r = sc.runs[0];
    const frames = [];
    const clips = [];
    for (const [style, scheme] of STYLES) {
      const ctx = await L.newCtx(browser);
      const page = await ctx.newPage();
      page.__dir = 'ltr';
      await L.goto(page, { id, style, scheme, dir: 'ltr', motion: 'full' });
      if (r.prep) { await r.prep(page); await L.settle(page); }
      // Hold: a press is caught right after the release, a hover after the tooltip delay.
      await r.act(page);
      await page.waitForFunction(() => document.getAnimations().some((a) => a.playState === 'running'), null, { timeout: 2500 }).catch(() => {});
      await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => res())));
      await page.evaluate(() => { window.__frozen = document.getAnimations(); window.__frozen.forEach((a) => a.pause()); });
      // The clip: the stage and any open overlay, at the end of the motion.
      const clip = await page.evaluate(({ OVERLAY }) => {
        window.__frozen.forEach((a) => { try { a.currentTime = 2000; } catch { /* */ } });
        const boxes = [document.querySelector('[data-interaction-stage]'), ...document.querySelectorAll(OVERLAY)].filter(Boolean).map((e) => e.getBoundingClientRect()).filter((b) => b.width > 0);
        const x0 = Math.max(0, Math.min(...boxes.map((b) => b.left)) - 24);
        const y0 = Math.max(0, Math.min(...boxes.map((b) => b.top)) - 24);
        const x1 = Math.min(innerWidth, Math.max(...boxes.map((b) => b.right)) + 24);
        const y1 = Math.min(innerHeight, Math.max(...boxes.map((b) => b.bottom)) + 24);
        return { x: Math.floor(x0), y: Math.floor(y0), width: Math.ceil(x1 - x0), height: Math.ceil(y1 - y0) };
      }, { OVERLAY });
      clips.push(clip);
      for (const t of TIMES) {
        await page.evaluate((t) => window.__frozen.forEach((a) => { try { a.currentTime = t; } catch { /* */ } }), t);
        const f = path.join(tmp, `${id}_${String(frames.length).padStart(2, '0')}.png`);
        await page.screenshot({ path: f, clip });
        frames.push(f);
      }
      await ctx.close();
    }
    const W = 360;
    const ratio = Math.max(...clips.map((c) => c.height / c.width));
    const H = Math.max(60, Math.min(400, Math.round((W * ratio) / 2) * 2));
    const out = path.join(__dirname, `${id}.sheet.png`);
    // Bring every frame to one size first: the tile filter drops frames when the input size changes.
    for (const f of frames) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x808080`, f.replace(/\.png$/, '.s.png')]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(tmp, `${id}_%02d.s.png`), '-vf', 'tile=8x3:padding=4:margin=4:color=white', '-frames:v', '1', out]);
    frames.forEach((f) => fs.unlinkSync(f.replace(/\.png$/, '.s.png')));
    frames.forEach((f) => fs.unlinkSync(f));
    console.log(id, out, clips.map((c) => `${c.width}x${c.height}`).join(' '));
  }
  await browser.close();
})();
