// Serves the built registry folder over HTTP, so `shadcn add` and `ds add`
// can read it. No dependency: node:http only.
//
// Run: npx tsx packages/registry/serve.ts [--port 4000] [--dir packages/registry/public]
// Items are then at http://localhost:<port>/r/<name>.json
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export function serveRegistry(dir: string, port: number): Promise<Server> {
  const base = resolve(dir);
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const file = normalize(join(base, decodeURIComponent(url.pathname)));
    if (!file.startsWith(base) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end('{"error":"not found"}');
      return;
    }
    res.writeHead(200, { 'content-type': file.endsWith('.json') ? 'application/json' : 'text/plain' });
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { port: { type: 'string' }, dir: { type: 'string' } } });
  const port = Number(values.port ?? 4000);
  const dir = values.dir ?? join(import.meta.dirname, 'public');
  serveRegistry(dir, port).then(() => console.log(`registry at http://localhost:${port}/r/registry.json`));
}
