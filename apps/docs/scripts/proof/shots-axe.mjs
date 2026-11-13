// Screenshots (--shots) and axe (--axe) for order 1.30, in every style and scheme. Needs the site served.
// Run from the repo root: node apps/docs/scripts/proof/shots-axe.mjs --axe --shots
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';
const out = 'docs/reports/shots/docs-styles';
fs.mkdirSync(out, { recursive: true });
const styles = ['neutral', 'desk', 'liquid', 'studio'];
const schemes = ['light', 'dark'];
const base = 'http://localhost:4400';
const shots = process.argv.includes('--shots');
const axe = process.argv.includes('--axe');
(async () => {
  const b = await chromium.launch();
  const results = [];
  for (const style of styles) for (const scheme of schemes) {
    for (const width of [1440, 390]) {
      const ctx = await b.newContext({ viewport: { width, height: width > 500 ? 900 : 844 }, colorScheme: scheme, deviceScaleFactor: 1 });
      await ctx.addInitScript(([s, c]) => { try { localStorage.setItem('ds-docs-style', s); localStorage.setItem('ds-docs-scheme', c); } catch {} }, [style, scheme]);
      const p = await ctx.newPage();
      const errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      for (const [name, path] of [['home', '/'], ['button', '/components/button/'], ['style', `/styles/${style}/`], ['button-ar', '/ar/components/button/']]) {
        if (name === 'style' && !axe) continue;
        if (name === 'button-ar' && width === 1440 && !axe) continue;
        await p.goto(base + path, { waitUntil: 'load' });
        await p.waitForTimeout(700);
        if (shots && name !== 'style') {
          await p.screenshot({ path: `${out}/${name}-${style}-${scheme}-${width}.png` });
          if (name === 'home') {
            await p.click('#site-style-button');
            await p.waitForTimeout(350);
            await p.screenshot({ path: `${out}/menu-${style}-${scheme}-${width}.png` });
            await p.keyboard.press('Escape');
          }
        }
        if (axe && width === 1440 || axe && name !== 'style' && width === 390) {
          const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).exclude('iframe').analyze();
          results.push({ style, scheme, width, page: name, violations: r.violations.map((v) => ({ id: v.id, n: v.nodes.length, t: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split('\n')[1]) })) });
          // the open menu too
          if (name === 'home') {
            await p.click('#site-style-button'); await p.waitForTimeout(300);
            const r2 = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).exclude('iframe').analyze();
            results.push({ style, scheme, width, page: 'home-menu-open', violations: r2.violations.map((v) => ({ id: v.id, n: v.nodes.length, t: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split('\n')[1]) })) });
            await p.keyboard.press('Escape');
          }
        }
        const sw = await p.evaluate(() => document.documentElement.scrollWidth);
        if (sw > width) console.log('OVERFLOW', style, scheme, width, name, sw);
      }
      if (errors.length) console.log('ERRORS', style, scheme, width, errors);
      await ctx.close();
    }
  }
  if (axe) {
    fs.writeFileSync(`${out}/axe.json`, JSON.stringify(results, null, 1));
    const bad = results.filter((r) => r.violations.length);
    console.log(`axe runs: ${results.length}, with violations: ${bad.length}`);
    for (const r of bad) console.log(r.style, r.scheme, r.width, r.page, JSON.stringify(r.violations));
  }
  await b.close();
})();
