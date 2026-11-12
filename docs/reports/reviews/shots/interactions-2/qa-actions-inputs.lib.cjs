// ds-qa review of order 1.22, actions and inputs families (32 ids).
// Shared library: page open, a per frame sampler (extends probe.cjs with a
// per interaction state expression, a hit test, event times and a ring
// sampler), and one spec per interaction id with its real action, its
// reverse and the selectors that matter. Reviewer script, not product code.
const path = require('path');
const BASE = 'http://127.0.0.1:5190';
const OUT = __dirname;
const KEEP = new Set(['transform', 'opacity', 'translate', 'scale', 'rotate']);
const STYLES = [
  { style: 'studio', scheme: 'dark' },
  { style: 'desk', scheme: 'dark' },
  { style: 'neutral', scheme: 'light' },
];
const TOKEN_NAMES = (
  'delay-feedback delay-stagger distance-enter distance-lift distance-nudge distance-shift duration-base duration-celebrate duration-fast duration-instant duration-medium duration-moderate duration-morph duration-quick duration-roll duration-slow duration-spin duration-spring-bouncy duration-spring-snappy duration-spring-soft duration-zoom ' +
  'ease-default ease-emphasized ease-exit ease-in ease-out ease-reveal ease-spring-bouncy ease-spring-snappy ease-spring-soft ease-standard ease-window scale-anticipate scale-enter scale-lift scale-morph scale-pop scale-press scale-stretch'
).split(' ');

async function open(browser, { id, style, scheme, dir = 'ltr', motion = 'full', inject = null }) {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1, reducedMotion: motion === 'media' ? 'reduce' : 'no-preference' });
  try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE }); } catch { /* ok */ }
  const page = await ctx.newPage();
  const rtl = dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
  await page.goto(`${BASE}/interactions?focus=${id}&style=${style}&scheme=${scheme}&chrome=0${rtl}`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('[data-interaction-stage]', { timeout: 60000 });
  if (motion === 'attr') await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduce'));
  if (inject) await page.addStyleTag({ content: inject });
  await page.mouse.move(2, 2);
  await page.waitForTimeout(350);
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { if (a.effect && a.effect.getComputedTiming().iterations !== Infinity) a.finish(); } catch { /* */ } }));
  return { ctx, page };
}

/** Token values on the theme root, by short name. */
async function tokens(page) {
  return page.evaluate((names) => {
    const el = document.querySelector('[data-style]') || document.documentElement;
    const cs = getComputedStyle(el);
    const o = {};
    for (const n of names) o[n] = cs.getPropertyValue(`--ds-${n}`).trim();
    return o;
  }, TOKEN_NAMES);
}

