import { chromium, type Frame, type Page } from '@playwright/test';
import { variantByKey, variantQuery } from './src/ios-screens/frames';

const fn = `
(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { cx.clearRect(0,0,1,1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0,0,1,1); const d = cx.getImageData(0,0,1,1).data; return [d[0], d[1], d[2], d[3]/255]; };
  const over = (top, under) => { const a = top[3]; return [top[0]*a+under[0]*(1-a), top[1]*a+under[1]*(1-a), top[2]*a+under[2]*(1-a), 1]; };
  const lum = (c) => { const f = (v) => { v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
  const bgStack = (el, base) => { const list = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; if (b) list.push(rgba(b)); } let acc = base; for (const c of list.reverse()) acc = over(c, acc); return acc; };
  window.__contrast = { rgba, over, ratio, bgStack };
})();
`;

async function probe(frame: Frame | Page, kind: string) {
  await frame.evaluate(fn);
  return frame.evaluate((kind) => {
    const C = (window as any).__contrast;
    const out: Record<string, string> = {};
    if (kind === 'close') {
      document.querySelectorAll<HTMLElement>("[data-ds='close-button'][data-emphasis='solid']").forEach((b, i) => {
        if (i > 0) return;
        const disc = C.rgba(getComputedStyle(b).backgroundColor);
        const glyph = C.rgba(getComputedStyle(b).color);
        for (const [name, base] of [['over white', [255, 255, 255, 1]], ['over black', [0, 0, 0, 1]], ['over mid red', [200, 60, 60, 1]]] as const) {
          const d = C.over(disc, base);
          out[`glyph vs disc ${name}`] = C.ratio(C.over(glyph, d), d).toFixed(2);
        }
      });
    } else {
      const row = document.querySelector<HTMLElement>("[data-part='item'][data-tone='danger']");
      if (!row) return { missing: 'row' };
      const title = row.querySelector<HTMLElement>("[data-part='title']")!;
      const icon = row.querySelector<HTMLElement>("[data-part='start'] [data-ds='icon']");
      const bg = C.bgStack(row, [255, 255, 255, 1]);
      const fg = C.rgba(getComputedStyle(title).color);
      out['title vs row'] = C.ratio(C.over(fg, bg), bg).toFixed(2);
      if (icon) out['icon vs row'] = C.ratio(C.over(C.rgba(getComputedStyle(icon).color), bg), bg).toFixed(2);
      out.bg = bg.map((v: number) => Math.round(v)).join(',');
    }
    return out;
  }, kind);
}

const browser = await chromium.launch();
for (const style of ['liquid', 'neutral']) for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 }, reducedMotion: 'reduce' });
  // the raised close on the onboarding screen
  const v = variantByKey('phone')!;
  for (const [screen, kind] of [['onboarding', 'close'], ['fitness-plan', 'danger']] as const) {
    const q = new URLSearchParams({ style, scheme, ...variantQuery(v), chrome: '0' });
    await page.goto(`http://127.0.0.1:5325/screens/ios/${screen}?${q}`);
    await page.frameLocator(`[data-gallery='ios-display'] iframe`).locator(`[data-gallery='ios-screen-theme']`).waitFor();
    const inner = page.frames().find((f) => f.url().includes(`/screens/ios/${screen}/screen`))!;
    if (kind === 'danger') {
      await inner.locator("[data-ds='navbar'] [data-part='end'] [data-ds='icon-button']").first().click();
      await page.waitForTimeout(600);
    }
    console.log(style, scheme, screen, JSON.stringify(await probe(inner, kind)));
  }
  // web demo of List danger in the gallery (the platform web) and the close disc
  for (const [slug, kind] of [['close-button', 'close'], ['list', 'danger']] as const) {
    await page.goto(`http://127.0.0.1:5325/c/${slug}?style=${style}&scheme=${scheme}&platform=web`);
    await page.waitForTimeout(800);
    console.log(style, scheme, `web ${slug}`, JSON.stringify(await probe(page, kind)));
  }
  await page.close();
}
await browser.close();
