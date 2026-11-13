const { chromium } = require('playwright');
const L = require('./qa-selection-overlays.lib.cjs');
(async () => {
  const b = await chromium.launch(); const out = {};
  for (const style of ['neutral','desk']) for (const motion of ['full','media','attr']) {
    const ctx = await L.newCtx(b, { motion }); const p = await ctx.newPage();
    await L.goto(p, { id: 'window-lights', style, scheme: 'light', dir: 'ltr', motion });
    const c = await L.center(p, "[data-ds='window-controls'] [data-part='zoom']");
    await p.mouse.move(c.x, c.y); await L.sleep(20);
    const glyph0 = await p.evaluate(() => [...document.querySelectorAll("[data-ds='window-controls'] [data-ds='icon']")].map(e => getComputedStyle(e).transform));
    await p.mouse.down(); await L.sleep(400);
    const dot = await p.evaluate(() => getComputedStyle(document.querySelector("[data-ds='window-controls'] [data-part='zoom'] > [data-part='icon']")).transform);
    await p.mouse.up();
    out[style+'.'+motion] = { glyphJustAfterHover: glyph0, dotHeld: dot };
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
