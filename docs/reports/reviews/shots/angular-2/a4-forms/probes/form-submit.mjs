// Form submit behavior in both galleries: messages, focus, summary links, announcement.
// node form-submit.mjs
import { chromium } from '@playwright/test';
const galleries = { react: 'http://localhost:5301', angular: 'http://localhost:5302' };
const b = await chromium.launch();
const out = [];
const log = (...a) => out.push(a.join(' '));
const focused = (p) => p.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  return `${el.tagName.toLowerCase()}${el.getAttribute('name') ? '[name=' + el.getAttribute('name') + ']' : ''}${el.getAttribute('role') ? '[role=' + el.getAttribute('role') + ']' : ''}${el.dataset.part ? '[part=' + el.dataset.part + ']' : ''} "${(el.labels?.[0]?.textContent ?? el.textContent ?? '').trim().slice(0, 40)}"`;
});
const summary = (c) => c.evaluate((el) => {
  const s = el.querySelector('[data-part=summary]');
  const st = el.querySelector('form [role=status]');
  return { title: s?.querySelector('[data-part=title]')?.textContent?.trim(), items: s ? [...s.querySelectorAll('li')].map((li) => li.textContent.trim()) : [], status: st?.textContent };
});
for (const [fw, base] of Object.entries(galleries)) {
  for (const q of ['style=studio', 'style=desk&dir=rtl&lang=ar']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(`${base}/c/form?${q}`);
    await p.waitForSelector('[data-demo-case]');
    await p.waitForTimeout(400);
    log(`\n## ${fw} ${q}`);
    // empty: submit empty, then type a bad email, submit
    let c = p.locator('[data-demo-case=empty]');
    await c.locator('button[type=submit]').click();
    await p.waitForTimeout(150);
    log('empty submit, focus:', await focused(p), JSON.stringify(await summary(c)));
    await c.locator('input[name=email]').fill('abc');
    await c.locator('button[type=submit]').click();
    await p.waitForTimeout(150);
    log('email "abc" submit, focus:', await focused(p), JSON.stringify(await summary(c)));
    // summary link moves focus
    await c.locator('input[name=email]').fill('');
    await c.locator('button[type=submit]').click();
    await p.waitForTimeout(150);
    await c.locator('[data-part=summary] a').first().focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(100);
    log('summary link Enter, focus:', await focused(p));
    // many: postal pattern, and the reach group
    c = p.locator('[data-demo-case=many]');
    const postal = c.locator('input[name=postal]');
    if (await postal.count()) await postal.fill('12');
    await c.locator('button[type=submit]').click();
    await p.waitForTimeout(150);
    log('many with postal "12", focus:', await focused(p), JSON.stringify(await summary(c)));
    // one: filled, passing submit, announcement
    c = p.locator('[data-demo-case=one]');
    await c.locator('button[type=submit]').click();
    await p.waitForTimeout(900);
    log('one passing submit:', JSON.stringify(await summary(c)), 'form state', await c.locator('form').getAttribute('data-state'));
    await p.close();
  }
}
console.log(out.join('\n'));
await b.close();
