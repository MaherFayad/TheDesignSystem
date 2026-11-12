// Recheck of angular-1 InlineEdit B1 in Chromium: Enter, Space and a click
// on the display open the editor and focus lands in the input; then Escape
// returns to the display, and typing plus Enter saves. LTR studio and RTL desk Arabic.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
const out = [`${await b.version()}`];
for (const [d, q] of [['ltr', 'style=studio'], ['rtl', 'style=desk&dir=rtl&lang=ar']]) {
  for (const how of ['Enter', 'Space', 'click']) {
    await p.goto(`${base}/c/inline-edit?chrome=0&${q}`);
    await p.waitForSelector('[data-demo-case]', { state: 'attached' });
    await p.waitForTimeout(500);
    const r = p.locator('[data-ds=inline-edit][data-state=viewing]:not([data-disabled])').first();
    await r.evaluate((el) => el.setAttribute('data-qa', ''));
    const r2 = p.locator('[data-qa]');
    const disp = r2.locator('[data-part=display]');
    const before = (await disp.textContent()).trim();
    if (how === 'click') await disp.click();
    else { await disp.focus(); await p.keyboard.press(how); }
    await p.waitForTimeout(300);
    const s = async () => p.evaluate(() => {
      const r = document.querySelector('[data-qa]'); const a = document.activeElement;
      return `state=${r.getAttribute('data-state')} focus=${a.tagName}${a.getAttribute('data-part') ? '/' + a.getAttribute('data-part') : ''} inRoot=${r.contains(a)} value=${a.tagName === 'INPUT' ? JSON.stringify(a.value) : '-'} sel=${a.tagName === 'INPUT' ? a.selectionStart + '-' + a.selectionEnd : '-'}`;
    });
    out.push(`${d} ${how} on display "${before}": ${await s()}`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    out.push(`  Escape: ${await s()}`);
    await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('QA name'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    out.push(`  Enter, type, Enter: ${await s()} display="${(await r2.locator('[data-part=display]').textContent().catch(() => '?'))?.trim()}"`);
    await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    await p.keyboard.press('Tab'); await p.waitForTimeout(300);
    out.push(`  Enter, Tab away: ${await s()}`);
  }
}
console.log(out.join('\n'));
await b.close();
