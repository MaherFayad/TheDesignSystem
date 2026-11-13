// Dumps the normalized DOM of every demo case of each Angular component in
// both galleries and writes a line diff per component.
// node docs/reports/shots/angular-sync-3/dom-diff.mjs [react url] [angular url] [out dir] [slug ...]
// Style attributes are kept (inline custom properties set by code count).
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const [reactUrl = 'http://localhost:5301', angularUrl = 'http://localhost:5302', outDir = join(here, 'dom'), ...only] = process.argv.slice(2);
const all = readdirSync(join(here, '../../../../packages/angular/src/components'));
const slugs = only.length ? only : all;
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
async function dump(base, slug) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await p.goto(`${base}/c/${slug}?chrome=0`, { waitUntil: 'networkidle' });
    await p.waitForSelector('[data-demo-case]', { state: 'attached', timeout: 15000 });
    await p.waitForTimeout(800);
    return await p.evaluate(() => {
      const ids = new Map();
      const norm = (v) => { if (!ids.has(v)) ids.set(v, `ID${ids.size}`); return ids.get(v); };
      const idAttrs = new Set(['id', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-activedescendant', 'aria-owns', 'name', 'list', 'form']);
      const drop = new Set(['data-aria-hidden', 'ng-version']);
      const lines = [];
      const walk = (el, depth) => {
        const attrs = [...el.attributes]
          .filter((a) => !drop.has(a.name) && !a.name.startsWith('_ng'))
          .map((a) => [a.name, idAttrs.has(a.name) ? a.value.split(/\s+/).map(norm).join(' ') : a.value])
          .sort((x, y) => x[0].localeCompare(y[0]))
          .map(([k, v]) => `${k}="${v}"`);
        lines.push(`${'  '.repeat(depth)}<${el.tagName.toLowerCase()} ${attrs.join(' ')}>`);
        for (const n of el.childNodes) {
          if (n.nodeType === 1) walk(n, depth + 1);
          else if (n.nodeType === 3 && n.textContent.trim()) lines.push(`${'  '.repeat(depth + 1)}"${n.textContent.trim()}"`);
        }
      };
      for (const el of document.querySelectorAll('[data-demo-case]')) walk(el, 0);
      return lines.join('\n');
    });
  } catch (e) {
    return `ERROR ${e.message}`;
  } finally {
    await p.close();
  }
}

// Plain LCS line diff, enough for files of a few thousand lines.
function diff(a, b) {
  const A = a.split('\n'), B = b.split('\n');
  const n = A.length, m = B.length;
  if (n * m > 4e7) return [`too large to diff (${n} x ${m})`];
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(`- ${A[i++]}`);
    else out.push(`+ ${B[j++]}`);
  }
  while (i < n) out.push(`- ${A[i++]}`);
  while (j < m) out.push(`+ ${B[j++]}`);
  return out;
}

const summary = [];
for (const slug of slugs) {
  const [r, a] = await Promise.all([dump(reactUrl, slug), dump(angularUrl, slug)]);
  writeFileSync(join(outDir, `${slug}.react.txt`), r);
  writeFileSync(join(outDir, `${slug}.angular.txt`), a);
  const d = diff(r, a);
  writeFileSync(join(outDir, `${slug}.diff`), d.join('\n'));
  summary.push(`${slug}\t${d.length}`);
  console.log(`${slug}\t${d.length}`);
}
writeFileSync(join(outDir, 'summary.tsv'), summary.join('\n') + '\n');
await browser.close();
