// Keyboard walks for Stepper, FormWizard, FilterBar and ConsentField, React and Angular side by side.
import { chromium } from '@playwright/test';
const b = await chromium.launch();
const desc = (p) => p.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  const t = (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 36);
  return `${el.tagName.toLowerCase()}${el.getAttribute('role') ? '[' + el.getAttribute('role') + ']' : ''}${el.dataset.part ? '{' + el.dataset.part + '}' : ''}"${t}"`;
});
async function walk(p, caseId, n) {
  const out = [];
  const first = p.locator(`[data-demo-case=${caseId}]`);
  await first.evaluate((el) => { const a = document.createElement('a'); a.href = '#'; a.id = 'qa-start'; a.textContent = 'start'; el.prepend(a); });
  await p.focus('#qa-start');
  for (let i = 0; i < n; i += 1) { await p.keyboard.press('Tab'); out.push(await desc(p)); }
  return out;
}
const results = {};
for (const q of ['style=studio', 'style=desk&dir=rtl&lang=ar']) for (const [fw, base] of Object.entries({ react: 'http://localhost:5301', angular: 'http://localhost:5302' })) {
  const r = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  // Stepper
  await p.goto(`${base}/c/stepper?${q}`); await p.waitForSelector('[data-demo-case]'); await p.waitForTimeout(300);
  r.push('stepper tab(variants): ' + (await walk(p, 'variants', 5)).join(' > '));
  const s = p.locator('[data-demo-case=variants] [data-ds=stepper]:has(button[data-part=title])').first();
  await s.locator('button[data-part=title]').first().focus();
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  r.push('stepper Enter on first action: current=' + await s.evaluate((el) => [...el.querySelectorAll('li')].findIndex((li) => li.getAttribute('aria-current') === 'step')) + ' focus=' + await desc(p));
  const btn = s.locator('button[data-part=title]').first();
  if (await btn.count()) { await btn.focus(); await p.keyboard.press('Space'); await p.waitForTimeout(100); }
  r.push('stepper Space on first action: current=' + await s.evaluate((el) => [...el.querySelectorAll('li')].findIndex((li) => li.getAttribute('aria-current') === 'step')) + ' focus=' + await desc(p));
  await p.keyboard.press('ArrowRight'); r.push('stepper ArrowRight: focus=' + await desc(p));
  // FormWizard
  await p.goto(`${base}/c/form-wizard?${q}`); await p.waitForSelector('[data-demo-case]'); await p.waitForTimeout(300);
  const w = p.locator('[data-demo-case=many] [data-ds=form-wizard]').first();
  r.push('wizard tab(many): ' + (await walk(p, 'many', 6)).join(' > '));
  await w.locator('[data-part=panel] button[type=submit]').click(); await p.waitForTimeout(400);
  r.push('wizard next on empty step: focus=' + await desc(p) + ' status="' + await w.locator(':scope > [data-part=status]').textContent() + '" invalid steps=' + await w.evaluate((el) => [...el.querySelectorAll('[data-ds=stepper] li[data-invalid]')].length) + ' describedby=' + await p.evaluate(() => { const el = document.activeElement; return (el.getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent?.trim()).join('|'); }));
  // fill visible required inputs
  for (const inp of await w.locator('[data-part=body]:not([hidden]) input:not([type=hidden]):not([aria-hidden=true])').all()) {
    const type = await inp.getAttribute('type');
    await inp.fill(type === 'email' ? 'sara@example.com' : type === 'tel' ? '0500000000' : 'Sara');
  }
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  r.push('wizard Enter after fill: focus=' + await desc(p) + ' status="' + await w.locator(':scope > [data-part=status]').textContent() + '" current=' + await w.evaluate((el) => [...el.querySelectorAll('[data-ds=stepper] li')].findIndex((li) => li.getAttribute('aria-current') === 'step')));
  const back = w.locator('[data-part=back]');
  if (await back.count()) { await back.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300); }
  r.push('wizard Back: focus=' + await desc(p) + ' status="' + await w.locator(':scope > [data-part=status]').textContent() + '" kept value=' + await w.locator('[data-part=body] input').first().inputValue());
  // FilterBar
  await p.goto(`${base}/c/filter-bar?${q}`); await p.waitForSelector('[data-demo-case]'); await p.waitForTimeout(300);
  const f = p.locator('[data-demo-case=variants] [data-ds=filter-bar]').first();
  r.push('filterbar tab(variants): ' + (await walk(p, 'variants', 7)).join(' > '));
  const chip = f.locator('[data-part=filters] [data-ds=chip]').first();
  await chip.focus(); await p.keyboard.press('Space'); await p.waitForTimeout(100);
  r.push('chip Space: pressed=' + await chip.getAttribute('aria-pressed') + ' count="' + (await f.locator('[data-part=count]').textContent().catch(() => '')) + '"');
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  r.push('chip Enter: pressed=' + await chip.getAttribute('aria-pressed'));
  await p.keyboard.press('Space'); await p.waitForTimeout(100);
  const more = f.locator('[data-part=more]');
  if (await more.count()) {
    await more.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    r.push('more Enter: focus=' + await desc(p));
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('Space'); await p.waitForTimeout(200);
    r.push('more Space on item: focus=' + await desc(p) + ' checked=' + await p.evaluate(() => document.activeElement?.getAttribute('aria-checked')));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    r.push('more Escape: focus=' + await desc(p) + ' label="' + (await more.textContent()).trim() + '"');
  }
  const clear = f.locator('[data-part=clear]');
  if (await clear.count()) { await clear.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(200); r.push('clear all Enter: focus=' + await desc(p) + ' active=' + await f.getAttribute('data-active') + ' clear shown=' + await clear.count()); }
  else r.push('clear all: not shown');
  // ConsentField
  await p.goto(`${base}/c/consent-field?${q}`); await p.waitForSelector('[data-demo-case]'); await p.waitForTimeout(300);
  const c = p.locator('[data-demo-case=variants] [data-ds=consent-field]').first();
  r.push('consent tab(variants): ' + (await walk(p, 'variants', 4)).join(' > '));
  await c.locator('[role=checkbox], [role=switch]').first().focus(); await p.keyboard.press('Space'); await p.waitForTimeout(100);
  r.push('consent Space: ' + await c.getAttribute('data-state'));
  await c.locator('[data-part=purpose]').click(); await p.waitForTimeout(100);
  r.push('consent purpose click: ' + await c.getAttribute('data-state') + ' focus=' + await desc(p));
  results[`${fw} ${q}`] = r;
  await p.close();
}
for (const q of ['style=studio', 'style=desk&dir=rtl&lang=ar']) {
  const a = results[`react ${q}`], g = results[`angular ${q}`];
  console.log(`\n## ${q}`);
  a.forEach((line, i) => console.log(line === g[i] ? `same    ${line}` : `REACT   ${line}\nANGULAR ${g[i]}`));
}
await b.close();
