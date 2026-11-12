// Which files of this repo each gate covers. Paths are repo relative with
// forward slashes. `ds doctor` can pass its own predicates for other repos.
import { DASH_EXCLUDED_FILES } from './allowlist';
import { extname } from './util';

/** Component CSS and style pack recipes: tokens only. */
export function isComponentCss(path: string): boolean {
  return /^packages\/css\/src\/components\/[^/]+\.css$/.test(path) || /^packages\/styles\/[^/]+\/recipes\/[^/]+\.css$/.test(path);
}

/** Component CSS only (`packages/css/src/components`), without recipes: where private properties are declared. */
export function isComponentBaseCss(path: string): boolean {
  return /^packages\/css\/src\/components\/[^/]+\.css$/.test(path);
}

/** Every stylesheet the system ships: `packages/css` and `packages/styles`. */
export function isSystemCss(path: string): boolean {
  return /^packages\/(css|styles)\//.test(path) && path.endsWith('.css');
}

/** Text files the no dash gate reads. */
export const TEXT_EXTENSIONS: ReadonlySet<string> = new Set([
  '.md', '.mdx', '.txt', '.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs',
  '.css', '.scss', '.json', '.html', '.svg', '.yml', '.yaml', '.astro',
]);

export function isTextFile(path: string): boolean {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return TEXT_EXTENSIONS.has(extname(path)) && !DASH_EXCLUDED_FILES.some((f) => f.name === name);
}

/** Source we write that renders UI: the packages, the apps and the examples. */
export function isUiSource(path: string): boolean {
  if (!/^(packages|apps|examples)\//.test(path)) return false;
  if (path.startsWith('packages/lint/')) return false;
  if (path.endsWith('.d.ts')) return false;
  return ['.tsx', '.ts', '.html'].includes(extname(path));
}

/** The framework packages whose source must not carry utility class soup. */
export function isFrameworkSource(path: string): boolean {
  return /^packages\/(react|charts-react|ai-react|angular|charts-angular|ai-angular|native|charts-native|ai-native)\/src\//.test(path) &&
    ['.tsx', '.ts', '.html'].includes(extname(path)) && !path.endsWith('.d.ts');
}

/** React Native source: `packages/native/src` and every `packages/*-native/src`. */
export function isNativeSource(path: string): boolean {
  return /^packages\/(native|[^/]+-native)\/src\//.test(path) && ['.tsx', '.ts'].includes(extname(path)) && !path.endsWith('.d.ts');
}

/** Angular source: inline templates and `.html` templates. */
export function isAngularPath(path: string): boolean {
  return /^(packages\/(angular|[^/]+-angular)|apps\/gallery-angular|examples\/consumer-angular)\//.test(path);
}
