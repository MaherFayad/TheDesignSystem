// ds add <name> --framework react|angular|native
//
// React: resolves the registry item of order 1.13 and every item it depends
// on, and writes their files into the app (the same files `shadcn add` writes).
// Angular and native: copies the component folder from the package and prints
// the CSS and theme imports.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { buildRegistry, type RegistryItem } from '@the-system/registry';
import { findManifest, kebab, REPO, type Framework, type Manifest } from '../manifests';
import { CliError, ok, type Result } from '../output';

export interface AddOptions {
  name: string;
  framework: Framework;
  /** The app folder. */
  cwd: string;
  /** Where the files go. React: the folder that gets `ds/`, default the components alias of components.json, else src/components. Angular and native: default src/ds/<framework>. */
  dir?: string;
  /** A served registry, for example http://localhost:4000/r. Default: build from this repo. */
  registry?: string;
  overwrite?: boolean;
  dryRun?: boolean;
}

export interface AddedFile {
  path: string;
  status: 'written' | 'unchanged' | 'conflict' | 'planned';
}

export interface AddData {
  name: string;
  framework: Framework;
  items: string[];
  files: AddedFile[];
  dependencies: string[];
  install: string | null;
  imports: string[];
  shadcn: string | null;
}

/** The components folder from components.json (`@/components` maps to src/components). */
export function componentsDir(cwd: string): string {
  const file = join(cwd, 'components.json');
  if (existsSync(file)) {
    const json = JSON.parse(readFileSync(file, 'utf8')) as { aliases?: { components?: string } };
    const alias = json.aliases?.components;
    if (alias?.startsWith('@/')) return join(existsSync(join(cwd, 'src')) ? 'src' : '.', alias.slice(2));
    if (alias?.startsWith('~/')) return alias.slice(2);
  }
  return join('src', 'components');
}

