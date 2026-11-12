const { chromium } = require('playwright');
const L = require('./qa-selection-overlays.lib.cjs');
(async () => {
  const b = await chromium.launch();
  for (const motion of ['full','media','attr']) for (const style of ['neutral','desk']) {
    const ctx = await L.newCtx(b, { motion }); const p = await ctx.newPage();
    await L.goto(p, { id: 'window-lights', style, scheme: style==='neutral'?'light':'dark', dir: 'ltr', motion });
    const r = await p.evaluate(() => { const el = document.querySelector("[data-ds='window-controls']"); const cs = getComputedStyle(el); const st = document.querySelector('[data-style]'); return { styleEl: st.tagName + ' ' + st.getAttribute('data-style') + '/' + st.getAttribute('data-scheme'), bouncy: cs.getPropertyValue('--ds-duration-spring-bouncy'), stagger: cs.getPropertyValue('--ds-delay-stagger'), base: cs.getPropertyValue('--ds-duration-base'), fast: cs.getPropertyValue('--ds-duration-fast') }; });
    console.log(motion, style, JSON.stringify(r)); await ctx.close();
  }
  await b.close();
})();
