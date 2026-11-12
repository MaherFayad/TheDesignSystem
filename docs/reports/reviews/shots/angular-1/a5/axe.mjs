// node axe.mjs <base> <out.json>
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
import AxeBuilder from '/home/user/TheDesignSystem/node_modules/@axe-core/playwright/dist/index.mjs';
import { writeFileSync } from 'node:fs';
const [base, out] = process.argv.slice(2);
const comps = ['alert', 'callout', 'banner', 'status-dot', 'skeleton', 'error-state', 'notification-center', 'spinner', 'progress-bar', 'progress-circle', 'meter', 'toast'];
const variants = { ltr: 'style=studio', rtl: 'style=desk&dir=rtl&lang=ar', 'ltr-light': 'style=neutral&scheme=light' };
const b = await chromium.launch();
const result = {};
for (const c of comps) {
  for (const [vn, q] of Object.entries(variants)) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(`${base}/c/${c}?chrome=0&${q}`);
    await p.waitForSelector('[data-demo-case]', { state: 'attached' });
    await p.waitForTimeout(500);
    if (c === 'toast') {
      await p.locator('[data-demo-case=error] [data-demo-trigger]').click();
      await p.locator('[data-demo-case=variants] [data-demo-trigger]', { hasText: 'action' }).click();
      await p.waitForTimeout(400);
    }
    const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    result[`${c} ${vn}`] = r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
    await ctx.close();
  }
}
writeFileSync(out, JSON.stringify(result, null, 1));
for (const [k, v] of Object.entries(result)) console.log(k, v.map((x) => `${x.id}(${x.nodes})`).join(' ') || 'clean');
await b.close();
