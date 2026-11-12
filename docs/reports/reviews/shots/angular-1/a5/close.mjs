import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const b = await chromium.launch(); const p = await b.newPage();
const norm = (h) => h.replace(/ _ng\w+-\w+-c\d+=""/g, '');
for (const base of ['http://localhost:5301', 'http://localhost:5302']) {
  await p.goto(base + '/c/close-button?chrome=0&style=studio'); await p.waitForSelector('[data-demo-case]', { state: 'attached' }); await p.waitForTimeout(300);
  const cb = await p.evaluate(() => [...document.querySelectorAll('[data-ds=close-button][data-size=xs]')].slice(0, 1).map((e) => e.outerHTML));
  await p.goto(base + '/c/toast?chrome=0&style=studio'); await p.waitForSelector('[data-demo-case]', { state: 'attached' }); await p.waitForTimeout(300);
  await p.locator('[data-demo-case=error] [data-demo-trigger]').click(); await p.waitForTimeout(400);
  const tc = await p.evaluate(() => document.querySelector('[data-ds=toaster] [data-part=close]').outerHTML);
  console.log(base, '\n close-button xs:', cb.map(norm).join(), '\n toast close   :', norm(tc));
}
await b.close();
