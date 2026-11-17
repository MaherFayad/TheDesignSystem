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
// and never published. A named import of a package barrel that only holds
// `export * from` lines (`@the-system/shared`, `@the-system/motion`) is first
// split into one import per source file, so an installed component reaches
// only the files it uses and the barrel itself never ships.
//
// Core holds the shared files. A shared file whose import closure reaches an
// npm package (date.ts and @internationalized/date) gets its own lib item,
// `<package>-<file>`, and only the items whose files import it depend on it.
// So a Kbd never installs a calendar library. Each component `index.ts` also gets one side effect
// import of its CSS file, and each CSS file starts with the layer order, so a
// component looks right whatever order the files load in.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import ts from 'typescript';

export const SCHEMA_URL = 'https://ui.shadcn.com/schema/registry.json';
export const ITEM_SCHEMA_URL = 'https://ui.shadcn.com/schema/registry-item.json';

/** The layer order every system CSS file assumes. Equal to the line in tokens.css. */
export const LAYER_ORDER = '@layer ds.reset, ds.tokens, ds.base, ds.platform, ds.recipes, ds.chrome, ds.overrides;';

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

/** True when every statement of the file is `export * from '<relative>'`. */
function isStarBarrel(file: string): boolean {
  if (!/\.tsx?$/.test(file)) return false;
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, false);
  return (
    sf.statements.length > 0 &&
    sf.statements.every(
      (st) => ts.isExportDeclaration(st) && !st.exportClause && !st.isTypeOnly && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier) && st.moduleSpecifier.text.startsWith('.'),
    )
  );
}

/** Every name a module exports, mapped to the file that declares it. Follows `export *` and re-exports with a source. */
function exportMap(root: string, file: string, scope: string, cache: Map<string, Map<string, string>>): Map<string, string> {
  const hit = cache.get(file);
  if (hit) return hit;
  const out = new Map<string, string>();
  cache.set(file, out);
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, false);
  const add = (name: string, from: string) => {
    const was = out.get(name);
    if (was && was !== from) throw new Error(`${relative(root, file)} exports ${name} from two files`);
    out.set(name, from);
  };
  // Local names that came in through an import, so `export { name }` can follow them.
  const imported = new Map<string, { from: string; name: string }>();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const bindings = st.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const from = resolveSpecifier(root, file, st.moduleSpecifier.text, scope);
    if (!from) continue;
    for (const el of bindings.elements) imported.set(el.name.text, { from, name: (el.propertyName ?? el.name).text });
  }
  const origin = (target: string, name: string) => exportMap(root, target, scope, cache).get(name) ?? target;
  const hasExport = (st: ts.Statement) => ts.canHaveModifiers(st) && (ts.getModifiers(st) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st)) {
      const target = st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier) ? resolveSpecifier(root, file, st.moduleSpecifier.text, scope) : undefined;
      if (!st.exportClause) {
        if (target) for (const [n, f] of exportMap(root, target, scope, cache)) add(n, f);
      } else if (ts.isNamedExports(st.exportClause)) {
        for (const el of st.exportClause.elements) {
          // A renamed re-export cannot be split without renaming, so it stays with this file.
          const via = target ? { from: target, name: el.name.text } : imported.get(el.name.text);
          add(el.name.text, via && !el.propertyName && via.name === el.name.text ? origin(via.from, via.name) : file);
        }
      } else {
        add(st.exportClause.name.text, file);
      }
      continue;
    }
    if (ts.isExportAssignment(st)) {
      add('default', file);
      continue;
    }
    if (!hasExport(st)) continue;
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) add(d.name.text, file);
    } else if (
      (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isEnumDeclaration(st) || ts.isModuleDeclaration(st)) &&
      st.name
    ) {
      add(st.name.text, file);
    }
  }
  return out;
}

/** The workspace specifier of a package source file, for example `@the-system/shared/date`. */
function workspaceSpec(root: string, file: string, scope: string): string | undefined {
  const m = /^packages\/([^/]+)\/src\/(.*)\.tsx?$/.exec(toPosix(relative(root, file)));
  return m ? `${scope}/${m[1]}/${m[2]!.replace(/\/index$/, '')}` : undefined;
}

/**
 * Splits each named import or re-export of a workspace star barrel into one
 * statement per source file. Namespace imports and side effect imports of a
 * barrel are left alone (none exist today; the barrel would then ship whole).
 */
