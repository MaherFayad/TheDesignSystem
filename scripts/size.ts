// npm run size (or npx tsx scripts/size.ts) [--out docs/reports/size-wave-1.md] [--json file]
//
// The size report. Every package in this repo exports source (TypeScript and
// CSS), so this script builds each public entry the way a consumer bundler
// would: vite in library mode, ES output, minified, every bare import
// (react, radix-ui, @angular/*, other @the-system packages) kept external,
// so a number is the code of that entry alone. CSS entries are bundled with
// their @import chain inlined and minified; font and image files a url()
// points at are not counted. Each output is gzipped at level 9 and the raw,
// minified and gzip bytes are written to a Markdown table and a JSON file.
//
// Measured:
// - JS: every exports entry that points at a .ts file, in the library and
//   theme packages (tool packages such as cli, lint, mcp and registry are
//   left out); the styles wildcards are expanded per style id.
// - CSS: every exports entry that points at a .css file, each style pack's
//   index.css, and each component CSS file in packages/css/src/components
//   and packages/styles/<id>/recipes on its own.
//
// Angular sources are compiled without the Angular compiler (decorators kept
// as runtime calls), so their numbers are close to, not equal to, an AOT
// build. The note in the report says so.
import { gzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, type Rollup } from 'vite';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOL_PACKAGES = new Set(['cli', 'lint', 'mcp', 'registry', 'contract-tests', 'figma', 'manifest']);

interface Entry {
  pkg: string;
  entry: string;
  file: string;
  kind: 'js' | 'css';
  group: 'entry' | 'component' | 'recipe';
}

interface Measured extends Entry {
  raw: number;
  min: number;
  gzip: number;
  error?: string;
}

