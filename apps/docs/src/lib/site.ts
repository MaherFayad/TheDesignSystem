// The site model: the sidebar groups, the page order for previous and next,
// and the URL helpers. Components and styles are read from disk on every
// build, so a new manifest or a new style pack needs no change here.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { familyLabel, readManifests, repoRoot, sectionOf, slugOf, type Manifest } from '../../scripts/manifests.ts';
import { readStyles } from '../../scripts/styles.ts';
import type { Lang } from './i18n.ts';

export const config = JSON.parse(readFileSync(join(repoRoot, 'ds.config.json'), 'utf8')) as { name: string; version: string };

export const manifests: Manifest[] = readManifests();
export const styles = readStyles();

/** A public source URL for the top bar. None exists yet, so the bar shows no source link. */
export const sourceUrl: string | undefined = undefined;

/** A site path in a language: `/components/button/` is `/ar/components/button/` in Arabic. */
export function href(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return lang === 'ar' ? (clean === '/' ? '/ar/' : `/ar${clean}`) : clean;
}

/** The path of a page without its language prefix. */
export function stripLang(path: string): string {
  return path.replace(/^\/ar(?=\/|$)/, '') || '/';
}

export interface NavLink {
  label: { en: string; ar: string };
  path: string;
  /** English names (components) stay English on Arabic pages, in an isolate. */
  latin?: boolean;
}

export interface NavGroup {
  id: string;
  label: { en: string; ar: string };
  links: NavLink[];
  /** Families inside the components group, each collapsible. */
  sub?: { id: string; label: { en: string; ar: string }; links: NavLink[] }[];
}

/** The family order of the plan's appendix. */
const familyOrder = ['actions', 'forms', 'selection', 'feedback', 'overlays', 'navigation', 'layout', 'data-display', 'foundations'];

export function componentPath(m: Manifest): string {
  return `/${sectionOf(m.kind)}/${slugOf(m.name)}/`;
}

export function families(): { id: string; label: { en: string; ar: string }; items: Manifest[] }[] {
  const comps = manifests.filter((m) => m.kind === 'component');
  const ids = [...new Set(comps.map((m) => m.family))].sort((a, b) => {
    const ia = familyOrder.indexOf(a);
    const ib = familyOrder.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'en');
  });
  return ids.map((id) => ({ id, label: familyLabel(id), items: comps.filter((m) => m.family === id) }));
}

export function navGroups(): NavGroup[] {
  return [
    {
      id: 'start',
      label: { en: 'Getting started', ar: 'البداية' },
      links: [
        { label: { en: 'Introduction', ar: 'المقدمة' }, path: '/' },
        { label: { en: 'Installation', ar: 'التثبيت' }, path: '/getting-started/' },
        { label: { en: 'Overview of the docs', ar: 'دليل التوثيق' }, path: '/overview/' },
      ],
    },
    {
      id: 'foundations',
      label: { en: 'Foundations', ar: 'الأساسيات' },
      links: [
        { label: { en: 'Tokens', ar: 'الرموز التصميمية' }, path: '/foundations/tokens/' },
        { label: { en: 'Runtime axes', ar: 'محاور التشغيل' }, path: '/foundations/axes/' },
      ],
    },
    {
      id: 'styles',
      label: { en: 'Styles', ar: 'الأنماط' },
      links: [
        { label: { en: 'All styles', ar: 'كل الأنماط' }, path: '/styles/' },
        ...styles.map((s) => ({ label: { en: s.name, ar: s.name }, path: `/styles/${s.id}/`, latin: true })),
      ],
    },
    {
      id: 'platforms',
      label: { en: 'Platforms', ar: 'المنصات' },
      links: [
        { label: { en: 'Platforms', ar: 'المنصات' }, path: '/platforms/' },
        { label: { en: 'Interactions', ar: 'التفاعلات' }, path: '/interactions/' },
      ],
    },
    {
      id: 'components',
      label: { en: 'Components', ar: 'المكونات' },
      links: [{ label: { en: 'All components', ar: 'كل المكونات' }, path: '/components/' }],
      sub: families().map((f) => ({
        id: f.id,
        label: f.label,
        links: f.items.map((m) => ({ label: { en: m.name, ar: m.name }, path: componentPath(m), latin: true })),
      })),
    },
    {
      id: 'patterns',
      label: { en: 'Patterns', ar: 'الأنماط التصميمية' },
      links: [{ label: { en: 'Patterns', ar: 'الأنماط التصميمية' }, path: '/patterns/' }],
    },
    {
      id: 'accessibility',
      label: { en: 'Accessibility', ar: 'إمكانية الوصول' },
      links: [{ label: { en: 'Accessibility', ar: 'إمكانية الوصول' }, path: '/accessibility/' }],
    },
    {
      id: 'content',
      label: { en: 'Content', ar: 'المحتوى' },
      links: [
        { label: { en: 'English', ar: 'الإنجليزية' }, path: '/content/english/' },
        { label: { en: 'Arabic', ar: 'العربية' }, path: '/content/arabic/' },
      ],
    },
    {
      id: 'frameworks',
      label: { en: 'Frameworks', ar: 'أطر العمل' },
      links: [
        { label: { en: 'Setup', ar: 'الإعداد' }, path: '/frameworks/setup/' },
        { label: { en: 'Coverage', ar: 'التغطية' }, path: '/frameworks/coverage/' },
      ],
    },
  ];
}

/** Every page in sidebar order, for previous and next. */
export function pageOrder(): NavLink[] {
  const out: NavLink[] = [];
  for (const g of navGroups()) {
    out.push(...g.links);
    for (const s of g.sub ?? []) out.push(...s.links);
  }
  return out;
}

export function neighbours(path: string): { prev?: NavLink; next?: NavLink } {
  const order = pageOrder();
  const i = order.findIndex((l) => l.path === path);
  if (i < 0) return {};
  return { prev: order[i - 1], next: order[i + 1] };
}

/** Ready counts per framework, for the home page and the coverage page. */
export function coverage(): { total: number; react: number; angular: number; native: number } {
  const comps = manifests.filter((m) => m.kind === 'component');
  const count = (fw: 'react' | 'angular' | 'native') => comps.filter((m) => m.frameworks[fw]?.status === 'ready').length;
  return { total: comps.length, react: count('react'), angular: count('angular'), native: count('native') };
}
