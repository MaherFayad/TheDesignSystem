// Writes the registry:
//
//   packages/registry/registry.json        the catalog (committed, no file contents)
//   packages/registry/files/*.css          the entry CSS files the catalog names
//   packages/registry/public/r/<name>.json one item per component, style and block,
//                                          with contents, as `shadcn add` reads it
//   packages/registry/public/r/registry.json  the catalog, served next to the items
//
// Run: npx tsx packages/registry/build.ts [--out <dir>]
// Needs the token build first (packages/tokens/dist/css/<style>.css).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { buildRegistry } from './src/build-registry';

const root = resolve(import.meta.dirname, '../..');
const { values } = parseArgs({ options: { out: { type: 'string' } } });
const out = values.out ? resolve(values.out) : join(import.meta.dirname, 'public/r');

const { registry, items, namespace, warnings } = buildRegistry({ root });
const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;

writeFileSync(join(import.meta.dirname, 'registry.json'), json(registry));
mkdirSync(join(import.meta.dirname, 'files'), { recursive: true });
for (const item of items) {
  for (const f of item.files) {
    if (f.path.startsWith('packages/registry/files/') && f.content !== undefined) {
      writeFileSync(join(root, f.path), f.content);
    }
  }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const item of items) writeFileSync(join(out, `${item.name}.json`), json(item));
writeFileSync(join(out, 'registry.json'), json(registry));

for (const w of warnings) console.warn(`warning: ${w}`);
console.log(`registry: ${items.length} items in ${out} (namespace ${namespace})`);
