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
// The marks are taken once the pointer is down, and some controls answer on
// pointer down: each row starts two steps before its mark.
const LEAD_MS = 2 * FRAME_STEP_MS;
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
    for (let i = 0; i < n; i++) {
      const el = all.nth(i);
      if (!(await el.isVisible())) continue;
      // A control already on (a checked radio, a selected tab) shows no change
      // when pressed: drive the next one of its role that is off.
      const on = await el.evaluate((e) => e.getAttribute('aria-checked') === 'true' || e.getAttribute('aria-selected') === 'true');
      if (on) {
        const role = await el.getAttribute('role');
        const off = page.locator(`[data-interaction-stage] [role='${role}']:not([aria-checked='true']):not([aria-selected='true'])`);
        if (await off.count()) return off.first();
      }
      return el;
    }
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
    // Hover: sweep across up to four items of the stage (a hover that follows
    // the pointer shows), then rest on the control.
    const items = page.locator("[data-interaction-stage] :is(button, a[href], [role='option'], [role='menuitem'], [role='tab'], [role='radio'], [role='switch'], li, input)");
    const n = Math.min(4, await items.count());
    marks.push(Date.now() - t0);
    for (let i = 0; i < n; i++) {
      const c = (await items.nth(i).isVisible()) ? await centre(items.nth(i)) : null;
      if (c && c.y < SIZE.height && c.x < SIZE.width) {
        await page.mouse.move(c.x, c.y, { steps: 10 });
        await wait(page, 260);
      }
    }
    await page.mouse.move(at.x, at.y, { steps: 12 });
    await wait(page, 500);
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

// The video clock runs about 600ms behind the logged marks (the recording
// starts on the first frame after the page loads, and the marks count from
// before), so a row is not placed by its mark alone. It reads small gray
// frames from 900ms before the mark to 300ms after, finds the strongest
// change between two frames, and starts one step before the first frame that
// reaches 30% of it: the start of the answer to the press. No change found:
// the row starts LEAD_MS before the mark.
const SCAN = { w: 96, h: 54, fps: 50, beforeMs: 900, afterMs: 300 };
function changeAt(file, m) {
  const from = Math.max(0, m - SCAN.beforeMs);
  let raw;
  try {
    raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', (from / 1000).toFixed(3), '-t', ((m - from + SCAN.afterMs) / 1000).toFixed(3), '-i', file, '-vf', `fps=${SCAN.fps},scale=${SCAN.w}:${SCAN.h},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 64 << 20 });
  } catch {
    return Math.max(0, m - LEAD_MS);
  }
  const size = SCAN.w * SCAN.h;
  const n = Math.floor(raw.length / size);
  const moved = [0];
  for (let i = 1; i < n; i++) {
    let c = 0;
    for (let j = 0; j < size; j++) if (Math.abs(raw[i * size + j] - raw[(i - 1) * size + j]) > 24) c++;
    moved.push(c);
  }
  const peak = Math.max(...moved);
  if (peak < 2) return Math.max(0, m - LEAD_MS);
  const first = moved.findIndex((c) => c >= Math.max(2, peak * 0.3));
  return from + Math.max(0, first * (1000 / SCAN.fps) - FRAME_STEP_MS);
}

function sheet(rec) {
  const dir = path.join(TMP, style, 'frames', rec.id);
  fs.mkdirSync(dir, { recursive: true });
  // One row per mark: the hover, the first press, the second press, the keyboard.
  const marks = rec.marks.slice(0, 4);
  const rows = [];
  marks.forEach((m, r) => {
    const start = changeAt(rec.file, m);
    for (let k = 0; k < FRAMES; k++) {
      const t = (start + k * FRAME_STEP_MS) / 1000;
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
  // Sheets only: rebuild the sheets of a finished run from its log
  // (SHEETS_FROM=<log of this script>), with the clips still in RECORD_TMP.
  // With STITCH=1 it also stitches the family clips again from those clips;
  // a family argument (comma separated) limits both.
  if (process.env.SHEETS_FROM) {
    const recs = [];
    for (const line of fs.readFileSync(process.env.SHEETS_FROM, 'utf8').split('\n')) {
      if (!line.startsWith('{"id"')) continue;
      const rec = JSON.parse(line);
      if (onlyFamily && !onlyFamily.split(',').includes(rec.family)) continue;
      rec.file = path.join(TMP, style, 'raw', `${rec.id}.webm`);
      if (!fs.existsSync(rec.file)) continue;
      sheet(rec);
      recs.push(rec);
    }
    if (process.env.STITCH) {
      for (const f of [...new Set(recs.map((r) => r.family))]) {
        const out = stitch(f, recs.filter((r) => r.family === f));
        console.log(JSON.stringify({ family: f, out, bytes: fs.statSync(out).size }));
      }
    }
    return;
  }
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
