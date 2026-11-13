// Writes llms.txt and llms-full.txt for the docs site, from the manifests and
// the English Markdown twins (apps/docs/public/**/*.md, written by
// apps/docs/scripts/gen-pages.ts, which runs first).
//
// llms.txt follows the llmstxt.org layout: a title, a one line summary, then
// sections of links. Every manifest is listed. llms-full.txt is every English
// twin in one file: the guides first, then one page per manifest.
//
// DOCS_SITE_URL makes the links absolute (for example https://docs.example).
// Without it they are site relative.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { kindLabel, readManifests, sectionOf, slugOf } from '../apps/docs/scripts/manifests.ts';

const root = join(import.meta.dirname, '..');
const pub = join(root, 'apps', 'docs', 'public');
const site = (process.env.DOCS_SITE_URL ?? '').replace(/\/+$/, '');

/** The hand written guides, in reading order. A guide missing on disk is skipped. */
const guides: { path: string; title: string; about: string }[] = [
  { path: 'index.md', title: 'Home', about: 'What the system is, in two sentences, and the component count per framework.' },
  { path: 'getting-started.md', title: 'Installation', about: 'Install for React, Angular and React Native, the CSS import order, the root Theme and the first Button.' },
  { path: 'overview.md', title: 'Overview of the docs', about: 'What is in the box and how to read a component page.' },
  { path: 'foundations/tokens.md', title: 'Tokens', about: 'DTCG tokens, names, the CSS variable prefix and the build outputs.' },
  { path: 'foundations/axes.md', title: 'Runtime axes', about: 'Style, scheme, density, contrast, platform, glass, direction and language.' },
  { path: 'styles.md', title: 'Styles', about: 'The style packs and what a style may change.' },
  { path: 'platforms.md', title: 'Platforms', about: 'Web, iOS and Android, the platform axis and the package per framework.' },
  { path: 'interactions.md', title: 'Interactions', about: 'The feedback each component plays, its trigger, pattern and reduced form.' },
  { path: 'frameworks/coverage.md', title: 'Coverage', about: 'The status of every component in React, Angular and React Native.' },
  { path: 'frameworks/setup.md', title: 'Framework setup', about: 'Install, the CSS import order, the TypeScript note and the root Theme for React, Angular and React Native.' },
  { path: 'content/english.md', title: 'English content', about: 'Sentence case, button labels, empty states.' },
  { path: 'content/arabic.md', title: 'Arabic content', about: 'The two registers, Gulf modern standard Arabic and white Saudi dialect, and the Arabic rules.' },
  { path: 'accessibility.md', title: 'Accessibility', about: 'The WCAG 2.2 AA rules every component follows.' },
];

function twins(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'ar') continue;
      out.push(...twins(path));
    } else if (entry.name.endsWith('.md')) out.push(path);
  }
  return out;
}

export function genLlms(): { listed: number } {
  const manifests = readManifests();
  const lines: string[] = [
    '# The system',
    '',
    '> A design system with one component contract, several style packs and three frameworks (React, Angular, React Native). Every component page is generated from its manifest. Each link below is a Markdown file.',
    '',
    'Arabic pages live under /ar/ with the same paths. Component prose is English on both until the manifests carry Arabic text.',
    '',
    '## Guides',
    '',
  ];
  for (const g of guides) {
    if (!existsSync(join(pub, g.path))) continue;
    lines.push(`- [${g.title}](${site}/${g.path}): ${g.about}`);
  }

  const kinds = [...new Set(manifests.map((m) => m.kind))];
  for (const kind of kinds) {
    lines.push('', `## ${kindLabel(kind).en}`, '');
    for (const m of manifests.filter((x) => x.kind === kind)) {
      const ready = (['react', 'angular', 'native'] as const).filter((f) => m.frameworks[f]?.status === 'ready');
      const summary = m.summary.replace(/\s+/g, ' ');
      lines.push(`- [${m.name}](${site}/${sectionOf(kind)}/${slugOf(m.name)}.md): ${summary} Ready in: ${ready.length > 0 ? ready.join(', ') : 'none yet'}.`);
    }
  }
  lines.push('');
  writeFileSync(join(pub, 'llms.txt'), lines.join('\n'));

  // llms-full.txt: guides in reading order, then every other English twin.
  const all = twins(pub);
  const order = guides.map((g) => join(pub, g.path)).filter((p) => all.includes(p));
  const rest = all.filter((p) => !order.includes(p));
  const full = [...order, ...rest]
    .map((p) => `<!-- source: ${site}/${relative(pub, p).split('\\').join('/')} -->\n\n${readFileSync(p, 'utf8').trim()}\n`)
    .join('\n');
  writeFileSync(join(pub, 'llms-full.txt'), full);

  return { listed: manifests.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { listed } = genLlms();
  console.log(`llms: ${listed} manifests listed in apps/docs/public/llms.txt and llms-full.txt`);
}
