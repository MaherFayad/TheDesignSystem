// npm run compare -- --pair <id> [--source-url http://...] [--system-url http://...] [--out <dir>]
// npm run compare -- --list
//
// Runs one pair of ./pairs: starts the source (GoBanana from a copy in the
// scratch folder, or the FK2 harness) and the React gallery, opens both in
// the same Chromium at the same viewport and scheme, runs each side's setup
// steps, waits for animations to end, probes every region and writes to
// docs/reports/reset/compare/<id>/: source.png and system.png (the two
// captures), sheet.png (source left, system right, then the table),
// table.md and result.json. Exits 0 when every row passes or is allowed,
// 1 when a row fails, 2 when the harness itself could not run.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium, type Browser, type Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { diffPixels, type Box } from './pixels';
import { loadPair, pairIds, probeSpecs } from './pairs';
import { maskRects, probeRegion, settle, type ProbeArg } from './probe';
import { sheetHtml, tableMarkdown, type Crop, type Result } from './report';
import { REPO, startSource, startSystem, type Server } from './sources';
import { compareValue, resolveTolerance, statusOf, summarize } from './tolerance';
import type { PairFile, Row, SideProbe, Step } from './types';

interface Args {
  pair?: string;
  list: boolean;
  sourceUrl?: string;
  systemUrl?: string;
  out?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { list: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] ?? '';
    const [flag, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const value = () => inline ?? argv[++i] ?? '';
    if (flag === '--pair') out.pair = value();
    else if (flag === '--list') out.list = true;
    else if (flag === '--source-url') out.sourceUrl = value().replace(/\/+$/, '');
    else if (flag === '--system-url') out.systemUrl = value().replace(/\/+$/, '');
    else if (flag === '--out') out.out = value();
    else if (flag === '--help' || flag === '-h') {
      console.log('npm run compare -- --pair <id> [--source-url http://host:port] [--system-url http://host:port] [--out dir]\nnpm run compare -- --list');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return out;
}

async function runStep(page: Page, step: Step): Promise<void> {
  const timeout = 30_000;
  if (step.click) await page.locator(step.click).first().click({ timeout });
  else if (step.hover) await page.locator(step.hover).first().hover({ timeout });
  else if (step.focus) await page.locator(step.focus).first().focus({ timeout });
  else if (step.press) await page.keyboard.press(step.press);
  else if (step.wait) await page.locator(step.wait).first().waitFor({ state: 'visible', timeout });
  else if (step.waitMs !== undefined) await page.waitForTimeout(step.waitMs);
  else if (step.attr) {
    await page.locator(step.attr.selector).first().evaluate((el, a) => (a.value === null ? el.removeAttribute(a.name) : el.setAttribute(a.name, a.value)), step.attr);
  }
}

/** Chromium sometimes refuses a capture under load ("Unable to capture screenshot"); try again before giving up. */
async function retry<T>(what: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 1; ; i += 1) {
    try {
      return await what();
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise((r) => setTimeout(r, 500 * i));
    }
  }
}

interface SideCapture {
  capture: Buffer;
  probes: Record<string, SideProbe>;
  crops: Record<string, Buffer | null>;
  masks: Record<string, Box[]>;
  facts: Record<string, string | null>;
}

async function captureSide(browser: Browser, pair: PairFile, side: 'source' | 'system', base: string, path: string, setup: Step[]): Promise<SideCapture> {
  const context = await browser.newContext({
    viewport: pair.viewport,
    deviceScaleFactor: 1,
    colorScheme: pair.scheme,
    reducedMotion: pair.reducedMotion ?? 'no-preference',
  });
  // tsx keeps function names with a __name helper; the probes run in the page, so give it one there.
  await context.addInitScript({ content: 'window.__name = (f) => f;' });
  const page = await context.newPage();
  try {
    await page.goto(`${base}${path}`, { waitUntil: 'load', timeout: 180_000 });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const gpuOnLoad = await page.evaluate(() => document.documentElement.getAttribute('data-gpu'));
    for (const step of setup) await runStep(page, step);
    await page.evaluate(settle, 3000);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const facts: Record<string, string | null> = await page.evaluate(() => {
      const h = document.documentElement;
      return {
        'data-gpu': h.getAttribute('data-gpu'),
        'data-style': h.getAttribute('data-style'),
        'data-platform': h.getAttribute('data-platform'),
        'data-glass': h.getAttribute('data-glass'),
        fonts: Array.from(document.fonts)
          .filter((f) => f.status === 'loaded')
          .map((f) => f.family.replace(/"/g, ''))
          .filter((v, i, all) => all.indexOf(v) === i)
          .join(', '),
      };
    });
    facts['data-gpu on load'] = gpuOnLoad;
    const capture = await retry(() => page.screenshot());
    const probes: Record<string, SideProbe> = {};
    const crops: Record<string, Buffer | null> = {};
    const masks: Record<string, Box[]> = {};
    for (const region of pair.regions) {
      const arg: ProbeArg = {
        root: region[side],
        nth: region.nth?.[side],
        probes: probeSpecs(region.probes).map((p) => ({ key: `${region.id}::${p.id}`, property: p.property, sub: p[side], pseudo: typeof p.pseudo === 'string' ? p.pseudo : p.pseudo?.[side] })),
      };
      const probe = await page.evaluate(probeRegion, arg);
      probes[region.id] = probe;
      crops[region.id] = null;
      if (probe.found) {
        const x = Math.max(0, Math.floor(probe.rect.x));
        const y = Math.max(0, Math.floor(probe.rect.y));
        const width = Math.min(pair.viewport.width - x, Math.ceil(probe.rect.width));
        const height = Math.min(pair.viewport.height - y, Math.ceil(probe.rect.height));
        if (width > 0 && height > 0 && (region.crop !== false || region.pixels)) crops[region.id] = await retry(() => page.screenshot({ clip: { x, y, width, height } }));
        if (region.pixels && !region.pixels.glass) {
          masks[region.id] = await page.evaluate(maskRects, {
            root: region[side],
            nth: region.nth?.[side],
            text: region.pixels.maskText !== false,
            extra: region.pixels.mask?.[side] ?? [],
          });
        }
      }
    }
    return { capture, probes, crops, masks, facts };
  } finally {
    await context.close();
  }
}

function buildRows(pair: PairFile, src: SideCapture, sys: SideCapture): Row[] {
  const tol = resolveTolerance(pair.tolerance);
  const rows: Row[] = [];
  for (const region of pair.regions) {
    const a = src.probes[region.id];
    const b = sys.probes[region.id];
    for (const p of probeSpecs(region.probes)) {
      const key = `${region.id}::${p.id}`;
      const sv = a?.found ? (a.values[key] ?? '(not found)') : '(not found)';
      const yv = b?.found ? (b.values[key] ?? '(not found)') : '(not found)';
      const v = compareValue(p.property, sv, yv, {
        tol,
        kind: p.kind ?? region.kind,
        sourceFontSize: parseFloat(a?.values[`${key}@fs`] ?? '') || undefined,
        systemFontSize: parseFloat(b?.values[`${key}@fs`] ?? '') || undefined,
      });
      rows.push({ region: region.id, probe: p.id, property: p.property, source: sv, system: yv, difference: v.difference, tolerance: v.tolerance, ...statusOf(v.pass, region.id, p.id, pair.allowed) });
    }
    if (region.pixels) {
      const limit = `${tol.pixelShare * 100} percent at threshold ${tol.pixelThreshold}`;
      if (region.pixels.glass) {
        rows.push({ region: region.id, probe: 'pixels', property: 'pixels', source: 'glass', system: 'glass', difference: 'not compared', tolerance: limit, status: 'allowed', note: 'glass region: pixels masked, its CSS is compared' });
        continue;
      }
      const ca = src.crops[region.id];
      const cb = sys.crops[region.id];
      if (!ca || !cb) {
        rows.push({ region: region.id, probe: 'pixels', property: 'pixels', source: ca ? 'crop' : '(not found)', system: cb ? 'crop' : '(not found)', difference: 'element not found', tolerance: limit, status: 'fail' });
        continue;
      }
      const res = diffPixels(PNG.sync.read(ca), PNG.sync.read(cb), {
        threshold: tol.pixelThreshold,
        sizeSlack: region.kind === 'region' ? tol.regionBox : tol.controlBox,
        masks: { source: src.masks[region.id] ?? [], system: sys.masks[region.id] ?? [] },
      });
      const pass = res.share !== null && res.share <= tol.pixelShare;
      rows.push({
        region: region.id,
        probe: 'pixels',
        property: 'pixels',
        source: `${PNG.sync.read(ca).width}x${PNG.sync.read(ca).height}`,
        system: `${PNG.sync.read(cb).width}x${PNG.sync.read(cb).height}`,
        difference: res.share === null ? res.note : `${Math.round(res.share * 1000) / 10} percent (${res.note})`,
        tolerance: limit,
        ...statusOf(pass, region.id, 'pixels', pair.allowed),
      });
    }
  }
  return rows;
}

function factNotes(side: string, facts: Record<string, string | null>): string[] {
  const out: string[] = [];
  if (facts['data-gpu on load'] === 'software') {
    out.push(
      facts['data-gpu'] === 'software'
        ? `${side}: the page marked itself data-gpu="software" on load and turned its live blur off; computed blur values read "none"`
        : `${side}: the page marked itself data-gpu="software" on load (no GPU in headless Chromium); the setup removed the mark so computed CSS shows the designed blur, which the software GPU still draws without it, so glass pixels are not compared`,
    );
  }
  if (facts['data-style']) out.push(`${side}: data-style ${facts['data-style']}, data-platform ${facts['data-platform'] ?? 'none'}, data-glass ${facts['data-glass'] ?? 'none'}`);
  out.push(`${side} fonts loaded: ${facts.fonts || 'none reported'}`);
  return out;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.list || !args.pair) {
    console.log(`Pairs: ${pairIds().join(', ')}`);
    if (!args.pair && !args.list) {
      console.error('Name a pair with --pair <id>.');
      return 2;
    }
    return 0;
  }
  const pair = loadPair(args.pair);
  const outDir = resolve(args.out ?? join(REPO, 'docs/reports/reset/compare', pair.id));
  const log = (line: string) => console.log(line);
  const servers: Server[] = [];
  let browser: Browser | undefined;
  const stopAll = async () => {
    await browser?.close().catch(() => undefined);
    for (const s of servers.splice(0)) await s.close().catch(() => undefined);
  };
  const onSignal = () => {
    void stopAll().then(() => process.exit(130));
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  try {
    const firstPath = pair.source.screen;
    const [source, system] = await Promise.all([
      startSource(pair.source.repo, firstPath, args.sourceUrl, log).then((s) => (servers.push(s), s)),
      startSystem(args.systemUrl, log).then((s) => (servers.push(s), s)),
    ]);
    browser = await chromium.launch();
    log(`Capturing the source: ${source.url}${pair.source.screen}`);
    const src = await captureSide(browser, pair, 'source', source.url, pair.source.screen, pair.source.setup ?? []);
    log(`Capturing the system: ${system.url}${pair.system.url}`);
    const sys = await captureSide(browser, pair, 'system', system.url, pair.system.url, pair.system.setup ?? []);
    const rows = buildRows(pair, src, sys);
    const result: Result = {
      pair: pair.id,
      title: pair.title,
      date: new Date().toISOString(),
      audit: pair.audit,
      source: { repo: pair.source.repo, screen: pair.source.screen, how: pair.source.how, reconstruction: pair.source.reconstruction, url: source.url },
      system: { url: pair.system.url },
      viewport: pair.viewport,
      scheme: pair.scheme,
      notes: [...source.notes, ...system.notes, ...factNotes('Source', src.facts), ...factNotes('System', sys.facts)],
      summary: summarize(rows),
      rows,
    };

    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'source.png'), src.capture);
    writeFileSync(join(outDir, 'system.png'), sys.capture);
    writeFileSync(join(outDir, 'table.md'), tableMarkdown(result));
    writeFileSync(join(outDir, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
    const uri = (b: Buffer | null | undefined) => (b ? `data:image/png;base64,${b.toString('base64')}` : null);
    const size = (p: SideProbe | undefined) => (p?.found ? `${Math.round(p.rect.width * 10) / 10} by ${Math.round(p.rect.height * 10) / 10}` : 'not found');
    const crops: Crop[] = pair.regions.filter((r) => r.crop !== false).map((r) => ({ region: r.id, source: uri(src.crops[r.id]), system: uri(sys.crops[r.id]), sourceSize: size(src.probes[r.id]), systemSize: size(sys.probes[r.id]), sourceWidth: src.probes[r.id]?.rect.width ?? 0, systemWidth: sys.probes[r.id]?.rect.width ?? 0 }));
    const sheetPage = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
    await sheetPage.setContent(sheetHtml(result, crops));
    await retry(() => sheetPage.screenshot({ path: join(outDir, 'sheet.png'), fullPage: true }));
    await sheetPage.close();

    const s = result.summary;
    log(`\n${pair.id}: ${s.pass} pass, ${s.fail} fail, ${s.allowed} allowed`);
    for (const r of rows.filter((x) => x.status !== 'pass')) {
      log(`  ${r.status.padEnd(7)} ${r.region} ${r.probe}: source ${r.source}, system ${r.system} (${r.difference}; tolerance ${r.tolerance})`);
    }
    log(`Wrote ${outDir}`);
    return s.fail > 0 ? 1 : 0;
  } finally {
    await stopAll();
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(2);
  },
);
