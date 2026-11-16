// The servers a comparison needs: the GoBanana app from a copy in the
// scratch folder, the Figma-Killer-2 harness built in the scratch folder from
// the FK2 source tree, and the React gallery. Both source repos are read
// only: the harness reads files and runs `git rev-parse` and `git status`
// there, and writes only under the scratch folder.
import { execFileSync, spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { freePort, launchGallery, stop, waitFor } from '../server';
import { COMPARE_DIR } from './pairs';

export const REPO = resolve(COMPARE_DIR, '../../../..');

export interface Server {
  url: string;
  /** What a reader of the table needs to know about how this side was served. */
  notes: string[];
  close: () => Promise<void>;
}

type Log = (line: string) => void;

/** A scratch path as notes show it, so reports never carry a machine's folder names. */
const shown = (path: string): string => `<scratch>${path.slice(scratchRoot().length)}`;

/** The source repos. Environment variables move them for a test machine. */
export function sourceRoots(): { gb: string; fk2: string } {
  return {
    gb: process.env.DS_GB_ROOT ?? '/home/user/gobanana',
    fk2: process.env.DS_FK2_ROOT ?? '/home/user/maherfayad-stack/figma-killer-2',
  };
}

const inside = (child: string, parent: string): boolean => {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith(sep) && !/^[a-zA-Z]:/.test(rel));
};

/**
 * The scratch folder: DS_COMPARE_SCRATCH, else <tmp>/ds-compare. It must lie
 * outside this repo and outside both source repos.
 */
export function scratchRoot(): string {
  const dir = resolve(process.env.DS_COMPARE_SCRATCH ?? join(tmpdir(), 'ds-compare'));
  const roots = sourceRoots();
  for (const [name, root] of [['this repo', REPO], ['GoBanana', roots.gb], ['Figma-Killer-2', roots.fk2]] as const) {
    if (inside(dir, resolve(root))) throw new Error(`The scratch folder ${dir} lies inside ${name}; set DS_COMPARE_SCRATCH to a folder outside it`);
  }
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** A read only fingerprint of a source repo: its HEAD and its uncommitted changes. */
export function fingerprint(root: string): string {
  const git = (args: string[]): string => {
    try {
      return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return '';
    }
  };
  return createHash('sha256').update(git(['rev-parse', 'HEAD'])).update(git(['status', '--porcelain'])).digest('hex').slice(0, 16);
}

/** The short commit of a source repo, for the notes; "unknown" when git cannot say. */
export function commitOf(root: string): string {
  try {
    const dirty = execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() !== '';
    return `${execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()}${dirty ? ' with uncommitted changes' : ''}`;
  } catch {
    return 'unknown';
  }
}

function spawnServer(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): { child: ChildProcess; tail: () => string } {
  const child = spawn(cmd, args, { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  const keep = (d: Buffer) => {
    log = (log + d.toString()).slice(-6000);
  };
  child.stdout?.on('data', keep);
  child.stderr?.on('data', keep);
  return { child, tail: () => log };
}

// ---------------------------------------------------------------- GoBanana

/** Folders never copied from the GoBanana app. */
const GB_SKIP = new Set(['node_modules', '.next', '.git', '.open-next', '.wrangler', 'test-results', 'playwright-report']);

/**
 * Copies GoBanana's app (banana-server) to the scratch folder and installs it
 * with `npm ci --ignore-scripts`, both only when the source or its lockfile
 * changed since the last run.
 */
export function prepareGb(log: Log): string {
  const src = join(sourceRoots().gb, 'banana-server');
  if (!existsSync(join(src, 'package.json'))) throw new Error(`GoBanana's app is not at ${src}`);
  const dest = join(scratchRoot(), 'gb', 'banana-server');
  const stampFile = join(dest, '.ds-compare-stamp.json');
  const print = fingerprint(sourceRoots().gb);
  const lockHash = createHash('sha256').update(readFileSync(join(src, 'package-lock.json'))).digest('hex').slice(0, 16);
  const stamp = existsSync(stampFile) ? (JSON.parse(readFileSync(stampFile, 'utf8')) as { print?: string; lock?: string; installed?: boolean }) : {};
  if (stamp.print !== print || !existsSync(join(dest, 'package.json'))) {
    log(`Copying GoBanana's app to ${dest}`);
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(dest)) {
      if (entry !== 'node_modules') rmSync(join(dest, entry), { recursive: true, force: true });
    }
    cpSync(src, dest, {
      recursive: true,
      filter: (from) => !relative(src, from).split(sep).some((part) => GB_SKIP.has(part)),
    });
  }
  if (stamp.lock !== lockHash || !stamp.installed || !existsSync(join(dest, 'node_modules', 'next'))) {
    log('Installing the GoBanana copy (npm ci --ignore-scripts), once per lockfile');
    const res = spawnSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: dest, stdio: ['ignore', 'inherit', 'inherit'] });
    if (res.status !== 0) throw new Error('npm ci failed in the GoBanana copy');
  }
  writeFileSync(stampFile, JSON.stringify({ print, lock: lockHash, installed: true }, null, 2));
  return dest;
}

