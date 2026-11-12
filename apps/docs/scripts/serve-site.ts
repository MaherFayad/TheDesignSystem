// Serves apps/docs/dist the way the Vercel static host does with
// apps/docs/vercel.json (clean URLs, the /gallery/ rewrite, the cache
// headers), so the site build can be checked before a deploy.
//
// Run: npm run serve:site -w @the-system/docs   (PORT, default 4400)
import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { headersFor, readHostConfig, resolvePath } from './static-host.ts';

const dist = join(import.meta.dirname, '..', 'dist');
const port = Number(process.env.PORT ?? 4400);
const host = readHostConfig();

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.pf_meta': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream',
};

if (!existsSync(dist)) {
  console.error('No apps/docs/dist. Run npm run build:site -w @the-system/docs first.');
  process.exit(1);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://site.local');
  // Clean URLs: a request for page.html redirects to page, as on Vercel.
  if (url.pathname.endsWith('.html') && !url.pathname.endsWith('/index.html')) {
    res.writeHead(308, { Location: `${url.pathname.slice(0, -'.html'.length)}${url.search}` });
    res.end();
    return;
  }
  const found = resolvePath(dist, url.pathname, host);
  const file = found?.file ?? join(dist, '404.html');
  const status = found ? 200 : 404;
  res.writeHead(status, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    ...headersFor(url.pathname, host),
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`site: serving ${dist} on http://localhost:${port}`);
});
