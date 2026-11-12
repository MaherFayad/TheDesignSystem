import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const b = await chromium.launch();
for (const base of ['http://localhost:5301', 'http://localhost:5302']) {
  for (const reduced of ['reduce', 'no-preference']) {
    const ctx = await b.newContext({ reducedMotion: reduced }); const p = await ctx.newPage();
    await p.goto(base + '/c/toast?chrome=0&style=studio'); await p.waitForSelector('[data-demo-case]', { state: 'attached' }); await p.waitForTimeout(500);
    await p.mouse.move(2, 2);
    const r = await p.evaluate(async () => {
      const btn = document.querySelectorAll('[data-demo-case=one] [data-demo-trigger]')[0];
      const t0 = performance.now(); btn.click();
      let closed = -1, gone = -1;
      while (performance.now() - t0 < 9000) {
        await new Promise((r) => setTimeout(r, 10));
        const li = document.querySelector('[data-ds=toaster] > [data-ds=toast]');
        if (closed < 0 && li && li.getAttribute('data-state') === 'closed') closed = performance.now() - t0;
        if (closed >= 0 && !li) { gone = performance.now() - t0; break; }
        if (!li && closed < 0 && performance.now() - t0 > 500) { gone = performance.now() - t0; break; }
      }
      return { closed: Math.round(closed), gone: Math.round(gone), focus: document.hasFocus() };
    });
    console.log(base, reduced, JSON.stringify(r));
    await ctx.close();
  }
}
await b.close();
