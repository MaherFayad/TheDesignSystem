// ds-qa review of order 1.22, navigation and feedback families (35 ids).
// Shared helpers and the per id configuration for qa-navigation-feedback.run.cjs.
// Read only against the app: it opens the gallery, triggers, samples and seeks.
const BASE = 'http://127.0.0.1:5190';
const ALLOWED = new Set(['transform', 'opacity', 'translate', 'scale', 'rotate']);

const click = (sel = '[data-interaction-trigger]') => async (page) => page.click(sel, { timeout: 15000 });
const inPageClick = (sel = '[data-interaction-trigger]') => async (page) => page.evaluate((s) => document.querySelector(s).click(), sel);
const hoverSeq = (sels) => async (page) => {
  for (const s of sels) {
    const box = await page.locator(s).first().boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 2 });
  }
};

// Per id: act (the trigger), rapid (two triggers 30ms apart, from inside the page),
// reverse (selector of the control that undoes it, for the interrupted run),
// ms (sampling window), loop (has a loop, sample longer), pre (setup before the trigger),
// tenFast (ten changes 30ms apart, then a check of the shown number).
const ids = {
  // ---------------------------------------------------------------- navigation
  'tab-slide': { family: 'navigation', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: '[data-interaction-trigger]' },
  'nav-current-slide': { family: 'navigation', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: '[data-interaction-trigger]' },
  'nav-hover-follow': {
    family: 'navigation',
    pre: hoverSeq(["[data-ds='breadcrumbs'] a >> nth=0"]),
    act: hoverSeq(["[data-ds='breadcrumbs'] a >> nth=1"]),
    actRapid: async (page) => {
      await hoverSeq(["[data-ds='sidebar'] a >> nth=0"])(page);
      await page.waitForTimeout(300);
      for (const n of [1, 2, 3, 2]) { await hoverSeq([`[data-ds='sidebar'] a >> nth=${n}`])(page); await page.waitForTimeout(30); }
    },
    hover: true,
  },
  'pagination-roll': {
    family: 'navigation', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: "[data-ds='pagination'] [data-part='previous']",
    tenFastSel: "[data-ds='pagination'] >> nth=0 >> [data-part='next']",
    check: `(() => { const out = []; for (const nav of document.querySelectorAll("[data-ds='pagination']")) { const cur = nav.querySelector('[aria-current=page]'); const lab = cur && cur.getAttribute('aria-label'); const shown = cur && [...cur.querySelectorAll('[data-part=label] [aria-hidden=true]')].map((e) => e.textContent).join(''); out.push({ label: lab, shown, slots: [...nav.querySelectorAll('[data-part=page]')].map((b) => b.getAttribute('aria-label').replace('Page ', '') + '=' + b.querySelector('[data-part=label]').textContent.replace(/\\s/g, '')).join(' ') }); } return out; })()`,
  },
  'sidebar-collapse': { family: 'navigation', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: '[data-interaction-trigger]' },
  'stepper-travel': { family: 'navigation', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: 'button:has-text("Back one step")' },
  'toc-travel': { family: 'navigation', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: '[data-interaction-trigger]' },
  'tab-bar-pop': { family: 'navigation', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: '[data-interaction-trigger]' },
  'dock-lift': {
    family: 'navigation',
    act: hoverSeq(["[data-ds='dock'] a >> nth=2"]),
    actRapid: async (page) => { for (const n of [0, 1, 2, 3, 4, 2]) { await hoverSeq([`[data-ds='dock'] a >> nth=${n}`])(page); await page.waitForTimeout(30); } },
    hover: true,
    extraAct: click(),
  },
  'toolbar-press': {
    family: 'navigation',
    act: async (page) => { const b = await page.locator('[data-interaction-trigger]').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(150); await page.mouse.up(); },
    rapidSel: '[data-interaction-trigger]',
    reverseSel: "[data-ds='toolbar'] [role=radio] >> nth=0",
  },
  'language-roll': { family: 'navigation', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: '[data-interaction-trigger]' },
  'skip-link-slide': { family: 'navigation', act: async (page) => { await page.keyboard.press('Tab'); }, keyboard: true, rapidSel: '[data-interaction-trigger]' },

  // ---------------------------------------------------------------- feedback
  'alert-entrance': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', text: true },
  'alert-dismiss': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]' },
  'state-illustration': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', text: true },
  'error-state-details': { family: 'feedback', act: click("[data-part='summary']"), rapidSel: "[data-part='summary']", reverseSel: "[data-part='summary']", trig: "[data-part='summary']" },
  'accordion-reveal': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: '[data-interaction-trigger]', text: true },
  'skeleton-swap': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: '[data-interaction-trigger]', loopAfter: 2 },
  'stat-roll': {
    family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: 'button:has-text("Remove visitors")', tenFastSel: '[data-interaction-trigger]',
    check: `(() => { const v = document.querySelector("[data-ds='stat'] [data-part='value']"); return { label: v.querySelector('[data-visually-hidden]').textContent, shown: [...v.children].filter((c) => c.getAttribute('aria-hidden') === 'true').map((c) => c.textContent).join('|'), roller: v.innerHTML.length }; })()`,
  },
  'toast-enter': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', text: true, toast: true },
  'toast-stack': { family: 'feedback', pre: click(), act: click(), rapidSel: '[data-interaction-trigger]', toast: true },
  'toast-swipe': {
    family: 'feedback', pre: click(), toast: true,
    act: async (page) => {
      const t = page.locator("[data-ds='toast']").first();
      const b = await t.boundingBox();
      const dir = await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.body).direction);
      const sgn = dir === 'rtl' ? -1 : 1;
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2 + sgn * 20, b.y + b.height / 2, { steps: 3 });
      await page.mouse.up();
    },
    rapidSel: '[data-interaction-trigger]',
    // Past the threshold: the toast leaves in the swipe direction.
    extraAct: async (page) => {
      await page.click('[data-interaction-trigger]');
      await page.waitForTimeout(600);
      const t = page.locator("[data-ds='toast']").first();
      const b = await t.boundingBox();
      const dir = await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.body).direction);
      const sgn = dir === 'rtl' ? -1 : 1;
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2 + sgn * 160, b.y + b.height / 2, { steps: 6 });
      await page.mouse.up();
    },
  },
  'notification-change': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: 'button:has-text("Remove the newest")' },
  'progress-spring': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]' },
  'progress-celebrate': { family: 'feedback', pre: async (page) => { await page.click('[data-interaction-trigger]'); await page.waitForTimeout(700); }, act: click(), rapidSel: '[data-interaction-trigger]' },
  'meter-fill': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', longMs: 1200 },
  'avatar-status': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', loop: true },
  'status-pulse': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', loop: true },
  'avatar-group-change': {
    family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: 'button:has-text("Remove a person")', tenFastSel: '[data-interaction-trigger]',
    check: `(() => { const g = document.querySelector("[data-ds='avatar-group']"); return { label: g.getAttribute('aria-label'), text: g.textContent.replace(/\\s+/g, ' ') }; })()`,
  },
  'badge-count': {
    family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: 'button:has-text("Read a message")', tenFastSel: '[data-interaction-trigger]',
    check: `(() => { const b = document.querySelector("[data-ds='badge']"); return { label: b.querySelector('[data-part=label] > span:not([aria-hidden])')?.textContent, shown: [...b.querySelectorAll('[aria-hidden=true]')].map((e) => e.textContent).join('|') }; })()`,
  },
  'card-lift': { family: 'feedback', pre: async (page) => page.mouse.move(5, 5), act: hoverSeq(["[data-ds='card']"]), actRapid: async (page) => { for (const s of ["[data-ds='card']", "[data-ds='tile']", "[data-ds='card']"]) { await hoverSeq([s])(page); await page.waitForTimeout(30); } }, hover: true },
  'spinner-loop': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', loop: true },
  'kbd-press': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', ms: 1000 },
  'handle-grip': {
    family: 'feedback', hover: true,
    act: hoverSeq(['[data-interaction-trigger]']),
    actRapid: async (page) => { const b = await page.locator('[data-interaction-trigger]').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2 + 30, b.y + b.height / 2, { steps: 3 }); await page.waitForTimeout(30); await page.mouse.up(); await page.mouse.move(5, 5); },
  },
  'split-view-pane': { family: 'feedback', act: click(), rapidSel: '[data-interaction-trigger]', reverseSel: '[data-interaction-trigger]' },
};

