// Proof for order R0.11: platform detection in the docs site.
// Needs the site served (npm run build:site, then npm run serve:site -w @the-system/docs).
// Run from the repo root: BASE=http://localhost:4400 node apps/docs/scripts/proof/platform.mjs [--shots] [--axe]
// Writes docs/reports/reset/R0.11/probe.json (probe-axe.json with --axe), and with --shots the top bar PNGs.
import { chromium, devices } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:4400';
const out = 'docs/reports/reset/R0.11';
fs.mkdirSync(out, { recursive: true });
const shots = process.argv.includes('--shots');
const axe = process.argv.includes('--axe');
const report = { base, profiles: [], overrides: [], shots: [], axe: [] };
let failures = 0;
const ok = (c, m) => {
  console.log((c ? 'pass ' : 'FAIL ') + m);
  if (!c) failures++;
};

// iPadOS Safari in its default desktop mode: a Mac agent, five touch points, no client hints.
const ipadDesktop = {
  ...devices['Desktop Safari'],
  viewport: { width: 1180, height: 820 },
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  init: () => {
    Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 });
    Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined });
  },
};
const profiles = [
  ['iPhone 15', devices['iPhone 15'], 'ios'],
  ['iPhone SE', devices['iPhone SE'], 'ios'],
  ['Pixel 7', devices['Pixel 7'], 'android'],
  ['Galaxy S9+', devices['Galaxy S9+'], 'android'],
  ['iPad Pro 11', devices['iPad Pro 11'], 'ios'],
  ['iPad desktop mode', ipadDesktop, 'ios'],
  ['Desktop Chrome', devices['Desktop Chrome'], 'web'],
  ['Desktop Safari', devices['Desktop Safari'], 'web'],
  ['Default headless Chromium', { viewport: { width: 1280, height: 800 } }, 'web'],
];

// Watches <html> from the first script on: the value when <body> is first
// inserted (before any paint of content), every later change of
// data-platform, and the layout shift score.
function watch() {
  if (window !== window.top) return;
  const w = { atBody: null, changes: [], cls: 0, barShift: 0, shifted: [] };
  window.__probe = w;
  new MutationObserver((list, obs) => {
    for (const m of list) {
      for (const n of m.addedNodes) {
        if (n.nodeName === 'BODY' && w.atBody === null) w.atBody = document.documentElement.getAttribute('data-platform');
      }
    }
    if (w.atBody !== null) obs.disconnect();
  }).observe(document, { childList: true, subtree: true });
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.target !== document.documentElement) continue;
      const now = m.target.getAttribute('data-platform');
      if (m.oldValue !== now) w.changes.push({ from: m.oldValue, to: now, body: !!document.body });
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-platform'], attributeOldValue: true });
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        w.cls += e.value;
        const nodes = e.sources.map((x) => x.node).filter(Boolean);
        if (nodes.some((n) => n.closest?.('.topbar'))) w.barShift += e.value;
        w.shifted.push(...nodes.map((n) => n.className || n.nodeName));
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
}

async function context(browser, descriptor, extra = {}) {
  const { init, ...rest } = descriptor;
  const ctx = await browser.newContext({ ...rest, ...extra });
  ctx.setDefaultTimeout(90000);
  ctx.setDefaultNavigationTimeout(90000);
  if (init) await ctx.addInitScript(init);
  await ctx.addInitScript(watch);
  return ctx;
}

async function frameState(page) {
  const handle = await page.waitForSelector('iframe[data-src][src]', { state: 'attached', timeout: 60000 });
  const src = await handle.getAttribute('src');
  const frame = await handle.contentFrame();
  await frame.waitForSelector('[data-ds="theme"][data-platform]', { state: 'attached', timeout: 60000 });
  const platform = await frame.evaluate(() => document.querySelector('[data-ds="theme"]').getAttribute('data-platform'));
  const html = await frame.evaluate(() => document.documentElement.getAttribute('data-platform'));
  return { src: src.replace(/^.*\?/, '?'), platform, html };
}

