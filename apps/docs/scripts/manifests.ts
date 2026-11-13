// Reads every manifest under packages/manifest/src/<kind>/. Shared by the page
// generator and the Astro config (sidebar). A new manifest file needs no
// change here: the folder is listed on every run.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * The repo root: three levels up from this file, or, when this module runs
 * bundled inside the Astro build output, the first folder above the working
 * directory that holds ds.config.json.
 */
function findRoot(): string {
  const here = join(import.meta.dirname ?? '.', '..', '..', '..');
  if (existsSync(join(here, 'ds.config.json'))) return here;
  let dir = process.cwd();
  while (!existsSync(join(dir, 'ds.config.json'))) {
    const up = dirname(dir);
    if (up === dir) return here;
    dir = up;
  }
  return dir;
}

export const repoRoot = findRoot();
const manifestRoot = join(repoRoot, 'packages', 'manifest', 'src');

export type FrameworkId = 'react' | 'angular' | 'native';
export const frameworkIds: readonly FrameworkId[] = ['react', 'angular', 'native'];

export interface Framework {
  status: 'ready' | 'planned' | 'not-applicable';
  behavior?: string;
  example?: string;
  note?: string;
}

export interface Prop {
  type?: string | string[];
  default?: unknown;
  description?: string;
  required?: boolean;
}

export interface Manifest {
  name: string;
  kind: string;
  family: string;
  summary: string;
  useWhen: string[];
  avoidWhen: string[];
  insteadUse: Record<string, string>;
  anatomy?: string[];
  parts?: Record<string, string>;
  slots?: Record<string, { accepts?: string | string[]; min?: number; max?: number }>;
  props?: Record<string, Prop | string>;
  states?: string[];
  a11y?: {
    role?: string;
    focus?: string;
    keys?: Record<string, string>;
    announce?: string;
    notes?: string[];
  };
  content?: Record<string, Record<string, string>>;
  tokens?: string[];
  motion?: string;
  frameworks: Record<FrameworkId, Framework>;
  styles?: Record<string, string>;
  mistakes?: { wrong: string; right: string }[];
  since: string;
}

/** The URL slug, the same rule as the gallery routes in scripts/gen-index.ts. */
export function slugOf(name: string): string {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/** The docs section of a kind: component pages live under /components/. */
export function sectionOf(kind: string): string {
  return `${kind}s`;
}

export function readManifests(): Manifest[] {
  const out: Manifest[] = [];
  if (!existsSync(manifestRoot)) return out;
  for (const kind of readdirSync(manifestRoot).sort()) {
    const dir = join(manifestRoot, kind);
    for (const file of readdirSync(dir).sort()) {
      if (!file.endsWith('.manifest.json')) continue;
      out.push(JSON.parse(readFileSync(join(dir, file), 'utf8')) as Manifest);
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

/** Family labels for the sidebar. A family not listed here shows its id in words. */
export const familyLabels: Record<string, { en: string; ar: string }> = {
  actions: { en: 'Actions', ar: 'الإجراءات' },
  containers: { en: 'Containers', ar: 'الحاويات' },
  'data-display': { en: 'Data display', ar: 'عرض البيانات' },
  feedback: { en: 'Feedback', ar: 'الإفادة والحالة' },
  forms: { en: 'Forms', ar: 'النماذج' },
  foundations: { en: 'Foundations', ar: 'الأساسيات' },
  layout: { en: 'Layout', ar: 'التخطيط' },
  media: { en: 'Media', ar: 'الوسائط' },
  navigation: { en: 'Navigation', ar: 'التنقل' },
  overlays: { en: 'Overlays', ar: 'الطبقات العائمة' },
  selection: { en: 'Selection', ar: 'الاختيار' },
};

export function familyLabel(family: string): { en: string; ar: string } {
  const known = familyLabels[family];
  if (known) return known;
  const words = family.replace(/[-_]+/g, ' ');
  const en = words.charAt(0).toUpperCase() + words.slice(1);
  return { en, ar: en };
}

/** Kind labels for the sidebar groups. */
export const kindLabels: Record<string, { en: string; ar: string }> = {
  component: { en: 'Components', ar: 'المكونات' },
  pattern: { en: 'Patterns', ar: 'الأنماط' },
  template: { en: 'Templates', ar: 'القوالب' },
};

export function kindLabel(kind: string): { en: string; ar: string } {
  return kindLabels[kind] ?? familyLabel(sectionOf(kind));
}
