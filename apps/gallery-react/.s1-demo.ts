import { chromium } from '@playwright/test';
const [, , out, slug, caseId, platform = 'ios', stylesArg = 'liquid,neutral', schemesArg = 'light,dark', width = '480'] = process.argv;
const browser = await chromium.launch();
for (const style of stylesArg.split(',')) for (const scheme of schemesArg.split(',')) {
  const page = await browser.newPage({ viewport: { width: Number(width), height: 1400 }, reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:5325/c/${slug}?style=${style}&scheme=${scheme}&platform=${platform}`);
  const el = page.locator(`[data-demo-case='${caseId}']`);
  await el.waitFor({ timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const file = `${out}/${slug}-${caseId}-${platform}-${style}-${scheme}.png`;
  await el.screenshot({ path: file, animations: 'disabled' });
  console.log('saved', file);
  await page.close();
}
await browser.close();
