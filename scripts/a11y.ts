// npm run a11y -- [--framework react|angular] [--url http://...] [--component a,b] [--page /,/all] [--workers n]
//
// axe on every gallery page: `/`, `/all`, `/interactions`, `/platforms`
// (React only) and `/c/<kebab>` for every
// component with a gallery route, in every style and scheme from
// packages/styles/*/style.json, in English ltr and Arabic rtl, with the
// tags wcag2a, wcag2aa, wcag21aa and wcag22aa, minus the manifest's
// contract.skipAxeRules. Overlays (states open and closed, and a trigger in
// the demo) are also checked with the first trigger's root open. `/` and
// `/all` keep the gallery shell; component pages use chrome=0, as the
// contract suite does. Every violation names its WCAG success criterion,
// read from the rule's axe tags (wcag143 is 1.4.3), and the report sums them
// up by criterion, rule and owning component. Writes
// docs/reports/a11y-<framework>.json and .md and exits 1 on any violation.
// A run narrowed with --component or --page merges its results into the
// existing JSON report, so one page can be checked again without the rest.
// `/all` renders every demo at once (about 850 cases) and can take 30s to
// load, so the shell pages get 120s.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { chromium, type Browser, type Page } from '@playwright/test';
import { demoPath, discoverStyles, formatAxe, hasOpenChecks, kebabCase, loadManifests, openedKebab, triggerSelector, type AxeCheck, type AxeViolation, type Manifest } from '../packages/contract-tests/src/lib';
import { axeOwners, freshOpen, markSeen } from '../packages/contract-tests/src/page';
import { galleryExists, launchGallery, probeRoutes, type Gallery } from '../packages/contract-tests/src/server';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

/** Names of the WCAG 2.2 success criteria axe tags most often. */
const CRITERIA: Record<string, string> = {
  '1.1.1': 'Non-text content',
  '1.3.1': 'Info and relationships',
  '1.3.5': 'Identify input purpose',
  '1.4.1': 'Use of color',
  '1.4.2': 'Audio control',
  '1.4.3': 'Contrast (minimum)',
  '1.4.4': 'Resize text',
  '1.4.10': 'Reflow',
  '1.4.11': 'Non-text contrast',
  '1.4.12': 'Text spacing',
  '2.1.1': 'Keyboard',
  '2.2.1': 'Timing adjustable',
  '2.4.1': 'Bypass blocks',
  '2.4.2': 'Page titled',
  '2.4.4': 'Link purpose (in context)',
  '2.4.7': 'Focus visible',
  '2.5.3': 'Label in name',
  '2.5.8': 'Target size (minimum)',
  '3.1.1': 'Language of page',
  '3.1.2': 'Language of parts',
  '3.3.2': 'Labels or instructions',
  '4.1.1': 'Parsing',
  '4.1.2': 'Name, role, value',
};

/** WCAG success criteria from axe tags: wcag143 is 1.4.3, wcag2411 is 2.4.11. Level tags (wcag2aa) are left out. */
function criteriaOf(tags: readonly string[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    const m = /^wcag(\d)(\d)(\d{1,2})$/.exec(t);
    if (m) out.push(`${m[1]}.${m[2]}.${m[3]}`);
  }
  return out;
}

const criterionLabel = (c: string[]) => (c.length ? c.map((x) => `${x}${CRITERIA[x] ? ` ${CRITERIA[x]}` : ''}`).join(', ') : 'best practice, no criterion');

