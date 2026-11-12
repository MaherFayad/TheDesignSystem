// axe on each page in the angular-2 late and recheck scope, closed and (for menus) open, in LTR and RTL Arabic. Prints JSON.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
import AxeBuilder from '/home/user/TheDesignSystem/node_modules/@axe-core/playwright/dist/index.mjs';
const [base] = process.argv.slice(2);
const comps = ['toggle-group', 'segmented-control', 'number-field', 'scrub-input', 'toggle-button', 'copy-button', 'link', 'inline-edit', 'otp-field', 'dropdown-menu'];
const dirs = { ltr: 'style=studio', rtl: 'style=desk&dir=rtl&lang=ar' };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })).newPage();
const result = {};
const run = async (key) => {
  const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  result[key] = r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
};
for (const c of comps) for (const [d, q] of Object.entries(dirs)) {
  await p.goto(`${base}/c/${c}?chrome=0&${q}`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(400);
  await run(`${c} ${d} closed`);
  if (c === 'dropdown-menu' || c === 'split-button') {
    for (const sel of ['[data-demo-case] [aria-haspopup=menu]:not([aria-disabled])', '[data-demo-trigger=ar]']) {
      const t = p.locator(sel).first();
      if (!(await t.count())) continue;
      await t.focus();
      await p.keyboard.press('Enter');
      await p.waitForSelector('[data-menu-layer] [role=menu]');
      await p.waitForTimeout(300);
      await run(`${c} ${d} open ${sel.includes('=ar') ? 'arabic' : 'first'}`);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(300);
    }
  }
}
console.log(JSON.stringify(result, null, 1));
await b.close();
