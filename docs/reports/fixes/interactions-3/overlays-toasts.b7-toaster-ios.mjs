// B7 probe (order 1.29, lane overlays and toasts): on platform ios the
// toaster sits at the top, the stack grows down (older toasts peek below
// the front one, never above the top inset), the front toast does not move
// on expand, and the swipe goes up. Run with the gallery on port 5183:
//   node docs/reports/fixes/interactions-3/overlays-toasts.b7-toaster-ios.mjs [out.json]
// Exit code 1 when any check fails.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.GALLERY ?? 'http://localhost:5183';
const OUT = process.argv[2];
const styles = ['neutral', 'studio', 'desk', 'liquid'];
const platforms = ['ios', 'android', 'none'];

const browser = await chromium.launch();
const result = {};
let failed = 0;

for (const platform of platforms) {
  for (const style of styles) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const p = platform === 'none' ? '' : `&platform=${platform}`;
    await page.goto(`${BASE}/interactions?focus=toast-expand&style=${style}&scheme=light&chrome=0${p}`);
    await page.waitForSelector('[data-interaction-trigger]');
    await page.click('[data-interaction-trigger]');
    await page.waitForTimeout(900);
    const read = () =>
      page.evaluate(() => {
        const t = document.querySelector('[data-ds="toaster"]');
        const cs = getComputedStyle(t);
        const r = t.getBoundingClientRect();
        const list = [...t.querySelectorAll(':scope > [data-ds="toast"][data-state="open"]')].map((el) => {
          const b = el.getBoundingClientRect();
          // The visible part: the box less the clip.
          const clip = getComputedStyle(el).clipPath;
          return {
            title: el.querySelector('[data-part="title"]')?.textContent,
            idx: el.style.getPropertyValue('--_toast-index'),
            top: Math.round(b.top),
            bottom: Math.round(b.bottom),
            sdir: el.getAttribute('data-swipe-direction'),
            clip,
          };
        });
        const insetTop = parseFloat(cs.getPropertyValue('--_toaster-inset-block-start')) || 0;
        return {
          pos: t.getAttribute('data-position'),
          dir: cs.getPropertyValue('--_toaster-dir').trim(),
          align: cs.getPropertyValue('--_toaster-align').trim(),
          toaster: [Math.round(r.top), Math.round(r.bottom)],
          insetTop,
          list,
        };
      });
    const collapsed = await read();
    const front = collapsed.list.find((e) => e.idx === '0');
    // Hover the front toast to expand.
    const box = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[data-ds="toast"][data-state="open"]')].find((e) => e.style.getPropertyValue('--_toast-index') === '0');
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    });
    await page.mouse.move(box.x, box.y);
    await page.waitForTimeout(900);
    const expanded = await read();
    const frontAfter = expanded.list.find((e) => e.title === front?.title);
    const checks = {};
    if (platform === 'ios') {
      checks.dirDown = collapsed.dir === '1';
      checks.alignStart = collapsed.align === 'start';
      // Older toasts peek below the front one, not above it.
      checks.olderBelow = collapsed.list.filter((e) => e.idx !== '0').every((e) => e.bottom > (front?.bottom ?? 0));
      checks.notIntoStatusBar = collapsed.list.every((e) => e.top >= front.top - 1);
      checks.swipeUp = collapsed.list.every((e) => e.sdir === 'up');
    }
    // On every platform: the front toast stays under the pointer on expand. Its
    // anchored edge (top when the stack grows down, bottom when it grows up)
    // holds; a style may let the card grow from it (Studio wraps the description).
    const edge = collapsed.dir === '1' ? 'top' : 'bottom';
    checks.frontStill = !!frontAfter && Math.abs(frontAfter[edge] - front[edge]) <= 1;
    const pass = Object.values(checks).every(Boolean);
    if (!pass) failed++;
    result[`${style}.${platform}`] = { pass, checks, collapsed, frontAfterExpand: frontAfter && { top: frontAfter.top, bottom: frontAfter.bottom } };
    await page.close();
  }
}
await browser.close();
const json = JSON.stringify(result, null, 1);
if (OUT) writeFileSync(OUT, json + '\n');
for (const [k, v] of Object.entries(result)) console.log(k, v.pass ? 'pass' : 'FAIL', JSON.stringify(v.checks), 'front', JSON.stringify(v.collapsed.list.find((e) => e.idx === '0') && [v.collapsed.list.find((e) => e.idx === '0').top, v.collapsed.list.find((e) => e.idx === '0').bottom]), '->', JSON.stringify(v.frontAfterExpand), 'pos', v.collapsed.pos, 'dir', v.collapsed.dir);
process.exit(failed ? 1 : 0);
