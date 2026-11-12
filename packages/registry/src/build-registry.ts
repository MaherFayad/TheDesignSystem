// Builds the shadcn registry of the system from the manifests and the source
// folders. Checked against the shadcn schemas of 2026-11-12 (shadcn 4.23.0),
// copied to `packages/registry/schema/`.
//
// Layout in a consumer project. Every file lands under one folder, `ds/`,
// inside the consumer's components alias, with the repo layout kept:
//
//   ds/ds.css                          reset, base and the layer order
//   ds/style-<id>.css                  one style: tokens, fonts, recipes
//   ds/react/components/<Name>/...     one component
//   ds/react/theme/...                 Theme, Bidi, hooks
//   ds/css/components/<Name>.css       the component CSS
//   ds/shared, ds/icons, ds/motion, ds/styles, ds/tokens
//
// Because the tree is kept, relative imports between components work as they
// are. Imports of the workspace packages (`@the-system/shared` and so on) are
// rewritten to relative paths into `ds/`, since those packages are private
// and never published. Each component `index.ts` also gets one side effect
// import of its CSS file, and each CSS file starts with the layer order, so a
// component looks right whatever order the files load in.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import ts from 'typescript';

export const SCHEMA_URL = 'https://ui.shadcn.com/schema/registry.json';
export const ITEM_SCHEMA_URL = 'https://ui.shadcn.com/schema/registry-item.json';

/** The layer order every system CSS file assumes. Equal to the line in tokens.css. */
export const LAYER_ORDER = '@layer ds.reset, ds.tokens, ds.base, ds.platform, ds.recipes, ds.overrides;';

/** Folder inside the consumer's components alias that holds every file. */
export const TARGET_ROOT = '@components/ds';

export interface RegistryFile {
  path: string;
  type: 'registry:ui' | 'registry:lib' | 'registry:style' | 'registry:block' | 'registry:component' | 'registry:file';
  target: string;
  content?: string;
}

export interface RegistryItem {
  $schema?: string;
  name: string;
  type: 'registry:ui' | 'registry:lib' | 'registry:style' | 'registry:block';
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  extends?: string;
  docs?: string;
  categories?: string[];
  meta: Record<string, unknown>;
}

export interface Registry {
  $schema: string;
  name: string;
  homepage: string;
  items: RegistryItem[];
}

export interface BuildOptions {
  /** Repo root. */
  root: string;
}

export interface BuildResult {
  /** The catalog, without file contents. */
  registry: Registry;
  /** Every item with its file contents, as `shadcn add` reads it. */
  items: RegistryItem[];
  /** The namespace consumers register in components.json, for example `@ds`. */
  namespace: string;
  warnings: string[];
}

interface Manifest {
  name: string;
  kind: 'component' | 'pattern' | 'template';
  family: string;
  summary: string;
  since: string;
  uses?: string[];
  frameworks: { react: { status: string } };
}

interface Config {
  name: string;
  scope: string;
  cssPrefix: string;
  cliName: string;
  version: string;
}

/** The gallery slug rule from scripts/gen-index.ts, so item names equal `/c/<slug>`. */
export function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const toPosix = (p: string) => p.split(sep).join('/');

/** Repo path of a source file to its path under `ds/` in the consumer. */
export function targetOf(repoPath: string): string {
  const p = toPosix(repoPath);
  const m = /^packages\/([^/]+)\/(.*)$/.exec(p);
  if (!m) throw new Error(`No target for ${p}`);
  const [, pkg, rest] = m as unknown as [string, string, string];
  if (pkg === 'tokens') return `tokens/${rest.replace(/^dist\/css\//, '')}`;
  if (pkg === 'registry') return rest.replace(/^files\//, '');
  return `${pkg}/${rest.replace(/^src\//, '')}`;
}

const PRIVATE_FILE = /\.(test|demo|spec)\.tsx?$/;

/** Resolves an import specifier to a repo file, or undefined for an npm package. */
function resolveSpecifier(root: string, fromFile: string, spec: string, scope: string): string | undefined {
  const tryFile = (base: string) => {
    for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
      const f = base + ext;
      if (existsSync(f) && statSync(f).isFile()) return f;
    }
    return undefined;
  };
  if (spec.startsWith('.')) {
    const f = tryFile(join(dirname(fromFile), spec));
    if (!f) throw new Error(`Cannot resolve ${spec} from ${relative(root, fromFile)}`);
    return f;
  }
  if (!spec.startsWith(`${scope}/`)) return undefined;
  const [pkg, ...sub] = spec.slice(scope.length + 1).split('/');
  const pkgDir = join(root, 'packages', pkg!);
  const subPath = sub.join('/');
  let f: string | undefined;
  if (pkg === 'styles') {
    if (subPath === 'registry') f = join(pkgDir, 'registry.gen.ts');
    else f = tryFile(join(pkgDir, subPath));
  } else {
    f = tryFile(join(pkgDir, 'src', subPath));
  }
  if (!f) throw new Error(`Cannot resolve ${spec} from ${relative(root, fromFile)}`);
  return f;
}

