// Order 1.28 capture: node capture.cjs <before|after> [url] [--only a,b] [--styles a,b]
// Takes each component in every style (dark and light) and in web, ios and
// android for Neutral and Liquid, then builds the side by side sheets:
//   sheets/<phase>/<component>.styles.png    one column per style, dark row and light row
//   sheets/<phase>/<component>.platforms.png one column per platform, Neutral and Liquid rows
// Flags: --only <components>, --styles <ids>, --no-styles, --no-platforms.
// Overlays are opened through the demo's first trigger. Reduced motion is on
// so the shot is the settled state.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const phase = process.argv[2] || 'before';
const url = (process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'http://localhost:5178').replace(/\/$/, '');
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1].split(',') : null; };
const here = __dirname;
const STYLES = arg('--styles') || ['studio', 'desk', 'neutral', 'liquid', 'paper'].filter((s) => fs.existsSync(path.join(here, '../../../../packages/styles', s)));
const COMPONENTS = [
  ['switch'], ['checkbox'], ['radio-group'], ['button'], ['copy-button'],
  ['toast', true], ['dialog', true], ['alert-dialog', true], ['sheet', true],
  ['select', true], ['dropdown-menu', true], ['tabs'], ['segmented-control'],
].filter(([c]) => !arg('--only') || arg('--only').includes(c));

async function shot(page, slug, open, q, file, vp) {
  await page.setViewportSize(vp);
  await page.goto(`${url}/c/${slug}?${new URLSearchParams({ ...q, dir: 'ltr', lang: 'en', chrome: '0' })}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (open) {
    const t = page.locator('[data-demo-trigger]').first();
    await t.scrollIntoViewIfNeeded().catch(() => {});
    await t.click().catch(() => {});
    if (slug === 'toast') { await page.waitForTimeout(150); await page.locator('[data-demo-trigger]').nth(1).click().catch(() => {}); }
  }
  await page.waitForTimeout(open ? 700 : 250);
  await page.mouse.move(1, 1);
  await page.screenshot({ path: file });
}

async function sheet(browser, cells, cols, rows, file) {
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  const img = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  const html = `<body style="margin:0;background:#888;font:600 13px system-ui">
  <table style="border-spacing:6px"><tr><td></td>${cols.map((c) => `<td>${c}</td>`).join('')}</tr>
  ${rows.map((r, ri) => `<tr><td style="writing-mode:vertical-rl">${r}</td>${cols.map((c, ci) => { const p = cells[ri][ci]; return `<td>${p && fs.existsSync(p) ? `<img src="${img(p)}" style="display:block">` : 'missing'}</td>`; }).join('')}</tr>`).join('')}
  </table></body>`;
  await page.setContent(html);
  await page.locator('table').screenshot({ path: file });
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const raw = path.join(here, '../../../../node_modules/.cache/hook-wiring', phase); // raw shots stay out of git
  const out = path.join(here, 'sheets', phase);
  fs.mkdirSync(raw, { recursive: true });
  fs.mkdirSync(out, { recursive: true });
  for (const [slug, open] of COMPONENTS) {
    if (!process.argv.includes('--no-styles')) {
    const cells = [[], []];
    for (const style of STYLES) for (const [si, scheme] of ['dark', 'light'].entries()) {
      const f = path.join(raw, `${slug}.${style}.${scheme}.png`);
      await shot(page, slug, open, { style, scheme }, f, { width: 560, height: 520 });
      cells[si].push(f);
    }
    await sheet(browser, cells, STYLES, ['dark', 'light'], path.join(out, `${slug}.styles.png`));
    }
    if (!process.argv.includes('--no-platforms')) {
    const pcells = [];
    const prow = [];
    for (const [style, scheme] of [['neutral', 'light'], ['liquid', 'dark'], ['neutral', 'dark'], ['liquid', 'light']]) {
      const row = [];
      for (const platform of ['web', 'ios', 'android']) {
        const f = path.join(raw, `${slug}.${style}.${scheme}.${platform}.png`);
        await shot(page, slug, open, { style, scheme, platform }, f, { width: 390, height: 600 });
        row.push(f);
      }
      pcells.push(row); prow.push(`${style} ${scheme}`);
    }
    await sheet(browser, pcells, ['web', 'ios', 'android'], prow, path.join(out, `${slug}.platforms.png`));
    }
    console.log('done', slug);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
