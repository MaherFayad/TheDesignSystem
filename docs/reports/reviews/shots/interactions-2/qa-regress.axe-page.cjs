// ds-qa regression reviewer, order 1.22. Axe and target size (WCAG 2.5.8) on
// the full /interactions page, at rest (after finite animations end) and with
// every animation frozen at 50% after "replay all".
//   node qa-regress.axe-page.cjs [base]
// Writes axe.interactions-page.json and target.interactions-page.json here.
const { chromium } = require('@playwright/test');
const { default: AxeBuilder } = require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');

const base = process.argv[2] || 'http://127.0.0.1:5190';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const SETUPS = [
  { style: 'studio', scheme: 'dark', dir: 'ltr' },
  { style: 'desk', scheme: 'dark', dir: 'ltr' },
  { style: 'neutral', scheme: 'light', dir: 'ltr' },
  { style: 'neutral', scheme: 'light', dir: 'rtl' },
];

const crit = (tags) => tags.filter((t) => /^wcag\d{3,}$/.test(t)).map((t) => { const d = t.slice(4); return d.length === 3 ? d.split('').join('.') : `${d[0]}.${d[1]}.${d.slice(2)}`; });
const slim = (vs) => vs.map((v) => ({ rule: v.id, impact: v.impact, wcag: crit(v.tags), help: v.help, nodes: v.nodes.slice(0, 12).map((n) => ({ target: n.target.map(String).join(' '), html: n.html.replace(/\s+/g, ' ').slice(0, 160), summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 200) })), count: v.nodes.length }));

function targets() {
  const MIN = 24;
  const SEL = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="switch"], [role="checkbox"], [role="radio"], [role="slider"], [role="tab"], [role="option"], [role="menuitem"], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
  const out = [];
  let n = 0;
  for (const el of document.querySelectorAll(SEL)) {
    if (el.matches(':disabled')) continue;
    if (el.closest('[inert], [hidden]')) continue;
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility({ visibilityProperty: true, opacityProperty: false })) continue;
    const r = el.getBoundingClientRect();
    let { left, top, right, bottom } = r;
    for (const p of ['::before', '::after']) {
      const s = getComputedStyle(el, p);
      if (s.content === 'none' || s.content === 'normal' || s.position !== 'absolute' || s.pointerEvents === 'none') continue;
      const w = parseFloat(s.width), h = parseFloat(s.height), x = parseFloat(s.left), y = parseFloat(s.top);
      if ([w, h, x, y].some(Number.isNaN)) continue;
      left = Math.min(left, r.left + x); top = Math.min(top, r.top + y); right = Math.max(right, r.left + x + w); bottom = Math.max(bottom, r.top + y + h);
    }
    const w = right - left, h = bottom - top;
    if (w <= 2 || h <= 2) continue; // visually hidden input, its label is the target
    n += 1;
    if (w >= MIN - 0.01 && h >= MIN - 0.01) continue;
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') {
      let b = el.parentElement;
      while (b && getComputedStyle(b).display.startsWith('inline')) b = b.parentElement;
      if ((b?.textContent ?? '').trim().length > (el.textContent ?? '').trim().length + 10) continue;
    }
    const stage = el.closest('[data-interaction-stage]');
    const card = el.closest('[id^="i-"], article, section');
    out.push({
      what: `${el.tagName.toLowerCase()}${el.getAttribute('data-ds') ? `[data-ds=${el.getAttribute('data-ds')}]` : ''}${el.getAttribute('data-part') ? `[data-part=${el.getAttribute('data-part')}]` : ''} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}"`,
      stage: stage?.getAttribute('data-interaction-stage') || card?.id || null,
      w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10,
      transform: getComputedStyle(el).transform,
    });
  }
  return { measured: n, undersized: out };
}

async function freezeMid(page) {
  return page.evaluate(() => {
    let k = 0;
    for (const a of document.getAnimations()) {
      const t = a.effect && a.effect.getComputedTiming();
      if (!t) continue;
      const one = (Number(t.duration) || 0);
      const delay = Number(a.effect.getTiming().delay) || 0;
      const total = Number.isFinite(t.endTime) ? t.endTime : delay + one;
      a.pause();
      a.currentTime = Number.isFinite(t.endTime) ? total / 2 : delay + one / 2;
      k += 1;
    }
    return k;
  });
}

(async () => {
  const browser = await chromium.launch();
  const axeOut = [];
  const tgtOut = [];
  for (const s of SETUPS) {
    for (const mode of ['rest', 'mid']) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      const rtl = s.dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
      const url = `${base}/interactions?style=${s.style}&scheme=${s.scheme}&chrome=0${rtl}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForSelector('[data-interaction-stage]', { timeout: 60000 });
      await page.waitForTimeout(1500);
      let frozen = 0;
      if (mode === 'rest') {
        // Let finite animations end; infinite ones (spinners) stay.
        await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || !Number.isFinite(a.effect.getComputedTiming().endTime)), null, { timeout: 15000 }).catch(() => {});
      } else {
        await page.click('[data-interactions-replay-all]');
        await page.waitForTimeout(16);
        frozen = await freezeMid(page);
      }
      const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const t = await page.evaluate(targets);
      axeOut.push({ ...s, mode, frozenAnimations: frozen, violations: slim(res.violations), passes: res.passes.length });
      tgtOut.push({ ...s, mode, frozenAnimations: frozen, ...t });
      console.log(s.style, s.scheme, s.dir, mode, 'frozen', frozen, 'axe', res.violations.map((v) => `${v.id}x${v.nodes.length}`).join(',') || 'clean', 'targets measured', t.measured, 'undersized', t.undersized.length);
      if (mode === 'mid' && (res.violations.length || t.undersized.length)) await page.screenshot({ path: path.join(__dirname, `target.interactions-page.${s.style}-${s.scheme}-${s.dir}.mid.png`), fullPage: false });
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'axe.interactions-page.json'), JSON.stringify(axeOut, null, 1));
  fs.writeFileSync(path.join(__dirname, 'target.interactions-page.json'), JSON.stringify(tgtOut, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
