// ds-qa regression reviewer, order 1.22. The digit roll (packages/motion
// primitives/digit-roll.ts) writes every character into its own inline-block
// column. In an RTL paragraph each column is a neutral object, so a number
// can show its digits in reverse, and Arabic letters lose their joining.
// For each component page that uses it, in Arabic RTL and in English LTR,
// read every host (an element whose children are [data-digit] columns),
// order its columns by their screen x, and compare the visible string with
// the text in source order and with the accessible text.
//   node qa-regress.digit-rtl.cjs [base]
// Writes recheck.digit-rtl.json and PNGs of the first wrong host per page.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const base = process.argv[2] || 'http://127.0.0.1:5190';
const PAGES = ['filter-bar', 'stat', 'badge', 'pagination', 'number-field', 'slider', 'range-slider', 'select', 'scrub-input', 'language-switch', 'form-wizard'];
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (const slug of PAGES) {
    for (const dir of ['rtl', 'ltr']) {
      const p = await b.newPage({ viewport: { width: 1024, height: 900 }, deviceScaleFactor: 2 });
      const q = dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
      await p.goto(`${base}/c/${slug}?style=neutral&scheme=light&chrome=0${q}`, { waitUntil: 'networkidle', timeout: 120000 });
      await p.waitForTimeout(1200);
      await p.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { /* inf */ } }));
      // Slider bubbles show on interaction; hover the first thumb.
      if (slug.includes('slider')) { const t = p.locator('[data-part="thumb"]').first(); if (await t.count()) { await t.focus(); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(600); } }
      const hosts = await p.evaluate(() => {
        const res = [];
        const seen = new Set();
        let i = 0;
        for (const col of document.querySelectorAll('[data-digit]:not([data-digit-out])')) {
          const host = col.parentElement;
          if (seen.has(host)) continue;
          seen.add(host);
          const cols = [...host.children].filter((c) => c.hasAttribute('data-digit') && !c.hasAttribute('data-digit-out'));
          const src = cols.map((c) => c.textContent).join('');
          const visualLtr = [...cols].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map((c) => c.textContent).join('');
          const rtlCtx = getComputedStyle(host).direction === 'rtl';
          // What a reader sees left to right for the source text: digits LTR, Arabic RTL.
          const digitsLtr = (s) => (s.match(/[0-9٠-٩][0-9٠-٩.,٫٬]*[0-9٠-٩]|[0-9٠-٩]/g) || []);
          const visDigits = digitsLtr(visualLtr);
          const srcDigits = digitsLtr(src);
          const reversed = rtlCtx ? srcDigits.some((d, k) => d.length > 1 && !visDigits.includes(d)) : false;
          const arabicSplit = /[؀-ۿ]{2,}/.test(src);
          const id = `dg${i++}`;
          host.setAttribute('data-qa-digit', id);
          res.push({ id, src, visualLtr, rtlCtx, srcNumbers: srcDigits, visibleNumbers: visDigits, reversed, arabicLettersSplit: arabicSplit, hostDir: getComputedStyle(host).direction, unicodeBidi: getComputedStyle(host).unicodeBidi });
        }
        return res;
      });
      const bad = hosts.filter((h) => h.reversed || h.arabicLettersSplit);
      for (const h of bad.slice(0, 2)) await p.locator(`[data-qa-digit="${h.id}"]`).screenshot({ path: path.join(__dirname, `recheck.digit-rtl.${slug}.${dir}.${h.id}.png`) }).catch(() => {});
      out.push({ slug, dir, hosts: hosts.length, bad: bad.length, rows: hosts.slice(0, 12) });
      console.log(slug, dir, 'hosts', hosts.length, 'bad', bad.length, JSON.stringify(bad.slice(0, 3).map((h) => [h.src, h.visibleNumbers, h.reversed, h.arabicLettersSplit])));
      await p.close();
    }
  }
  fs.writeFileSync(path.join(__dirname, 'recheck.digit-rtl.json'), JSON.stringify(out, null, 1));
  await b.close();
})();
