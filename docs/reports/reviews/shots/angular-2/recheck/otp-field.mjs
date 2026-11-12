// Recheck of angular-1 OTPField B2 and N2: at a 320px wide viewport, does
// the demo grid overflow? What does the page heading say? Route slugs.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base] = process.argv.slice(2);
const b = await chromium.launch();
const out = [];
for (const width of [320, 1280]) {
  const p = await (await b.newContext({ viewport: { width, height: 800 } })).newPage();
  for (const path of ['/c/otp-field', '/c/otpfield']) {
    await p.goto(`${base}${path}?style=studio`);
    const found = await p.waitForSelector('[data-demo-case]', { state: 'attached', timeout: 8000 }).then(() => true, () => false);
    if (!found) { out.push(`${width}px ${path}: no demo`); continue; }
    await p.waitForTimeout(400);
    const m = await p.evaluate(() => {
      const h = document.querySelector('h1')?.textContent?.trim();
      const grids = [...document.querySelectorAll('[data-demo=grid]')];
      const g = grids.map((el) => `${el.scrollWidth}/${el.clientWidth} cols=${getComputedStyle(el).gridTemplateColumns}`);
      const over = [...document.querySelectorAll('[data-ds=otp-field]')].filter((el) => { const r = el.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 0.5 || r.left < -0.5; }).length;
      return `h1="${h}" page scroll ${document.documentElement.scrollWidth}/${document.documentElement.clientWidth} otp fields past the viewport=${over} grids: ${g.join('; ')}`;
    });
    out.push(`${width}px ${path}: ${m}`);
  }
  await p.close();
}
console.log(out.join('\n'));
await b.close();