async function topbar(page) {
  return page.evaluate(() => {
    const r = document.documentElement;
    const btn = document.getElementById('site-platform-button');
    const shown = [...btn.querySelectorAll('.mv > [data-v]')].find((v) => getComputedStyle(v).visibility === 'visible');
    const text = shown ? [...shown.querySelectorAll('[data-pd]')].find((v) => getComputedStyle(v).display !== 'none')?.textContent ?? shown.textContent : '';
    const checked = document.querySelector('#site-platform-menu [aria-checked="true"]')?.dataset.value;
    const box = btn.getBoundingClientRect();
    const bar = document.querySelector('.topbar').getBoundingClientRect();
    return {
      platform: r.dataset.platform,
      detected: r.dataset.platformDetected,
      choice: r.dataset.platformChoice,
      source: r.dataset.platformSource,
      button: text.replace(/\s+/g, ' ').trim(),
      checked,
      buttonBox: [Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)],
      barHeight: Math.round(bar.height),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      // Parts of the bar that overlap each other (the brand under the search button, for example).
      overlaps: (() => {
        const parts = ['.menu-btn', '.brand-mark', '.brand > span:not(.version)', '.search-btn', ...[...document.querySelectorAll('.tools > *')].map((_, i) => `.tools > :nth-child(${i + 1})`)];
        const rects = parts.map((sel) => [sel, document.querySelector(sel)?.getBoundingClientRect()]).filter(([, r]) => r && r.width > 1 && r.height > 1);
        const hits = [];
        for (let i = 0; i < rects.length; i++)
          for (let j = i + 1; j < rects.length; j++) {
            const [a, ra] = rects[i];
            const [b, rb] = rects[j];
            if (ra.left < rb.right - 0.5 && rb.left < ra.right - 0.5 && ra.top < rb.bottom - 0.5 && rb.top < ra.bottom - 0.5) hits.push(`${a} / ${b}`);
          }
        return hits;
      })(),
      probe: window.__probe,
    };
  });
}

