import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import Ajv from 'ajv';
import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildRegistry, kebab, LAYER_ORDER, TARGET_ROOT, type BuildResult, type RegistryItem } from './build-registry';

const root = join(import.meta.dirname, '../../..');
const schemaDir = join(import.meta.dirname, '../schema');
const readJson = (f: string) => JSON.parse(readFileSync(f, 'utf8')) as Record<string, unknown>;
/** Ajv knows draft-07 without the meta schema reference, so drop `$schema`. */
const schema = (f: string) => {
  const { $schema: _drop, ...rest } = readJson(f);
  return rest;
};

let result: BuildResult;
let byName: Map<string, RegistryItem>;

beforeAll(() => {
  result = buildRegistry({ root });
  byName = new Map(result.items.map((i) => [i.name, i]));
});

function validators() {
  const ajv = new Ajv({ strict: false, allErrors: true });
  const itemSchema = schema(join(schemaDir, 'registry-item.json'));
  ajv.addSchema(itemSchema, 'https://ui.shadcn.com/schema/registry-item.json');
  return {
    item: ajv.getSchema('https://ui.shadcn.com/schema/registry-item.json')!,
    registry: ajv.compile(schema(join(schemaDir, 'registry.json'))),
  };
}

/** The item and every item it reaches through registryDependencies. */
function closure(name: string, seen = new Set<string>()): Set<string> {
  if (seen.has(name)) return seen;
  seen.add(name);
  for (const dep of byName.get(name)?.registryDependencies ?? []) closure(dep.replace(`${result.namespace}/`, ''), seen);
  return seen;
}

describe('registry build', () => {
  it('validates against the shadcn schemas', () => {
    const v = validators();
    expect(v.registry(result.registry), JSON.stringify(v.registry.errors)).toBe(true);
    for (const item of result.items) {
      expect(v.item(item), `${item.name}: ${JSON.stringify(v.item.errors)}`).toBe(true);
    }
  });

  it('has one item per React ready component and one style item per style pack', () => {
    const manifests = JSON.parse(readFileSync(join(root, 'packages/manifest/manifests.gen.json'), 'utf8')) as {
      name: string;
      kind: string;
      frameworks: { react: { status: string } };
    }[];
    for (const m of manifests) {
      if (m.kind !== 'component' || m.frameworks.react.status !== 'ready') continue;
      const name = m.name === 'Theme' ? 'theme' : kebab(m.name);
      expect(byName.get(name)?.type, m.name).toBe('registry:ui');
    }
    for (const id of ['studio', 'desk', 'neutral']) {
      const style = byName.get(`style-${id}`);
      expect(style?.type).toBe('registry:style');
      expect(style?.extends).toBe('none');
      expect(style?.files.some((f) => f.target === `${TARGET_ROOT}/tokens/${id}.css`)).toBe(true);
    }
    expect(result.warnings).toEqual([]);
  });

  it('ships no test, demo or private package import', () => {
    for (const item of result.items) {
      for (const f of item.files) {
        expect(f.path, item.name).not.toMatch(/\.(test|demo|spec)\.tsx?$/);
        expect(f.target.startsWith(`${TARGET_ROOT}/`), f.target).toBe(true);
        expect(f.content, f.path).toBeDefined();
        expect(f.content, f.path).not.toMatch(/from '@the-system\//);
        if (f.target.endsWith('.css')) expect(f.content!.startsWith(LAYER_ORDER), f.path).toBe(true);
      }
    }
  });

  it('resolves every relative import inside the item and its registry dependencies', () => {
    for (const item of result.items) {
      const targets = new Set<string>();
      for (const name of closure(item.name)) for (const f of byName.get(name)?.files ?? []) targets.add(f.target);
      for (const f of item.files) {
        if (!/\.(tsx?|css)$/.test(f.target)) continue;
        const specs = f.target.endsWith('.css')
          ? [...f.content!.matchAll(/@import\s+'(\.[^']+)'/g)].map((m) => m[1]!)
          : ts.preProcessFile(f.content!, true, true).importedFiles.map((i) => i.fileName).filter((s) => s.startsWith('.'));
        for (const spec of specs) {
          const base = posix.join(posix.dirname(f.target), spec);
          const found = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'].some((ext) => targets.has(base + ext));
          expect(found, `${item.name}: ${f.target} imports ${spec}`).toBe(true);
        }
      }
    }
  });

  it('gives each component its CSS through a side effect import in index.ts', () => {
    const button = byName.get('button')!;
    const index = button.files.find((f) => f.target.endsWith('/Button/index.ts'))!;
    expect(index.content).toContain("import '../../../css/components/Button.css';");
    expect(button.registryDependencies).toContain('@ds/theme');
    expect(byName.get('theme')!.registryDependencies).toEqual(['@ds/core', '@ds/style-studio']);
  });

  it('lists npm dependencies with the versions the packages declare', () => {
    const react = readJson(join(root, 'packages/react/package.json')) as { dependencies: Record<string, string> };
    expect(byName.get('dialog')!.dependencies).toContain(`radix-ui@${react.dependencies['radix-ui']}`);
    expect(byName.get('style-studio')!.dependencies?.some((d) => d.startsWith('@fontsource-variable/inter@'))).toBe(true);
  });

  it('writes a catalog without file contents', () => {
    for (const item of result.registry.items) for (const f of item.files) expect('content' in f).toBe(false);
    const committed = join(import.meta.dirname, '../registry.json');
    expect(existsSync(committed)).toBe(true);
  });
});
