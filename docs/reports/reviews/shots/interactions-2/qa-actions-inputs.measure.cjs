// ds-qa review of order 1.22: measures the actions and inputs families.
// node qa-actions-inputs.measure.cjs <id ...|actions|inputs>
// Writes <id>.measure.json next to this file. Reviewer script.
const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/user/TheDesignSystem/node_modules/playwright');
const L = require('./qa-actions-inputs.lib.cjs');
const REG = require('./qa-actions-inputs.registry.json');

const norm = (s) => String(s || '').replace(/\s+-?[\d.]+%/g, '').replace(/\s+/g, '');
function nameOf(tok, kind, value) {
  if (value === null || value === undefined) return '';
  const out = [];
  for (const [k, v] of Object.entries(tok)) {
    if (!k.startsWith(kind)) continue;
    if (kind === 'ease') { if (norm(v).slice(0, 40) === norm(value).slice(0, 40)) out.push(k); }
    else if (parseFloat(v) === value || (v.endsWith('s') && !v.endsWith('ms') && parseFloat(v) * 1000 === value)) out.push(k);
  }
  return out.join('|');
}
function compact(a, tok) {
  const e = a.easing && a.easing.length > 30 ? a.easing.slice(0, 24) + '..' : a.easing;
  const kf = (a.keyframes || []).map((k) => {
    const o = {};
    for (const [kk, v] of Object.entries(k)) if (!['easing', 'composite'].includes(kk) || kk === 'composite') o[kk] = v;
    if (k.easing && String(k.easing).startsWith('linear(')) o.easing = nameOf(tok, 'ease', k.easing) || 'linear(..)';
    else if (k.easing) o.easing = nameOf(tok, 'ease', k.easing) || k.easing;
    return o;
  });
  return {
    target: a.target,
    kind: a.kind,
    props: a.props.join(','),
    dur: a.duration,
    durTok: nameOf(tok, 'duration', a.duration),
    delay: a.delay || undefined,
    ease: nameOf(tok, 'ease', a.easing) || e,
    it: a.iterations === 1 ? undefined : a.iterations,
    comp: a.composite && a.composite !== 'replace' ? a.composite : undefined,
    kf: kf.length > 4 ? [kf[0], kf[1], kf[kf.length - 2], kf[kf.length - 1]] : kf,
    at: a.first,
  };
}
function dedupe(list) {
  const m = new Map();
  for (const x of list) {
    const k = JSON.stringify({ ...x, at: 0 });
    if (m.has(k)) m.get(k).n += 1; else m.set(k, { ...x, n: 1 });
  }
  return [...m.values()].map((x) => (x.n === 1 ? { ...x, n: undefined } : x));
}
async function runSeq(page, steps, gap) {
  for (let i = 0; i < steps.length; i += 1) {
    if (i) await page.waitForTimeout(gap);
    await steps[i](page);
  }
}
function offCss(id) {
  const off = REG[id].off;
  if (!off) return null;
  return '@layer ds.recipes {\n' + Object.entries(off).map(([sel, d]) => `${sel} { ${Object.entries(d).map(([k, v]) => `${k}: ${v};`).join(' ')} }`).join('\n') + '\n}';
}

