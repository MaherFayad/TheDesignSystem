// Recorder for order 1.23 (interaction round 3). The owner judges motion from
// video on a phone, so every clip and every contact sheet tile is cropped to
// the control and drawn large.
//
// For each interaction of the registry:
//   1. Measure. Open `/interactions?focus=<id>&zoom=1` at 960 by 540 and
//      find the control (the stage's `data-interaction-trigger`, else its
//      first interactive element, else the drive's `region` selector). Play
//      the first step of the drive and add every overlay that opened (menu,
//      dialog, popover, tooltip, toast, list box). The region is the union
//      plus a margin, never under 120 by 68 CSS pixels.
//   2. Record. Draw the page with CSS zoom `z` (1 to 4) on the root so the
//      region fills a 960 by 540 frame (Playwright records at CSS size, so a
//      device scale would not help): a switch or a checkbox plays at 4x, a dialog
//      at about 1.5x. The stage moves so the region sits in the centre.
//   3. Cut. The clip is cropped to the region (480 px wide or more) and
//      padded into 960 by 540 for stitching. The contact sheet has one band
//      per beat the drive marks: twelve frames 40 ms apart (the clip runs at
//      25 frames a second), six to a row, each tile 480 px wide.
//
//   node docs/reports/shots/interactions-3/record.cjs <base url> <style> <scheme> [family] [id,id]
//
// Drives: `drives/<family>.cjs` may export `{ [id]: { region?, drive? } }`.
// `region` is a CSS selector for what the crop must hold. `drive(api)` plays
// the interaction and calls `api.mark()` at the start of each beat that the
// sheet should show; without it the default drive approaches, hovers,
// presses twice and takes the keyboard path. The api:
//   page, loc (the control), at ({x, y} centre), mark(), wait(ms),
//   press(at, holdMs), drag(from, to, {steps, holdMs}), key(name), hover(at)
// Each family agent owns its drive file.
//
// Clips and frames go to a scratch folder (RECORD_TMP, default a folder in
// the OS temp dir). Results next to this file: clips/<family>.<style>.webm
// and sheets/<id>.<style>.png. A log line per interaction goes to stdout.
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const [base = 'http://localhost:5190', style = 'neutral', scheme = 'light', onlyFamily = '', onlyIds = ''] = process.argv.slice(2);
const OUT = __dirname;
const TMP = process.env.RECORD_TMP || path.join(os.tmpdir(), 'ds-record-3');
const FRAME = { width: 960, height: 540 };
const MIN_REGION = { width: 120, height: 68 };
const TILE_W = 480;
const STEP_MS = 40;
const PER_BAND = 12;
const PER_ROW = 6;
const MAX_BANDS = 5;
const wait = (p, ms) => p.waitForTimeout(ms);

const OVERLAYS = [
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[role="tooltip"]',
  '[data-radix-popper-content-wrapper] > *',
  "[data-ds='toast']",
  "[data-ds='toast-viewport'] > *",
].join(',');

function loadDrives(family) {
  const f = path.join(OUT, 'drives', `${family}.cjs`);
  if (!fs.existsSync(f)) return {};
  delete require.cache[require.resolve(f)];
  return require(f);
}

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

const centreOf = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

