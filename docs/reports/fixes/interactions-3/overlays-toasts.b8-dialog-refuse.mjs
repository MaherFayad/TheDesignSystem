// B8 probe (order 1.29, lane overlays and toasts): a refused backdrop press
// on an AlertDialog keeps focus where it was (WCAG 2.4.3), in every style,
// with a mouse and with a touch, at full motion and under reduced motion.
// Run with the gallery on port 5183:
//   node docs/reports/fixes/interactions-3/overlays-toasts.b8-dialog-refuse.mjs [out.json]
// Exit code 1 when any check fails.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.GALLERY ?? 'http://localhost:5183';
const OUT = process.argv[2];
const styles = ['studio', 'desk', 'neutral', 'liquid'];
const browser = await chromium.launch();
const result = {};
let failed = 0;

const focusName = (page) =>
  page.evaluate(() => {
    const a = document.activeElement;
    return a === document.body ? 'BODY' : (a?.textContent?.trim() ?? a?.tagName);
  });

for (const style of styles) {
  for (const motion of ['full', 'media']) {
    for (const input of ['mouse', 'touch']) {
      const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, hasTouch: input === 'touch', reducedMotion: motion === 'media' ? 'reduce' : 'no-preference' });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/interactions?focus=dialog-refuse&style=${style}&scheme=light&chrome=0`);
      await page.click('[data-interaction-trigger]');
      await page.waitForSelector('[data-ds="alert-dialog"] [data-part="panel"]');
      await page.waitForTimeout(500);
      const before = await focusName(page);
      // A corner of the backdrop, away from the panel.
      if (input === 'touch') await page.touchscreen.tap(20, 20);
      else await page.mouse.click(20, 20);
      await page.waitForTimeout(30);
      const after30 = await focusName(page);
      await page.waitForTimeout(600);
      const after630 = await focusName(page);
      const open = await page.evaluate(() => document.querySelector('[data-ds="alert-dialog"]')?.getAttribute('data-state'));
      const pass = before !== 'BODY' && after30 === before && after630 === before && open === 'open';
      if (!pass) failed++;
      result[`${style}.${motion}.${input}`] = { pass, before, after30, after630, open };
      await ctx.close();
    }
  }
}
await browser.close();
if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n');
for (const [k, v] of Object.entries(result)) console.log(k, v.pass ? 'pass' : 'FAIL', v.before, '->', v.after30, v.after630, v.open);
process.exit(failed ? 1 : 0);
