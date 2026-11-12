// Builds the app, serves the production build on a free port, runs the
// Playwright smoke spec against it and stops the server.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, { cwd: app, stdio: 'inherit', env: { ...process.env, ...env } });
  return res.status ?? 1;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitFor(url, ms = 60_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not answer at ${url}`);
}

if (run('npm', ['run', 'build']) !== 0) process.exit(1);

const port = await freePort();
const url = `http://127.0.0.1:${port}`;
const server = spawn('npx', ['next', 'start', '-p', String(port), '-H', '127.0.0.1'], {
  cwd: app,
  stdio: ['ignore', 'inherit', 'inherit'],
  detached: true,
});

let code = 1;
try {
  await waitFor(`${url}/en`);
  code = run('npx', ['playwright', 'test', '-c', 'playwright.config.ts'], { SMOKE_URL: url });
} finally {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    // already gone
  }
}
process.exit(code);
