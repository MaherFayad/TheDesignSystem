// npm run a11y -- [--framework react|angular] [--url http://...] [--component a,b] [--workers n]
//
// axe on every gallery page: `/`, `/all` and `/c/<kebab>` for every
// component with a gallery route, in every style and scheme from
// packages/styles/*/style.json, in English ltr and Arabic rtl, with the
// tags wcag2a, wcag2aa, wcag21aa and wcag22aa, minus the manifest's
// contract.skipAxeRules. Overlays (states open and closed, and a trigger in
// the demo) are also checked with the first trigger's root open. `/` and
// `/all` keep the gallery shell; component pages use chrome=0, as the
// contract suite does. Writes docs/reports/a11y-<framework>.json and .md and
// exits 1 on any violation.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { chromium, type Browser, type Page } from '@playwright/test';
import { demoPath, discoverStyles, formatAxe, kebabCase, loadManifests, opensAndCloses, triggerSelector, type AxeCheck, type AxeViolation, type Manifest } from '../packages/contract-tests/src/lib';
import { axeOwners, freshOpen, markSeen } from '../packages/contract-tests/src/page';
import { galleryExists, launchGallery, probeRoutes, type Gallery } from '../packages/contract-tests/src/server';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

interface Args {
  framework: string;
  url?: string;
  components: string[];
  workers: number;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { framework: 'react', components: [], workers: 4 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] ?? '';
    const [flag, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const value = () => inline ?? argv[++i] ?? '';
    if (flag === '--framework') out.framework = value();
    else if (flag === '--url') out.url = value().replace(/\/+$/, '');
    else if (flag === '--component') out.components.push(...value().split(',').map((s) => s.trim()).filter(Boolean));
    else if (flag === '--workers') out.workers = Math.max(1, Number(value()) || 1);
    else if (flag === '--help' || flag === '-h') {
      console.log('npm run a11y -- [--framework react|angular] [--url URL] [--component a,b] [--workers N]');
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

interface Mode {
  style: string;
  scheme: string;
  dir: 'ltr' | 'rtl';
  lang: 'en' | 'ar';
  open: boolean;
}

interface Job {
  page: string;
  path: string;
  mode: Mode;
  skip: string[];
  manifest?: Manifest;
}

interface NodeResult {
  selector: string;
  owner?: string;
  html: string;
  fg?: string;
  bg?: string;
  ratio?: number;
  expected?: string;
}

interface Result {
  page: string;
  path: string;
  mode: Mode;
  skippedRules: string[];
  pass: boolean;
  error?: string;
  violations: { rule: string; impact: string | null; help: string; nodes: NodeResult[] }[];
  lines: string[];
}

function query(mode: Mode, chrome: boolean): string {
  const q = new URLSearchParams({ style: mode.style, scheme: mode.scheme, dir: mode.dir, lang: mode.lang });
  if (!chrome) q.set('chrome', '0');
  return q.toString();
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

async function run(browser: Browser, url: string, job: Job): Promise<Result> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const base: Result = { page: job.page, path: job.path, mode: job.mode, skippedRules: job.skip, pass: false, violations: [], lines: [] };
  try {
    const page = await context.newPage();
    await page.goto(`${url}${job.path}`);
    if (job.page === '/all') {
      await page.locator('[data-gallery="sink"]').waitFor({ state: 'attached', timeout: 30_000 });
      await page.waitForFunction(() => document.querySelector('[data-gallery="loading"]') === null, undefined, { timeout: 30_000 });
    } else if (job.page === '/') {
      await page.locator('[data-gallery="index"], main').first().waitFor({ state: 'attached', timeout: 30_000 });
    } else {
      await page.locator('[data-demo-case]').first().waitFor({ state: 'attached', timeout: 20_000 });
    }
    await settle(page);
    if (job.mode.open && job.manifest) {
      const kebab = kebabCase(job.manifest.name);
      const trigger = triggerSelector(job.manifest);
      const inVariants = `[data-demo-case="variants"] :is(${trigger})`;
      const selector = (await page.locator(inVariants).count()) > 0 ? inVariants : trigger;
      await page.evaluate(markSeen, kebab);
      await page.locator(selector).first().click();
      const deadline = Date.now() + 5_000;
      while ((await page.evaluate(freshOpen, kebab)) === 0) {
        if (Date.now() > deadline) throw new Error(`the first trigger opens no [data-ds=${kebab}]`);
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(300);
      await settle(page);
    }
    // @axe-core/playwright types its Page against its own playwright-core copy.
    let builder = new AxeBuilder({ page }).withTags(TAGS);
    if (job.skip.length) builder = builder.disableRules(job.skip);
    const result = await builder.analyze();
    const violations = result.violations as unknown as AxeViolation[];
    const targets = violations.flatMap((v) => v.nodes.map((n) => n.target.map(String).join(' ')));
    const owners = targets.length ? await page.evaluate(axeOwners, targets) : {};
    base.lines = formatAxe(violations, owners);
    base.violations = violations.map((v) => ({
      rule: v.id,
      impact: v.impact ?? null,
      help: v.help,
      nodes: v.nodes.map((n) => {
        const selector = n.target.map(String).join(' ');
        const node: NodeResult = { selector, owner: owners[selector], html: n.html.replace(/\s+/g, ' ').slice(0, 160) };
        if (v.id === 'color-contrast' || v.id === 'color-contrast-enhanced') {
          const check = [...n.any, ...n.all, ...n.none].find((c: AxeCheck) => c.id === v.id);
          const d = (check?.data ?? {}) as { fgColor?: string; bgColor?: string; contrastRatio?: number; expectedContrastRatio?: string };
          Object.assign(node, { fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, expected: d.expectedContrastRatio });
        }
        return node;
      }),
    }));
    base.pass = violations.length === 0;
    return base;
  } catch (err) {
    base.error = err instanceof Error ? err.message.split('\n')[0] : String(err);
    return base;
  } finally {
    await context.close();
  }
}

async function pool<T>(items: T[], workers: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(workers, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next] as T;
        next += 1;
        await fn(item);
      }
    }),
  );
}

