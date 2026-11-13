// Review N15 probe: the slider value bubble never covers the value output,
// and on a touch screen it sits clear of the finger.
// For each platform (web, ios, android) and pointer (mouse; touch with a
// coarse pointer), it holds the thumb of a slider that shows its value output
// and of one that does not, and records:
// - outputCovered: the shown bubble intersects the value output;
// - fingerClear: on touch, the bubble's bottom is at least one touch target
//   (44px) above the thumb's centre, where the finger presses.
// Usage: node probe-slider-bubble.mjs [baseUrl] [out.json]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5184';
const out = process.argv[3] ?? new URL('./slider-bubble.json', import.meta.url).pathname;
const browser = await chromium.launch();
const rows = [];
for (const platform of ['web', 'ios', 'android'])
  for (const pointer of ['mouse', 'touch']) {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 900 }, hasTouch: pointer === 'touch', isMobile: pointer === 'touch' });
    const page = await ctx.newPage();
    for (const which of ['output', 'bubble']) {
      await page.goto(`${base}/interactions?focus=slider-bubble&style=desk&scheme=light&chrome=0${platform === 'web' ? '' : `&platform=${platform}`}`);
      await page.waitForSelector('[data-part=thumb]');
      await page.waitForTimeout(400);
      // Hold the thumb with a pointer: the stage zooms, so read the box after load.
      const thumb = page.locator(`[data-stage-${which}] [data-part=thumb]`).first();
      const bb = await thumb.boundingBox();
      const x = bb.x + bb.width / 2;
      const y = bb.y + bb.height / 2;
      const type = pointer === 'touch' ? 'touch' : 'mouse';
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      if (type === 'touch') {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 20, y }] });
      } else {
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 20, y, { steps: 4 });
      }
      await page.waitForTimeout(600);
      const m = await page.evaluate(([which]) => {
        const tagged = document.querySelector(`[data-stage-${which}]`);
        const s = tagged.closest('[data-ds=slider], [data-ds=range-slider]') ?? tagged;
        const zoom = s.getBoundingClientRect().width / s.offsetWidth || 1;
        const thumb = s.querySelector('[data-part=thumb]:focus') ?? s.querySelector('[data-part=thumb]');
        const bubble = thumb.querySelector(':scope > span[aria-hidden=true]');
        const cs = getComputedStyle(bubble);
        const shown = cs.visibility !== 'hidden' && Number(cs.opacity) > 0.5;
        const b = bubble.getBoundingClientRect();
        const t = thumb.getBoundingClientRect();
        const out = s.querySelector(':scope > [data-part=value]')?.getBoundingClientRect();
        const hit = (a, c) => a && c && a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
        return {
          dragging: s.hasAttribute('data-dragging'),
          shown,
          outputCovered: Boolean(shown && hit(b, out)),
          clearance: Math.round(((t.top + t.height / 2 - b.bottom) / zoom) * 10) / 10,
        };
      }, [which]);
      if (type === 'touch') await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      else await page.mouse.up();
      const fingerClear = pointer === 'mouse' || !m.shown || m.clearance >= 44;
      const pass = m.dragging && !m.outputCovered && fingerClear && (which === 'output' ? !m.shown : m.shown);
      rows.push({ platform, pointer, slider: which, pass, ...m, fingerClear });
    }
    await ctx.close();
  }
await browser.close();
const failed = rows.filter((r) => !r.pass);
writeFileSync(out, `${JSON.stringify({ base, total: rows.length, failed: failed.length, rows }, null, 1)}\n`);
console.log(`${rows.length - failed.length} of ${rows.length} pass`);
for (const r of failed) console.log(`FAIL ${r.platform} ${r.pointer} ${r.slider}: ${JSON.stringify(r)}`);
process.exit(failed.length ? 1 : 0);
