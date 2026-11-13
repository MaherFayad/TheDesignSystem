// The docs site: plain Astro layouts, no client framework. English at the
// root and Arabic under /ar/, from one route file (src/pages/[...path].astro).
// Component pages are built from the manifests and the demo files on every
// build, so a new manifest needs no change here.
import { defineConfig } from 'astro/config';
import { galleryLinks } from './scripts/gallery.ts';

export default defineConfig({
  site: process.env.DOCS_SITE_URL || undefined,
  devToolbar: { enabled: false },
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // Keep `:dir(rtl)` in the system CSS as written: an older CSS target makes
  // the minifier rewrite it into a `:lang()` list.
  vite: { build: { cssTarget: ['chrome120', 'edge120', 'firefox115', 'safari16.4'] } },
  markdown: {
    // Smart punctuation turns -- into an en dash, which the no dash gate forbids.
    smartypants: false,
    shikiConfig: {
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
      defaultColor: false,
    },
  },
  // Hand pages link to the gallery as gallery:/path (scripts/gallery.ts).
  integrations: [galleryLinks()],
});