async function openPage(ctx, { id, style, scheme, dir }) {
  const page = await ctx.newPage();
  const rtl = dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
  await page.goto(`${BASE}/interactions?focus=${id}&style=${style}&scheme=${scheme}&chrome=0${rtl}`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('[data-interaction-stage]', { timeout: 60000 });
  return page;
}

// In page: helpers installed once per page.
async function installHelpers(page) {
  await page.evaluate((allowed) => {
    const ALLOWED = new Set(allowed);
    const describe = (el, pseudo) => {
      if (!el || !el.tagName) return String(el);
      const p = el.getAttribute('data-part') || el.getAttribute('data-ds') || el.getAttribute('role');
      return `${el.tagName.toLowerCase()}${p ? `[${p}]` : ''}${pseudo || ''}`;
    };
    const roots = () => [document.querySelector('[data-interaction-stage]'), ...document.querySelectorAll("[data-ds='toast-viewport'], [data-ds='toaster'], ol[data-part='viewport'], [data-radix-toast-viewport]")].filter(Boolean);
    // Token names for easing strings of the active style.
    const tokenOf = (() => {
      const map = new Map();
      const el = document.querySelector('[data-interaction-stage]');
      const cs = getComputedStyle(el);
      const probe = document.createElement('div');
      document.body.appendChild(probe);
      const norm = (v) => { probe.style.transitionTimingFunction = ''; probe.style.transitionTimingFunction = v; return getComputedStyle(probe).transitionTimingFunction.replace(/\s+/g, ''); };
      for (const n of ['default', 'emphasized', 'exit', 'in', 'out', 'reveal', 'standard', 'spring-soft', 'spring-snappy', 'spring-bouncy']) {
        const v = cs.getPropertyValue(`--ds-ease-${n}`).trim();
        if (v && !map.has(norm(v))) map.set(norm(v), `ease.${n}`);
      }
      return (e) => { if (!e) return e; const k = norm(e); return map.get(k) || map.get(String(e).replace(/\s+/g, '')) || (k.length > 40 ? k.slice(0, 30) + '..' : e); };
    })();
    const sigOf = () => {
      const out = [];
      const walk = (el) => {
        if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('inert')) return;
        const attrs = [];
        for (const a of el.attributes) if (/^(aria-(current|selected|checked|pressed|expanded|valuenow|label)|data-state|data-collapsed|data-active|open|hidden|data-hide-labels)$/.test(a.name)) attrs.push(a.name + '=' + a.value);
        let txt = '';
        for (const n of el.childNodes) if (n.nodeType === 3) txt += n.textContent.trim();
        if (attrs.length || txt) out.push(el.tagName + attrs.join(',') + (txt ? ':' + txt : ''));
        for (const c of el.children) walk(c);
      };
      for (const r of roots()) walk(r);
      return out.join(';');
    };
    const effOpacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
    const decompose = (tf) => {
      if (!tf || tf === 'none') return [1, 1, 0, 0];
      const m = tf.match(/matrix(3d)?\(([^)]+)\)/);
      if (!m) return [1, 1, 0, 0];
      const v = m[2].split(',').map(Number);
      if (m[1]) return [Math.hypot(v[0], v[1], v[2]), Math.hypot(v[4], v[5], v[6]), v[12], v[13]];
      return [Math.hypot(v[0], v[1]), Math.hypot(v[2], v[3]), v[4], v[5]];
    };
    const r3 = (n) => Math.round(n * 1000) / 1000;
    const interactives = () => roots().flatMap((r) => [...r.querySelectorAll("a[href], button, [role=tab], [role=radio], [role=separator], summary, [tabindex='0']")]).filter((e) => e.getAttribute('aria-hidden') !== 'true' && e.getClientRects().length);
    // Sweep: every element under the roots whose transition lists a property outside the allowed set with a duration above 0.
    const sweep = () => {
      const bad = [];
      for (const r of roots()) for (const el of [r, ...r.querySelectorAll('*')]) {
        for (const ps of [null, '::before', '::after']) {
          const cs = getComputedStyle(el, ps);
          const props = cs.transitionProperty.split(',').map((s) => s.trim());
          const durs = cs.transitionDuration.split(',').map((s) => parseFloat(s) * (s.includes('ms') ? 1 : 1000));
          props.forEach((p, i) => {
            const d = durs[i % durs.length];
            if (d > 0 && !ALLOWED.has(p)) bad.push(`${describe(el, ps)} ${p} ${d}ms`);
          });
        }
      }
      return [...new Set(bad)].slice(0, 30);
    };
    window.__qa = { describe, roots, tokenOf, sigOf, effOpacity, decompose, r3, interactives, sweep };
  }, [...ALLOWED]);
}

