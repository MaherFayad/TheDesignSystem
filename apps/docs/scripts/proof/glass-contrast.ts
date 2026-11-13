// Contrast of the chrome text on the glass bars of every glass style, over the page, a surface and the primary fill.
// Run: npx tsx apps/docs/scripts/proof/glass-contrast.ts
import { tokenValue } from '../styles.ts';
type C = [number, number, number, number];
const parse = (v: string): C => {
  v = v.trim();
  let m = /^#([0-9a-f]{6})$/i.exec(v);
  if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]; }
  m = /^rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/.exec(v);
  if (m) return [+m[1], +m[2], +m[3], m[4] ? +m[4] : 1];
  throw new Error('color ' + v);
};
const over = (a: C, b: C): C => [a[0] * a[3] + b[0] * (1 - a[3]), a[1] * a[3] + b[1] * (1 - a[3]), a[2] * a[3] + b[2] * (1 - a[3]), 1];
const lum = (c: C) => { const f = (x: number) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a: C, b: C) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const tv = (s: string, sc: string, n: string) => parse(tokenValue(s, sc, n)!);
const rows: string[] = ['| Style | Scheme | Layer | Backdrop | Text | Muted | Current |', '| --- | --- | --- | --- | --- | --- | --- |'];
let min = 99;
for (const s of ['desk', 'liquid']) for (const sc of ['dark', 'light']) {
  const backs: [string, C][] = [
    ['page (bg.body)', tv(s, sc, '--ds-color-bg-body')],
    ['surface', tv(s, sc, '--ds-color-bg-surface')],
    ['primary fill', tv(s, sc, '--ds-color-primary-fill')],
  ];
  for (const [layer, mat] of [['top bar', '--ds-color-material-menubar'], ['sidebar', '--ds-color-material-glass']] as const) {
    for (const [bn, bc] of backs) {
      if (layer === 'sidebar' && bn !== 'page (bg.body)') continue; // the sidebar floats over the page only
      const bg = over(tv(s, sc, mat), bc);
      const t = ratio(tv(s, sc, '--ds-color-text-default'), bg);
      const m = layer === 'top bar' ? NaN : ratio(over(tv(s, sc, '--ds-color-text-muted'), bg), bg);
      const cur = layer === 'sidebar' ? ratio(tv(s, sc, '--ds-color-primary-on-surface'), over(tv(s, sc, '--ds-color-primary-tint'), bg)) : NaN;
      min = Math.min(min, t, isNaN(m) ? 99 : m, isNaN(cur) ? 99 : cur);
      rows.push(`| ${s} | ${sc} | ${layer} | ${bn} | ${t.toFixed(2)} | ${isNaN(m) ? 'not used' : m.toFixed(2)} | ${isNaN(cur) ? '' : cur.toFixed(2)} |`);
    }
  }
}
console.log(rows.join('\n'));
console.log('min', min.toFixed(2));
