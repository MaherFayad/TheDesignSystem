// angular-sync-3 section 6 item 4 probe: a FilterBar plays no FLIP when it
// mounts. Records every Web Animation started on a FilterBar part or chip in
// the first 1.5s after load, per style, from a script injected before the page runs.
// Then it presses the first chip: that change must still play (afterPress above 0).
// Usage: node probe-filterbar-mount.mjs [baseUrl] [out.json]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5184';
const out = process.argv[3] ?? new URL('./filterbar-mount.json', import.meta.url).pathname;
const browser = await chromium.launch();
const rows = [];
for (const style of ['studio', 'desk', 'neutral', 'liquid'])
  for (const dir of ['ltr', 'rtl']) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.addInitScript(() => {
      window.__flips = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (k, o) {
        if (this.closest?.('[data-ds="filter-bar"]')) window.__flips.push(`${this.dataset?.ds ?? this.dataset?.part ?? this.tagName} ${typeof o === 'object' ? (o.id ?? '') : ''}`);
        return animate.call(this, k, o);
      };
    });
    await page.goto(`${base}/c/filter-bar?style=${style}${dir === 'rtl' ? '&dir=rtl&lang=ar' : ''}`);
    await page.waitForSelector('[data-ds="filter-bar"]');
    await page.waitForTimeout(1500);
    const flips = await page.evaluate(() => window.__flips.splice(0));
    await page.locator('[data-ds="filter-bar"] [data-ds="chip"]').first().click();
    await page.waitForTimeout(400);
    const afterPress = await page.evaluate(() => window.__flips.length);
    rows.push({ style, dir, count: flips.length, afterPress, flips: [...new Set(flips)], pass: flips.length === 0 && afterPress > 0 });
    await page.close();
  }
await browser.close();
const failed = rows.filter((r) => !r.pass);
writeFileSync(out, `${JSON.stringify({ base, total: rows.length, failed: failed.length, rows }, null, 1)}\n`);
console.log(`${rows.length - failed.length} of ${rows.length} pass`);
for (const r of failed) console.log('FAIL', r.style, r.dir, r.count, r.flips.join(' | '));
process.exit(failed.length ? 1 : 0);
