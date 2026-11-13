// Shots of the components the styles lane changed in order 1.29, in the four
// styles, light and dark, cropped to the control. Writes PNGs to shots/.
//   node docs/reports/fixes/interactions-3/styles-platforms.shots.cjs [base] [only]
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:5187';
const ONLY = process.argv[3] || '';
const OUT = path.join(__dirname, 'shots');
const STYLES = ['studio', 'desk', 'neutral', 'liquid'];
const SCHEMES = ['light', 'dark'];

const shots = [
  { id: 'alert-dialog', url: '/c/alert-dialog?case=variants', click: "[data-demo-case='variants'] [data-ds='button']", target: "[data-ds='alert-dialog'] [data-part='panel']" },
  { id: 'sheet', url: '/c/sheet?case=variants', click: "[data-demo-case='variants'] [data-ds='button']", target: "[data-ds='sheet'] [data-part='panel']" },
  { id: 'popover', url: '/c/popover?case=variants', click: "[data-demo-case='variants'] [data-ds='button']", target: "[data-ds='popover']" },
  { id: 'toast-expand', url: '/interactions?focus=toast-expand', click: '[data-interaction-trigger]', hover: "[data-ds='toaster'] > [data-ds='toast']", target: "[data-ds='toaster']" },
  { id: 'switch', url: '/interactions?focus=switch-stretch', target: "[data-ds='switch']", dsf: 2 },
  { id: 'radio-group', url: '/c/radio-group', target: "[data-ds='radio-group']", dsf: 2 },
  { id: 'field-label-focus', url: '/interactions?focus=field-label-focus', click: "[data-ds='field']:not([data-floating]) input", target: "[data-ds='field']", dsf: 2 },
];

(async () => {
  const browser = await chromium.launch();
  for (const s of shots) {
    if (ONLY && !ONLY.split(',').includes(s.id)) continue;
    for (const style of STYLES)
      for (const scheme of SCHEMES) {
        const page = await browser.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: s.dsf || 1 });
        const sep = s.url.includes('?') ? '&' : '?';
        await page.goto(`${BASE}${s.url}${sep}style=${style}&scheme=${scheme}&chrome=0`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        if (s.click) await page.locator(s.click).first().click();
        if (s.hover) {
          await page.waitForTimeout(700);
          await page.locator(s.hover).last().hover();
        }
        await page.waitForTimeout(1000);
        const box = await page.locator(s.target).first().boundingBox();
        if (box) {
          const pad = 8;
          await page.screenshot({
            path: path.join(OUT, `${s.id}.${style}.${scheme}.png`),
            clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 },
          });
        } else console.log('missing', s.id, style, scheme);
        await page.close();
      }
    console.log('done', s.id);
  }
  await browser.close();
})();
