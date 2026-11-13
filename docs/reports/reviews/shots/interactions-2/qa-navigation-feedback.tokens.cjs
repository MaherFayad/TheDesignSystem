// Under prefers-reduced-motion: which motion tokens are still above 0 on a style root (token build specificity).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const out = {};
  for (const style of ['studio', 'desk', 'neutral']) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:5190/interactions?focus=tab-bar-pop&style=${style}&scheme=${scheme}&chrome=0`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    out[`${style}.${scheme}`] = await p.evaluate(() => {
      const el = document.querySelector('[data-interaction-stage]');
      const cs = getComputedStyle(el);
      const names = ['delay-stagger', 'duration-celebrate', 'duration-morph', 'duration-spring-bouncy', 'duration-spring-snappy', 'duration-spring-soft', 'duration-base', 'duration-medium', 'duration-pulse', 'duration-slow'];
      const root = document.querySelector('[data-style]');
      return { styleRoot: root && root.tagName + ' ' + root.getAttribute('data-style') + ' ' + root.getAttribute('data-scheme'), matchesMedia: matchMedia('(prefers-reduced-motion: reduce)').matches, values: Object.fromEntries(names.map((n) => [n, cs.getPropertyValue('--ds-' + n).trim()])) };
    });
    await ctx.close();
  }
  require('fs').writeFileSync(__dirname + '/qa-navigation-feedback.tokens-reduced.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out));
  await b.close();
})();
