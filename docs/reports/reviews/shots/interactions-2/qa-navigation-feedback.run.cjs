// ds-qa review of order 1.22: measures the navigation and feedback families.
//   node qa-navigation-feedback.run.cjs [id ...]
// Writes <id>.measure.json and <id>.sheet.png next to this file.
// Durations come from effect.getComputedTiming(), not the wall clock.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');
const { ids, openPage, installHelpers, sample } = require('./qa-navigation-feedback.lib.cjs');

const OUT = __dirname;
const REG = JSON.parse(fs.readFileSync(process.env.QA_REGISTRY || path.join(__dirname, 'qa-navigation-feedback.registry.json'), 'utf8'));
const rows = Object.fromEntries([...REG.navigation, ...REG.feedback].map((r) => [r.id, r]));
const STYLES = ['studio', 'desk', 'neutral'];
const schemeOf = (s) => (s === 'neutral' ? 'light' : 'dark');
const SHEET_T = [0, 60, 120, 180, 240, 300, 360, 420];
const LOOP_IDS = new Set(['avatar-status', 'status-pulse', 'spinner-loop', 'skeleton-swap']);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newCtx(browser, motion) {
  return browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1, reducedMotion: motion === 'media' ? 'reduce' : 'no-preference' });
}

async function settle(page, ms = 700) {
  await page.waitForTimeout(ms);
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { if (a.effect.getComputedTiming().iterations !== Infinity) a.finish(); } catch { /* loop */ } }));
  await page.waitForTimeout(100);
}

