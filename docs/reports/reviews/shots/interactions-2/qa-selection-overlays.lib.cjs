// ds-qa review of order 1.22, selection and overlays families. Shared helpers
// and the scenario of each interaction id. Read only on the product: it only
// drives the gallery page and reads the DOM.
const { install } = require('./probe.cjs');

const BASE = 'http://127.0.0.1:5190';
const KEEP = new Set(['transform', 'opacity', 'translate', 'scale', 'rotate']);

async function newCtx(browser, { motion = 'full' } = {}) {
  return browser.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1, reducedMotion: motion === 'media' ? 'reduce' : 'no-preference' });
}

async function goto(page, { id, style, scheme, dir, motion }) {
  const rtl = dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
  await page.goto(`${BASE}/interactions?focus=${id}&style=${style}&scheme=${scheme}&chrome=0${rtl}`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('[data-interaction-stage]', { timeout: 60000 });
  if (motion === 'attr') await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduce'));
  await page.waitForTimeout(250);
  await settle(page);
}

async function settle(page) {
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { if (Number.isFinite(a.effect.getComputedTiming().endTime)) a.finish(); } catch { /* */ } }));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function center(page, sel) {
  const b = await page.locator(sel).first().boundingBox();
  if (!b) throw new Error('no box for ' + sel);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
}
async function press(page, sel, hold = 90) {
  const c = await center(page, sel);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await sleep(hold);
  await page.mouse.up();
}
async function hover(page, sel) {
  const c = await center(page, sel);
  await page.mouse.move(c.x, c.y, { steps: 2 });
}
async function clickF(page, sel) {
  await page.locator(sel).first().click({ force: true, timeout: 5000 });
}

// Sample one action with the shared probe, then trim.
async function run(page, name, act, { ms = 900, stateSel, inspect, readable } = {}) {
  await install(page, { triggerSel: stateSel || '[data-interaction-trigger]', ms });
  const before = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const o = {};
    for (const a of el.attributes) if (/^(aria-(pressed|checked|expanded|selected|invalid|current|valuenow)|data-state|data-selected)$/.test(a.name)) o[a.name] = a.value;
    return o;
  }, stateSel || '[data-interaction-trigger]');
  const activeBefore = await page.evaluate(() => { const a = document.activeElement; return a ? a.tagName + (a.getAttribute('data-part') ? '[' + a.getAttribute('data-part') + ']' : '') + (a.id ? '#' + a.id : '') : null; });
  await page.evaluate(() => window.__probe.start());
  const t0 = Date.now();
  let err = null;
  try { await act(page); } catch (e) { err = String(e.message || e).slice(0, 200); }
  const actMs = Date.now() - t0;
  let readableRes;
  if (readable) {
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    readableRes = await readableTimes(page, readable).catch((e) => String(e));
  }
  await page.waitForFunction(() => window.__probeDone === true, null, { timeout: ms + 30000 });
  const res = await page.evaluate(() => ({ animations: [...window.__probe.seen.values()], frames: window.__probe.frames }));
  const anims = res.animations.map((a) => ({
    kind: a.kind === 'CSSTransition' ? 'tr' : a.kind === 'CSSAnimation' ? 'css' : 'waapi',
    name: a.name,
    target: a.target,
    props: a.props,
    dur: Number.isFinite(a.duration) ? Math.round(a.duration) : String(a.duration),
    delay: Math.round(a.delay || 0),
    iter: a.iterations === Infinity ? 'inf' : a.iterations,
    ease: ((a.easing && a.easing !== 'linear') ? a.easing : ((a.keyframes && a.keyframes[0] && a.keyframes[0].easing) || 'linear')).slice(0, 48),
    kf: summarizeKf(a.keyframes),
    seen: [a.first, a.last],
  }));
  const badProps = [...new Set(res.animations.flatMap((a) => a.props).filter((p) => !KEEP.has(p)))];
  const key = JSON.stringify;
  const changed = res.frames.find((f) => f.state && before && Object.keys({ ...before, ...f.state }).some((k) => k !== 'value' && key(f.state[k]) !== key(before[k])));
  const focusMoved = res.frames.find((f) => f.active && f.active !== describeLike(activeBefore));
  const out = {
    run: name,
    actMs,
    err,
    stateBefore: before,
    stateAfter: res.frames.length ? res.frames[res.frames.length - 1].state : null,
    stateAt: changed ? changed.t : null,
    firstMotionAt: anims.length ? Math.min(...anims.map((a) => a.seen[0])) : null,
    focusAt: focusMoved ? focusMoved.t : null,
    activeAfter: res.frames.length ? res.frames[res.frames.length - 1].active : null,
    ringAtFocus: focusMoved ? focusMoved.ring : null,
    longest: anims.reduce((m, a) => Math.max(m, (a.delay || 0) + (typeof a.dur === 'number' ? a.dur * (typeof a.iter === 'number' ? a.iter : 1) : 0)), 0),
    infinite: anims.filter((a) => a.iter === 'inf').map((a) => a.target),
    badProps,
    anims: dedupe(anims),
  };
  if (readableRes) out.readable = readableRes;
  if (inspect) out.inspect = await page.evaluate(inspect).catch((e) => String(e));
  out.transitionCheck = await transitionCheck(page);
  await sleep(Math.min(out.longest, 1500) + 150);
  out.rest = await restCheck(page);
  return out;
}

