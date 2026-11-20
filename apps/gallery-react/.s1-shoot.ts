// Scratch capture for order S1 (deleted after use).
import { chromium, type Frame } from '@playwright/test';
import { variantByKey, variantQuery } from './src/ios-screens/frames';

const [, , outDir, screen, action, stylesArg = 'liquid,neutral', schemesArg = 'light,dark', langsArg = 'en'] = process.argv;
const base = 'http://127.0.0.1:5325';

async function run(inner: Frame, act: string) {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  if (act === 'book') {
    await inner.locator("[data-gallery='booking-footer'] [data-ds='button']").first().click();
    await sleep(300);
    await inner.locator("[data-ds='alert-dialog'] [data-part='action'] [data-ds='button'], [data-ds='alert-dialog'] [data-part='action']").first().click();
    await sleep(700);
  } else if (act === 'routine') {
    await inner.locator("[data-ds='navbar'] [data-part='end'] [data-ds='icon-button']").first().click();
    await sleep(600);
  } else if (act === 'routine-act') {
    await inner.locator("[data-ds='navbar'] [data-part='end'] [data-ds='icon-button']").first().click();
    await sleep(600);
    await inner.locator("[data-ds='sheet'] [data-part='item'] [role='button']").first().click();
    await sleep(900);
  } else if (act === 'more') {
    await inner.locator("[data-ds='navbar'] [data-part='end'] [data-ds='icon-button']").nth(1).click();
    await sleep(600);
  } else if (act === 'select') {
    await inner.evaluate(() => {
      const p = document.querySelector("[data-gallery='notes-text'] p");
      const t = p?.firstChild;
      if (!t) return;
      const r = document.createRange();
      r.setStart(t, 0);
      r.setEnd(t, Math.min(18, t.textContent?.length ?? 0));
      const s = getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
      (document.querySelector("[data-gallery='notes-text']") as HTMLElement).focus();
    });
    await inner.locator("[data-gallery='notes-text']").press('Shift+F10');
    await sleep(600);
  }
}

const browser = await chromium.launch();
const v = variantByKey('phone')!;
for (const lang of langsArg.split(',')) {
  for (const style of stylesArg.split(',')) {
    for (const scheme of schemesArg.split(',')) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 1200 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const q = new URLSearchParams({ style, scheme, ...variantQuery(v), chrome: '0' });
      if (lang === 'ar') {
        q.set('lang', 'ar');
        q.set('dir', 'rtl');
      }
      await page.goto(`${base}/screens/ios/${screen}?${q.toString()}`);
      const display = page.locator(`[data-gallery='ios-display'][data-variant='${v.key}']`);
      await display.waitFor();
      const fl = page.frameLocator(`[data-gallery='ios-display'][data-variant='${v.key}'] iframe`);
      await fl.locator(`[data-gallery='ios-screen-theme'][data-ios-screen='${screen}']`).waitFor({ timeout: 30_000 });
      const inner = page.frames().find((f) => f.url().includes(`/screens/ios/${screen}/screen`))!;
      await inner.evaluate(() => document.fonts.ready);
      if (action && action !== 'none') await run(inner, action);
      await page.waitForTimeout(300);
      const file = `${outDir}/${screen}-${action}-${style}-${scheme}${lang === 'ar' ? '-ar' : ''}.png`;
      await display.screenshot({ path: file, animations: 'disabled' });
      console.log('saved', file);
      await context.close();
    }
  }
}
await browser.close();
