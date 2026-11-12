// Keyboard trace of the list family in one gallery. node keys.mjs <base> <scenario> [query]
// Each step prints: the key, the focused element, aria-activedescendant target, expanded, the
// highlighted option, the input value or the trigger text, and how many popup layers are open.
import { chromium } from '@playwright/test';
const [base, scenario, query = 'style=studio'] = process.argv.slice(2);

const S = {
  'list-box': { path: '/c/list-box', target: '[data-demo-case=many] [data-ds=list-box]', start: 'tab-into',
    keys: ['ArrowDown', 'ArrowDown', 'End', 'Home', 'ArrowUp', 'type:k', 'type:m', 'Space', 'Enter', 'Tab', 'Shift+Tab'] },
  'list-box-h': { path: '/c/list-box', target: '[data-ds=list-box][data-orientation=horizontal]', start: 'tab-into',
    keys: ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'End', 'Home', 'ArrowDown'] },
  'list-box-multi': { path: '/c/list-box', target: '[data-ds=list-box][aria-multiselectable]', start: 'tab-into',
    keys: ['Space', 'ArrowDown', 'Space', 'Control+a', 'Control+a', 'Enter'] },
  combobox: { path: '/c/combobox', target: '[data-demo-case=many] input[role=combobox]', start: 'focus',
    keys: ['ArrowDown', 'ArrowDown', 'End', 'Home', 'ArrowUp', 'Escape', 'Escape', 'Alt+ArrowDown', 'type:ri', 'ArrowDown', 'Enter', 'Escape', 'type:x', 'Escape', 'PageDown'] },
  'combobox-grouped': { path: '/c/combobox', target: '[data-demo-case=too-many] input[role=combobox]', start: 'focus',
    keys: ['ArrowDown', 'End', 'Home', 'type:ج', 'ArrowDown', 'Enter', 'Tab'] },
  autocomplete: { path: '/c/autocomplete', target: '[data-demo-case=many] input[role=combobox]', start: 'focus',
    keys: ['ArrowDown', 'ArrowDown', 'End', 'Home', 'Escape', 'type:ro', 'ArrowDown', 'ArrowDown', 'Enter', 'Escape', 'Escape'] },
  select: { path: '/c/select', target: '[data-demo-case=many] button[data-ds=select]', start: 'focus',
    keys: ['Enter', 'ArrowDown', 'ArrowDown', 'End', 'Home', 'ArrowUp', 'type:o', 'Enter', 'Space', 'Escape', 'ArrowDown', 'Tab', 'Shift+Tab', 'type:b', 'type:b'] },
  'multi-select': { path: '/c/multi-select', target: '[data-demo-case=many] [data-part=trigger]', start: 'focus',
    keys: ['Enter', 'ArrowDown', 'Space', 'End', 'Home', 'Enter', 'type:d', 'Escape', 'Space', 'Tab', 'Escape', 'Backspace'] },
  'multi-select-search': { path: '/c/multi-select', target: '[data-demo-case=too-many] [data-part=trigger]', start: 'focus',
    keys: ['ArrowDown', 'type:re', 'ArrowDown', 'Enter', 'Escape'] },
  'tag-field': { path: '/c/tag-field', target: '[data-demo-case=many] input[data-part=control]', start: 'focus',
    keys: ['type:alpha', 'Enter', 'type:beta,', 'Backspace', 'Backspace', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Delete', 'Escape'] },
  'tag-field-suggest': { path: '/c/tag-field', target: 'input[role=combobox][data-part=control]', start: 'focus',
    keys: ['type:d', 'ArrowDown', 'ArrowDown', 'Enter', 'Escape', 'ArrowDown', 'End', 'Home', 'Escape'] },
};

const s = S[scenario];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.emulateMedia({ reducedMotion: 'reduce' });
await p.goto(`${base}${s.path}?${query}`);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(500);
const target = p.locator(s.target).first();
await target.scrollIntoViewIfNeeded();
if (s.start === 'focus') await target.focus();
else {
  // Tab into the list from the element before it
  await target.evaluate((el) => {
    const b = document.createElement('button');
    b.id = 'qa-before';
    b.textContent = 'before';
    el.before(b);
  });
  await p.focus('#qa-before');
  await p.keyboard.press('Tab');
}
await p.waitForTimeout(200);
const snap = () =>
  p.evaluate(() => {
    const a = document.activeElement;
    const ad = a?.getAttribute('aria-activedescendant');
    const adEl = ad ? document.getElementById(ad) : null;
    const t = (el) => (el?.querySelector('[data-part$=label]')?.textContent ?? el?.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 28);
    const layers = document.querySelectorAll('body > [data-menu-layer]').length;
    const hi = [...document.querySelectorAll('[data-highlighted]')].map(t).join('|');
    const owner = a?.closest('[data-ds=combobox],[data-ds=autocomplete],[data-ds=multi-select],[data-ds=tag-field],[data-ds=select],[data-ds=list-box]');
    const sel = owner ? [...owner.querySelectorAll('[aria-selected=true],[data-part=tag]')].map(t).join('|') : '';
    const val = a?.tagName === 'INPUT' ? `value="${a.value}"` : '';
    return `focus=${a?.tagName.toLowerCase()}[${a?.getAttribute('role') ?? ''}/${a?.getAttribute('data-part') ?? ''}] "${t(a)}" ${val} expanded=${a?.getAttribute('aria-expanded')} ad=${adEl ? `"${t(adEl)}"` : ad ? 'MISSING' : '-'} hi=${hi || '-'} layers=${layers} owned=${sel || '-'}`;
  });
console.log(`start      ${await snap()}`);
for (const k of s.keys) {
  if (k.startsWith('type:')) await p.keyboard.type(k.slice(5), { delay: 30 });
  else await p.keyboard.press(k);
  await p.waitForTimeout(250);
  console.log(`${k.padEnd(10)} ${await snap()}`);
}
await b.close();
