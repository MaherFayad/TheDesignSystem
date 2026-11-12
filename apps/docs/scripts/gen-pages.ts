// Writes one docs page per manifest, in English and Arabic, plus a Markdown
// twin of every page (generated and hand written) under public/, served as
// <page>.md. Run by `npm run gen -w @the-system/docs` before every build.
//
// Nothing here names a component: every manifest under
// packages/manifest/src/<kind>/ gets its pages, so a new manifest needs no
// change. The generated folders are listed in apps/docs/.gitignore.
//
// DOCS_GALLERY_URL sets where the live preview iframe points (the React
// gallery, `npm run build -w @the-system/gallery-react` then
// `npm run preview -w @the-system/gallery-react`). Default: its preview port.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { readManifests, sectionOf, slugOf, type Manifest } from './manifests.ts';
import { renderIndex, renderManifest, styleIdsOnDisk, type Lang, type PreviewConfig } from './render.ts';

const app = join(import.meta.dirname, '..');
const docs = join(app, 'src', 'content', 'docs');
const pub = join(app, 'public');

export const galleryUrl = process.env.DOCS_GALLERY_URL ?? 'http://localhost:4173';

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/** The twin path of a content file: `a/b.md` is `/a/b.md`, `a/index.md` is `/a.md`, `index.md` is `/index.md`. */
function twinPath(rel: string): string {
  const noExt = rel.replace(/\.mdx?$/, '');
  if (noExt === 'index') return 'index.md';
  if (noExt.endsWith('/index')) return `${noExt.slice(0, -'/index'.length)}.md`;
  return `${noExt}.md`;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (/\.mdx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

/** A hand written page as its twin: the frontmatter title becomes the heading. */
function handTwin(source: string): string {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
  if (!match) return source;
  const title = /^title:\s*(.+)$/m.exec(match[1] ?? '')?.[1]?.trim().replace(/^["']|["']$/g, '');
  const body = source.slice(match[0].length).replace(/^\s+/, '');
  return title ? `# ${title}\n\n${body}` : body;
}

export function generate(): { pages: number; twins: number; manifests: Manifest[] } {
  const manifests = readManifests();
  const byKind = new Map<string, Manifest[]>();
  for (const m of manifests) byKind.set(m.kind, [...(byKind.get(m.kind) ?? []), m]);

  const pagePaths = new Map(manifests.map((m) => [m.name, `${sectionOf(m.kind)}/${slugOf(m.name)}`]));
  const preview: PreviewConfig = { galleryUrl, styles: styleIdsOnDisk(), pages: pagePaths };
  const langs: Lang[] = ['en', 'ar'];
  const generatedRoots: string[] = [];
  let pages = 0;
  let twins = 0;

  // Clear the twins and the generated sections, so a removed manifest leaves no page behind.
  for (const lang of langs) {
    const base = lang === 'en' ? '' : 'ar';
    for (const kind of byKind.keys()) {
      generatedRoots.push(join(docs, base, sectionOf(kind)));
    }
  }
  for (const dir of generatedRoots) rmSync(dir, { recursive: true, force: true });
  for (const entry of existsSync(pub) ? readdirSync(pub, { withFileTypes: true }) : []) {
    const path = join(pub, entry.name);
    if (entry.isDirectory() && entry.name !== 'assets') rmSync(path, { recursive: true, force: true });
    else if (entry.isFile() && entry.name.endsWith('.md')) rmSync(path, { force: true });
  }

  for (const [kind, list] of byKind) {
    const section = sectionOf(kind);
    for (const lang of langs) {
      const base = lang === 'en' ? '' : 'ar';
      write(join(docs, base, section, 'index.md'), renderIndex(kind, list, lang, 'site'));
      write(join(pub, base, `${section}.md`), renderIndex(kind, list, lang, 'twin'));
      pages++;
      twins++;
      for (const m of list) {
        const slug = slugOf(m.name);
        write(join(docs, base, section, `${slug}.md`), renderManifest(m, lang, 'site', preview));
        write(join(pub, base, section, `${slug}.md`), renderManifest(m, lang, 'twin', preview));
        pages++;
        twins++;
      }
    }
  }

  // Twins of the hand written pages.
  const generated = new Set(generatedRoots);
  for (const file of walk(docs)) {
    if ([...generated].some((g) => file.startsWith(`${g}/`))) continue;
    const rel = relative(docs, file).split('\\').join('/');
    write(join(pub, twinPath(rel)), handTwin(readFileSync(file, 'utf8')));
    twins++;
  }

  return { pages, twins, manifests };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pages, twins, manifests } = generate();
  console.log(`docs: ${manifests.length} manifests, ${pages} generated pages, ${twins} Markdown twins, gallery ${galleryUrl}`);
}
