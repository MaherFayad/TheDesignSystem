import { chromium, devices } from 'playwright';
const b = await chromium.launch();
for (const d of ['iPhone SE', 'iPhone 15', 'Pixel 7', 'Galaxy S9+']) for (const q of ['', '?platform=web']) {
  const ctx = await b.newContext({ ...devices[d] });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4471/components/switch/' + q, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const w = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); };
    return { vw: innerWidth, sw: document.documentElement.scrollWidth, pl: document.documentElement.dataset.platform, menu: w('.menu-btn'), brand: w('.brand'), start: w('.topbar-start'), search: w('.search-btn'), tools: w('.tools'), style: w('#site-style-button'), scheme: w('#site-scheme-button'), plat: w('#site-platform-button'), lang: w('#site-lang-button'), pad: getComputedStyle(document.querySelector('.topbar')).paddingInlineStart, gap: getComputedStyle(document.querySelector('.topbar')).columnGap, tgap: getComputedStyle(document.querySelector('.tools')).columnGap };
  });
  console.log(d, q, JSON.stringify(r));
  await ctx.close();
}
await b.close();
