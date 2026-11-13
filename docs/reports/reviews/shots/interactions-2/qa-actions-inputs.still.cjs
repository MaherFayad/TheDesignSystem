// ds-qa review of order 1.22: does anything visibly move under the reduced
// forms and the style `off` rows? For each id, style and mode (media, attr,
// off), runs the action and samples the computed transform and opacity of
// every element in the stage (and an open menu), with ::before and ::after,
// on every frame for 700ms. Reports each element whose value took more than
// one distinct value, with the values seen. Identity transforms count as one.
// node qa-actions-inputs.still.cjs <id ...|actions|inputs>  -> qa-actions-inputs.still.json (merged)
const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/user/TheDesignSystem/node_modules/playwright');
const L = require('./qa-actions-inputs.lib.cjs');
const REG = require('./qa-actions-inputs.registry.json');
const OUTF = path.join(__dirname, 'qa-actions-inputs.still.json');

function offCss(id) {
  const off = REG[id].off;
  if (!off) return null;
  return '@layer ds.recipes {\n' + Object.entries(off).map(([sel, d]) => `${sel} { ${Object.entries(d).map(([k, v]) => `${k}: ${v};`).join(' ')} }`).join('\n') + '\n}';
}

async function watch(page, action, ms = 700) {
  await page.evaluate((ms) => {
    const norm = (t) => {
      if (!t || t === 'none') return 'id';
      const m = t.match(/^matrix\(([^)]+)\)$/);
      if (m) {
        const v = m[1].split(',').map((x) => Math.round(parseFloat(x) * 100) / 100);
        if (v[0] === 1 && v[1] === 0 && v[2] === 0 && v[3] === 1 && Math.abs(v[4]) < 0.3 && Math.abs(v[5]) < 0.3) return 'id';
        return v.join(',');
      }
      return t;
    };
    const seen = new Map();
    const t0 = performance.now();
    const describe = (el) => `${el.parentElement && (el.parentElement.getAttribute('data-part') || el.parentElement.getAttribute('data-ds')) || ''}>${el.tagName.toLowerCase()}[${el.getAttribute('data-part') || el.getAttribute('data-ds') || el.getAttribute('role') || ''}]`;
    const tick = () => {
      const els = [...document.querySelectorAll('[data-interaction-stage] *, [role=menu], [role=menu] *')];
      els.forEach((el, i) => {
        for (const ps of [null, '::before', '::after']) {
          const cs = getComputedStyle(el, ps);
          if (ps && (cs.content === 'none' || cs.content === 'normal')) continue;
          const key = describe(el) + (ps || '') + '#' + i;
          const v = `${norm(cs.transform)} o${Math.round(parseFloat(cs.opacity) * 20) / 20}`;
          if (!seen.has(key)) seen.set(key, new Set());
          seen.get(key).add(v);
        }
      });
      if (performance.now() - t0 < ms) requestAnimationFrame(tick);
      else window.__still = [...seen.entries()].filter(([, s]) => s.size > 1).map(([k, s]) => `${k}: ${[...s].slice(0, 5).join(' | ')}${s.size > 5 ? ' ..' + s.size : ''}`);
    };
    window.__still = null;
    requestAnimationFrame(tick);
  }, ms);
  await action(page);
  await page.waitForFunction(() => window.__still !== null, null, { timeout: 30000 });
  return page.evaluate(() => window.__still);
}

(async () => {
  let ids = process.argv.slice(2);
  if (ids.length === 1 && (ids[0] === 'actions' || ids[0] === 'inputs')) ids = Object.keys(L.SPECS).filter((k) => L.SPECS[k].family === ids[0]);
  const browser = await chromium.launch();
  for (const id of ids) {
    const spec = L.SPECS[id];
    const res = {};
    for (const { style, scheme } of L.STYLES) {
      for (const mode of ['full', 'media', 'attr', 'off']) {
        const css = mode === 'off' ? offCss(id) : null;
        if (mode === 'off' && !css) continue;
        const { ctx, page } = await L.open(browser, { id, style, scheme, motion: mode === 'off' ? 'full' : mode, inject: css });
        try {
          res[`${style}.${mode}`] = await watch(page, spec.act);
        } catch (e) {
          res[`${style}.${mode}`] = ['ERROR ' + e.message.slice(0, 120)];
        } finally {
          await ctx.close();
        }
      }
    }
    let all = {};
    try { all = JSON.parse(fs.readFileSync(OUTF, 'utf8')); } catch { /* new */ }
    all[id] = res;
    fs.writeFileSync(OUTF, JSON.stringify(all, null, 1));
    console.log(id, 'still done');
  }
  await browser.close();
})();
