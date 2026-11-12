// ds-qa review of order 1.22: focus return after an overlay closes (round 1 N4).
// Opens each overlay, presses Escape (or the close action), and logs per frame
// when focus is back on the trigger and when the overlay node leaves the DOM.
//   node qa-selection-overlays.focusret.cjs > out.json
const { chromium } = require('playwright');
const L = require('./qa-selection-overlays.lib.cjs');
const cases = [
  ['menu-origin', '[data-interaction-trigger]', "[data-ds='dropdown-menu']"],
  ['popover-spring', '[data-interaction-trigger]', "[data-ds='popover']"],
  ['dialog-spring', "[data-interaction-trigger='dialog']", "[data-ds='dialog'] [data-part='panel']"],
  ['sheet-spring', "[data-interaction-trigger='sheet']", "[data-ds='sheet'] [data-part='panel']"],
  ['command-palette-open', '[data-interaction-trigger]', "[data-ds='command-palette'] [data-part='panel']"],
  ['lightbox-zoom', '[data-interaction-trigger]', "[data-ds='lightbox'] [data-part='panel']"],
  ['picker-chevron-turn', '[data-interaction-trigger]', '[role=listbox]'],
  ['window-settle', '[data-interaction-trigger]', "[data-ds='window']"],
];
(async () => {
  const b = await chromium.launch(); const out = [];
  for (const style of ['neutral', 'desk', 'studio']) for (const [id, trig, node] of cases) {
    const ctx = await L.newCtx(b); const p = await ctx.newPage();
    await L.goto(p, { id, style, scheme: style === 'neutral' ? 'light' : 'dark', dir: 'ltr', motion: 'full' });
    await p.focus(trig); await p.keyboard.press('Enter'); await L.sleep(900);
    const r = await p.evaluate(async ({ trig, node, id }) => {
      const t0 = performance.now(); const tg = document.querySelector(trig);
      if (id === 'window-settle') tg.click(); else document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      let focusAt = null, goneAt = null;
      await new Promise((res) => { const tick = () => { const t = performance.now() - t0; if (focusAt === null && document.activeElement === tg) focusAt = Math.round(t); if (goneAt === null && !document.querySelector(node)) goneAt = Math.round(t); if ((focusAt !== null && goneAt !== null) || t > 2000) res(); else requestAnimationFrame(tick); }; tick(); });
      return { focusAt, goneAt, active: document.activeElement.tagName };
    }, { trig, node, id });
    out.push({ id, style, ...r }); console.error(id, style, JSON.stringify(r));
    await ctx.close();
  }
  console.log(JSON.stringify(out)); await b.close();
})();
