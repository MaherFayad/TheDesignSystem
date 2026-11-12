// Where the React gallery lives, for the live previews and the links to it.
//
// DOCS_GALLERY_URL sets it. Default: http://localhost:4173, the gallery's
// `vite preview` port, for local work. The site build
// (scripts/build-site.ts) ships the gallery inside the docs under /gallery
// and sets DOCS_GALLERY_URL=/gallery, so one static host serves both.
//
// Hand written pages link to the gallery as `gallery:/path`, for example
// `[Open the component gallery](gallery:/)`. The build hook below (in
// astro.config.ts) and the twin writer in gen-pages.ts turn that into the
// gallery URL, so the same page works against a local gallery and the
// bundled one. A remark plugin would need @astrojs/markdown-remark, which
// apps/docs does not list, so the hook rewrites the built HTML instead. In
// `astro dev` the links stay as written.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const galleryUrl = (process.env.DOCS_GALLERY_URL ?? 'http://localhost:4173').replace(/\/+$/, '');

/** True when the gallery is served by the docs site itself (a path, not an origin). */
export const galleryBundled = galleryUrl.startsWith('/');

/** A gallery path as a URL: `/c/button` is `<galleryUrl>/c/button`, `/` is `<galleryUrl>/`. */
export function galleryHref(path: string): string {
  return `${galleryUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

const SCHEME = 'gallery:';

/** Replaces every `gallery:/path` link target in Markdown source. */
export function resolveGalleryLinks(markdown: string): string {
  return markdown.replace(/\]\(gallery:([^)\s]*)\)/g, (_, path: string) => `](${galleryHref(path)})`);
}

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(path));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

/** Astro integration: after the build, every `href="gallery:/path"` points at the gallery. */
export function galleryLinks() {
  return {
    name: 'the-system:gallery-links',
    hooks: {
      'astro:build:done': ({ dir }: { dir: URL }) => {
        let links = 0;
        for (const file of htmlFiles(fileURLToPath(dir))) {
          const html = readFileSync(file, 'utf8');
          if (!html.includes(`href="${SCHEME}`)) continue;
          const next = html.replace(/href="gallery:([^"]*)"/g, (_, path: string) => {
            links++;
            return `href="${galleryHref(path)}"`;
          });
          writeFileSync(file, next);
        }
        console.log(`docs: ${links} gallery links point at ${galleryUrl}`);
      },
    },
  };
}
