// The FilterBar more menu: item states after each key, React and Angular.
import { chromium } from '@playwright/test';
const b = await chromium.launch();
for (const [fw, base] of Object.entries({ react: 'http://localhost:5301', angular: 'http://localhost:5302' })) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(`${base}/c/filter-bar`); await p.waitForSelector('[data-demo-case]'); await p.waitForTimeout(300);
  const more = p.locator('[data-demo-case=variants] [data-ds=filter-bar] [data-part=more]').first();
  const items = () => p.evaluate(() => [...document.querySelectorAll('[role=menuitemcheckbox]')].map((i) => `${i.textContent.trim()}:${i.getAttribute('aria-checked')}${i === document.activeElement ? '*' : ''}${i.hasAttribute('data-disabled') ? '(disabled)' : ''}`).join(' '));
  await more.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  const log = [`open: ${await items()}`];
  for (const k of ['ArrowDown', 'Space', 'WAIT', 'Space', 'Enter', 'Enter', 'CLICK', 'CLICK']) { if (k === 'WAIT') { await p.waitForTimeout(1300); continue; } if (k === 'CLICK') await p.locator('[role=menuitemcheckbox]').nth(1).click(); else await p.keyboard.press(k); await p.waitForTimeout(250); log.push(`${k}: ${await items()}`); }
  console.log(`## ${fw}\n${log.join('\n')}`);
  await p.close();
}
await b.close();
