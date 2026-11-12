// npm run contract -- --framework react|angular [--url http://...] [--component Button]
//
// Without --url it starts the gallery of the framework on a free port, waits
// for it, probes which components have a demo route, runs the Playwright
// suite with this package's config, stops the server and exits with the test
// status. A full run writes docs/reports/contract-<framework>.json. A run
// narrowed with --component writes
// packages/contract-tests/.out/<pid>/contract-<framework>.partial.json, so it
// never clobbers the full report. Each run keeps its Playwright output in
// packages/contract-tests/.out/<pid>/, so parallel runs do not collide.
import { spawn, type ChildProcess } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { demoPath, kebabCase, loadManifests, readyComponents, reportFile } from './src/lib';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');

interface Args {
  framework: string;
  url?: string;
  components: string[];
}

function parseArgs(argv: string[]): Args {
  const out: Args = { framework: 'react', components: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] ?? '';
    const [flag, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const value = () => inline ?? argv[++i] ?? '';
    if (flag === '--framework') out.framework = value();
    else if (flag === '--url') out.url = value().replace(/\/+$/, '');
    else if (flag === '--component') out.components.push(...value().split(',').map((s) => s.trim()).filter(Boolean));
    else if (flag === '--help' || flag === '-h') {
      console.log('npm run contract -- --framework react|angular [--url http://host:port] [--component Button[,Input]]');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  if (!['react', 'angular'].includes(out.framework)) {
    console.error(`--framework must be react or angular, not ${out.framework}`);
    process.exit(2);
  }
  return out;
}

function freePort(): Promise<number> {
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

async function waitFor(url: string, server: ChildProcess, ms: number): Promise<void> {
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

function startGallery(framework: string, port: number): ChildProcess {
  const env = { ...process.env, PORT: String(port) };
  if (framework === 'react') {
    return spawn('npx', ['vite', '--port', String(port), '--strictPort'], { cwd: join(repo, 'apps/gallery-react'), env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  }
  // The Angular gallery runs its dev script with PORT set and --port passed.
  return spawn('npm', ['run', 'dev', '--', '--port', String(port)], { cwd: join(repo, 'apps/gallery-angular'), env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
}

function stop(server: ChildProcess | undefined): void {
  if (!server?.pid || server.exitCode !== null) return;
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill('SIGTERM');
  }
}

/** Which components render a demo at /c/<kebab>. */
async function probeRoutes(url: string, kebabs: string[]): Promise<Record<string, boolean>> {
  const browser = await chromium.launch();
  const out: Record<string, boolean> = {};
  try {
    const page = await browser.newPage();
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
    await browser.close();
  }
  return out;
}

interface JsonSpec {
  title: string;
  tests: { status: string; results: { status: string }[] }[];
}
interface JsonSuite {
  specs?: JsonSpec[];
  suites?: JsonSuite[];
}

/** One line per component: passed, failed and skipped tests, and the failing checks. */
function summary(file: string): void {
  if (!existsSync(file)) return;
  const report = JSON.parse(readFileSync(file, 'utf8')) as { suites: JsonSuite[] };
  const rows = new Map<string, { pass: number; fail: string[]; skip: number }>();
  const walk = (s: JsonSuite) => {
    for (const spec of s.specs ?? []) {
      const name = spec.title.split(':')[0] ?? spec.title;
      const row = rows.get(name) ?? { pass: 0, fail: [], skip: 0 };
      for (const t of spec.tests) {
        if (t.status === 'skipped') row.skip += 1;
        else if (t.status === 'expected' || t.status === 'flaky') row.pass += 1;
        else row.fail.push(spec.title.slice(name.length + 1).trim());
      }
      rows.set(name, row);
    }
    for (const c of s.suites ?? []) walk(c);
  };
  report.suites.forEach(walk);
  console.log('\nContract summary');
  for (const [name, r] of [...rows].sort(([a], [b]) => a.localeCompare(b))) {
    const state = r.fail.length ? 'FAIL' : r.pass ? 'pass' : 'skip';
    console.log(`${state}  ${name}: ${r.pass} passed, ${r.fail.length} failed, ${r.skip} skipped${r.fail.length ? `\n      failed: ${r.fail.join('; ')}` : ''}`);
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const partial = args.components.length > 0;
  const runDir = join(here, '.out', String(process.pid));
  const report = reportFile(repo, args.framework, partial, process.pid);
  // Playwright writes into the run folder; a full run then moves the JSON into place.
  const runJson = join(runDir, partial ? `contract-${args.framework}.partial.json` : `contract-${args.framework}.json`);

  if (args.framework === 'angular' && !args.url && !existsSync(join(repo, 'apps/gallery-angular/package.json'))) {
    console.log('Angular gallery: not available yet. apps/gallery-angular has no package.json, so the contract suite is skipped for angular.');
    return 0;
  }

  const ready = readyComponents(loadManifests(repo), args.framework, args.components);
  if (ready.length === 0) {
    console.log(`No component manifest is ready for ${args.framework}${args.components.length ? ` among ${args.components.join(', ')}` : ''}. Nothing to run.`);
    return 0;
  }

  let server: ChildProcess | undefined;
  const cleanup = () => stop(server);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  try {
    let url = args.url;
    if (!url) {
      // Another run may take the free port between the pick and the bind
      // (strictPort makes the server exit then), so pick again a few times.
      for (let attempt = 1; ; attempt += 1) {
        const port = await freePort();
        url = `http://localhost:${port}`;
        console.log(`Starting the ${args.framework} gallery at ${url}`);
        server = startGallery(args.framework, port);
        let log = '';
        server.stdout?.on('data', (d: Buffer) => (log += d.toString()));
        server.stderr?.on('data', (d: Buffer) => (log += d.toString()));
        try {
          await waitFor(url, server, 90_000);
          break;
        } catch (err) {
          stop(server);
          if (attempt >= 5 || server.exitCode === null) {
            console.error(log);
            throw err;
          }
          console.log(`The gallery could not take port ${port}; trying another.`);
        }
      }
    }

    const routes = await probeRoutes(url, ready.map((m) => kebabCase(m.name)));
    for (const m of ready) {
      if (!routes[kebabCase(m.name)]) console.log(`note: ${m.name} is ready for ${args.framework} but ${url}/c/${kebabCase(m.name)} renders no demo case. Its checks are skipped.`);
    }

    mkdirSync(runDir, { recursive: true });
    mkdirSync(dirname(report), { recursive: true });
    const env = {
      ...process.env,
      DS_GALLERY_URL: url,
      DS_FRAMEWORK: args.framework,
      DS_COMPONENT: args.components.join(','),
      DS_ROUTES: JSON.stringify(routes),
      DS_CONTRACT_JSON: runJson,
      DS_CONTRACT_OUT: runDir,
    };
    const status = await new Promise<number>((ok) => {
      const pw = spawn('npx', ['playwright', 'test', '--config', join(here, 'playwright.config.ts')], { cwd: repo, env, stdio: 'inherit' });
      pw.on('exit', (code) => ok(code ?? 1));
    });
    if (existsSync(runJson) && runJson !== report) {
      // Copy then rename, so a reader never sees half a file.
      copyFileSync(runJson, `${report}.${process.pid}.tmp`);
      renameSync(`${report}.${process.pid}.tmp`, report);
    }
    summary(report);
    console.log(`\nJSON report: ${report}${partial ? ' (partial run: the full report in docs/reports is untouched)' : ''}`);
    return status;
  } finally {
    cleanup();
  }
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