/** Installs the sampler. stateExpr is a JS expression with `stage` in scope. */
async function install(page, { stateExpr = "''", hitSel = '[data-interaction-trigger]', ms = 1200, textSel = null }) {
  await page.evaluate(({ stateExpr, hitSel, ms, textSel }) => {
    const stage = document.querySelector('[data-interaction-stage]');
    // eslint-disable-next-line no-new-func
    const stateFn = new Function('stage', `try { return String(${stateExpr}); } catch (e) { return 'ERR ' + e.message; }`);
    const describe = (el) => {
      if (!el || !el.tagName) return String(el);
      const p = el.getAttribute('data-part') || el.getAttribute('data-ds') || el.getAttribute('role');
      const par = el.parentElement && (el.parentElement.getAttribute('data-part') || el.parentElement.getAttribute('data-ds'));
      return `${par ? par + '>' : ''}${el.tagName.toLowerCase()}${p ? `[${p}]` : ''}`;
    };
    const seen = new Map();
    const frames = [];
    const events = [];
    let t0 = null;
    const hitEl = hitSel ? stage.querySelector(hitSel) || document.querySelector(hitSel) : null;
    let hitPt = null;
    for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'focusin', 'submit', 'input']) {
      document.addEventListener(type, (e) => { if (t0 !== null) events.push({ type, t: Math.round(performance.now() - t0), target: describe(e.target) }); }, true);
    }
    const tick = () => {
      if (t0 === null) return;
      const t = performance.now() - t0;
      for (const a of document.getAnimations()) {
        const eff = a.effect;
        const tgt = eff && eff.target;
        let rec = seen.get(a);
        if (!rec) {
          const timing = eff ? eff.getComputedTiming() : {};
          let props = [];
          try {
            props = a.transitionProperty ? [a.transitionProperty] : [...new Set(eff.getKeyframes().flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))];
          } catch { /* */ }
          let kf = [];
          try {
            kf = eff.getKeyframes().map((k) => { const o = {}; for (const [kk, v] of Object.entries(k)) if (v !== null && v !== undefined && kk !== 'computedOffset' && !(kk === 'composite' && v === 'auto') && !(kk === 'easing' && v === 'linear')) o[kk] = typeof v === 'string' && v.length > 60 ? v.slice(0, 60) + '..' : v; return o; });
          } catch { /* */ }
          rec = {
            kind: a.constructor.name.replace('CSS', ''),
            name: a.animationName || a.transitionProperty || a.id || '',
            target: describe(tgt) + (eff && eff.pseudoElement ? eff.pseudoElement : ''),
            props,
            duration: Math.round(timing.duration * 10) / 10,
            delay: timing.delay,
            iterations: timing.iterations === Infinity ? 'inf' : timing.iterations,
            easing: eff ? eff.getTiming().easing : null,
            composite: eff && eff.composite,
            fill: eff ? eff.getTiming().fill : null,
            keyframes: kf.slice(0, 6),
            first: Math.round(t),
            last: Math.round(t),
          };
          seen.set(a, rec);
        }
        rec.last = Math.round(t);
        rec.playState = a.playState;
      }
      let hit = null;
      if (hitEl && hitPt) {
        const at = document.elementFromPoint(hitPt.x, hitPt.y);
        hit = at === hitEl || hitEl.contains(at) ? 'ok' : describe(at);
        if (getComputedStyle(hitEl).pointerEvents !== 'auto') hit += ' pe=' + getComputedStyle(hitEl).pointerEvents;
      }
      let x;
      if (textSel) {
        const e = stage.querySelector(textSel);
        if (e) { let o = 1; for (let n = e; n && n !== document.body; n = n.parentElement) o *= +getComputedStyle(n).opacity; x = Math.round(o * 100) / 100; }
      }
      frames.push({ t: Math.round(t), s: stateFn(stage), a: describe(document.activeElement), hit, n: stage.querySelectorAll('*').length, x });
      if (t < ms) requestAnimationFrame(tick);
      else window.__qaDone = true;
    };
    window.__qa = {
      stateNow: () => stateFn(stage),
      start() {
        if (hitEl) { const r = hitEl.getBoundingClientRect(); hitPt = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
        t0 = performance.now(); window.__qaDone = false; requestAnimationFrame(tick); tick();
      },
      result: () => ({ animations: [...seen.values()], frames, events, hitPt }),
    };
  }, { stateExpr, hitSel, ms, textSel });
}