/**
 * Runs the copy with `next dev` and the repo's own end to end bypass (its
 * playwright.config.ts): a fixed signed in user, admin fixtures, no database.
 */
export async function startGb(firstPath: string, log: Log): Promise<Server> {
  const dir = prepareGb(log);
  for (let attempt = 1; ; attempt += 1) {
    const port = await freePort();
    const url = `http://localhost:${port}`;
    log(`Starting GoBanana (next dev) at ${url}`);
    const env = { ...process.env, E2E_AUTH_BYPASS: '1', ADMIN_FIXTURES: '1', DATABASE_URL: '', NEXT_TELEMETRY_DISABLED: '1', PORT: String(port) };
    const { child, tail } = spawnServer('npx', ['next', 'dev', '-p', String(port)], dir, env);
    try {
      await waitFor(`${url}${firstPath}`, child, 240_000);
      return {
        url,
        notes: [`GoBanana at commit ${commitOf(sourceRoots().gb)}, from a copy at ${shown(dir)}, next dev, E2E_AUTH_BYPASS=1 ADMIN_FIXTURES=1 DATABASE_URL empty`],
        close: async () => stop(child),
      };
    } catch (err) {
      stop(child);
      if (attempt >= 3) throw new Error(`${err instanceof Error ? err.message : String(err)}\n${tail()}`);
      log(`GoBanana did not start on ${port}; trying another port`);
    }
  }
}

// ---------------------------------------------------------------- Figma-Killer-2

/** The PascalCase export name an icon module path stands for: icons/chevron-right gives ChevronRightIcon. */
export function iconExportName(id: string): string {
  const base = id.split('/').pop() ?? 'icon';
  return `${base.replace(/(^|-)([a-z0-9])/g, (_m, _d: string, c: string) => c.toUpperCase())}Icon`;
}

/**
 * FK2 cannot run as an app: it needs a third party package from its vendor
 * folder at install. The harness renders FK2's own primitives and
 * src/styles/globals.css from its source tree through Vite aliases, from a
 * folder in the scratch space. Rules it keeps:
 * - any import that resolves into FK2's vendor folder becomes an empty module,
 *   and the dev server is not allowed to read that folder at all;
 * - FK2's pixel icons become empty boxes of the same size (their set declares
 *   no licence, and icons are an allowed difference);
 * - React and Vite come from this repo, through a link in the scratch folder.
 */
