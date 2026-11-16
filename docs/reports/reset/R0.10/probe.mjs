// R0.10 evidence: device descriptors against the React gallery.
// Usage: node probe.mjs <baseUrl> <outDir>
import { chromium, devices } from '/home/user/TheDesignSystem/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const [base, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const strip = ({ defaultBrowserType: _d, ...rest }) => rest;
const macSafariUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';
const profiles = [
  { id: 'iphone-15', label: 'iPhone 15 (Playwright descriptor)', options: strip(devices['iPhone 15']), expect: 'ios' },
  { id: 'iphone-se', label: 'iPhone SE (Playwright descriptor)', options: strip(devices['iPhone SE']), expect: 'ios' },
  { id: 'pixel-7', label: 'Pixel 7 (Playwright descriptor)', options: strip(devices['Pixel 7']), expect: 'android' },
  { id: 'galaxy-s9', label: 'Galaxy S9+ (Playwright descriptor)', options: strip(devices['Galaxy S9+']), expect: 'android' },
  { id: 'ipad-pro-11', label: 'iPad Pro 11 (Playwright descriptor)', options: strip(devices['iPad Pro 11']), expect: 'ios' },
  {
    id: 'ipad-desktop-mode',
    label: 'iPad in desktop mode as iPadOS Safari reports it (Mac agent, maxTouchPoints 5, no client hints)',
    options: { userAgent: macSafariUA, viewport: { width: 1024, height: 1366 }, isMobile: false, hasTouch: true, deviceScaleFactor: 2 },
    init: () => {
      Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 });
      Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined });
    },
    expect: 'ios',
  },
  {
    id: 'ipad-desktop-raw-chromium',
    label: 'Mac Safari agent with touch in raw Chromium emulation (maxTouchPoints 1, hints macOS): not a real device',
    options: { userAgent: macSafariUA, viewport: { width: 1024, height: 1366 }, isMobile: false, hasTouch: true, deviceScaleFactor: 2 },
    expect: 'web',
  },
  { id: 'desktop-chrome', label: 'Desktop Chrome (Playwright descriptor)', options: strip(devices['Desktop Chrome']), expect: 'web' },
  { id: 'desktop-safari-agent', label: 'Desktop Safari agent, no touch', options: strip(devices['Desktop Safari']), expect: 'web' },
  { id: 'default-chromium', label: 'Default headless Chromium context (as the existing tests run)', options: {}, expect: 'web' },
];

async function read(page) {
  await page.waitForSelector('#gallery-root [data-ds="switch"]');
  return page.evaluate(() => ({
    root: document.getElementById('gallery-root')?.getAttribute('data-platform'),
    html: document.documentElement.getAttribute('data-platform'),
    bar: document.querySelector('[data-gallery="platform-detected"]')?.textContent,
    source: document.querySelector('[data-gallery="platform-detected"]')?.getAttribute('data-source'),
    select: document.querySelector('[data-gallery="axis"] select[value], form[data-gallery="axes"] label:nth-of-type(4) select')?.value,
    stored: (() => { try { return localStorage.getItem('ds-platform'); } catch { return 'throws'; } })(),
    ua: navigator.userAgent,
    hints: navigator.userAgentData ? navigator.userAgentData.platform : null,
    touch: navigator.maxTouchPoints,
  }));
}

const results = [];
const browser = await chromium.launch();
for (const p of profiles) {
  const context = await browser.newContext(p.options);
  if (p.init) await context.addInitScript(p.init);
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  const row = { id: p.id, label: p.label, expect: p.expect, cases: {} };
  const go = async (q) => { await page.goto(`${base}/c/switch${q}`); return read(page); };

  row.cases.none = await go('');
  row.cases.web = await go('?platform=web');
  row.cases.macos = await go('?platform=macos');
  row.cases.android = await go('?platform=android');
  row.cases.ios = await go('?platform=ios');
  row.cases.unknown = await go('?platform=windows');
  row.cases.autoKey = await go('?platform=auto');
  // Step 3: a choice made in the switcher is stored and survives a load with no query.
  await go('');
  const select = page.locator('form[data-gallery="axes"] label', { hasText: 'Platform' }).locator('select');
  await select.selectOption('android');
  row.cases.switchedAndroid = await read(page);
  row.cases.storedNoQuery = await go('');
  row.cases.urlBeatsStored = await go('?platform=web');
  await go('');
  await page.locator('form[data-gallery="axes"] label', { hasText: 'Platform' }).locator('select').selectOption('');
  row.cases.switchedAuto = await read(page);
  row.cases.afterAutoNoQuery = await go('');
  row.cases.options = await page.locator('form[data-gallery="axes"] label', { hasText: 'Platform' }).locator('option').allTextContents();
  row.problems = problems;
  results.push(row);
  await context.close();
}

