// Shared probe for the ds-qa review of order 1.23 (interactions round 3).
// Opens `/interactions?focus=<id>` in one style, scheme and direction, with
// one motion mode, installs a per frame sampler, runs an action, and returns
// what moved, on which property, for how long, and when the state changed.
//
//   const { open, sample } = require('./probe.cjs');
//   const page = await open(browser, { base, id, style, scheme, dir, motion });
//   const res = await sample(page, async () => { await page.click('[data-interaction-trigger]'); }, { ms: 1200 });
//
// motion: 'full' | 'media' (emulated prefers-reduced-motion) | 'attr' (data-motion="reduce" on <html>)
// res.animations: every Animation seen (from document.getAnimations()), with
//   its target, kind (CSSTransition, CSSAnimation, Animation), property list,
//   timing from effect.getTiming() (duration, delay, easing, iterations),
//   first and last frame it was seen (ms after the action).
// res.frames: per frame { t, stateAttrs (aria-*, data-state on the trigger),
//   activeElement, focusRingOpacity } so the order of state and motion shows.
// res.badProps: any animated property outside the motion ruling of 2026-11-12
//   (transform, opacity, clip-path, stroke dash, filter, backdrop-filter, colors, box-shadow).
// open() also takes touch (hasTouch and isMobile) and extra (more query keys, for example &platform=ios).
const KEEP = new Set(['transform', 'opacity', 'translate', 'scale', 'rotate', 'clip-path', 'stroke-dashoffset', 'stroke-dasharray', 'filter', 'backdrop-filter', '-webkit-backdrop-filter', 'color', 'background-color', 'border-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'border-block-start-color', 'border-block-end-color', 'border-inline-start-color', 'border-inline-end-color', 'outline-color', 'box-shadow', 'clipPath', 'strokeDashoffset', 'strokeDasharray', 'backdropFilter', 'backgroundColor', 'borderColor', 'outlineColor', 'boxShadow', 'offset', 'easing', 'composite', 'computedOffset']);

async function open(browser, { base = 'http://127.0.0.1:5191', id, style = 'neutral', scheme = 'light', dir = 'ltr', motion = 'full', viewport = { width: 960, height: 540 }, touch = false, extra = '' }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch, reducedMotion: motion === 'media' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const rtl = dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
  await page.goto(`${base}/interactions?focus=${id}&style=${style}&scheme=${scheme}&chrome=0${rtl}${extra}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-interaction-stage]', { timeout: 60000 });
  if (motion === 'attr') await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduce'));
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { /* infinite */ } }));
  return page;
}

async function install(page, { triggerSel = '[data-interaction-trigger]', ms = 1200 } = {}) {
  await page.evaluate(({ triggerSel, ms }) => {
    const describe = (el) => {
      if (!el || !el.tagName) return String(el);
      const p = el.getAttribute && (el.getAttribute('data-part') || el.getAttribute('data-ds'));
      return `${el.tagName.toLowerCase()}${p ? `[${p}]` : ''}${el.id ? '#' + el.id : ''}`;
    };
    const seen = new Map();
    const frames = [];
    let t0 = null;
    const trig = () => document.querySelector(triggerSel);
    const stateOf = (el) => {
      if (!el) return null;
      const o = {};
      for (const a of el.attributes) if (/^(aria-(pressed|checked|expanded|selected|invalid|busy|current|valuenow)|data-state|data-checked|data-selected|data-loading|value)$/.test(a.name)) o[a.name] = a.value;
      if ('value' in el && typeof el.value === 'string') o.value = el.value;
      return o;
    };
    const tick = () => {
      if (t0 === null) return;
      const t = performance.now() - t0;
      for (const a of document.getAnimations()) {
        const eff = a.effect;
        const tgt = eff && eff.target;
        const key = a.id || a;
        let rec = seen.get(a);
        if (!rec) {
          const timing = eff ? eff.getComputedTiming() : {};
          let props = [];
          try {
            props = a.transitionProperty ? [a.transitionProperty] : [...new Set(eff.getKeyframes().flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))];
          } catch { /* none */ }
          let frames0 = [];
          try { frames0 = eff.getKeyframes().map((k) => { const o = {}; for (const [kk, v] of Object.entries(k)) if (v !== null && v !== undefined) o[kk] = v; return o; }); } catch { /* none */ }
          rec = {
            kind: a.constructor.name,
            name: a.animationName || a.transitionProperty || a.id || '',
            target: describe(tgt) + (eff && eff.pseudoElement ? eff.pseudoElement : ''),
            props,
            duration: timing.duration,
            delay: timing.delay,
            endDelay: timing.endDelay,
            iterations: timing.iterations,
            easing: eff ? eff.getTiming().easing : null,
            keyframes: frames0.slice(0, 8),
            first: Math.round(t),
            last: Math.round(t),
            playState: a.playState,
          };
          seen.set(a, rec);
        }
        rec.last = Math.round(t);
        rec.playState = a.playState;
      }
      const el = trig();
      let ring = null;
      const ae = document.activeElement;
      if (ae && ae !== document.body) {
        const cs = getComputedStyle(ae);
        ring = { outline: cs.outlineStyle !== 'none' ? cs.outlineWidth : 'none', boxShadow: cs.boxShadow !== 'none', before: getComputedStyle(ae, '::before').opacity };
      }
      frames.push({ t: Math.round(t), state: stateOf(el), active: describe(ae), ring });
      if (t < ms) requestAnimationFrame(tick);
      else window.__probeDone = true;
    };
    window.__probe = { seen, frames, start() { t0 = performance.now(); window.__probeDone = false; frames.length = 0; seen.clear(); requestAnimationFrame(tick); tick(); } };
  }, { triggerSel, ms });
}

async function sample(page, action, { ms = 1200, triggerSel } = {}) {
  await install(page, { triggerSel, ms });
  const before = await page.evaluate((s) => { const el = document.querySelector(s || '[data-interaction-trigger]'); if (!el) return null; const o = {}; for (const a of el.attributes) if (/^(aria-|data-state)/.test(a.name)) o[a.name] = a.value; return o; }, triggerSel);
  await page.evaluate(() => window.__probe.start());
  await action(page);
  await page.waitForFunction(() => window.__probeDone === true, null, { timeout: ms + 20000 });
  const res = await page.evaluate(() => ({ animations: [...window.__probe.seen.values()], frames: window.__probe.frames }));
  res.before = before;
  res.badProps = [...new Set(res.animations.flatMap((a) => a.props).filter((p) => !KEEP.has(p) && p !== 'all'))];
  res.longest = res.animations.reduce((m, a) => Math.max(m, (a.delay || 0) + (Number.isFinite(a.duration) ? a.duration * (Number.isFinite(a.iterations) ? a.iterations : 1) : 0)), 0);
  res.infinite = res.animations.filter((a) => a.iterations === Infinity).map((a) => a.target + ' ' + a.name);
  // The first frame where the trigger state differs from before.
  const key = JSON.stringify;
  const changed = res.frames.find((f) => f.state && before && Object.keys(before).some((k) => key(f.state[k]) !== key(before[k])));
  res.stateAt = changed ? changed.t : null;
  res.firstMotionAt = res.animations.length ? Math.min(...res.animations.map((a) => a.first)) : null;
  return res;
}

module.exports = { open, sample, install };