function splitBarrelImports(root: string, file: string, source: string, scope: string, cache: Map<string, Map<string, string>>): string {
  if (!/\.tsx?$/.test(file) || !source.includes(`${scope}/`)) return source;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const edits: { start: number; end: number; text: string }[] = [];
  for (const st of sf.statements) {
    const isImport = ts.isImportDeclaration(st);
    if (!isImport && !ts.isExportDeclaration(st)) continue;
    const specNode = st.moduleSpecifier;
    if (!specNode || !ts.isStringLiteral(specNode) || !specNode.text.startsWith(`${scope}/`)) continue;
    const target = resolveSpecifier(root, file, specNode.text, scope);
    if (!target || !isStarBarrel(target)) continue;
    let elements: readonly (ts.ImportSpecifier | ts.ExportSpecifier)[];
    let typeOnly: boolean;
    if (isImport) {
      const clause = st.importClause;
      if (!clause || clause.name || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
      elements = clause.namedBindings.elements;
      typeOnly = clause.isTypeOnly;
    } else {
      if (!st.exportClause || !ts.isNamedExports(st.exportClause)) continue;
      elements = st.exportClause.elements;
      typeOnly = st.isTypeOnly;
    }
    const names = exportMap(root, target, scope, cache);
    const bySource = new Map<string, string[]>();
    for (const el of elements) {
      const name = (el.propertyName ?? el.name).text;
      const from = names.get(name);
      if (!from) throw new Error(`${relative(root, file)} imports ${name} from ${specNode.text}, which does not export it`);
      const spec = workspaceSpec(root, from, scope);
      if (!spec) throw new Error(`No workspace specifier for ${relative(root, from)}`);
      bySource.set(spec, [...(bySource.get(spec) ?? []), el.getText(sf)]);
    }
    const keyword = `${isImport ? 'import' : 'export'}${typeOnly ? ' type' : ''}`;
    const text = [...bySource].map(([spec, els]) => `${keyword} { ${els.join(', ')} } from '${spec}';`).join('\n');
    edits.push({ start: st.getStart(sf), end: st.end, text });
  }
  let out = source;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
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

/** Which item a repo file belongs to, before lib files leave core. */
function baseOwnerOf(repoPath: string): string {
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
  const exportCache = new Map<string, Map<string, string>>();
  const visit = (file: string) => {
    if (files.has(file)) return;
    const source = splitBarrelImports(root, file, readFileSync(file, 'utf8'), scope, exportCache);
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

  // 2. A core file whose import closure reaches an npm package becomes its own
  //    lib item, so that package installs only with the items that use it.
  const npmReach = new Map<string, boolean>();
  const reachesNpm = (file: string, stack = new Set<string>()): boolean => {
    const known = npmReach.get(file);
    if (known !== undefined) return known;
    if (stack.has(file)) return false;
    stack.add(file);
    const info = files.get(file)!;
    const hit = info.imports.some((i) => (i.file ? reachesNpm(i.file, stack) : !PEERS.has(bareName(i.ref.spec))));
    stack.delete(file);
    npmReach.set(file, hit);
    return hit;
  };
  const libOwner = new Map<string, string>();
  for (const file of files.keys()) {
    const repoPath = toPosix(relative(root, file));
    if (baseOwnerOf(repoPath) !== 'core' || !reachesNpm(file)) continue;
    const m = /^packages\/([^/]+)\/(?:src\/)?(.*)\.tsx?$/.exec(repoPath);
    if (!m) throw new Error(`${repoPath} imports an npm package but is not a source file`);
    libOwner.set(repoPath, `lib:${m[1]}-${kebab(m[2]!.replace(/\//g, '-'))}`);
  }
  const ownerOf = (repoPath: string) => libOwner.get(toPosix(repoPath)) ?? baseOwnerOf(repoPath);

  // 3. Group files by owner and collect npm and registry dependencies.
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

  // 4. Turn a repo file into a registry file with rewritten imports.
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
    const [kind, name] = owner.split(':') as [string, string];
    return kind === 'lib' ? name : kebab(name);
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

  // Lib items: core files that bring an npm package, split by the step 2 rule.
  for (const owner of [...new Set(libOwner.values())].sort()) {
    const g = group(owner);
    const name = ownerToItem(owner);
    const targets = g.files.map((f) => `ds/${targetOf(toPosix(relative(root, f)))}`);
    items.push({
      name,
      type: 'registry:lib',
      title: name,
      description: `Shared logic in ${targets.join(', ')}, kept out of core because it imports ${[...g.npm].sort().join(', ') || 'a lib item'}. Only the items whose files import it depend on it.`,
      dependencies: npmList(g.npm),
      registryDependencies: [...new Set(['core', ...[...g.owners].map(ownerToItem)])].filter((d) => d !== name).sort().map(ref),
      files: g.files.map((f) => toRegistryFile(f, 'registry:lib')),
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
      registryDependencies: [ref('core'), ref(`style-${defaultStyle}`), ...[...g.owners].map(ownerToItem).filter((d) => d !== 'core').sort().map(ref)],
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
