// FormWizard step validation and focus on the first wizard of the variants case.
import { chromium } from '@playwright/test';
const b = await chromium.launch();
const desc = (p) => p.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  const d = (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map((id) => document.getElementById(id)?.textContent?.trim()).join('|');
  return `${el.tagName.toLowerCase()}${el.getAttribute('name') ? '[name=' + el.getAttribute('name') + ']' : ''}${el.dataset.part ? '{' + el.dataset.part + '}' : ''} invalid=${el.getAttribute('aria-invalid')} describedby="${d}" text="${(el.textContent ?? '').trim().slice(0, 30)}"`;
});
for (const q of ['style=studio', 'style=desk&dir=rtl&lang=ar']) for (const [fw, base] of Object.entries({ react: 'http://localhost:5301', angular: 'http://localhost:5302' })) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(`${base}/c/form-wizard?${q}`); await p.waitForSelector('[data-demo-case]'); await p.waitForTimeout(300);
  const w = p.locator('[data-demo-case=variants] [data-ds=form-wizard]').first();
  const st = async () => `current=${await w.evaluate((el) => [...el.querySelectorAll('[data-ds=stepper] li')].findIndex((li) => li.getAttribute('aria-current') === 'step'))} invalidSteps=${await w.evaluate((el) => [...el.querySelectorAll('[data-ds=stepper] li[data-invalid]')].map((li) => li.textContent.trim()).join('/'))} status="${await w.locator(':scope > [data-part=status]').textContent()}"`;
  const log = [`start ${await st()}`];
  await w.locator('[data-part=panel] button[type=submit]').focus();
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  log.push(`next on empty: ${await st()} focus=${await desc(p)}`);
  for (const inp of await w.locator('[data-part=body]:not([hidden]) input:not([aria-hidden=true])').all()) {
    const type = await inp.getAttribute('type');
    await inp.fill(type === 'email' ? 'sara@example.com' : type === 'tel' ? '0500000000' : type === 'password' ? 'Secret123!' : 'Sara');
  }
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  log.push(`next after fill (Enter in field): ${await st()} focus=${await desc(p)}`);
  // stepper action back to step 1
  const back = w.locator('[data-ds=stepper] button[data-part=title]').first();
  if (await back.count()) { await back.click(); await p.waitForTimeout(300); log.push(`stepper pick step 1: ${await st()} focus=${await desc(p)} value kept=${await w.locator('[data-part=body][data-step="0"] input').first().inputValue()}`); }
  console.log(`## ${fw} ${q}\n${log.join('\n')}`);
  await p.close();
}
await b.close();
