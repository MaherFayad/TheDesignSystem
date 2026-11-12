// Opens a popup of the list family and dumps the owner and the portal layer, normalized.
// node probe.mjs <base> <path> <trigger selector> <index> <steps...>
// steps: click | focus | key:<Key> | type:<text> | wait:<ms> | clickout
import { chromium } from '@playwright/test';
const [base, path, selector, index, ...steps] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.emulateMedia({ reducedMotion: 'reduce' });
await p.goto(base + path);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(400);
const el = p.locator(selector).nth(Number(index));
await el.scrollIntoViewIfNeeded();
for (const s of steps) {
  if (s === 'click') await el.click();
  else if (s === 'focus') await el.focus();
  else if (s === 'clickout') await p.mouse.click(5, 5);
  else if (s.startsWith('key:')) await p.keyboard.press(s.slice(4));
  else if (s.startsWith('type:')) await p.keyboard.type(s.slice(5));
  else if (s.startsWith('wait:')) await p.waitForTimeout(Number(s.slice(5)));
  await p.waitForTimeout(150);
}
await p.waitForTimeout(300);
const out = await p.evaluate(({ selector, index }) => {
  const ids = new Map();
  const norm = (v) => { if (!ids.has(v)) ids.set(v, `ID${ids.size}`); return ids.get(v); };
  const idAttrs = new Set(['id', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-activedescendant', 'aria-owns', 'aria-errormessage']);
  const drop = new Set(['ng-version']);
  const lines = [];
  const walk = (el, depth) => {
    const attrs = [...el.attributes]
      .filter((a) => !drop.has(a.name))
      .map((a) => [a.name, idAttrs.has(a.name) ? a.value.split(/\s+/).map(norm).join(' ') : a.value])
      .sort((x, y) => x[0].localeCompare(y[0]))
      .map(([k, v]) => `${k}="${v}"`);
    lines.push(`${'  '.repeat(depth)}<${el.tagName.toLowerCase()} ${attrs.join(' ')}>`);
    for (const n of el.childNodes) {
      if (n.nodeType === 1) walk(n, depth + 1);
      else if (n.nodeType === 3 && n.textContent.trim()) lines.push(`${'  '.repeat(depth + 1)}"${n.textContent.trim()}"`);
    }
  };
  const t = document.querySelectorAll(selector)[index];
  const owner = t.closest('[data-ds=field]') ?? t.parentElement;
  lines.push('# owner');
  walk(owner, 0);
  lines.push('# layers');
  for (const l of document.querySelectorAll('body > [data-menu-layer]')) walk(l, 0);
  const a = document.activeElement;
  lines.push(`# active: ${a?.tagName.toLowerCase()} role=${a?.getAttribute('role')} part=${a?.getAttribute('data-part')} id=${a?.id ? norm(a.id) : ''} text=${(a?.textContent ?? '').trim().slice(0, 30)}`);
  lines.push(`# body style: ${document.body.getAttribute('style')}`);
  lines.push(`# aria-hidden siblings: ${[...document.body.children].filter((c) => c.getAttribute('aria-hidden') === 'true').length}`);
  return lines.join('\n');
}, { selector, index: Number(index) });
console.log(out);
await b.close();
