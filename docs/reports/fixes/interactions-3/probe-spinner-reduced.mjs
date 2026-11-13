// Review N36 probe: under reduced motion (the media query, and the page
// setting data-motion="reduce") no endless loop runs in the spinner family:
// Spinner, the Button loading spinner, and the indeterminate ProgressBar and
// ProgressCircle. Lists every running animation with infinite iterations.
// Usage: node probe-spinner-reduced.mjs [baseUrl] [out.json]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5184';
const out = process.argv[3] ?? new URL('./spinner-reduced.json', import.meta.url).pathname;
const pages = ['/c/spinner', '/c/button', '/c/progress-bar', '/c/progress-circle', '/interactions?focus=spinner-loop&chrome=0'];
const browser = await chromium.launch();
const rows = [];
for (const how of ['none', 'media', 'attribute'])
  for (const style of ['studio', 'desk', 'neutral', 'liquid']) {
    const ctx = await browser.newContext({ reducedMotion: how === 'media' ? 'reduce' : 'no-preference', viewport: { width: 1200, height: 900 } });
    const page = await ctx.newPage();
    for (const path of pages) {
      await page.goto(`${base}${path}${path.includes('?') ? '&' : '?'}style=${style}`);
      await page.waitForSelector('[data-ds]');
      if (how === 'attribute') await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduce'));
      await page.waitForTimeout(400);
      const loops = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
          .map((a) => {
            const t = a.effect.target;
            const host = t.closest('[data-ds]');
            return `${a.animationName ?? a.id} on ${host?.dataset.ds ?? t.tagName}${t.dataset?.part ? `/${t.dataset.part}` : ''}`;
          }),
      );
      const uniq = [...new Set(loops)];
      rows.push({ how, style, path, loops: uniq, pass: how === 'none' ? true : uniq.length === 0 });
    }
    await ctx.close();
  }
await browser.close();
const failed = rows.filter((r) => !r.pass);
writeFileSync(out, `${JSON.stringify({ base, total: rows.length, failed: failed.length, rows }, null, 1)}\n`);
console.log(`${rows.length - failed.length} of ${rows.length} pass`);
for (const r of rows) if (!r.pass || r.how === 'none') console.log(r.pass ? 'loops' : 'FAIL', r.how, r.style, r.path, r.loops.join(', '));
process.exit(failed.length ? 1 : 0);