/** Runs `action` under the sampler and summarizes. */
async function sample(page, action, { stateExpr, hitSel, ms = 1200, textSel = null } = {}) {
  await install(page, { stateExpr, hitSel, ms, textSel });
  const before = await page.evaluate(() => window.__qa.stateNow());
  await page.evaluate(() => window.__qa.start());
  await action(page);
  await page.waitForFunction(() => window.__qaDone === true, null, { timeout: ms + 30000 });
  const r = await page.evaluate(() => window.__qa.result());
  const anims = r.animations;
  const badProps = [...new Set(anims.flatMap((a) => a.props).filter((p) => !KEEP.has(p)))];
  const changed = r.frames.find((f) => f.s !== before);
  const moving = anims.filter((a) => (a.duration > 0 || a.delay > 0) && a.iterations !== 'inf');
  const hitBad = r.frames.filter((f) => f.hit && f.hit !== 'ok');
  const textFrames = r.frames.filter((f) => f.x !== undefined);
  const textSeenAt = textFrames.length ? textFrames[0].t : null;
  const textReady = textFrames.find((f) => f.x >= 0.9);
  const sameFrameKf = (a) => { const k = a.keyframes || []; if (k.length < 2) return true; const strip = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).filter(([kk]) => !['offset', 'easing', 'composite'].includes(kk)))); return k.every((f) => strip(f) === strip(k[0])); };
  const movers = moving.filter((a) => !sameFrameKf(a));
  return {
    text: textSel ? { seenAt: textSeenAt, readyAt: textReady ? textReady.t : null, readyAfterSeen: textReady && textSeenAt !== null ? textReady.t - textSeenAt : null, firstOpacity: textFrames.length ? textFrames[0].x : null } : undefined,
    movers: movers.length,
    before,
    after: r.frames.length ? r.frames[r.frames.length - 1].s : null,
    stateAt: changed ? changed.t : null,
    firstMotionAt: moving.length ? Math.min(...moving.map((a) => a.first)) : null,
    events: r.events.slice(0, 12),
    badProps,
    longest: moving.reduce((m, a) => Math.max(m, (a.delay || 0) + (Number(a.duration) || 0) * (Number(a.iterations) || 1)), 0),
    infinite: anims.filter((a) => a.iterations === 'inf').map((a) => a.target + ' ' + a.name),
    hitFails: hitBad.length,
    hitSample: hitBad.slice(0, 2),
    animations: anims,
    nodes: [r.frames[0] && r.frames[0].n, r.frames.length && r.frames[r.frames.length - 1].n],
  };
}

/** Everything that could be stuck: transforms and opacities off rest in the stage, live animations, node count. */
async function snapshot(page, stateExpr = "''") {
  return page.evaluate((stateExpr) => {
    const stage = document.querySelector('[data-interaction-stage]');
    // eslint-disable-next-line no-new-func
    const stateFn = new Function('stage', `try { return String(${stateExpr}); } catch (e) { return 'ERR ' + e.message; }`);
    const off = [];
    const all = [...stage.querySelectorAll('*')];
    all.forEach((el, i) => {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue;
        const tf = cs.transform;
        const op = cs.opacity;
        if ((tf && tf !== 'none' && tf !== 'matrix(1, 0, 0, 1, 0, 0)') || op !== '1') off.push(`${i}:${el.tagName.toLowerCase()}${el.getAttribute('data-part') ? '[' + el.getAttribute('data-part') + ']' : ''}${pseudo || ''} t=${tf} o=${op}`);
      }
    });
    const live = document.getAnimations().filter((a) => {
      const it = a.effect && a.effect.getComputedTiming().iterations;
      return it !== Infinity && (a.playState === 'running' || a.playState === 'paused' || (a.playState === 'finished' && a.effect && ['forwards', 'both'].includes(a.effect.getTiming().fill)));
    }).map((a) => `${a.constructor.name} ${a.id || a.transitionProperty || a.animationName} ${a.playState} fill=${a.effect.getTiming().fill}`);
    return { state: stateFn(stage), nodes: all.length, off, live, active: document.activeElement && (document.activeElement.getAttribute('data-part') || document.activeElement.tagName) };
  }, stateExpr);
}

/** All transition-property values in the stage (and pseudo layers) that animate something other than transform and opacity for a non zero time. */
async function transitionSweep(page) {
  return page.evaluate(() => {
    const ok = new Set(['transform', 'opacity', 'translate', 'scale', 'rotate']);
    const out = [];
    const stage = document.querySelector('[data-interaction-stage]');
    for (const el of [stage, ...stage.querySelectorAll('*')]) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue;
        const props = cs.transitionProperty.split(',').map((s) => s.trim());
        const durs = cs.transitionDuration.split(',').map((s) => parseFloat(s) * (s.includes('ms') ? 1 : 1000));
        props.forEach((p, i) => {
          const d = durs[i % durs.length];
          if (!ok.has(p) && p !== 'none' && d > 0) out.push(`${el.tagName.toLowerCase()}[${el.getAttribute('data-part') || el.getAttribute('data-ds') || ''}]${pseudo || ''}: ${p} ${d}ms`);
        });
      }
    }
    return [...new Set(out)];
  });
}