(async () => {
  const browser = await chromium.launch();

  // 1. Every profile, no query, nothing stored: the docs page and its preview.
  for (const [name, descriptor, expected] of profiles) {
    const ctx = await context(browser, descriptor);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text()));
    await page.goto(`${base}/components/switch/`, { waitUntil: 'load' });
    const early = await topbar(page);
    const frame = await frameState(page);
    await page.waitForTimeout(800);
    const late = await topbar(page);
    const hints = await page.evaluate(() => navigator.userAgentData?.platform ?? null);
    const touch = await page.evaluate(() => navigator.maxTouchPoints);
    const row = { profile: name, expected, hints, maxTouchPoints: touch, ...late, frame, buttonMoved: early.buttonBox.join() !== late.buttonBox.join(), errors };
    report.profiles.push(row);
    ok(late.platform === expected && late.detected === expected, `${name}: html data-platform ${late.platform}, detected ${late.detected}`);
    ok(late.probe.atBody === expected, `${name}: ${late.probe.atBody} already stamped when <body> was parsed`);
    ok(late.probe.changes.every((c) => !c.body), `${name}: no platform change after the body (${JSON.stringify(late.probe.changes)})`);
    ok(frame.platform === expected, `${name}: preview iframe data-platform ${frame.platform} (${frame.src})`);
    ok(!row.buttonMoved && late.probe.barShift === 0, `${name}: top bar did not shift (bar shift ${late.probe.barShift}, page CLS ${late.probe.cls.toFixed(4)} from ${[...new Set(late.probe.shifted)].join(', ') || 'nothing'})`);
    ok(!late.overflowX, `${name}: no horizontal scroll`);
    ok(late.overlaps.length === 0, `${name}: no overlap in the top bar ${late.overlaps.join(', ')}`);
    ok(errors.length === 0, `${name}: no console error or warning`);
    await ctx.close();
  }

  // 2. The override order on the phones.
  for (const [name, descriptor, device] of [profiles[0], profiles[2]]) {
    const ctx = await context(browser, descriptor);
    const page = await ctx.newPage();
    const step = async (label, path, expect) => {
      await page.goto(base + path, { waitUntil: 'load' });
      const s = await topbar(page);
      const f = path.includes('/components/') ? await frameState(page) : null;
      report.overrides.push({ profile: name, step: label, path, platform: s.platform, source: s.source, choice: s.choice, button: s.button, checked: s.checked, frame: f, stored: await page.evaluate(() => localStorage.getItem('ds-platform')) });
      ok(s.platform === expect.platform && s.source === expect.source && (!f || f.platform === expect.platform), `${name}: ${label}: ${s.platform} from ${s.source}, button "${s.button}"${f ? `, frame ${f.platform}` : ''}`);
      return s;
    };
    await step('URL key web', '/components/switch/?platform=web', { platform: 'web', source: 'url' });
    await step('URL key macos', '/components/switch/?platform=macos', { platform: 'macos', source: 'url' });
    await step('unknown URL key ignored', '/components/switch/?platform=windows', { platform: device, source: 'device' });
    await step('URL key auto ignored', '/components/switch/?platform=auto', { platform: device, source: 'device' });
    // Pick android (or ios) in the top bar.
    const other = device === 'ios' ? 'android' : 'ios';
    await page.goto(`${base}/components/switch/`, { waitUntil: 'load' });
    await page.click('#site-platform-button');
    await page.click(`#site-platform-menu [data-value="${other}"]`);
    await page.waitForTimeout(300);
    const picked = await topbar(page);
    const pickedFrame = await frameState(page);
    const stored = await page.evaluate(() => localStorage.getItem('ds-platform'));
    ok(picked.platform === other && stored === other && pickedFrame.platform === other, `${name}: pick ${other} in the top bar: html ${picked.platform}, stored ${stored}, frame ${pickedFrame.platform}`);
    const galleryLinks = await page.evaluate(() => [...document.querySelectorAll('a[data-open-gallery]')].map((a) => a.href));
    ok(galleryLinks.every((h) => h.includes(`platform=${other}`)), `${name}: open in gallery carries platform=${other}`);
    await step('stored choice kept on another page', '/components/button/', { platform: other, source: 'stored' });
    await step('stored choice kept in Arabic', '/ar/components/button/', { platform: other, source: 'stored' });
    await step('URL key wins over the stored choice', '/components/button/?platform=web', { platform: 'web', source: 'url' });
    // Picking from a URL keyed page stores the pick and drops the key from the address.
    await page.click('#site-platform-button');
    await page.click('#site-platform-menu [data-value="macos"]');
    await page.waitForTimeout(200);
    const addr = page.url();
    ok(!addr.includes('platform=') && (await page.evaluate(() => localStorage.getItem('ds-platform'))) === 'macos', `${name}: pick macos on a keyed page: address ${addr.replace(base, '')}, stored macos`);
    // Auto clears the stored choice.
    await page.click('#site-platform-button');
    await page.click('#site-platform-menu [data-value="auto"]');
    await page.waitForTimeout(300);
    const autoFrame = await frameState(page);
    ok((await page.evaluate(() => localStorage.getItem('ds-platform'))) === null && autoFrame.platform === device, `${name}: pick auto clears the key, frame back to ${autoFrame.platform}`);
    const autoLinks = await page.evaluate(() => [...document.querySelectorAll('a[data-open-gallery]')].map((a) => a.href));
    ok(autoLinks.every((h) => !h.includes('platform=')), `${name}: on auto, open in gallery names no platform`);
    await step('auto on the next page', '/components/switch/', { platform: device, source: 'device' });
    // The preview settings switch is the same setting.
    await page.click('#axis-platform-button');
    await page.click('#axis-platform-menu [data-value="web"]');
    await page.waitForTimeout(200);
    const viaAxis = await topbar(page);
    ok(viaAxis.platform === 'web' && viaAxis.checked === 'web' && viaAxis.button === 'Web', `${name}: the preview settings switch sets the same choice, top bar reads "${viaAxis.button}"`);
    await ctx.close();
  }

  // 3. Desktop: macos only by override.
  {
    const ctx = await context(browser, devices['Desktop Safari']);
    const page = await ctx.newPage();
    await page.goto(`${base}/components/switch/?platform=macos`, { waitUntil: 'load' });
    const s = await topbar(page);
    const f = await frameState(page);
    report.overrides.push({ profile: 'Desktop Safari', step: 'URL key macos', platform: s.platform, source: s.source, button: s.button, frame: f });
    ok(s.platform === 'macos' && f.platform === 'macos' && s.detected === 'web', `Desktop Safari: ?platform=macos stamps macos, detected web, frame ${f.platform}`);
    await ctx.close();
  }

  // 4. Screenshots of the top bar.
  if (shots) {
    for (const [name, descriptor, file] of [['iPhone 15', devices['iPhone 15'], 'iphone'], ['Pixel 7', devices['Pixel 7'], 'pixel']]) {
      for (const lang of ['en', 'ar']) {
        const ctx = await context(browser, descriptor, { colorScheme: 'light' });
        const page = await ctx.newPage();
        await page.goto(`${base}${lang === 'ar' ? '/ar' : ''}/components/switch/`, { waitUntil: 'load' });
        await page.waitForTimeout(600);
        const bar = await page.$('.topbar');
        const path = `${out}/topbar-${file}-${lang}.png`;
        await bar.screenshot({ path });
        await page.click('#site-platform-button');
        await page.waitForTimeout(350);
        const box = await page.evaluate(() => {
          const m = document.getElementById('site-platform-menu').getBoundingClientRect();
          return { x: 0, y: 0, width: window.innerWidth, height: Math.ceil(m.bottom + 8) };
        });
        const menuPath = `${out}/topbar-${file}-${lang}-menu.png`;
        await page.screenshot({ path: menuPath, clip: box });
        const s = await topbar(page);
        report.shots.push({ profile: name, lang, bar: path, menu: menuPath, button: s.button, platform: s.platform });
        await ctx.close();
      }
    }
  }

  // 5. Axe on the sample pages in four styles, on the iPhone (ios stamped) and on a desktop.
  if (axe) {
    for (const style of ['neutral', 'desk', 'liquid', 'studio']) {
      for (const scheme of ['light', 'dark']) {
        for (const [name, descriptor] of [['iPhone 15', devices['iPhone 15']], ['Desktop Chrome', devices['Desktop Chrome']]]) {
          const ctx = await context(browser, descriptor, { colorScheme: scheme });
          await ctx.addInitScript(([s]) => {
            try {
              localStorage.setItem('ds-docs-style', s);
            } catch {}
          }, [style]);
          const page = await ctx.newPage();
          for (const path of ['/', '/components/switch/', '/platforms/', '/ar/components/switch/']) {
            await page.goto(base + path, { waitUntil: 'load' });
            await page.waitForTimeout(500);
            const runs = [['page', null]];
            if (path === '/components/switch/') runs.push(['platform menu open', '#site-platform-button']);
            for (const [what, open] of runs) {
              if (open) {
                await page.click(open);
                await page.waitForTimeout(300);
              }
              const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).exclude('iframe').analyze();
              const platform = await page.getAttribute('html', 'data-platform');
              report.axe.push({ style, scheme, profile: name, path, what, platform, violations: r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, target: v.nodes.slice(0, 2).map((n) => n.target.join(' ')) })) });
              ok(r.violations.length === 0, `axe ${style} ${scheme} ${name} ${path} ${what} (${platform}): ${r.violations.map((v) => v.id).join(', ') || 'clean'}`);
              if (open) await page.keyboard.press('Escape');
            }
          }
          await ctx.close();
        }
      }
    }
  }

  await browser.close();
  report.failures = failures;
  fs.writeFileSync(`${out}/${axe ? 'probe-axe' : 'probe'}.json`, JSON.stringify(report, null, 1) + '\n');
  console.log(failures === 0 ? 'all pass' : `${failures} failed`);
  process.exitCode = failures === 0 ? 0 : 1;
})();
