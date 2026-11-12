import { chromium } from 'playwright';
const [base, id] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto(`${base}/interactions?focus=${id}`);
await p.waitForSelector('[data-interaction-stage]', { state: 'attached' });
await p.waitForTimeout(800);
const out = await p.evaluate(() => {
  const ids = new Map();
  const norm = (v) => { if (!ids.has(v)) ids.set(v, `ID${ids.size}`); return ids.get(v); };
  const idAttrs = new Set(['id', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-activedescendant']);
  const lines = [];
  const walk = (el, depth) => {
    const attrs = [...el.attributes].filter((a) => a.name !== 'style' && a.name !== 'ng-version' && a.name !== 'data-aria-hidden' && !a.name.startsWith('_ng'))
      .map((a) => [a.name, idAttrs.has(a.name) ? a.value.split(/\s+/).map(norm).join(' ') : a.value])
      .sort((x, y) => x[0].localeCompare(y[0])).map(([k, v]) => `${k}="${v}"`);
    const tag = el.tagName.toLowerCase();
    if (tag.startsWith('ds-stage')) { for (const c of el.children) walk(c, depth); return; }
    lines.push(`${'  '.repeat(depth)}<${tag} ${attrs.join(' ')}>`);
    for (const n of el.childNodes) {
      if (n.nodeType === 1) walk(n, depth + 1);
      else if (n.nodeType === 3 && n.textContent.trim()) lines.push(`${'  '.repeat(depth + 1)}"${n.textContent.trim()}"`);
    }
  };
  for (const c of document.querySelector('[data-interaction-stage]').children) walk(c, 0);
  return lines.join('\n');
});
console.log(out);
await b.close();
