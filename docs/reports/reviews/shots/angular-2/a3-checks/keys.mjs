// Keyboard and pointer walks for A3.1 and A3.2, React and Angular side by side.
// node keys.mjs <base> <kebab> <query> -> prints a trace
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, kebab, query] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(`${base}/c/${kebab}?${query}`);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(400);
const out = [];
const desc = () => p.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  const txt = (id) => id.split(/\s+/).map((i) => document.getElementById(i)?.textContent?.trim()).join(' | ');
  let name = el.getAttribute('aria-label') ?? (el.getAttribute('aria-labelledby') ? txt(el.getAttribute('aria-labelledby')) : null);
  if (!name && el.id) name = document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent?.trim() ?? null;
  const root = el.closest('[data-ds]');
  const a = (k) => el.getAttribute(k);
  const parts = [`${el.tagName.toLowerCase()} role=${a('role')} name="${(name ?? '').slice(0, 40)}"`];
  for (const k of ['aria-checked', 'aria-valuenow', 'aria-valuetext', 'tabindex', 'data-thumb']) if (a(k) !== null) parts.push(`${k}=${a(k)}`);
  if (root) {
    parts.push(`root=${root.getAttribute('data-ds')}`);
    const vals = [...root.querySelectorAll('[role=slider]')].map((t) => t.getAttribute('aria-valuenow'));
    if (vals.length) parts.push(`values=[${vals}]`);
    const checked = [...root.querySelectorAll('[aria-checked=true],[aria-checked=mixed]')].map((t) => (t.getAttribute('aria-label') ?? t.id ?? '') + ':' + t.getAttribute('aria-checked'));
    if (root.matches('[role=radiogroup],fieldset')) parts.push(`checked=[${checked.map((c) => c.slice(-30))}]`);
  }
  return parts.join(' ');
});
const log = async (step) => out.push(`${step.padEnd(22)} ${await desc()}`);
const press = async (k) => { await p.keyboard.press(k, { delay: 40 }); await p.waitForTimeout(60); await log(k); };
const focusSel = async (sel, n = 0) => { await p.locator(sel).nth(n).focus(); await p.waitForTimeout(60); await log(`focus ${sel}#${n}`); };

// 1. Tab order through the first 14 stops.
await p.locator('body').click({ position: { x: 1, y: 1 } });
for (let i = 0; i < 14; i++) await press('Tab');
await press('Shift+Tab'); await press('Shift+Tab');

const sliderKeys = ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Shift+ArrowRight', 'End', 'ArrowRight', 'Home', 'ArrowLeft'];
const groupKeys = ['ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', 'Space', 'Enter', 'Tab', 'Shift+Tab'];
const drag = async (sel, n, from, to) => {
  const box = await p.locator(sel).nth(n).boundingBox();
  const y = box.y + box.height / 2;
  await p.mouse.move(box.x + box.width * from, y); await p.mouse.down();
  await p.mouse.move(box.x + box.width * (from + to) / 2, y, { steps: 4 });
  await p.mouse.move(box.x + box.width * to, y, { steps: 4 }); await p.mouse.up();
  await p.waitForTimeout(80);
  await log(`drag ${from}->${to}`);
};
if (kebab === 'slider') {
  for (const n of [0, 6]) { // Volume sm, and the Arabic slider (6th in variants: 3 sizes, radius, zoom, level, arabic)
    await focusSel('[data-demo-case=variants] [role=slider]', n);
    for (const k of sliderKeys) await press(k);
  }
  await focusSel('[data-demo-case=one] [role=slider]');
  await drag('[data-demo-case=one] [data-part=control]', 0, 0.25, 0.75);
  await drag('[data-demo-case=one] [data-part=control]', 0, 0.5, 1.2);
  out.push('saved text: ' + (await p.locator('[data-demo-case=one] [data-demo=label]').textContent()));
  await drag('[data-demo-case=variants] [data-ds=slider] [data-part=control]', 6, 0.2, 0.2);
  await focusSel('[data-demo-case=many] [role=slider]', 3);
  for (const k of ['ArrowRight', 'PageUp', 'End']) await press(k);
}
if (kebab === 'range-slider') {
  await focusSel('[data-demo-case=variants] [role=slider]', 0);
  for (const k of sliderKeys) await press(k);
  await focusSel('[data-demo-case=variants] [role=slider]', 1);
  for (const k of ['Home', 'ArrowLeft', 'ArrowRight', 'End', 'PageDown']) await press(k);
  await drag('[data-demo-case=one] [data-part=control]', 0, 0.05, 0.95);
  await drag('[data-demo-case=one] [data-part=control]', 0, 0.97, 0.02);
  out.push('saved text: ' + (await p.locator('[data-demo-case=one] [data-demo=label]').textContent()));
  await focusSel('[data-demo-case=too-many] [role=slider]', 0);
  for (const k of ['ArrowRight', 'ArrowRight', 'End']) await press(k);
}
if (kebab === 'radio-group' || kebab === 'radio-card') {
  for (const c of ['variants', 'empty', 'many', 'disabled', 'long-arabic']) {
    const n = await p.locator(`[data-demo-case=${c}] [role=radio]:not([disabled])`).count();
    if (!n) continue;
    await focusSel(`[data-demo-case=${c}] [role=radio]:not([disabled])`, 0);
    for (const k of groupKeys) await press(k);
  }
}
if (kebab === 'rating') {
  for (const c of ['variants', 'empty', 'long-arabic']) {
    await focusSel(`[data-demo-case=${c}] [role=radio]`, 0);
    for (const k of ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'End', 'ArrowRight', 'Home', 'ArrowLeft', 'PageDown', 'Space', 'Enter', 'Tab', 'Shift+Tab']) await press(k);
  }
  const star = p.locator('[data-demo-case=empty] [role=radio]').nth(3);
  await star.click(); await p.waitForTimeout(60); await log('click star 4');
}
if (kebab === 'checkbox' || kebab === 'switch' || kebab === 'checkbox-group') {
  const role = kebab === 'switch' ? 'switch' : 'checkbox';
  for (const c of ['variants', 'one', 'readonly', 'many']) {
    const n = await p.locator(`[data-demo-case=${c}] [role=${role}]:not([disabled])`).count();
    if (!n) continue;
    await focusSel(`[data-demo-case=${c}] [role=${role}]:not([disabled])`, 0);
    for (const k of ['Space', 'Space', 'Enter', 'Tab', 'Space']) await press(k);
  }
  const lab = p.locator(`[data-demo-case=one] [data-part=label]`).first();
  if (await lab.count()) { await lab.click(); await p.waitForTimeout(60); await log('click label'); }
  if (kebab !== 'switch') {
    const mixed = p.locator('[aria-checked=mixed]').first();
    if (await mixed.count()) { await mixed.click(); await p.waitForTimeout(60); await log('click mixed'); await press('Space'); }
  }
}
console.log(out.join('\n'));
await b.close();
