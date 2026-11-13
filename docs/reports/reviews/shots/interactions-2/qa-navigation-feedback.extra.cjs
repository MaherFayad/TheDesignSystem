// Extra checks: Dock focus ring on the tile, Stat roll cadence (round 1 note N3), Badge cadence.
const { chromium } = require('playwright');
const fs = require('fs');
const go = async (b, id, style) => { const ctx = await b.newContext({ viewport: { width: 960, height: 720 } }); const p = await ctx.newPage(); await p.goto(`http://127.0.0.1:5190/interactions?focus=${id}&style=${style}&scheme=${style === 'neutral' ? 'light' : 'dark'}&chrome=0`, { waitUntil: 'networkidle' }); await p.waitForTimeout(800); return { ctx, p }; };
(async () => {
  const b = await chromium.launch();
  const out = { dockFocus: {}, statCadence: {}, badgeCadence: {} };
  for (const style of ['studio', 'desk', 'neutral']) {
    {
      const { ctx, p } = await go(b, 'dock-lift', style);
      for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => document.activeElement.closest("[data-ds='dock']"))) break; }
      const read = () => p.evaluate(() => { const a = document.activeElement; const icon = a.querySelector("[data-part='item-icon']"); const cs = getComputedStyle(icon); return { el: a.getAttribute('data-part'), focusVisible: a.matches(':focus-visible'), iconShadow: cs.boxShadow.slice(0, 140), iconOutline: cs.outlineStyle + ' ' + cs.outlineWidth, transitions: cs.transitionProperty + ' ' + cs.transitionDuration, running: icon.getAnimations().map((x) => (x.transitionProperty || x.animationName) + ' ' + Math.round(x.effect.getComputedTiming().duration)) }; });
      out.dockFocus[style] = { at0: await read() };
      await p.waitForTimeout(500);
      out.dockFocus[style].at500 = await read();
      await ctx.close();
    }
    for (const [id, sel, key] of [['stat-roll', '[data-interaction-trigger]', 'statCadence'], ['badge-count', '[data-interaction-trigger]', 'badgeCadence']]) {
      const { ctx, p } = await go(b, id, style);
      // One click every 100ms for 2s (20 changes): count digit roll starts per second.
      const r = await p.evaluate(async (sel) => {
        const el = document.querySelector(sel);
        const starts = [];
        const seen = new WeakSet();
        let t0 = performance.now();
        let run = true;
        const tick = () => { for (const a of document.getAnimations()) if (!seen.has(a)) { seen.add(a); const id = String(a.id || ''); if (/digit|roll|number/.test(id) || (a.effect.getKeyframes().some((k) => 'opacity' in k) && /translateY\(-?100%\)|translateY\(-?100/.test(JSON.stringify(a.effect.getKeyframes())))) starts.push({ t: Math.round(performance.now() - t0), id }); } if (run) requestAnimationFrame(tick); };
        tick();
        for (let i = 0; i < 20; i++) { el.click(); await new Promise((r) => setTimeout(r, 100)); }
        await new Promise((r) => setTimeout(r, 800));
        run = false;
        const groups = [];
        for (const s of starts) if (!groups.length || s.t - groups[groups.length - 1] > 25) groups.push(s.t);
        return { clicks: 20, clickEveryMs: 100, rollGroups: groups.length, spanMs: groups.length ? groups[groups.length - 1] - groups[0] : 0, groupStarts: groups, ids: [...new Set(starts.map((s) => s.id))] };
      }, sel);
      r.perSecond = r.spanMs ? Math.round(((r.rollGroups - 1) / (r.spanMs / 1000)) * 100) / 100 : null;
      out[key][style] = r;
      await ctx.close();
    }
  }
  fs.writeFileSync(__dirname + '/qa-navigation-feedback.extra.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 6000));
  await b.close();
})();
