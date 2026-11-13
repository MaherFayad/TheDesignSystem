// B11 probe (order 1.29, Angular B11 and B12): the Slider and RangeSlider fill
// and the ProgressCircle arc, React against Angular, at rest.
// node docs/reports/fixes/interactions-3/angular-b11-b12.pixel.mjs [react url] [angular url] [out json]
//
// For each page (/c/slider, /c/range-slider, /c/progress-circle, every demo
// case), each style, light, en ltr and ar rtl: a full page shot in each
// gallery (1280 by 800, scale 1, reduced motion, animations off, fonts
// loaded, as scripts/shots.ts takes them), a pixel diff (threshold 0.1), and
// per instance the values that draw the fill and the arc:
// - slider: --_slider-from and --_slider-to on the root, the clip-path of the
//   track's ::before (the fill) and the background of the range part;
// - progress circle: data-state, the arc svg box and the computed stroke,
//   stroke-dasharray, stroke-dashoffset and transform of its circle.
// It fails (exit 1) when an instance is missing its fill or arc in Angular,
// when a fill or arc value differs, or when a pair of shots differs.
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const [reactUrl = 'http://localhost:5185', angularUrl = 'http://localhost:5186', out] = process.argv.slice(2);
const SLUGS = ['slider', 'range-slider', 'progress-circle'];
const STYLES = ['studio', 'desk', 'neutral', 'liquid'];
const DIRS = [
  { dir: 'ltr', lang: 'en' },
  { dir: 'rtl', lang: 'ar' },
];

const browser = await chromium.launch();

async function take(base, slug, style, d) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(`${base}/c/${slug}?style=${style}&scheme=light&dir=${d.dir}&lang=${d.lang}&chrome=0`);
    await page.locator('[data-demo-case]').first().waitFor({ state: 'attached', timeout: 30_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 600));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const values = await page.evaluate(() => {
      const sliders = [...document.querySelectorAll('[data-ds="slider"], [data-ds="range-slider"]')].map((root) => {
        const track = root.querySelector('[data-part="track"]');
        const range = root.querySelector('[data-part="range"]');
        return {
          ds: root.getAttribute('data-ds'),
          from: root.style.getPropertyValue('--_slider-from'),
          to: root.style.getPropertyValue('--_slider-to'),
          fill: track ? getComputedStyle(track, '::before').clipPath : 'no track',
          fillContent: track ? getComputedStyle(track, '::before').content : 'no track',
          rangePaint: range ? getComputedStyle(range).backgroundColor : 'no range',
        };
      });
      const circles = [...document.querySelectorAll('[data-ds="progress-circle"]')].map((root) => {
        const svg = root.querySelector(':scope > [data-part="indicator"] > svg[data-part="arc"]');
        const c = svg?.querySelector('circle');
        const cs = c ? getComputedStyle(c) : null;
        const box = svg?.getBoundingClientRect();
        return {
          state: root.getAttribute('data-state'),
          arc: Boolean(svg),
          box: box ? `${Math.round(box.width)}x${Math.round(box.height)}` : null,
          stroke: cs?.stroke ?? null,
          dasharray: cs?.strokeDasharray ?? null,
          dashoffset: cs?.strokeDashoffset ?? null,
          transform: svg ? getComputedStyle(svg).transform : null,
        };
      });
      return { sliders, circles };
    });
    const png = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css' });
    return { values, png };
  } finally {
    await context.close();
  }
}

// A dev server in a shared working tree rebuilds when another lane saves: a
// page that does not render, or renders no instance, is taken again.
async function takeStable(base, slug, style, d) {
  let last;
  for (let i = 0; i < 3; i += 1) {
    try {
      last = await take(base, slug, style, d);
      if (last.values.sliders.length + last.values.circles.length > 0) return last;
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  if (last instanceof Error) throw last;
  return last;
}

function diff(a, b) {
  const A = PNG.sync.read(a);
  const B = PNG.sync.read(b);
  if (A.width !== B.width || A.height !== B.height) return { size: `${A.width}x${A.height} vs ${B.width}x${B.height}`, pixels: null };
  return { size: `${A.width}x${A.height}`, pixels: pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.1 }) };
}

const rows = [];
let bad = 0;
for (const slug of SLUGS) {
  for (const style of STYLES) {
    for (const d of DIRS) {
      const r = await takeStable(reactUrl, slug, style, d);
      const a = await takeStable(angularUrl, slug, style, d);
      const shot = diff(r.png, a.png);
      const key = slug === 'progress-circle' ? 'circles' : 'sliders';
      const rv = r.values[key];
      const av = a.values[key];
      const missing =
        key === 'circles'
          ? av.filter((c) => !c.arc).length
          : av.filter((s) => s.from === '' || s.to === '' || s.fill === 'none' || s.fillContent === 'none').length;
      const valuesEqual = JSON.stringify(rv) === JSON.stringify(av);
      const ok = missing === 0 && valuesEqual && rv.length === av.length && shot.pixels === 0;
      if (!ok) bad += 1;
      rows.push({ slug, style, dir: d.dir, instances: { react: rv.length, angular: av.length }, missingInAngular: missing, valuesEqual, shot, ok, react: rv, angular: av });
      console.log(`${ok ? 'pass' : 'FAIL'} ${slug} ${style} ${d.dir}: ${av.length} instances, missing ${missing}, values ${valuesEqual ? 'equal' : 'differ'}, ${shot.pixels ?? shot.size} differing pixels`);
    }
  }
}
await browser.close();
const result = { reactUrl, angularUrl, scheme: 'light', runs: rows.length, failing: bad, rows };
if (out) writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
process.exit(bad ? 1 : 0);
