// Review N18 probe: in form-submit-success the Send label stays whole and in
// place inside its button. After a press of Send on the stage, the label's
// offset from the button's centre and the share of the label inside the
// button are sampled at 0, 20, 40, 60, 100, 160 and 240ms (animations paused
// and seeked), per style. Two runs: "arrive" moves the pointer onto Send
// and presses in the same frame (as the review sheet did); "rest" lets the
// pointer rest on Send for 700ms first, as a person does. The label passes
// when it travels at most 1px after the press (travel, max minus min).
// Usage: node probe-submit-label.mjs [baseUrl] [out.json]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5184';
const out = process.argv[3] ?? new URL('./submit-label.json', import.meta.url).pathname;
const times = [0, 20, 40, 60, 100, 160, 240];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
const rows = [];
for (const run of ['arrive', 'rest'])
for (const style of ['studio', 'desk', 'neutral', 'liquid']) {
  await page.goto(`${base}/interactions?focus=form-submit-success&style=${style}&scheme=light&chrome=0`);
  await page.waitForSelector('[data-ds=form] [type=submit]');
  await page.waitForTimeout(400);
  const btn = page.locator('[data-ds=form] [type=submit]').first();
  if (run === 'rest') {
    await btn.hover();
    await page.waitForTimeout(700);
  }
  await btn.click();
  // Pause every animation at once, then seek them all together.
  await page.evaluate(() => {
    window.__anims = document.getAnimations();
    window.__start = window.__anims.map((a) => a.currentTime ?? 0);
    for (const a of window.__anims) a.pause();
  });
  const samples = [];
  for (const t of times) {
    const m = await page.evaluate((t) => {
      window.__anims.forEach((a, i) => (a.currentTime = window.__start[i] + t));
      const b = document.querySelector('[data-ds=form] [type=submit]');
      const label = b.querySelector('[data-part=label]') ?? b;
      const br = b.getBoundingClientRect();
      const lr = label.getBoundingClientRect();
      const zoom = br.width / b.offsetWidth || 1;
      const top = Math.max(lr.top, br.top);
      const bottom = Math.min(lr.bottom, br.bottom);
      return {
        t,
        offsetY: Math.round((((lr.top + lr.bottom) / 2 - (br.top + br.bottom) / 2) / zoom) * 10) / 10,
        inside: Math.round((Math.max(0, bottom - top) / (lr.height || 1)) * 100) / 100,
        loading: b.hasAttribute('data-loading'),
      };
    }, t);
    samples.push(m);
  }
  const ys = samples.map((s) => s.offsetY);
  const travel = Math.round((Math.max(...ys) - Math.min(...ys)) * 10) / 10;
  rows.push({ run, style, pass: travel <= 1 && !samples.some((s) => s.loading), travel, samples });
}
await browser.close();
const failed = rows.filter((r) => !r.pass);
writeFileSync(out, `${JSON.stringify({ base, total: rows.length, failed: failed.length, rows }, null, 1)}\n`);
console.log(`${rows.length - failed.length} of ${rows.length} pass`);
for (const r of rows) console.log(r.run, r.style, r.pass, r.travel, JSON.stringify(r.samples.map((s) => [s.t, s.offsetY, s.inside, s.loading])));
process.exit(failed.length ? 1 : 0);
