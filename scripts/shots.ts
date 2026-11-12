// npm run shots -- [--framework react|angular] [--url http://...] [--component a,b]
//                  [--style a,b] [--scheme a,b] [--out dir] [--work dir]
//                  [--keep subset|all|none] [--ready] [--no-verify] [--workers n]
// npm run shots -- --compare react angular
//
// The screenshot matrix. For every component with a gallery route it
// captures the variants case at chrome=0: every style, both schemes, both
// directions (en ltr, ar rtl) at density default; for controls also the
// compact and comfortable densities in each style, dark, ltr; for overlays
// also the first trigger's root open. Viewport 1280 by 800, full page, device
// scale factor 1, animations off, reduced motion, fonts loaded. Each shot is
// taken twice in fresh contexts and the bytes compared, so an unstable shot
// is named in the run.
//
// Size. Every PNG is recompressed losslessly (libvips through sharp when it
// can be loaded, zlib level 9 with adaptive filters; the pixels do not
// change), and a file whose bytes did not change is not written again. The
// whole matrix goes to a work folder outside git (--work, default
// node_modules/.cache/ds-shots/<framework>). Only a kept subset is copied to
// docs/reports/shots/matrix/<framework>/: with --keep subset (the default)
// Neutral light, Studio dark and Desk dark rtl, in every case the matrix takes
// for them (opens and densities included); --keep all copies everything and
// --keep none copies no image. captured.json and index.md always list every
// shot with its size and sha256, so a shot that is not kept can still be
// compared by hash. --ready limits the run to components whose manifest says
// ready for the framework.
//
// --compare A B pixel diffs the matching files of two frameworks (threshold
// 0.1, at most 0.5 percent of pixels may differ), reading the work folders
// first and the docs folders after, and writes a diff image for each pair that
// differs and a table to docs/reports/shots/matrix/compare-A-B/. A framework without
// captures is captured first; a gallery that is missing or does not start
// is a skip with a note, not a failure.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { DENSITIES, demoPath, discoverStyles, hasOpenChecks, isControl, kebabCase, loadManifests, openedKebab, triggerSelector, type Axes, type Manifest } from '../packages/contract-tests/src/lib';
import { freshOpen, markSeen } from '../packages/contract-tests/src/page';
import { galleryExists, launchGallery, probeRoutes, type Gallery } from '../packages/contract-tests/src/server';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VIEWPORT = { width: 1280, height: 800 };
const THRESHOLD = 0.1;
const MAX_DIFF_RATIO = 0.005;

interface Args {
  framework: string;
  url?: string;
  components: string[];
  styles: string[];
  schemes: string[];
  out?: string;
  work?: string;
  keep: 'subset' | 'all' | 'none';
  ready: boolean;
  verify: boolean;
  workers: number;
  compare?: [string, string];
}

