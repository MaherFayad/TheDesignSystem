// ds-qa review of order 1.22: rapid, interrupted, Escape, focus ring, hit
// test, `off` recipe and held size checks for the selection and overlays
// families. Writes raw results to a scratch folder.
//   STYLE=neutral DIR=ltr node qa-selection-overlays.checks.cjs <outDir> [ids...]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const L = require('./qa-selection-overlays.lib.cjs');
const { interactions } = loadRegistry();

function loadRegistry() {
  // The registry is TypeScript; read the `off` rows by evaluating the object literal text.
  const dir = path.resolve(__dirname, '../../../../../packages/motion/src/interactions');
  const out = [];
  for (const f of ['selection.ts', 'overlays.ts']) {
    let src = fs.readFileSync(path.join(dir, f), 'utf8');
    src = src.replace(/^import .*$/gm, '').replace(/ as const satisfies readonly Interaction\[\];/, ';').replace(/ as const;/g, ';').replace(/export const (\w+) =/g, 'module.exports.$1 =');
    const m = { exports: {} };
    new Function('module', src)(m);
    for (const v of Object.values(m.exports)) out.push(...v);
  }
  return { interactions: out };
}

const T = '[data-interaction-trigger]';
const sleep = L.sleep;
const OVERLAY = "[role=menu],[role=dialog],[role=alertdialog],[role=tooltip],[data-ds='popover'],[data-ds='hover-card'],[data-ds='tour'],[data-ds='window']";

async function snapshot(p, stateSel) {
  return p.evaluate(({ OVERLAY, stateSel }) => {
    const el = document.querySelector(stateSel);
    const st = {};
    if (el) for (const a of el.attributes) if (/^(aria-(pressed|checked|expanded|selected|valuenow)|data-state)$/.test(a.name)) st[a.name] = a.value;
    const open = [...document.querySelectorAll(OVERLAY)].filter((n) => !n.closest('[data-interaction-stage]') || n.matches("[data-ds='window']")).map((n) => `${n.getAttribute('role') || n.getAttribute('data-ds')}:${n.getAttribute('data-state') || ''}`);
    const lb = [...document.querySelectorAll('[role=listbox]')].filter((n) => !n.closest('[data-interaction-stage]')).length;
    return { state: st, open, popupListboxes: lb, active: document.activeElement ? document.activeElement.tagName + (document.activeElement.getAttribute('role') ? '[' + document.activeElement.getAttribute('role') + ']' : '') : null };
  }, { OVERLAY, stateSel });
}

async function after(p, stateSel, extra) {
  await sleep(1300);
  const snap = await snapshot(p, stateSel);
  snap.rest = await L.restCheck(p);
  if (extra) snap.extra = await p.evaluate(extra).catch((e) => String(e));
  return snap;
}

async function clickAt(p, sel) { const c = await L.center(p, sel); await p.mouse.click(c.x, c.y); }