// Focus ring on the first Tab into the stage: at once, and the same 300ms later.
async function focusCheck(page) {
  // The first stop inside the stage that is a part of the component under test (not a gallery Play button), else the first stop.
  let first = null;
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const where = await page.evaluate(() => { const a = document.activeElement; if (!(a && a !== document.body && window.__qa.roots().some((r) => r.contains(a)))) return 'out'; return a.matches("[data-ds='button']:not([data-part]), [data-ds='button'][data-interaction-trigger]") && !a.closest("[data-ds='alert'], [data-ds='empty-state'], [data-ds='error-state'], [data-ds='toolbar'], [data-ds='pagination'], [data-ds='language-switch']") ? 'play' : 'part'; });
    if (where === 'part') { first = null; break; }
    if (where === 'play' && first === null) first = i;
  }
  if (first !== null && !(await page.evaluate(() => { const a = document.activeElement; return a && window.__qa.roots().some((r) => r.contains(a)); }))) {
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.mouse.click(2, 2);
    for (let i = 0; i <= first; i++) await page.keyboard.press('Tab');
  }
  const read = () => page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    const cs = getComputedStyle(a);
    const anims = a.getAnimations({ subtree: true }).filter((x) => x.playState === 'running').map((x) => (x.transitionProperty || x.animationName || x.id) + ' ' + Math.round(x.effect.getComputedTiming().duration));
    return { el: window.__qa.describe(a), outline: cs.outlineStyle === 'none' ? 'none' : `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 120), focusVisible: a.matches(':focus-visible'), opacity: window.__qa.effOpacity(a), anims };
  });
  const at0 = await read();
  await page.waitForTimeout(300);
  const at300 = await read();
  const ringOn = (r) => r && (r.outline !== 'none' || r.boxShadow !== 'none');
  return { at0, at300, ringAtOnce: !!(ringOn(at0) && at0.outline === at300.outline && at0.boxShadow === at300.boxShadow && at0.opacity > 0.9) };
}

// Trigger, pause every animation, seek through time; read values, hit tests and frames.
async function seekPhase(page, cfg, { shots = false, step = 20, until = 600, label } = {}) {
  await cfg.act(page);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const meta = await page.evaluate(() => {
    const as = document.getAnimations();
    window.__seekAnims = as;
    as.forEach((a) => a.pause());
    const t0 = Math.min(...as.map((a) => (a.startTime == null ? Infinity : a.startTime)).filter(Number.isFinite), Infinity);
    window.__seekOffsets = as.map((a) => (a.startTime == null || !Number.isFinite(t0) ? 0 : a.startTime - t0));
    // Seek every animation to its end to read the rest boxes of the interactive parts.
    as.forEach((a) => { const ct = a.effect.getComputedTiming(); a.currentTime = Number.isFinite(ct.endTime) ? ct.endTime : 600; });
    const q = window.__qa;
    window.__finals = q.interactives().map((el) => { const r = el.getBoundingClientRect(); return { el, x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; });
    return { count: as.length, offsets: window.__seekOffsets.map(Math.round) };
  });
  const values = [];
  const hit = { checked: 0, missed: [], maxShift: 0 };
  const frames = [];
  const seek = (t) => page.evaluate((t) => {
    window.__seekAnims.forEach((a, i) => { a.currentTime = Math.max(0, t - window.__seekOffsets[i]); });
  }, t);
  for (let t = 0; t <= until; t += step) {
    await seek(t);
    const v = await page.evaluate(() => {
      const q = window.__qa;
      const parts = [];
      const seenT = new Set();
      for (const a of window.__seekAnims) {
        const el = a.effect && a.effect.target;
        if (!el) continue;
        const ps = a.effect.pseudoElement || null;
        const key = q.describe(el, ps) + '#' + (window.__seekAnims.indexOf(a));
        const k2 = el;
        if (seenT.has(k2) && !ps) continue;
        seenT.add(k2);
        const cs = getComputedStyle(el, ps);
        const d = q.decompose(cs.transform);
        parts.push([q.describe(el, ps), q.r3(d[0]), q.r3(d[1]), q.r3(d[2]), q.r3(d[3]), q.r3(Number(cs.opacity))]);
      }
      // Text parts: effective opacity of elements with their own text.
      const texts = [];
      for (const r of q.roots()) for (const el of r.querySelectorAll('*')) {
        if (el.closest('[aria-hidden=true]')) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (own && el.getClientRects().length) texts.push([q.describe(el) + ':' + el.textContent.trim().slice(0, 14), q.r3(q.effOpacity(el))]);
      }
      // Hit test at the rest center of each interactive part.
      let missed = [];
      let maxShift = 0;
      for (const f of window.__finals) {
        if (!f.el.isConnected) continue;
        const hitEl = document.elementFromPoint(f.x, f.y);
        if (hitEl && !(f.el.contains(hitEl) || hitEl.contains(f.el))) missed.push(q.describe(f.el) + '->' + q.describe(hitEl));
        const r = f.el.getBoundingClientRect();
        maxShift = Math.max(maxShift, Math.hypot(r.x + r.width / 2 - f.x, r.y + r.height / 2 - f.y));
      }
      return { parts: parts.slice(0, 24), texts: texts.slice(0, 16), missed, maxShift, n: window.__finals.length };
    });
    values.push({ t, parts: v.parts, texts: v.texts });
    hit.checked = v.n;
    hit.maxShift = Math.max(hit.maxShift, Math.round(v.maxShift * 10) / 10);
    for (const m of v.missed) if (!hit.missed.includes(m)) hit.missed.push(m);
  }
  if (shots) {
    const clip = await page.evaluate((toast) => {
      const rs = window.__qa.roots().map((r) => r.getBoundingClientRect()).filter((r) => r.width && r.height);
      const st = document.querySelector('[data-interaction-stage]').getBoundingClientRect();
      const use = toast ? rs : [st];
      const x0 = Math.max(0, Math.min(...use.map((r) => r.x)) - 8), y0 = Math.max(0, Math.min(...use.map((r) => r.y)) - 8);
      const x1 = Math.min(innerWidth, Math.max(...use.map((r) => r.right)) + 8), y1 = Math.min(innerHeight, Math.max(...use.map((r) => r.bottom)) + 8);
      return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    }, !!cfg.toast);
    for (const t of SHEET_T) {
      await seek(t);
      frames.push(await page.screenshot({ clip }));
    }
  }
  // Release: finish finite ones, play loops again.
  await page.evaluate(() => window.__seekAnims.forEach((a) => { const ct = a.effect.getComputedTiming(); if (ct.iterations === Infinity) a.play(); else a.finish(); }));
  return { meta, values, hit, frames, label };
}

// Summaries of a seek: per part, the peak scale and travel, overshoot past the rest, and the readable time of each text.
function summarizeSeek(values) {
  const byPart = new Map();
  for (const v of values) for (const p of v.parts) {
    const [name, sx, sy, tx, ty, op] = p;
    if (!byPart.has(name)) byPart.set(name, []);
    byPart.get(name).push({ t: v.t, sx, sy, tx, ty, op });
  }
  const parts = [];
  for (const [name, arr] of byPart) {
    const end = arr[arr.length - 1];
    const minS = Math.min(...arr.map((a) => Math.min(a.sx, a.sy))), maxS = Math.max(...arr.map((a) => Math.max(a.sx, a.sy)));
    const maxT = Math.max(...arr.map((a) => Math.max(Math.abs(a.tx - end.tx), Math.abs(a.ty - end.ty))));
    const opMin = Math.min(...arr.map((a) => a.op));
    const moving = arr.filter((a) => Math.abs(a.sx - end.sx) > 0.004 || Math.abs(a.sy - end.sy) > 0.004 || Math.abs(a.tx - end.tx) > 0.4 || Math.abs(a.ty - end.ty) > 0.4 || Math.abs(a.op - end.op) > 0.02);
    const lastMove = moving.length ? moving[moving.length - 1].t : null;
    // Overshoot: the value passes the rest and comes back (scale above 1 when it rose from below, or the travel crosses the rest).
    const firstS = arr[0];
    const overS = firstS.sx < end.sx - 0.004 ? Math.max(...arr.map((a) => a.sx)) - end.sx : firstS.sx > end.sx + 0.004 ? end.sx - Math.min(...arr.map((a) => a.sx)) : Math.max(...arr.map((a) => Math.abs(a.sx - end.sx)));
    const sgnX = Math.sign(firstS.tx - end.tx), sgnY = Math.sign(firstS.ty - end.ty);
    const overT = Math.max(sgnX ? Math.max(...arr.map((a) => -sgnX * (a.tx - end.tx))) : 0, sgnY ? Math.max(...arr.map((a) => -sgnY * (a.ty - end.ty))) : 0);
    parts.push({ part: name, scale: [Math.round(minS * 1000) / 1000, Math.round(maxS * 1000) / 1000], travelPx: Math.round(maxT * 10) / 10, opacityMin: opMin, scaleOvershoot: Math.round(Math.max(0, overS) * 1000) / 1000, travelOvershootPx: Math.round(Math.max(0, overT) * 10) / 10, movesUntil: lastMove });
  }
  const texts = new Map();
  for (const v of values) for (const [name, op] of v.texts) {
    if (!texts.has(name)) texts.set(name, { first: v.t, readableAt: null, min: op });
    const r = texts.get(name);
    r.min = Math.min(r.min, op);
    if (r.readableAt === null && op >= 0.9) r.readableAt = v.t;
  }
  const textOut = [...texts.entries()].filter(([, r]) => r.min < 0.9).map(([n, r]) => ({ text: n, readableAt: r.readableAt, appearedAt: r.first }));
  return { parts: parts.filter((p) => p.movesUntil !== null || p.opacityMin < 1), readable: textOut };
}

async function restCheck(page, cfg, waitMs) {
  await page.waitForTimeout(waitMs);
  return page.evaluate((chk) => {
    const q = window.__qa;
    const left = [];
    const held = [];
    for (const a of document.getAnimations()) {
      const ct = a.effect.getComputedTiming();
      const nm = q.describe(a.effect.target, a.effect.pseudoElement) + ' ' + (a.animationName || a.transitionProperty || a.id);
      if (ct.iterations === Infinity) continue;
      if (a.playState === 'running' || a.playState === 'paused') left.push(nm + ' ' + a.playState);
      else if (a.playState === 'finished' && /forwards|both/.test(a.effect.getTiming().fill)) held.push(nm);
    }
    const inline = [];
    for (const r of q.roots()) for (const el of r.querySelectorAll('[style]')) if (/transform|opacity|translate|scale/.test(el.getAttribute('style'))) inline.push(q.describe(el) + ' ' + el.getAttribute('style').slice(0, 60));
    const ghosts = q.roots().reduce((n, r) => n + r.querySelectorAll('[inert], [data-ghost], [data-part$=ghost]').length, 0);
    const nodes = q.roots().reduce((n, r) => n + r.querySelectorAll('*').length, 0);
    let custom = null;
    if (chk) { try { custom = (0, eval)(chk); } catch (e) { custom = 'err ' + e.message; } }
    // Indicators: each [data-part=indicator] sits in a current item.
    const ind = [];
    for (const r of q.roots()) for (const el of r.querySelectorAll("[data-part='indicator']")) {
      const host = el.closest("[aria-selected], [aria-current], [aria-checked], [data-state='on'], [data-active]");
      ind.push(host ? (host.getAttribute('aria-selected') === 'false' || host.getAttribute('aria-checked') === 'false' ? 'NOT-CURRENT ' + q.describe(host) : 'ok') : 'no-host ' + q.describe(el.parentElement));
    }
    return { left, held, inline: inline.slice(0, 10), ghosts, nodes, indicators: ind.filter((x) => x !== 'ok').length ? ind : `${ind.length} ok`, custom };
  }, cfg.check || null);
}

async function rapid(page, cfg) {
  const before = await page.evaluate(() => window.__qa.roots().reduce((n, r) => n + r.querySelectorAll('*').length, 0));
  if (cfg.actRapid) await cfg.actRapid(page);
  else if (cfg.keyboard) { await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(30); await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(30); await page.keyboard.press('Tab'); }
  else {
    const h = await page.locator(cfg.rapidSel).first().elementHandle();
    await page.evaluate((el) => { el.click(); setTimeout(() => el.click(), 30); }, h);
  }
  const r = await restCheck(page, cfg, LOOP_IDS.has(cfg.id) ? 5200 : 1600);
  r.nodesBefore = before;
  return r;
}

async function interrupt(page, cfg) {
  if (!cfg.reverseSel) return null;
  const a = await page.locator(cfg.rapidSel || '[data-interaction-trigger]').first().elementHandle();
  const b = await page.locator(cfg.reverseSel).first().elementHandle();
  await page.evaluate(([x, y]) => { x.click(); setTimeout(() => y.click(), 90); }, [a, b]);
  return restCheck(page, cfg, LOOP_IDS.has(cfg.id) ? 5200 : 1600);
}

async function tenFast(page, cfg) {
  if (!cfg.tenFastSel) return null;
  const h = await page.locator(cfg.tenFastSel).first().elementHandle();
  const before = await page.evaluate((c) => (0, eval)(c), cfg.check);
  const s = await sample(page, async () => { await page.evaluate((el) => { for (let i = 0; i < 10; i++) setTimeout(() => el.click(), i * 30); }, h); }, { ms: 1600 });
  // Rolls: start times of digit animations, clustered within 20ms.
  const starts = s.anims.filter((a) => /roll|digit|fade/i.test(a.name) || a.props.includes('transform') || a.props.includes('opacity')).map((a) => a.first).sort((x, y) => x - y);
  const clusters = [];
  for (const t of starts) if (!clusters.length || t - clusters[clusters.length - 1] > 20) clusters.push(t);
  const after = await restCheck(page, cfg, 1200);
  return { before, after: after.custom, rest: { left: after.left, held: after.held, inline: after.inline }, motionStarts: clusters, windowMs: 300 };
}

async function offCheck(page, cfg, style) {
  const row = rows[cfg.id];
  if (row.drive !== 'css' || !row.off) return null;
  const css = '@layer ds.recipes {' + Object.entries(row.off).map(([sel, decls]) => `[data-style='${style}'] ${sel} {` + Object.entries(decls).map(([k, v]) => `${k}: ${v};`).join(' ') + '}').join('\n') + '}';
  await page.evaluate((css) => { const s = document.createElement('style'); s.id = 'qa-off'; s.textContent = css; document.head.appendChild(s); }, css);
  if (cfg.pre) { await cfg.pre(page); await settle(page, 500); }
  if (cfg.hover) await page.mouse.move(2, 2);
  await settle(page, 300);
  const sk = await seekPhase(page, cfg, { step: 30, until: 600 });
  const sum = summarizeSeek(sk.values);
  await page.evaluate(() => document.getElementById('qa-off').remove());
  return { injected: css, animations: sk.meta.count, moving: sum.parts.filter((p) => p.travelPx > 0.4 || p.scale[0] < 0.996 || p.scale[1] > 1.004).map((p) => `${p.part} travel ${p.travelPx}px scale ${p.scale.join('..')} opacityMin ${p.opacityMin}`), fading: sum.parts.filter((p) => p.opacityMin < 0.98).map((p) => p.part) };
}

// Luminance curve of the stage over a loop, by seeking (deterministic).
async function flashCheck(page, cfg, untilMs) {
  await cfg.act(page);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.evaluate(() => { window.__fl = document.getAnimations(); window.__fl.forEach((a) => a.pause()); });
  const clip = await page.evaluate(() => { const r = document.querySelector('[data-interaction-stage]').getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(innerWidth - r.x, r.width), height: Math.min(innerHeight - r.y, r.height) }; });
  const lum = [];
  let prev = null;
  let maxPix = 0;
  for (let t = 0; t <= untilMs; t += 50) {
    await page.evaluate((t) => window.__fl.forEach((a) => { a.currentTime = t; }), t);
    const buf = await page.screenshot({ clip });
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    const L = new Float32Array(info.width * info.height);
    let sum = 0;
    for (let i = 0, p = 0; i < data.length; i += info.channels, p++) {
      const c = [data[i], data[i + 1], data[i + 2]].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      L[p] = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      sum += L[p];
    }
    // Pixels that changed by 10% or more of luminance since the last sample (WCAG general flash, pair darker below 0.8).
    let changed = 0;
    if (prev) for (let p = 0; p < L.length; p++) { const d = Math.abs(L[p] - prev[p]); if (d >= 0.1 && Math.min(L[p], prev[p]) < 0.8) changed++; }
    maxPix = Math.max(maxPix, changed);
    lum.push([t, Math.round((sum / L.length) * 10000) / 10000, changed]);
    prev = L;
  }
  await page.evaluate(() => window.__fl.forEach((a) => { if (a.effect.getComputedTiming().iterations === Infinity) a.play(); else a.finish(); }));
  // Count luminance reversals of the changed-pixel area per second.
  let peaks = 0;
  for (let i = 1; i < lum.length - 1; i++) if (lum[i][2] > 20 && lum[i][2] >= lum[i - 1][2] && lum[i][2] > lum[i + 1][2]) peaks++;
  return { stepMs: 50, maxChangedPixels: maxPix, stageArea: Math.round(clip.width * clip.height), changePeaksPerSecond: Math.round((peaks / (untilMs / 1000)) * 100) / 100, curve: lum.filter((_, i) => i % 2 === 0).map((x) => x.join(':')).join(' ') };
}

async function pauseCheck(page, cfg) {
  // Import pauseLoops from the dev server and prove it pauses the loop of this stage.
  await cfg.act(page);
  await page.waitForTimeout(250);
  return page.evaluate(async () => {
    const run = () => document.getAnimations().filter((a) => a.playState === 'running' && (a.effect.getComputedTiming().iterations > 1)).map((a) => window.__qa.describe(a.effect.target, a.effect.pseudoElement) + ' ' + (a.animationName || a.id) + ' x' + a.effect.getComputedTiming().iterations);
    const loopsBefore = run();
    let mod = null;
    for (const u of ['/@id/@the-system/motion', '/@fs/home/user/TheDesignSystem/packages/motion/src/index.ts', '/packages/motion/src/index.ts']) { try { mod = await import(u); if (mod.pauseLoops) break; } catch { /* next */ } }
    if (!mod || !mod.pauseLoops) return { loopsBefore, error: 'pauseLoops not importable' };
    const n = mod.pauseLoops(document);
    const t1 = document.getAnimations().map((a) => a.currentTime);
    await new Promise((r) => setTimeout(r, 400));
    const t2 = document.getAnimations().map((a) => a.currentTime);
    const still = run();
    const moved = t1.filter((v, i) => v !== t2[i]).length;
    mod.resumeLoops(document);
    return { loopsBefore, paused: n, runningAfterPause: still, timesAdvancedWhilePaused: moved, resumedRunning: run().length };
  });
}

async function attrRest(page) {
  // After the reduced trigger: parts still drawn off their rest (size or place change that stays).
  return page.evaluate(() => {
    const q = window.__qa;
    const out = [];
    for (const r of q.roots()) for (const el of [...r.querySelectorAll('*')]) {
      for (const ps of [null, '::before', '::after']) {
        const tf = getComputedStyle(el, ps).transform;
        if (tf && tf !== 'none') { const d = q.decompose(tf); if (Math.abs(d[0] - 1) > 0.004 || Math.abs(d[1] - 1) > 0.004 || Math.abs(d[3]) > 0.4) out.push(`${q.describe(el, ps)} s${q.r3(d[0])},${q.r3(d[1])} t${q.r3(d[2])},${q.r3(d[3])}`); }
      }
    }
    return [...new Set(out)].slice(0, 20);
  });
}

function trimRun(r) {
  return { ...r, anims: r.anims.slice(0, 18).map((a) => { const o = { ...a }; if (o.kf && JSON.stringify(o.kf).length > 400) o.kf = o.kf.slice(0, 3); return o; }), animCount: r.anims.length };
}

async function measure(browser, id) {
  const cfg = { ...ids[id], id };
  const row = rows[id];
  const out = { id, family: cfg.family, drive: row.drive, pattern: row.pattern, primitive: row.primitive, reducedSays: row.reduced, styles: {}, sheet: `${id}.sheet.png` };
  const sheetRows = [];
  for (const style of STYLES) {
    const so = (out.styles[style] = {});
    const scheme = schemeOf(style);
    // Full, LTR: focus, sweep, seek and frames, real time sample, rapid, interrupt, ten fast, off.
    {
      const ctx = await newCtx(browser, 'full');
      const page = await openPage(ctx, { id, style, scheme, dir: 'ltr' });
      await installHelpers(page);
      await page.waitForTimeout(500);
      so.focus = id === 'skip-link-slide' ? null : await focusCheck(page);
      await page.keyboard.press('Escape').catch(() => {});
      await page.mouse.move(2, 2);
      so.transitionSweep = await page.evaluate(() => window.__qa.sweep());
      if (cfg.pre) await cfg.pre(page);
      await settle(page, 700);
      const sk = await seekPhase(page, cfg, { shots: true, label: style });
      so.seek = { animations: sk.meta.count, startOffsets: sk.meta.offsets.slice(0, 12), hit: sk.hit, ...summarizeSeek(sk.values) };
      sheetRows.push({ style, frames: sk.frames });
      so.transitionSweepAfter = await page.evaluate(() => window.__qa.sweep());
      await settle(page, 800);
      if (cfg.hover) { await page.mouse.move(2, 2); await settle(page, 600); }
      so.full = trimRun(await sample(page, cfg.act, { ms: LOOP_IDS.has(id) ? 5600 : cfg.longMs || 1500 }));
      if (cfg.hover) { await page.mouse.move(2, 2); }
      await settle(page, 600);
      if (cfg.extraAct) { so.fullExtra = trimRun(await sample(page, cfg.extraAct, { ms: 1500 })); await settle(page, 600); }
      so.rapid = await rapid(page, cfg);
      await settle(page, 300);
      so.interrupt = await interrupt(page, cfg);
      await settle(page, 300);
      so.tenFast = await tenFast(page, cfg);
      await settle(page, 300);
      if (LOOP_IDS.has(id) || id === 'progress-celebrate') {
        await settle(page, 300);
        so.flash = await flashCheck(page, cfg, LOOP_IDS.has(id) ? 4600 : 1000);
        await settle(page, 300);
      }
      if (LOOP_IDS.has(id)) { so.pause = await pauseCheck(page, cfg); await settle(page, 300); }
      so.off = await offCheck(page, cfg, style);
      await ctx.close();
    }
    // Full RTL, then media and attr in both directions: real time sample only.
    for (const [motion, dir] of [['full', 'rtl'], ['media', 'ltr'], ['media', 'rtl'], ['attr', 'ltr'], ['attr', 'rtl']]) {
      const ctx = await newCtx(browser, motion);
      const page = await openPage(ctx, { id, style, scheme, dir });
      await installHelpers(page);
      if (motion === 'attr') await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduce'));
      await page.waitForTimeout(400);
      if (cfg.pre) await cfg.pre(page);
      await settle(page, 600);
      const r = trimRun(await sample(page, cfg.act, { ms: LOOP_IDS.has(id) ? 3000 : 1200 }));
      if (motion !== 'full') r.restOffTransforms = await attrRest(page);
      else r.rapid = await rapid(page, cfg);
      so[`${motion}.${dir}`] = r;
      await ctx.close();
    }
  }
  // Contact sheet: one row per style, 8 frames.
  const cellW = 300;
  const cells = [];
  let rowH = 0;
  const scaled = [];
  for (const r of sheetRows) {
    const row = [];
    for (const f of r.frames) {
      const img = sharp(f);
      const m = await img.metadata();
      const w = Math.min(cellW, m.width);
      const buf = await sharp(f).resize({ width: w }).png().toBuffer();
      const mm = await sharp(buf).metadata();
      rowH = Math.max(rowH, mm.height);
      row.push({ buf, w: mm.width, h: mm.height });
    }
    scaled.push({ style: r.style, row });
  }
  const labelW = 70;
  const W = labelW + 8 * (cellW + 4);
  const H = scaled.length * (rowH + 18) + 18;
  const comps = [];
  const svgText = [`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#808080"/>`];
  SHEET_T.forEach((t, i) => svgText.push(`<text x="${labelW + i * (cellW + 4) + 4}" y="13" font-family="sans-serif" font-size="12" fill="#fff">${t}ms</text>`));
  scaled.forEach((r, ri) => {
    const y = 18 + ri * (rowH + 18);
    svgText.push(`<text x="4" y="${y + 14}" font-family="sans-serif" font-size="12" fill="#fff">${r.style}</text>`);
    r.row.forEach((c, i) => comps.push({ input: c.buf, left: labelW + i * (cellW + 4), top: y }));
  });
  svgText.push(`<text x="4" y="${H - 4}" font-family="sans-serif" font-size="11" fill="#fff">${id}: paused and seeked, LTR, Studio and Desk dark, Neutral light</text></svg>`);
  await sharp(Buffer.from(svgText.join(''))).composite(comps).png().toFile(path.join(OUT, `${id}.sheet.png`));
  fs.writeFileSync(path.join(OUT, `${id}.measure.json`), JSON.stringify(out, null, 1));
  return out;
}

(async () => {
  const list = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ids);
  const browser = await chromium.launch();
  for (const id of list) {
    const t = Date.now();
    try {
      await measure(browser, id);
      const kb = Math.round(fs.statSync(path.join(OUT, `${id}.measure.json`)).size / 1024);
      console.log(`${id} done ${Math.round((Date.now() - t) / 1000)}s ${kb}KB`);
    } catch (e) {
      console.log(`${id} FAILED ${e.message.split('\n')[0]}`);
    }
  }
  await browser.close();
})();
