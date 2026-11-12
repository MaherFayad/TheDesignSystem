// The Arabic form in the variants case: a bad email gets which words.
import { chromium } from '@playwright/test';
const b = await chromium.launch();
for (const [fw, base] of Object.entries({ react: 'http://localhost:5301', angular: 'http://localhost:5302' })) {
  const p = await b.newPage();
  await p.goto(`${base}/c/form`);
  await p.waitForSelector('[data-demo-case]');
  const f = p.locator('[data-demo-case=variants] [lang=ar] form').first();
  await f.locator('input[name=name]').fill('سارة');
  await f.locator('input[name=email]').fill('sara');
  await f.locator('button[type=submit]').click();
  await p.waitForTimeout(200);
  const r = await f.evaluate((el) => ({ items: [...el.querySelectorAll('[data-part=summary] li')].map((x) => x.textContent.trim()), fieldError: el.querySelector('[data-part=error]')?.textContent.trim() }));
  console.log(fw, JSON.stringify(r));
  await p.close();
}
await b.close();
