// Reads the demo cases of a component from its demo files, at build time:
//
// - React and React Native: every <DemoCase id="..." title="..."> element.
// - Angular: every <section data-demo="case" data-demo-case="..."> element.
//
// The code of a case is the source between the opening and the closing tag,
// dedented. It is the real demo source, so a docs page can never show code
// that does not run. The gallery shows the same case with ?case=<id>.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot, slugOf, type FrameworkId, type Manifest } from './manifests.ts';

export interface DemoCaseSource {
  id: string;
  title: string;
  code: string;
}

export interface ComponentCase {
  id: string;
  title: string;
  /** One source per framework that has this case. */
  code: Partial<Record<FrameworkId, string>>;
}

const packages: Record<FrameworkId, string[]> = {
  react: ['react', 'charts-react', 'ai-react'],
  angular: ['angular', 'charts-angular', 'ai-angular'],
  native: ['native', 'charts-native', 'ai-native'],
};

/** The demo file of a component in one framework, or undefined. */
export function demoFile(fw: FrameworkId, m: Manifest): string | undefined {
  const f = m.frameworks[fw];
  if (!f || f.status !== 'ready') return undefined;
  const folder = fw === 'angular' ? slugOf(m.name) : m.name;
  const fallback = fw === 'angular' ? `${slugOf(m.name)}.demo.ts` : `${m.name}.demo.tsx`;
  for (const file of [f.example, fallback]) {
    if (!file || !/\.demo\.tsx?$/.test(file)) continue;
    for (const p of packages[fw]) {
      const path = join(repoRoot, 'packages', p, 'src', 'components', folder, file);
      if (existsSync(path)) return path;
    }
  }
  return undefined;
}

/** Removes the common leading white space of every line. */
export function dedent(text: string): string {
  const lines = text.replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
  const indents = lines.filter((l) => l.trim() !== '').map((l) => /^ */.exec(l)?.[0].length ?? 0);
  const cut = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(cut)).join('\n');
}

/** Finds the closing tag that matches an opening tag at `from`, counting nested tags of the same name. */
function closeOf(source: string, tag: string, from: number): number {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = from;
  let depth = 1;
  for (let m = re.exec(source); m; m = re.exec(source)) {
    if (m[0].startsWith('</')) depth--;
    else depth++;
    if (depth === 0) return m.index;
  }
  return -1;
}

function attr(openTag: string, name: string): string | undefined {
  const quoted = new RegExp(`\\s${name}="([^"]*)"`).exec(openTag);
  if (quoted) return quoted[1];
  const braced = new RegExp(`\\s${name}=\\{['"\`]([^'"\`]*)['"\`]\\}`).exec(openTag);
  return braced?.[1];
}

/** The cases of a React or React Native demo file. */
export function jsxCases(source: string): DemoCaseSource[] {
  const out: DemoCaseSource[] = [];
  const open = /<DemoCase\b([^>]*?)>/gs;
  for (let m = open.exec(source); m; m = open.exec(source)) {
    const tag = m[0];
    const id = attr(tag, 'id');
    if (!id || out.some((c) => c.id === id)) continue;
    const end = closeOf(source, 'DemoCase', m.index + tag.length);
    if (end < 0) continue;
    out.push({ id, title: attr(tag, 'title') ?? id, code: dedent(source.slice(m.index + tag.length, end)) });
  }
  return out;
}

/** The cases of an Angular demo file (the template). */
export function angularCases(source: string): DemoCaseSource[] {
  const out: DemoCaseSource[] = [];
  const open = /<section\b[^>]*data-demo-case="([^"]+)"[^>]*>/g;
  for (let m = open.exec(source); m; m = open.exec(source)) {
    const id = m[1] ?? '';
    if (!id || out.some((c) => c.id === id)) continue;
    const end = closeOf(source, 'section', m.index + m[0].length);
    if (end < 0) continue;
    out.push({ id, title: attr(m[0], 'heading') ?? id, code: dedent(source.slice(m.index + m[0].length, end)) });
  }
  return out;
}

/** Every case of a component, in the order of the React demo, with the code of each framework. */
export function componentCases(m: Manifest): ComponentCase[] {
  const byFw: Partial<Record<FrameworkId, DemoCaseSource[]>> = {};
  for (const fw of ['react', 'angular', 'native'] as const) {
    const file = demoFile(fw, m);
    if (!file) continue;
    const source = readFileSync(file, 'utf8');
    byFw[fw] = fw === 'angular' ? angularCases(source) : jsxCases(source);
  }
  const order = byFw.react ?? byFw.angular ?? byFw.native ?? [];
  return order.map((c) => {
    const code: Partial<Record<FrameworkId, string>> = {};
    for (const fw of ['react', 'angular', 'native'] as const) {
      const hit = byFw[fw]?.find((x) => x.id === c.id);
      if (hit) code[fw] = hit.code;
    }
    return { id: c.id, title: c.title, code };
  });
}

/** True when the React gallery has a route for this component (a React demo file). */
export function hasGalleryRoute(m: Manifest): boolean {
  return demoFile('react', m)?.endsWith('.demo.tsx') ?? false;
}
