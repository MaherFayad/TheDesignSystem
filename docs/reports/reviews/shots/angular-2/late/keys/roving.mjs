// Keyboard walk of every ToggleGroup or SegmentedControl on a demo page.
// For each group: Tab in from the tabbable before it, then a fixed key list;
// after each key, the focused item index and the state of every item.
// Usage: node roving.mjs <base> <kebab> <query>
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, kebab, query] = process.argv.slice(2);
const ds = kebab === 'toggle-group' ? 'toggle-group' : 'segmented-control';
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto(`${base}/c/${kebab}?chrome=0&${query}`);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(600);
const count = await p.locator(`[data-ds=${ds}]`).count();
const out = [];
const snap = (i) => p.evaluate(([ds, i]) => {
  const g = document.querySelectorAll(`[data-ds=${ds}]`)[i];
  const items = [...g.querySelectorAll(':scope > [data-part=item]')];
  const a = document.activeElement;
  const at = items.indexOf(a);
  const st = items.map((el) => (el.getAttribute('aria-checked') ?? el.getAttribute('aria-pressed') ?? '?')[0] + (el.getAttribute('aria-disabled') === 'true' ? 'x' : '') + (el.getAttribute('tabindex') === '0' ? '*' : '')).join(' ');
  return `focus=${at >= 0 ? at : (g.contains(a) ? 'group' : a.tagName + (a.getAttribute('data-part') ? '/' + a.getAttribute('data-part') : ''))} [${st}] value=${g.getAttribute('data-value') ?? ''}`;
}, [ds, i]);
for (let i = 0; i < count; i++) {
  const head = await p.evaluate(([ds, i]) => {
    const g = document.querySelectorAll(`[data-ds=${ds}]`)[i];
    const items = [...g.querySelectorAll(':scope > [data-part=item]')];
    return `group ${i} role=${g.getAttribute('role')} dir=${g.getAttribute('dir')} orient=${g.getAttribute('data-orientation')} name=${g.getAttribute('aria-label') ?? g.getAttribute('aria-labelledby')} items=${items.map((e) => (e.getAttribute('role') ?? 'button') + ':' + (e.textContent.trim() || e.getAttribute('aria-label'))).join('|')}`;
  }, [ds, i]);
  out.push(head);
  // focus the tabbable before the group, then Tab in
  const ok = await p.evaluate(([ds, i]) => {
    const g = document.querySelectorAll(`[data-ds=${ds}]`)[i];
    const all = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter((e) => e.tabIndex >= 0 && !e.disabled && e.getClientRects().length && !g.contains(e));
    const before = all.filter((e) => e.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
    if (before) { before.focus(); return true; }
    document.activeElement?.blur(); return false;
  }, [ds, i]);
  await p.keyboard.press('Tab');
  await p.waitForTimeout(60);
  out.push(`  Tab${ok ? '' : '(from body)'}: ${await snap(i)}`);
  const vertical = (await p.locator(`[data-ds=${ds}]`).nth(i).getAttribute('data-orientation')) === 'vertical';
  const keys = vertical ? ['ArrowDown', 'ArrowDown', 'ArrowUp', 'End', 'ArrowDown', 'Home', 'ArrowUp', 'Space', 'ArrowDown', 'Enter', 'Space', 'ArrowRight'] : ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'End', 'ArrowRight', 'Home', 'ArrowLeft', 'Space', 'ArrowRight', 'Enter', 'Space', 'ArrowDown'];
  for (const k of keys) {
    await p.keyboard.press(k);
    await p.waitForTimeout(60);
    out.push(`  ${k}: ${await snap(i)}`);
  }
  await p.keyboard.press('Shift+Tab');
  await p.waitForTimeout(60);
  out.push(`  Shift+Tab: ${await snap(i)}`);
  await p.keyboard.press('Tab');
  await p.waitForTimeout(60);
  out.push(`  Tab back in: ${await snap(i)}`);
}
console.log(out.join('\n'));
await b.close();
