// Proof for order R0.11: the top bar at every width from 320 to 1440, in each
// platform and both languages. Reports any overlap of its parts, any part
// outside the viewport and any horizontal scroll. Needs the site served.
// Run from the repo root: BASE=http://localhost:4400 node apps/docs/scripts/proof/bar-widths.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.env.BASE ?? 'http://localhost:4400';
const rows = [];
const b = await chromium.launch();
for (const pl of ['ios', 'android', 'web', 'macos']) for (const w of [320, 360, 393, 480, 600, 720, 834, 1024, 1180, 1280, 1366, 1440]) for (const lang of ['', '/ar']) {
  const p = await b.newPage({ viewport: { width: w, height: 800 } });
  await p.goto(`${base}${lang}/components/switch/?platform=${pl}`, { waitUntil: 'load' });
  const r = await p.evaluate(() => {
    const parts = ['.menu-btn', '.brand-mark', '.brand > span:not(.version)', '.version', '.search-btn', '.topnav', ...[...document.querySelectorAll('.tools > *')].map((_, i) => `.tools > :nth-child(${i + 1})`)];
    const rects = parts.map((sel) => [sel, document.querySelector(sel)?.getBoundingClientRect()]).filter(([, r]) => r && r.width > 1 && r.height > 1);
    const hits = [];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const [a, ra] = rects[i]; const [b2, rb] = rects[j]; if (ra.left < rb.right - 0.5 && rb.left < ra.right - 0.5 && ra.top < rb.bottom - 0.5 && rb.top < ra.bottom - 0.5) hits.push(`${a}/${b2}`); }
    const vw = document.documentElement.clientWidth;
    const out = rects.filter(([, r]) => r.left < -0.5 || r.right > vw + 0.5).map(([s]) => s);
    return { sw: document.documentElement.scrollWidth > vw, hits, out };
  });
  rows.push({ platform: pl, width: w, lang: lang ? 'ar' : 'en', ...r });
  if (r.sw || r.hits.length || r.out.length) console.log('FAIL', pl, w, lang || 'en', JSON.stringify(r));
  await p.close();
}
const bad = rows.filter((r) => r.sw || r.hits.length || r.out.length).length;
fs.writeFileSync('docs/reports/reset/R0.11/bar-widths.json', JSON.stringify({ base, cases: rows.length, failing: bad }) + '\n');
console.log(`${rows.length} cases, ${bad} failing`);
process.exitCode = bad ? 1 : 0;
await b.close();
