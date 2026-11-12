// ds search, ds docs, ds manifest: answers read from the manifests.
import { FRAMEWORKS, findManifest, kebab, loadManifests, type Framework, type Manifest } from '../manifests';
import { CliError, ok, type Result } from '../output';

export interface SearchHit {
  name: string;
  kind: Manifest['kind'];
  family: string;
  summary: string;
  score: number;
  frameworks: Record<Framework, Manifest['frameworks'][Framework]['status']>;
}

const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'for', 'and', 'or', 'in', 'on', 'with', 'i', 'that', 'is', 'it', 'my', 'some']);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** A word matches a field word when one starts with the other (open, opens, opening). */
const matches = (q: string, w: string) => w === q || (q.length >= 3 && (w.startsWith(q) || q.startsWith(w)) && Math.min(q.length, w.length) >= 3);

function score(m: Manifest, query: string[]): number {
  const fields: [string[], number][] = [
    [words(m.name.replace(/([a-z])([A-Z])/g, '$1 $2')), 8],
    [words(m.family), 3],
    [words(m.summary), 3],
    [words(m.useWhen.join(' ')), 2],
    [words(Object.keys(m.insteadUse).join(' ')), 1],
  ];
  let total = 0;
  for (const q of query) {
    let best = 0;
    for (const [ws, weight] of fields) if (ws.some((w) => matches(q, w))) best = Math.max(best, weight);
    total += best;
  }
  if (query.join('') === m.name.toLowerCase()) total += 20;
  return total;
}

export function search(terms: string[], framework?: Framework, limit = 10): Result<{ query: string; framework: Framework | null; results: SearchHit[] }> {
  const query = words(terms.join(' '));
  if (query.length === 0) throw new CliError('DS_E_USAGE', 'Give at least one word. Usage: ds search <words> [--framework react|angular|native]');
  const results = loadManifests()
    .filter((m) => !framework || m.frameworks[framework].status === 'ready')
    .map((m) => ({
      name: m.name,
      kind: m.kind,
      family: m.family,
      summary: m.summary,
      score: score(m, query),
      frameworks: Object.fromEntries(FRAMEWORKS.map((f) => [f, m.frameworks[f].status])) as SearchHit['frameworks'],
    }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
  const text = results.length
    ? results.map((r) => `${r.name.padEnd(22)} ${r.family.padEnd(12)} ${r.summary}`).join('\n') + '\n'
    : `Nothing matches "${terms.join(' ')}".\n`;
  return ok('search.results', { query: terms.join(' '), framework: framework ?? null, results }, text);
}

export interface DocsPage {
  name: string;
  kind: Manifest['kind'];
  family: string;
  slug: string;
  summary: string;
  useWhen: string[];
  avoidWhen: string[];
  insteadUse: Record<string, string>;
  anatomy: string[];
  a11y: Manifest['a11y'] | null;
  content: Manifest['content'] | null;
  mistakes: { wrong: string; right: string }[];
  frameworks: Manifest['frameworks'];
  markdown: string;
}

/** The manifest as a docs page in the order of the docs site (order 1.15). */
export function docsMarkdown(m: Manifest): string {
  const lines = [`# ${m.name}`, '', m.summary, '', '## Use when', '', ...m.useWhen.map((u) => `- ${u}`), '', '## Do not use when', '', ...m.avoidWhen.map((u) => `- ${u}`), '', '## Use instead', ''];
  for (const [when, instead] of Object.entries(m.insteadUse)) lines.push(`- ${when}: ${instead}`);
  if (m.anatomy?.length) lines.push('', '## Anatomy', '', m.anatomy.map((a) => `\`${a}\``).join(', '));
  if (m.a11y) {
    lines.push('', '## Accessibility', '');
    if (m.a11y.role) lines.push(`- Role: ${m.a11y.role}`);
    if (m.a11y.focus) lines.push(`- Focus: ${m.a11y.focus}`);
    if (m.a11y.announce) lines.push(`- Announce: ${m.a11y.announce}`);
    const keys = Object.entries(m.a11y.keys ?? {});
    if (keys.length) lines.push('', '| Key | Does |', '| --- | --- |', ...keys.map(([k, v]) => `| ${k} | ${v} |`));
  }
  if (m.mistakes?.length) {
    lines.push('', '## Common mistakes', '');
    for (const x of m.mistakes) lines.push(`- Wrong: ${x.wrong}`, `  Right: ${x.right}`);
  }
  lines.push('', '## Frameworks', '');
  for (const f of FRAMEWORKS) lines.push(`- ${f}: ${m.frameworks[f].status}${m.frameworks[f].example ? ` (example ${m.frameworks[f].example})` : ''}`);
  return `${lines.join('\n')}\n`;
}

export function docs(name: string): Result<DocsPage> {
  const m = findManifest(name);
  const markdown = docsMarkdown(m);
  return ok(
    'docs.page',
    {
      name: m.name,
      kind: m.kind,
      family: m.family,
      slug: kebab(m.name),
      summary: m.summary,
      useWhen: m.useWhen,
      avoidWhen: m.avoidWhen,
      insteadUse: m.insteadUse,
      anatomy: m.anatomy ?? [],
      a11y: m.a11y ?? null,
      content: m.content ?? null,
      mistakes: m.mistakes ?? [],
      frameworks: m.frameworks,
      markdown,
    },
    markdown,
  );
}

export function manifest(name: string): Result<Manifest> {
  const m = findManifest(name);
  return ok('manifest', m, `${JSON.stringify(m, null, 2)}\n`);
}