function describeLike(s) { return s; }

function summarizeKf(kf) {
  if (!kf || !kf.length) return undefined;
  const pick = (k) => { const o = {}; for (const p of ['transform', 'opacity', 'translate', 'scale', 'rotate']) if (k[p] !== undefined) o[p] = String(k[p]).slice(0, 60); if (k.offset !== undefined && k.offset !== null) o.o = Math.round(k.offset * 100) / 100; return o; };
  if (kf.length <= 3) return kf.map(pick);
  return [pick(kf[0]), pick(kf[Math.floor(kf.length / 2)]), pick(kf[kf.length - 1])];
}

// Collapse identical animations on sibling targets (rows), keep a count.
function dedupe(anims) {
  const m = new Map();
  for (const a of anims) {
    const k = [a.kind, a.name, a.target, a.props.join(), a.dur, a.ease].join('|');
    const e = m.get(k);
    if (e) { e.n += 1; e.delays.add(a.delay); e.seen[1] = Math.max(e.seen[1], a.seen[1]); }
    else m.set(k, { ...a, n: 1, delays: new Set([a.delay]) });
  }
  return [...m.values()].map((a) => { const { delays, ...r } = a; r.delay = [...delays].sort((x, y) => x - y); if (r.delay.length === 1) r.delay = r.delay[0]; return r; });
}

// Elements whose computed transition names a property that is not transform or opacity.
async function transitionCheck(page) {
  return page.evaluate(() => {
    const ok = new Set(['transform', 'opacity', 'translate', 'scale', 'rotate', 'none']);
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('[data-gallery="interactions-bar"]')) continue;
      const cs = getComputedStyle(el);
      const props = cs.transitionProperty.split(',').map((s) => s.trim());
      const durs = cs.transitionDuration.split(',').map((s) => parseFloat(s));
      props.forEach((p, i) => {
        const d = durs[i % durs.length];
        if (!ok.has(p) && !p.startsWith('--') && d > 0) bad.push(`${el.tagName.toLowerCase()}${el.getAttribute('data-ds') ? '[ds=' + el.getAttribute('data-ds') + ']' : ''}${el.getAttribute('data-part') ? '[' + el.getAttribute('data-part') + ']' : ''} ${p} ${d}s`);
      });
    }
    return [...new Set(bad)].slice(0, 12);
  });
}

