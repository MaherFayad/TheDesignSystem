// Pagination rapid check: two Play presses 30ms apart, then what each page slot draws.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const out = {};
  for (const style of ['neutral', 'desk', 'studio']) {
    const ctx = await b.newContext({ viewport: { width: 960, height: 720 } });
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:5190/interactions?focus=pagination-roll&style=${style}&scheme=light&chrome=0`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const read = () => p.evaluate(() => [...document.querySelectorAll("[data-ds='pagination']")].map((nav) => [...nav.querySelectorAll('[data-part=page]')].map((b) => b.getAttribute('aria-label').replace('Page ', '') + '=' + b.querySelector('[data-part=label]').textContent.replace(/\s/g, '') + (b.querySelector('[data-part=label]').children.length > 1 ? '(' + b.querySelector('[data-part=label]').children.length + ' hosts)' : '')).join(' ')));
    const r = { start: await read() };
    // single press
    await p.click('[data-interaction-trigger]'); await p.waitForTimeout(1500); r.single = await read();
    await p.evaluate(() => { const el = document.querySelector('[data-interaction-trigger]'); el.click(); setTimeout(() => el.click(), 30); });
    await p.waitForTimeout(2000); r.rapid = await read();
    await p.screenshot({ path: `pagination-roll.${style}.rapid-leftover.png`, clip: await p.evaluate(() => { const r = document.querySelector('[data-interaction-stage]').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) });
    await p.click("[data-ds='pagination'] >> nth=1 >> [aria-label='Page 1']"); await p.waitForTimeout(1500); r.afterGoFirst = await read();
    out[style] = r;
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  require('fs').writeFileSync(__dirname + '/pagination-roll.rapid-leftover.json', JSON.stringify(out, null, 1));
  await b.close();
})();
