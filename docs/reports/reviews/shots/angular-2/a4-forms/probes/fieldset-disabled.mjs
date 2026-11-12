// Native fieldset disabled around each control, React and Angular side by side.
// Moves the first control of a gallery page into <fieldset disabled>, then
// tries Tab, a click and keys, and reads the state.
import { chromium } from '@playwright/test';
const pages = [
  ['input', '[data-ds=input]', 'input'],
  ['checkbox', '[data-ds=checkbox]', '[role=checkbox]'],
  ['switch', '[data-ds=switch]', '[role=switch]'],
  ['radio-group', '[data-ds=radio-group]', '[role=radio]'],
  ['select', '[data-ds=select]', '[role=combobox]'],
  ['slider', '[data-ds=slider]', '[role=slider]'],
  ['consent-field', '[data-ds=consent-field]', '[role=checkbox]'],
];
const b = await chromium.launch();
const rows = [];
for (const [kebab, rootSel, ctlSel] of pages) {
  for (const [fw, base] of Object.entries({ react: 'http://localhost:5301', angular: 'http://localhost:5302' })) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(`${base}/c/${kebab}`);
    await p.waitForSelector('[data-demo-case]');
    await p.waitForTimeout(300);
    await p.evaluate(([rootSel]) => {
      const root = document.querySelector(`[data-demo-case] ${rootSel}`);
      const fs = document.createElement('fieldset');
      fs.disabled = true;
      fs.id = 'qa-fs';
      const before = document.createElement('a');
      before.href = '#';
      before.id = 'qa-before';
      before.textContent = 'before';
      root.parentElement.insertBefore(before, root);
      root.parentElement.insertBefore(fs, root);
      fs.appendChild(root);
    }, [rootSel]);
    await p.waitForTimeout(100);
    const read = () => p.evaluate(([ctlSel]) => {
      const fs = document.getElementById('qa-fs');
      const c = fs.querySelector(ctlSel);
      const root = fs.firstElementChild;
      return {
        disabledMatch: c.matches(':disabled'),
        ariaDisabled: c.getAttribute('aria-disabled'),
        rootDataDisabled: root.hasAttribute('data-disabled'),
        state: c.getAttribute('aria-checked') ?? c.getAttribute('aria-valuenow') ?? c.getAttribute('aria-expanded') ?? (c.value ?? null),
        tabindex: c.getAttribute('tabindex'),
      };
    }, [ctlSel]);
    const start = await read();
    await p.focus('#qa-before');
    await p.keyboard.press('Tab');
    const tabLands = await p.evaluate(() => (document.getElementById('qa-fs').contains(document.activeElement) ? `${document.activeElement.tagName.toLowerCase()}[${document.activeElement.getAttribute('role') ?? ''}]` : 'outside'));
    await p.locator(`#qa-fs ${ctlSel}`).first().click({ force: true, timeout: 2000 }).catch(() => {});
    await p.waitForTimeout(150);
    const afterClick = await read();
    await p.evaluate(([ctlSel]) => document.querySelector(`#qa-fs ${ctlSel}`).focus(), [ctlSel]);
    const scriptFocus = await p.evaluate(() => document.getElementById('qa-fs').contains(document.activeElement));
    await p.keyboard.press(kebab === 'input' ? 'a' : kebab === 'slider' ? 'ArrowRight' : 'Space');
    await p.waitForTimeout(150);
    const afterKey = await read();
    await p.keyboard.press('Escape');
    rows.push(`${kebab.padEnd(14)} ${fw.padEnd(8)} start=${JSON.stringify(start)} tab=${tabLands} click->${afterClick.state} focusable=${scriptFocus} key->${afterKey.state}`);
    await p.close();
  }
}
console.log(rows.join('\n'));
await b.close();
