import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const b = await chromium.launch();
for (const [g, base] of [['react', 'http://localhost:5301'], ['angular', 'http://localhost:5302']]) {
  const p = await b.newPage();
  await p.goto(`${base}/c/checkbox?style=studio`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    const btn = document.querySelector('[data-demo-case=many] [role=checkbox][aria-checked=false]');
    const res = [];
    for (const step of ['check', 'uncheck']) {
      btn.click();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const anims = btn.closest('[data-ds=checkbox]').getAnimations({ subtree: true }).map((a) => `${a.constructor.name}:${a.transitionProperty ?? a.animationName ?? ''}:${a.effect?.target?.tagName}`);
      res.push(`${step}: ${anims.join(', ') || 'no animations'}`);
      await new Promise((r) => setTimeout(r, 400));
    }
    return res;
  });
  console.log(g, JSON.stringify(r));
  await p.close();
}
await b.close();
