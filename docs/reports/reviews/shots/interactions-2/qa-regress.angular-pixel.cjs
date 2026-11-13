// ds-qa regression reviewer, order 1.22. Angular against React at rest:
// /c/<slug>, 1024px wide, every finite animation finished, pixelmatch with
// threshold 0.1, in Studio dark and Neutral light, LTR and Arabic RTL.
//   node qa-regress.angular-pixel.cjs <slugs comma> [reactBase] [ngBase]
// Writes angular.pixel-diff.json (merged), and angular.diff.<slug>.<setup>.png
// when a diff is over 0 pixels.
const { chromium } = require('@playwright/test');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const slugs = (process.argv[2] || '').split(',').filter(Boolean);
const R = process.argv[3] || 'http://127.0.0.1:5190';
const A = process.argv[4] || 'http://127.0.0.1:4290';
const SETUPS = [
  { style: 'studio', scheme: 'dark', dir: 'ltr' },
  { style: 'studio', scheme: 'dark', dir: 'rtl' },
  { style: 'neutral', scheme: 'light', dir: 'ltr' },
  { style: 'neutral', scheme: 'light', dir: 'rtl' },
];

async function shot(browser, base, slug, s) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const rtl = s.dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
  await page.goto(`${base}/c/${slug}?style=${s.style}&scheme=${s.scheme}&chrome=0${rtl}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('[data-demo-case]', { timeout: 60000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { a.pause(); a.currentTime = 0; } }));
  await page.addStyleTag({ content: '*{caret-color:transparent !important}' });
  await page.waitForTimeout(150);
  const buf = await page.screenshot({ fullPage: true, animations: 'disabled' });
  const cases = await page.evaluate(() => [...document.querySelectorAll('[data-demo-case]')].map((e) => e.getAttribute('data-demo-case')));
  await ctx.close();
  return { png: PNG.sync.read(buf), cases };
}

(async () => {
  const { default: pixelmatch } = await import('pixelmatch');
  const browser = await chromium.launch();
  const file = path.join(__dirname, 'angular.pixel-diff.json');
  const out = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  for (const slug of slugs) {
    out[slug] = [];
    for (const s of SETUPS) {
      try {
        const [r, a] = [await shot(browser, R, slug, s), await shot(browser, A, slug, s)];
        const w = Math.min(r.png.width, a.png.width);
        const h = Math.min(r.png.height, a.png.height);
        const crop = (p) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(p, o, 0, 0, w, h, 0, 0); return o; };
        const rc = crop(r.png), ac = crop(a.png);
        const d = new PNG({ width: w, height: h });
        const n = pixelmatch(rc.data, ac.data, d.data, w, h, { threshold: 0.1 });
        const missing = r.cases.filter((c) => !a.cases.includes(c));
        const extra = a.cases.filter((c) => !r.cases.includes(c));
        const row = { ...s, diff: n, reactH: r.png.height, angularH: a.png.height, casesReact: r.cases.length, casesAngular: a.cases.length, missingInAngular: missing.slice(0, 10), extraInAngular: extra.slice(0, 10) };
        if (n > 0) fs.writeFileSync(path.join(__dirname, `angular.diff.${slug}.${s.style}-${s.dir}.png`), PNG.sync.write(d));
        out[slug].push(row);
        console.log(slug, s.style, s.dir, 'diff', n, 'h', r.png.height, a.png.height, 'cases', r.cases.length, a.cases.length);
      } catch (e) {
        out[slug].push({ ...s, error: String(e.message || e).slice(0, 200) });
        console.log(slug, s.style, s.dir, 'ERROR', String(e.message || e).slice(0, 120));
      }
    }
    fs.writeFileSync(file, JSON.stringify(out, null, 0));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