/** Ring sampler: focus `sel` from the keyboard modality and read the ring on each frame for 260ms. */
async function ring(page, sel) {
  await page.keyboard.press('Shift');
  return page.evaluate(async (sel) => {
    const el = document.querySelector('[data-interaction-stage] ' + sel) || document.querySelector(sel);
    if (!el) return { error: 'no element ' + sel };
    const read = () => {
      const fe = document.activeElement;
      const host = fe.closest('[data-ds]') || fe;
      const cs = getComputedStyle(fe);
      const parts = [fe, host, fe.parentElement];
      const o = { outline: `${cs.outlineStyle} ${cs.outlineWidth}`, shadow: cs.boxShadow.slice(0, 90) };
      parts.forEach((p, i) => {
        for (const ps of ['::before', '::after']) {
          const c = getComputedStyle(p, ps);
          if (c.content !== 'none' && c.content !== 'normal') o[`p${i}${ps}`] = `o=${c.opacity} s=${c.boxShadow === 'none' ? 0 : 1}`;
        }
      });
      o.hostShadow = getComputedStyle(host).boxShadow.slice(0, 90);
      return o;
    };
    const frames = [];
    const t0 = performance.now();
    el.focus();
    const fv = el.matches(':focus-visible');
    await new Promise((res) => {
      const tick = () => { frames.push({ t: Math.round(performance.now() - t0), ...read() }); if (performance.now() - t0 < 260) requestAnimationFrame(tick); else res(); };
      tick();
    });
    const first = frames[0];
    const last = frames[frames.length - 1];
    const keys = Object.keys(last).filter((k) => k !== 't');
    const diff = keys.filter((k) => first[k] !== last[k]);
    const firstFrameAfter = frames.find((f) => f.t > 0) || first;
    const diff1 = keys.filter((k) => firstFrameAfter[k] !== last[k]);
    return { focusVisible: fv, atOnce: diff1.length === 0, diffFrame0: diff, diffFirstFrame: diff1, first: firstFrameAfter, last, frames: frames.length };
  }, sel);
}