// Real time sampler: animations seen per frame, state signature per frame.
async function sample(page, action, { ms = 1200 } = {}) {
  await page.evaluate((ms) => {
    const q = window.__qa;
    const seen = new Map();
    const frames = [];
    let t0 = null;
    const tick = () => {
      const t = performance.now() - t0;
      for (const a of document.getAnimations()) {
        let rec = seen.get(a);
        const eff = a.effect;
        if (!rec) {
          const ct = eff ? eff.getComputedTiming() : {};
          let props = [];
          try { props = a.transitionProperty ? [a.transitionProperty] : [...new Set(eff.getKeyframes().flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))]; } catch { /* none */ }
          let kf = [];
          try { kf = eff.getKeyframes().map((k) => { const o = {}; for (const [kk, v] of Object.entries(k)) if (v != null && !['computedOffset', 'composite', 'easing'].includes(kk) && !(kk === 'offset' && v === null)) o[kk] = typeof v === 'number' ? Math.round(v * 1000) / 1000 : v; return o; }); } catch { /* none */ }
          rec = {
            kind: a.constructor.name === 'Animation' ? 'waapi' : a.constructor.name === 'CSSTransition' ? 'transition' : 'keyframes',
            name: a.animationName || a.transitionProperty || String(a.id || '').replace(/^ds-/, ''),
            target: q.describe(eff && eff.target, eff && eff.pseudoElement),
            props,
            duration: typeof ct.duration === 'number' ? Math.round(ct.duration) : ct.duration,
            delay: Math.round(ct.delay || 0),
            iterations: ct.iterations,
            easing: q.tokenOf(eff ? eff.getTiming().easing : null),
            kfEasing: (() => { try { const e = eff.getKeyframes().map((k) => k.easing).filter((x) => x && x !== 'linear'); return e.length ? [...new Set(e.map(q.tokenOf))] : undefined; } catch { return undefined; } })(),
            composite: eff && eff.composite !== 'replace' ? eff.composite : undefined,
            fill: eff ? eff.getTiming().fill : undefined,
            kf: kf.slice(0, 5),
            first: Math.round(t),
            last: Math.round(t),
          };
          seen.set(a, rec);
        }
        rec.last = Math.round(t);
        rec.playState = a.playState;
      }
      frames.push({ t: Math.round(t), sig: q.sigOf(), active: q.describe(document.activeElement) });
      if (t < ms) requestAnimationFrame(tick); else window.__sDone = true;
    };
    window.__sStart = () => { t0 = performance.now(); window.__sDone = false; tick(); };
    window.__sRes = () => ({ anims: [...seen.values()], frames });
  }, ms);
  await page.evaluate(() => window.__sStart());
  await action(page);
  await page.waitForFunction(() => window.__sDone === true, null, { timeout: ms + 30000 });
  const raw = await page.evaluate(() => window.__sRes());
  const sig0 = raw.frames[0] && raw.frames[0].sig;
  const changed = raw.frames.find((f) => f.sig !== sig0);
  const anims = raw.anims.filter((a) => !(a.duration === 0 && (a.delay || 0) === 0));
  const zero = raw.anims.length - anims.length;
  const badProps = [...new Set(raw.anims.flatMap((a) => a.props).filter((p) => !ALLOWED.has(p)))];
  const longest = anims.reduce((m, a) => Math.max(m, (a.delay || 0) + (Number.isFinite(a.duration) ? a.duration * (Number.isFinite(a.iterations) ? a.iterations : 1) : 0)), 0);
  return {
    anims,
    zeroDurationAnims: zero,
    badProps,
    longest,
    infinite: anims.filter((a) => a.iterations === Infinity).map((a) => a.target + ' ' + a.name),
    stateAt: changed ? changed.t : null,
    firstMotionAt: anims.length ? Math.min(...anims.map((a) => a.first)) : null,
    focusAfter: raw.frames.length ? raw.frames[raw.frames.length - 1].active : null,
    frames: raw.frames.length,
  };
}

module.exports = { BASE, ALLOWED, ids, openPage, installHelpers, sample, click, inPageClick, hoverSeq };
