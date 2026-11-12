// Recorder for order 1.22 (interaction round 2). For each interaction of the
// registry it opens `/interactions?focus=<id>` (the stage only mode: one
// stage, centred and drawn large, with a pointer dot), records a short clip
// at 960 by 540 with real pointer moves, two presses and the keyboard path,
// and writes a contact sheet of eight frames 60ms apart after each press.
// Then it stitches the clips of each family and style into one clip under
// 8 MB with ffmpeg.
//
//   node docs/reports/shots/interactions-2/record.cjs <base url> <style> <scheme> [family] [id,id]
//
// Clips and frames go to a scratch folder (RECORD_TMP, default a folder in
// the OS temp dir); the stitched clips and the sheets go next to this file:
// <family>.<style>.webm and sheets/<id>.<style>.png.
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const [base = 'http://localhost:5190', style = 'neutral', scheme = 'light', onlyFamily = '', onlyIds = ''] = process.argv.slice(2);
const OUT = __dirname;
const TMP = process.env.RECORD_TMP || path.join(os.tmpdir(), 'ds-record');
const SIZE = { width: 960, height: 540 };
const FRAME_STEP_MS = 60;
const FRAMES = 8;
const wait = (p, ms) => p.waitForTimeout(ms);

async function listInteractions(browser) {
  const page = await browser.newPage();
  await page.goto(`${base}/interactions?style=${style}&scheme=${scheme}&chrome=0`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-interaction]', { timeout: 60000 });
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll("[data-gallery='interactions-family']")].flatMap((sec) => {
      const family = (sec.getAttribute('aria-labelledby') || '').replace(/^family-/, '');
      return [...sec.querySelectorAll('[data-interaction]')].map((a) => ({ family, id: a.getAttribute('data-interaction'), staged: !!a.querySelector('[data-interaction-replay]') }));
    }),
  );
  await page.close();
  return rows.filter((r) => r.staged);
}

/** The control the clip drives: the stage's trigger, else its first interactive element. */
async function target(page) {
  const sel = [
    '[data-interaction-stage] [data-interaction-trigger]',
    "[data-interaction-stage] :is(button, [role='switch'], [role='slider'], [role='tab'], [role='radio'], [role='checkbox'], input, textarea, a[href], [tabindex='0'])",
  ];
  for (const s of sel) {
    const all = page.locator(s);
    const n = await all.count();
    for (let i = 0; i < n; i++) if (await all.nth(i).isVisible()) return all.nth(i);
  }
  return null;
}

async function centre(loc) {
  const b = await loc.boundingBox();
  return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
}

async function press(page, at, marks, t0) {
  await page.mouse.move(at.x, at.y, { steps: 6 });
  await page.mouse.down();
  marks.push(Date.now() - t0);
  await wait(page, 120);
  await page.mouse.up();
  await wait(page, 1000);
}

