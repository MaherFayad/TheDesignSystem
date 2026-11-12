// The docs site: Astro Starlight, English at the root and Arabic under /ar/.
// The component part of the sidebar is built from the manifests on every
// build, one group per family, so a new manifest needs no change here.
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { galleryLinks } from './scripts/gallery.ts';
import { familyLabel, kindLabel, readManifests, sectionOf, slugOf } from './scripts/manifests.ts';

type SidebarItem = Parameters<typeof starlight>[0]['sidebar'] extends (infer T)[] | undefined ? T : never;

function manifestSidebar(): SidebarItem[] {
  const manifests = readManifests();
  const groups: SidebarItem[] = [];
  for (const kind of [...new Set(manifests.map((m) => m.kind))]) {
    const ofKind = manifests.filter((m) => m.kind === kind);
    const families = [...new Set(ofKind.map((m) => m.family))].sort((a, b) => familyLabel(a).en.localeCompare(familyLabel(b).en, 'en'));
    const label = kindLabel(kind);
    groups.push({
      label: label.en,
      translations: { ar: label.ar },
      items: [
        { slug: sectionOf(kind) },
        ...families.map((family) => {
          const f = familyLabel(family);
          return {
            label: f.en,
            translations: { ar: f.ar },
            collapsed: true,
            items: ofKind.filter((m) => m.family === family).map((m) => ({ slug: `${sectionOf(kind)}/${slugOf(m.name)}` })),
          };
        }),
      ],
    });
  }
  return groups;
}

export default defineConfig({
  site: process.env.DOCS_SITE_URL || undefined,
  devToolbar: { enabled: false },
  // Smart punctuation turns -- into an en dash, which the no dash gate forbids
  // (manifests name private properties such as --_sidebar-width).
  markdown: { smartypants: false },
  integrations: [
    // Hand pages link to the gallery as gallery:/path (scripts/gallery.ts).
    galleryLinks(),
    starlight({
      title: { en: 'The system', ar: 'النظام' },
      description: 'Docs for a design system with one component contract, several style packs and three frameworks.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        ar: { label: 'العربية', lang: 'ar', dir: 'rtl' },
      },
      credits: false,
      lastUpdated: false,
      pagination: true,
      customCss: ['./src/styles/docs.css'],
      head: [{ tag: 'script', attrs: { src: '/docs.js', defer: true } }],
      sidebar: [
        {
          label: 'Start',
          translations: { ar: 'البداية' },
          items: [{ slug: 'index' }],
        },
        {
          label: 'Foundations',
          translations: { ar: 'الأساسيات' },
          items: [{ autogenerate: { directory: 'foundations' } }],
        },
        { slug: 'styles' },
        {
          label: 'Frameworks',
          translations: { ar: 'أطر العمل' },
          items: [{ autogenerate: { directory: 'frameworks' } }],
        },
        {
          label: 'Content',
          translations: { ar: 'المحتوى' },
          items: [{ autogenerate: { directory: 'content' } }],
        },
        { slug: 'accessibility' },
        ...manifestSidebar(),
      ],
    }),
  ],
});
