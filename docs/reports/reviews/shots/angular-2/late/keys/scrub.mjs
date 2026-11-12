// ScrubInput: drag direction (LTR and RTL), press without move, keys, typed arithmetic, Escape.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, query] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto(`${base}/c/scrub-input?chrome=0&${query}`);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(600);
const out = [];
const labels = ['Rotation', 'Opacity', 'Position X', 'Height', 'العرض', 'الدوران', 'الطول'];
for (const label of labels) {
  const r = p.locator(`[data-ds=scrub-input]:has(input[aria-label="${label}"])`).first();
  if (!(await r.count())) continue;
  const inp = r.locator('input'); const h = r.locator('[data-part=label]');
  await inp.scrollIntoViewIfNeeded();
  const meta = await r.evaluate((r) => `dir=${getComputedStyle(r).direction} handle-hidden=${r.querySelector('[data-part=label]')?.getAttribute('aria-hidden')} input: ${['type', 'role', 'inputmode', 'aria-describedby', 'placeholder'].map((a) => a + '=' + r.querySelector('input').getAttribute(a)).join(' ')}`);
  out.push(`${label}: ${meta}`);
  const v = async (t) => out.push(`  ${t}: value="${await inp.inputValue()}" focus=${await p.evaluate((el) => document.activeElement === el ? 'input' : document.activeElement.tagName, await inp.elementHandle())} dragging=${await r.getAttribute('data-dragging')}`);
  const box = await h.boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 20, cy, { steps: 4 }); await v('drag +20px right (mid)'); await p.mouse.move(cx + 40, cy, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(60); await v('drag +40px right, up');
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx - 30, cy, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(60); await v('drag -30px left');
  await p.keyboard.down('Shift'); await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 10, cy, { steps: 4 }); await p.mouse.up(); await p.keyboard.up('Shift'); await p.waitForTimeout(60); await v('shift drag +10px right');
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(60);
  const sel = await inp.evaluate((el) => `${el.selectionStart}-${el.selectionEnd}/${el.value.length}`);
  await v(`press without move (selection ${sel})`);
  for (const k of ['ArrowUp', 'Shift+ArrowUp', 'Alt+ArrowUp', 'ArrowDown', 'Shift+ArrowDown']) { await p.keyboard.press(k); await p.waitForTimeout(40); await v(k); }
  await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('(2+3)*4'); await p.keyboard.press('Enter'); await p.waitForTimeout(40);
  await v(`type (2+3)*4, Enter (selection ${await inp.evaluate((el) => `${el.selectionStart}-${el.selectionEnd}`)})`);
  await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('١٢٫٥'); await p.keyboard.press('Enter'); await v('type ١٢٫٥, Enter');
  await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('abc'); await v('type abc'); await p.keyboard.press('Escape'); await v('Escape');
  await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.type('5em'); await p.keyboard.press('Tab'); await p.waitForTimeout(40); await v('type 5em, Tab');
}
console.log(out.join('\n'));
await b.close();
