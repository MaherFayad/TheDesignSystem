// TableOfContents: does the bar's CSS transition start when the WAAPI stretch plays, and without it?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 960, height: 720 } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:5190/interactions?focus=toc-travel&style=neutral&scheme=light&chrome=0', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const r = {};
  r.manual = await p.evaluate(async () => {
    const el = document.querySelector("[data-ds='table-of-contents'] > [data-part='indicator']");
    const before = el.style.getPropertyValue('--_toc-indicator-offset');
    el.style.setProperty('--_toc-indicator-offset', '20px');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const a = el.getAnimations().map((x) => x.constructor.name + ' ' + (x.transitionProperty || x.id) + ' ' + x.effect.getComputedTiming().duration);
    el.style.setProperty('--_toc-indicator-offset', before);
    return { transitionValue: getComputedStyle(el).transition, anims: a };
  });
  await p.waitForTimeout(500);
  r.click = await p.evaluate(async () => {
    const el = document.querySelector("[data-ds='table-of-contents'] > [data-part='indicator']");
    document.querySelector('[data-interaction-trigger]').click();
    const seen = new Set();
    for (let i = 0; i < 20; i++) { await new Promise((r) => requestAnimationFrame(r)); el.getAnimations().forEach((x) => seen.add(x.constructor.name + ' ' + (x.transitionProperty || x.id) + ' ' + x.effect.getComputedTiming().duration + ' composite ' + x.effect.composite)); }
    return [...seen];
  });
  console.log(JSON.stringify(r, null, 1));
  require('fs').writeFileSync(__dirname + '/toc-travel.transition-check.json', JSON.stringify(r, null, 1));
  await b.close();
})();
