// Switch thumb contrast probe (order 1.29, blockers B3 and B4 of the round 3
// interaction review). Reusable: the lead reruns it after any Switch change.
//
//   node docs/reports/fixes/interactions-3/switch-contrast.cjs \
//     [--base http://127.0.0.1:5181] [--out <file.json>] [--label after] \
//     [--styles studio,desk,neutral,liquid] [--schemes light,dark] \
//     [--platforms web,ios,android] [--step 10] [--kinds toggle,drag]
//     [--shots <folder>]   (saves each frame's crop, for a look by eye)
//     [--jobs 4]           (style, scheme and platform sets measured at once)
//     [--css "<rules>"]    (extra CSS on every stage, to try a hook first)
//
// For every style, scheme and platform it opens the gallery stage
// `/interactions?focus=switch-stretch` (toggles) and `switch-drag` (drags),
// at zoom 1 and a device scale of 2, and measures the thumb against the
// pixels around it:
//
// - toggle runs: on and off, each from a plain click (no pointer on the
//   control, as from the keyboard) and from a tap whose press lingers (a
//   touch pointerdown, `:active` and `:hover` forced on the control through
//   the DevTools protocol, then a pointerup and the click while they hold, as
//   `:active` stays on for 150 to 250ms after a tap on touch; a real press
//   would be cleared by the click). Right after the change every
//   animation in the document is paused, then seeked every `--step` ms to the
//   end of the longest one.
// - drag runs: from off and from on, the pointer drags the thumb and holds
//   it at progress 0 to 1 in 0.05 steps (read back from the inline
//   `--_switch-drag-progress`), with every animation finished at each hold.
//
// The measure, per frame: the thumb's shape is its box, radius and transform
// (scale read from the box on screen against the layout box). Around the edge,
// in 48 directions, it takes the pixels 0.75 and 1.5px inside the edge (the
// thumb) and 1 and 2px outside it (what is around the thumb), and keeps for
// each direction the best contrast of the four pairs (WCAG relative
// luminance): a ring a style draws round the thumb, or a rim inside a clear
// lens, counts as the thumb's edge. The frame's value is the median over the
// directions (as in the review); the frame's minimum is kept as well.
//
// It writes JSON with each run's minimum and the frame where it fell, and
// exits 1 when any run's minimum is under 3:1 (WCAG 1.4.11).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BASE = arg('base', 'http://127.0.0.1:5181');
const OUT = arg('out', path.join(__dirname, 'switch-contrast.json'));
const LABEL = arg('label', 'run');
const STYLES = arg('styles', 'studio,desk,neutral,liquid').split(',');
const SCHEMES = arg('schemes', 'light,dark').split(',');
const PLATFORMS = arg('platforms', 'web,ios,android').split(',');
const STEP = Number(arg('step', '10'));
const JOBS = Number(arg('jobs', '4'));
const KINDS = arg('kinds', 'toggle,drag').split(',');
const SHOTS = arg('shots', '');
// Extra CSS put on every stage, to try a hook a style has not set yet, e.g.
// --css "[data-style='liquid'] [data-ds='switch'] { --_switch-thumb-width: calc(var(--_switch-thumb-size) * 1.5); }"
const EXTRA_CSS = arg('css', '');
const GATE = 3;
const DSF = 2;
const DIRECTIONS = 48;
const INNER = [0.75, 1.5];
const OUTER = [1, 2];

// ------------------------------------------------------------ colour

