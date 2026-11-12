// ds-qa regression reviewer, order 1.22. B2 widened to every round 2
// interaction: on each /interactions?focus=<id> stage, under data-motion
// "reduce" (the page's switch) and under prefers-reduced-motion, hover,
// press and hold, then click the trigger. Reports any animation that runs
// with a duration over 0, and any element in the stage whose transform
// while hovered or held differs from rest (a size or place change with no
// motion is still a change the reduced form says should not happen).
//   node qa-regress.reduce-sweep.cjs [base] [style]
// Writes recheck.reduce-sweep.<style>.json.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const base = process.argv[2] || 'http://127.0.0.1:5190';
const style = process.argv[3] || 'neutral';
const src = fs.readFileSync(path.join(__dirname, '../../../../../packages/motion/src/interactions.ts'), 'utf8');
const ids = [];
for (const f of fs.readdirSync(path.join(__dirname, '../../../../../packages/motion/src/interactions'))) {
  const t = fs.readFileSync(path.join(__dirname, '../../../../../packages/motion/src/interactions', f), 'utf8');
  for (const m of t.matchAll(/^\s+id: '([a-z-]+)'/gm)) ids.push(m[1]);
}
void src;

function snap() {
  const st = document.querySelector('[data-interaction-stage]');
  const o = {};
  let i = 0;
  for (const el of [st, ...st.querySelectorAll('*')]) {
    i += 1;
    const cs = getComputedStyle(el);
    const t = `${cs.transform}|${cs.scale}|${cs.translate}|${cs.rotate}`;
    if (t !== 'none|none|none|none') o[i] = { el: `${el.tagName.toLowerCase()}${el.getAttribute('data-ds') ? `[ds=${el.getAttribute('data-ds')}]` : ''}${el.getAttribute('data-part') ? `[part=${el.getAttribute('data-part')}]` : ''}`, t };
    else o[i] = { el: el.tagName.toLowerCase(), t: 'none' };
  }
  return o;
}

const diff = (a, b) => {
  const out = [];
  for (const k of Object.keys(b)) {
    if (!a[k]) continue;
    const ta = a[k].t.replace('none|none|none|none', 'none');
    const tb = b[k].t.replace('none|none|none|none', 'none');
    const norm = (s) => s.replace(/matrix\(1, 0, 0, 1, 0, 0\)/g, 'none').replace(/\|none\|none\|none$/, '');
    if (norm(ta) !== norm(tb)) out.push(`${b[k].el}: ${norm(ta)} -> ${norm(tb)}`);
  }
  return out.slice(0, 8);
};

(async () => {
  const browser = await chromium.launch();
  const res = [];
  for (const id of ids) {
    for (const mode of ['attr', 'media']) {
      const ctx = await browser.newContext({ viewport: { width: 960, height: 640 }, reducedMotion: mode === 'media' ? 'reduce' : 'no-preference' });
      const page = await ctx.newPage();
      const row = { id, mode };
      try {
        await page.goto(`${base}/interactions?focus=${id}&style=${style}&scheme=light&chrome=0`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForSelector('[data-interaction-stage]', { timeout: 30000 });
        if (mode === 'attr') await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduce'));
        await page.waitForTimeout(400);
        await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { /* infinite */ } }));
        const trig = page.locator('[data-interaction-trigger]').first();
        const has = await trig.count();
        if (!has) { row.note = 'no trigger'; res.push(row); await ctx.close(); continue; }
        const rest = await page.evaluate(snap);
        const box = await trig.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(250);
        const hover = await page.evaluate(snap);
        await page.mouse.down();
        await page.waitForTimeout(250);
        const held = await page.evaluate(snap);
        await page.evaluate(() => { window.__seen = new Map(); const t0 = performance.now(); const tick = () => { for (const a of document.getAnimations()) { const d = Number(a.effect && a.effect.getComputedTiming().duration) || 0; const del = Number(a.effect && a.effect.getTiming().delay) || 0; if (d > 0 || del > 0) { const tg = a.effect.target; window.__seen.set(a, `${a.constructor.name} ${a.transitionProperty || a.animationName || a.id || ''} on ${tg ? tg.tagName.toLowerCase() + (tg.getAttribute('data-part') ? '[' + tg.getAttribute('data-part') + ']' : '') + (a.effect.pseudoElement || '') : '?'} ${Math.round(d)}ms${del ? ' delay ' + Math.round(del) : ''}${a.effect.getComputedTiming().iterations === Infinity ? ' infinite' : ''}`); } } if (performance.now() - t0 < 1200) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
        await page.mouse.up();
        await page.waitForTimeout(1300);
        row.hoverDiff = diff(rest, hover);
        row.heldDiff = diff(rest, held);
        row.timed = [...new Set(await page.evaluate(() => [...window.__seen.values()]))].slice(0, 8);
      } catch (e) {
        row.error = String(e.message || e).slice(0, 160);
      }
      const flag = (row.hoverDiff?.length || row.heldDiff?.length || row.timed?.length) ? 'MOVES' : 'still';
      console.log(id, mode, flag, JSON.stringify({ h: row.hoverDiff, p: row.heldDiff, t: row.timed, e: row.error }).slice(0, 400));
      res.push(row);
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, `recheck.reduce-sweep.${style}.json`), JSON.stringify(res, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
