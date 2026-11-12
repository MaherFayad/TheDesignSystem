import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import { PNG } from '/home/user/TheDesignSystem/node_modules/pngjs/lib/png.js';
import pixelmatch from '/home/user/TheDesignSystem/node_modules/pixelmatch/index.js';
const out = process.argv[2];
const b = await chromium.launch();
const shots = {};
const anim = {};
for (const [g, base] of [['react', 'http://localhost:5301'], ['angular', 'http://localhost:5302']]) {
  for (const q of ['style=studio', 'style=desk&dir=rtl&lang=ar']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(`${base}/c/checkbox?${q}`);
    await p.waitForSelector('[data-demo-case]', { state: 'attached' });
    await p.waitForTimeout(500);
    const el = p.locator('[data-demo-case=variants]');
    const buf = await el.screenshot({ animations: 'disabled' });
    shots[`${g} ${q}`] = buf;
    // The draw: click an unchecked box and sample the clip transform and opacity for 300 ms.
    const box = p.locator('[data-demo-case=many] [role=checkbox][aria-checked=false]').first();
    await box.click();
    anim[`${g} ${q}`] = await p.evaluate(async () => {
      const ind = document.querySelector('[data-demo-case=many] [role=checkbox][aria-checked=true] [data-part=indicator]');
      const samples = [];
      for (let i = 0; i < 6; i++) {
        const span = ind.querySelector(':scope > span');
        const target = span ?? ind.querySelector('svg'); if (!target) { samples.push('no glyph'); await new Promise((r) => setTimeout(r, 50)); continue; }
        const cs = getComputedStyle(target);
        samples.push(`${span ? 'span' : 'svg'} t=${cs.transform} o=${cs.opacity}`);
        await new Promise((r) => setTimeout(r, 50));
      }
      return samples;
    });
    await p.close();
  }
}
for (const q of ['style=studio', 'style=desk&dir=rtl&lang=ar']) {
  const a = PNG.sync.read(shots[`react ${q}`]); const c = PNG.sync.read(shots[`angular ${q}`]);
  if (a.width !== c.width || a.height !== c.height) { console.log(q, 'size differs', a.width, a.height, c.width, c.height); continue; }
  const diff = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, c.data, diff.data, a.width, a.height, { threshold: 0.1 });
  console.log(q, 'differing pixels', n, (100 * n / (a.width * a.height)).toFixed(3) + '%');
  const tag = q.includes('rtl') ? 'rtl' : 'ltr';
  fs.writeFileSync(`${out}/checkbox-variants-${tag}.react.png`, shots[`react ${q}`]);
  fs.writeFileSync(`${out}/checkbox-variants-${tag}.angular.png`, shots[`angular ${q}`]);
  fs.writeFileSync(`${out}/checkbox-variants-${tag}.diff.png`, PNG.sync.write(diff));
}
console.log(JSON.stringify(anim, null, 1));
await b.close();
