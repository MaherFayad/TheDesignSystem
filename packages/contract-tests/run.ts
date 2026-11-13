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
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { kebabCase, loadManifests, readyComponents, reportFile } from './src/lib';
import { galleryExists, launchGallery, probeRoutes, type Gallery } from './src/server';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');

interface Args {
  framework: string;
  url?: string;
  components: string[];
  /** The style of the checks that run once (DS_STYLE). */
  style?: string;
  /** Narrows the per style loops (DS_STYLES). */
  styles?: string;
  /** web, ios or android, added to every URL (DS_PLATFORM). */
  platform?: string;
  /** Minimum target size in px (DS_TARGET_MIN), default 24. */
  targetMin?: string;
  /** Passed to playwright --grep: run only the tests whose title matches. */
  grep?: string;
  /** A name for the report file, in place of the one built from the options. */
  tag?: string;
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
    else if (flag === '--style') out.style = value();
    else if (flag === '--styles') out.styles = value();
    else if (flag === '--platform') out.platform = value();
    else if (flag === '--target-min') out.targetMin = value();
    else if (flag === '--grep') out.grep = value();
    else if (flag === '--tag') out.tag = value();
    else if (flag === '--help' || flag === '-h') {
      console.log('npm run contract -- --framework react|angular [--url http://host:port] [--component Button[,Input]] [--style liquid] [--styles liquid,neutral] [--platform ios] [--target-min 44] [--grep "target size"] [--tag name]');
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

/** Which components render a demo at /c/<kebab>. */
async function probe(url: string, kebabs: string[]): Promise<Record<string, boolean>> {
  const browser = await chromium.launch();
  try {
    return await probeRoutes(browser, url, kebabs);
  } finally {
    await browser.close();
  }
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
  const partial = args.components.length > 0 && !args.tag;
  const runDir = join(here, '.out', String(process.pid));
  // A run on another style, style list, platform or target size writes its own
  // report (contract-react-liquid.json, contract-react-ios.json), never the base one.
  const suffix = args.tag ?? [args.style, args.styles && args.styles !== args.style ? args.styles.replace(/,/g, '-') : undefined, args.platform, args.targetMin ? `min${args.targetMin}` : undefined].filter(Boolean).join('-');
  const report = reportFile(repo, args.framework, partial, process.pid, suffix);
  const tag = suffix ? `${args.framework}-${suffix}` : args.framework;
  // Playwright writes into the run folder; a full run then moves the JSON into place.
  const runJson = join(runDir, partial ? `contract-${tag}.partial.json` : `contract-${tag}.json`);

  if (args.framework === 'angular' && !args.url && !galleryExists(repo, 'angular')) {
    console.log('Angular gallery: not available yet. apps/gallery-angular has no package.json, so the contract suite is skipped for angular.');
    return 0;
  }

  const ready = readyComponents(loadManifests(repo), args.framework, args.components);
  if (ready.length === 0) {
    console.log(`No component manifest is ready for ${args.framework}${args.components.length ? ` among ${args.components.join(', ')}` : ''}. Nothing to run.`);
    return 0;
  }

  let gallery: Gallery | undefined;
  const cleanup = () => gallery?.close();
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
      gallery = await launchGallery(repo, args.framework);
      url = gallery.url;
    }

    const routes = await probe(url, ready.map((m) => kebabCase(m.name)));
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
      DS_STYLE: args.style ?? '',
      DS_STYLES: args.styles ?? '',
      DS_PLATFORM: args.platform ?? '',
      DS_TARGET_MIN: args.targetMin ?? '',
    };
    const status = await new Promise<number>((ok) => {
      const pw = spawn('npx', ['playwright', 'test', '--config', join(here, 'playwright.config.ts'), ...(args.grep ? ['--grep', args.grep] : [])], { cwd: repo, env, stdio: 'inherit' });
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
