// Review B6 probe: an empty floating field shows its label inside the box.
// For each style, platform (web, ios, android), direction and size (sm, md, lg):
// - hit test: elementFromPoint at the label's centre returns the label (its
//   pointer-events are lifted for the test only), so nothing paints over it;
// - paint: a screenshot of the label's box differs with the label shown and
//   hidden, so its glyphs are drawn above the control box;
// - centre: the label's centre is within 1px of the box's centre on the block axis.
// Usage: node probe-floating-label.mjs [baseUrl] [out.json]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5184';
const out = process.argv[3] ?? new URL('./floating-label.json', import.meta.url).pathname;
const styles = ['studio', 'desk', 'neutral', 'liquid'];
const platforms = ['web', 'ios', 'android'];
const dirs = ['ltr', 'rtl'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const rows = [];
for (const style of styles)
  for (const platform of platforms)
    for (const dir of dirs) {
      const q = `focus=field-label-focus&style=${style}&scheme=light&chrome=0${platform === 'web' ? '' : `&platform=${platform}`}${dir === 'rtl' ? '&dir=rtl&lang=ar' : ''}`;
      await page.goto(`${base}/interactions?${q}`);
      await page.waitForSelector('[data-stage-floating]');
      await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
      await page.waitForTimeout(700);
      for (const size of ['sm', 'md', 'lg']) {
        const field = page.locator(`[data-stage-floating="${size}"]`);
        const m = await field.evaluate((f) => {
          const label = f.querySelector('[data-part="label"]');
          const box = f.querySelector('[data-ds="input"]');
          const control = f.querySelector('[data-part="control"]');
          const l = label.getBoundingClientRect();
          const b = box.getBoundingClientRect();
          const c = control.getBoundingClientRect();
          const cx = l.left + l.width / 2;
          const cy = l.top + l.height / 2;
          const keep = label.style.pointerEvents;
          label.style.pointerEvents = 'auto';
          const hit = document.elementFromPoint(cx, cy);
          label.style.pointerEvents = keep;
          const pad = parseFloat(getComputedStyle(control).paddingInlineStart) || 0;
          const rtl = getComputedStyle(f).direction === 'rtl';
          const textStart = rtl ? c.right - pad : c.left + pad;
          const labelStart = rtl ? l.right : l.left;
          return {
            hitsLabel: Boolean(hit && label.contains(hit)),
            hit: hit ? `${hit.tagName.toLowerCase()}${hit.dataset.part ? `[${hit.dataset.part}]` : ''}${hit.dataset.ds ? `{${hit.dataset.ds}}` : ''}` : 'none',
            centreOffset: Math.round((cy - (b.top + b.height / 2)) * 100) / 100,
            inlineOffset: Math.round(Math.abs(labelStart - textStart) * 100) / 100,
            boxHeight: Math.round(b.height * 100) / 100,
            rect: { x: l.left, y: l.top, width: l.width, height: l.height },
          };
        });
        const clip = { x: Math.floor(m.rect.x), y: Math.floor(m.rect.y), width: Math.ceil(m.rect.width) + 1, height: Math.ceil(m.rect.height) + 1 };
        const shown = await page.screenshot({ clip });
        await field.evaluate((f) => (f.querySelector('[data-part="label"]').style.visibility = 'hidden'));
        const hidden = await page.screenshot({ clip });
        await field.evaluate((f) => (f.querySelector('[data-part="label"]').style.visibility = ''));
        const paints = Buffer.compare(shown, hidden) !== 0;
        const pass = m.hitsLabel && paints && Math.abs(m.centreOffset) <= 1;
        rows.push({ style, platform, dir, size, pass, hitsLabel: m.hitsLabel, hit: m.hit, paints, centreOffset: m.centreOffset, inlineOffset: m.inlineOffset, boxHeight: m.boxHeight });
      }
    }
await browser.close();
const failed = rows.filter((r) => !r.pass);
writeFileSync(out, `${JSON.stringify({ base, total: rows.length, failed: failed.length, rows }, null, 1)}\n`);
console.log(`${rows.length - failed.length} of ${rows.length} pass`);
for (const r of failed) console.log(`FAIL ${r.style} ${r.platform} ${r.dir} ${r.size}: hit=${r.hit} paints=${r.paints} centre=${r.centreOffset} inline=${r.inlineOffset}`);
process.exit(failed.length ? 1 : 0);
