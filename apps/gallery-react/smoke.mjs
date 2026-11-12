// Smoke check for the React gallery: the axes in the URL reach the Theme
// element, the page background follows style and scheme, case= and chrome=0
// work, the shell selects update the URL, and the fonts load.
//
// Run from the repo root: node apps/gallery-react/smoke.mjs
// It uses a dev server on GALLERY_URL (default http://localhost:<PORT>, PORT
// default 5173) and starts one on PORT when nothing answers there. Headless Chromium from
// @playwright/test. Screenshots go to docs/reports/shots/wave-0/gallery/.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '../../docs/reports/shots/wave-0/gallery');
const port = process.env.PORT ?? '5173';
const base = process.env.GALLERY_URL ?? `http://localhost:${port}`;

async function up() {
  try {
    const res = await fetch(base);
    return res.ok;
  } catch {
    return false;
  }
}

let server;
if (!(await up())) {
  console.log(`starting vite in ${here}`);
  server = spawn('npx', ['vite', '--port', port, '--strictPort'], { cwd: here, stdio: 'ignore', env: { ...process.env, PORT: port } });
  for (let i = 0; i < 60 && !(await up()); i++) await new Promise((r) => setTimeout(r, 500));
  if (!(await up())) throw new Error(`no dev server at ${base}`);
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

async function open(query) {
  await page.goto(`${base}/c/icon${query}`);
  await page.waitForSelector('#gallery-root [data-demo-case]');
  await page.evaluate(() => document.fonts.ready);
}

async function themeOf() {
  return page.evaluate(() => {
    const el = document.querySelector('#gallery-root');
    const html = document.documentElement;
    const read = (n) => ({
      ds: n.getAttribute('data-ds'),
      style: n.getAttribute('data-style'),
      scheme: n.getAttribute('data-scheme'),
      density: n.getAttribute('data-density'),
      contrast: n.getAttribute('data-contrast'),
      platform: n.getAttribute('data-platform'),
      glass: n.getAttribute('data-glass'),
      dir: n.getAttribute('dir'),
      lang: n.getAttribute('lang'),
    });
    return {
      root: read(el),
      html: read(html),
      bg: getComputedStyle(el).backgroundColor,
      htmlBg: getComputedStyle(html).backgroundColor,
      font: getComputedStyle(el).fontFamily,
    };
  });
}

const combos = [
  {
    query: '',
    want: { style: 'studio', scheme: 'dark', density: 'default', contrast: 'default', platform: 'web', glass: 'regular', dir: 'ltr', lang: 'en' },
  },
  {
    query: '?style=studio&scheme=light',
    want: { style: 'studio', scheme: 'light', density: 'default', dir: 'ltr', lang: 'en' },
  },
  {
    query: '?style=desk&scheme=dark&density=comfortable&platform=android',
    want: { style: 'desk', scheme: 'dark', density: 'comfortable', platform: 'android', dir: 'ltr' },
  },
  {
    query: '?style=desk&scheme=light&density=compact&platform=ios&contrast=more&glass=tinted&lang=ar',
    want: { style: 'desk', scheme: 'light', density: 'compact', platform: 'ios', contrast: 'more', glass: 'tinted', dir: 'rtl', lang: 'ar' },
  },
  {
    query: '?style=studio&dir=rtl',
    want: { style: 'studio', dir: 'rtl', lang: 'en' },
  },
];

const bg = {};
for (const { query, want } of combos) {
  await open(query);
  const t = await themeOf();
  const wrong = Object.entries(want).filter(([k, v]) => t.root[k] !== v || t.html[k] !== v);
  check(`attributes for /c/icon${query}`, t.root.ds === 'theme' && wrong.length === 0, wrong.map(([k, v]) => `${k}: ${t.root[k]} on the theme, ${t.html[k]} on html, want ${v}`).join('; '));
  check(`html paints the theme background for /c/icon${query}`, t.htmlBg === t.bg, `${t.htmlBg} vs ${t.bg}`);
  bg[`${want.style}.${want.scheme}`] = t.bg;
}

check('dark and light differ in studio', bg['studio.dark'] !== bg['studio.light'], `${bg['studio.dark']} vs ${bg['studio.light']}`);
check('dark and light differ in desk', bg['desk.dark'] !== bg['desk.light'], `${bg['desk.dark']} vs ${bg['desk.light']}`);
// Both dark bodies are black in the source, so styles are compared in light.
check('studio and desk differ in light', bg['studio.light'] !== bg['desk.light'], `${bg['studio.light']} vs ${bg['desk.light']}`);

// case= shows one case.
await open('?case=variants');
const visible = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[data-demo-case]')).map((s) => [s.getAttribute('data-demo-case'), getComputedStyle(s).display !== 'none']),
);
check('case=variants shows only that case', visible.every(([id, shown]) => shown === (id === 'variants')) && visible.length > 1, JSON.stringify(visible));

