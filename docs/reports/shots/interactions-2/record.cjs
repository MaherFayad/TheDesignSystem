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
// Fallback for a clip without the mark square: start two steps before the logged mark.
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

/** True when a control is already on: a checked radio, a selected tab, the current link. */
const isOn = (loc) =>
  loc.evaluate((e) => e.getAttribute('aria-checked') === 'true' || e.getAttribute('aria-selected') === 'true' || ['page', 'step', 'location', 'true'].includes(e.getAttribute('aria-current') || ''));

/**
 * The control the clip drives: the stage's trigger, else its first
 * interactive element. A control already on shows no change when pressed:
 * the first press goes to the next one of its kind that is off and the
 * second comes back (`home`), so both presses show the move.
 */
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
      if (await isOn(el)) {
        const role = await el.getAttribute('role');
        const kind = role ? `[role='${role}']` : await el.evaluate((e) => (e.tagName === 'A' ? 'a[href]' : e.tagName.toLowerCase()));
        const off = page.locator(`[data-interaction-stage] ${kind}:not([aria-checked='true']):not([aria-selected='true']):not([aria-current='page']):not([aria-current='step']):not([aria-current='location']):not([aria-current='true'])`);
        const m = await off.count();
        for (let j = 0; j < m; j++) if (await off.nth(j).isVisible()) return { loc: off.nth(j), home: el };
      }
      return { loc: el, home: null };
    }
  }
  return null;
}

async function centre(loc) {
  const b = await loc.boundingBox();
  return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
}

// Each beat flips a 4px square in the top left corner between black and
// white just before it starts, so the sheet finds the beat in the video
// itself: the video clock and the script's clock differ by up to about
// 600ms from clip to clip. The corner is outside the sheets' crop.
const MARK_ID = 'record-mark';
async function addMark(page) {
  await page.evaluate((id) => {
    const m = document.createElement('div');
    m.id = id;
    m.setAttribute('aria-hidden', 'true');
    Object.assign(m.style, { position: 'fixed', left: '0', top: '0', width: '4px', height: '4px', background: '#000', zIndex: '2147483647', pointerEvents: 'none' });
    document.body.append(m);
  }, MARK_ID);
}
async function mark(page, marks, t0) {
  await page.evaluate((id) => {
    const m = document.getElementById(id);
    if (m) m.style.background = m.style.background === 'rgb(0, 0, 0)' ? '#fff' : '#000';
  }, MARK_ID);
  // Two frames, so the flip is painted before the beat starts.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  marks.push(Date.now() - t0);
}

async function press(page, at, marks, t0) {
  await page.mouse.move(at.x, at.y, { steps: 6 });
  await mark(page, marks, t0);
  await page.mouse.down();
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
  await addMark(page);
  await page.mouse.move(60, SIZE.height - 60);
  await wait(page, 500);
  const t = await target(page);
  const loc = t?.loc ?? null;
  const at = loc ? await centre(loc) : null;
  const back = t?.home ? await centre(t.home) : null;
  if (at) {
    // Approach, hover, press twice (out and back), then the keyboard path.
    // Hover: sweep across up to four items of the stage (a hover that follows
    // the pointer shows), then rest on the control.
    const items = page.locator("[data-interaction-stage] :is(button, a[href], [role='option'], [role='menuitem'], [role='tab'], [role='radio'], [role='switch'], li, input)");
    const n = Math.min(4, await items.count());
    await mark(page, marks, t0);
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
    await press(page, back ?? at, marks, t0);
    await page.keyboard.press('Escape');
    await wait(page, 300);
    const info = await loc.evaluate((el) => ({ tag: el.tagName, role: el.getAttribute('role'), type: el.getAttribute('type') })).catch(() => null);
    await loc.focus().catch(() => {});
    if (info && (info.tag === 'INPUT' || info.tag === 'TEXTAREA') && !['checkbox', 'radio', 'range'].includes(info.type || '')) {
      await mark(page, marks, t0);
      await page.keyboard.type('42', { delay: 120 });
      await wait(page, 500);
      await page.keyboard.press('ArrowUp');
      await wait(page, 600);
    } else if (info && ['option', 'menuitem', 'menuitemradio', 'menuitemcheckbox', 'treeitem', 'row', 'listbox', 'menu', 'tree', 'grid', 'treegrid'].includes(info.role || '')) {
      await mark(page, marks, t0);
      await page.keyboard.press('ArrowDown');
      await wait(page, 600);
      await page.keyboard.press('ArrowUp');
      await wait(page, 600);
    } else if (info && ['slider', 'tab', 'radio'].includes(info.role || '')) {
      await mark(page, marks, t0);
      await page.keyboard.press('ArrowRight');
      await wait(page, 600);
      await page.keyboard.press('ArrowLeft');
      await wait(page, 600);
    } else if (info && info.tag !== 'A') {
      await mark(page, marks, t0);
      // Held like a finger on a key: a press of 0ms never paints the pressed state.
      await page.keyboard.down('Space');
      await wait(page, 120);
      await page.keyboard.up('Space');
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

/** The times (ms) at which the mark square flips, read from the clip. */
function flips(file) {
  let raw;
  try {
    raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'fps=50,crop=4:4:0:0,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 64 << 20 });
  } catch {
    return [];
  }
  const out = [];
  let last = null;
  for (let i = 0; i + 16 <= raw.length; i += 16) {
    let sum = 0;
    for (let j = 0; j < 16; j++) sum += raw[i + j];
    const on = sum / 16 > 128;
    if (last !== null && on !== last) out.push((i / 16) * 20);
    last = on;
  }
  return out;
}

function sheet(rec) {
  const dir = path.join(TMP, style, 'frames', rec.id);
  fs.mkdirSync(dir, { recursive: true });
  // One row per mark: the hover, the first press, the second press, the keyboard.
  // Row starts: the flips of the mark square; a clip without them (older
  // runs) falls back on the logged marks less LEAD_MS.
  // The first paint can read as one more flip before the beats: keep the last ones.
  const seen = flips(rec.file).slice(-rec.marks.length);
  const marks = (seen.length === rec.marks.length ? seen : rec.marks.map((m) => Math.max(0, m - LEAD_MS))).slice(0, 4);
  const rows = [];
  marks.forEach((start, r) => {
    for (let k = 0; k < FRAMES; k++) {
      const t = (start + k * FRAME_STEP_MS) / 1000;
      const f = path.join(dir, `${r}-${k}.png`);
      try {
        execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', t.toFixed(3), '-i', rec.file, '-frames:v', '1', '-vf', 'crop=iw-12:ih-12:6:6,scale=240:135', f]);
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
  // Stay under 8 MB (8,000,000 bytes): VP8 in realtime mode overshoots its
  // target by up to about 15%, so aim at 6.4 MB over the clip.
  const kbps = Math.max(150, Math.min(700, Math.floor((6.4 * 8 * 1000) / seconds)));
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
