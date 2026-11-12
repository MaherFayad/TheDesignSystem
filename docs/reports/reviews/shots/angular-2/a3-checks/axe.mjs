import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
import AxeBuilder from '/home/user/TheDesignSystem/node_modules/@axe-core/playwright/dist/index.mjs';
const kebabs = process.argv.slice(2);
const b = await chromium.launch();
const res = {};
for (const k of kebabs) for (const [g, base] of [['react', 'http://localhost:5301'], ['angular', 'http://localhost:5302']]) for (const q of ['style=studio', 'style=desk&dir=rtl&lang=ar']) {
  const ctx = await b.newContext(); const p = await ctx.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(`${base}/c/${k}?${q}`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(500);
  const r = await new AxeBuilder({ page: p }).include('[data-demo="page"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  res[`${k} ${g} ${q}`] = r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  await ctx.close();
}
console.log(JSON.stringify(res, null, 1));
await b.close();