// After the motion: anything still running, any finished animation still holding a fill.
async function restCheck(page) {
  return page.evaluate(() => {
    const d = (el) => el ? `${el.tagName.toLowerCase()}${el.getAttribute('data-part') ? '[' + el.getAttribute('data-part') + ']' : ''}${el.getAttribute('data-ds') ? '[ds=' + el.getAttribute('data-ds') + ']' : ''}` : '?';
    const running = [];
    const held = [];
    for (const a of document.getAnimations()) {
      const t = a.effect && a.effect.getComputedTiming();
      const tgt = a.effect && a.effect.target;
      if (a.playState === 'running' && t && t.iterations !== Infinity) running.push(d(tgt) + ' ' + (a.animationName || a.transitionProperty || a.id || 'waapi'));
      if (a.playState === 'finished' && t && (t.fill === 'forwards' || t.fill === 'both')) {
        const cs = tgt ? getComputedStyle(tgt) : null;
        held.push(`${d(tgt)} ${a.animationName || a.id || 'waapi'} fill=${t.fill} transform=${cs ? cs.transform : ''} opacity=${cs ? cs.opacity : ''}`);
      }
    }
    // Animated targets that are still in the document: not at rest if transform is not identity or opacity is between 0 and 1.
    const offRest = [];
    if (window.__probe) {
      const seenT = new Set();
      for (const a of window.__probe.seen.keys()) {
        const tgt = a.effect && a.effect.target;
        if (!tgt || seenT.has(tgt) || !tgt.isConnected) continue;
        seenT.add(tgt);
        const cs = getComputedStyle(tgt, a.effect.pseudoElement || null);
        const tr = cs.transform;
        const id = tr === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(tr);
        const op = parseFloat(cs.opacity);
        if (!id || (op > 0 && op < 1)) offRest.push(`${d(tgt)}${a.effect.pseudoElement || ''} transform=${tr} opacity=${op}`);
      }
    }
    return { running, held: held.slice(0, 8), heldCount: held.length, offRest: offRest.slice(0, 10) };
  });
}