// chrome=0 hides the shell.
await open('?chrome=0');
check('chrome=0 hides the shell', (await page.locator('[data-gallery="shell"]').count()) === 0);
await open('');
check('the shell shows by default', (await page.locator('[data-gallery="shell"]').count()) === 1);

// A select in the shell updates the URL and the theme.
await page.locator('[data-gallery="axis"]', { hasText: 'Scheme' }).locator('select').selectOption('light');
await page.waitForFunction(() => document.querySelector('#gallery-root')?.getAttribute('data-scheme') === 'light');
check('the scheme select writes the URL', new URL(page.url()).searchParams.get('scheme') === 'light', page.url());

// Fonts: the faces each style asks for load.
await open('?style=studio');
const studioFonts = await page.evaluate(async () => [
  (await document.fonts.load('16px "Inter Variable"', 'Abc')).length,
  (await document.fonts.load('16px "IBM Plex Sans Arabic"', 'عربي')).length,
]);
check('studio loads Inter Variable and IBM Plex Sans Arabic', studioFonts.every((n) => n > 0), JSON.stringify(studioFonts));
await open('?style=desk');
const deskFonts = await page.evaluate(async () => (await document.fonts.load('16px "Instrument Sans"', 'Abc')).length);
check('desk loads Instrument Sans', deskFonts > 0, String(deskFonts));

// One h1 per page, with chrome=0 too.
await open('?chrome=0');
check('/c/icon has one h1 with chrome=0', (await page.locator('h1').count()) === 1);

// A malformed path and an unknown style.
// The dev server answers a malformed URL with 404 itself, so the app is moved there in place.
await open('');
await page.evaluate(() => {
  window.history.pushState(null, '', '/c/%E0%A4%A');
  window.dispatchEvent(new Event('gallery:navigate'));
});
await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'No demo at this address').catch(() => {});
check('a malformed path shows the not found page', (await page.locator('h1').textContent()) === 'No demo at this address');
await open('?style=nope');
check('an unknown style falls back with a note', (await themeOf()).root.style === 'studio' && (await page.locator('[data-gallery="note"]').count()) === 1);

// Arabic type: body keeps its size, small text moves up, a lang="en" island gets the Latin type back.
await open('?style=desk&lang=ar&chrome=0');
const type = await page.evaluate(() => {
  const stage = document.querySelector('[data-gallery="stage"]');
  const probe = document.createElement('p');
  probe.textContent = 'نص';
  const small = document.createElement('p');
  small.style.fontSize = 'var(--ds-font-size-s)';
  const island = document.createElement('span');
  island.lang = 'en';
  island.textContent = 'Save changes';
  stage.append(probe, small, island);
  const cs = (el) => getComputedStyle(el);
  const root = document.querySelector('#gallery-root');
  const m = cs(root).getPropertyValue('--ds-font-size-m');
  const out = {
    rootSize: cs(root).fontSize,
    pSize: cs(probe).fontSize,
    smallSize: cs(small).fontSize,
    pFont: cs(probe).fontFamily,
    pLeading: cs(probe).lineHeight,
    islandFont: cs(island).fontFamily,
    islandLeading: cs(island).lineHeight,
    m,
  };
  probe.remove();
  small.remove();
  island.remove();
  return out;
});
await open('?style=desk&lang=en&chrome=0');
const enSize = await page.evaluate(() => getComputedStyle(document.querySelector('#gallery-root')).fontSize);
check('Arabic body text keeps the English size', type.rootSize === enSize && type.pSize === enSize, `${type.rootSize}, ${type.pSize} vs ${enSize}`);
check('Arabic small text is one step up (s reads m)', type.smallSize === type.pSize, `${type.smallSize} vs ${type.pSize}`);
check('Arabic text uses IBM Plex Sans Arabic', type.pFont.startsWith('"IBM Plex Sans Arabic"'), type.pFont);
check('a lang="en" island inside Arabic gets the Latin font and leading', type.islandFont.startsWith('"Instrument Sans"') && type.islandLeading !== type.pLeading, `${type.islandFont}; ${type.islandLeading} vs ${type.pLeading}`);

