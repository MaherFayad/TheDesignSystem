import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const b = await chromium.launch();
for (const [g, base] of [['react', 'http://localhost:5301'], ['angular', 'http://localhost:5302']]) {
  const p = await b.newPage();
  await p.goto(`${base}/c/rating?style=studio`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(400);
  await p.locator('[data-demo-case=empty] [role=radio]').nth(3).click();
  const rating = await p.evaluate(() => document.querySelector('[data-demo-case=empty] [data-ds=rating]').getAnimations({ subtree: true }).length);
  await p.goto(`${base}/c/slider?style=studio`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(400);
  await p.locator('[data-demo-case=empty] [role=slider]').focus();
  await p.keyboard.press('ArrowLeft');
  const slider = await p.evaluate(() => document.querySelector('[data-demo-case=empty] [data-ds=slider]').getAnimations({ subtree: true }).map((a) => a.constructor.name).join(','));
  console.log(`${g}: rating-fill animations after a pick ${rating}; slider-nudge at the minimum: ${slider || 'none'}`);
  await p.close();
}
await b.close();
