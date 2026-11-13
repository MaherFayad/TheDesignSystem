// ds-qa regression reviewer, order 1.22. Axe (wcag2a, wcag2aa, wcag21aa,
// wcag22aa) on each touched component's own gallery page /c/<slug>, chrome=0,
// in Neutral light and Studio dark, English LTR and Arabic RTL, after finite
// animations end. Also target size (24 by 24, no spacing exception) inside
// the demo cases.
//   node qa-regress.axe-components.cjs <comma list of names> [base]
// Writes axe.components.json here.
const { chromium } = require('@playwright/test');
const { default: AxeBuilder } = require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');

const names = (process.argv[2] || '').split(',').filter(Boolean);
const base = process.argv[3] || 'http://127.0.0.1:5190';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const SETUPS = [
  { style: 'neutral', scheme: 'light', dir: 'ltr' },
  { style: 'neutral', scheme: 'light', dir: 'rtl' },
  { style: 'studio', scheme: 'dark', dir: 'ltr' },
  { style: 'studio', scheme: 'dark', dir: 'rtl' },
];
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').toLowerCase();
const crit = (tags) => tags.filter((t) => /^wcag\d{3,}$/.test(t)).map((t) => { const d = t.slice(4); return d.length === 3 ? d.split('').join('.') : `${d[0]}.${d[1]}.${d.slice(2)}`; });

function smallTargets() {
  const SEL = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])';
  const out = [];
  for (const el of document.querySelectorAll(`[data-demo-case] :is(${SEL})`)) {
    if (el.matches(':disabled') || el.closest('[inert], [hidden]')) continue;
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility({ visibilityProperty: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 2 || r.height <= 2) continue;
    if (r.width >= 23.99 && r.height >= 23.99) continue;
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue;
    out.push(`${el.tagName.toLowerCase()}[${el.getAttribute('data-ds') || ''}/${el.getAttribute('data-part') || ''}] ${Math.round(r.width)}x${Math.round(r.height)} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)}"`);
  }
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const out = {};
  const file = path.join(__dirname, 'axe.components.json');
  if (fs.existsSync(file)) Object.assign(out, JSON.parse(fs.readFileSync(file, 'utf8')));
  for (const name of names) {
    out[name] = [];
    for (const s of SETUPS) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      const rtl = s.dir === 'rtl' ? '&dir=rtl&lang=ar' : '';
      try {
        await page.goto(`${base}/c/${kebab(name)}?style=${s.style}&scheme=${s.scheme}&chrome=0${rtl}`, { waitUntil: 'networkidle', timeout: 90000 });
        await page.waitForSelector('[data-demo-case]', { timeout: 30000 });
        await page.waitForTimeout(600);
        await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || !Number.isFinite(a.effect.getComputedTiming().endTime)), null, { timeout: 8000 }).catch(() => {});
        const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const small = await page.evaluate(smallTargets);
        out[name].push({ ...s, violations: res.violations.map((v) => ({ rule: v.id, impact: v.impact, wcag: crit(v.tags), nodes: v.nodes.slice(0, 6).map((n) => `${n.target.join(' ')} :: ${n.html.replace(/\s+/g, ' ').slice(0, 140)}`), count: v.nodes.length })), small });
        console.log(name, s.style, s.dir, res.violations.map((v) => `${v.id}x${v.nodes.length}`).join(',') || 'clean', small.length ? `small ${small.length}` : '');
      } catch (e) {
        out[name].push({ ...s, error: String(e.message || e).slice(0, 200) });
        console.log(name, s.style, s.dir, 'ERROR', String(e.message || e).slice(0, 120));
      }
      await ctx.close();
    }
    fs.writeFileSync(file, JSON.stringify(out, null, 0));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