// The theme is stamped on <html> too: the root font size stays the browser
// default, so rem is 16px, and the system size starts at <body>.
async function rootType() {
  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const probe = document.createElement('span');
    probe.style.fontSize = 'var(--ds-font-size-m)';
    body.append(probe);
    const m = getComputedStyle(probe).fontSize;
    probe.remove();
    const cs = getComputedStyle(body);
    return {
      themed: html.getAttribute('data-ds'),
      html: getComputedStyle(html).fontSize,
      body: cs.fontSize,
      m,
      bodyFont: cs.fontFamily,
      bodyLeading: Number.parseFloat(cs.lineHeight) / Number.parseFloat(cs.fontSize),
      bodyS: cs.getPropertyValue('--ds-font-size-s').trim(),
      bodyM: cs.getPropertyValue('--ds-font-size-m').trim(),
      arabicLeading: Number.parseFloat(cs.getPropertyValue('--ds-font-leading-arabic-normal')),
    };
  });
}
for (const style of ['studio', 'desk']) {
  await open(`?style=${style}&chrome=0`);
  const en = await rootType();
  check(`${style}: html is themed and keeps a 16px root font size`, en.themed === 'theme' && en.html === '16px', en.html);
  check(`${style}: body text is font.size.m`, en.body === en.m, `${en.body} vs ${en.m}`);
  await open(`?style=${style}&lang=ar&chrome=0`);
  const ar = await rootType();
  check(`${style} Arabic: html keeps 16px and body stays at font.size.m`, ar.html === '16px' && ar.body === ar.m, `${ar.html}, ${ar.body} vs ${ar.m}`);
  check(`${style} Arabic: body uses IBM Plex Sans Arabic with the Arabic leading`, ar.bodyFont.startsWith('"IBM Plex Sans Arabic"') && Math.abs(ar.bodyLeading - ar.arabicLeading) < 0.01, `${ar.bodyFont}; ${ar.bodyLeading.toFixed(3)} vs ${ar.arabicLeading}`);
  check(`${style} Arabic: s moves one step up from body down`, ar.bodyS !== '' && ar.bodyS === ar.bodyM, `${ar.bodyS} vs ${ar.bodyM}`);
}

// The index and the kitchen sink render.
await page.goto(`${base}/`);
check('the index lists the demos', (await page.locator('[data-gallery="index"] a[href^="/c/"]').count()) > 0);
check('the index has one h1', (await page.locator('h1').count()) === 1);
await page.goto(`${base}/all`);
await page.waitForSelector('[data-gallery="sink-item"] [data-demo-case]');
check('/all renders every demo', (await page.locator('[data-gallery="sink-item"]').count()) > 0);
check('/all has one h1', (await page.locator('h1').count()) === 1);

// Screenshots.
mkdirSync(shots, { recursive: true });
for (const [name, query] of [
  ['icon-studio-dark', '?style=studio&scheme=dark'],
  ['icon-studio-light', '?style=studio&scheme=light'],
  ['icon-desk-dark', '?style=desk&scheme=dark'],
  ['icon-desk-light-rtl-ar', '?style=desk&scheme=light&lang=ar'],
]) {
  await open(query);
  await page.screenshot({ path: join(shots, `${name}.png`) });
}

check('no page errors', errors.length === 0, errors.join('; '));

await browser.close();
server?.kill();

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} checks pass`);
process.exit(failed === 0 ? 0 : 1);
