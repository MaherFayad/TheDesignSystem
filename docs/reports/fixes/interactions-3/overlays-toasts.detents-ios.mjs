// Detents probe (order 1.29, lane overlays and toasts): on platform ios the
// gallery Sheet rests at half and all of the room. Opens it, reads
// data-detent and where the panel top is, steps with the keyboard on the
// handle, drags it up, and checks the Drawer's grabber is drawn by its
// handle part where the old ::before drew it. Screenshots go next to the JSON.
// Run with the gallery on port 5183:
//   node docs/reports/fixes/interactions-3/overlays-toasts.detents-ios.mjs [out.json]
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.GALLERY ?? 'http://localhost:5183';
const OUT = process.argv[2];
const SHOTS = OUT ? OUT.replace(/\.json$/, '') : null;
const browser = await chromium.launch();
const result = {};
let failed = 0;
for (const style of ['neutral', 'desk']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/interactions?focus=sheet-spring&style=${style}&scheme=light&chrome=0&platform=ios`);
  await page.click('[data-interaction-trigger="sheet"]');
  await page.waitForSelector('[data-ds="sheet"][data-detent]');
  await page.waitForTimeout(300);
  const read = () =>
    page.evaluate(() => {
      const root = document.querySelector('[data-ds="sheet"]');
      const panel = root.querySelector(':scope > [data-part="panel"]');
      const handle = panel.querySelector(':scope > [data-part="handle"]');
      return { detent: root.getAttribute('data-detent'), top: Math.round(panel.getBoundingClientRect().top), height: Math.round(panel.getBoundingClientRect().height), handle: handle.tagName, label: handle.getAttribute('aria-label'), transform: getComputedStyle(panel).transform };
    });
  const half = await read();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}.${style}.half.png` });
  await page.focus('[data-ds="sheet"] [data-part="handle"]');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);
  const full = await read();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}.${style}.full.png` });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const cycled = await read();
  // Drag the handle up past the largest detent with a mouse and hold: a rubber band, less than the pointer.
  const h = await page.locator('[data-ds="sheet"] [data-part="handle"]').boundingBox();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2 - 300, { steps: 8 });
  await page.waitForTimeout(100);
  const dragging = await page.evaluate(() => getComputedStyle(document.querySelector('[data-ds="sheet"] > [data-part="panel"]')).getPropertyValue('--_dialog-drag-y'));
  await page.mouse.up();
  await page.waitForTimeout(300);
  const released = await read();
  const checks = {
    halfFirst: half.detent === '0' && half.handle === 'BUTTON',
    upMovesUp: full.detent === '1' && full.top < half.top,
    sameHeight: full.height === half.height,
    enterCycles: cycled.detent === '0',
    dragSettlesLarge: released.detent === '1',
  };
  const pass = Object.values(checks).every(Boolean);
  if (!pass) failed++;
  result[`${style}.sheet`] = { pass, checks, half, full, cycled, dragging, released };
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // The Drawer: the grabber is the handle-bar, at the top centre.
  await page.click('[data-interaction-trigger="drawer"]');
  await page.waitForSelector('[data-ds="drawer"] [data-part="handle-bar"]');
  await page.waitForTimeout(300);
  const drawer = await page.evaluate(() => {
    const panel = document.querySelector('[data-ds="drawer"] > [data-part="panel"]');
    const bar = panel.querySelector('[data-part="handle-bar"]').getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    return { bar: [Math.round(bar.x - p.x), Math.round(bar.y - p.y), Math.round(bar.width), Math.round(bar.height)], panelWidth: Math.round(p.width), color: getComputedStyle(panel.querySelector('[data-part="handle-bar"]')).backgroundColor, before: getComputedStyle(panel, '::before').content };
  });
  if (SHOTS) await page.screenshot({ path: `${SHOTS}.${style}.drawer.png` });
  const centred = Math.abs(drawer.bar[0] + drawer.bar[2] / 2 - drawer.panelWidth / 2) <= 1;
  const dpass = centred && drawer.bar[2] === 36 && drawer.bar[3] === 5 && drawer.color !== 'rgba(0, 0, 0, 0)' && drawer.before === 'none';
  if (!dpass) failed++;
  result[`${style}.drawer`] = { pass: dpass, ...drawer };
  await ctx.close();
}
await browser.close();
if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n');
for (const [k, v] of Object.entries(result)) console.log(k, v.pass ? 'pass' : 'FAIL', JSON.stringify(v));
process.exit(failed ? 1 : 0);
