// Review N19 probe: on Android, focus thickens the field's active indicator
// without a content nudge. For Input (filled and outlined), SearchField and
// Textarea, the native control's box is read before and after focus; the
// move must be 0px, and the bottom 2px of the box must change on focus (the
// thicker indicator is drawn).
// Usage: node probe-android-focus.mjs [baseUrl] [out.json]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5184';
const out = process.argv[3] ?? new URL('./android-focus.json', import.meta.url).pathname;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
const rows = [];
const targets = [
  ['focus-glow stage, Input', '/interactions?focus=focus-glow&style=neutral&scheme=light&chrome=0&platform=android', '[data-ds=input]'],
  ['focus-glow stage, SearchField', '/interactions?focus=focus-glow&style=neutral&scheme=light&chrome=0&platform=android', '[data-ds=search-field]'],
  ['focus-glow stage, Textarea', '/interactions?focus=focus-glow&style=neutral&scheme=light&chrome=0&platform=android', '[data-ds=textarea]'],
  ['Input demo, outlined', '/c/input?style=neutral&platform=android', '[data-demo-case=variant] [data-ds=input][data-variant=outlined]'],
  ['Input demo, filled', '/c/input?style=neutral&platform=android', '[data-demo-case=variant] [data-ds=input][data-variant=filled]'],
];
for (const [name, path, sel] of targets) {
  await page.goto(`${base}${path}`);
  await page.waitForSelector(sel);
  await page.waitForTimeout(400);
  const box = page.locator(sel).first();
  const control = box.locator('textarea, input').first();
  await box.scrollIntoViewIfNeeded();
  const read = () => control.evaluate((c) => { const r = c.getBoundingClientRect(); return { top: r.top, height: r.height }; });
  const bb = await box.boundingBox();
  const edge = { x: Math.floor(bb.x) + 8, y: Math.floor(bb.y + bb.height) - 2, width: Math.max(8, Math.floor(bb.width) - 16), height: 2 };
  const before = await read();
  const edgeBefore = await page.screenshot({ clip: edge });
  await control.focus();
  await page.waitForTimeout(500);
  const after = await read();
  const edgeAfter = await page.screenshot({ clip: edge });
  const move = Math.round((after.top - before.top) * 100) / 100;
  const grow = Math.round((after.height - before.height) * 100) / 100;
  const indicator = Buffer.compare(edgeBefore, edgeAfter) !== 0;
  rows.push({ name, move, grow, indicatorChanges: indicator, pass: move === 0 && grow === 0 && indicator });
  await control.blur();
}
await browser.close();
const failed = rows.filter((r) => !r.pass);
writeFileSync(out, `${JSON.stringify({ base, total: rows.length, failed: failed.length, rows }, null, 1)}\n`);
console.log(`${rows.length - failed.length} of ${rows.length} pass`);
for (const r of failed) console.log(`FAIL ${JSON.stringify(r)}`);
process.exit(failed.length ? 1 : 0);
