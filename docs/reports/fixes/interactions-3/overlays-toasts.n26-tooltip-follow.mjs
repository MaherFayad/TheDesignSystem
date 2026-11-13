// N26 probe (order 1.29, lane overlays and toasts): in "tooltip-follow" the
// last tooltip hides at once when the next one opens inside the skip delay,
// so only one tooltip shows. Samples every frame for 400ms after the pointer
// moves to the next control, in every style, at full motion and under the
// reduced motion media query. Run with the gallery on port 5183:
//   node docs/reports/fixes/interactions-3/overlays-toasts.n26-tooltip-follow.mjs [out.json]
// Exit code 1 when two tooltips show in any frame.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.GALLERY ?? 'http://localhost:5183';
const OUT = process.argv[2];
const styles = ['studio', 'desk', 'neutral', 'liquid'];
const browser = await chromium.launch();
const result = {};
let failed = 0;
/** One run: hover the first control, then move to the next inside the skip delay. */
async function run(style, motion) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 600 }, reducedMotion: motion === 'media' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/interactions?focus=tooltip-follow&style=${style}&scheme=light&chrome=0`);
  await page.locator('[data-interaction-stage] button').first().waitFor();
  const rects = await page.evaluate(() => [...document.querySelectorAll('[data-interaction-stage] button')].map((b) => b.getBoundingClientRect().toJSON()));
  const at = (r) => [r.x + r.width / 2, r.y + r.height * 0.8];
  await page.mouse.move(...at(rects[0]));
  await page.waitForSelector('[data-ds="tooltip"][data-state="delayed-open"]');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    window.__shown = [];
    const t0 = performance.now();
    const tick = () => {
      const visible = [...document.querySelectorAll('[data-ds="tooltip"]')].filter((el) => Number.parseFloat(getComputedStyle(el).opacity) > 0.05 && el.getBoundingClientRect().width > 0);
      window.__shown.push([Math.round(performance.now() - t0), visible.map((el) => `${el.textContent} ${el.getAttribute('data-state')}`)]);
      if (performance.now() - t0 < 400) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  // A real pointer passes through the gap between the controls.
  await page.mouse.move(...at(rects[1]), { steps: 4 });
  await page.waitForTimeout(550);
  const frames = await page.evaluate(() => window.__shown);
  await ctx.close();
  const two = frames.filter(([, v]) => v.length > 1);
  // Exercised: the next one opened inside the skip delay (instant-open), not after a fresh delay.
  const followed = frames.some(([, v]) => v.includes('Edit layer instant-open'));
  return { followed, frames: frames.length, framesWithTwo: two.length, firstTwo: two[0] ?? null, last: frames[frames.length - 1] };
}

for (const style of styles) {
  for (const motion of ['full', 'media']) {
    let r;
    let tries = 0;
    // A loaded machine can miss the skip delay; such a run proves nothing, so it runs again.
    do r = await run(style, motion);
    while (!r.followed && ++tries < 3);
    const pass = r.followed && r.framesWithTwo === 0;
    if (!pass) failed++;
    result[`${style}.${motion}`] = { pass, tries: tries + 1, ...r };
  }
}
await browser.close();
if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n');
for (const [k, v] of Object.entries(result)) console.log(k, v.pass ? 'pass' : 'FAIL', JSON.stringify(v));
process.exit(failed ? 1 : 0);
