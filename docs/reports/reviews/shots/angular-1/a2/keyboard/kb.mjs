// Keyboard parity: runs the same steps on React and Angular and prints a log.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, rtl] = process.argv.slice(2);
const q = rtl === 'rtl' ? '&style=desk&dir=rtl&lang=ar' : '&style=desk';
const slug = (s) => (base.endsWith('5301') && s === 'otp-field' ? 'otpfield' : s);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
const log = [];
const L = (...a) => log.push(a.join(' '));
const go = async (c) => { await p.goto(`${base}/c/${slug(c)}?chrome=0${q}`); await p.waitForSelector('[data-demo-case]', { state: 'attached' }); await p.waitForTimeout(400); };
const active = () => p.evaluate(() => {
  const n = (s) => s.replace(/:r[^ ]*|ds-[a-z-]+-\d+-?[a-z-]*|«[^»]*»|_r_[^ ]*/g, 'ID');
  const a = document.activeElement; if (!a) return 'none';
  const root = a.closest('[data-ds]:not([data-ds=icon]):not([data-ds=button]):not([data-ds=icon-button])');
  return `${a.tagName.toLowerCase()} part=${a.getAttribute('data-part')} ds=${a.getAttribute('data-ds')} in=${root?.getAttribute('data-ds')} name=${a.getAttribute('aria-label') ?? ''} type=${a.getAttribute('type') ?? ''} disabled=${a.disabled ?? ''} ariadis=${a.getAttribute('aria-disabled')}`;
});
const html = (sel) => p.evaluate((sel) => {
  const el = document.querySelector(sel); if (!el) return 'missing';
  const ids = new Map(); const norm = (v) => { if (!ids.has(v)) ids.set(v, `ID${ids.size}`); return ids.get(v); };
  const c = el.cloneNode(true);
  for (const e of [c, ...c.querySelectorAll('*')]) for (const at of [...e.attributes]) {
    if (['id','for','aria-labelledby','aria-describedby','aria-controls'].includes(at.name)) e.setAttribute(at.name, at.value.split(/\s+/).map(norm).join(' '));
    if (at.name === 'class' || at.name === 'ng-reflect') e.removeAttribute(at.name);
  }
  return c.outerHTML.replace(/<!--[^]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s+/g, ' ');
}, sel);
const val = (sel) => p.$eval(sel, (e) => `value=${JSON.stringify(e.value)} sel=${e.selectionStart}-${e.selectionEnd} type=${e.type}`);

// Tab order on every page.
for (const c of ['label','field-error','field','input','textarea','input-group','search-field','password-field','inline-edit','otp-field','phone-field']) {
  await go(c);
  await p.evaluate(() => document.body.focus());
  L(`## tab ${c}`);
  for (let i = 0; i < 30; i++) { await p.keyboard.press('Tab'); L(i, await active()); }
}

// SearchField
await go('search-field');
const sf = '[data-ds=search-field]:not([data-disabled]):not([data-readonly]) input';
await p.focus(sf); await p.keyboard.type('abc');
L('## search typed', await val(sf), await active());
L('clear shown', await p.$$eval('[data-ds=search-field] [data-part=clear]', (x) => x.length));
await p.keyboard.press('Tab'); L('tab after typing ->', await active());
await p.keyboard.press('Shift+Tab');
await p.keyboard.press('Escape'); L('escape1', await val(sf), await active());
await p.keyboard.press('Escape'); L('escape2', await val(sf), await active());
await p.keyboard.type('xy'); await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); L('clear by Enter on clear button', await val(sf), await active());
await p.keyboard.type('q'); await p.keyboard.press('Tab'); await p.keyboard.press(' '); L('clear by Space', await val(sf), await active());

// PasswordField
await go('password-field');
const pf = '[data-ds=password-field]:not([data-disabled]):not([data-readonly])';
await p.focus(`${pf} input`); await p.keyboard.type('pw1');
L('## password', await val(`${pf} input`));
await p.keyboard.press('Tab'); L('toggle', await active(), await p.$eval(`${pf} [data-part=toggle]`, (e) => `${e.getAttribute('aria-pressed')} ${e.getAttribute('aria-label')}`));
await p.keyboard.press('Enter'); L('after Enter', await val(`${pf} input`), await active(), await p.$eval(`${pf} [data-part=toggle]`, (e) => `${e.getAttribute('aria-pressed')} ${e.getAttribute('aria-label')}`));
L('html visible', await html(pf));
await p.keyboard.press(' '); L('after Space', await val(`${pf} input`), await active());

