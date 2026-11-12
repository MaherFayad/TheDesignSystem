// NumberField details: a refused key over a full selection, the stepper
// disabled state at the bounds (waited 300 ms), clamping on blur.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, query] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto(`${base}/c/number-field?chrome=0&${query}`);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(600);
const out = [];
const f = (label) => p.locator(`[data-ds=number-field]:has(input[aria-label="${label}"])`).first();
const st = async (r, tag) => out.push(`  ${tag}: ` + await r.evaluate((r) => { const el = r.querySelector('input'); return `value="${el.value}" sel=${el.selectionStart}-${el.selectionEnd} dec=${r.querySelector('[data-part=decrement]')?.getAttribute('aria-disabled') ?? r.querySelector('[data-part=decrement]')?.disabled} inc=${r.querySelector('[data-part=increment]')?.getAttribute('aria-disabled') ?? r.querySelector('[data-part=increment]')?.disabled} hidden=${r.parentElement.querySelector('input[type=hidden]')?.value ?? ''}`; }));
for (const label of ['Width', 'Discount', 'Guests', 'Price']) {
  const r = f(label); const inp = r.locator('input');
  out.push(label);
  await inp.click(); await p.keyboard.press('ControlOrMeta+a'); await st(r, 'select all');
  await p.keyboard.type('-'); await p.waitForTimeout(100); await st(r, 'type -');
  await p.keyboard.press('Home'); await p.waitForTimeout(300); await st(r, 'Home');
  await p.keyboard.press('End'); await p.waitForTimeout(300); await st(r, 'End');
  await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('99'); await p.keyboard.press('Tab'); await p.waitForTimeout(300); await st(r, 'type 99, Tab');
  await inp.click(); await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('0'); await p.keyboard.press('Tab'); await p.waitForTimeout(300); await st(r, 'type 0, Tab');
  await inp.click(); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(300); await st(r, 'ArrowUp');
  await p.keyboard.press('Tab');
}
console.log(out.join('\n'));
await b.close();
