// ds-qa regression reviewer, order 1.22. The digit roll after a change, in
// Arabic RTL: on /interactions?focus=<id>&dir=rtl&lang=ar click the trigger
// a few times, finish the animations, then compare each digit host's
// visible left to right order with its text. Writes recheck.digit-rtl-after.json.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const IDS = ['stat-roll', 'pagination-roll', 'field-step', 'badge-count', 'filter-count-roll', 'slider-bubble', 'scrub-roll', 'picker-value-roll', 'language-roll'];
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (const id of IDS) {
    const p = await b.newPage({ viewport: { width: 960, height: 640 }, deviceScaleFactor: 2 });
    await p.goto(`http://127.0.0.1:5190/interactions?focus=${id}&style=neutral&scheme=light&chrome=0&dir=rtl&lang=ar`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const trig = p.locator('[data-interaction-trigger]').first();
    for (let k = 0; k < 3; k++) { if (await trig.count()) { await trig.click().catch(() => {}); await p.waitForTimeout(700); } }
    await p.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { /* inf */ } }));
    const r = await p.evaluate(() => {
      const seen = new Set(); const res = [];
      for (const col of document.querySelectorAll('[data-digit]:not([data-digit-out])')) {
        const host = col.parentElement; if (seen.has(host)) continue; seen.add(host);
        const cols = [...host.children].filter((c) => c.hasAttribute('data-digit') && !c.hasAttribute('data-digit-out'));
        const src = cols.map((c) => c.textContent).join('');
        const vis = [...cols].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map((c) => c.textContent).join('');
        res.push({ src, visibleLeftToRight: vis, direction: getComputedStyle(host).direction });
      }
      return res;
    });
    const bad = r.filter((h) => h.direction === 'rtl' && /\d\d/.test(h.src));
    console.log(id, JSON.stringify(r).slice(0, 300), 'multiDigitInRtl', bad.length);
    if (bad.length) await p.locator('[data-interaction-stage]').screenshot({ path: path.join(__dirname, `recheck.digit-rtl-after.${id}.png`) }).catch(() => {});
    out.push({ id, hosts: r });
    await p.close();
  }
  fs.writeFileSync(path.join(__dirname, 'recheck.digit-rtl-after.json'), JSON.stringify(out, null, 1));
  await b.close();
})();