async function loadItems(registry: string | undefined, wanted: string): Promise<Map<string, RegistryItem>> {
  const items = new Map<string, RegistryItem>();
  if (!registry) {
    for (const item of buildRegistry({ root: REPO }).items) items.set(item.name, item);
    return items;
  }
  const fetchItem = async (name: string) => {
    const url = `${registry.replace(/\/$/, '')}/${name}.json`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (e) {
      throw new CliError('DS_E_REGISTRY', `Cannot reach ${url}: ${(e as Error).message}`);
    }
    if (!res.ok) throw new CliError('DS_E_REGISTRY', `${url} answered ${res.status}`);
    return (await res.json()) as RegistryItem;
  };
  const queue = [wanted];
  while (queue.length) {
    const name = queue.shift()!;
    if (items.has(name)) continue;
    const item = await fetchItem(name);
    items.set(name, item);
    for (const d of item.registryDependencies ?? []) queue.push(d.replace(/^@[^/]+\//, ''));
  }
  return items;
}

function closure(items: Map<string, RegistryItem>, name: string, out: string[] = []): string[] {
  if (out.includes(name)) return out;
  const item = items.get(name);
  if (!item) throw new CliError('DS_E_REGISTRY', `The registry has no item "${name}"`);
  out.push(name);
  for (const d of item.registryDependencies ?? []) closure(items, d.replace(/^@[^/]+\//, ''), out);
  return out;
}

function writeFile(abs: string, content: string, cwd: string, o: AddOptions): AddedFile {
  const path = relative(cwd, abs).split('\\').join('/');
  if (o.dryRun) return { path, status: 'planned' };
  if (existsSync(abs)) {
    const now = readFileSync(abs, 'utf8');
    if (now === content) return { path, status: 'unchanged' };
    if (!o.overwrite) return { path, status: 'conflict' };
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  return { path, status: 'written' };
}

async function addReact(m: Manifest, o: AddOptions, cwd: string): Promise<AddData> {
  const name = m.name === 'Theme' ? 'theme' : kebab(m.name);
  const items = await loadItems(o.registry, name);
  const names = closure(items, name);
  const dir = resolve(cwd, o.dir ?? componentsDir(cwd));
  const files: AddedFile[] = [];
  const deps = new Set<string>();
  for (const n of names) {
    const item = items.get(n)!;
    for (const d of item.dependencies ?? []) deps.add(d);
    for (const f of item.files) {
      const target = f.target.replace(/^@components\//, '');
      files.push(writeFile(join(dir, target), f.content ?? '', cwd, o));
    }
  }
  files.push(excludeFromDoctor(cwd, join(dir, 'ds'), o));
  const missing = [...deps].filter((d) => !installed(cwd, d.replace(/@[^@/]*$/, '')));
  // Import paths as written from a file in src/, the usual home of main.tsx.
  const from = existsSync(join(cwd, 'src')) ? join(cwd, 'src') : cwd;
  let rel = relative(from, dir).split('\\').join('/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return {
    name: m.name,
    framework: 'react',
    items: names,
    files,
    dependencies: [...deps].sort(),
    install: missing.length ? `npm install ${missing.sort().join(' ')}` : null,
    imports: [
      `import '${rel}/ds/ds.css';  // once, at the app root`,
      `import '${rel}/ds/style-studio.css';  // or another style`,
      `import { Theme } from '${rel}/ds/react/theme';`,
      `import { ${m.name} } from '${rel}/ds/react/${m.name === 'Theme' || m.name === 'Bidi' ? 'theme' : `components/${m.name}`}';`,
    ],
    shadcn: `npx shadcn@4.23.0 add @ds/${name}`,
  };
}

/**
 * The copied system code follows the system rules from the inside (it imports
 * radix-ui, it renders the native button), so the app's doctor skips it.
 * Merges the folder into `exclude` of ds.doctor.json, the doctor's config file.
 */
function excludeFromDoctor(cwd: string, dsDir: string, o: AddOptions): AddedFile {
  const file = join(cwd, 'ds.doctor.json');
  const folder = relative(cwd, dsDir).split('\\').join('/');
  const config = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as { exclude?: string[] }) : {};
  if (config.exclude?.includes(folder)) return { path: 'ds.doctor.json', status: o.dryRun ? 'planned' : 'unchanged' };
  const next = { ...config, exclude: [...(config.exclude ?? []), folder] };
  return writeFile(file, `${JSON.stringify(next, null, 2)}\n`, cwd, { ...o, overwrite: true });
}

function installed(cwd: string, pkg: string): boolean {
  const file = join(cwd, 'package.json');
  if (!existsSync(file)) return false;
  const json = JSON.parse(readFileSync(file, 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  return Boolean(json.dependencies?.[pkg] ?? json.devDependencies?.[pkg]);
}

/**
 * The folder and every file it reaches through relative imports (theme,
 * internal helpers, other components), so the copy compiles on its own.
 * Imports of the @the-system packages stay: the app installs those.
 */
function closureOf(entry: string, pkgSrc: string): string[] {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const { fileName } of ts.preProcessFile(readFileSync(file, 'utf8'), true, true).importedFiles) {
      if (!fileName.startsWith('.')) continue;
      const base = join(dirname(file), fileName);
      const hit = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'].map((e) => base + e).find((f) => existsSync(f) && statSync(f).isFile());
      if (!hit) throw new CliError('DS_E_NOT_FOUND', `${relative(REPO, file)} imports ${fileName}, which is missing`);
      if (!hit.startsWith(pkgSrc) || /\.(spec|test|demo)\.tsx?$/.test(hit)) throw new CliError('DS_E_NOT_FOUND', `${relative(REPO, file)} imports ${fileName} outside the shippable files`);
      visit(hit);
    }
  };
  visit(entry);
  return [...seen];
}

function addCopy(m: Manifest, o: AddOptions, cwd: string): AddData {
  const framework = o.framework;
  const folder = framework === 'angular' ? kebab(m.name) : m.name;
  const src = join(REPO, 'packages', framework, 'src/components', folder);
  if (!existsSync(src)) throw new CliError('DS_E_NOT_FOUND', `${m.name} is ready for ${framework}, but ${relative(REPO, src)} is missing`);
  const pkgSrc = join(REPO, 'packages', framework, 'src');
  const dir = resolve(cwd, o.dir ?? join('src', 'ds', framework));
  const files = closureOf(join(src, 'index.ts'), pkgSrc)
    .sort()
    .map((abs) => writeFile(join(dir, relative(pkgSrc, abs)), readFileSync(abs, 'utf8'), cwd, o));
  const imports =
    framework === 'angular'
      ? [
          "@import '@the-system/tokens/css';  /* styles.css: tokens for every style */",
          "@import '@the-system/css';         /* reset, base, components */",
          "@import '@the-system/styles';      /* recipes for every style */",
          `<div dsTheme="studio" scheme="dark">...</div>  <!-- the root theme -->`,
        ]
      : [
          "import { ThemeProvider } from '@the-system/native';",
          '<ThemeProvider style="studio" scheme="dark">...</ThemeProvider>',
        ];
  return {
    name: m.name,
    framework,
    items: [m.name],
    files,
    dependencies: framework === 'angular' ? ['@the-system/angular', '@the-system/css', '@the-system/tokens', '@the-system/styles'] : ['@the-system/native', '@the-system/tokens'],
    install: null,
    imports,
    shadcn: null,
  };
}

export async function add(o: AddOptions): Promise<Result<AddData>> {
  const m = findManifest(o.name);
  const block = m.frameworks[o.framework];
  if (block.status === 'not-applicable') {
    throw new CliError('DS_E_FRAMEWORK', `${m.name} does not exist for ${o.framework}${block.note ? `: ${block.note}` : '.'}`, { status: block.status });
  }
  if (block.status !== 'ready') {
    const readyIn = (['react', 'angular', 'native'] as const).filter((f) => m.frameworks[f].status === 'ready');
    throw new CliError('DS_E_NOT_READY', `${m.name} is ${block.status} for ${o.framework}. Ready for: ${readyIn.join(', ') || 'none'}.`, { status: block.status, readyIn });
  }
  const cwd = resolve(o.cwd);
  const data = o.framework === 'react' ? await addReact(m, o, cwd) : addCopy(m, o, cwd);
  const conflicts = data.files.filter((f) => f.status === 'conflict');
  const count = (s: AddedFile['status']) => data.files.filter((f) => f.status === s).length;
  const lines = [
    `${m.name} for ${o.framework}: ${count('written')} written, ${count('unchanged')} unchanged, ${conflicts.length} conflicts${o.dryRun ? `, ${count('planned')} planned` : ''}.`,
    ...conflicts.map((f) => `  conflict ${f.path} (differs; pass --overwrite to replace)`),
    ...(data.install ? ['', 'Install:', `  ${data.install}`] : []),
    '',
    'Imports:',
    ...data.imports.map((i) => `  ${i}`),
  ];
  if (conflicts.length) {
    return ok('add.result', data, `${lines.join('\n')}\n`, 1);
  }
  return ok('add.result', data, `${lines.join('\n')}\n`);
}
