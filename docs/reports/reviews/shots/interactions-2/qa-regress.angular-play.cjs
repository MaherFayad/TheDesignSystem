// ds-qa regression reviewer, order 1.22. For every round 2 interaction the
// registry drives with CSS (drive: 'css') on a component Angular ports, do
// the same action on /c/<slug> in React and in Angular, and record every
// animation that starts after it (CSS transition or keyframes, or WAAPI):
// its target part, property or name, duration, delay and easing. Also the
// box of the target before and 600ms after the action, to catch a layout
// shift, and the state attributes after the action.
//   node qa-regress.angular-play.cjs [reactBase] [ngBase] [style]
// Writes angular.interactions-play.<style>.json.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const R = process.argv[2] || 'http://127.0.0.1:5190';
const A = process.argv[3] || 'http://127.0.0.1:4290';
const style = process.argv[4] || 'neutral';

// id, slug, action, selector
const ROWS = [
  ['button-press', 'button', 'hold', "[data-demo-case] [data-ds='button']:not(:disabled)"],
  ['button-press', 'icon-button', 'hold', "[data-demo-case] [data-ds='icon-button']:not(:disabled)"],
  ['button-press', 'toggle-button', 'hold', "[data-demo-case] [data-ds='toggle-button']:not(:disabled)"],
  ['button-press', 'copy-button', 'hold', "[data-demo-case] [data-ds='copy-button']:not(:disabled)"],
  ['button-press', 'close-button', 'hold', "[data-demo-case] [data-ds='close-button']:not(:disabled)"],
  ['button-press', 'floating-action-button', 'hold', "[data-demo-case] [data-ds='floating-action-button']:not(:disabled)"],
  ['segment-press', 'button-group', 'hold', "[data-ds='button-group'] [data-ds='button']:not(:disabled)"],
  ['segment-press', 'split-button', 'hold', "[data-ds='split-button'] [data-part='action']:not(:disabled), [data-ds='split-button'] button:not(:disabled)"],
  ['button-nudge', 'button', 'hover', "[data-demo-case] [data-ds='button']:has(> [data-part='end']):not(:disabled)"],
  ['close-turn', 'close-button', 'hover', "[data-demo-case] [data-ds='close-button']:not(:disabled)"],
  ['split-chevron', 'split-button', 'click', "[data-ds='split-button'] [aria-haspopup]:not(:disabled)"],
  ['fab-morph', 'floating-action-button', 'click', "[data-demo-case] [data-ds='floating-action-button'][aria-expanded], [data-demo-case] [data-ds='floating-action-button']:not(:disabled)"],
  ['switch-stretch', 'switch', 'click', "[data-ds='switch']:not([data-disabled]) > [data-part='control']"],
  ['link-underline', 'link', 'hover', "[data-demo-case] [data-ds='link']"],
  ['focus-glow', 'input', 'focus', "[data-demo-case] [data-ds='input'] input:not(:disabled), [data-demo-case] input[data-ds='input']:not(:disabled)"],
  ['focus-glow', 'textarea', 'focus', '[data-demo-case] textarea:not(:disabled)'],
  ['focus-glow', 'number-field', 'focus', '[data-demo-case] input:not(:disabled)'],
  ['focus-glow', 'search-field', 'focus', '[data-demo-case] input:not(:disabled)'],
  ['focus-glow', 'password-field', 'focus', '[data-demo-case] input:not(:disabled)'],
  ['focus-glow', 'phone-field', 'focus', "[data-demo-case] input[type='tel']:not(:disabled), [data-demo-case] input:not(:disabled)"],
  ['focus-glow', 'scrub-input', 'focus', '[data-demo-case] input:not(:disabled)'],
  ['field-label-focus', 'field', 'focus', "[data-demo-case] [data-ds='field'] input:not(:disabled)"],
  ['otp-caret', 'otp-field', 'focus', '[data-demo-case] input:not(:disabled)'],
  ['rating-preview', 'rating', 'hover3', "[data-ds='rating']:not([data-readonly]):not([data-disabled]) > [data-part='item']"],
  ['check-draw', 'checkbox', 'click', "[data-ds='checkbox']:not([data-disabled]) > [data-part='control']"],
  ['check-draw', 'checkbox-group', 'click', "[data-ds='checkbox']:not([data-disabled]) > [data-part='control']"],
  ['radio-pop', 'radio-group', 'click2', "[data-ds='radio-group']:not([data-disabled]) [role='radio']:not([disabled])"],
  ['radio-card-lift', 'radio-card', 'click2', "[data-ds='radio-card']:not([data-disabled]), [role='radio']:not([disabled])"],
  ['slider-pull', 'slider', 'hold', "[data-ds='slider']:not([data-disabled]) [data-part='thumb']"],
  ['slider-pull', 'range-slider', 'hold', "[data-ds='range-slider']:not([data-disabled]) [data-part='thumb']"],
  ['picker-chevron-turn', 'select', 'click', "[data-demo-case] [role='combobox']:not(:disabled)"],
  ['picker-chevron-turn', 'combobox', 'click', "[data-demo-case] [data-part='trigger']:not(:disabled), [data-demo-case] button[aria-haspopup]:not(:disabled)"],
  ['picker-chevron-turn', 'multi-select', 'click', "[data-demo-case] [role='combobox']:not(:disabled), [data-demo-case] button[aria-haspopup]:not(:disabled)"],
  ['menu-origin', 'dropdown-menu', 'click', "[data-demo-case] [aria-haspopup='menu']:not(:disabled)"],
  ['dialog-spring', 'dialog', 'click', '[data-demo-case] [data-demo-trigger], [data-demo-case] [aria-haspopup="dialog"]'],
  ['window-lights', 'window-controls', 'hover', "[data-demo-case] [data-ds='window-controls']"],
  ['window-lights', 'title-bar', 'hover', "[data-demo-case] [data-ds='window-controls']"],
  ['alert-entrance', 'alert', 'load', "[data-ds='alert']"],
  ['alert-entrance', 'banner', 'load', "[data-ds='banner']"],
  ['alert-entrance', 'callout', 'load', "[data-ds='callout']"],
  ['state-illustration', 'error-state', 'load', "[data-ds='error-state']"],
  ['error-state-details', 'error-state', 'click', "[data-ds='error-state'] summary, [data-ds='error-state'] [aria-expanded]"],
  ['skeleton-swap', 'skeleton', 'load', "[data-ds='skeleton']"],
  ['toast-enter', 'toast', 'click', '[data-demo-case] [data-demo-trigger], [data-demo-case] button'],
  ['progress-spring', 'progress-bar', 'load', "[data-ds='progress-bar']"],
  ['progress-spring', 'progress-circle', 'load', "[data-ds='progress-circle']"],
  ['status-pulse', 'status-dot', 'load', "[data-ds='status-dot']"],
  ['spinner-loop', 'spinner', 'load', "[data-ds='spinner']"],
];

