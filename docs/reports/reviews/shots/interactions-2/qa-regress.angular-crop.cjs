// ds-qa regression reviewer, order 1.22. Side by side crop of one Angular
// and React gallery page region at rest, to read a pixel diff.
//   node qa-regress.angular-crop.cjs <slug> <y0> <y1> [style] [dir]
const { chromium } = require('@playwright/test');
const path = require('path');
const [slug, y0, y1, style = 'neutral', dir = 'ltr'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const [fw, base] of [['react', 'http://127.0.0.1:5190'], ['angular', 'http://127.0.0.1:4290']]) {
    const p = await b.newPage({ viewport: { width: 1024, height: 768 } });
    const rtl = dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
    await p.goto(`${base}/c/${slug}?style=${style}&scheme=light&chrome=0${rtl}`, { waitUntil: 'networkidle', timeout: 120000 });
    await p.waitForTimeout(800);
    await p.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { /* inf */ } }));
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(__dirname, `angular.crop.${slug}.${style}-${dir}.${fw}.png`), fullPage: true, clip: { x: 0, y: Number(y0), width: 1024, height: Number(y1) - Number(y0) } });
    await p.close();
  }
  await b.close();
})();