function parseArgs(argv: string[]): Args {
  const out: Args = { framework: 'react', components: [], styles: [], schemes: [], keep: 'subset', ready: false, verify: true, workers: 4 };
  const list = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] ?? '';
    const [flag, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const value = () => inline ?? argv[++i] ?? '';
    if (flag === '--framework') out.framework = value();
    else if (flag === '--url') out.url = value().replace(/\/+$/, '');
    else if (flag === '--component') out.components.push(...list(value()));
    else if (flag === '--style') out.styles.push(...list(value()));
    else if (flag === '--scheme') out.schemes.push(...list(value()));
    else if (flag === '--out') out.out = resolve(value());
    else if (flag === '--work') out.work = resolve(value());
    else if (flag === '--keep') {
      const k = value();
      if (k !== 'subset' && k !== 'all' && k !== 'none') {
        console.error(`--keep must be subset, all or none, not "${k}"`);
        process.exit(2);
      }
      out.keep = k;
    } else if (flag === '--ready') out.ready = true;
    else if (flag === '--no-verify') out.verify = false;
    else if (flag === '--workers') out.workers = Math.max(1, Number(value()) || 1);
    else if (flag === '--compare') out.compare = [argv[++i] ?? '', argv[++i] ?? ''];
    else if (flag === '--help' || flag === '-h') {
      console.log('npm run shots -- [--framework react|angular] [--url URL] [--component a,b] [--style a,b] [--scheme a,b] [--out DIR] [--work DIR] [--keep subset|all|none] [--ready] [--no-verify] [--workers N]');
      console.log('npm run shots -- --compare react angular');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  const frameworks = out.compare ?? [out.framework];
  for (const f of frameworks) {
    if (!['react', 'angular'].includes(f)) {
      console.error(`framework must be react or angular, not "${f}"`);
      process.exit(2);
    }
  }
  return out;
}

const matrixRoot = join(repo, 'docs/reports/shots/matrix');
const defaultOut = (framework: string) => join(matrixRoot, framework);
const defaultWork = (framework: string) => join(repo, 'node_modules/.cache/ds-shots', framework);

/** The subset whose images are committed: Neutral light, Studio dark, Desk dark rtl. */
function kept(s: Pick<Shot, 'style' | 'scheme' | 'dir'>, keep: Args['keep']): boolean {
  if (keep === 'all') return true;
  if (keep === 'none') return false;
  return (s.style === 'neutral' && s.scheme === 'light') || (s.style === 'studio' && s.scheme === 'dark') || (s.style === 'desk' && s.scheme === 'dark' && s.dir === 'rtl');
}

type Recompress = (png: Buffer) => Promise<Buffer>;
/** Undefined until the first call; null when sharp cannot be loaded. */
let recompressor: Recompress | null | undefined;

/**
 * Lossless recompression. sharp (libvips) is loaded when the install has it;
 * it is not a dependency of this repo, so without it the Chromium PNG is kept
 * as it is. Either way the pixels are the same.
 */
async function recompress(png: Buffer): Promise<{ bytes: Buffer; codec: string }> {
  if (recompressor === undefined) {
    try {
      const name = 'sharp';
      const mod = (await import(name)) as { default: (b: Buffer) => { png: (o: object) => { toBuffer: () => Promise<Buffer> } } };
      recompressor = (b) => mod.default(b).png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 }).toBuffer();
    } catch {
      recompressor = null;
    }
  }
  if (!recompressor) return { bytes: png, codec: 'chromium' };
  const out = await recompressor(png);
  // Keep the smaller of the two; both hold the same pixels.
  return out.length < png.length ? { bytes: out, codec: 'libvips' } : { bytes: png, codec: 'chromium' };
}

/** Writes the file only when its bytes changed. Returns true when it wrote. */
function writeIfChanged(file: string, bytes: Buffer): boolean {
  if (existsSync(file) && readFileSync(file).equals(bytes)) return false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  return true;
}

interface Shot {
  component: string;
  kebab: string;
  style: string;
  scheme: string;
  dir: 'ltr' | 'rtl';
  lang: 'en' | 'ar';
  density?: string;
  open: boolean;
  file: string;
}

interface Captured extends Omit<Shot, 'file'> {
  file: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  stable: boolean | null;
  kept: boolean;
  note?: string;
}

/** The file name contract: <component>/<style>-<scheme>-<dir>[-<density>][-open].png */
function shotFile(s: Omit<Shot, 'file'>): string {
  return `${s.kebab}/${s.style}-${s.scheme}-${s.dir}${s.density ? `-${s.density}` : ''}${s.open ? '-open' : ''}.png`;
}

