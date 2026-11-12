// axe on the six A4 pages, both galleries, LTR studio and RTL desk Arabic.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const kebabs = ['fieldset', 'form', 'consent-field', 'stepper', 'form-wizard', 'filter-bar'];
const b = await chromium.launch();
const res = {};
for (const k of kebabs) for (const q of ['style=studio', 'style=desk&dir=rtl&lang=ar']) for (const [fw, base] of Object.entries({ react: 'http://localhost:5301', angular: 'http://localhost:5302' })) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${base}/c/${k}?${q}`);
  await p.waitForSelector('[data-demo-case]');
  await p.waitForTimeout(500);
  const r = await new AxeBuilder({ page: p }).include('[data-demo-case]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  res[`${k} ${q} ${fw}`] = r.violations.map((v) => `${v.id}(${v.nodes.length})`).sort();
  await ctx.close();
}
for (const [key, v] of Object.entries(res)) console.log(key.padEnd(50), v.join(' ') || 'none');
await b.close();