const modeLabel = (m: Mode) => `${m.style} ${m.scheme} ${m.lang} ${m.dir}${m.open ? ' open' : ''}`;

function writeReports(framework: string, results: Result[], skippedNoRoute: string[]): { json: string; md: string } {
  const dir = join(repo, 'docs/reports');
  mkdirSync(dir, { recursive: true });
  const json = join(dir, `a11y-${framework}.json`);
  const md = join(dir, `a11y-${framework}.md`);
  const failing = results.filter((r) => !r.pass);
  writeFileSync(json, `${JSON.stringify({ framework, tags: TAGS, runs: results.length, failing: failing.length, noRoute: skippedNoRoute, results }, null, 2)}\n`);
  const pages = [...new Set(results.map((r) => r.page))];
  const lines = [
    `# Accessibility sweep, ${framework}`,
    '',
    `Made by \`npm run a11y -- --framework ${framework}\`. axe with ${TAGS.join(', ')} on every gallery page, every style and scheme, English ltr and Arabic rtl, overlays closed and with the first trigger's root open. \`/\` and \`/all\` keep the gallery shell; component pages use chrome=0. Rules a manifest lists in contract.skipAxeRules are skipped on its page.`,
    '',
    `${results.length} runs on ${pages.length} pages: ${results.length - failing.length} pass, ${failing.length} fail.${skippedNoRoute.length ? ` No gallery route: ${skippedNoRoute.join(', ')}.` : ''}`,
    '',
  ];
  // One row per page, one column per style, scheme and language; a cell
  // reads closed, then open for an overlay.
  const columns = [...new Set(results.map((r) => `${r.mode.style} ${r.mode.scheme} ${r.mode.lang} ${r.mode.dir}`))];
  lines.push(`| Page | ${columns.join(' | ')} |`, `| --- |${columns.map(() => ' --- |').join('')}`);
  const cell = (r: Result | undefined) => (r ? (r.pass ? 'pass' : `FAIL ${r.error ? 'error' : r.lines.length}`) : '');
  for (const p of pages) {
    const cells = columns.map((c) => {
      const rs = results.filter((r) => r.page === p && `${r.mode.style} ${r.mode.scheme} ${r.mode.lang} ${r.mode.dir}` === c);
      const closed = cell(rs.find((r) => !r.mode.open));
      const opened = rs.find((r) => r.mode.open);
      return opened ? `${closed}, open ${cell(opened)}` : closed;
    });
    lines.push(`| ${p} | ${cells.join(' | ')} |`);
  }
  for (const r of failing) {
    lines.push('', `## ${r.page}, ${modeLabel(r.mode)}`, '', `\`${r.path}\``, '');
    if (r.error) lines.push(`- error: ${r.error}`);
    for (const l of r.lines) lines.push(`- ${l.replace(/\|/g, '/')}`);
  }
  lines.push('');
  writeFileSync(md, lines.join('\n'));
  return { json, md };
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url && !galleryExists(repo, args.framework)) {
    console.log(`${args.framework} gallery: not available, so the sweep is skipped.`);
    return 0;
  }
  let gallery: Gallery | undefined;
  const url = args.url ?? (gallery = await launchGallery(repo, args.framework, { timeoutMs: args.framework === 'angular' ? 240_000 : 90_000 })).url;
  process.on('SIGINT', () => {
    gallery?.close();
    process.exit(130);
  });
  const browser = await chromium.launch();
  try {
    const wanted = args.components.map((c) => c.toLowerCase());
    const manifests = loadManifests(repo)
      .filter((m) => m.kind === 'component')
      .filter((m) => wanted.length === 0 || wanted.includes(m.name.toLowerCase()) || wanted.includes(kebabCase(m.name)))
      .sort((a, b) => a.name.localeCompare(b.name));
    const routes = await probeRoutes(browser, url, manifests.map((m) => kebabCase(m.name)));
    const routed = manifests.filter((m) => routes[kebabCase(m.name)]);
    const noRoute = manifests.filter((m) => !routes[kebabCase(m.name)]).map((m) => m.name);
    const styles = discoverStyles(repo);
    const modes: Mode[] = styles.flatMap((s) =>
      s.schemes.flatMap((scheme) => [
        { style: s.id, scheme, dir: 'ltr' as const, lang: 'en' as const, open: false },
        { style: s.id, scheme, dir: 'rtl' as const, lang: 'ar' as const, open: false },
      ]),
    );
    const jobs: Job[] = [];
    if (wanted.length === 0) {
      const allSkips = [...new Set(routed.flatMap((m) => m.contract?.skipAxeRules ?? []))];
      for (const mode of modes) {
        jobs.push({ page: '/', path: `/?${query(mode, true)}`, mode, skip: [] });
        jobs.push({ page: '/all', path: `/all?${query(mode, true)}`, mode, skip: allSkips });
      }
    }
    for (const m of routed) {
      const kebab = kebabCase(m.name);
      const skip = m.contract?.skipAxeRules ?? [];
      for (const mode of modes) {
        jobs.push({ page: `/c/${kebab}`, path: demoPath(kebab, { style: mode.style, scheme: mode.scheme, dir: mode.dir, lang: mode.lang }), mode, skip, manifest: m });
        if (opensAndCloses(m)) jobs.push({ page: `/c/${kebab}`, path: demoPath(kebab, { style: mode.style, scheme: mode.scheme, dir: mode.dir, lang: mode.lang }), mode: { ...mode, open: true }, skip, manifest: m });
      }
    }
    console.log(`${args.framework}: ${jobs.length} axe runs on ${new Set(jobs.map((j) => j.page)).size} pages.${noRoute.length ? ` No gallery route: ${noRoute.join(', ')}.` : ''}`);
    const results: Result[] = [];
    await pool(jobs, args.workers, async (job) => {
      const r = await run(browser, url, job);
      results.push(r);
      if (!r.pass) console.log(`FAIL ${job.page} ${modeLabel(job.mode)}${r.error ? `: ${r.error}` : ''}${r.lines.map((l) => `\n      ${l}`).join('')}`);
    });
    const order = (r: Result) => `${r.page}|${r.mode.style}|${r.mode.scheme}|${r.mode.dir}|${r.mode.open ? 1 : 0}`;
    results.sort((a, b) => order(a).localeCompare(order(b)));
    const { json, md } = writeReports(args.framework, results, noRoute);
    const failing = results.filter((r) => !r.pass).length;
    console.log(`\n${results.length} runs, ${results.length - failing} pass, ${failing} fail. Reports: ${relative(repo, json)}, ${relative(repo, md)}`);
    return failing > 0 ? 1 : 0;
  } finally {
    await browser.close();
    gallery?.close();
  }
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