// Recording of the iPhone frame: the switch thumb travel on ios.
const rec = await browser.newContext({ ...strip(devices['iPhone 15']), recordVideo: { dir: out, size: { width: 393, height: 659 } } });
const rp = await rec.newPage();
await rp.goto(`${base}/c/switch?style=liquid&scheme=light&chrome=0`);
await rp.waitForSelector('[data-ds="switch"]');
const control = rp.locator('[data-ds="switch"] [data-part="control"]').first();
await control.scrollIntoViewIfNeeded();
const thumbX = () => rp.locator('[data-ds="switch"] [data-part="thumb"]').first().evaluate((el) => el.getBoundingClientRect().x);
const trackW = () => rp.locator('[data-ds="switch"] [data-part="track"]').first().evaluate((el) => el.getBoundingClientRect().width);
const stamped = await rp.evaluate(() => document.getElementById('gallery-root')?.getAttribute('data-platform'));
const state0 = await control.getAttribute('data-state');
await rp.waitForTimeout(600);
const x0 = await thumbX();
await control.tap();
await rp.waitForTimeout(900);
const x1 = await thumbX();
const state1 = await control.getAttribute('data-state');
await control.tap();
await rp.waitForTimeout(900);
const x2 = await thumbX();
await rp.screenshot({ path: join(out, 'iphone-switch.png') });
const tw = await trackW();
const video = rp.video();
await rec.close();
const vpath = await video.path();
renameSync(vpath, join(out, 'iphone-switch-travel.webm'));
const travel = { stamped, firstState: state0, afterTap: state1, thumbX: [x0, x1, x2], travelPx: Math.abs(x1 - x0), backPx: Math.abs(x2 - x1), trackWidth: tw };

// Same switch in desktop Chromium for contrast.
const dctx = await browser.newContext();
const dp = await dctx.newPage();
await dp.goto(`${base}/c/switch?style=liquid&scheme=light&chrome=0`);
await dp.waitForSelector('[data-ds="switch"]');
const dc = dp.locator('[data-ds="switch"] [data-part="control"]').first();
await dp.waitForTimeout(600);
const d0 = await dp.locator('[data-ds="switch"] [data-part="thumb"]').first().evaluate((el) => el.getBoundingClientRect().x);
await dc.click();
await dp.waitForTimeout(900);
const d1 = await dp.locator('[data-ds="switch"] [data-part="thumb"]').first().evaluate((el) => el.getBoundingClientRect().x);
const desktopTravel = { stamped: await dp.evaluate(() => document.getElementById('gallery-root')?.getAttribute('data-platform')), travelPx: Math.abs(d1 - d0) };
await dctx.close();
await browser.close();

writeFileSync(join(out, 'devices.json'), JSON.stringify({ base, results, travel, desktopTravel }, null, 2));
let fail = 0;
for (const r of results) {
  const c = r.cases;
  const checks = {
    none: c.none.root === r.expect && c.none.html === r.expect,
    web: c.web.root === 'web',
    macos: c.macos.root === 'macos',
    android: c.android.root === 'android',
    ios: c.ios.root === 'ios',
    unknown: c.unknown.root === r.expect,
    autoKey: c.autoKey.root === r.expect,
    switched: c.switchedAndroid.root === 'android' && c.switchedAndroid.stored === 'android',
    stored: c.storedNoQuery.root === 'android' && c.storedNoQuery.source === 'stored',
    urlBeatsStored: c.urlBeatsStored.root === 'web',
    auto: c.switchedAuto.stored === null && c.afterAutoNoQuery.root === r.expect,
    clean: r.problems.length === 0,
  };
  const bad = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  if (bad.length) fail++;
  console.log(`${r.id.padEnd(22)} expect ${r.expect.padEnd(8)} none=${c.none.root} bar="${c.none.bar}" hints=${c.none.hints} touch=${c.none.touch} ${bad.length ? 'FAIL ' + bad.join(',') : 'pass'}`);
  if (r.problems.length) console.log('  problems:', r.problems.slice(0, 5));
}
console.log('travel', JSON.stringify(travel), 'desktop', JSON.stringify(desktopTravel));
process.exit(fail ? 1 : 0);