function plan(components: Manifest[], styles: { id: string; schemes: string[] }[], overlays: Set<string>): Shot[] {
  const out: Shot[] = [];
  const add = (s: Omit<Shot, 'file'>) => out.push({ ...s, file: shotFile(s) });
  for (const m of components) {
    const kebab = kebabCase(m.name);
    const overlay = overlays.has(kebab);
    for (const style of styles) {
      for (const scheme of style.schemes) {
        for (const [dir, lang] of [['ltr', 'en'], ['rtl', 'ar']] as const) {
          add({ component: m.name, kebab, style: style.id, scheme, dir, lang, open: false });
          if (overlay) add({ component: m.name, kebab, style: style.id, scheme, dir, lang, open: true });
        }
      }
      // Densities for controls: dark, ltr. Default density is the base shot.
      if (isControl(m) && style.schemes.includes('dark')) {
        for (const density of DENSITIES) {
          if (density === 'default') continue;
          add({ component: m.name, kebab, style: style.id, scheme: 'dark', dir: 'ltr', lang: 'en', density, open: false });
        }
      }
    }
  }
  return out;
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

/**
 * Clicks the trigger. When something on the page covers it (a Menubar demo
 * that shows a menu open at load), it is opened from the keyboard instead:
 * focus, then Enter.
 */
async function openTrigger(page: Page, selector: string): Promise<void> {
  const trigger = page.locator(selector).first();
  try {
    await trigger.click({ timeout: 5_000 });
  } catch {
    await trigger.focus();
    await page.keyboard.press('Enter');
  }
}

/** One capture in a fresh context. Returns the PNG bytes, or throws. */
async function capture(browser: Browser, url: string, s: Shot, trigger: string, opens: string): Promise<Buffer> {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    const axes: Axes = { style: s.style, scheme: s.scheme, density: s.density, dir: s.dir, lang: s.lang, case: 'variants' };
    await page.goto(`${url}${demoPath(s.kebab, axes)}`);
    await page.locator('[data-demo-case]').first().waitFor({ state: 'attached', timeout: 20_000 });
    await settle(page);
    if (s.open) {
      // The first visible trigger, in the variants case when it has one. A
      // trigger can be in the DOM and hidden (the overflow of a Breadcrumbs
      // that does not collapse at this width).
      const inVariants = `[data-demo-case="variants"] :is(${trigger}) >> visible=true`;
      const selector = (await page.locator(inVariants).count()) > 0 ? inVariants : `:is(${trigger}) >> visible=true`;
      await page.evaluate(markSeen, opens);
      await openTrigger(page, selector);
      const deadline = Date.now() + 5_000;
      while ((await page.evaluate(freshOpen, opens)) === 0) {
        if (Date.now() > deadline) throw new Error(`the first visible trigger opens no [data-ds=${opens}]`);
        await page.waitForTimeout(50);
      }
      // Park the pointer so no hover state is caught, then let the open settle.
      await page.mouse.move(0, 0);
      await page.waitForTimeout(400);
      await settle(page);
    }
    return await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css' });
  } finally {
    await context.close();
  }
}

/** Pixels that differ between two PNGs, and the box around them. */
function pngDiff(a: Buffer, b: Buffer, out?: string): { differ: number; total: number; box?: string; sizeMismatch?: string } {
  const pa = PNG.sync.read(a);
  const pb = PNG.sync.read(b);
  if (pa.width !== pb.width || pa.height !== pb.height) {
    return { differ: Math.max(pa.width * pa.height, pb.width * pb.height), total: Math.max(pa.width * pa.height, pb.width * pb.height), sizeMismatch: `${pa.width}x${pa.height} vs ${pb.width}x${pb.height}` };
  }
  const diff = new PNG({ width: pa.width, height: pa.height });
  const differ = pixelmatch(pa.data, pb.data, diff.data, pa.width, pa.height, { threshold: THRESHOLD });
  let box: string | undefined;
  if (differ > 0) {
    let x0 = pa.width;
    let y0 = pa.height;
    let x1 = 0;
    let y1 = 0;
    for (let y = 0; y < pa.height; y += 1) {
      for (let x = 0; x < pa.width; x += 1) {
        const i = (y * pa.width + x) * 4;
        // pixelmatch paints differing pixels red (255, 0, 0).
        if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
      }
    }
    if (x1 >= x0) box = `x ${x0} to ${x1}, y ${y0} to ${y1}`;
  }
  // A diff image is written only when some pixel differs.
  if (out && differ > 0) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, PNG.sync.write(diff));
  }
  return { differ, total: pa.width * pa.height, box };
}

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