function parseArgs(argv: string[]): { out: string; json: string } {
  let out = join(repo, 'docs/reports/size-wave-1.md');
  let json = join(repo, 'docs/reports/size-wave-1.json');
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--out') out = resolve(argv[++i] ?? out);
    else if (a === '--json') json = resolve(argv[++i] ?? json);
    else if (a === '--help' || a === '-h') {
      console.log('npx tsx scripts/size.ts [--out file.md] [--json file.json]');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return { out, json };
}

/** Each exports value as a list of [key, target] with the default condition picked. */
function exportTargets(exports: unknown): [string, string][] {
  if (typeof exports === 'string') return [['.', exports]];
  if (!exports || typeof exports !== 'object') return [];
  const out: [string, string][] = [];
  for (const [key, value] of Object.entries(exports as Record<string, unknown>)) {
    if (typeof value === 'string') out.push([key, value]);
    else if (value && typeof value === 'object') {
      const v = value as Record<string, unknown>;
      const target = v.default ?? v.import;
      if (typeof target === 'string') out.push([key, target]);
    }
  }
  return out;
}

function styleIds(): string[] {
  const dir = join(repo, 'packages/styles');
  return readdirSync(dir).filter((d) => existsSync(join(dir, d, 'style.json'))).sort();
}

function findEntries(): Entry[] {
  const entries: Entry[] = [];
  const seen = new Set<string>();
  const add = (e: Entry) => {
    const key = `${e.kind}:${e.file}`;
    if (seen.has(key) || !existsSync(e.file)) return;
    seen.add(key);
    entries.push(e);
  };
  for (const dir of readdirSync(join(repo, 'packages')).sort()) {
    const pj = join(repo, 'packages', dir, 'package.json');
    if (!existsSync(pj) || TOOL_PACKAGES.has(dir)) continue;
    const pkg = JSON.parse(readFileSync(pj, 'utf8')) as { name: string; exports?: unknown };
    for (const [key, target] of exportTargets(pkg.exports)) {
      const targets: [string, string][] = [];
      if (key.includes('*')) {
        // Only the styles package uses wildcards with a known set: the style ids.
        if (dir !== 'styles') continue;
        for (const id of styleIds()) targets.push([key.replace('*', id), target.replace('*', id)]);
      } else targets.push([key, target]);
      for (const [k, t] of targets) {
        if (t.endsWith('.d.ts') || t.endsWith('.json')) continue;
        const kind = t.endsWith('.css') ? 'css' : t.endsWith('.ts') || t.endsWith('.tsx') ? 'js' : undefined;
        if (!kind) continue;
        add({ pkg: pkg.name, entry: k === '.' ? pkg.name : `${pkg.name}/${k.replace(/^\.\//, '')}`, file: join(repo, 'packages', dir, t), kind, group: 'entry' });
      }
    }
  }
  const components = join(repo, 'packages/css/src/components');
  for (const f of readdirSync(components).filter((n) => n.endsWith('.css')).sort()) {
    add({ pkg: '@the-system/css', entry: `components/${f}`, file: join(components, f), kind: 'css', group: 'component' });
  }
  for (const id of styleIds()) {
    const recipes = join(repo, 'packages/styles', id, 'recipes');
    if (!existsSync(recipes)) continue;
    for (const f of readdirSync(recipes).filter((n) => n.endsWith('.css')).sort()) {
      add({ pkg: '@the-system/styles', entry: `${id}/recipes/${f}`, file: join(recipes, f), kind: 'css', group: 'recipe' });
    }
  }
  return entries;
}

const isBare = (id: string) => !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0') && !/^[A-Za-z]:[\\/]/.test(id);

async function bundle(e: Entry): Promise<{ code: string; error?: string }> {
  const result = await build({
    configFile: false,
    root: dirname(e.file),
    logLevel: 'silent',
    publicDir: false,
    // Angular sources use legacy decorators with parameter metadata.
    oxc: { decorator: { legacy: true, emitDecoratorMetadata: false } } as never,
    build: {
      write: false,
      minify: true,
      cssMinify: true,
      cssCodeSplit: e.kind === 'css',
      sourcemap: false,
      reportCompressedSize: false,
      emptyOutDir: false,
      assetsInlineLimit: 0,
      ...(e.kind === 'js' ? { lib: { entry: e.file, formats: ['es'] as const, fileName: 'entry' } } : {}),
      rollupOptions: {
        ...(e.kind === 'css' ? { input: e.file } : {}),
        external: (id: string) => e.kind === 'js' && isBare(id),
        onwarn: () => undefined,
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]) as Rollup.RollupOutput[];
  let code = '';
  for (const o of outputs) {
    for (const item of o.output) {
      if (e.kind === 'js' && item.type === 'chunk') code += item.code;
      if (e.kind === 'css' && item.type === 'asset' && item.fileName.endsWith('.css')) code += typeof item.source === 'string' ? item.source : Buffer.from(item.source).toString('utf8');
    }
  }
  return { code };
}

/** Raw source bytes: the entry file and, for CSS, its local @import chain; for JS, every local file reached. */
function rawBytes(file: string, kind: 'js' | 'css', seen = new Set<string>()): number {
  if (seen.has(file) || !existsSync(file) || !statSync(file).isFile()) return 0;
  seen.add(file);
  const text = readFileSync(file, 'utf8');
  let total = Buffer.byteLength(text);
  const re = kind === 'css' ? /@import\s+(?:url\()?['"]([^'"]+)['"]/g : /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g;
  for (const m of text.matchAll(re)) {
    const spec = m[1] ?? '';
    if (!spec.startsWith('.')) continue;
    const base = resolve(dirname(file), spec);
    const candidates = kind === 'css' ? [base] : [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx'), base.replace(/\.js$/, '.ts')];
    const hit = candidates.find((c) => existsSync(c) && statSync(c).isFile());
    if (hit) total += rawBytes(hit, kind, seen);
  }
  return total;
}

const kb = (n: number) => (n / 1024).toFixed(1);

/** The entries a whole web app loads, summed: the framework barrel, the component CSS, the tokens and the style packs. */
function appCost(results: Measured[]): string[] {
  const pick = (entry: string) => results.find((r) => r.entry === entry && !r.error);
  const shared = ['@the-system/css', '@the-system/tokens/css', '@the-system/styles', '@the-system/shared', '@the-system/motion', '@the-system/icons'];
  const lines: string[] = ['Every entry imported whole, before tree shaking, gzip sums. The other @the-system packages a barrel imports are counted once. Third party packages (react, radix-ui, react-aria-components, @angular/*) are not counted.', '', '| App | Entries | Gzip KB |', '| --- | --- | ---: |'];
  for (const [label, barrel, icons] of [['React', '@the-system/react', '@the-system/icons/react'], ['Angular', '@the-system/angular', '@the-system/icons/angular']] as const) {
    const names = [barrel, icons, ...shared];
    const found = names.map(pick).filter((r): r is Measured => Boolean(r));
    lines.push(`| ${label} | ${found.map((r) => `\`${r.entry}\``).join(', ')} | ${kb(found.reduce((n, r) => n + r.gzip, 0))} |`);
  }
  return lines;
}

function table(rows: Measured[], withPkg = false): string[] {
  const head = withPkg ? '| Entry | Kind | Source KB | Minified KB | Gzip KB |' : '| File | Source KB | Minified KB | Gzip KB |';
  const sep = withPkg ? '| --- | --- | ---: | ---: | ---: |' : '| --- | ---: | ---: | ---: |';
  return [
    head,
    sep,
    ...rows.map((r) =>
      withPkg
        ? `| \`${r.entry}\` | ${r.kind} | ${kb(r.raw)} | ${r.error ? 'error' : kb(r.min)} | ${r.error ? r.error : kb(r.gzip)} |`
        : `| \`${r.entry}\` | ${kb(r.raw)} | ${kb(r.min)} | ${kb(r.gzip)} |`,
    ),
  ];
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const entries = findEntries();
  console.log(`size: ${entries.length} entries (${entries.filter((e) => e.kind === 'js').length} JS, ${entries.filter((e) => e.kind === 'css').length} CSS).`);
  const results: Measured[] = [];
  for (const e of entries) {
    try {
      const { code } = await bundle(e);
      const buf = Buffer.from(code, 'utf8');
      results.push({ ...e, raw: rawBytes(e.file, e.kind), min: buf.length, gzip: gzipSync(buf, { level: 9 }).length });
    } catch (err) {
      const msg = err instanceof Error ? err.message.split('\n')[0] ?? 'error' : String(err);
      results.push({ ...e, raw: rawBytes(e.file, e.kind), min: 0, gzip: 0, error: msg.slice(0, 120) });
      console.log(`  error ${e.entry}: ${msg}`);
    }
  }
  const entryRows = results.filter((r) => r.group === 'entry');
  const components = results.filter((r) => r.group === 'component').sort((a, b) => b.gzip - a.gzip);
  const recipes = results.filter((r) => r.group === 'recipe').sort((a, b) => b.gzip - a.gzip);
  const top = [...results].filter((r) => !r.error).sort((a, b) => b.gzip - a.gzip).slice(0, 10);
  const sum = (rs: Measured[], k: 'raw' | 'min' | 'gzip') => rs.reduce((n, r) => n + r[k], 0);
  const errors = results.filter((r) => r.error);

  const lines = [
    '# Size report, wave 1',
    '',
    'Made by `npx tsx scripts/size.ts`. Each public entry is built the way a consumer bundler would build it: vite library mode, ES output, minified, every bare import kept external (react, radix-ui, react-aria-components, @angular/*, and the other @the-system packages), so a number counts that entry alone. CSS entries are bundled with their local `@import` chain inlined and minified; fonts and images behind `url()` are not counted. Gzip is level 9. Source KB is the entry file and every local file it reaches, comments included.',
    '',
    'Angular entries are compiled without the Angular compiler (decorators stay runtime calls, templates stay strings), so they read close to an AOT build, not equal to it. A barrel number is the whole barrel; an app that imports a few components pays less after tree shaking.',
    '',
    `${entries.length} entries measured: ${entryRows.length} package entries, ${components.length} component CSS files, ${recipes.length} style recipe files.${errors.length ? ` ${errors.length} could not be built (listed in the tables).` : ''}`,
    '',
    '## What an app pays',
    '',
    ...appCost(results),
    '',
    '## The ten largest, by gzip',
    '',
    ...table(top, true),
    '',
    '## Package entries',
    '',
    ...table([...entryRows].sort((a, b) => a.entry.localeCompare(b.entry)), true),
    '',
    `## Component CSS files (${components.length})`,
    '',
    `Each file of \`packages/css/src/components\` minified and gzipped on its own. Total: ${kb(sum(components, 'min'))} KB minified, ${kb(sum(components, 'gzip'))} KB gzip as separate files (one bundle compresses better: see \`@the-system/css\` above).`,
    '',
    ...table(components),
    '',
    `## Style recipe files (${recipes.length})`,
    '',
    ...table(recipes),
    '',
  ];
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, lines.join('\n'));
  const json = results.map(({ file, ...r }) => ({ ...r, file: relative(repo, file) }));
  writeFileSync(args.json, `${JSON.stringify({ gzipLevel: 9, results: json }, null, 2)}\n`);
  console.log(`Ten largest by gzip:`);
  for (const r of top) console.log(`  ${kb(r.gzip).padStart(7)} KB  ${r.entry}`);
  console.log(`Report: ${relative(repo, args.out)}, ${relative(repo, args.json)} (${basename(args.json)})`);
  return errors.length ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
