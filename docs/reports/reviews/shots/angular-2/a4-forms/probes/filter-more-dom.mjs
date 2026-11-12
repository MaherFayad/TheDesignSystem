// Opens the FilterBar more menu (variants case) and dumps the menu layer, normalized as compare-dom.mjs.
import { chromium } from '@playwright/test';
const [base, q] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto(`${base}/c/filter-bar?${q ?? ''}`);
await p.waitForSelector('[data-demo-case]');
await p.waitForTimeout(300);
await p.locator('[data-demo-case=variants] [data-part=more]').first().click();
await p.waitForSelector('[role=menu]');
await p.waitForTimeout(500);
console.log(await p.evaluate(() => {
  const ids = new Map();
  const norm = (v) => { if (!ids.has(v)) ids.set(v, `ID${ids.size}`); return ids.get(v); };
  const idAttrs = new Set(['id', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls']);
  const lines = [];
  const walk = (el, d) => {
    const attrs = [...el.attributes].filter((a) => a.name !== 'style').map((a) => [a.name, idAttrs.has(a.name) ? a.value.split(/\s+/).map(norm).join(' ') : a.value]).sort((x, y) => x[0].localeCompare(y[0])).map(([k, v]) => `${k}="${v}"`);
    lines.push(`${'  '.repeat(d)}<${el.tagName.toLowerCase()} ${attrs.join(' ')}>`);
    for (const n of el.childNodes) { if (n.nodeType === 1) walk(n, d + 1); else if (n.nodeType === 3 && n.textContent.trim()) lines.push(`${'  '.repeat(d + 1)}"${n.textContent.trim()}"`); }
  };
  walk(document.querySelector('[role=menu]').closest('[data-menu-layer]') ?? document.querySelector('[role=menu]'), 0);
  const trig = document.querySelector('[data-demo-case=variants] [data-part=more]');
  walk(trig, 0);
  return lines.join('\n');
}));
await b.close();
