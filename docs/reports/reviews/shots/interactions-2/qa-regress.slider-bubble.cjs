// ds-qa regression reviewer, order 1.22. The Slider value bubble while a
// thumb is held, in Arabic RTL and in an Arabic case on the LTR page: the
// visible order of the bubble's columns against the thumb's aria-valuetext.
const { chromium } = require('@playwright/test');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  for (const [slug, dir] of [['slider', 'rtl'], ['range-slider', 'rtl'], ['slider', 'ltr']]) {
    const p = await b.newPage({ viewport: { width: 1024, height: 900 }, deviceScaleFactor: 2 });
    await p.goto(`http://127.0.0.1:5190/c/${slug}?style=neutral&scheme=light&chrome=0${dir === 'rtl' ? '&dir=rtl&lang=ar' : ''}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1000);
    const thumbs = p.locator('[data-part="thumb"]:not([data-disabled])');
    const n = Math.min(await thumbs.count(), 12);
    for (let i = 0; i < n; i++) {
      const t = thumbs.nth(i);
      await t.scrollIntoViewIfNeeded();
      const box = await t.boundingBox();
      if (!box) continue;
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await p.mouse.down();
      await p.waitForTimeout(700);
      const r = await t.evaluate((th) => {
        const root = th.closest('[data-ds]');
        const host = [...root.querySelectorAll('[data-digit]')].map((c) => c.parentElement).find((h) => h && getComputedStyle(h).opacity !== '0' && h.getBoundingClientRect().width > 0 && h.closest('[data-part]') && th.contains(h) || (h && h.closest('[data-part="bubble"], [data-part="value-bubble"]')));
        if (!host) return null;
        const cols = [...host.children].filter((c) => c.hasAttribute('data-digit') && !c.hasAttribute('data-digit-out'));
        const vis = [...cols].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map((c) => c.textContent).join('');
        const bub = host.closest('[data-part]');
        bub.setAttribute('data-qa-bubble', '1');
        return { valuetext: th.getAttribute('aria-valuetext') || th.getAttribute('aria-valuenow'), src: cols.map((c) => c.textContent).join(''), visibleLeftToRight: vis, part: bub.getAttribute('data-part'), opacity: getComputedStyle(bub).opacity, lang: th.closest('[lang]')?.getAttribute('lang') };
      });
      if (r) {
        console.log(slug, dir, i, JSON.stringify(r));
        if (i < 3 || /[؀-ۿ]/.test(r.src)) await p.locator('[data-qa-bubble="1"]').first().screenshot({ path: path.join(__dirname, `recheck.slider-bubble.${slug}.${dir}.${i}.png`) }).catch(() => {});
        await p.evaluate(() => document.querySelectorAll('[data-qa-bubble]').forEach((e) => e.removeAttribute('data-qa-bubble')));
      }
      await p.mouse.up();
    }
    await p.close();
  }
  await b.close();
})();