function lin(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function lum([r, g, b]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a, b) {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ------------------------------------------------------------ geometry

/** A point on the edge of a w by h rounded box (radius r) centred on 0, and its outward normal; u runs 0 to 1. */
function edgePoint(w, h, r, u) {
  const hw = w / 2;
  const hh = h / 2;
  const sx = w - 2 * r;
  const sy = h - 2 * r;
  const arc = (Math.PI / 2) * r;
  const segs = [sx, arc, sy, arc, sx, arc, sy, arc];
  const total = segs.reduce((a, b) => a + b, 0);
  let d = u * total;
  let i = 0;
  while (i < segs.length - 1 && d > segs[i]) {
    d -= segs[i];
    i += 1;
  }
  const corner = (cx, cy, a0) => {
    const a = a0 + (r > 0 ? d / r : 0);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
  };
  switch (i) {
    case 0: return { x: -hw + r + d, y: -hh, nx: 0, ny: -1 };
    case 1: return corner(hw - r, -hh + r, -Math.PI / 2);
    case 2: return { x: hw, y: -hh + r + d, nx: 1, ny: 0 };
    case 3: return corner(hw - r, hh - r, 0);
    case 4: return { x: hw - r - d, y: hh, nx: 0, ny: 1 };
    case 5: return corner(-hw + r, hh - r, Math.PI / 2);
    case 6: return { x: -hw, y: hh - r - d, nx: -1, ny: 0 };
    default: return corner(-hw + r, -hh + r, Math.PI);
  }
}

/** Reads the thumb's frame value from a screenshot of `clip` (css px) and the thumb geometry `g`. */
function measure(png, clip, g) {
  const px = (x, y) => {
    const ix = Math.round((x - clip.x) * DSF);
    const iy = Math.round((y - clip.y) * DSF);
    if (ix < 0 || iy < 0 || ix >= png.width || iy >= png.height) return null;
    const o = (iy * png.width + ix) * 4;
    return [png.data[o], png.data[o + 1], png.data[o + 2]];
  };
  const values = [];
  for (let k = 0; k < DIRECTIONS; k += 1) {
    const e = edgePoint(g.w, g.h, g.r, (k + 0.5) / DIRECTIONS);
    // Local box to screen: scale the point, carry the normal by the inverse scale.
    const sx = g.sx;
    const sy = g.sy;
    const x = g.cx + e.x * sx;
    const y = g.cy + e.y * sy;
    let nx = e.nx / sx;
    let ny = e.ny / sy;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    let best = 0;
    for (const di of INNER) {
      const a = px(x - nx * di, y - ny * di);
      if (!a) continue;
      for (const dout of OUTER) {
        const b = px(x + nx * dout, y + ny * dout);
        if (b) best = Math.max(best, contrast(a, b));
      }
    }
    values.push(best);
  }
  return { median: median(values), min: Math.min(...values) };
}

// ------------------------------------------------------------ page helpers

async function openStage(browser, { id, style, scheme, platform }) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 520 }, deviceScaleFactor: DSF });
  const page = await ctx.newPage();
  const url = `${BASE}/interactions?focus=${id}&style=${style}&scheme=${scheme}&platform=${platform}&chrome=0&zoom=1`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-interaction-stage] [data-interaction-trigger]', { timeout: 60000 });
  // The gallery's pointer marker would sit over the thumb in every held and dragged frame.
  await page.addStyleTag({ content: "[data-gallery='pointer-dot'] { display: none; }" });
  if (EXTRA_CSS) await page.addStyleTag({ content: EXTRA_CSS });
  await page.mouse.move(2, 2);
  await page.waitForTimeout(300);
  await finishAll(page);
  return { ctx, page };
}

async function finishAll(page) {
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        /* an infinite one */
      }
    }
  });
}

/** The thumb's box on screen, its layout box and radius, and a clip around it. */
async function geometry(page) {
  return page.evaluate(() => {
    const thumb = document.querySelector("[data-interaction-trigger] [data-part='thumb']");
    const r = thumb.getBoundingClientRect();
    const w = thumb.offsetWidth;
    const h = thumb.offsetHeight;
    const rad = parseFloat(getComputedStyle(thumb).borderTopLeftRadius) || 0;
    return {
      cx: r.x + r.width / 2,
      cy: r.y + r.height / 2,
      w,
      h,
      r: Math.min(rad, w / 2, h / 2),
      sx: w ? r.width / w : 1,
      sy: h ? r.height / h : 1,
      box: { x: r.x, y: r.y, width: r.width, height: r.height },
    };
  });
}



async function frame(page) {
  const g = await geometry(page);
  const pad = 6;
  const clip = {
    x: Math.floor(g.box.x - pad),
    y: Math.floor(g.box.y - pad),
    width: Math.ceil(g.box.width + pad * 2),
    height: Math.ceil(g.box.height + pad * 2),
  };
  const buf = await page.screenshot({ clip, animations: 'allow', caret: 'initial' });
  if (SHOTS && page.__shot) fs.writeFileSync(path.join(SHOTS, `${page.__shot}.png`), buf);
  return measure(PNG.sync.read(buf), clip, g);
}

async function stateOf(page) {
  return page.evaluate(() => document.querySelector('[data-interaction-trigger]').getAttribute('data-state'));
}

async function setState(page, want) {
  if ((await stateOf(page)) !== want) {
    await page.evaluate(() => document.querySelector('[data-interaction-trigger]').click());
    await page.waitForTimeout(30);
  }
  await finishAll(page);
}

