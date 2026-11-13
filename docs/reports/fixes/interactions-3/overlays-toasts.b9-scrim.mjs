// B9 probe (order 1.29, lane overlays and toasts): the Desk dialog scrim has
// no blur and no saturation under more contrast (the media query and
// data-contrast='more'), forced colors and reduced transparency. It also
// sets --_dialog-scrim-saturate: 1.3 on the root as a style recipe would,
// and checks that the hook is drawn by default and reset in every one of
// those modes. Every overlay of the family is read: dialog, alert-dialog,
// sheet and drawer (the stages dialog-spring, dialog-refuse, sheet-spring).
// Run with the gallery on port 5183:
//   node docs/reports/fixes/interactions-3/overlays-toasts.b9-scrim.mjs [out.json]
// Exit code 1 when any check fails.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.GALLERY ?? 'http://localhost:5183';
const OUT = process.argv[2];
const styles = (process.env.STYLES ?? 'desk,studio,neutral,liquid').split(',');
const stages = [
  { id: 'dialog-spring', kind: 'dialog' },
  { id: 'dialog-refuse', kind: 'alert-dialog' },
  { id: 'sheet-spring', kind: 'sheet' },
];
const modes = ['default', 'data-contrast', 'prefers-contrast', 'forced-colors', 'reduced-transparency'];
const browser = await chromium.launch();
const result = {};
let failed = 0;

for (const style of styles) {
  for (const stage of stages) {
    for (const mode of modes) {
      for (const hook of [false, true]) {
        const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        if (mode === 'prefers-contrast') await page.emulateMedia({ contrast: 'more' });
        if (mode === 'forced-colors') await page.emulateMedia({ forcedColors: 'active' });
        if (mode === 'reduced-transparency') {
          const cdp = await ctx.newCDPSession(page);
          await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
        }
        const contrast = mode === 'data-contrast' ? '&contrast=more' : '';
        await page.goto(`${BASE}/interactions?focus=${stage.id}&style=${style}&scheme=light&chrome=0${contrast}`);
        await page.click('[data-interaction-trigger]');
        await page.waitForSelector(`[data-ds="${stage.kind}"] > [data-part="backdrop"]`);
        if (hook) {
          await page.evaluate((k) => document.querySelector(`[data-ds="${k}"]`).style.setProperty('--_dialog-scrim-saturate', '1.3'), stage.kind);
        }
        await page.waitForTimeout(150);
        const read = await page.evaluate((k) => {
          const root = document.querySelector(`[data-ds="${k}"]`);
          const bd = root.querySelector(':scope > [data-part="backdrop"]');
          const cs = getComputedStyle(bd);
          return {
            mediaMatches: {
              contrast: matchMedia('(prefers-contrast: more)').matches,
              forced: matchMedia('(forced-colors: active)').matches,
              transparency: matchMedia('(prefers-reduced-transparency: reduce)').matches,
            },
            filter: cs.backdropFilter,
            saturate: getComputedStyle(root).getPropertyValue('--_dialog-scrim-saturate').trim(),
          };
        }, stage.kind);
        const f = read.filter;
        const blurPx = /blur\(([\d.]+)px\)/.exec(f);
        const sat = /saturate\(([\d.]+)\)/.exec(f);
        const noBlur = f === 'none' || !blurPx || Number(blurPx[1]) === 0;
        const noSat = f === 'none' || !sat || Number(sat[1]) === 1;
        let pass;
        // A style that turns the scrim filter off in its recipe (Studio: a flat scrim) has no filter for the hook to join.
        const styleOff = f === 'none';
        if (mode === 'default') pass = hook ? styleOff || (!!sat && Number(sat[1]) === 1.3) : noSat;
        else pass = noBlur && noSat;
        if (!pass) failed++;
        result[`${style}.${stage.kind}.${mode}${hook ? '.hook' : ''}`] = { pass, ...read, ...(mode === 'default' && styleOff ? { note: 'the style sets --_dialog-scrim-filter: none' } : {}) };
        await ctx.close();
      }
    }
  }
}
await browser.close();
if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n');
for (const [k, v] of Object.entries(result)) console.log(k, v.pass ? 'pass' : 'FAIL', v.filter, JSON.stringify(v.mediaMatches));
process.exit(failed ? 1 : 0);