// Rapid: the same trigger twice, 30ms apart. Interrupt: the action reversed before the motion ends.
const specs = {
  'check-draw': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await clickAt(p, T); }, interrupt: async (p) => { await clickAt(p, T); await sleep(60); await clickAt(p, T); await sleep(60); await clickAt(p, T); }, held: { sel: T, part: "[data-ds='checkbox'] [data-part='indicator']" } },
  'radio-pop': { rapid: async (p) => { await clickAt(p, "[role=radio][value='svg']"); await sleep(30); await clickAt(p, "[role=radio][value='pdf']"); }, interrupt: async (p) => { await clickAt(p, "[role=radio][value='svg']"); await sleep(60); await clickAt(p, T); }, held: { sel: "[role=radio][value='svg']", part: "[role=radio][value='svg']" } },
  'radio-card-lift': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await clickAt(p, "[role=radio][value='team']"); }, interrupt: async (p) => { await clickAt(p, T); await sleep(60); await clickAt(p, "[role=radio][value='team']"); await sleep(60); await clickAt(p, T); }, held: { sel: T, part: T }, hit: { sel: T, act: (p) => clickAt(p, T) } },
  'slider-pull': { rapid: async (p) => { const c = await L.center(p, '[data-ds=slider] [role=slider]'); await p.mouse.move(c.x, c.y); await p.mouse.down(); await sleep(30); await p.mouse.up(); await sleep(30); await p.mouse.down(); await sleep(30); await p.mouse.up(); }, stateSel: '[data-ds=slider] [role=slider]', held: { sel: '[data-ds=slider] [role=slider]', part: '[data-ds=slider] [role=slider]' } },
  'slider-bubble': { rapid: async (p) => { const c = await L.center(p, '[data-ds=slider] [role=slider]'); await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.mouse.move(c.x + 30, c.y); await sleep(30); await p.mouse.move(c.x + 60, c.y); await p.mouse.up(); await sleep(30); await p.mouse.down(); await p.mouse.move(c.x + 10, c.y); await p.mouse.up(); }, stateSel: '[data-ds=slider] [role=slider]', extra: () => document.querySelectorAll('[data-ds=slider] [data-part=bubble], [data-ds=slider] [data-bubble]').length },
  'slider-nudge': { rapid: async (p) => { await p.focus('[role=slider]'); await p.keyboard.press('ArrowRight'); await sleep(30); await p.keyboard.press('ArrowRight'); await sleep(30); await p.keyboard.press('End'); }, stateSel: '[role=slider]' },
  'picker-chevron-turn': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await p.keyboard.press('Escape'); await sleep(30); await clickAt(p, T); }, interrupt: async (p) => { await clickAt(p, T); await sleep(60); await p.keyboard.press('Escape'); }, esc: true },
  'menu-rows': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await p.keyboard.press('Escape'); await sleep(30); await clickAt(p, T); }, interrupt: async (p) => { await clickAt(p, T); await sleep(60); await p.keyboard.press('Escape'); }, esc: true, kb: true },
  'picker-value-roll': { rapid: async (p) => { await clickAt(p, T); await sleep(300); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await sleep(30); await p.keyboard.press('Enter'); await sleep(200); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); }, extra: () => document.querySelector('[data-interaction-trigger] [data-part=value]').innerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '').slice(0, 300) },
  'row-glide': { rapid: async (p) => { await p.focus('[role=option][tabindex="0"]'); for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowDown'); await sleep(30); } await p.keyboard.press('ArrowUp'); }, stateSel: '[role=listbox]', extra: () => document.activeElement && document.activeElement.textContent },
  'collection-flip': {
    rapid: async (p) => { for (let i = 0; i < 3; i++) { await L.clickF(p, T); await sleep(30); await L.clickF(p, "button:has-text('Remove the first')"); await sleep(30); } await L.clickF(p, "button:has-text('Reverse the order')"); await sleep(30); await L.clickF(p, T); },
    extra: () => ({ rows: [...document.querySelectorAll('[data-ds=list] [data-part=item]')].map((r) => r.textContent), inertClones: document.querySelectorAll('[inert], [data-flip-clone], [data-ghost]').length, listChildren: document.querySelector('[data-ds=list]').children.length }),
  },
  'chip-check-pop': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await clickAt(p, T); await sleep(30); await clickAt(p, T); } },
  'filter-count-roll': { rapid: async (p) => { for (let i = 0; i < 3; i++) { await L.clickF(p, `[data-ds=filter-bar] [data-ds=chip] >> nth=${i}`); await sleep(30); } await L.clickF(p, '[data-ds=filter-bar] [data-ds=chip] >> nth=0'); }, stateSel: '[data-ds=filter-bar]', extra: () => ({ real: document.querySelector('[data-part=count] [data-visually-hidden]').textContent, shown: document.querySelector('[data-part=count] [aria-hidden=true]').textContent, digitNodes: document.querySelectorAll('[data-part=count] [data-digit] > *').length }) },
  'list-stagger': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await clickAt(p, T); }, extra: () => document.querySelectorAll('[data-ds=list] [data-part=item]').length },
  'menu-origin': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await p.keyboard.press('Escape'); await sleep(30); await clickAt(p, T); }, interrupt: async (p) => { await clickAt(p, T); await sleep(60); await p.keyboard.press('Escape'); }, esc: true, kb: true, hitDuring: true },
  'menu-row-slide': { prep: async (p) => { await L.clickF(p, T); await sleep(500); await L.settle(p); }, rapid: async (p) => { for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowDown'); await sleep(30); } }, stateSel: "[data-ds='dropdown-menu']", extra: () => { const h = document.querySelector('[data-highlighted]'); return { highlighted: h && h.textContent, active: document.activeElement.textContent }; } },
  'menu-submenu-nudge': { prep: async (p) => { await L.clickF(p, T); await sleep(500); await L.settle(p); }, rapid: async (p) => { await p.keyboard.press('ArrowDown'); await sleep(30); await p.keyboard.press('ArrowUp'); await sleep(30); await p.keyboard.press('ArrowDown'); await sleep(30); await p.keyboard.press('ArrowUp'); }, stateSel: "[data-part='sub-trigger']", extra: () => { const c = document.querySelector("[data-part='sub-trigger'] [data-part='end']"); return c ? getComputedStyle(c).transform : null; } },
  'popover-spring': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await clickAt(p, T); await sleep(30); await clickAt(p, T); }, interrupt: async (p) => { await clickAt(p, T); await sleep(60); await p.keyboard.press('Escape'); }, esc: true, kb: true, hitDuring: true },
  'tooltip-rise': { rapid: async (p) => { await L.hover(p, T); await sleep(30); await p.mouse.move(5, 5); await sleep(30); await L.hover(p, T); }, interrupt: async (p) => { await L.hover(p, T); await sleep(900); await p.mouse.move(5, 5); }, kbFocus: true },
  'tooltip-follow': { prep: async (p) => { await L.hover(p, T); await sleep(1300); }, rapid: async (p) => { for (let i = 1; i < 4; i++) { await L.hover(p, `[data-ds='icon-button'] >> nth=${i}`); await sleep(30); } }, stateSel: "[aria-label='Delete layer']", extra: () => [...document.querySelectorAll('[role=tooltip]')].map((t) => t.textContent) },
  'dialog-spring': { trig: "[data-interaction-trigger='dialog']", rapid: async (p) => { await clickAt(p, "[data-interaction-trigger='dialog']"); await sleep(30); await p.keyboard.press('Escape'); await sleep(30); await clickAt(p, "[data-interaction-trigger='dialog']"); }, interrupt: async (p) => { await clickAt(p, "[data-interaction-trigger='dialog']"); await sleep(60); await p.keyboard.press('Escape'); }, esc: true, kb: true, stateSel: "[data-interaction-trigger='dialog']" },
  'sheet-spring': { trig: "[data-interaction-trigger='sheet']", rapid: async (p) => { await clickAt(p, "[data-interaction-trigger='sheet']"); await sleep(30); await p.keyboard.press('Escape'); await sleep(30); await clickAt(p, "[data-interaction-trigger='sheet']"); }, interrupt: async (p) => { await clickAt(p, "[data-interaction-trigger='sheet']"); await sleep(60); await p.keyboard.press('Escape'); }, esc: true, kb: true, stateSel: "[data-interaction-trigger='sheet']" },
  'command-palette-open': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await p.keyboard.press('Escape'); await sleep(30); await clickAt(p, T); }, interrupt: async (p) => { await clickAt(p, T); await sleep(60); await p.keyboard.press('Escape'); }, esc: true, kb: true },
  'command-palette-results': { prep: async (p) => { await L.clickF(p, T); await sleep(500); }, rapid: async (p) => { await p.keyboard.type('b', { delay: 0 }); await sleep(30); await p.keyboard.type('o', { delay: 0 }); await sleep(30); await p.keyboard.press('Backspace'); await sleep(30); await p.keyboard.type('xq', { delay: 30 }); await p.keyboard.press('Backspace'); await p.keyboard.press('Backspace'); }, stateSel: "[data-ds='command-palette'] input", extra: () => ({ value: document.querySelector("[data-ds='command-palette'] input").value, rows: document.querySelectorAll("[data-ds='command-palette'] [role=option]").length }) },
  'command-palette-row-slide': { prep: async (p) => { await L.clickF(p, T); await sleep(500); await L.settle(p); }, rapid: async (p) => { for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowDown'); await sleep(30); } }, stateSel: "[data-ds='command-palette'] input", extra: () => { const i = document.querySelector("[data-ds='command-palette'] input"); const a = document.getElementById(i.getAttribute('aria-activedescendant')); return a && a.textContent; } },
  'lightbox-zoom': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await p.keyboard.press('Escape'); await sleep(30); await clickAt(p, T); }, interrupt: async (p) => { await clickAt(p, T); await sleep(60); await p.keyboard.press('Escape'); }, esc: true, kb: true },
  'tour-spotlight': { rapid: async (p) => { await clickAt(p, T); await sleep(300); for (let i = 0; i < 2; i++) { await L.clickF(p, "[data-ds='tour'] button:has-text('Next')"); await sleep(30); } await L.clickF(p, "[data-ds='tour'] button:has-text('Previous')"); }, esc: true, kb: true, extra: () => { const t = document.querySelector("[data-ds='tour']"); return t ? t.textContent.slice(0, 80) : null; } },
  'window-settle': { rapid: async (p) => { await clickAt(p, T); await sleep(30); await clickAt(p, T); await sleep(30); await clickAt(p, T); }, interrupt: async (p) => { await clickAt(p, T); await sleep(60); await clickAt(p, T); }, extra: () => ({ windows: document.querySelectorAll("[data-ds='window']").length, active: document.activeElement.tagName + ' ' + (document.activeElement.textContent || '').slice(0, 30) }) },
  'window-lights': { rapid: async (p) => { await L.hover(p, "[data-ds='window-controls'] [data-part='zoom']"); await sleep(30); await p.mouse.move(5, 5); await sleep(30); await L.hover(p, "[data-ds='window-controls'] [data-part='zoom']"); }, stateSel: "[data-ds='window-controls']", held: { sel: "[data-ds='window-controls'] [data-part='zoom']", part: "[data-ds='window-controls'] [data-part='zoom'] > *" }, hit: { sel: "[data-ds='window-controls'] [data-part='zoom']" } },
};