interface ImportRef {
  spec: string;
  pos: number;
  end: number;
}

function importsOf(source: string): ImportRef[] {
  const info = ts.preProcessFile(source, true, true);
  // The reported position is not always the first character of the name, so
  // find the quoted literal from just before it.
  return info.importedFiles.map((f) => {
    for (const q of ["'", '"']) {
      const at = source.indexOf(`${q}${f.fileName}${q}`, Math.max(0, f.pos - 2));
      if (at !== -1 && at <= f.pos + 1) return { spec: f.fileName, pos: at + 1, end: at + 1 + f.fileName.length };
    }
    throw new Error(`Cannot place import ${f.fileName}`);
  });
}

function bareName(spec: string): string {
  const parts = spec.split('/');
  return spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]!;
}

function relSpec(fromTarget: string, toTarget: string): string {
  let r = posix.relative(posix.dirname(fromTarget), toTarget).replace(/\.tsx?$/, '');
  if (!r.startsWith('.')) r = `./${r}`;
  return r;
}

/** Which item a repo file belongs to. */
function ownerOf(repoPath: string): string {
  const p = toPosix(repoPath);
  let m = /^packages\/react\/src\/components\/([^/]+)\//.exec(p);
  if (m) return `component:${m[1]}`;
  m = /^packages\/react\/src\/templates\/([^/]+)\//.exec(p);
  if (m) return `template:${m[1]}`;
  if (/^packages\/react\/src\/(theme|internal)\//.test(p)) return 'theme';
  if (/^packages\/(shared|icons|motion|styles)\//.test(p)) return 'core';
  throw new Error(`File outside the registry layout: ${p}`);
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function dependencyVersions(root: string): Map<string, string> {
  const versions = new Map<string, string>();
  for (const pkg of ['react', 'styles', 'icons', 'motion', 'shared']) {
    const json = readJson<{ dependencies?: Record<string, string> }>(join(root, 'packages', pkg, 'package.json'));
    for (const [k, v] of Object.entries(json.dependencies ?? {})) {
      if (!k.startsWith('@the-system/')) versions.set(k, v);
    }
  }
  return versions;
}

const PEERS = new Set(['react', 'react-dom']);

export function buildRegistry({ root }: BuildOptions): BuildResult {
  const config = readJson<Config>(join(root, 'ds.config.json'));
  const scope = config.scope;
  const namespace = `@${config.cssPrefix}`;
  const ref = (name: string) => `${namespace}/${name}`;
  const versions = dependencyVersions(root);
  const warnings: string[] = [];

  const manifests = readJson<Manifest[]>(join(root, 'packages/manifest/manifests.gen.json'));
  const reactReady = manifests.filter((m) => m.frameworks.react.status === 'ready');
  const componentDir = (name: string) => join(root, 'packages/react/src/components', name);

  // 1. Walk the import graph from every entry point, so a file ships only if
  //    some entry reaches it (demo helpers and tests never ship).
  const files = new Map<string, { source: string; imports: { ref: ImportRef; file?: string }[] }>();
  const visit = (file: string) => {
    if (files.has(file)) return;
    const source = readFileSync(file, 'utf8');
    if (file.endsWith('.json')) {
      files.set(file, { source, imports: [] });
      return;
    }
    const imports = importsOf(source).map((ref) => ({ ref, file: resolveSpecifier(root, file, ref.spec, scope) }));
    files.set(file, { source, imports });
    for (const i of imports) {
      if (!i.file) continue;
      if (PRIVATE_FILE.test(i.file)) throw new Error(`${relative(root, file)} imports a test or demo file`);
      visit(i.file);
    }
  };

  const entries: { manifest: Manifest; entry?: string }[] = [];
  for (const m of reactReady) {
    if (m.kind === 'component') {
      if (m.name === 'Theme' || m.name === 'Bidi') {
        entries.push({ manifest: m });
        continue;
      }
      const entry = join(componentDir(m.name), 'index.ts');
      if (!existsSync(entry)) {
        warnings.push(`${m.name}: react is ready but ${relative(root, entry)} is missing`);
        continue;
      }
      entries.push({ manifest: m, entry });
    } else if (m.kind === 'template') {
      const entry = join(root, 'packages/react/src/templates', m.name, 'index.ts');
      if (!existsSync(entry)) {
        warnings.push(`${m.name}: template has no ${relative(root, entry)}`);
        continue;
      }
      entries.push({ manifest: m, entry });
    }
  }
  const themeEntry = join(root, 'packages/react/src/theme/index.ts');
  visit(themeEntry);
  for (const e of entries) if (e.entry) visit(e.entry);

  // 2. Group files by owner and collect npm and registry dependencies.
  interface Group {
    files: string[];
    npm: Set<string>;
    owners: Set<string>;
  }
  const groups = new Map<string, Group>();
  const group = (owner: string) => {
    let g = groups.get(owner);
    if (!g) groups.set(owner, (g = { files: [], npm: new Set(), owners: new Set() }));
    return g;
  };
  for (const [file, info] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    const owner = ownerOf(relative(root, file));
    const g = group(owner);
    g.files.push(file);
    for (const i of info.imports) {
      if (i.file) {
        const other = ownerOf(relative(root, i.file));
        if (other !== owner) g.owners.add(other);
      } else {
        const name = bareName(i.ref.spec);
        if (PEERS.has(name)) continue;
        if (!versions.has(name)) throw new Error(`${relative(root, file)} imports ${name}, which no package declares`);
        g.npm.add(name);
      }
    }
  }

  // 3. Turn a repo file into a registry file with rewritten imports.
  const toRegistryFile = (file: string, type: RegistryFile['type'], extraImport?: string): RegistryFile => {
    const repoPath = toPosix(relative(root, file));
    const target = targetOf(repoPath);
    const info = files.get(file);
    let content = info?.source ?? readFileSync(file, 'utf8');
    if (info) {
      // Rewrite from the end so earlier positions stay valid.
      for (const i of [...info.imports].sort((a, b) => b.ref.pos - a.ref.pos)) {
        if (!i.file || i.ref.spec.startsWith('.')) continue;
        const to = targetOf(toPosix(relative(root, i.file)));
        content = content.slice(0, i.ref.pos) + relSpec(target, to) + content.slice(i.ref.end);
      }
    }
    if (file.endsWith('.css')) content = `${LAYER_ORDER}\n${content}`;
    if (extraImport) content = `${content.trimEnd()}\nimport '${relSpec(target, extraImport)}';\n`;
    return { path: repoPath, type, target: `${TARGET_ROOT}/${target}`, content };
  };

  const ownerToItem = (owner: string): string => {
    if (owner === 'core' || owner === 'theme') return owner;
    const [, name] = owner.split(':') as [string, string];
    return kebab(name);
  };

  const npmList = (set: Iterable<string>) =>
    [...new Set(set)].sort().map((n) => `${n}@${versions.get(n)}`);

  const items: RegistryItem[] = [];
  const styleIds = readdirSync(join(root, 'packages/styles'))
    .filter((d) => existsSync(join(root, 'packages/styles', d, 'style.json')))
    .sort();
  const defaultStyle = 'studio';

  // Core: shared logic, icons, motion, style data, reset and base CSS.
  {
    const g = group('core');
    const coreCss = ['packages/css/src/reset.css', 'packages/css/src/base.css'].map((p) => join(root, p));
    const entryCss: RegistryFile = {
      path: 'packages/registry/files/ds.css',
      type: 'registry:file',
      target: `${TARGET_ROOT}/ds.css`,
      content: `${LAYER_ORDER}\n/* The system: import once at the app root, before any style. */\n@import './css/reset.css';\n@import './css/base.css';\n`,
    };
    items.push({
      name: 'core',
      type: 'registry:lib',
      title: 'Core',
      description: 'Shared logic, icons, motion patterns, style data, the reset and the base CSS. Every other item needs it.',
      dependencies: npmList(g.npm),
      files: [entryCss, ...coreCss.map((f) => toRegistryFile(f, 'registry:file')), ...g.files.map((f) => toRegistryFile(f, 'registry:lib'))],
      docs: 'Import ds/ds.css and one ds/style-<id>.css once at the app root. Dialog and Tooltip read process.env.NODE_ENV: in a Vite app add "node" to compilerOptions.types.',
      categories: ['core'],
      meta: { source: config.name, version: config.version },
    });
  }

  // Theme: the Theme provider, Bidi and the hooks every component reads.
  {
    const g = group('theme');
    items.push({
      name: 'theme',
      type: 'registry:ui',
      title: 'Theme',
      description: reactReady.find((m) => m.name === 'Theme')?.summary ?? 'The theme provider.',
      dependencies: npmList(g.npm),
      registryDependencies: [ref('core'), ref(`style-${defaultStyle}`)],
      files: g.files.map((f) => toRegistryFile(f, 'registry:ui')),
      docs: 'Wrap the app in Theme. Its style prop picks the style; add that style item too.',
      categories: ['foundations'],
      meta: { manifest: 'Theme', framework: 'react' },
    });
  }

  // One registry:style item per style pack.
  for (const id of styleIds) {
    const dir = join(root, 'packages/styles', id);
    const style = readJson<{ name?: string; status?: string }>(join(dir, 'style.json'));
    const tokensCss = join(root, 'packages/tokens/dist/css', `${id}.css`);
    if (!existsSync(tokensCss)) throw new Error(`${relative(root, tokensCss)} is missing. Run the token build first.`);
    const recipes = existsSync(join(dir, 'recipes'))
      ? readdirSync(join(dir, 'recipes')).filter((f) => f.endsWith('.css')).sort().map((f) => join(dir, 'recipes', f))
      : [];
    const cssFiles = [join(dir, 'index.css'), ...(existsSync(join(dir, 'fonts.css')) ? [join(dir, 'fonts.css')] : []), ...recipes];
    const fontDeps = new Set<string>();
    for (const f of cssFiles) {
      for (const m of readFileSync(f, 'utf8').matchAll(/@import\s+'([^.'][^']*)'/g)) fontDeps.add(bareName(m[1]!));
    }
    const entry: RegistryFile = {
      path: `packages/registry/files/style-${id}.css`,
      type: 'registry:file',
      target: `${TARGET_ROOT}/style-${id}.css`,
      content: `${LAYER_ORDER}\n/* The ${style.name ?? id} style: tokens, fonts and recipes. Import after ds.css. */\n@import './tokens/${id}.css';\n@import './styles/${id}/index.css';\n`,
    };
    items.push({
      name: `style-${id}`,
      type: 'registry:style',
      title: `${style.name ?? id} style`,
      description: `Tokens for dark and light, fonts and recipes of the ${style.name ?? id} style${style.status === 'proposed' ? '. Status: proposed, waiting for the owner' : ''}.`,
      dependencies: npmList(fontDeps),
      registryDependencies: [ref('core')],
      files: [entry, toRegistryFile(tokensCss, 'registry:file'), ...cssFiles.map((f) => toRegistryFile(f, 'registry:file'))],
      extends: 'none',
      docs: `Import ds/style-${id}.css after ds/ds.css, and set style="${id}" on Theme.`,
      categories: ['style'],
      meta: { style: id, status: style.status ?? 'stable' },
    });
  }

  // One item per React component and template.
  for (const { manifest: m, entry } of entries) {
    if (m.name === 'Theme') continue;
    const name = kebab(m.name);
    if (m.name === 'Bidi') {
      items.push({
        name,
        type: 'registry:ui',
        title: m.name,
        description: m.summary,
        registryDependencies: [ref('theme')],
        files: [],
        docs: 'Bidi ships inside the theme item. Import it from ds/react/theme.',
        categories: [m.family],
        meta: { manifest: m.name, framework: 'react', since: m.since },
      });
      continue;
    }
    const owner = `${m.kind === 'template' ? 'template' : 'component'}:${m.name}`;
    const g = group(owner);
    const cssFile = join(root, 'packages/css/src/components', `${m.name}.css`);
    const hasCss = existsSync(cssFile);
    const cssTarget = hasCss ? targetOf(toPosix(relative(root, cssFile))) : undefined;
    const fileType = m.kind === 'template' ? 'registry:block' : 'registry:ui';
    const regFiles = g.files.map((f) => toRegistryFile(f, fileType, f === entry ? cssTarget : undefined));
    if (hasCss) regFiles.push(toRegistryFile(cssFile, 'registry:file'));
    const deps = [...g.owners].map(ownerToItem);
    if (!deps.includes('theme')) deps.push('theme');
    for (const used of m.uses ?? []) deps.push(kebab(used));
    items.push({
      name,
      type: m.kind === 'template' ? 'registry:block' : 'registry:ui',
      title: m.name,
      description: m.summary,
      dependencies: npmList(g.npm),
      registryDependencies: [...new Set(deps)].filter((d) => d !== name).sort().map(ref),
      files: regFiles,
      categories: [m.family],
      meta: { manifest: m.name, framework: 'react', since: m.since },
    });
  }

  for (const item of items) {
    if (item.dependencies?.length === 0) delete item.dependencies;
    if (item.registryDependencies?.length === 0) delete item.registryDependencies;
  }

  const registry: Registry = {
    $schema: SCHEMA_URL,
    name: config.scope.replace(/^@/, ''),
    homepage: '/',
    items: items.map((item) => ({ ...item, files: item.files.map(({ content: _content, ...rest }) => rest) })),
  };
  return { registry, items: items.map((item) => ({ $schema: ITEM_SCHEMA_URL, ...item })), namespace, warnings };
}
