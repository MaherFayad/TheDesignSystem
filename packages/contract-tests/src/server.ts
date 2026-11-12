// Starting and stopping a gallery for the scripts that need one: the contract
// suite (run.ts), the screenshot matrix (scripts/shots.ts) and the axe sweep
// (scripts/a11y.ts). Each run picks a free port and starts the gallery of one
// framework there, so several runs on one machine do not collide.
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import type { Browser } from '@playwright/test';
import { demoPath } from './lib';

export function freePort(): Promise<number> {
  return new Promise((ok, fail) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', fail);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(() => ok(port));
    });
  });
}

export async function waitFor(url: string, server: ChildProcess, ms: number): Promise<void> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (server.exitCode !== null) throw new Error(`the gallery server exited with code ${server.exitCode}`);
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`the gallery did not answer at ${url} within ${ms / 1000}s`);
}

/** The folder of a framework's gallery app. */
export function galleryDir(repo: string, framework: string): string {
  return join(repo, framework === 'react' ? 'apps/gallery-react' : 'apps/gallery-angular');
}

/** True when the gallery app of a framework exists (it has a package.json). */
export function galleryExists(repo: string, framework: string): boolean {
  return existsSync(join(galleryDir(repo, framework), 'package.json'));
}

export function startGallery(repo: string, framework: string, port: number): ChildProcess {
  const env = { ...process.env, PORT: String(port) };
  if (framework === 'react') {
    return spawn('npx', ['vite', '--port', String(port), '--strictPort'], { cwd: galleryDir(repo, framework), env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  }
  // The Angular gallery runs its dev script with PORT set and --port passed.
  return spawn('npm', ['run', 'dev', '--', '--port', String(port)], { cwd: galleryDir(repo, framework), env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
}

export function stop(server: ChildProcess | undefined): void {
  if (!server?.pid || server.exitCode !== null) return;
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill('SIGTERM');
  }
}

export interface Gallery {
  url: string;
  /** Stops the server when this run started it. Safe to call twice. */
  close: () => void;
}

/**
 * Starts the gallery of a framework on a free port and waits for it. Another
 * run may take the free port between the pick and the bind (strictPort makes
 * the server exit then), so it picks again a few times.
 */
export async function launchGallery(repo: string, framework: string, opts: { timeoutMs?: number; log?: (line: string) => void } = {}): Promise<Gallery> {
  const say = opts.log ?? ((line: string) => console.log(line));
  for (let attempt = 1; ; attempt += 1) {
    const port = await freePort();
    const url = `http://localhost:${port}`;
    say(`Starting the ${framework} gallery at ${url}`);
    const server = startGallery(repo, framework, port);
    let log = '';
    server.stdout?.on('data', (d: Buffer) => (log += d.toString()));
    server.stderr?.on('data', (d: Buffer) => (log += d.toString()));
    try {
      await waitFor(url, server, opts.timeoutMs ?? 90_000);
      return { url, close: () => stop(server) };
    } catch (err) {
      stop(server);
      if (attempt >= 5 || server.exitCode === null) {
        const e = err instanceof Error ? err : new Error(String(err));
        e.message = `${e.message}\n${log.slice(-4000)}`;
        throw e;
      }
      say(`The gallery could not take port ${port}; trying another.`);
    }
  }
}

/** Which components render a demo at /c/<kebab>. */
export async function probeRoutes(browser: Browser, url: string, kebabs: string[]): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  const page = await browser.newPage();
  try {
    for (const kebab of kebabs) {
      await page.goto(`${url}${demoPath(kebab, { dir: 'ltr', lang: 'en' })}`);
      out[kebab] = await page
        .locator('[data-demo-case]')
        .first()
        .waitFor({ state: 'attached', timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
    }
  } finally {
    await page.close();
  }
  return out;
}
