// Pagination under forced colors (order 1.29, review N40). With forced
// colors emulated, the current page's border must be Highlight and differ
// from the other pages' borders, in every style.
//
//   node pagination-forced.probe.cjs --out <file.json> [--base <url>]
// Exit code 1 when the current page's border is not Highlight.
const { chromium } = require('playwright');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = { out: 'pagination-forced.json', base: 'http://127.0.0.1:5182' };
for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  let failed = false;
  for (const style of ['studio', 'desk', 'neutral', 'liquid']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, forcedColors: 'active' });
    const page = await ctx.newPage();
    await page.goto(`${opt.base}/c/pagination?style=${style}&scheme=light`, { waitUntil: 'networkidle' });
    await page.waitForSelector("[data-ds='pagination'] > [data-part='page'][data-active]");
    await page.waitForTimeout(300);
    const row = await page.evaluate(() => {
      // The system Highlight color, as this page resolves it.
      const probe = document.createElement('span');
      probe.style.color = 'Highlight';
      document.body.append(probe);
      const highlight = getComputedStyle(probe).color;
      probe.remove();
      const current = document.querySelector("[data-ds='pagination'] > [data-part='page'][data-active]");
      const other = document.querySelector("[data-ds='pagination'] > [data-part='page']:not([data-active])");
      const cs = current && getComputedStyle(current);
      return { highlight, current: cs?.borderTopColor, currentWidth: cs?.borderTopWidth, other: other && getComputedStyle(other).borderTopColor };
    });
    row.style = style;
    row.pass = row.current === row.highlight && row.current !== row.other;
    if (!row.pass) failed = true;
    rows.push(row);
    console.log(`${style}: current border ${row.current} (${row.currentWidth}), others ${row.other}, Highlight ${row.highlight}: ${row.pass ? 'pass' : 'FAIL'}`);
    await ctx.close();
  }
  fs.writeFileSync(opt.out, JSON.stringify({ base: opt.base, forcedColors: 'active', rows }, null, 2) + '\n');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
