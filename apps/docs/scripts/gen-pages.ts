// Writes the Markdown twin of every page under public/, served as
// <page>.md: one per manifest and its index, in English and Arabic, one per
// hand written page, one per style pack, the home page and the coverage
// table. The HTML pages themselves are Astro routes (src/pages/[...path].astro)
// that read the manifests at build time. Run by `npm run gen -w
// @the-system/docs` before every build.
//
// Nothing here names a component: every manifest under
// packages/manifest/src/<kind>/ gets its twins, so a new manifest needs no
// change. The generated files are listed in apps/docs/.gitignore.
//
// The site imports the built token CSS, so the token build runs first when
// its output is missing (a fresh clone).
//
// DOCS_GALLERY_URL sets where the live previews point. See scripts/gallery.ts.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { componentCases } from './cases.ts';
import { galleryUrl, resolveGalleryLinks } from './gallery.ts';
import { familyLabel, frameworkIds, readManifests, repoRoot, sectionOf, slugOf, type Manifest } from './manifests.ts';
import { frameworkNames, inline, renderIndex, renderManifest, styleIdsOnDisk, type Lang, type PreviewConfig } from './render.ts';
import { paletteTokens, readStyles, tokenCssPath, tokenValue } from './styles.ts';

const app = join(import.meta.dirname, '..');
const docs = join(app, 'src', 'content', 'docs');
const pub = join(app, 'public');

export { galleryUrl };

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

/** The examples of a component twin: each demo case with its preview link. The code of every case is in the demo files under ## Code. */
function casesTwin(m: Manifest, lang: Lang): string {
  const cases = componentCases(m);
  if (cases.length === 0) return '';
  const out: string[] = [lang === 'ar' ? '## الأمثلة' : '## Examples', ''];
  for (const c of cases) {
    const fws = frameworkIds.filter((fw) => c.code[fw]).map((fw) => frameworkNames[fw]).join(', ');
    out.push(`- ${inline(c.title)} (\`${c.id}\`, ${fws}): <${galleryUrl}/c/${slugOf(m.name)}?chrome=0&case=${c.id}>`);
  }
  return out.join('\n');
}

function homeTwin(lang: Lang, manifests: Manifest[]): string {
  const comps = manifests.filter((m) => m.kind === 'component');
  const n = (fw: 'react' | 'angular' | 'native') => comps.filter((m) => m.frameworks[fw]?.status === 'ready').length;
  const p = lang === 'ar' ? '/ar' : '';
  if (lang === 'ar') {
    return `# النظام\n\nنظام تصميم يقوم على عقد واحد للمكونات، وعدة أنماط بصرية، وثلاثة أطر عمل. لكل مكون ملف تعريف واحد، وملف CSS واحد يشترك فيه React وAngular، ودالة أنماط في React Native.\n\n- [التثبيت](${p}/getting-started.md)\n- [الأنماط](${p}/styles.md)\n- [المكونات](${p}/components.md)\n\nالمكونات: ${comps.length}. الجاهز في React: ${n('react')}، وفي Angular: ${n('angular')}، وفي React Native: ${n('native')}.\n`;
  }
  return `# The system\n\nA design system with one component contract, several style packs and three frameworks. Each component has one manifest, one CSS file shared by React and Angular, and a style function for React Native.\n\n- [Install](${p}/getting-started.md)\n- [Pick a style](${p}/styles.md)\n- [Build a screen](${p}/components.md)\n\nComponents: ${comps.length}. Ready in React: ${n('react')}, Angular: ${n('angular')}, React Native: ${n('native')}.\n`;
}

function styleTwin(lang: Lang, id: string): string {
  const s = readStyles().find((x) => x.id === id);
  if (!s) return '';
  const out = [`# ${s.name}`, '', `${lang === 'ar' ? 'الحالة' : 'Status'}: ${s.status}.`, ''];
  out.push(lang === 'ar' ? '## المحددات' : '## Dials', '', '| Dial | Value |', '| --- | --- |');
  for (const [k, v] of Object.entries(s.dials)) out.push(`| \`${k}\` | ${inline(v)} |`);
  for (const scheme of s.schemes) {
    out.push('', `## ${lang === 'ar' ? 'الألوان' : 'Palette'}, ${scheme}`, '', '| Role | Token | Value |', '| --- | --- | --- |');
    for (const p of paletteTokens) out.push(`| ${p.role[lang]} | \`${p.token}\` | \`${tokenValue(s.id, scheme, p.token) ?? ''}\` |`);
  }
  return `${out.join('\n')}\n`;
}

function coverageTwin(lang: Lang, manifests: Manifest[]): string {
  const out = [lang === 'ar' ? '# التغطية' : '# Coverage', '', '| Component | Family | React | Angular | React Native |', '| --- | --- | --- | --- | --- |'];
  for (const m of manifests.filter((x) => x.kind === 'component')) {
    out.push(`| ${m.name} | ${familyLabel(m.family)[lang]} | ${m.frameworks.react?.status ?? 'planned'} | ${m.frameworks.angular?.status ?? 'planned'} | ${m.frameworks.native?.status ?? 'planned'} |`);
  }
  return `${out.join('\n')}\n`;
}

export function generate(): { pages: number; twins: number; manifests: Manifest[] } {
  if (!existsSync(tokenCssPath)) {
    execFileSync('npx', ['tsx', join(repoRoot, 'packages', 'tokens', 'build.ts')], { cwd: repoRoot, stdio: 'inherit' });
  }
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
      write(join(pub, base, `${section}.md`), renderIndex(kind, list, lang, 'twin'));
      pages++;
      twins++;
      for (const m of list) {
        const slug = slugOf(m.name);
        const examples = casesTwin(m, lang);
        write(join(pub, base, section, `${slug}.md`), `${renderManifest(m, lang, 'twin', preview)}${examples ? `\n${examples}\n` : ''}`);
        pages++;
        twins++;
      }
    }
  }

  // Twins of the pages built from data: home, style packs, coverage.
  for (const lang of langs) {
    const base = lang === 'en' ? '' : 'ar';
    write(join(pub, base, 'index.md'), homeTwin(lang, manifests));
    write(join(pub, base, 'frameworks', 'coverage.md'), coverageTwin(lang, manifests));
    twins += 2;
    for (const s of readStyles()) {
      write(join(pub, base, 'styles', `${s.id}.md`), styleTwin(lang, s.id));
      twins++;
    }
  }

  // Twins of the hand written pages.
  const generated = new Set(generatedRoots);
  for (const file of walk(docs)) {
    if ([...generated].some((g) => file.startsWith(`${g}/`))) continue;
    const rel = relative(docs, file).split('\\').join('/');
    write(join(pub, twinPath(rel)), resolveGalleryLinks(handTwin(readFileSync(file, 'utf8'))));
    twins++;
  }

  return { pages, twins, manifests };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pages, twins, manifests } = generate();
  console.log(`docs: ${manifests.length} manifests, ${pages} generated pages, ${twins} Markdown twins, gallery ${galleryUrl}`);
}