async function measure(browser, id) {
  const spec = L.SPECS[id];
  const ms = spec.ms || 1100;
  const wait = spec.wait || 900;
  const res = { id, family: spec.family, drive: REG[id].drive, pattern: REG[id].pattern, reduced: REG[id].reduced, tokens: {}, runs: [], sweep: {}, held: [], ring: {}, rapid: {}, interrupt: {}, off: {}, extra: {} };
  for (const { style, scheme } of L.STYLES) {
    for (const dir of ['ltr', 'rtl']) {
      for (const motion of ['full', 'media', 'attr']) {
        const { ctx, page } = await L.open(browser, { id, style, scheme, dir, motion });
        try {
          const tok = await L.tokens(page);
          if (dir === 'ltr' && motion === 'full') {
            res.tokens[style] = Object.fromEntries(Object.entries(tok).filter(([k]) => !k.startsWith('ease')).map(([k, v]) => [k, v]));
            res.sweep[style] = await L.transitionSweep(page);
          }
          const r = await L.sample(page, spec.act, { stateExpr: spec.state, hitSel: spec.hit, ms, textSel: spec.text });
          await page.waitForTimeout(Math.max(0, wait - ms));
          const end = await L.snapshot(page, spec.state);
          const offList = end.off;
          res.runs.push({
            style, dir, motion,
            state: `${r.before} -> ${r.after}`,
            stateAt: r.stateAt, firstMotionAt: r.firstMotionAt, events: r.events.slice(0, 4).map((e) => `${e.type}@${e.t}`).join(' '),
            longest: r.longest, movers: r.movers, badProps: r.badProps, infinite: r.infinite.length ? r.infinite : undefined,
            hitFails: r.hitFails || undefined, hitSample: r.hitFails ? r.hitSample : undefined,
            text: r.text,
            anims: dedupe(r.animations.map((a) => compact(a, tok))).slice(0, 14),
            end: { live: end.live, offRest: end.off.length, offSample: offList.slice(0, 3), nodes: end.nodes },
          });
          if (spec.held) {
            await L.leave(page);
            await page.waitForTimeout(300);
            await spec.held.act(page);
            await page.waitForTimeout(300);
            const h = await page.evaluate(({ sel, neighbor, track }) => {
              const s = document.querySelector('[data-interaction-stage]');
              const g = (x) => { const e = x && s.querySelector(x); return e ? getComputedStyle(e).transform : null; };
              const box = (x) => { const e = x && s.querySelector(x); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left * 10) / 10, Math.round(r.width * 10) / 10]; };
              return { held: g(sel), track: g(track), root: g('[data-interaction-trigger]'), neighbor: box(neighbor), neighborTf: g(neighbor) };
            }, { sel: spec.held.sel, neighbor: spec.held.neighbor || null, track: spec.held.track || null });
            await page.mouse.up();
            await page.waitForTimeout(600);
            res.held.push({ style, dir, motion, ...h });
          }
        } catch (e) {
          res.runs.push({ style, dir, motion, error: String(e.message).slice(0, 300) });
        } finally {
          await ctx.close();
        }
      }
    }
    // Extras, LTR, full motion.
    const once = async (fn, opts = {}) => {
      const { ctx, page } = await L.open(browser, { id, style, scheme, dir: 'ltr', motion: 'full', ...opts });
      try { return await fn(page); } catch (e) { return { error: String(e.message).slice(0, 300) }; } finally { await ctx.close(); }
    };
    if (spec.ring) res.ring[style] = await once((p) => L.ring(p, spec.ring));
    const seqPair = async (steps, gap) => {
      const fast = await once(async (p) => { await runSeq(p, steps, gap); await p.waitForTimeout(Math.max(1500, wait)); await L.leave(p); await p.waitForTimeout(400); return L.snapshot(p, spec.state); });
      const ref = await once(async (p) => { await runSeq(p, steps, Math.max(1000, wait)); await p.waitForTimeout(Math.max(1500, wait)); await L.leave(p); await p.waitForTimeout(400); return L.snapshot(p, spec.state); });
      const same = !fast.error && !ref.error && fast.state === ref.state && fast.nodes === ref.nodes && JSON.stringify(fast.off) === JSON.stringify(ref.off) && fast.live.length === 0;
      return { same, fast, ref: same ? undefined : ref };
    };
    if (spec.rapid) res.rapid[style] = await seqPair(spec.rapid, 30);
    if (spec.interrupt) res.interrupt[style] = await seqPair(spec.interrupt, 50);
    const css = offCss(id);
    if (css) {
      res.off[style] = await once(async (p) => {
        const r = await L.sample(p, spec.act, { stateExpr: spec.state, hitSel: spec.hit, ms: 700 });
        let held;
        if (spec.held) { await L.leave(p); await p.waitForTimeout(200); await spec.held.act(p); await p.waitForTimeout(250); held = await p.evaluate((sel) => getComputedStyle(document.querySelector('[data-interaction-stage] ' + sel)).transform, spec.held.sel); await p.mouse.up(); }
        return { injected: css.replace(/\n/g, ' ').slice(0, 400), movers: r.movers, moving: r.animations.filter((a) => a.duration > 0).map((a) => `${a.target} ${a.props.join(',')} ${a.duration}`).slice(0, 6), held };
      }, { inject: css });
    }
    if (spec.extra) {
      res.extra[style] = await once(async (p) => {
        const tok = await L.tokens(p);
        const r = await L.sample(p, spec.extra, { stateExpr: spec.state, hitSel: null, ms: 900 });
        return { badProps: r.badProps, longest: r.longest, anims: dedupe(r.animations.map((a) => compact(a, tok))).slice(0, 10) };
      });
    }
  }
  return res;
}

(async () => {
  let ids = process.argv.slice(2);
  if (ids.length === 1 && (ids[0] === 'actions' || ids[0] === 'inputs')) ids = Object.keys(L.SPECS).filter((k) => L.SPECS[k].family === ids[0]);
  const browser = await chromium.launch();
  for (const id of ids) {
    const t = Date.now();
    try {
      const res = await measure(browser, id);
      fs.writeFileSync(path.join(__dirname, `${id}.measure.json`), JSON.stringify(res, null, 1));
      console.log(id, 'done', Math.round((Date.now() - t) / 1000) + 's');
    } catch (e) {
      console.log(id, 'FAILED', e.message);
    }
  }
  await browser.close();
})();