// ------------------------------------------------------------ runs

/** Forces `:active` and `:hover` on the control (or clears them), as a held press or a tap whose `:active` lingers. */
async function forcePress(page, on) {
  if (!page.__cdp) {
    page.__cdp = await page.context().newCDPSession(page);
    await page.__cdp.send('DOM.enable');
    await page.__cdp.send('CSS.enable');
  }
  const cdp = page.__cdp;
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-interaction-trigger]' });
  await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: on ? ['active', 'hover'] : [] });
}

/**
 * One toggle: change the state (plainly, or while the control is held), pause, seek.
 * A synthetic click clears a real `:active`, so the held form forces `:active`
 * and `:hover` on the control through the DevTools protocol: the state changes
 * while the press look holds, as after a tap on touch (review N1).
 */
async function toggleRun(page, to, mode) {
  await setState(page, to === 'checked' ? 'unchecked' : 'checked');
  await page.mouse.move(2, 2);
  if (mode === 'held') {
    await page.evaluate(() => {
      const ctl = document.querySelector('[data-interaction-trigger]');
      ctl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7, isPrimary: true, button: 0, pointerType: 'touch' }));
    });
    await forcePress(page, true);
    await page.waitForTimeout(250);
    await finishAll(page);
  }
  const end = await page.evaluate(async (held) => {
    const ctl = document.querySelector('[data-interaction-trigger]');
    const before = ctl.getAttribute('data-state');
    // A tap: the finger comes up (the framework marks the root data-released) while :active lingers, then the click.
    if (held) ctl.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7, isPrimary: true, button: 0, pointerType: 'touch' }));
    ctl.click();
    await Promise.resolve();
    if (ctl.getAttribute('data-state') === before) await new Promise((r) => setTimeout(r, 0));
    const anims = document.getAnimations();
    let last = 0;
    for (const a of anims) {
      a.pause();
      const t = a.effect ? a.effect.getComputedTiming() : null;
      if (t && Number.isFinite(t.endTime)) last = Math.max(last, t.endTime);
    }
    window.__switchAnims = anims;
    return last;
  }, mode === 'held');
  const frames = [];
  for (let t = 0; t <= end + STEP; t += STEP) {
    await page.evaluate((tt) => {
      for (const a of window.__switchAnims) a.currentTime = tt;
    }, t);
    page.__shot = `${page.__where}-${to}-${mode}-${String(t).padStart(4, '0')}`;
    const m = await frame(page);
    frames.push([t, round(m.median), round(m.min)]);
  }
  await finishAll(page);
  if (mode === 'held') {
    await forcePress(page, false);
    await page.waitForTimeout(30);
    await finishAll(page);
  }
  return { end: Math.round(end), frames };
}

/** One drag from `from`: hold the thumb at progress 0 to 1 in 0.05 steps. */
async function dragRun(page, from) {
  await setState(page, from);
  await page.mouse.move(2, 2);
  const g = await page.evaluate(() => {
    const ctl = document.querySelector('[data-interaction-trigger]');
    const track = ctl.querySelector("[data-part='track']");
    const thumb = track.querySelector("[data-part='thumb']");
    const cs = getComputedStyle(track);
    const pad = (parseFloat(cs.paddingInlineStart) || 0) + (parseFloat(cs.paddingInlineEnd) || 0);
    const share = (track.clientWidth - pad - thumb.offsetWidth) / track.offsetWidth;
    const travel = track.getBoundingClientRect().width * share;
    const r = thumb.getBoundingClientRect();
    const dir = getComputedStyle(ctl.parentElement).direction === 'rtl' ? -1 : 1;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, travel, dir };
  });
  const p0 = from === 'checked' ? 1 : 0;
  await page.mouse.move(g.x, g.y);
  await page.mouse.down();
  await page.mouse.move(g.x + 8 * g.dir * (p0 ? -1 : 1), g.y, { steps: 2 });
  const frames = [];
  for (let i = 0; i <= 20; i += 1) {
    const p = from === 'checked' ? 1 - i * 0.05 : i * 0.05;
    await page.mouse.move(g.x + (p - p0) * g.travel * g.dir, g.y, { steps: 1 });
    await page.waitForTimeout(40);
    await finishAll(page);
    const read = await page.evaluate(() => {
      const root = document.querySelector('[data-interaction-trigger]').parentElement;
      return { p: root.style.getPropertyValue('--_switch-drag-progress'), dragging: root.hasAttribute('data-dragging') };
    });
    page.__shot = `${page.__where}-drag-${from}-${p.toFixed(2)}`;
    const m = await frame(page);
    frames.push([Number(p.toFixed(2)), round(m.median), round(m.min), read.p || null, read.dragging]);
  }
  await page.mouse.move(g.x + (p0 - (from === 'checked' ? 1 : 0)) * g.travel * g.dir, g.y, { steps: 2 });
  await page.mouse.up();
  await page.waitForTimeout(30);
  await finishAll(page);
  return { frames };
}

