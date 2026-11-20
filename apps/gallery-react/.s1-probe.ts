import { chromium } from '@playwright/test';
import { variantByKey, variantQuery } from './src/ios-screens/frames';
const [, , style = 'liquid', scheme = 'light'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
const v = variantByKey('phone')!;
const q = new URLSearchParams({ style, scheme, ...variantQuery(v), chrome: '0' });
await page.goto(`http://127.0.0.1:5325/screens/ios/notes-edit?${q}`);
const fl = page.frameLocator(`[data-gallery='ios-display'] iframe`);
await fl.locator(`[data-gallery='ios-screen-theme']`).waitFor();
const inner = page.frames().find((f) => f.url().includes('/screens/ios/notes-edit/screen'))!;
await inner.evaluate(() => {
  const t = document.querySelector("[data-gallery='notes-text'] p")!.firstChild!;
  const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, 10);
  getSelection()!.removeAllRanges(); getSelection()!.addRange(r);
  (document.querySelector("[data-gallery='notes-text']") as HTMLElement).focus();
});
await inner.locator("[data-gallery='notes-text']").press('Shift+F10');
await page.waitForTimeout(800);
console.log(await inner.evaluate(() => {
  const m = document.querySelector("[data-ds='selection-menu']") as HTMLElement;
  const cs = getComputedStyle(m);
  const layer = m.closest('[data-ds=theme]') as HTMLElement;
  return { bg: cs.backgroundColor, bf: cs.backdropFilter, sh: cs.boxShadow, glass: cs.getPropertyValue('--_ios-glass'), layer: layer?.outerHTML.slice(0, 300), opacity: cs.opacity, anim: cs.animationName };
}));
await browser.close();