interface Args {
  framework: string;
  url?: string;
  components: string[];
  pages: string[];
  workers: number;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { framework: 'react', components: [], pages: [], workers: 4 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] ?? '';
    const [flag, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const value = () => inline ?? argv[++i] ?? '';
    if (flag === '--framework') out.framework = value();
    else if (flag === '--url') out.url = value().replace(/\/+$/, '');
    else if (flag === '--component') out.components.push(...value().split(',').map((s) => s.trim()).filter(Boolean));
    else if (flag === '--page') out.pages.push(...value().split(',').map((s) => s.trim()).filter(Boolean));
    else if (flag === '--workers') out.workers = Math.max(1, Number(value()) || 1);
    else if (flag === '--help' || flag === '-h') {
      console.log('npm run a11y -- [--framework react|angular] [--url URL] [--component a,b] [--page /,/all] [--workers N]');
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
  violations: { rule: string; criteria: string[]; impact: string | null; help: string; nodes: NodeResult[] }[];
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
      await page.locator('[data-gallery="sink"]').waitFor({ state: 'attached', timeout: 120_000 });
      await page.waitForFunction(() => document.querySelector('[data-gallery="loading"]') === null, undefined, { timeout: 120_000 });
    } else if (job.page === '/') {
      await page.locator('[data-gallery="index"], main').first().waitFor({ state: 'attached', timeout: 120_000 });
    } else if (job.page === '/interactions') {
      await page.locator('article[data-interaction]').first().waitFor({ state: 'attached', timeout: 120_000 });
      // First paint motion is off under reduced motion; give lazy stages a moment.
      await page.waitForTimeout(500);
    } else if (job.page === '/platforms') {
      await page.locator('[data-gallery="platforms-phone"] iframe').first().waitFor({ state: 'attached', timeout: 120_000 });
      await page.waitForLoadState('load');
      await page.waitForTimeout(1500);
    } else {
      await page.locator('[data-demo-case]').first().waitFor({ state: 'attached', timeout: 20_000 });
    }
    await settle(page);
    if (job.mode.open && job.manifest) {
      const kebab = openedKebab(job.manifest, kebabCase(job.manifest.name));
      const trigger = triggerSelector(job.manifest);
      // No trigger in the demo (Section, Accordion): the open pass would only
      // repeat the closed one, as in contract.spec.ts. It is skipped, not failed.
      if ((await page.locator(`:is(${trigger}) >> visible=true`).count()) === 0) {
        base.pass = true;
        base.lines = ['open pass skipped: no visible contract.trigger or [data-demo-trigger] in the demo'];
        return base;
      }
      // The first visible trigger, in the variants case when it has one.
      const inVariants = `[data-demo-case="variants"] :is(${trigger}) >> visible=true`;
      const selector = (await page.locator(inVariants).count()) > 0 ? inVariants : `:is(${trigger}) >> visible=true`;
      await page.evaluate(markSeen, kebab);
      // A covered trigger (a Menubar demo with a menu open at load) opens from the keyboard.
      await page
        .locator(selector)
        .first()
        .click({ timeout: 5_000 })
        .catch(async () => {
          await page.locator(selector).first().focus();
          await page.keyboard.press('Enter');
        });
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
    const tagsOf = (v: AxeViolation) => criteriaOf((v as unknown as { tags?: string[] }).tags ?? []);
    base.lines = violations.flatMap((v) => formatAxe([v], owners).map((l) => `WCAG ${criterionLabel(tagsOf(v))}: ${l}`));
    base.violations = violations.map((v) => ({
      rule: v.id,
      criteria: tagsOf(v),
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
  // Sum up by criterion, rule and owner: one row per kind of failure.
  const sums = new Map<string, { criteria: string; rule: string; owner: string; runs: Set<string>; nodes: number; modes: Set<string> }>();
  for (const r of failing) {
    for (const v of r.violations) {
      for (const n of v.nodes) {
        const owner = n.owner ?? r.page;
        const key = `${v.rule}|${owner}`;
        const row = sums.get(key) ?? { criteria: criterionLabel(v.criteria), rule: v.rule, owner, runs: new Set<string>(), nodes: 0, modes: new Set<string>() };
        row.runs.add(`${r.page} ${modeLabel(r.mode)}`);
        row.modes.add(modeLabel(r.mode));
        row.nodes += 1;
        sums.set(key, row);
      }
    }
    if (r.error) {
      const key = `error|${r.page}`;
      const row = sums.get(key) ?? { criteria: 'none (the run did not finish)', rule: 'error', owner: r.page, runs: new Set<string>(), nodes: 0, modes: new Set<string>() };
      row.runs.add(`${r.page} ${modeLabel(r.mode)}`);
      row.modes.add(modeLabel(r.mode));
      sums.set(key, row);
    }
  }
  if (sums.size) {
    lines.push('', '## Violations by criterion, rule and owner', '', '| WCAG criterion | Rule | Owner | Runs | Nodes | Modes |', '| --- | --- | --- | ---: | ---: | --- |');
    for (const row of [...sums.values()].sort((a, b) => a.criteria.localeCompare(b.criteria) || a.owner.localeCompare(b.owner))) {
      const modes = [...row.modes];
      lines.push(`| ${row.criteria} | ${row.rule} | ${row.owner} | ${row.runs.size} | ${row.nodes} | ${modes.length > 4 ? `${modes.slice(0, 4).join('; ')} and ${modes.length - 4} more` : modes.join('; ')} |`);
    }
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
    // The gallery pages with their shell. /platforms exists in React only.
    const SHELL = args.framework === 'react' ? ['/', '/all', '/interactions', '/platforms'] : ['/', '/all', '/interactions'];
    const shellPages = args.pages.filter((p) => SHELL.includes(p));
    const wantedPages = args.pages.filter((p) => p.startsWith('/c/')).map((p) => p.slice(3));
    if (args.components.length === 0 && (args.pages.length === 0 || shellPages.length > 0)) {
      const allSkips = [...new Set(routed.flatMap((m) => m.contract?.skipAxeRules ?? []))];
      for (const mode of modes) {
        if (args.pages.length === 0 || shellPages.includes('/')) jobs.push({ page: '/', path: `/?${query(mode, true)}`, mode, skip: [] });
        if (args.pages.length === 0 || shellPages.includes('/all')) jobs.push({ page: '/all', path: `/all?${query(mode, true)}`, mode, skip: allSkips });
        for (const extra of SHELL.slice(2)) if (args.pages.length === 0 || shellPages.includes(extra)) jobs.push({ page: extra, path: `${extra}?${query(mode, true)}`, mode, skip: allSkips });
      }
    }
    // With --page, only the component pages it names run.
    for (const m of routed.filter((x) => args.pages.length === 0 || args.components.length > 0 || wantedPages.includes(kebabCase(x.name)))) {
      const kebab = kebabCase(m.name);
      const skip = m.contract?.skipAxeRules ?? [];
      for (const mode of modes) {
        jobs.push({ page: `/c/${kebab}`, path: demoPath(kebab, { style: mode.style, scheme: mode.scheme, dir: mode.dir, lang: mode.lang }), mode, skip, manifest: m });
        if (hasOpenChecks(m)) jobs.push({ page: `/c/${kebab}`, path: demoPath(kebab, { style: mode.style, scheme: mode.scheme, dir: mode.dir, lang: mode.lang }), mode: { ...mode, open: true }, skip, manifest: m });
      }
    }
    console.log(`${args.framework}: ${jobs.length} axe runs on ${new Set(jobs.map((j) => j.page)).size} pages.${noRoute.length ? ` No gallery route: ${noRoute.join(', ')}.` : ''}`);
    const results: Result[] = [];
    await pool(jobs, args.workers, async (job) => {
      const r = await run(browser, url, job);
      results.push(r);
      if (!r.pass) console.log(`FAIL ${job.page} ${modeLabel(job.mode)}${r.error ? `: ${r.error}` : ''}${r.lines.map((l) => `\n      ${l}`).join('')}`);
    });
    if (args.components.length > 0 || args.pages.length > 0) {
      // A narrowed run replaces only its own runs in the existing report.
      const prior = join(repo, 'docs/reports', `a11y-${args.framework}.json`);
      if (existsSync(prior)) {
        const key = (r: Result) => `${r.path}|${r.mode.open ? 1 : 0}`;
        const fresh = new Set(results.map(key));
        const old = (JSON.parse(readFileSync(prior, 'utf8')) as { results: Result[]; noRoute?: string[] });
        results.push(...old.results.filter((r) => !fresh.has(key(r))));
        noRoute.push(...(old.noRoute ?? []).filter((n) => !noRoute.includes(n)));
      }
    }
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
