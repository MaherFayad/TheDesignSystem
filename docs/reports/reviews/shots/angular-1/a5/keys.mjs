// node keys.mjs <base> <kebab> <query>
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, kebab, query] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const url = `${base}/c/${kebab}?chrome=0&${query}`;
await p.goto(url);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(400);
const active = () =>
  p.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return 'body';
    const c = a.closest('[data-demo-case]')?.getAttribute('data-demo-case');
    return `${c} ${a.tagName.toLowerCase()} ds=${a.getAttribute('data-ds')} part=${a.getAttribute('data-part')} label=${a.getAttribute('aria-label')} text=${(a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50)}`;
  });
// Tab walk
const seen = [];
await p.locator('body').click({ position: { x: 1, y: 1 } });
for (let i = 0; i < 120; i++) {
  await p.keyboard.press('Tab');
  const a = await active();
  if (seen.length && a === seen[0]) break;
  seen.push(a);
}
console.log('== tab order');
console.log(seen.join('\n'));
// Activate each close / retry / mark-all with Enter and Space, reload in between
const sel = '[data-part=close], [data-part=retry], [data-part=mark-all]';
const n = await p.locator(sel).count();
console.log('== activators', n);
for (let i = 0; i < n; i++) {
  for (const key of ['Enter', ' ']) {
    await p.goto(url);
    await p.waitForSelector('[data-demo-case]', { state: 'attached' });
    await p.waitForTimeout(300);
    const el = p.locator(sel).nth(i);
    const desc = await el.evaluate((e) => `${e.closest('[data-demo-case]')?.getAttribute('data-demo-case')} ${e.getAttribute('data-part')} ${e.getAttribute('aria-label') ?? e.textContent.trim()}`);
    const rootBefore = await p.evaluate(() => document.querySelectorAll('[data-demo-case] [data-ds]').length);
    await el.focus();
    await p.keyboard.press(key);
    await p.waitForTimeout(300);
    const after = await active();
    const state = await p.evaluate(() => {
      const r = [...document.querySelectorAll('[data-ds=error-state]')].map((e) => e.getAttribute('data-state'));
      return r.join(',');
    });
    const rootAfter = await p.evaluate(() => document.querySelectorAll('[data-demo-case] [data-ds]').length);
    console.log(`== ${desc} [${key === ' ' ? 'Space' : key}] -> focus: ${after}; ds count ${rootBefore}->${rootAfter}; es-states ${state}`);
  }
}
console.log('== errors', JSON.stringify(errors));
await b.close();