const trig = '[data-interaction-trigger]';
const q = (s) => `stage.querySelector(${JSON.stringify(s)})`;
async function center(page, sel) {
  const b = await page.locator(`[data-interaction-stage] ${sel}`).first().boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
async function press(page, sel, hold = 140) {
  const c = await center(page, sel);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.waitForTimeout(hold);
  await page.mouse.up();
}
async function hover(page, sel) { const c = await center(page, sel); await page.mouse.move(c.x, c.y, { steps: 2 }); }
async function leave(page) { await page.mouse.move(5, 5, { steps: 2 }); }
const click = (sel) => async (page) => { await page.locator(`[data-interaction-stage] ${sel}`).first().click(); };
const keyOn = (sel, k) => async (page) => { await page.locator(`[data-interaction-stage] ${sel}`).first().focus(); await page.keyboard.press(k); };

// One spec per interaction id.
// act: the real trigger. rapid: steps run 30ms apart (and 1000ms apart for the
// reference). interrupt: steps run 50ms apart (reference 1000ms): the second
// step reverses the first before its motion ends. state: what must change at
// once. hit: the control under the pointer. ring: the control to focus from
// the keyboard. ms: the sampling window.
const down = (sel) => async (p) => { const c = await center(p, sel); await p.mouse.move(c.x, c.y); await p.mouse.down(); };
const up = async (p) => { await p.mouse.up(); };
const tap = (sel) => async (p) => { await press(p, sel, 10); };
const esc = async (p) => { await p.keyboard.press('Escape'); };
const blur = async (p) => { await p.evaluate(() => document.activeElement && document.activeElement.blur()); };
const focusKb = (sel) => async (p) => { await p.keyboard.press('Shift'); await p.evaluate((s) => document.querySelector('[data-interaction-stage] ' + s).focus(), sel); };
const key = (k) => async (p) => { await p.keyboard.press(k); };
const typeK = (t) => async (p) => { await p.keyboard.type(t); };
const hv = (sel) => (p) => hover(p, sel);
const SPLIT = '[data-ds=split-button] > [data-part=trigger]';
const STAR4 = '[role=radio][value="4"]';
const SPECS = {
  // ---------------- actions
  'button-press': { family: 'actions', act: (p) => press(p, trig, 160), rapid: [tap(trig), tap(trig)], interrupt: [down(trig), up], state: `document.activeElement === ${q(trig)}`, hit: trig, ring: trig, held: { sel: trig, act: down(trig) } },
  'segment-press': { family: 'actions', act: (p) => press(p, trig, 160), rapid: [tap(trig), tap(trig)], interrupt: [down(trig), up], state: `document.activeElement === ${q(trig)}`, hit: trig, ring: trig, held: { sel: `${trig} > [data-part=label]`, act: down(trig), neighbor: '[data-ds=button-group] > :nth-child(2)' } },
  'button-loading': { family: 'actions', act: click(trig), ms: 2300, wait: 2600, rapid: [click(trig), click(trig)], state: `${q(trig)}.getAttribute('aria-busy') + '/' + ${q(trig)}.hasAttribute('data-loading') + '/w' + Math.round(${q(trig)}.getBoundingClientRect().width)`, hit: trig, ring: trig },
  'copy-swap': { family: 'actions', act: click(trig), ms: 2700, wait: 2800, rapid: [click(trig), click(trig)], state: `${q(trig)}.getAttribute('data-state')`, hit: trig, ring: trig },
  'button-nudge': { family: 'actions', act: hv(trig), rapid: [hv(trig), leave, hv(trig)], interrupt: [hv(trig), leave], state: `${q(trig)}.matches(':hover')`, hit: trig, ring: trig },
  'close-turn': { family: 'actions', act: hv(trig), rapid: [hv(trig), leave, hv(trig)], interrupt: [hv(trig), leave], state: `${q(trig)}.matches(':hover')`, hit: trig, ring: trig },
  'split-chevron': { family: 'actions', act: click(SPLIT), rapid: [click(SPLIT), esc, click(SPLIT)], interrupt: [click(SPLIT), esc], state: `${q(SPLIT)}.getAttribute('aria-expanded')`, hit: SPLIT, ring: SPLIT, extra: hv(SPLIT) },
  'fab-morph': { family: 'actions', act: click(trig), rapid: [click(trig), esc, click(trig)], interrupt: [click(trig), esc], state: `${q(trig)}.getAttribute('aria-expanded')`, hit: trig, ring: trig, extra: click('[data-ds=toggle-button]') },
  'toggle-pop': { family: 'actions', act: click(trig), rapid: [click(trig), click(trig)], interrupt: [click(trig), click(trig)], state: `${q(trig)}.getAttribute('aria-pressed')`, hit: trig, ring: trig },
  'switch-stretch': { family: 'actions', act: (p) => press(p, trig, 160), rapid: [tap(trig), tap(trig)], interrupt: [tap(trig), tap(trig)], state: `${q(trig)}.getAttribute('aria-checked')`, hit: trig, ring: trig, held: { sel: `${trig} [data-part=thumb]`, act: down(trig), track: `${trig} [data-part=track]` } },
  'link-underline': { family: 'actions', act: hv(trig), rapid: [hv(trig), leave, hv(trig)], interrupt: [hv(trig), leave], state: `${q(trig)}.matches(':hover')`, hit: trig, ring: trig, extra: hv('[data-ds=link][target=_blank]') },
  // ---------------- inputs
  'focus-glow': { family: 'inputs', act: focusKb(trig), rapid: [focusKb(trig), blur, focusKb(trig)], interrupt: [focusKb(trig), blur], state: `document.activeElement === ${q(trig)}`, hit: trig, ring: trig },
  'error-shake': { family: 'inputs', act: click(trig), rapid: [click(trig), click(trig)], interrupt: [click(trig), click(trig)], state: `${q('input')}.getAttribute('aria-invalid')`, hit: trig, ring: null, alsoHit: '[data-ds=input]' },
  'field-label-focus': { family: 'inputs', act: click('input'), rapid: [click('input'), blur, click('input')], interrupt: [click('input'), blur], state: `document.activeElement === ${q('input')}`, hit: 'input', ring: 'input' },
  'field-message-enter': { family: 'inputs', act: click(trig), rapid: [click(trig), click(trig)], interrupt: [click(trig), click(trig)], state: `!!${q('[data-part=description]')}`, hit: trig, ring: null, text: '[data-part=description]' },
  'field-error-enter': { family: 'inputs', act: click(trig), rapid: [click(trig), click(trig)], interrupt: [click(trig), click(trig)], state: `!!${q('[data-part=error]')} + '/' + ${q('input')}.getAttribute('aria-invalid')`, hit: trig, ring: null, text: '[data-part=error]' },
  'password-reveal': { family: 'inputs', act: click('[data-part=toggle]'), rapid: [click('[data-part=toggle]'), click('[data-part=toggle]')], interrupt: [click('[data-part=toggle]'), click('[data-part=toggle]')], state: `${q('input')}.type + '/' + ${q('[data-part=toggle]')}.getAttribute('aria-pressed')`, hit: '[data-part=toggle]', ring: '[data-part=toggle]' },
  'search-clear': { family: 'inputs', act: click('[data-part=clear]'), rapid: [click('[data-part=clear]'), click(trig)], interrupt: [click('[data-part=clear]'), click(trig)], state: `${q('input')}.value + '/' + (document.activeElement && document.activeElement.tagName)`, hit: '[data-part=clear]', ring: '[data-part=clear]', extra: click(trig) },
  'search-submit': { family: 'inputs', act: keyOn('input', 'Enter'), rapid: [keyOn('input', 'Enter'), key('Enter')], state: `document.activeElement === ${q('input')}`, hit: 'input', ring: 'input' },
  'otp-fill': { family: 'inputs', act: click(trig), rapid: [click(trig), click(trig)], state: `${q('input')}.value`, hit: trig, ring: 'input', extra: async (p) => { await p.locator('[data-interaction-stage] input').focus(); await p.keyboard.type('4'); } },
  'otp-caret': { family: 'inputs', act: async (p) => { await p.locator('[data-interaction-stage] input').focus(); await p.keyboard.type('7'); }, rapid: [async (p) => { await p.locator('[data-interaction-stage] input').focus(); await p.keyboard.type('7'); }, typeK('8'), key('Backspace')], interrupt: [async (p) => { await p.locator('[data-interaction-stage] input').focus(); await p.keyboard.type('7'); }, key('Backspace')], state: `${q('input')}.value`, hit: 'input', ring: 'input' },
  'otp-complete': { family: 'inputs', act: async (p) => { await p.locator('[data-interaction-stage] input').focus(); await p.keyboard.press('End'); await p.keyboard.type('6'); }, rapid: [async (p) => { await p.locator('[data-interaction-stage] input').focus(); await p.keyboard.press('End'); await p.keyboard.type('6'); }, key('Backspace'), typeK('6')], interrupt: [async (p) => { await p.locator('[data-interaction-stage] input').focus(); await p.keyboard.press('End'); await p.keyboard.type('6'); }, key('Backspace')], state: `${q('input')}.value`, hit: 'input', ring: 'input' },
  'field-step': { family: 'inputs', act: keyOn('input', 'ArrowUp'), rapid: [keyOn('input', 'ArrowUp'), key('ArrowUp'), key('ArrowUp')], interrupt: [keyOn('input', 'ArrowUp'), key('ArrowDown')], state: `${q('input')}.value`, hit: 'input', ring: 'input' },
  'scrub-roll': { family: 'inputs', act: keyOn('input', 'ArrowUp'), rapid: [keyOn('input', 'ArrowUp'), key('ArrowUp'), key('ArrowUp')], interrupt: [keyOn('input', 'ArrowUp'), key('ArrowDown')], state: `${q('input')}.value`, hit: 'input', ring: 'input', extra: async (p) => { const b = await p.locator('[data-interaction-stage] [data-ds=scrub-input] > [data-part=label]').boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.mouse.move(b.x + b.width / 2 + 30, b.y + b.height / 2, { steps: 6 }); await p.waitForTimeout(250); await p.mouse.up(); } },
  'inline-edit-morph': { family: 'inputs', act: click('[data-part=display]'), rapid: [click('[data-part=display]'), click('[data-part=save]')], interrupt: [click('[data-part=display]'), click('[data-part=save]')], state: `${q('[data-ds=inline-edit]')}.getAttribute('data-state') + '/' + (document.activeElement && (document.activeElement.getAttribute('data-part') || document.activeElement.tagName))`, hit: '[data-part=display]', ring: '[data-part=display]', extra: click('[data-part=save]') },
  'form-summary-enter': { family: 'inputs', act: click(trig), rapid: [click(trig), click(trig)], state: `${q('form')}.getAttribute('data-state') + '/' + (document.activeElement && document.activeElement.name)`, hit: trig, ring: trig, text: '[data-part=summary] li, [data-part=summary] a' },
  'form-submit-success': { family: 'inputs', act: click(trig), rapid: [click(trig), click(trig)], state: `${q('form')}.getAttribute('data-state')`, hit: trig, ring: trig },
  'wizard-step': { family: 'inputs', act: click('[data-part=next]'), rapid: [click('[data-part=next]'), click('[data-part=back]')], interrupt: [click('[data-part=next]'), click('[data-part=back]')], state: `(${q('[aria-current=step]')} || {}).textContent + '/' + (document.activeElement && (document.activeElement.getAttribute('data-part') || document.activeElement.tagName))`, hit: '[data-part=next]', ring: '[data-part=next]', text: '[data-part=body]:not([hidden])' },
  'wizard-done': { family: 'inputs', act: click('[data-part=submit]'), rapid: [click('[data-part=submit]'), async (p) => { await p.locator('[data-interaction-stage] [data-part=submit]').click({ timeout: 300 }).catch(() => {}); }], state: `${q('[data-ds=form-wizard]')}.getAttribute('data-state')`, hit: '[data-part=submit]', ring: '[data-part=submit]' },
  'consent-check': { family: 'inputs', act: click('[role=checkbox]'), rapid: [click('[role=checkbox]'), click('[role=checkbox]')], interrupt: [click('[role=checkbox]'), click('[role=checkbox]')], state: `${q('[role=checkbox]')}.getAttribute('aria-checked')`, hit: '[role=checkbox]', ring: '[role=checkbox]' },
  'rating-fill': { family: 'inputs', act: click('[role=radio][value="5"]'), rapid: [click('[role=radio][value="5"]'), click('[role=radio][value="2"]')], interrupt: [click('[role=radio][value="5"]'), click('[role=radio][value="2"]')], state: `(${q('[role=radio][aria-checked=true]')} || {}).value`, hit: '[role=radio][value="5"]', ring: '[role=radio][aria-checked=true]' },
  'rating-preview': { family: 'inputs', act: hv(STAR4), rapid: [hv(STAR4), leave, hv(STAR4)], interrupt: [hv(STAR4), leave], state: `[...stage.querySelectorAll('[role=radio]')].map((r) => r.matches(':hover') ? 1 : 0).join('')`, hit: STAR4, ring: '[role=radio][aria-checked=true]' },
};

module.exports = { BASE, OUT, STYLES, KEEP, SPECS, keyOn, open, tokens, install, sample, snapshot, transitionSweep, ring, press, hover, leave, click, center, path };
