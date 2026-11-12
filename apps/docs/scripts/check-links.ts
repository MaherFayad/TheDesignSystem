// Checks the built site in apps/docs/dist. No plugin, no network:
//
// 1. Every internal link and asset (href, src) on every HTML page resolves to
//    a built file, and every #fragment exists on its target page.
// 2. Every manifest has a page in English and in Arabic, and a Markdown twin
//    of each.
// 3. llms.txt lists every manifest, and llms-full.txt exists.
// 4. No em dash and no en dash in any built page, twin or llms file.
//
// Paths resolve as the static host serves them (scripts/static-host.ts reads
// vercel.json): when the site build ships the gallery under /gallery/, its
// single page routes resolve through the rewrite, and every /c/<slug> link
// must name a gallery route. External links (another origin, the gallery
// iframe in a plain docs build included) are listed in the summary, not
// fetched. Exit code 1 on any finding.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { galleryBundled, galleryUrl } from './gallery.ts';
import { readManifests, repoRoot, sectionOf, slugOf } from './manifests.ts';
import { readHostConfig, resolvePath } from './static-host.ts';

const dist = join(import.meta.dirname, '..', 'dist');
const ORIGIN = 'http://docs.local';

if (!existsSync(dist)) {
  console.error('No apps/docs/dist. Run the build first: npm run build -w @the-system/docs');
  process.exit(1);
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const findings: string[] = [];
const external = new Set<string>();
const idCache = new Map<string, Set<string>>();

function rel(path: string): string {
  return relative(dist, path).split('\\').join('/');
}

/** The URL path a built HTML file is served at. */
function urlOf(file: string): string {
  const r = rel(file);
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return `/${r.slice(0, -'index.html'.length)}`;
  return `/${r}`;
}

const host = readHostConfig();

/** The built file a URL path resolves to, as the static host would serve it. */
function fileOf(pathname: string): string | undefined {
  return resolvePath(dist, pathname, host)?.file;
}

// The gallery routes, for links into a bundled gallery.
const galleryRoutes = new Set(
  [...readFileSync(join(repoRoot, 'apps', 'gallery-react', 'src', 'routes.gen.ts'), 'utf8').matchAll(/slug: '([^']+)'/g)].map((m) => m[1] ?? ''),
);
const galleryPages = new Set(['/', '/all', '/interactions']);

/** A finding when a path under the bundled gallery names no gallery page. */
function galleryRouteFinding(pathname: string): string | undefined {
  if (!galleryBundled || !(pathname === galleryUrl || pathname.startsWith(`${galleryUrl}/`))) return undefined;
  const inner = pathname.slice(galleryUrl.length).replace(/\/+$/, '') || '/';
  if (inner.startsWith('/assets/') || galleryPages.has(inner)) return undefined;
  if (inner.startsWith('/c/') && galleryRoutes.has(decodeURIComponent(inner.slice(3)))) return undefined;
  return `no gallery page at ${pathname}`;
}

function idsOf(file: string): Set<string> {
  let ids = idCache.get(file);
  if (!ids) {
    ids = new Set();
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/\s(?:id|name)="([^"]+)"/g)) ids.add(decodeEntities(m[1] ?? ''));
    idCache.set(file, ids);
  }
  return ids;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)));
}

// 1. Links and assets.
let checked = 0;
for (const file of htmlFiles) {
  // Code samples show markup as text; only real attributes count.
  const html = readFileSync(file, 'utf8').replace(/<(pre|code|script|style)\b[\s\S]*?<\/\1>/g, '');
  const pageUrl = new URL(urlOf(file), ORIGIN);
  for (const m of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const raw = decodeEntities(m[2] ?? '');
    if (raw === '' || /^(mailto|tel|javascript|data):/i.test(raw)) continue;
    let target: URL;
    try {
      target = new URL(raw, pageUrl);
    } catch {
      findings.push(`${rel(file)}: bad URL ${raw}`);
      continue;
    }
    if (target.origin !== ORIGIN) {
      external.add(target.origin);
      continue;
    }
    checked++;
    const targetFile = fileOf(target.pathname);
    if (!targetFile) {
      findings.push(`${rel(file)}: broken link ${raw}`);
      continue;
    }
    const routeFinding = galleryRouteFinding(target.pathname);
    if (routeFinding) {
      findings.push(`${rel(file)}: ${routeFinding}`);
      continue;
    }
    if (target.hash.length > 1 && targetFile.endsWith('.html')) {
      const id = decodeURIComponent(target.hash.slice(1));
      if (!idsOf(targetFile).has(id)) findings.push(`${rel(file)}: missing anchor ${raw}`);
    }
  }
}

// 2. One page and one twin per manifest per language.
const manifests = readManifests();
for (const m of manifests) {
  const path = `${sectionOf(m.kind)}/${slugOf(m.name)}`;
  for (const prefix of ['', 'ar/']) {
    if (!existsSync(join(dist, prefix, path, 'index.html'))) findings.push(`no page for ${m.name}: /${prefix}${path}/`);
    if (!existsSync(join(dist, prefix, `${path}.md`))) findings.push(`no Markdown twin for ${m.name}: /${prefix}${path}.md`);
  }
}

// 3. llms files.
const llmsPath = join(dist, 'llms.txt');
if (!existsSync(llmsPath)) findings.push('no llms.txt');
else {
  const llms = readFileSync(llmsPath, 'utf8');
  for (const m of manifests) {
    if (!llms.includes(`/${sectionOf(m.kind)}/${slugOf(m.name)}.md)`)) findings.push(`llms.txt does not list ${m.name}`);
  }
}
if (!existsSync(join(dist, 'llms-full.txt'))) findings.push('no llms-full.txt');

// 4. No dashes in what we generate. The characters are built from char codes
// so this file does not trip the repo gate.
const AMP = String.fromCharCode(0x26);
const DASH = new RegExp(`[${String.fromCharCode(0x2014)}${String.fromCharCode(0x2013)}]|${AMP}[mn]dash;|${AMP}#821[12];|${AMP}#x201[34];`, 'i');
for (const file of files.filter((f) => /\.(html|md|txt)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const hit = DASH.exec(line);
    if (hit) findings.push(`${rel(file)}:${i + 1}: em or en dash near "${line.slice(Math.max(0, hit.index - 30), hit.index + 30).trim()}"`);
  });
}

const docPages = htmlFiles.filter((f) => !rel(f).startsWith('gallery/'));
const pagesEn = docPages.filter((f) => !rel(f).startsWith('ar/')).length;
const pagesAr = docPages.length - pagesEn;
const galleryNote = galleryBundled ? `, gallery bundled at ${galleryUrl}/ (${galleryRoutes.size} routes)` : '';
console.log(`links: ${docPages.length} pages (${pagesEn} en, ${pagesAr} ar), ${checked} internal links checked, ${manifests.length} manifests with pages in both languages${galleryNote}`);
if (external.size > 0) console.log(`links: external origins not fetched: ${[...external].sort().join(', ')}`);
if (findings.length > 0) {
  console.error(`links: ${findings.length} finding(s)`);
  for (const f of findings.slice(0, 200)) console.error(`  ${f}`);
  process.exit(1);
}
console.log('links: pass');
