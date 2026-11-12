// Does a caller click listener that calls preventDefault cancel the toggle / the copy?
// The listener is added after the component's own, as an Angular (click) binding on the same element is.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
const res = [];
for (const how of ['mouse', 'space', 'el.click()']) {
  await p.goto(`${base}/c/toggle-button?chrome=0&style=studio`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(300);
  const t = p.locator('[data-ds=toggle-button]:not([aria-disabled])').first();
  await t.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
  const before = await t.getAttribute('aria-pressed');
  if (how === 'mouse') await t.click();
  else if (how === 'space') { await t.focus(); await p.keyboard.press('Space'); }
  else await t.evaluate((el) => el.click());
  await p.waitForTimeout(150);
  res.push(`toggle ${how}: aria-pressed ${before} -> ${await t.getAttribute('aria-pressed')}`);

  await p.goto(`${base}/c/copy-button?chrome=0&style=studio`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(300);
  await p.evaluate(() => navigator.clipboard.writeText('SENTINEL'));
  const c = p.locator('[data-ds=copy-button]:not([aria-disabled])').first();
  await c.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
  if (how === 'mouse') await c.click();
  else if (how === 'space') { await c.focus(); await p.keyboard.press('Space'); }
  else await c.evaluate((el) => el.click());
  await p.waitForTimeout(200);
  res.push(`copy ${how}: data-state=${await c.getAttribute('data-state')} clipboard=${(await p.evaluate(() => navigator.clipboard.readText())).slice(0, 30)}`);
}
console.log(res.join('\n'));
await b.close();