// InlineEdit
await go('inline-edit');
const ie = '[data-ds=inline-edit]:not([data-disabled])';
await p.focus(`${ie} [data-part=display]`);
L('## inline viewing', await active());
await p.keyboard.press('Enter'); await p.waitForTimeout(100);
L('enter ->', await active(), await val(`${ie} input`));
L('html editing', await html(ie));
await p.keyboard.type('Renamed'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
L('commit ->', await active(), await p.$eval(ie, (e) => e.getAttribute('data-state') + ' ' + e.querySelector('[data-part=display]')?.textContent.trim() + ' status=' + e.querySelector('[data-part=status]')?.textContent));
await p.keyboard.press(' '); await p.waitForTimeout(100);
L('space ->', await active());
await p.keyboard.type('Dropped'); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
L('escape ->', await active(), await p.$eval(ie, (e) => e.getAttribute('data-state') + ' ' + e.querySelector('[data-part=display]')?.textContent.trim()));
await p.keyboard.press('Enter'); await p.waitForTimeout(100);
await p.keyboard.press('Tab'); L('tab in editor ->', await active());
await p.keyboard.press('Tab'); L('tab 2 ->', await active());
await p.keyboard.press('Tab'); await p.waitForTimeout(100); L('tab 3 leaves ->', await active(), await p.$eval(ie, (e) => e.getAttribute('data-state')));

// OTP
await go('otp-field');
const of = '[data-ds=otp-field]:not([data-disabled]):not([data-readonly]):not([data-complete])';
const oi = `${of} input`;
const ofId = await p.$eval(of, (e) => { e.setAttribute('data-qa', ''); return 1; });
const O = '[data-qa] input';
await p.focus(O);
L('## otp focus', await val(O), await p.$eval('[data-qa]', (e) => e.getAttribute('dir')), 'autocomplete=' + await p.$eval(O, (e) => e.getAttribute('autocomplete')));
await p.keyboard.type('12'); L('typed 12', await val(O), await p.$$eval('[data-qa] [data-active]', (x) => x.length));
await p.keyboard.press('Backspace'); L('backspace', await val(O));
await p.keyboard.type('234'); L('typed 234', await val(O));
await p.keyboard.press('ArrowLeft'); L('ArrowLeft', await val(O));
await p.keyboard.press('ArrowLeft'); L('ArrowLeft', await val(O));
await p.keyboard.press('ArrowRight'); L('ArrowRight', await val(O));
await p.keyboard.press('Home'); L('Home', await val(O));
await p.keyboard.press('End'); L('End', await val(O));
await p.keyboard.press('Backspace'); L('backspace on selected', await val(O));
await p.keyboard.type('a'); L('letter refused', await val(O));
await p.evaluate(() => navigator.clipboard.writeText('987 654'));
await p.keyboard.press('Control+V'); await p.waitForTimeout(50); L('paste', await val(O), 'complete=' + await p.$eval('[data-qa]', (e) => e.hasAttribute('data-complete')));
L('html after paste', await html('[data-qa]'));
await p.evaluate(() => navigator.clipboard.writeText('١٢٣٤٥٦'));
await p.keyboard.press('Control+V'); await p.waitForTimeout(50); L('paste arabic digits', await val(O));

// Phone
await go('phone-field');
const ph = '[data-ds=phone-field]:not([data-disabled]):not([data-readonly])';
await p.$eval(ph, (e) => e.setAttribute('data-qa', ''));
await p.focus('[data-qa] select'); L('## phone select', await active());
await p.keyboard.press('Tab'); L('tab ->', await active());
await p.fill('[data-qa] input[data-part=control]', '');
await p.keyboard.type('0501234567'); L('typed', await val('[data-qa] input[data-part=control]'));
await p.keyboard.press('Backspace'); L('backspace', await val('[data-qa] input[data-part=control]'));
await p.selectOption('[data-qa] select', 'AE'); L('country AE', await val('[data-qa] input[data-part=control]'), await p.$eval('[data-qa] [data-part=code]', (e) => e.textContent.trim()));
await p.fill('[data-qa] input[data-part=control]', '');
await p.focus('[data-qa] input[data-part=control]');
await p.keyboard.type('+97'); L('+97 draft', await val('[data-qa] input[data-part=control]'));
await p.keyboard.type('1501234567'); L('+971...', await val('[data-qa] input[data-part=control]'), await p.$eval('[data-qa] select', (e) => e.value));
L('html phone', (await html('[data-qa]')).replace(/<optgroup.*<\/optgroup>/, '<optgroups/>'));
await p.focus('[data-qa] select'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(50); L('select ArrowDown', await p.$eval('[data-qa] select', (e) => e.value), await val('[data-qa] input[data-part=control]'));

console.log(log.join('\n'));
await b.close();