export async function startFk2(log: Log): Promise<Server> {
  const fk2 = sourceRoots().fk2;
  if (!existsSync(join(fk2, 'src', 'styles', 'globals.css'))) throw new Error(`Figma-Killer-2 is not at ${fk2}`);
  const dir = join(scratchRoot(), 'fk2');
  mkdirSync(dir, { recursive: true });
  copyFileSync(join(COMPARE_DIR, 'fk2', 'screens.jsx'), join(dir, 'main.jsx'));
  writeFileSync(
    join(dir, 'index.html'),
    '<!doctype html>\n<html lang="en" dir="ltr">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FK2 harness</title></head>\n<body><div id="root"></div><script type="module" src="/main.jsx"></script></body>\n</html>\n',
  );
  const link = join(dir, 'node_modules');
  if (!existsSync(link)) symlinkSync(join(REPO, 'node_modules'), link, 'dir');

  const vendorDir = join(fk2, 'vendor');
  const blocked = (id: string) => inside(id.split('?')[0] ?? id, vendorDir);
  const vite = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;
  const guard = {
    name: 'ds-compare-fk2-guard',
    enforce: 'pre' as const,
    async resolveId(this: { resolve: (s: string, i?: string, o?: object) => Promise<{ id: string } | null> }, source: string, importer?: string) {
      if (source.startsWith('pixel-art-icons/')) return `\0ds-icon-stub:${source}`;
      if (source.startsWith('\0')) return null;
      const hit = await this.resolve(source, importer, { skipSelf: true });
      if (hit && blocked(hit.id)) return '\0ds-empty-module';
      return hit;
    },
    load(id: string) {
      if (id === '\0ds-empty-module' || blocked(id)) return 'export default {};\n';
      if (id.startsWith('\0ds-icon-stub:')) {
        const name = iconExportName(id.slice('\0ds-icon-stub:'.length));
        return [
          "import { createElement } from 'react';",
          `export function ${name}({ size = 16, className, style }) {`,
          "  return createElement('span', { className, 'aria-hidden': 'true', 'data-icon-stub': '', style: { display: 'inline-block', inlineSize: size, blockSize: size, flex: 'none', ...style } });",
          '}',
          `export default ${name};`,
          '',
        ].join('\n');
      }
      return null;
    },
  };
  for (let attempt = 1; ; attempt += 1) {
    const port = await freePort();
    try {
      const server = await vite.createServer({
        configFile: false,
        root: dir,
        cacheDir: join(dir, '.vite'),
        logLevel: 'warn',
        plugins: [guard, react()],
        resolve: {
          alias: [
            { find: /^@ui\//, replacement: `${join(fk2, 'src', 'ui')}/` },
            { find: /^@core\//, replacement: `${join(fk2, 'src', 'core')}/` },
            { find: /^@fk2\//, replacement: `${join(fk2, 'src')}/` },
            // globals.css loads Inter by package path in url(); this repo ships the same package.
            { find: /^@fontsource-variable\/inter\//, replacement: `${join(REPO, 'node_modules', '@fontsource-variable', 'inter')}/` },
          ],
          dedupe: ['react', 'react-dom'],
        },
        server: { port, strictPort: true, host: '127.0.0.1', fs: { strict: true, allow: [dir, join(fk2, 'src'), join(REPO, 'node_modules')] } },
      });
      await server.listen();
      const url = `http://127.0.0.1:${port}`;
      log(`Started the FK2 harness at ${url}`);
      return {
        url,
        notes: [`Figma-Killer-2 at commit ${commitOf(fk2)}: a reconstruction from FK2's own src/ui components and src/styles/globals.css, rendered by Vite from ${shown(dir)}; FK2 icons are empty boxes of the same size`],
        close: async () => {
          await server.close();
        },
      };
    } catch (err) {
      if (attempt >= 3) throw err;
      log(`The FK2 harness could not take port ${port}; trying another`);
    }
  }
}

// ---------------------------------------------------------------- the system

/** The React gallery on a free port, or an address that already serves it. */
export async function startSystem(url: string | undefined, log: Log): Promise<Server> {
  if (url) return { url, notes: [`System: the React gallery at ${url}`], close: async () => undefined };
  const g = await launchGallery(REPO, 'react', { log, timeoutMs: 120_000 });
  return { url: g.url, notes: ['System: the React gallery (apps/gallery-react, vite dev) from this checkout'], close: async () => g.close() };
}

export async function startSource(repo: 'gb' | 'fk2', firstPath: string, url: string | undefined, log: Log): Promise<Server> {
  if (url) return { url, notes: [`Source: served by the caller at ${url}`], close: async () => undefined };
  return repo === 'gb' ? startGb(firstPath, log) : startFk2(log);
}
