// ds-qa regression reviewer, order 1.22. Recheck of the six round 1
// blockers with the round 1 method.
//   node qa-regress.recheck.cjs [base] [only]   (only: b1,b2,b4,b5)
// B1: keyboard focus, then the ring layer (::before) opacity per frame.
// B2: pointer held on Button, ToggleButton, Switch, Slider thumb; computed
//     scale under normal, media reduce and data-motion="reduce".
// B4: SegmentedControl "many" case at 320px; words split across lines.
// B5: Combobox and Autocomplete, ArrowDown, the highlighted row's ring and
//     its fill contrast against the resting row.
// Writes recheck.b1.json, recheck.b2.json, recheck.b4.json, recheck.b5.json.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const base = process.argv[2] || 'http://127.0.0.1:5190';
const only = (process.argv[3] || 'b1,b2,b4,b5').split(',');
const out = (n, d) => fs.writeFileSync(path.join(__dirname, `recheck.${n}.json`), JSON.stringify(d, null, 1));

async function newPage(browser, url, { reduced = false, viewport = { width: 1024, height: 800 }, attr = false } = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(500);
  if (attr) await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduce'));
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { /* infinite */ } }));
  return { ctx, page };
}

const STYLES = ['studio', 'desk', 'neutral'];

async function b1(browser) {
  const SETS = [
    { comp: 'checkbox', sel: "[data-ds='checkbox'] > [data-part='control']" },
    { comp: 'switch', sel: "[data-ds='switch'] > [data-part='control']" },
    { comp: 'rating', sel: "[data-ds='rating']:not([data-readonly]) > [data-part='item']" },
    { comp: 'slider', sel: "[data-ds='slider'] [data-part='thumb']" },
  ];
  const res = [];
  for (const style of STYLES) {
    for (const dir of ['ltr', 'rtl']) {
      if (dir === 'rtl' && style !== 'neutral') continue;
      for (const s of SETS) {
        const rtl = dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
        const { ctx, page } = await newPage(browser, `${base}/c/${s.comp}?style=${style}&scheme=light&chrome=0${rtl}`);
        // Focus the element before the target, then Tab onto it, so it is a keyboard focus.
        const frames = await page.evaluate(async (sel) => {
          const el = document.querySelector(sel);
          el.scrollIntoView({ block: 'center' });
          const all = [...document.querySelectorAll('a[href],button,input,[tabindex]')].filter((e) => e.tabIndex >= 0);
          const prev = all[all.indexOf(el) - 1];
          if (prev) prev.focus();
          return true;
        }, s.sel);
        await page.evaluate(() => {
          window.__ring = [];
          window.__t0 = null;
          const tick = () => {
            const el = document.activeElement;
            if (window.__t0 !== null) window.__ring.push({ t: Math.round(performance.now() - window.__t0), op: getComputedStyle(el, '::before').opacity, shadow: getComputedStyle(el, '::before').boxShadow !== 'none', anims: document.getAnimations().filter((a) => a.effect && a.effect.target === el && a.effect.pseudoElement === '::before').length });
            if (window.__ring.length < 20) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        await page.evaluate(() => { window.__t0 = performance.now(); });
        await page.keyboard.press('Tab');
        await page.waitForTimeout(450);
        const r = await page.evaluate((sel) => ({ focused: document.activeElement === document.querySelector(sel) || document.activeElement.matches(sel), fv: document.activeElement.matches(':focus-visible'), frames: window.__ring.filter((f) => f.t >= 0).slice(0, 12), ringTransition: getComputedStyle(document.activeElement, '::before').transitionProperty + ' ' + getComputedStyle(document.activeElement, '::before').transitionDuration }), s.sel);
        const firstVisible = r.frames.find((f) => Number(f.op) > 0);
        res.push({ style, dir, comp: s.comp, focused: r.focused, focusVisible: r.fv, ringTransition: r.ringTransition, firstFrameOpacity: r.frames[0]?.op, firstVisibleAt: firstVisible?.t, opacities: r.frames.map((f) => `${f.t}:${f.op}`).join(' ') });
        console.log('B1', style, dir, s.comp, r.focused, r.ringTransition, r.frames.map((f) => `${f.t}:${f.op}`).join(' '));
        if (style === 'neutral' && dir === 'ltr') await page.locator(':focus').screenshot({ path: path.join(__dirname, `recheck.b1.${s.comp}.neutral.ring.png`) }).catch(() => {});
        await ctx.close();
      }
    }
  }
  out('b1', res);
}

async function b2(browser) {
  const SETS = [
    { comp: 'button', sel: "[data-demo-case] [data-ds='button']:not(:disabled)", measure: (sel) => sel },
    { comp: 'toggle-button', sel: "[data-demo-case] [data-ds='toggle-button']:not(:disabled)" },
    { comp: 'switch', sel: "[data-ds='switch']:not([data-disabled]) > [data-part='control']", part: "[data-part='thumb']" },
    { comp: 'slider', sel: "[data-ds='slider']:not([data-disabled]) [data-part='thumb']" },
  ];
  const res = [];
  for (const style of STYLES) {
    for (const mode of ['normal', 'media', 'attr']) {
      for (const s of SETS) {
        const { ctx, page } = await newPage(browser, `${base}/c/${s.comp}?style=${style}&scheme=light&chrome=0`, { reduced: mode === 'media', attr: mode === 'attr' });
        const el = page.locator(s.sel).first();
        await el.scrollIntoViewIfNeeded();
        const box = await el.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        const m = await page.evaluate(({ sel, part }) => {
          const e = document.querySelector(sel);
          const t = part ? e.querySelector(part) : e;
          const cs = getComputedStyle(t);
          const r = t.getBoundingClientRect();
          return { transform: cs.transform, scale: cs.scale, w: Math.round(r.width * 100) / 100, offsetW: t.offsetWidth, h: Math.round(r.height * 100) / 100, offsetH: t.offsetHeight, running: document.getAnimations().filter((a) => a.playState === 'running' && Number(a.effect.getComputedTiming().duration) > 0).length };
        }, { sel: s.sel, part: s.part });
        await page.mouse.up();
        const sx = m.offsetW ? m.w / m.offsetW : null;
        const sy = m.offsetH ? m.h / m.offsetH : null;
        res.push({ style, mode, comp: s.comp, held: m, scaleX: sx && Math.round(sx * 10000) / 10000, scaleY: sy && Math.round(sy * 10000) / 10000 });
        console.log('B2', style, mode, s.comp, m.transform, m.scale, sx && sx.toFixed(4), sy && sy.toFixed(4));
        await ctx.close();
      }
    }
  }
  out('b2', res);
}

async function b4(browser) {
  const res = [];
  for (const style of STYLES) {
    for (const dir of ['ltr', 'rtl']) {
      const rtl = dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
      const { ctx, page } = await newPage(browser, `${base}/c/segmented-control?style=${style}&scheme=light&chrome=0${rtl}`, { viewport: { width: 320, height: 900 } });
      const r = await page.evaluate(() => {
        const splits = [];
        const items = [];
        for (const label of document.querySelectorAll("[data-ds='segmented-control'] [data-part='item'], [data-ds='segmented-control'] button")) {
          const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = walker.nextNode())) {
            const text = n.textContent;
            const re = /\S+/g;
            let m;
            while ((m = re.exec(text))) {
              const range = document.createRange();
              range.setStart(n, m.index);
              range.setEnd(n, m.index + m[0].length);
              const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
              if (tops.size > 1) splits.push({ word: m[0], lines: tops.size, case: label.closest('[data-demo-case]')?.getAttribute('data-demo-case') });
            }
          }
          const r = label.getBoundingClientRect();
          items.push(Math.round(r.height));
        }
        return { splits, maxItemHeight: Math.max(...items), scrollWidth: document.documentElement.scrollWidth };
      });
      res.push({ style, dir, ...r });
      console.log('B4', style, dir, JSON.stringify(r).slice(0, 300));
      if (style === 'neutral') {
        const many = page.locator('[data-demo-case]').filter({ has: page.locator("[data-ds='segmented-control'] [data-part='item']:nth-child(5)") }).first();
        await many.screenshot({ path: path.join(__dirname, `recheck.b4.many-320-neutral-light-${dir}.png`) }).catch((e) => console.log('shot', e.message));
      }
      await ctx.close();
    }
  }
  out('b4', res);
}

function lum(c) {
  const m = c.match(/[\d.]+/g).map(Number);
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
}

async function b5(browser) {
  const res = [];
  for (const comp of ['combobox', 'autocomplete']) {
    for (const style of STYLES) {
      for (const scheme of ['light', 'dark']) {
        const { ctx, page } = await newPage(browser, `${base}/c/${comp}?style=${style}&scheme=${scheme}&chrome=0`);
        const input = page.locator("[data-demo-case] input[role='combobox']:not(:disabled)").first();
        await input.scrollIntoViewIfNeeded();
        await input.click();
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(250);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(600);
        await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { /* infinite */ } }));
        const m = await page.evaluate(() => {
          const hi = document.querySelector("[role='option'][data-highlighted]");
          if (!hi) return { none: true, options: document.querySelectorAll("[role='option']").length };
          const rest = [...document.querySelectorAll("[role='option']")].find((o) => o !== hi && !o.hasAttribute('data-disabled'));
          const pick = (el) => {
            const out = {};
            for (const p of ['', '::before', '::after']) {
              const cs = getComputedStyle(el, p || null);
              out[p || 'self'] = { bg: cs.backgroundColor, shadow: cs.boxShadow, outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, opacity: cs.opacity, content: cs.content };
            }
            return out;
          };
          let bgBehind = 'rgb(255, 255, 255)';
          let e = hi.parentElement;
          while (e) { const b = getComputedStyle(e).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') { bgBehind = b; break; } e = e.parentElement; }
          return { hi: pick(hi), rest: rest && pick(rest), listBg: bgBehind, text: hi.textContent.trim().slice(0, 30), active: document.activeElement.getAttribute('aria-activedescendant') === hi.id };
        });
        let ring = false, ringRatio = null, fillRatio = null;
        if (!m.none) {
          const all = ['self', '::before', '::after'];
          for (const k of all) {
            const v = m.hi[k];
            if ((v.shadow && v.shadow !== 'none' && Number(v.opacity) > 0 && v.content !== 'none') || (k === 'self' && v.shadow !== 'none')) {
              ring = true;
              const c = v.shadow.match(/rgba?\([^)]+\)/);
              if (c) { const a = lum(c[0]); const b = lum(m.listBg); ringRatio = Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100; }
            }
            if (k === 'self' && !v.outline.startsWith('none')) ring = true;
          }
          const fill = [m.hi.self.bg, m.hi['::before'].bg, m.hi['::after'].bg].find((b) => b !== 'rgba(0, 0, 0, 0)') || m.listBg;
          if (!/rgba\([^)]*, 0(\.\d+)?\)/.test(fill) || true) { const a = lum(fill.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgb($1,$2,$3)')); const b = lum(m.listBg); fillRatio = Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100; }
        }
        res.push({ comp, style, scheme, ring, ringRatioOnList: ringRatio, fillRatioRoughOpaque: fillRatio, ...m });
        console.log('B5', comp, style, scheme, 'ring', ring, ringRatio, 'fill', fillRatio, m.none ? 'NO HIGHLIGHT' : JSON.stringify(m.hi.self).slice(0, 160));
        await page.screenshot({ path: path.join(__dirname, `recheck.b5.${comp}.${style}-${scheme}.png`), clip: await page.locator("[role='listbox']").first().boundingBox().catch(() => null) || undefined }).catch(() => {});
        await ctx.close();
      }
    }
  }
  out('b5', res);
}

(async () => {
  const browser = await chromium.launch();
  if (only.includes('b1')) await b1(browser);
  if (only.includes('b2')) await b2(browser);
  if (only.includes('b4')) await b4(browser);
  if (only.includes('b5')) await b5(browser);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
