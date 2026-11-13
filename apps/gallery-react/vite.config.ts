// The React gallery. Packages export source (DECISIONS.md, structure 2), so
// Vite compiles @the-system/* straight from packages/ through the workspace
// links in node_modules. The demos are imported by relative path from
// src/routes.gen.ts, which `npm run gen` writes.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GALLERY_BASE serves the gallery under a path, for example /gallery/ inside
// the docs site build (apps/docs/scripts/build-site.ts). Default: the origin root.
const base = process.env.GALLERY_BASE ?? '/';

// PORT lets parallel agents run their own dev server. Default 5173.
const port = Number(process.env.PORT ?? 5173);

export default defineConfig({
  base,
  plugins: [react()],
  server: { port, strictPort: true },
  preview: { port: 4173, strictPort: true },
  // The system's CSS uses `:dir(rtl)`. With an older CSS target the minifier
  // rewrites it into a `:lang(ar, he, ...)` list, which is wrong for a
  // `dir="ltr"` island on an Arabic page. These are the first versions that
  // support `:dir()`, so the selector is kept as written.
  build: { cssTarget: ['chrome120', 'edge120', 'firefox115', 'safari16.4'] },
});
