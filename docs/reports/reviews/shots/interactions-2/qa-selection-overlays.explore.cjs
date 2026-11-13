// Exploration: dumps the stage DOM of each id (Neutral light, LTR), to pick selectors.
const { chromium } = require('playwright');
const ids = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await ctx.newPage();
  for (const id of ids) {
    await page.goto(`http://127.0.0.1:5190/interactions?focus=${id}&style=neutral&scheme=light&chrome=0`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-interaction-stage]');
    const html = await page.evaluate(() => {
      const s = document.querySelector('[data-interaction-stage]');
      return s.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').replace(/ style="[^"]*"/g, '').replace(/ class="[^"]*"/g, '');
    });
    console.log('=====', id, '\n', html.slice(0, 3000));
  }
  await browser.close();
})();