const INIT = () => {
  window.__seen = [];
  const map = new Map();
  const d = (el) => {
    if (!el || !el.tagName) return '?';
    const p = el.getAttribute('data-part');
    const ds = el.getAttribute('data-ds');
    return `${el.tagName.toLowerCase()}${ds ? `[ds=${ds}]` : ''}${p ? `[part=${p}]` : ''}`;
  };
  const tick = () => {
    const t = performance.now();
    for (const a of document.getAnimations()) {
      if (map.has(a)) continue;
      const e = a.effect;
      if (!e) continue;
      const tm = e.getTiming();
      const ct = e.getComputedTiming();
      let props = [];
      try { props = [...new Set(e.getKeyframes().flatMap((k) => Object.keys(k).filter((x) => !['offset', 'computedOffset', 'easing', 'composite'].includes(x))))]; } catch { /* none */ }
      const rec = { t: Math.round(t), kind: a.constructor.name, name: a.transitionProperty || a.animationName || a.id || '', props: props.join(','), on: d(e.target) + (e.pseudoElement || ''), dur: Math.round(Number(ct.duration) || 0), delay: Math.round(Number(tm.delay) || 0), easing: tm.easing, iter: ct.iterations === Infinity ? 'inf' : ct.iterations };
      map.set(a, rec);
      window.__seen.push(rec);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

async function run(browser, base, slug, action, sel, dir) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const rtl = dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
  await page.goto(`${base}/c/${slug}?style=${style}&scheme=light&chrome=0${rtl}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('[data-demo-case]', { timeout: 60000 });
  await page.waitForTimeout(1500);
  const loc = page.locator(sel);
  const count = await loc.count();
  if (!count) { await ctx.close(); return { missing: true }; }
  let el = loc.first();
  if (action === 'click2' && count > 1) el = loc.nth(1);
  if (action === 'hover3' && count > 2) el = loc.nth(2);
  if (action === 'load') {
    const seen = await page.evaluate(() => window.__seen.filter((r) => r.dur > 0 || r.iter === 'inf'));
    await ctx.close();
    return { seen: summarize(seen) };
  }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const before = await el.boundingBox();
  const t0 = await page.evaluate(() => performance.now());
  const cx = before.x + before.width / 2, cy = before.y + before.height / 2;
  if (action === 'hold') { await page.mouse.move(cx, cy); await page.mouse.down(); await page.waitForTimeout(400); await page.mouse.up(); }
  else if (action === 'hover' || action === 'hover3') { await page.mouse.move(cx, cy); }
  else if (action === 'focus') { await el.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); }
  else { await page.mouse.move(cx, cy); await page.mouse.click(cx, cy); }
  await page.waitForTimeout(900);
  const after = await el.boundingBox().catch(() => null);
  const seen = await page.evaluate((t0) => window.__seen.filter((r) => r.t >= t0 - 5 && (r.dur > 0 || r.iter === 'inf')), t0);
  const state = await el.evaluate((e) => [...e.attributes].filter((a) => /^(aria-(pressed|checked|expanded|selected)|data-state)$/.test(a.name)).map((a) => `${a.name}=${a.value}`).join(' ')).catch(() => 'gone');
  await page.mouse.move(2, 2);
  await page.keyboard.press('Escape');
  await ctx.close();
  const shift = before && after ? Math.round(Math.max(Math.abs(before.x - after.x), Math.abs(before.y - after.y), Math.abs(before.width - after.width), Math.abs(before.height - after.height)) * 10) / 10 : null;
  return { seen: summarize(seen), shift, state };
}

function summarize(seen) {
  const k = new Map();
  for (const r of seen) {
    const key = `${r.kind}:${r.name || r.props}@${r.on} ${r.dur}ms${r.delay ? `+${r.delay}` : ''} ${r.easing.slice(0, 40)}${r.iter === 'inf' ? ' inf' : ''}`;
    k.set(key, (k.get(key) || 0) + 1);
  }
  return [...k].map(([a, n]) => (n > 1 ? `${a} x${n}` : a)).sort();
}

(async () => {
  const browser = await chromium.launch();
  const res = [];
  for (const [id, slug, action, sel] of ROWS) {
    for (const dir of ['ltr', 'rtl']) {
      const row = { id, slug, action, dir };
      try {
        row.react = await run(browser, R, slug, action, sel, dir);
        row.angular = await run(browser, A, slug, action, sel, dir);
        const rs = new Set(row.react.seen || []);
        const as = new Set(row.angular.seen || []);
        row.onlyReact = [...rs].filter((x) => !as.has(x));
        row.onlyAngular = [...as].filter((x) => !rs.has(x));
        row.verdict = row.angular.missing ? 'no target in Angular' : row.react.missing ? 'no target in React' : !rs.size ? 'nothing in React' : !as.size ? 'inert' : !row.onlyReact.length && !row.onlyAngular.length ? 'plays, same' : 'plays, differs';
      } catch (e) {
        row.error = String(e.message || e).slice(0, 200);
      }
      console.log(id, slug, dir, row.verdict || 'ERROR ' + row.error, 'R', (row.react?.seen || []).length, 'A', (row.angular?.seen || []).length, 'shift', row.react?.shift, row.angular?.shift);
      res.push(row);
      fs.writeFileSync(path.join(__dirname, `angular.interactions-play.${style}.json`), JSON.stringify(res, null, 1));
    }
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