// Where each row of a list reaches opacity >= 0.9, by pausing and seeking
// every animation (needs the animations to be created already).
async function readableTimes(page, rowSel, { step = 10, max = 600 } = {}) {
  return page.evaluate(({ rowSel, step, max }) => {
    const rows = [...document.querySelectorAll(rowSel)];
    const anims = document.getAnimations();
    const base = anims.map((a) => a.currentTime || 0);
    anims.forEach((a) => a.pause());
    const op = (el) => { let o = 1; for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
    const at = rows.map(() => null);
    for (let t = 0; t <= max; t += step) {
      anims.forEach((a) => { try { a.currentTime = t; } catch { /* */ } });
      rows.forEach((r, i) => { if (at[i] === null && op(r) >= 0.9) at[i] = t; });
      if (at.every((x) => x !== null)) break;
    }
    anims.forEach((a) => { try { a.play(); } catch { /* */ } });
    return { rows: rows.length, base0: Math.round(base[0] || 0), readableAt: at };
  }, { rowSel, step, max });
}

// The interactions of the two families, with the runs each one plays.
const T = '[data-interaction-trigger]';
const scenarios = {
  // ---------------- selection
  'check-draw': {
    runs: [
      { name: 'press-check', act: (p) => press(p, T, 90) },
      { name: 'uncheck', act: (p) => clickF(p, T) },
      { name: 'select-all', stateSel: "[data-part='select-all'] [role=checkbox]", act: (p) => clickF(p, "[data-part='select-all'] [role=checkbox]") },
    ],
  },
  'radio-pop': {
    runs: [
      { name: 'press-pick-svg', act: (p) => press(p, "[role=radio][value='svg']", 90) },
      { name: 'arrow-pick-pdf', stateSel: "[role=radio][value='pdf']", act: async (p) => { await p.keyboard.press('ArrowDown'); } },
    ],
  },
  'radio-card-lift': {
    runs: [
      { name: 'press-pick-solo', act: (p) => press(p, T, 90) },
      { name: 'pick-team', act: (p) => clickF(p, "[role=radio][value='team']") },
    ],
  },
  'slider-pull': {
    runs: [
      {
        name: 'grab-drag-release',
        stateSel: '[data-ds=slider] [role=slider]',
        ms: 1300,
        act: async (p) => {
          const c = await center(p, '[data-ds=slider] [role=slider]');
          await p.mouse.move(c.x, c.y); await p.mouse.down(); await sleep(250);
          await p.mouse.move(c.x + 40, c.y, { steps: 4 }); await sleep(150); await p.mouse.up();
        },
      },
    ],
  },
  'slider-bubble': {
    runs: [
      {
        name: 'grab-drag-release',
        stateSel: '[data-ds=slider] [role=slider]',
        ms: 1400,
        act: async (p) => {
          const c = await center(p, '[data-ds=slider] [role=slider]');
          await p.mouse.move(c.x, c.y); await p.mouse.down(); await sleep(250);
          await p.mouse.move(c.x + 60, c.y, { steps: 3 }); await sleep(300); await p.mouse.up();
        },
      },
    ],
  },
  'slider-nudge': {
    runs: [
      { name: 'key-past-max', stateSel: '[role=slider]', act: async (p) => { await p.focus('[role=slider]'); await p.keyboard.press('ArrowRight'); } },
    ],
  },
  'picker-chevron-turn': {
    runs: [
      { name: 'open', act: (p) => clickF(p, T) },
      { name: 'close-escape', act: (p) => p.keyboard.press('Escape') },
    ],
  },
  'menu-rows': {
    runs: [
      { name: 'open', ms: 1000, act: (p) => clickF(p, T), readable: '[role=listbox] [role=option]' },
      { name: 'close-escape', act: (p) => p.keyboard.press('Escape') },
    ],
  },
  'picker-value-roll': {
    runs: [
      { name: 'open', act: (p) => clickF(p, T) },
      { name: 'pick-cherry', act: (p) => clickF(p, "[role=option]:has-text('Cherry')") },
    ],
  },
  'row-glide': {
    runs: [
      { name: 'arrow-down', stateSel: '[role=listbox]', prep: async (p) => { await p.focus('[role=option][tabindex="0"]'); }, act: (p) => p.keyboard.press('ArrowDown'), inspect: () => document.activeElement && document.activeElement.textContent },
      { name: 'arrow-down-2', stateSel: '[role=listbox]', act: (p) => p.keyboard.press('ArrowDown') },
      { name: 'hover-list-row', stateSel: '[data-ds=list]', prep: (p) => hover(p, '[data-ds=list] [data-part=item] >> nth=0'), act: (p) => hover(p, '[data-ds=list] [data-part=item] >> nth=1') },
    ],
  },
  'collection-flip': {
    runs: [
      { name: 'add', act: (p) => clickF(p, T), inspect: () => document.querySelectorAll('[data-ds=list] [data-part=item]').length },
      { name: 'remove-first', act: (p) => clickF(p, "button:has-text('Remove the first')"), inspect: () => document.querySelectorAll('[data-ds=list] [data-part=item]').length },
      { name: 'reverse', act: (p) => clickF(p, "button:has-text('Reverse the order')") },
    ],
  },
  'chip-check-pop': {
    runs: [
      { name: 'select', act: (p) => clickF(p, T) },
      { name: 'clear', act: (p) => clickF(p, T) },
    ],
  },
  'filter-count-roll': {
    runs: [
      { name: 'pick-images', stateSel: '[data-ds=filter-bar] [data-ds=chip]', act: (p) => clickF(p, '[data-ds=filter-bar] [data-ds=chip] >> nth=0'), inspect: () => document.querySelector('[data-part=count] [data-visually-hidden]').textContent },
      { name: 'pick-video', stateSel: '[data-ds=filter-bar] [data-ds=chip]:nth-child(2)', act: (p) => clickF(p, '[data-ds=filter-bar] [data-ds=chip] >> nth=1') },
    ],
  },
  'list-stagger': {
    runs: [{ name: 'repaint', ms: 1000, act: (p) => clickF(p, T), readable: '[data-ds=list] [data-part=item]' }],
  },
  // ---------------- overlays
  'menu-origin': {
    runs: [
      {
        name: 'open', ms: 1000, act: (p) => clickF(p, T), readable: "[data-ds='dropdown-menu'] [data-part=text]",
        inspect: () => {
          const m = document.querySelector("[data-ds='dropdown-menu']");
          const t = document.querySelector('[data-interaction-trigger]');
          if (!m) return null;
          const r = m.getBoundingClientRect(); const tr = t.getBoundingClientRect();
          return { origin: getComputedStyle(m).transformOrigin, radixOrigin: getComputedStyle(m).getPropertyValue('--radix-dropdown-menu-content-transform-origin'), menu: [Math.round(r.left), Math.round(r.right)], trigger: [Math.round(tr.left), Math.round(tr.right)], side: m.getAttribute('data-side'), align: m.getAttribute('data-align') };
        },
      },
      { name: 'close-escape', act: (p) => p.keyboard.press('Escape') },
      { name: 'context-open', stateSel: "[data-ds='context-menu'], [tabindex='0']", act: async (p) => { const c = await center(p, "div[tabindex='0']"); await p.mouse.click(c.x, c.y, { button: 'right' }); } },
      { name: 'context-close', act: (p) => p.keyboard.press('Escape') },
    ],
  },
  'menu-row-slide': {
    runs: [
      { name: 'arrow-down', stateSel: "[data-ds='dropdown-menu']", prep: async (p) => { await clickF(p, T); await sleep(500); await settle(p); }, act: (p) => p.keyboard.press('ArrowDown') },
      { name: 'arrow-down-sep', stateSel: "[data-ds='dropdown-menu']", act: async (p) => { await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await sleep(40); await p.keyboard.press('ArrowDown'); } },
      { name: 'hover-row', stateSel: "[data-ds='dropdown-menu']", act: async (p) => hover(p, "[data-ds='dropdown-menu'] [role=menuitem] >> nth=1") },
      { name: 'menubar-arrow', stateSel: '[role=menubar]', prep: async (p) => { await p.keyboard.press('Escape'); await sleep(300); await clickF(p, "[role=menubar] [role=menuitem] >> nth=0"); await sleep(500); await settle(p); }, act: (p) => p.keyboard.press('ArrowRight') },
    ],
  },
  'menu-submenu-nudge': {
    runs: [
      { name: 'light-sub-row', stateSel: "[data-part='sub-trigger']", prep: async (p) => { await clickF(p, T); await sleep(500); await settle(p); }, act: async (p) => { await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); } },
      { name: 'open-sub', stateSel: "[data-part='sub-trigger']", act: (p) => p.keyboard.press(p.__dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight') },
      { name: 'leave-row', stateSel: "[data-part='sub-trigger']", act: async (p) => { await p.keyboard.press(p.__dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'); await p.keyboard.press('ArrowUp'); } },
    ],
  },
  'popover-spring': {
    runs: [
      { name: 'open', act: (p) => clickF(p, T) },
      { name: 'close-escape', act: (p) => p.keyboard.press('Escape') },
      { name: 'hover-card', stateSel: 'a[href="#overlays-profile"]', ms: 1200, act: (p) => hover(p, 'a[href="#overlays-profile"]') },
    ],
  },
  'tooltip-rise': {
    runs: [
      { name: 'hover', ms: 1600, act: (p) => hover(p, T) },
      { name: 'leave', ms: 800, act: (p) => p.mouse.move(5, 5) },
    ],
  },
  'tooltip-follow': {
    runs: [
      { name: 'hover-next', ms: 900, stateSel: "[aria-label='Edit layer']", prep: async (p) => { await hover(p, T); await sleep(1300); await settle(p); }, act: async (p) => { const c = await center(p, "[data-ds='icon-button'] >> nth=1"); await p.mouse.move(c.x, c.y, { steps: 4 }); }, inspect: () => [...document.querySelectorAll('[role=tooltip]')].map((t) => t.textContent) },
    ],
  },
  'dialog-spring': {
    runs: [
      { name: 'open', act: (p) => clickF(p, "[data-interaction-trigger='dialog']"), stateSel: "[data-interaction-trigger='dialog']" },
      { name: 'close-escape', act: (p) => p.keyboard.press('Escape'), stateSel: "[data-interaction-trigger='dialog']" },
      { name: 'alert-open', ms: 1000, act: (p) => clickF(p, "[data-interaction-trigger='alert']"), stateSel: "[data-interaction-trigger='alert']" },
      { name: 'alert-close', act: (p) => p.keyboard.press('Escape'), stateSel: "[data-interaction-trigger='alert']" },
    ],
  },
  'sheet-spring': {
    runs: [
      { name: 'open', act: (p) => clickF(p, "[data-interaction-trigger='sheet']"), stateSel: "[data-interaction-trigger='sheet']" },
      { name: 'close-escape', act: (p) => p.keyboard.press('Escape'), stateSel: "[data-interaction-trigger='sheet']" },
      { name: 'drawer-open', act: (p) => clickF(p, "[data-interaction-trigger='drawer']"), stateSel: "[data-interaction-trigger='drawer']", inspect: () => { const d = document.querySelector("[data-ds='drawer']"); return d ? (() => { const r = d.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right) }; })() : null; } },
      { name: 'drawer-close', act: (p) => p.keyboard.press('Escape'), stateSel: "[data-interaction-trigger='drawer']" },
    ],
  },
  'command-palette-open': {
    runs: [
      { name: 'open', act: (p) => clickF(p, T) },
      { name: 'close-escape', act: (p) => p.keyboard.press('Escape') },
    ],
  },
  'command-palette-results': {
    runs: [
      { name: 'open', ms: 1000, act: (p) => clickF(p, T), readable: "[data-ds='command-palette'] [role=option]" },
      { name: 'type', ms: 900, stateSel: "[data-ds='command-palette'] input", act: (p) => p.keyboard.type('bo', { delay: 30 }) },
    ],
  },
  'command-palette-row-slide': {
    runs: [
      { name: 'arrow-down', stateSel: "[data-ds='command-palette'] input", prep: async (p) => { await clickF(p, T); await sleep(600); await settle(p); }, act: (p) => p.keyboard.press('ArrowDown') },
      { name: 'hover-row', stateSel: "[data-ds='command-palette'] input", act: (p) => hover(p, "[data-ds='command-palette'] [role=option] >> nth=3") },
    ],
  },
  'lightbox-zoom': {
    runs: [
      { name: 'open', ms: 1000, act: (p) => clickF(p, T) },
      { name: 'close-escape', act: (p) => p.keyboard.press('Escape') },
    ],
  },
  'tour-spotlight': {
    runs: [
      { name: 'start', ms: 1000, act: (p) => clickF(p, T) },
      { name: 'next', ms: 1000, act: (p) => clickF(p, "[data-ds='tour'] button:has-text('Next')") },
      { name: 'back', ms: 1000, act: (p) => clickF(p, "[data-ds='tour'] button:has-text('Previous')") },
    ],
  },
  'window-settle': {
    runs: [
      { name: 'open', ms: 1300, act: (p) => clickF(p, T) },
      { name: 'zoom', ms: 1300, act: (p) => clickF(p, "button:has-text('Zoom window')") },
      { name: 'close', ms: 1300, act: (p) => clickF(p, "button:has-text('Close window')") },
    ],
  },
  'window-lights': {
    runs: [
      { name: 'hover', stateSel: "[data-ds='window-controls']", act: (p) => hover(p, "[data-ds='window-controls'] [data-part='minimize']") },
      { name: 'press-zoom', stateSel: "[data-ds='window-controls']", act: (p) => press(p, "[data-ds='window-controls'] [data-part='zoom']", 120) },
      { name: 'leave', stateSel: "[data-ds='window-controls']", act: (p) => p.mouse.move(5, 5) },
    ],
  },
};

module.exports = { BASE, newCtx, goto, settle, sleep, center, press, hover, clickF, run, readableTimes, scenarios, restCheck, transitionCheck };
