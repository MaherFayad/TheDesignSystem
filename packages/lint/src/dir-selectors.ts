// Counts `:dir()` selectors in the CSS a build reads and in the CSS it
// writes, for the gallery build gate (wave-1-followups.md, round 5 item 1).
// With a CSS target older than `:dir()` support the minifier rewrites
// `:dir(rtl)` into a `:lang(ar, he, ...)` list, which is wrong for a
// `dir="ltr"` island on an Arabic page. Fewer `:dir()` in the output than in
// the source means that happened.
//
// Node only, no test framework imports.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { stripCssComments } from './util';

export interface DirCounts {
  rtl: number;
  ltr: number;
}

/** The `:dir(rtl)` and `:dir(ltr)` selectors in a stylesheet, comments left out. */
export function countDir(css: string): DirCounts {
  const src = stripCssComments(css);
  return {
    rtl: [...src.matchAll(/:dir\(\s*rtl\s*\)/gi)].length,
    ltr: [...src.matchAll(/:dir\(\s*ltr\s*\)/gi)].length,
  };
}

export function addCounts(a: DirCounts, b: DirCounts): DirCounts {
  return { rtl: a.rtl + b.rtl, ltr: a.ltr + b.ltr };
}

/**
 * Every stylesheet reached from `entries` through `@import`, each once, in
 * the order the imports name them. A package import (`@fontsource/...`) is
 * resolved from the importing file; a URL import is not part of the source.
 */
export function cssImportGraph(entries: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    if (!existsSync(file)) throw new Error(`${file} is imported but does not exist`);
    out.push(file);
    const css = stripCssComments(readFileSync(file, 'utf8'));
    for (const m of css.matchAll(/@import\s+(?:url\(\s*)?(['"])([^'"]+)\1/g)) {
      const spec = m[2] ?? '';
      if (/^[a-z]+:/i.test(spec) || spec.startsWith('//')) continue;
      visit(spec.startsWith('.') || spec.startsWith('/') ? resolve(dirname(file), spec) : createRequire(file).resolve(spec));
    }
  };
  entries.forEach(visit);
  return out;
}

function walk(dir: string, keep: (path: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path, keep));
    else if (keep(path)) out.push(path);
  }
  return out.sort();
}

/**
 * The stylesheets an app's source imports for their side effect
 * (`import './x.css'`, `import '@the-system/css'`), resolved the way the
 * bundler resolves them, from the app's own package.json.
 */
export function cssEntries(appDir: string): string[] {
  const require = createRequire(join(appDir, 'package.json'));
  const out: string[] = [];
  for (const file of walk(join(appDir, 'src'), (p) => /\.(ts|tsx|js|jsx|mts)$/.test(p) && !/\.(test|spec)\./.test(p))) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/^import\s+(['"])([^'"]+)\1;?\s*$/gm)) {
      const spec = m[2] ?? '';
      const path = spec.startsWith('.') ? resolve(dirname(file), spec) : require.resolve(spec);
      if (path.endsWith('.css') && !out.includes(path)) out.push(path);
    }
  }
  return out;
}

/** The `:dir()` count of every file in a list. */
export function countFiles(files: string[]): DirCounts {
  return files.reduce((sum, f) => addCounts(sum, countDir(readFileSync(f, 'utf8'))), { rtl: 0, ltr: 0 });
}

/** One line per direction the output lost, empty when the output keeps every `:dir()` of the source. */
export function dirLoss(source: DirCounts, output: DirCounts): string[] {
  const out: string[] = [];
  for (const d of ['rtl', 'ltr'] as const) {
    if (output[d] < source[d]) out.push(`:dir(${d}): the source has ${source[d]}, the build output ${output[d]}. Set build.cssTarget to versions that support :dir().`);
  }
  return out;
}
