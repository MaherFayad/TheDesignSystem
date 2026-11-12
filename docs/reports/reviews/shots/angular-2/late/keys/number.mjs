// NumberField walk: for every enabled field on the demo page, the input's
// attributes, then keys, typing, blur, wheel and the step buttons.
// Usage: node number.mjs <base> <query>
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, query] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto(`${base}/c/number-field?chrome=0&${query}`);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(600);
const roots = p.locator('[data-ds=number-field]');
const n = await roots.count();
const out = [];
for (let i = 0; i < n; i++) {
  const r = roots.nth(i);
  const inp = r.locator('input').first();
  if (await inp.isDisabled() || (await inp.getAttribute('readonly')) !== null) { out.push(`field ${i}: disabled or read only, skipped`); continue; }
  await inp.scrollIntoViewIfNeeded();
  const attrs = await inp.evaluate((el) => ['type', 'role', 'aria-roledescription', 'inputmode', 'autocomplete', 'autocorrect', 'spellcheck', 'aria-label', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-invalid', 'dir'].map((a) => `${a}=${el.getAttribute(a)}`).join(' '));
  const btns = await r.locator('[data-part=increment],[data-part=decrement]').evaluateAll((els) => els.map((e) => `${e.getAttribute('data-part')}:${e.getAttribute('aria-label')}:tab=${e.getAttribute('tabindex')}:dis=${e.getAttribute('aria-disabled') ?? e.disabled}`).join(' '));
  out.push(`field ${i}: ${attrs}`, `  steppers ${btns}`);
  const v = async (label) => {
    const s = await inp.evaluate((el) => {
      const r = el.closest('[data-ds=number-field]');
      const dis = [...r.querySelectorAll('[data-part=increment],[data-part=decrement]')].map((e) => (e.getAttribute('aria-disabled') === 'true' || e.disabled ? 'x' : 'o')).join('');
      return `value="${el.value}" focus=${document.activeElement === el ? 'input' : document.activeElement.tagName + '/' + (document.activeElement.getAttribute('data-part') ?? '')} steppers=${dis} invalid=${r.hasAttribute('data-invalid')}`;
    });
    out.push(`  ${label}: ${s}`);
  };
  await inp.click();
  await v('click');
  for (const k of ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']) { await p.keyboard.press(k); await p.waitForTimeout(40); await v(k); }
  await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('999999'); await v('type 999999');
  await p.keyboard.press('Enter'); await v('Enter');
  await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('-99999'); await p.evaluate(() => document.activeElement.blur()); await p.waitForTimeout(40); await v('type -99999 then blur');
  await inp.click(); await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('١٢٫٥'); await v('type ١٢٫٥');
  await p.keyboard.press('Tab'); await p.waitForTimeout(40); await v('Tab out');
  await inp.click(); await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('7abc'); await v('type 7abc');
  await p.keyboard.press('Enter'); await v('Enter');
  const box = await inp.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.wheel(0, -100); await p.waitForTimeout(80); await v('wheel up, focused');
  const inc = r.locator('[data-part=increment]');
  if (await inc.count()) {
    await inc.click(); await p.waitForTimeout(60); await v('click increment');
    await r.locator('[data-part=decrement]').click(); await p.waitForTimeout(60); await v('click decrement');
    await p.evaluate(() => document.activeElement.blur());
    await inc.click(); await p.waitForTimeout(60); await v('click increment, from blurred');
  }
  await p.evaluate(() => document.activeElement.blur());
}
const live = await p.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((e) => `${e.getAttribute('aria-live')}:${e.textContent.trim().slice(0, 60)}`).filter((s) => !s.endsWith(':')).join(' | '));
out.push(`live regions at end: ${live}`);
console.log(out.join('\n'));
await b.close();
