// Builds the docs and the React gallery as one static site in apps/docs/dist:
//
//   dist/            the Astro docs, English at the root, Arabic under /ar/
//   dist/gallery/    the React gallery, built with the base path /gallery/
//
// The previews and the home page links point at /gallery, so one static host
// serves everything. The gallery is a single page app: apps/docs/vercel.json
// rewrites every path under /gallery/ to dist/gallery/index.html, and
// scripts/serve-site.ts does the same locally. The link check runs last, on
// the whole output.
//
// Run: npm run build:site -w @the-system/docs
// SITE_GALLERY_PATH changes the path (default /gallery). DOCS_SITE_URL, when
// set, gives Starlight its site URL (sitemap, absolute llms.txt links).
//
// The plain `npm run build` and `npm run check` are unchanged: they still
// point the previews at a gallery on http://localhost:4173.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const app = join(import.meta.dirname, '..');
const repo = join(app, '..', '..');
const gallery = join(repo, 'apps', 'gallery-react');
const dist = join(app, 'dist');

const galleryPath = `/${(process.env.SITE_GALLERY_PATH ?? '/gallery').replace(/^\/+|\/+$/g, '')}`;
if (galleryPath === '/') throw new Error('SITE_GALLERY_PATH must name a folder, for example /gallery.');

const env = {
  ...process.env,
  ASTRO_TELEMETRY_DISABLED: '1',
  DOCS_GALLERY_URL: galleryPath,
  GALLERY_BASE: `${galleryPath}/`,
};

function run(step: string, cmd: string, args: string[], cwd: string): void {
  const started = Date.now();
  console.log(`site: ${step}`);
  execFileSync(cmd, args, { cwd, env, stdio: 'inherit' });
  console.log(`site: ${step} done in ${((Date.now() - started) / 1000).toFixed(1)} s`);
}

// 1. The docs (generates pages and twins, then astro build, which clears dist).
run('docs', 'npm', ['run', 'build'], app);

// 2. The gallery, into dist/gallery, with its base path.
run('gallery', 'npx', ['vite', 'build', '--outDir', join(dist, galleryPath.slice(1)), '--emptyOutDir'], gallery);
if (!existsSync(join(dist, galleryPath.slice(1), 'index.html'))) throw new Error('The gallery build wrote no index.html.');

// 3. The link check on the whole site, with the same gallery path.
run('links', 'npx', ['tsx', 'scripts/check-links.ts'], app);

console.log(`site: ready in ${dist}, gallery at ${galleryPath}/`);
console.log('site: serve it with npm run serve:site -w @the-system/docs');