async function recordOne(browser, row) {
  const dir = path.join(TMP, style, 'raw');
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1, recordVideo: { dir, size: SIZE } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const marks = [];
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${base}/interactions?focus=${row.id}&style=${style}&scheme=${scheme}&chrome=0`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-interaction-stage]', { timeout: 60000 }).catch(() => {});
  await page.mouse.move(60, SIZE.height - 60);
  await wait(page, 500);
  const loc = await target(page);
  const at = loc ? await centre(loc) : null;
  if (at) {
    // Approach, hover, press twice (out and back), then the keyboard path.
    await page.mouse.move(at.x, at.y, { steps: 20 });
    marks.push(Date.now() - t0);
    await wait(page, 600);
    await press(page, at, marks, t0);
    // A press may have opened an overlay that now covers the control: let Escape close it first.
    await page.keyboard.press('Escape');
    await wait(page, 300);
    await press(page, at, marks, t0);
    await page.keyboard.press('Escape');
    await wait(page, 300);
    const info = await loc.evaluate((el) => ({ tag: el.tagName, role: el.getAttribute('role'), type: el.getAttribute('type') })).catch(() => null);
    await loc.focus().catch(() => {});
    if (info && (info.tag === 'INPUT' || info.tag === 'TEXTAREA') && !['checkbox', 'radio', 'range'].includes(info.type || '')) {
      marks.push(Date.now() - t0);
      await page.keyboard.type('42', { delay: 120 });
      await wait(page, 500);
      await page.keyboard.press('ArrowUp');
      await wait(page, 600);
    } else if (info && ['slider', 'tab', 'radio'].includes(info.role || '')) {
      marks.push(Date.now() - t0);
      await page.keyboard.press('ArrowRight');
      await wait(page, 600);
      await page.keyboard.press('ArrowLeft');
      await wait(page, 600);
    } else if (info && info.tag !== 'A') {
      marks.push(Date.now() - t0);
      await page.keyboard.press('Space');
      await wait(page, 900);
      await page.keyboard.press('Escape');
      await wait(page, 300);
    }
    await page.mouse.move(60, SIZE.height - 60, { steps: 15 });
    await wait(page, 500);
  } else {
    await wait(page, 2000);
  }
  const video = page.video();
  await ctx.close();
  const file = path.join(dir, `${row.id}.webm`);
  fs.renameSync(await video.path(), file);
  return { ...row, file, marks, errs, found: Boolean(at) };
}

function sheet(rec) {
  const dir = path.join(TMP, style, 'frames', rec.id);
  fs.mkdirSync(dir, { recursive: true });
  // One row per mark after the hover: the first press, the second press, the keyboard.
  const marks = rec.marks.slice(1, 4);
  const rows = [];
  marks.forEach((m, r) => {
    for (let k = 0; k < FRAMES; k++) {
      const t = (m + k * FRAME_STEP_MS) / 1000;
      const f = path.join(dir, `${r}-${k}.png`);
      try {
        execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', t.toFixed(3), '-i', rec.file, '-frames:v', '1', '-vf', 'crop=iw*0.8:ih*0.8,scale=240:135', f]);
        rows.push(f);
      } catch {
        /* past the end */
      }
    }
  });
  if (!rows.length) return null;
  const outDir = path.join(OUT, 'sheets');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${rec.id}.${style}.png`);
  const n = rows.length;
  const layout = rows.map((_, i) => `${(i % FRAMES) * 240}_${Math.floor(i / FRAMES) * 135}`).join('|');
  const args = ['-v', 'error', '-y'];
  for (const f of rows) args.push('-i', f);
  args.push('-filter_complex', `${rows.map((_, i) => `[${i}:v]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=black`, '-frames:v', '1', out);
  if (n === 1) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', rows[0], out]);
  else execFileSync('ffmpeg', args);
  return out;
}

function stitch(family, recs) {
  const list = path.join(TMP, style, `${family}.txt`);
  fs.writeFileSync(list, recs.map((r) => `file '${r.file}'`).join('\n') + '\n');
  const joined = path.join(TMP, style, `${family}.joined.webm`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined]);
  const seconds = recs.length * 9;
  // Stay under 8 MB: about 7.2 MB over the clip.
  const kbps = Math.max(150, Math.min(700, Math.floor((7.2 * 8 * 1024) / seconds)));
  const out = path.join(OUT, `${family}.${style}.webm`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', joined, '-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-b:v', `${kbps}k`, '-maxrate', `${Math.floor(kbps * 1.2)}k`, '-bufsize', `${kbps * 2}k`, '-an', out]);
  return out;
}

(async () => {
  const browser = await chromium.launch();
  let rows = await listInteractions(browser);
  if (onlyFamily) rows = rows.filter((r) => r.family === onlyFamily);
  if (onlyIds) rows = rows.filter((r) => onlyIds.split(',').includes(r.id));
  const recs = [];
  for (const row of rows) {
    const rec = await recordOne(browser, row);
    rec.sheet = sheet(rec);
    recs.push(rec);
    console.log(JSON.stringify({ id: rec.id, family: rec.family, found: rec.found, marks: rec.marks, errs: rec.errs.slice(0, 2) }));
  }
  await browser.close();
  if (!onlyIds) {
    const families = [...new Set(recs.map((r) => r.family))];
    for (const f of families) {
      const out = stitch(f, recs.filter((r) => r.family === f));
      console.log(JSON.stringify({ family: f, out, bytes: fs.statSync(out).size }));
    }
  }
})();