/** Runs `fn` again on a fresh page when the page changed under it (another lane's edit hot reloads the gallery). */
async function withRetry(browser, id, where, fn) {
  let last;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { ctx, page } = await openStage(browser, { id, ...where });
    page.__where = `${where.style}-${where.scheme}-${where.platform}`;
    try {
      const out = await fn(page);
      await ctx.close();
      return out;
    } catch (e) {
      last = e;
      await ctx.close();
    }
  }
  throw last;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function summarise(run, idx = 1) {
  let worst = { value: Infinity, at: null };
  for (const f of run.frames) if (f[idx] < worst.value) worst = { value: f[idx], at: f[0] };
  return worst;
}

async function main() {
  const browser = await chromium.launch();
  const runs = [];
  const sets = [];
  for (const style of STYLES) for (const scheme of SCHEMES) for (const platform of PLATFORMS) sets.push({ style, scheme, platform });
  const one = async (where) => {
    if (KINDS.includes('toggle')) {
      for (const mode of ['click', 'held']) {
        for (const to of ['checked', 'unchecked']) {
          const r = await withRetry(browser, 'switch-stretch', where, (page) => toggleRun(page, to, mode));
          const kind = to === 'checked' ? 'toggle-on' : 'toggle-off';
          const min = summarise(r);
          runs.push({ ...where, kind, mode, min: min.value, at: min.at, minEdge: summarise(r, 2).value, end: r.end, frames: r.frames });
          log(where, `${kind} ${mode}`, min);
        }
      }
    }
    if (KINDS.includes('drag')) {
      for (const from of ['unchecked', 'checked']) {
        const r = await withRetry(browser, 'switch-drag', where, (page) => dragRun(page, from));
        const kind = from === 'unchecked' ? 'drag-from-off' : 'drag-from-on';
        const min = summarise(r);
        runs.push({ ...where, kind, mode: 'drag', min: min.value, at: min.at, minEdge: summarise(r, 2).value, frames: r.frames });
        log(where, kind, min);
      }
    }
  };
  const queue = [...sets];
  await Promise.all(Array.from({ length: Math.max(1, JOBS) }, async () => {
    while (queue.length) await one(queue.shift());
  }));
  const order = (r) => sets.findIndex((w) => w.style === r.style && w.scheme === r.scheme && w.platform === r.platform);
  const kinds = ['toggle-on', 'toggle-off', 'drag-from-off', 'drag-from-on'];
  runs.sort((a, b) => order(a) - order(b) || kinds.indexOf(a.kind) - kinds.indexOf(b.kind) || a.mode.localeCompare(b.mode));
  await browser.close();
  const failures = runs.filter((r) => r.min < GATE);
  const out = {
    probe: 'switch-contrast.cjs',
    label: LABEL,
    base: BASE,
    gate: GATE,
    note:
      'Per frame: median over 48 directions of the best contrast between the thumb (0.75 and 1.5px inside its edge) and what is around it (1 and 2px outside). Toggle frames: [ms, median, min]; drag frames: [progress, median, min, inline progress, dragging]. min is the lowest frame median of the run.',
    worst: runs.reduce((w, r) => (r.min < w.min ? { style: r.style, scheme: r.scheme, platform: r.platform, kind: r.kind, mode: r.mode, min: r.min, at: r.at } : w), { min: Infinity }),
    failures: failures.map((r) => ({ style: r.style, scheme: r.scheme, platform: r.platform, kind: r.kind, mode: r.mode, min: r.min, at: r.at })),
    runs,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`${runs.length} runs, ${failures.length} under ${GATE}:1. Worst ${JSON.stringify(out.worst)}. Wrote ${OUT}`);
  process.exit(failures.length ? 1 : 0);
}

function log(where, what, min) {
  const flag = min.value < GATE ? 'FAIL' : 'ok  ';
  console.log(`${flag} ${where.style}/${where.scheme}/${where.platform} ${what}: ${min.value} at ${min.at}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
