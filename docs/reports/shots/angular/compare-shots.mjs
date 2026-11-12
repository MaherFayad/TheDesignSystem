// Captures the same pages from both galleries and compares them with pixelmatch.
// node docs/reports/shots/angular/compare-shots.mjs <react url> <angular url> docs/reports/shots/angular
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const [reactBase, ngBase, outDir] = process.argv.slice(2);
const combos = [
  ['studio-dark', 'style=studio&scheme=dark'],
  ['studio-light', 'style=studio&scheme=light'],
  ['desk-dark', 'style=desk&scheme=dark'],
  ['desk-light', 'style=desk&scheme=light'],
  ['desk-dark-rtl-ar', 'style=desk&scheme=dark&dir=rtl&lang=ar'],
];
const pages = [
  ['button', null],
  ['icon-button', null],
  ['dialog', '[data-demo-trigger="md"]'],
];
const browser = await chromium.launch();
const rows = [];
async function shot(base, slug, query, trigger) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${base}/c/${slug}?${query}&chrome=0`);
  await page.locator('[data-demo-case]').first().waitFor({ state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  if (trigger) {
    await page.click(trigger);
    await page.locator('[data-ds="dialog"] [data-part="panel"]').waitFor();
    await page.waitForTimeout(400);
  }
  const buf = await page.screenshot({ fullPage: !trigger, animations: 'disabled', caret: 'hide' });
  await ctx.close();
  return buf;
}
for (const [slug, trigger] of pages) {
  for (const [name, query] of combos) {
    const id = `${slug}-${name}`;
    const r = await shot(reactBase, slug, query, trigger);
    const a = await shot(ngBase, slug, query, trigger);
    writeFileSync(join(outDir, `react-${id}.png`), r);
    writeFileSync(join(outDir, `angular-${id}.png`), a);
    const ra = PNG.sync.read(r), aa = PNG.sync.read(a);
    if (ra.width !== aa.width || ra.height !== aa.height) {
      rows.push({ id, size: `${ra.width}x${ra.height} vs ${aa.width}x${aa.height}`, diff: null, pct: null });
      continue;
    }
    const diff = new PNG({ width: ra.width, height: ra.height });
    const n = pixelmatch(ra.data, aa.data, diff.data, ra.width, ra.height, { threshold: 0.1 });
    writeFileSync(join(outDir, `diff-${id}.png`), PNG.sync.write(diff));
    rows.push({ id, size: `${ra.width}x${ra.height}`, diff: n, pct: (100 * n / (ra.width * ra.height)).toFixed(4) });
  }
}
await browser.close();
writeFileSync(join(outDir, 'results.json'), JSON.stringify(rows, null, 2) + '\n');
for (const r of rows) console.log(`${r.id}\t${r.size}\t${r.diff}\t${r.pct}%`);
