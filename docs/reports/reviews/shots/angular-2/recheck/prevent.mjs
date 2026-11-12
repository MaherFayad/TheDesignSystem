// Recheck of angular-1 A1 B1 and CopyButton B1. Does a caller click listener
// that calls preventDefault cancel the toggle, the copy, a ToggleGroup item
// press? Trusted mouse click and Space, and a scripted el.click().
// Caller listener forms:
//   capture: el.addEventListener('click', fn, true). On the target it runs
//            before every bubble listener, so it stands where an Angular
//            template (click) stands: registered when the element is
//            created, before the component's after-render listener.
//   late:    el.addEventListener('click', fn) after the page rendered, as
//            angular-1's prevent.mjs did. In React it still runs before the
//            root delegated onClick; in Angular it runs after the
//            component's listener, which was added at the first render.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
const res = [];
const open = async (kebab) => {
  await p.goto(`${base}/c/${kebab}?chrome=0&style=studio`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(400);
};
const act = async (loc, how) => {
  if (how === 'mouse') await loc.click();
  else if (how === 'space') { await loc.focus(); await p.keyboard.press('Space'); }
  else await loc.evaluate((el) => el.click());
  await p.waitForTimeout(200);
};
for (const form of ['capture', 'late', 'none']) for (const how of ['mouse', 'space', 'el.click()']) {
  const add = (loc) => form === 'none' ? null : loc.evaluate((el, capture) => el.addEventListener('click', (e) => e.preventDefault(), capture), form === 'capture');
  await open('toggle-button');
  const t = p.locator('[data-ds=toggle-button]:not([aria-disabled])').first();
  await add(t);
  const before = await t.getAttribute('aria-pressed');
  await act(t, how);
  res.push(`${form} ${how} toggle-button: aria-pressed ${before} -> ${await t.getAttribute('aria-pressed')}`);

  await open('copy-button');
  await p.evaluate(() => navigator.clipboard.writeText('SENTINEL'));
  const c = p.locator('[data-ds=copy-button]:not([aria-disabled])').first();
  await add(c);
  await act(c, how);
  res.push(`${form} ${how} copy-button: data-state=${await c.getAttribute('data-state')} clipboard=${(await p.evaluate(() => navigator.clipboard.readText())).slice(0, 30)}`);

  await open('toggle-group');
  const g = p.locator('[data-ds=toggle-group][role=toolbar] > [data-part=item]:not([aria-disabled])').first();
  await add(g);
  const gb = await g.getAttribute('aria-pressed');
  await act(g, how);
  res.push(`${form} ${how} toggle-group item: aria-pressed ${gb} -> ${await g.getAttribute('aria-pressed')}`);
}
console.log(res.join('\n'));
await b.close();