async function pool<T>(items: T[], workers: number, fn: (item: T, i: number) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(workers, items.length) }, async () => {
      while (next < items.length) {
        const i = next;
        next += 1;
        await fn(items[i] as T, i);
      }
    }),
  );
}

function sizeOf(dir: string): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    total += st.isDirectory() ? sizeOf(p) : st.size;
  }
  return total;
}

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(2)} MB`;

interface Manifesto {
  framework: string;
  viewport: typeof VIEWPORT;
  deviceScaleFactor: number;
  case: string;
  shots: Captured[];
}

function writeIndex(out: string, framework: string, shots: Captured[], work: string): void {
  const byComponent = new Map<string, Captured[]>();
  for (const s of shots) byComponent.set(s.component, [...(byComponent.get(s.component) ?? []), s]);
  const total = shots.reduce((n, s) => n + s.bytes, 0);
  const unstable = shots.filter((s) => s.stable === false);
  const lines: string[] = [
    `# Screenshot matrix, ${framework}`,
    '',
    'Made by `npm run shots`. Each shot is the `variants` case at `chrome=0`, 1280 by 800 viewport, full page, device scale factor 1, animations off, reduced motion, fonts loaded. File names: `<component>/<style>-<scheme>-<dir>[-<density>][-open].png`. Density is default unless named.',
    '',
    `${shots.length} shots, ${byComponent.size} components, ${mb(total)} after lossless recompression. Stable (two captures byte equal): ${shots.filter((s) => s.stable === true).length}; unstable: ${unstable.length}; not verified: ${shots.filter((s) => s.stable === null).length}.`,
    '',
    `Images kept in this folder: ${shots.filter((s) => s.kept).length} (${mb(shots.filter((s) => s.kept).reduce((n, s) => n + s.bytes, 0))}). A cell with a link is kept here; a cell with a short hash was captured, compared and recorded, and its image is in the work folder \`${relative(repo, work)}\` of the run, not in git. Rerun \`npm run shots -- --keep all\` to get every image.`,
    '',
    'The full list with sizes and hashes is in `captured.json`.',
    '',
  ];
  const link = (s: Captured | undefined, label: string) => (s ? `${s.kept ? `[${label}](${s.file})` : `\`${s.sha256.slice(0, 8)}\``}${s.stable === false ? ' (unstable)' : ''}` : 'none');
  for (const [component, list] of [...byComponent].sort(([a], [b]) => a.localeCompare(b))) {
    const find = (style: string, scheme: string, dir: string, open: boolean, density?: string) =>
      list.find((s) => s.style === style && s.scheme === scheme && s.dir === dir && s.open === open && s.density === density);
    const styles = [...new Set(list.map((s) => s.style))];
    const schemes = [...new Set(list.map((s) => s.scheme))];
    const overlay = list.some((s) => s.open);
    lines.push(`## ${component}`, '');
    lines.push(`| Style | Scheme | ltr en | rtl ar${overlay ? ' | ltr open | rtl open' : ''} |`, `| --- | --- | --- | ---${overlay ? ' | --- | ---' : ''} |`);
    for (const style of styles) {
      for (const scheme of schemes) {
        const cells = [link(find(style, scheme, 'ltr', false), 'ltr'), link(find(style, scheme, 'rtl', false), 'rtl')];
        if (overlay) cells.push(link(find(style, scheme, 'ltr', true), 'ltr open'), link(find(style, scheme, 'rtl', true), 'rtl open'));
        lines.push(`| ${style} | ${scheme} | ${cells.join(' | ')} |`);
      }
    }
    if (list.some((s) => s.density)) {
      lines.push('', 'Densities, dark, ltr en:', '', '| Style | compact | default | comfortable |', '| --- | --- | --- | --- |');
      for (const style of styles) {
        lines.push(`| ${style} | ${link(find(style, 'dark', 'ltr', false, 'compact'), 'compact')} | ${link(find(style, 'dark', 'ltr', false), 'default')} | ${link(find(style, 'dark', 'ltr', false, 'comfortable'), 'comfortable')} |`);
      }
    }
    const bad = list.filter((s) => s.stable === false || s.note);
    if (bad.length) {
      lines.push('');
      for (const s of bad) lines.push(`- ${s.file}: ${s.note ?? 'unstable'}`);
    }
    lines.push('');
  }
  writeFileSync(join(out, 'index.md'), lines.join('\n'));
}