function union(boxes) {
  const bs = boxes.filter(Boolean);
  if (!bs.length) return null;
  const x0 = Math.min(...bs.map((b) => b.x));
  const y0 = Math.min(...bs.map((b) => b.y));
  const x1 = Math.max(...bs.map((b) => b.x + b.width));
  const y1 = Math.max(...bs.map((b) => b.y + b.height));
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

function pad(b) {
  const m = Math.max(16, Math.round(Math.min(b.width, b.height) * 0.25));
  let w = b.width + 2 * m;
  let h = b.height + 2 * m;
  w = Math.max(w, MIN_REGION.width, (h * FRAME.width) / FRAME.height / 2);
  h = Math.max(h, MIN_REGION.height);
  const c = centreOf(b);
  return { x: c.x - w / 2, y: c.y - h / 2, width: w, height: h };
}

async function overlayBoxes(page) {
  return page.evaluate((sel) => {
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      if (el.closest('[data-interaction-stage]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      out.push({ x: r.x, y: r.y, width: r.width, height: r.height });
    }
    return out;
  }, OVERLAYS);
}

function api(page, loc, at, marks, t0) {
  const a = {
    page,
    loc,
    at,
    wait: (ms) => wait(page, ms),
    mark: () => marks.push(Date.now() - t0),
    hover: async (p, steps = 12) => page.mouse.move(p.x, p.y, { steps }),
    press: async (p = at, holdMs = 140) => {
      await page.mouse.move(p.x, p.y, { steps: 6 });
      a.mark();
      await page.mouse.down();
      await wait(page, holdMs);
      await page.mouse.up();
    },
    drag: async (from, to, { steps = 14, holdMs = 160 } = {}) => {
      await page.mouse.move(from.x, from.y, { steps: 6 });
      a.mark();
      await page.mouse.down();
      await wait(page, holdMs);
      await page.mouse.move(to.x, to.y, { steps });
      await page.mouse.up();
    },
    key: async (name) => {
      a.mark();
      await page.keyboard.press(name);
    },
  };
  return a;
}

/** Approach, hover, press twice (out and back), then the keyboard path. */
async function defaultDrive(a) {
  const { page, loc, at } = a;
  await a.hover(at, 20);
  a.mark();
  await a.wait(600);
  await a.press(at, 140);
  await a.wait(1000);
  await page.keyboard.press('Escape');
  await a.wait(300);
  await a.press(at, 140);
  await a.wait(1000);
  await page.keyboard.press('Escape');
  await a.wait(300);
  const info = await loc.evaluate((el) => ({ tag: el.tagName, role: el.getAttribute('role'), type: el.getAttribute('type') })).catch(() => null);
  await loc.focus().catch(() => {});
  if (info && (info.tag === 'INPUT' || info.tag === 'TEXTAREA') && !['checkbox', 'radio', 'range'].includes(info.type || '')) {
    a.mark();
    await page.keyboard.type('42', { delay: 120 });
    await a.wait(500);
    await page.keyboard.press('ArrowUp');
    await a.wait(600);
  } else if (info && ['slider', 'tab', 'radio'].includes(info.role || '')) {
    await a.key('ArrowRight');
    await a.wait(600);
    await page.keyboard.press('ArrowLeft');
    await a.wait(600);
  } else if (info && info.tag !== 'A') {
    await a.key('Space');
    await a.wait(900);
    await page.keyboard.press('Escape');
    await a.wait(300);
  }
}

/** The first step of a drive, for the measure pass: a press, so overlays open. */
async function measure(browser, row, spec) {
  const ctx = await browser.newContext({ viewport: FRAME, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${base}/interactions?focus=${row.id}&zoom=1&style=${style}&scheme=${scheme}&chrome=0`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-interaction-stage]', { timeout: 60000 }).catch(() => {});
  await wait(page, 300);
  const loc = await target(page);
  const tBox = loc ? await loc.boundingBox() : null;
  let regionBox = null;
  if (spec.region) regionBox = await page.locator(spec.region).first().boundingBox().catch(() => null);
  let opened = [];
  if (tBox && !spec.noOverlay) {
    const c = centreOf(tBox);
    await page.mouse.move(c.x, c.y, { steps: 4 });
    await wait(page, 400);
    opened = opened.concat(await overlayBoxes(page));
    await page.mouse.click(c.x, c.y);
    await wait(page, 700);
    opened = opened.concat(await overlayBoxes(page));
  }
  const stageBox = await page.locator('[data-interaction-stage]').first().boundingBox().catch(() => null);
  await ctx.close();
  const core = union([regionBox || tBox || stageBox, ...opened]);
  if (!core) return null;
  const region = pad(core);
  const anchor = tBox ? centreOf(tBox) : centreOf(core);
  const c = centreOf(region);
  return { region, offset: { x: c.x - anchor.x, y: c.y - anchor.y }, opened: opened.length };
}

async function recordOne(browser, row, spec) {
  const m = await measure(browser, row, spec);
  const region = m ? m.region : { x: 0, y: 0, width: FRAME.width, height: FRAME.height };
  const z = Math.max(1, Math.min(4, Math.floor(Math.min(FRAME.width / region.width, FRAME.height / region.height) * 4) / 4));
  const viewport = FRAME;
  const dir = path.join(TMP, style, 'raw');
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, recordVideo: { dir, size: FRAME } });
  // Playwright records at CSS size whatever the device scale, so the page is
  // drawn larger with CSS zoom on the root, before any script runs.
  await ctx.addInitScript((zoom) => {
    const set = () => document.documentElement.style.setProperty('zoom', String(zoom));
    if (document.documentElement) set();
    document.addEventListener('DOMContentLoaded', set);
  }, z);
  const page = await ctx.newPage();
  const t0 = Date.now();
  const marks = [];
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${base}/interactions?focus=${row.id}&zoom=1&style=${style}&scheme=${scheme}&chrome=0`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-interaction-stage]', { timeout: 60000 }).catch(() => {});
  await wait(page, 200);
  let loc = await target(page);
  // Move the stage so the region sits in the centre of the frame.
  if (loc && m) {
    const b = await loc.boundingBox();
    if (b) {
      const c = centreOf(b);
      // Bounding boxes come in frame pixels; the translate is in zoomed CSS pixels.
      const dx = Math.round((viewport.width / 2 - c.x) / z - m.offset.x);
      const dy = Math.round((viewport.height / 2 - c.y) / z - m.offset.y);
      await page.evaluate(
        ([x, y]) => {
          const s = document.querySelector('[data-gallery="interactions-focus-stage"]');
          if (s) s.style.translate = `${x}px ${y}px`;
        },
        [dx, dy],
      );
      await wait(page, 150);
      loc = await target(page);
    }
  }
  await page.mouse.move(8, viewport.height - 8);
  await wait(page, 400);
  const b = loc ? await loc.boundingBox() : null;
  const at = b ? centreOf(b) : null;
  if (at) {
    const a = api(page, loc, at, marks, t0);
    try {
      await (spec.drive || defaultDrive)(a);
    } catch (e) {
      errs.push(`drive: ${e.message}`);
    }
    await page.mouse.move(8, viewport.height - 8, { steps: 10 });
    await wait(page, 400);
  } else {
    await wait(page, 2000);
  }
  const video = page.video();
  await ctx.close();
  const file = path.join(dir, `${row.id}.webm`);
  fs.renameSync(await video.path(), file);
  // The crop in video pixels: the region drawn at z, centred.
  const cw = Math.min(FRAME.width, Math.round(region.width * z));
  const ch = Math.min(FRAME.height, Math.round(region.height * z));
  const crop = { w: cw - (cw % 2), h: ch - (ch % 2), x: Math.round((FRAME.width - cw) / 2), y: Math.round((FRAME.height - ch) / 2) };
  return { ...row, file, marks, errs, found: Boolean(at), z, crop, opened: m ? m.opened : 0 };
}

function sheet(rec) {
  const dir = path.join(TMP, style, 'bands', rec.id);
  fs.mkdirSync(dir, { recursive: true });
  const { crop } = rec;
  const tileH = Math.round((crop.h * TILE_W) / crop.w / 2) * 2;
  const bands = [];
  rec.marks.slice(0, MAX_BANDS).forEach((mk, i) => {
    const f = path.join(dir, `${i}.png`);
    const vf = `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},scale=${TILE_W}:${tileH}:flags=lanczos,fps=25,tile=${PER_ROW}x${PER_BAND / PER_ROW}:padding=4:color=gray`;
    try {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', (mk / 1000).toFixed(3), '-i', rec.file, '-t', ((PER_BAND * STEP_MS) / 1000).toFixed(3), '-vf', vf, '-frames:v', '1', f]);
      bands.push(f);
    } catch {
      /* past the end */
    }
  });
  if (!bands.length) return null;
  const outDir = path.join(OUT, 'sheets');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${rec.id}.${style}.png`);
  if (bands.length === 1) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', bands[0], out]);
  else {
    const args = ['-v', 'error', '-y'];
    for (const f of bands) args.push('-i', f);
    args.push('-filter_complex', `${bands.map((_, i) => `[${i}:v]pad=iw:ih+12:0:0:black[b${i}]`).join(';')};${bands.map((_, i) => `[b${i}]`).join('')}vstack=inputs=${bands.length}`, '-frames:v', '1', out);
    execFileSync('ffmpeg', args);
  }
  return out;
}

/** The clip cropped to the region, scaled to fit 960 by 540 and padded, for stitching. */
function cropClip(rec) {
  const { crop } = rec;
  const out = path.join(TMP, style, 'crop', `${rec.id}.webm`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const vf = `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},scale=${FRAME.width}:${FRAME.height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${FRAME.width}:${FRAME.height}:(ow-iw)/2:(oh-ih)/2:color=black,fps=25`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', rec.file, '-vf', vf, '-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-b:v', '1500k', '-an', out]);
  return out;
}

function stitch(family, recs) {
  const list = path.join(TMP, style, `${family}.txt`);
  fs.writeFileSync(list, recs.map((r) => `file '${r.cropped}'`).join('\n') + '\n');
  const joined = path.join(TMP, style, `${family}.joined.webm`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined]);
  const seconds = Math.max(1, recs.length * 10);
  // Stay under 8 MB: about 7.2 MB over the clip.
  const kbps = Math.max(150, Math.min(900, Math.floor((7.2 * 8 * 1024) / seconds)));
  const dir = path.join(OUT, 'clips');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${family}.${style}.webm`);
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
    const spec = loadDrives(row.family)[row.id] || {};
    const rec = await recordOne(browser, row, spec);
    rec.sheet = sheet(rec);
    rec.cropped = cropClip(rec);
    recs.push(rec);
    console.log(JSON.stringify({ id: rec.id, family: rec.family, found: rec.found, z: rec.z, crop: rec.crop, opened: rec.opened, marks: rec.marks, errs: rec.errs.slice(0, 2) }));
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
