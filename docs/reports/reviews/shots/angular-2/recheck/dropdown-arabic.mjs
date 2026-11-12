// Recheck of angular-1 DropdownMenu B4: open the Arabic board menu
// ([data-demo-trigger=ar]) by keyboard and read dir and lang on the open
// layer, the wrapper and the menu, then the submenu key. Prints text.
import { chromium } from '/home/user/TheDesignSystem/node_modules/@playwright/test/index.mjs';
const [base, query, shot] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })).newPage();
await p.goto(`${base}/c/dropdown-menu?chrome=0&${query}`);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(500);
const t = p.locator('[data-demo-trigger=ar]').first();
await t.scrollIntoViewIfNeeded();
await t.focus();
await p.keyboard.press('Enter');
await p.waitForSelector('[data-menu-layer] [role=menu]');
await p.waitForTimeout(300);
const info = await p.evaluate(() => {
  const menu = document.querySelector('[data-menu-layer] [role=menu]');
  const chain = [];
  for (let el = menu; el && el !== document.body; el = el.parentElement) chain.push(`${el.tagName.toLowerCase()}${el.hasAttribute('data-menu-layer') ? '[data-menu-layer]' : ''}${el.getAttribute('data-ds') ? '[data-ds=' + el.getAttribute('data-ds') + ']' : ''} dir=${el.getAttribute('dir')} lang=${el.getAttribute('lang')}`);
  const items = [...menu.querySelectorAll('[role^=menuitem]')].map((i) => i.textContent.trim().slice(0, 20));
  return `${chain.join('\n  ')}\n  computed direction=${getComputedStyle(menu).direction}\n  items=${items.join(' | ')}`;
});
console.log(info);
if (shot) await p.screenshot({ path: shot });
// The submenu: walk to the first item with a submenu and open it with the inline end arrow key.
const sub = await p.evaluate(() => {
  const menu = document.querySelector('[data-menu-layer] [role=menu]');
  const items = [...menu.querySelectorAll('[role^=menuitem]')];
  return items.findIndex((i) => i.getAttribute('aria-haspopup') === 'menu');
});
const focused = async () => p.evaluate(() => `${document.activeElement.getAttribute('role')}:${document.activeElement.textContent.trim().slice(0, 20)} menus=${document.querySelectorAll('[role=menu]').length}`);
for (let i = 0; i < sub; i++) await p.keyboard.press('ArrowDown');
console.log(`  on submenu item: ${await focused()}`);
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
console.log(`  ArrowRight: ${await focused()}`);
await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(250);
console.log(`  ArrowLeft: ${await focused()}`);
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
console.log(`  ArrowRight: ${await focused()}`);
await b.close();
