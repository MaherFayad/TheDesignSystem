// Normalized DOM dump of the demo cases (or an open dialog layer), for diffing the two galleries.
// node docs/reports/shots/angular/compare-dom.mjs <gallery url> <path> [trigger selector] > out.txt
import { chromium } from '@playwright/test';
const [base, path, trigger] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto(base + path);
await p.waitForSelector('[data-demo-case]', { state: 'attached' });
await p.waitForTimeout(300);
if (trigger) {
  await p.click(trigger);
  await p.waitForSelector('[data-ds=dialog] [data-part=panel]');
  await p.waitForTimeout(600);
}
const out = await p.evaluate((trigger) => {
  const ids = new Map();
  const norm = (v) => { if (!ids.has(v)) ids.set(v, `ID${ids.size}`); return ids.get(v); };
  const idAttrs = new Set(['id', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls']);
  const drop = new Set(['data-aria-hidden', 'ng-version']);
  const lines = [];
  const walk = (el, depth) => {
    const attrs = [...el.attributes]
      .filter((a) => !drop.has(a.name) && !(a.name === 'style' && /^pointer-events: (auto|none);$/.test(a.value)))
      .map((a) => [a.name, idAttrs.has(a.name) ? a.value.split(/\s+/).map(norm).join(' ') : a.value])
      .sort((x, y) => x[0].localeCompare(y[0]))
      .map(([k, v]) => `${k}="${v}"`);
    lines.push(`${'  '.repeat(depth)}<${el.tagName.toLowerCase()} ${attrs.join(' ')}>`);
    for (const n of el.childNodes) {
      if (n.nodeType === 1) walk(n, depth + 1);
      else if (n.nodeType === 3 && n.textContent.trim()) lines.push(`${'  '.repeat(depth + 1)}"${n.textContent.trim()}"`);
    }
  };
  if (trigger) {
    for (const el of document.querySelectorAll('[data-dialog-layer]')) walk(el, 0);
  } else {
    for (const el of document.querySelectorAll('[data-demo-case]')) walk(el, 0);
  }
  return lines.join('\n');
}, trigger);
console.log(out);
await b.close();
