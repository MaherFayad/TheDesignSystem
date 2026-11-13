// Proof for order 1.30: the open menus, keys, persistence and preview URLs.
// Needs the site served: npm run serve:site -w @the-system/docs. Run from the repo root:
// node apps/docs/scripts/proof/behavior.mjs
import { chromium } from 'playwright';
const ok = (c, m) => { console.log((c ? 'pass ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.goto('http://localhost:4400/components/button/');
  ok(await p.getAttribute('html', 'data-style') === 'neutral', 'starts neutral');
  ok(await p.getAttribute('html', 'data-scheme') === 'light', 'follows system light');
  // keyboard: focus style button, ArrowDown opens on checked item
  await p.focus('#site-style-button');
  await p.keyboard.press('ArrowDown');
  ok(await p.getAttribute('#site-style-button', 'aria-expanded') === 'true', 'ArrowDown opens');
  ok(await p.evaluate(() => document.activeElement.dataset.value) === 'neutral', 'focus on checked item');
  await p.keyboard.press('End');
  ok(await p.evaluate(() => document.activeElement.dataset.value) === 'studio', 'End');
  await p.keyboard.press('Home');
  ok(await p.evaluate(() => document.activeElement.dataset.value) === 'neutral', 'Home');
  await p.keyboard.press('d');
  ok(await p.evaluate(() => document.activeElement.dataset.value) === 'desk', 'type ahead d');
  await p.keyboard.press('Escape');
  ok(await p.evaluate(() => document.activeElement.id) === 'site-style-button', 'Escape returns focus');
  ok(await p.getAttribute('#site-style-menu', 'hidden') !== null, 'Escape closes');
  await p.keyboard.press('Enter');
  await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter');
  ok(await p.getAttribute('html', 'data-style') === 'desk', 'Enter picks desk');
  ok(await p.evaluate(() => document.activeElement.id) === 'site-style-button', 'focus back after pick');
  // click outside
  await p.click('#site-style-button');
  await p.mouse.click(700, 600);
  ok(await p.getAttribute('#site-style-menu', 'hidden') !== null, 'click outside closes');
  // scheme dark
  await p.click('#site-scheme-button');
  await p.click('#site-scheme-menu [data-value="dark"]');
  ok(await p.getAttribute('html', 'data-scheme') === 'dark', 'scheme dark');
  await p.waitForTimeout(300);
  const src = await p.evaluate(() => document.querySelector('iframe[data-src]').getAttribute('src'));
  ok(/style=desk/.test(src) && /scheme=dark/.test(src), 'iframe gets style and scheme: ' + src);
  // preview override
  await p.click('#axis-style-button');
  await p.click('#axis-style-menu [data-value="studio"]');
  await p.waitForTimeout(200);
  const src2 = await p.evaluate(() => document.querySelector('iframe[data-src]').getAttribute('src'));
  ok(/style=studio/.test(src2) && (await p.getAttribute('html', 'data-style')) === 'desk', 'preview override only previews');
  await p.click('#axis-platform-button');
  await p.click('#axis-platform-menu [data-value="ios"]');
  // reload
  await p.reload(); await p.waitForTimeout(500);
  ok(await p.getAttribute('html', 'data-style') === 'desk', 'style survives reload');
  ok(await p.getAttribute('html', 'data-scheme') === 'dark', 'scheme survives reload');
  const src3 = await p.evaluate(() => document.querySelector('iframe[data-src]').getAttribute('src') || '');
  ok(/style=desk/.test(src3) && /scheme=dark/.test(src3) && /platform=ios/.test(src3), 'reload: iframe ' + src3);
  const gl = await p.evaluate(() => [...document.querySelectorAll('a[href*="/gallery"]')].map((a) => a.getAttribute('href')));
  ok(gl.length > 0 && gl.every((h) => /style=desk/.test(h) && /scheme=dark/.test(h) && /platform=ios/.test(h)), 'gallery links ' + gl.slice(0, 2).join(' '));
  const label = await p.evaluate(() => { const v = [...document.querySelectorAll('#site-style-button .mv > span')].find((s) => getComputedStyle(s).visibility === 'visible'); return v && v.textContent; });
  ok(label === 'Desk', 'button shows Desk');
  // language persistence: choose Arabic, then come back from outside
  await p.click('#site-lang-button');
  await Promise.all([p.waitForNavigation(), p.click('#site-lang-menu [data-value="ar"]')]);
  ok(p.url().includes('/ar/components/button'), 'language link');
  const p2 = await ctx.newPage();
  await p2.goto('http://localhost:4400/'); await p2.waitForLoadState('load');
  ok(p2.url().endsWith('/ar/'), 'saved language applied on a fresh visit to the home page: ' + p2.url());
  await p2.goto('http://localhost:4400/components/button/'); await p2.waitForLoadState('load');
  ok(p2.url().endsWith('/components/button/'), 'a direct link is never redirected: ' + p2.url());
  await b.close();
})();
