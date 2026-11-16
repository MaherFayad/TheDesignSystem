import { chromium, devices } from 'playwright';
const b = await chromium.launch();
for (const pl of ['ios', 'android', 'web', 'macos']) for (const w of [320, 360, 393, 480, 600, 720, 834, 1024, 1180, 1280, 1366, 1440]) for (const lang of ['', '/ar']) {
  const p = await b.newPage({ viewport: { width: w, height: 800 } });
  await p.goto(`http://localhost:4471${lang}/components/switch/?platform=${pl}`, { waitUntil: 'load' });
  const r = await p.evaluate(() => {
    const parts = ['.menu-btn', '.brand-mark', '.brand > span:not(.version)', '.version', '.search-btn', '.topnav', ...[...document.querySelectorAll('.tools > *')].map((_, i) => `.tools > :nth-child(${i + 1})`)];
    const rects = parts.map((sel) => [sel, document.querySelector(sel)?.getBoundingClientRect()]).filter(([, r]) => r && r.width > 1 && r.height > 1);
    const hits = [];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const [a, ra] = rects[i]; const [b2, rb] = rects[j]; if (ra.left < rb.right - 0.5 && rb.left < ra.right - 0.5 && ra.top < rb.bottom - 0.5 && rb.top < ra.bottom - 0.5) hits.push(`${a}/${b2}`); }
    const vw = document.documentElement.clientWidth;
    const out = rects.filter(([, r]) => r.left < -0.5 || r.right > vw + 0.5).map(([s]) => s);
    return { sw: document.documentElement.scrollWidth > vw, hits, out };
  });
  if (r.sw || r.hits.length || r.out.length) console.log(pl, w, lang || 'en', JSON.stringify(r));
  await p.close();
}
console.log('done');
await b.close();