/** Captures the matrix for one framework. Returns the exit code, or 'skip' when the gallery is not there. */
async function runCapture(args: Args, framework: string, out: string): Promise<number | 'skip'> {
  const filtered = args.components.length > 0 || args.styles.length > 0 || args.schemes.length > 0;
  if (!args.url && !galleryExists(repo, framework)) {
    console.log(`${framework} gallery: not available. ${relative(repo, join(repo, framework === 'react' ? 'apps/gallery-react' : 'apps/gallery-angular'))} has no package.json, so no shots for ${framework}.`);
    return 'skip';
  }
  let gallery: Gallery | undefined;
  let url = args.url;
  if (!url) {
    try {
      gallery = await launchGallery(repo, framework, { timeoutMs: framework === 'angular' ? 240_000 : 90_000 });
      url = gallery.url;
    } catch (err) {
      console.log(`${framework} gallery: did not start, so no shots for ${framework}. ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`);
      return 'skip';
    }
  }
  const stopAll = () => gallery?.close();
  process.on('SIGINT', () => {
    stopAll();
    process.exit(130);
  });
  const browser = await chromium.launch();
  try {
    const manifests = loadManifests(repo).filter((m) => m.kind === 'component');
    const wanted = args.components.map((c) => c.toLowerCase());
    const candidates = manifests
      .filter((m) => wanted.length === 0 || wanted.includes(m.name.toLowerCase()) || wanted.includes(kebabCase(m.name)))
      .filter((m) => !args.ready || m.frameworks?.[framework]?.status === 'ready')
      .sort((a, b) => a.name.localeCompare(b.name));
    const routes = await probeRoutes(browser, url, candidates.map((m) => kebabCase(m.name)));
    const components = candidates.filter((m) => routes[kebabCase(m.name)]);
    const skipped = candidates.filter((m) => !routes[kebabCase(m.name)]).map((m) => m.name);
    if (skipped.length) console.log(`No gallery route (no demo case at /c/<kebab>): ${skipped.join(', ')}`);
    const styles = discoverStyles(repo)
      .filter((s) => args.styles.length === 0 || args.styles.includes(s.id))
      .map((s) => ({ id: s.id, schemes: s.schemes.filter((x) => args.schemes.length === 0 || args.schemes.includes(x)) }))
      .filter((s) => s.schemes.length > 0);

    // An overlay: the manifest says open and closed or names what it opens
    // (contract.opens), and the demo has a visible trigger.
    const overlays = new Set<string>();
    const triggers = new Map<string, string>();
    const opensMap = new Map<string, string>();
    const page = await browser.newPage();
    for (const m of components.filter(hasOpenChecks)) {
      const kebab = kebabCase(m.name);
      triggers.set(kebab, triggerSelector(m));
      opensMap.set(kebab, openedKebab(m, kebab));
      await page.goto(`${url}${demoPath(kebab, { dir: 'ltr', lang: 'en', case: 'variants' })}`);
      await page.locator('[data-demo-case]').first().waitFor({ state: 'attached', timeout: 20_000 });
      if ((await page.locator(`:is(${triggerSelector(m)}) >> visible=true`).count()) > 0) overlays.add(kebab);
    }
    await page.close();

    const shots = plan(components, styles, overlays);
    console.log(`${framework}: ${components.length} components, ${styles.map((s) => `${s.id} (${s.schemes.join(', ')})`).join(', ')}; ${shots.length} shots${args.verify ? ', each taken twice' : ''}.`);
    console.log(`Controls (size prop on the control scale, focusable, no open state): ${components.filter(isControl).map((m) => m.name).join(', ') || 'none'}. Overlays: ${[...overlays].map((k) => (opensMap.get(k) !== k ? `${k} (opens ${opensMap.get(k)})` : k)).join(', ') || 'none'}.`);

    const work = args.work ?? defaultWork(framework);
    mkdirSync(out, { recursive: true });
    mkdirSync(work, { recursive: true });
    const results: Captured[] = [];
    let failed = 0;
    let done = 0;
    let written = 0;
    const codecs = new Map<string, number>();
    await pool(shots, args.workers, async (s) => {
      const trigger = triggers.get(s.kebab) ?? '[data-demo-trigger]';
      const opens = opensMap.get(s.kebab) ?? s.kebab;
      try {
        const first = await capture(browser, url, s, trigger, opens);
        let stable: boolean | null = null;
        let note: string | undefined;
        const { bytes, codec } = await recompress(first);
        if (args.verify) {
          // Chromium's PNG encoder can change bytes for the same pixels, so
          // stability is judged on the recompressed bytes, which follow the
          // pixels only.
          const second = await capture(browser, url, s, trigger, opens);
          stable = first.equals(second) || bytes.equals((await recompress(second)).bytes);
          if (!stable) {
            const d = pngDiff(first, second);
            note = d.sizeMismatch ? `unstable: page size changes between captures (${d.sizeMismatch})` : `unstable: ${d.differ} pixels differ between two captures (${((d.differ / d.total) * 100).toFixed(3)} percent), ${d.box ?? 'no box'}`;
          }
        }
        codecs.set(codec, (codecs.get(codec) ?? 0) + 1);
        const keep = kept(s, args.keep);
        if (writeIfChanged(join(work, s.file), bytes)) written += 1;
        if (keep) writeIfChanged(join(out, s.file), bytes);
        else if (existsSync(join(out, s.file))) rmSync(join(out, s.file));
        const png = PNG.sync.read(first);
        const { file: _f, ...rest } = s;
        results.push({ ...rest, file: s.file, width: png.width, height: png.height, bytes: bytes.length, sha256: sha(bytes), stable, kept: keep, note });
        if (note) console.log(`  ${s.file}: ${note}`);
      } catch (err) {
        failed += 1;
        console.log(`  FAIL ${s.file}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`);
      }
      done += 1;
      if (done % 20 === 0) console.log(`  ${done} of ${shots.length}`);
    });

    // A filtered run merges into the existing record.
    const recordFile = join(out, 'captured.json');
    let all = results;
    if (filtered && existsSync(recordFile)) {
      const prior = (JSON.parse(readFileSync(recordFile, 'utf8')) as Manifesto).shots;
      const fresh = new Set(results.map((r) => r.file));
      all = [...prior.filter((p) => !fresh.has(p.file)), ...results];
    }
    all.sort((a, b) => a.file.localeCompare(b.file));
    if (!filtered) {
      // A full run owns the folder: images that are not kept, or not in this
      // matrix any more, go.
      const keepFiles = new Set(all.filter((r) => r.kept).map((r) => r.file));
      for (const f of pngsIn(out)) if (!keepFiles.has(f)) rmSync(join(out, f));
      for (const name of readdirSync(out)) {
        const p = join(out, name);
        if (statSync(p).isDirectory() && readdirSync(p).length === 0) rmSync(p, { recursive: true });
      }
    }
    const record: Manifesto = { framework, viewport: VIEWPORT, deviceScaleFactor: 1, case: 'variants', shots: all };
    writeFileSync(recordFile, `${JSON.stringify(record, null, 2)}\n`);
    writeIndex(out, framework, all, work);

    const unstable = results.filter((r) => r.stable === false);
    const pngBytes = results.reduce((n, r) => n + r.bytes, 0);
    console.log(`\n${results.length} shots in ${relative(repo, work)} (${written} changed, ${mb(pngBytes)} of PNG; codecs ${[...codecs].map(([c, n]) => `${c} ${n}`).join(', ')}). Kept in ${relative(repo, out)}: ${results.filter((r) => r.kept).length} (folder ${mb(sizeOf(out))}; matrix folder ${mb(sizeOf(matrixRoot))}).`);
    if (args.verify) console.log(`Stability: ${results.length - unstable.length} byte equal across two captures, ${unstable.length} unstable${unstable.length ? `: ${[...new Set(unstable.map((u) => u.component))].join(', ')}` : ''}.`);
    if (failed) console.log(`${failed} shots failed.`);
    return failed > 0 ? 1 : 0;
  } finally {
    await browser.close();
    stopAll();
  }
}

function pngsIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.png')) out.push(relative(dir, p));
    }
  };
  walk(dir);
  return out.sort();
}

async function runCompare(args: Args, a: string, b: string): Promise<number> {
  // The work folder holds the whole matrix; the docs folder only the kept subset.
  const source = (f: string) => (pngsIn(defaultWork(f)).length > 0 ? defaultWork(f) : defaultOut(f));
  for (const f of [a, b]) {
    if (pngsIn(source(f)).length > 0) continue;
    console.log(`No ${f} shots in ${relative(repo, defaultWork(f))} or ${relative(repo, defaultOut(f))}; capturing them first.`);
    const code = await runCapture({ ...args, url: undefined, compare: undefined }, f, defaultOut(f));
    if (code === 'skip') {
      console.log(`Compare ${a} with ${b}: skipped, the ${f} gallery is not available.`);
      return 0;
    }
  }
  const left = new Set(pngsIn(source(a)));
  const right = new Set(pngsIn(source(b)));
  const both = [...left].filter((f) => right.has(f));
  const onlyA = [...left].filter((f) => !right.has(f));
  const onlyB = [...right].filter((f) => !left.has(f));
  const out = join(matrixRoot, `compare-${a}-${b}`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const rows: string[] = [];
  let fails = 0;
  for (const f of both) {
    const d = pngDiff(readFileSync(join(source(a), f)), readFileSync(join(source(b), f)), join(out, f));
    const ratio = d.differ / d.total;
    const ok = !d.sizeMismatch && ratio <= MAX_DIFF_RATIO;
    if (!ok) fails += 1;
    rows.push(`| ${f} | ${ok ? 'pass' : 'FAIL'} | ${d.sizeMismatch ? `size ${d.sizeMismatch}` : `${d.differ} (${(ratio * 100).toFixed(3)} percent)`} | ${d.box ?? ''} | ${d.differ > 0 && !d.sizeMismatch ? `[diff](${f})` : 'none'} |`);
  }
  const lines = [
    `# Compare ${a} with ${b}`,
    '',
    `Made by \`npm run shots -- --compare ${a} ${b}\`. pixelmatch threshold ${THRESHOLD}; a pair passes when at most ${MAX_DIFF_RATIO * 100} percent of pixels differ and the sizes match.`,
    '',
    `${both.length} pairs, ${both.length - fails} pass, ${fails} fail. Only in ${a}: ${onlyA.length}. Only in ${b}: ${onlyB.length}.`,
    '',
    '| File | Result | Differing pixels | Where | Diff |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    ...(onlyA.length ? [`Only in ${a}: ${onlyA.join(', ')}`, ''] : []),
    ...(onlyB.length ? [`Only in ${b}: ${onlyB.join(', ')}`, ''] : []),
  ];
  writeFileSync(join(out, 'index.md'), lines.join('\n'));
  console.log(`Compare ${a} with ${b}: ${both.length} pairs, ${fails} over the limit. Only in ${a}: ${onlyA.length}, only in ${b}: ${onlyB.length}. Table: ${relative(repo, join(out, 'index.md'))}`);
  return fails > 0 ? 1 : 0;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.compare) return runCompare(args, args.compare[0], args.compare[1]);
  const code = await runCapture(args, args.framework, args.out ?? defaultOut(args.framework));
  return code === 'skip' ? 0 : code;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
