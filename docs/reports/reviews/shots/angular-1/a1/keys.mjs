// Keyboard traces: runs the same key sequences on a gallery and prints one line per step.
// node keys.mjs <base> <dirQuery e.g. "style=studio" or "style=desk&dir=rtl&lang=ar">
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, q] = process.argv.slice(2);
const rtl = q.includes('dir=rtl');
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
const out = [];
const log = (s) => out.push(s);

const desc = () =>
  p.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return 'BODY';
    const at = (n) => a.getAttribute(n);
    const fv = a.matches(':focus-visible');
    const cs = getComputedStyle(a);
    const before = getComputedStyle(a, '::before');
    const ring = `${cs.outlineStyle}/${cs.outlineWidth}|${cs.boxShadow === 'none' ? '-' : 'shadow'}|b:${before.opacity}/${before.boxShadow === 'none' ? '-' : 'shadow'}`;
    const layers = document.querySelectorAll('[data-menu-layer]').length;
    const txt = (a.querySelector('[data-part=text],[data-part=label]')?.textContent ?? a.textContent ?? '').trim().slice(0, 28);
    return `${a.tagName.toLowerCase()} ds=${at('data-ds')} part=${at('data-part')} role=${at('role')} pressed=${at('aria-pressed')} exp=${at('aria-expanded')} state=${at('data-state')} dis=${at('aria-disabled')} "${txt}" fv=${fv} ring=${ring} layers=${layers}`;
  });

async function go(kebab) {
  await p.goto(`${base}/c/${kebab}?chrome=0&${q}`);
  await p.waitForSelector('[data-demo-case]', { state: 'attached' });
  await p.waitForTimeout(400);
}
async function press(keys) {
  for (const k of keys) {
    if (k.startsWith('type:')) await p.keyboard.type(k.slice(5));
    else await p.keyboard.press(k);
    await p.waitForTimeout(120);
    log(`  ${k.padEnd(12)} -> ${await desc()}`);
  }
}
async function from(sel, keys, label) {
  log(`[${label}] focus ${sel}`);
  const el = p.locator(sel).first();
  await el.focus();
  log(`  start        -> ${await desc()}`);
  await press(keys);
}
async function tabWalk(n) {
  await p.evaluate(() => (document.activeElement)?.blur());
  await p.mouse.click(2, 2);
  log('[tab walk from top]');
  await press(Array(n).fill('Tab'));
}

const open = rtl ? 'ArrowLeft' : 'ArrowRight';
const close = rtl ? 'ArrowRight' : 'ArrowLeft';

// ToggleButton
await go('toggle-button');
await tabWalk(8);
await from('[data-ds=toggle-button]:not([aria-disabled])', ['Space', 'Enter', 'Space', 'Tab', 'Enter', 'Shift+Tab'], 'toggle');
await from('[data-ds=toggle-button][aria-disabled=true]', ['Space', 'Enter'], 'toggle disabled');

// CloseButton
await go('close-button');
await tabWalk(6);

// CopyButton
await go('copy-button');
await tabWalk(6);
await from('[data-ds=copy-button]:not([aria-disabled])', ['Enter'], 'copy');
log(`  status: ${await p.evaluate(() => document.activeElement?.querySelector('[role=status]')?.textContent)}`);
log(`  clipboard: ${await p.evaluate(() => navigator.clipboard.readText()).catch((e) => 'ERR ' + e.message)}`);

// FAB
await go('floating-action-button');
await tabWalk(6);

// Link
await go('link');
await tabWalk(10);
await from('[data-ds=link][aria-disabled=true]', ['Enter'], 'link disabled');
log(`  url: ${new URL(p.url()).pathname}`);

// ButtonGroup
await go('button-group');
await tabWalk(10);
await from('[data-ds=button-group] > *', ['ArrowRight', 'ArrowDown', 'Tab', 'Tab'], 'group arrows do nothing');

// DropdownMenu
await go('dropdown-menu');
await tabWalk(4);
const trig = '[data-demo-trigger=md]';
await from(trig, ['Enter', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'End', 'ArrowDown', 'Home', 'ArrowUp', 'type:s', 'Tab', 'Escape'], 'menu enter');
await from(trig, ['ArrowUp', 'Escape', 'Space', 'Escape', 'ArrowDown', 'Escape'], 'menu open keys');
// to the sub trigger with typeahead on its text, then into the submenu
await from(trig, ['Enter', 'ArrowDown', 'ArrowDown', open, 'ArrowDown', close, open, 'Escape'], 'submenu');
await from(trig, ['Enter', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Space', 'ArrowDown', 'Enter'], 'checkbox item');
log(`  checked: ${await p.evaluate(() => [...document.querySelectorAll('[role=menuitemcheckbox],[role=menuitemradio]')].map((e) => e.getAttribute('aria-checked')).join(','))}`);
await p.keyboard.press('Escape');
await from('[data-demo-trigger=ar]', ['Enter', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'Escape', 'Escape'], 'arabic menu');

// SplitButton
await go('split-button');
await tabWalk(4);
await from('[data-ds=split-button]:not([data-disabled]) > [data-part=trigger]', ['Enter', 'ArrowDown', 'End', 'Escape', 'ArrowUp', 'Escape', 'Shift+Tab', 'Tab', 'ArrowDown', 'Tab'], 'split');
await from('[data-ds=split-button][data-disabled] > [data-part=trigger]', ['Enter', 'ArrowDown'], 'split disabled');

console.log(out.join('\n'));
await b.close();
