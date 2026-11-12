import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
import AxeBuilder from '/home/user/TheDesignSystem/node_modules/@axe-core/playwright/dist/index.mjs';
const out = {};
const b = await chromium.launch();
const ctx = await b.newContext(); const p = await ctx.newPage();
for (const fw of ['5301', '5302']) for (const dir of ['ltr', 'rtl']) for (const c of ['label','field-error','field','input','textarea','input-group','search-field','password-field','inline-edit','otp-field','phone-field']) {
  const slug = fw === '5301' && c === 'otp-field' ? 'otpfield' : c;
  await p.goto(`http://localhost:${fw}/c/${slug}?chrome=0&style=desk${dir === 'rtl' ? '&dir=rtl&lang=ar' : ''}`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' }); await p.waitForTimeout(400);
  const r = await new AxeBuilder({ page: p }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']).analyze();
  out[`${fw} ${dir} ${c}`] = r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
}
console.log(JSON.stringify(out, null, 1));
await b.close();