async function pausedProbe(p, fn) {
  // Pause and seek every animation to t, then evaluate fn(t) in the page.
  return p.evaluate(`(${fn})()`);
}

(async () => {
  const outDir = process.argv[2];
  const only = process.argv.slice(3);
  const style = process.env.STYLE || 'neutral';
  const dir = process.env.DIR || 'ltr';
  const scheme = style === 'neutral' ? 'light' : 'dark';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const ids = only.length ? only : Object.keys(specs);
  for (const id of ids) {
    const s = specs[id];
    const reg = interactions.find((i) => i.id === id);
    const stateSel = s.stateSel || s.trig || T;
    const out = { id, style, dir, scheme };
    const fresh = async (motion = 'full') => {
      const ctx = await L.newCtx(browser, { motion });
      const page = await ctx.newPage();
      page.__dir = dir;
      await L.goto(page, { id, style, scheme, dir, motion });
      if (s.prep) { await s.prep(page); await L.settle(page); }
      return { ctx, page };
    };
    const guard = async (name, fn) => { try { out[name] = await fn(); } catch (e) { out[name] = { error: String(e.message || e).slice(0, 300) }; } };

    await guard('rapid', async () => { const { ctx, page } = await fresh(); await L.run(page, 'noop', async () => {}, { ms: 50, stateSel }).catch(() => {}); await page.evaluate(() => window.__probe.start()); await s.rapid(page); const r = await after(page, stateSel, s.extra); await ctx.close(); return r; });
    if (s.interrupt) await guard('interrupt', async () => { const { ctx, page } = await fresh(); await L.run(page, 'noop', async () => {}, { ms: 50, stateSel }).catch(() => {}); await page.evaluate(() => window.__probe.start()); await s.interrupt(page); const r = await after(page, stateSel, s.extra); await ctx.close(); return r; });
    if (s.esc) await guard('escapeEarly', async () => {
      const { ctx, page } = await fresh();
      const trig = s.trig || T;
      await clickAt(page, trig); await sleep(40); await page.keyboard.press('Escape');
      await sleep(700);
      const r = await snapshot(page, stateSel); await ctx.close(); return r;
    });
    if (s.kb || s.kbFocus) await guard('keyboardOpen', async () => {
      const { ctx, page } = await fresh();
      const trig = s.trig || T;
      await page.focus(trig);
      if (s.kbFocus) { await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); }
      else await page.keyboard.press('Enter');
      // Freeze all motion at its start, then read the focused element at 0, 30, 60, 100, 150ms of the motion.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
      const first = await page.evaluate(() => {
        const anims = document.getAnimations(); anims.forEach((a) => a.pause());
        const ae = document.activeElement;
        const eff = (el) => { let o = 1; for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return Math.round(o * 100) / 100; };
        const ring = (el) => { const cs = getComputedStyle(el); return { outline: cs.outlineStyle !== 'none' ? cs.outlineWidth + ' ' + cs.outlineStyle : 'none', shadow: cs.boxShadow !== 'none', before: getComputedStyle(el, '::before').opacity, after: getComputedStyle(el, '::after').opacity, fv: el.matches(':focus-visible') }; };
        const out = [];
        for (const t of [0, 30, 60, 100, 150, 250]) { anims.forEach((a) => { try { a.currentTime = t; } catch { /* */ } }); out.push({ t, opacity: eff(ae), ring: ring(ae) }); }
        anims.forEach((a) => { try { a.play(); } catch { /* */ } });
        return { active: ae.tagName + (ae.getAttribute('role') ? '[' + ae.getAttribute('role') + ']' : '') + (ae.getAttribute('data-part') ? '[' + ae.getAttribute('data-part') + ']' : '') + ' ' + (ae.textContent || '').trim().slice(0, 30), frames: out };
      });
      // Then Tab once inside, right away, and read the ring again under a frozen fade.
      let tab = null;
      if (!s.kbFocus) {
        await page.evaluate(() => document.getAnimations().forEach((a) => { a.pause(); try { a.currentTime = 20; } catch { /* */ } }));
        await page.keyboard.press('Tab');
        tab = await page.evaluate(() => {
          const ae = document.activeElement; const cs = getComputedStyle(ae);
          let o = 1; for (let n = ae; n && n !== document.documentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
          return { active: ae.tagName + ' ' + (ae.textContent || '').trim().slice(0, 30), outline: cs.outlineStyle !== 'none' ? cs.outlineWidth : 'none', shadow: cs.boxShadow !== 'none', fv: ae.matches(':focus-visible'), opacity: Math.round(o * 100) / 100 };
        });
      }
      await ctx.close();
      return { first, tab };
    });
    if (s.hitDuring || s.hit) await guard('hitTest', async () => {
      const { ctx, page } = await fresh();
      const sel = (s.hit && s.hit.sel) || s.trig || T;
      const c = await L.center(page, sel);
      if (s.hit && s.hit.act) { await page.mouse.move(c.x, c.y); await page.mouse.down(); }
      else if (s.hit) { await page.mouse.move(c.x, c.y); await page.mouse.down(); }
      else await clickAt(page, sel);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
      const r = await page.evaluate(({ x, y, sel }) => {
        const anims = document.getAnimations(); anims.forEach((a) => a.pause());
        const trg = document.querySelector(sel);
        const out = [];
        for (const t of [0, 40, 80, 120, 200]) { anims.forEach((a) => { try { a.currentTime = t; } catch { /* */ } }); const h = document.elementFromPoint(x, y); out.push({ t, onControl: !!h && (trg.contains(h) || h.contains(trg)), hit: h ? h.tagName + (h.getAttribute('data-part') ? '[' + h.getAttribute('data-part') + ']' : '') : null }); }
        anims.forEach((a) => { try { a.play(); } catch { /* */ } });
        return out;
      }, { x: c.x, y: c.y, sel });
      await page.mouse.up();
      await ctx.close();
      return r;
    });
    if (s.held) await guard('heldUnderAttr', async () => {
      const res = {};
      for (const motion of ['full', 'attr']) {
        const { ctx, page } = await fresh(motion);
        const c = await L.center(page, s.held.sel);
        await page.mouse.move(c.x, c.y); await page.mouse.down(); await sleep(500);
        res[motion] = await page.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 3).map((e) => getComputedStyle(e).transform), s.held.part);
        await page.mouse.up(); await sleep(700);
        res[motion + 'AfterRelease'] = await page.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 3).map((e) => getComputedStyle(e).transform), s.held.part);
        await ctx.close();
      }
      return res;
    });
    // `off` rows of a CSS interaction, injected under @layer ds.recipes.
    if (reg && reg.drive === 'css' && reg.off) await guard('off', async () => {
      const { ctx, page } = await fresh();
      const css = '@layer ds.recipes {\n' + Object.entries(reg.off).map(([sel, decls]) => `${sel} { ${Object.entries(decls).map(([k, v]) => `${k}: ${v};`).join(' ')} }`).join('\n') + '\n}';
      await page.addStyleTag({ content: css });
      await sleep(100);
      const scen = L.scenarios[id];
      const runs = [];
      for (const r of scen.runs.slice(0, 2)) {
        if (r.prep) { await r.prep(page); await L.settle(page); }
        const res = await L.run(page, r.name, r.act, r);
        runs.push({ run: r.name, anims: res.anims.map((a) => ({ target: a.target, name: a.name, dur: a.dur, kf: a.kf })), badProps: res.badProps });
      }
      await ctx.close();
      return { css, runs };
    });
    fs.writeFileSync(path.join(outDir, `${id}.${style}.${dir}.checks.json`), JSON.stringify(out, null, 1));
    console.log(id, style, dir, Object.keys(out).filter((k) => out[k] && out[k].error).map((k) => k + ' ERR').join(' ') || 'ok');
  }
  await browser.close();
})();
