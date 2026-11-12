import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const b = await chromium.launch();
for (const [g, base] of [['react', 'http://localhost:5301'], ['angular', 'http://localhost:5302']]) {
  const p = await b.newPage();
  await p.goto(`${base}/c/range-slider?style=studio`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(400);
  const t = p.locator('[data-demo-case=variants] [role=slider]').nth(1);
  await t.focus();
  await p.keyboard.press('ArrowLeft');
  const html = await p.evaluate(() => {
    const el = document.querySelectorAll('[data-demo-case=variants] [role=slider]')[1];
    return el.parentElement.outerHTML.replace(/<path[^>]*>/g, '');
  });
  console.log(g, html);
  await p.close();
}
await b.close();
