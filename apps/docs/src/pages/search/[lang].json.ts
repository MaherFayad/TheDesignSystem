// The search index, one file per language, built at build time from the
// manifests, the style packs and the hand written pages. No hosted service:
// public/docs.js fetches the file when search first opens and matches in the
// browser.
import { getCollection } from 'astro:content';
import { familyLabel } from '../../../scripts/manifests.ts';
import { caseText, langs, type Lang } from '../../lib/i18n.ts';
import { componentPath, href, manifests, navGroups, styles } from '../../lib/site.ts';

export function getStaticPaths() {
  return langs.map((lang) => ({ params: { lang } }));
}

interface Entry {
  /** Title. */
  t: string;
  /** URL. */
  u: string;
  /** Group label. */
  g: string;
  /** Summary shown under the title. */
  s: string;
  /** Extra words that match but do not show. */
  k: string;
}

export async function GET({ params }: { params: { lang: Lang } }) {
  const lang = params.lang;
  const ar = lang === 'ar';
  const out: Entry[] = [];
  const groupOf = new Map<string, string>();
  for (const g of navGroups()) for (const l of [...g.links, ...(g.sub ?? []).flatMap((s) => s.links)]) groupOf.set(l.path, g.label[lang]);

  for (const m of manifests) {
    const fam = familyLabel(m.family);
    out.push({
      t: m.name,
      u: href(lang, componentPath(m)),
      g: `${ar ? 'المكونات' : 'Components'}, ${fam[lang]}`,
      s: m.summary,
      k: [fam.en, fam.ar, ...m.useWhen, ...Object.keys(m.insteadUse), ...Object.keys(m.props ?? {}), m.a11y?.role ?? '', ...Object.values(m.content?.ar ?? {})].join(' '),
    });
  }
  for (const s of styles) {
    out.push({ t: s.name, u: href(lang, `/styles/${s.id}/`), g: ar ? 'الأنماط' : 'Styles', s: s.dials.base ?? '', k: Object.values(s.dials).join(' ') });
  }
  const entries = await getCollection('docs');
  for (const e of entries) {
    const isAr = e.id === 'ar' || e.id.startsWith('ar/');
    if (isAr !== ar) continue;
    const rest = isAr ? e.id.replace(/^ar\/?/, '') : e.id;
    const path = `/${rest}/`;
    const headings = [...(e.body ?? '').matchAll(/^#{2,3}\s+(.+)$/gm)].map((h) => h[1]).join(' ');
    out.push({ t: e.data.title, u: href(lang, path), g: groupOf.get(path) ?? (ar ? 'الأدلة' : 'Guides'), s: e.data.description ?? '', k: headings });
  }
  out.push({ t: ar ? 'المكونات' : 'Components', u: href(lang, '/components/'), g: ar ? 'المكونات' : 'Components', s: ar ? 'كل المكونات حسب الفئة' : 'Every component by family', k: Object.values(caseText).map((c) => c[lang][0]).join(' ') });
  out.push({ t: ar ? 'التغطية' : 'Coverage', u: href(lang, '/frameworks/coverage/'), g: ar ? 'أطر العمل' : 'Frameworks', s: ar ? 'الحالة لكل مكون في كل إطار عمل' : 'The status of every component in each framework', k: 'React Angular Native' });
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
