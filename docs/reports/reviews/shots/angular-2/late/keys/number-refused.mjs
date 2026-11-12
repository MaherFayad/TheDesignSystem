// A refused key over a full selection: select all of Width (min 0), type "-5".
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto(`${base}/c/number-field?chrome=0&style=studio`);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(600);
const inp = p.locator('input[aria-label="Width"]');
for (const seq of ['-5', 'x5', '٥']) {
  await inp.click(); await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type(seq);
  const v = await inp.inputValue();
  await p.keyboard.press('Enter');
  console.log(`select all of "320", type "${seq}": text "${v}", after Enter "${await inp.inputValue()}"`);
  await inp.fill(''); await p.keyboard.type('320'); await p.keyboard.press('Enter');
}
await b.close();
