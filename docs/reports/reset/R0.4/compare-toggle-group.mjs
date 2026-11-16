// R0.4 evidence: ToggleGroup shots, React against Angular, with the rule of
// `npm run shots -- --compare react angular` (pixelmatch threshold 0.1, a
// pair passes when at most 0.5 percent of pixels differ and the sizes match),
// limited to one component so the shared compare folder is left alone.
// Capture first, each into its own folder:
//   npm run shots -- --framework react --component ToggleGroup --out <dir>/react --work <dir>/work-react --keep all
//   npm run shots -- --framework angular --component ToggleGroup --out <dir>/angular --work <dir>/work-angular --keep all
// then: node compare-toggle-group.mjs <dir>/work-react <dir>/work-angular <out.md>
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import pixelmatch from '/home/user/TheDesignSystem/node_modules/pixelmatch/index.js';
import { PNG } from '/home/user/TheDesignSystem/node_modules/pngjs/lib/png.js';

const [a, b, out] = process.argv.slice(2);
const pngs = (dir) => {
  const found = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n.endsWith('.png')) found.push(relative(dir, p));
    }
  };
  walk(dir);
  return found.sort();
};
const left = pngs(a);
const right = new Set(pngs(b));
const rows = [];
let fails = 0;
for (const f of left.filter((x) => right.has(x))) {
  const x = PNG.sync.read(readFileSync(join(a, f)));
  const y = PNG.sync.read(readFileSync(join(b, f)));
  let cell;
  let ok;
  if (x.width !== y.width || x.height !== y.height) {
    ok = false;
    cell = `size ${x.width}x${x.height} against ${y.width}x${y.height}`;
  } else {
    const n = pixelmatch(x.data, y.data, null, x.width, x.height, { threshold: 0.1 });
    const ratio = n / (x.width * x.height);
    ok = ratio <= 0.005;
    cell = `${n} (${(ratio * 100).toFixed(3)} percent)`;
  }
  if (!ok) fails += 1;
  rows.push(`| ${f} | ${ok ? 'pass' : 'FAIL'} | ${cell} |`);
}
const onlyA = left.filter((x) => !right.has(x));
const onlyB = [...right].filter((x) => !left.includes(x));
const md = [
  '# ToggleGroup, React against Angular',
  '',
  `${rows.length} pairs, ${rows.length - fails} pass, ${fails} fail. Only in React: ${onlyA.length}. Only in Angular: ${onlyB.length}.`,
  '',
  '| File | Result | Differing pixels |',
  '| --- | --- | --- |',
  ...rows,
  '',
].join('\n');
writeFileSync(out, md);
console.log(md.split('\n')[2]);
process.exit(fails ? 1 : 0);
