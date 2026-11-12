// Smoke check for the React gallery: the axes in the URL reach the Theme
// element, the page background follows style and scheme, case= and chrome=0
// work, the shell selects update the URL, and the fonts load.
//
// Run from the repo root: node apps/gallery-react/smoke.mjs
// It uses a dev server on GALLERY_URL (default http://localhost:5173) and
// starts one when nothing answers there. Headless Chromium from
// @playwright/test. Screenshots go to docs/reports/shots/wave-0/gallery/.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '../../docs/reports/shots/wave-0/gallery');
const base = process.env.GALLERY_URL ?? 'http://localhost:5173';

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
  server = spawn('npx', ['vite', '--port', '5173', '--strictPort'], { cwd: here, stdio: 'ignore' });
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

// The index and the kitchen sink render.
await page.goto(`${base}/`);
check('the index lists the demos', (await page.locator('[data-gallery="index"] a[href^="/c/"]').count()) > 0);
await page.goto(`${base}/all`);
await page.waitForSelector('[data-gallery="sink-item"] [data-demo-case]');
check('/all renders every demo', (await page.locator('[data-gallery="sink-item"]').count()) > 0);

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
