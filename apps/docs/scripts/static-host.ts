// Resolves a request path to a file in a built site the way the Vercel static
// host does with apps/docs/vercel.json: the file system first (the exact
// file, then `<path>.html` for clean URLs, then `<path>/index.html`), then the
// rewrites in order. With cleanUrls a rewrite cannot name an .html file (the
// host strips the extension), so vercel.json points at the folder instead.
// Used by the link check and by the local server
// (scripts/serve-site.ts), so both agree with the deployed site.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface HostConfig {
  rewrites: { source: string; destination: string }[];
  headers: { source: string; headers: { key: string; value: string }[] }[];
}

export const vercelJsonPath = join(import.meta.dirname, '..', 'vercel.json');

export function readHostConfig(): HostConfig {
  const raw = JSON.parse(readFileSync(vercelJsonPath, 'utf8')) as Partial<HostConfig>;
  return { rewrites: raw.rewrites ?? [], headers: raw.headers ?? [] };
}

/** A Vercel source pattern as a regular expression. Covers the forms vercel.json uses: `/:name*` and `(.*)`. */
export function sourcePattern(source: string): RegExp {
  const body = source
    .split(/(\(\.\*\)|\/:\w+\*|\/:\w+)/)
    .map((part) => {
      if (part === '(.*)') return '(.*)';
      if (/^\/:\w+\*$/.test(part)) return '(?:/.*)?';
      if (/^\/:\w+$/.test(part)) return '/[^/]+';
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(`^${body}$`);
}

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

/** The file on disk for a path, without rewrites. */
export function fileOnDisk(root: string, pathname: string): string | undefined {
  let clean: string;
  try {
    clean = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  if (clean.split('/').includes('..')) return undefined;
  const candidates = clean.endsWith('/')
    ? [join(root, clean, 'index.html')]
    : [join(root, clean), join(root, `${clean}.html`), join(root, clean, 'index.html')];
  return candidates.find(isFile);
}

/** The file a request path serves, and whether a rewrite produced it. */
export function resolvePath(root: string, pathname: string, config: HostConfig): { file: string; rewritten: boolean } | undefined {
  const direct = fileOnDisk(root, pathname);
  if (direct) return { file: direct, rewritten: false };
  for (const rule of config.rewrites) {
    if (!sourcePattern(rule.source).test(pathname)) continue;
    const file = fileOnDisk(root, rule.destination);
    if (file) return { file, rewritten: true };
  }
  return undefined;
}

/** The extra response headers for a path. */
export function headersFor(pathname: string, config: HostConfig): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rule of config.headers) {
    if (!sourcePattern(rule.source).test(pathname)) continue;
    for (const h of rule.headers) out[h.key] = h.value;
  }
  return out;
}
