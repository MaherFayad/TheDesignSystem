// npm run record -- --order <id>
// npm run record -- --order R0.9 --clip switch --device pixel
// npm run record -- --list
//
// The recording pack (order R0.9, plan section 3). Reads the pack of an order
// (./packs/<order>.json), starts the React gallery with the compare runner,
// records each clip frame by frame at 60 frames a second on the page's own
// clock (capture.ts), draws every frame into an iPhone or Pixel frame with a
// caption and the touch point, encodes an MP4 per clip and a contact sheet
// per clip, and writes the index (index.html, index.md), pack.json, the
// device script and the sign sheet docs/reports/reset/signoff/<order>.md.
// Where a clip names a compare pair, the source screen is recorded with the
// same strokes and shown beside it. Exit 0 when every clip was recorded, 1
// when one was not, 2 when the pack could not run.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { cpus, loadavg, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from '@playwright/test';
import { loadPair } from '../compare/pairs';
import { REPO, startSource, startSystem, type Server } from '../compare/sources';
import type { Device, PlatformArg } from '../perceive/types';
import { FRAME_ARGS, FRAME_MS } from './capture';
import { CLIPS, findClip } from './clips';
import { clipKey, clipUrl, finishClip, firstChange, frameName } from './pack';
import { deviceScript, indexHtml, indexMarkdown, readAnswers, signSheet } from './report';
import { recordScreen } from './screen';
import type { ClipDef, ClipResult, PackFile, PackResult } from './types';

export const RECORD_DIR = dirname(fileURLToPath(import.meta.url));
export const PACKS_DIR = join(RECORD_DIR, 'packs');
export const SIGNOFF_DIR = join(REPO, 'docs/reports/reset/signoff');

const PLATFORMS: PlatformArg[] = ['auto', 'web', 'ios', 'android', 'macos'];

export interface Args {
  order: string | null;
  clips: string[];
  styles: string[];
  platforms: PlatformArg[];
  devices: Device[];
  schemes: ('light' | 'dark')[];
  scale: number;
  crf: number;
  maxKb: number;
  out: string | null;
  systemUrl: string | null;
  preview: string;
  keep: boolean;
  list: boolean;
}

export function parseArgs(argv: string[]): Args {
  const out: Args = { order: null, clips: [], styles: [], platforms: [], devices: [], schemes: [], scale: 2, crf: 30, maxKb: 1000, out: null, systemUrl: null, preview: 'the preview URL the lead deploys for this order', keep: false, list: false };
  const list = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] ?? '';
    const [flag, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const value = () => inline ?? argv[++i] ?? '';
    if (flag === '--order') out.order = value();
    else if (flag === '--clip' || flag === '--clips') out.clips.push(...list(value()));
    else if (flag === '--style' || flag === '--styles') out.styles.push(...list(value()));
    else if (flag === '--platform' || flag === '--platforms') {
      for (const p of list(value())) {
        if (!PLATFORMS.includes(p as PlatformArg)) throw new Error(`Unknown platform ${p}; use ${PLATFORMS.join(', ')}`);
        out.platforms.push(p as PlatformArg);
      }
    } else if (flag === '--device' || flag === '--devices') {
      for (const d of list(value())) {
        if (d !== 'pixel' && d !== 'iphone') throw new Error(`Unknown device ${d}; use pixel or iphone`);
        out.devices.push(d);
      }
    } else if (flag === '--scheme' || flag === '--schemes') {
      for (const s of list(value())) {
        if (s !== 'light' && s !== 'dark') throw new Error(`Unknown scheme ${s}; use light or dark`);
        out.schemes.push(s);
      }
    } else if (flag === '--scale') out.scale = Number(value());
    else if (flag === '--crf') out.crf = Number(value());
    else if (flag === '--max-kb') out.maxKb = Number(value());
    else if (flag === '--out') out.out = value();
    else if (flag === '--system-url') out.systemUrl = value().replace(/\/+$/, '');
    else if (flag === '--preview') out.preview = value();
    else if (flag === '--keep') out.keep = true;
    else if (flag === '--list' || flag === '--help' || flag === '-h') out.list = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!Number.isFinite(out.scale) || out.scale < 1 || out.scale > 3) throw new Error('--scale is 1 to 3');
  return out;
}

export function packIds(): string[] {
  return existsSync(PACKS_DIR) ? readdirSync(PACKS_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort() : [];
}

/** Problems with a pack file, empty when it is sound. */
export function checkPack(data: unknown, id?: string): string[] {
  const errors: string[] = [];
  const p = data as Partial<PackFile>;
  if (typeof p !== 'object' || p === null) return ['a pack is a JSON object'];
  if (typeof p.order !== 'string' || !/^[A-Za-z0-9.-]+$/.test(p.order)) errors.push('order must be an order id such as R0.9');
  if (id && p.order !== id) errors.push(`order "${p.order}" does not match the file name "${id}"`);
  if (typeof p.title !== 'string' || p.title === '') errors.push('title is required');
  if (!Array.isArray(p.clips) || p.clips.length === 0) errors.push('clips must list at least one clip');
  else for (const c of p.clips) if (!findClip(c)) errors.push(`no clip "${c}" in clips.ts`);
  if (!Array.isArray(p.styles) || p.styles.length === 0) errors.push('styles must list at least one style');
  if (!Array.isArray(p.platforms) || p.platforms.some((x) => !PLATFORMS.includes(x))) errors.push(`platforms must be some of ${PLATFORMS.join(', ')}`);
  if (!Array.isArray(p.devices) || p.devices.length === 0 || p.devices.some((d) => d !== 'pixel' && d !== 'iphone')) errors.push('devices must be pixel, iphone or both');
  if (!Array.isArray(p.schemes) || p.schemes.length === 0 || p.schemes.some((s) => s !== 'light' && s !== 'dark')) errors.push('schemes must be light, dark or both');
  return errors;
}

export function loadPack(id: string): PackFile {
  const path = join(PACKS_DIR, `${id}.json`);
  if (!existsSync(path)) throw new Error(`No pack for order ${id} (packs: ${packIds().join(', ') || 'none'}). Add ${path}.`);
  const data = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  const errors = checkPack(data, id);
  if (errors.length > 0) throw new Error(`Pack ${id} is not valid:\n- ${errors.join('\n- ')}`);
  return data as PackFile;
}

function usage(): string {
  return [
    'npm run record -- --order <id> [--clip <ids>] [--style <ids>] [--platform <ids>] [--device pixel,iphone] [--scheme light,dark]',
    '  --order <id>      the pack in packs/<id>.json; writes docs/reports/reset/<id>/record/ and docs/reports/reset/signoff/<id>.md',
    '  --clip, --style, --platform, --device, --scheme   narrow or change the pack for this run',
    '  --scale <n>       pixels per CSS px of the clip (default 2; the index shows it at 1x)',
    '  --crf <n>         H.264 quality, lower is larger (default 30); raised by 3 until a clip fits --max-kb (default 1000)',
    '  --out <dir>, --system-url <url>, --preview <url> (for the device script), --keep (keep the frames)',
    `Packs: ${packIds().join(', ') || 'none'}. Clips: ${CLIPS.map((c) => c.id).join(', ')}`,
  ].join('\n');
}

function commitOfRepo(): string {
  try {
    const head = execFileSync('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['-C', REPO, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim() !== '';
    return `${head}${dirty ? ' with uncommitted changes' : ''}`;
  } catch {
    return 'unknown';
  }
}

async function main(): Promise<number> {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    console.error(usage());
    return 2;
  }
  if (args.list || !args.order) {
    console.log(usage());
    return args.list ? 0 : 2;
  }
  let file: PackFile;
  try {
    file = loadPack(args.order);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  }
  const clipIds = args.clips.length > 0 ? args.clips : file.clips;
  const missing = clipIds.filter((c) => !findClip(c));
  if (missing.length > 0) {
    console.error(`No clip ${missing.join(', ')}. ${usage()}`);
    return 2;
  }
  const styles = args.styles.length > 0 ? args.styles : file.styles;
  const platforms = args.platforms.length > 0 ? args.platforms : file.platforms;
  const devs = args.devices.length > 0 ? args.devices : file.devices;
  const schemes = args.schemes.length > 0 ? args.schemes : file.schemes;
  const outDir = resolve(args.out ?? join(REPO, 'docs/reports/reset', file.order, 'record'));
  const work = join(tmpdir(), 'ds-record', file.order);
  mkdirSync(outDir, { recursive: true });
  const log = (line: string) => console.log(line);

  let server: Server | undefined;
  const sources = new Map<string, Server>();
  let recBrowser: Browser | undefined;
  let compBrowser: Browser | undefined;
  const stopAll = async () => {
    await recBrowser?.close().catch(() => undefined);
    await compBrowser?.close().catch(() => undefined);
    for (const s of sources.values()) await s.close().catch(() => undefined);
    await server?.close().catch(() => undefined);
  };
  process.once('SIGINT', () => void stopAll().then(() => process.exit(130)));
  process.once('SIGTERM', () => void stopAll().then(() => process.exit(143)));

  // A rerun of part of a pack keeps the clips it did not touch.
  const packJson = join(outDir, 'pack.json');
  const kept: ClipResult[] = existsSync(packJson) ? ((JSON.parse(readFileSync(packJson, 'utf8')) as PackResult).clips ?? []) : [];
  const results = new Map<string, ClipResult>(kept.map((c) => [c.key, c]));
  let failed = false;
  try {
    server = await startSystem(args.systemUrl ?? undefined, log);
    const launchRec = async () => chromium.launch({ args: FRAME_ARGS });
    compBrowser = await chromium.launch();
    const chromiumVersion = compBrowser.version();
    const load = loadavg();
    log(`Recording pack ${file.order} (load ${load.map((l) => l.toFixed(2)).join(' ')} on ${cpus().length} cores)`);
    for (const id of clipIds) {
      const def = findClip(id) as ClipDef;
      for (const style of styles)
        for (const platform of platforms)
          for (const device of devs)
            for (const scheme of schemes) {
              const key = clipKey(def.id, style, platform, device, scheme);
              const base: ClipResult = { key, clip: def.id, name: def.name, does: def.does, style, platform, detected: null, device, deviceName: frameName(device), scheme, video: null, sheet: null, source: null, frames: 0, durationMs: 0, keyFrames: null, firstChange: null, bytes: { video: 0, sheet: 0 } };
              if (def.cannot) {
                results.set(key, { ...base, cannot: def.cannot });
                log(`  cannot  ${key}: ${def.cannot}`);
                continue;
              }
              const dir = join(work, key);
              rmSync(dir, { recursive: true, force: true });
              let result: ClipResult = base;
              for (let attempt = 1; attempt <= 3; attempt += 1) {
                try {
                  // A fresh browser for each recording: a late reply on a closed frame controlled page can otherwise take the run down.
                  await recBrowser?.close().catch(() => undefined);
                  recBrowser = await launchRec();
                  const rec = await recordScreen(recBrowser, { url: clipUrl(server.url, def.slug, { style, scheme, platform, caseId: def.case }), device, scheme, scale: args.scale, caseId: def.case, setup: def.setup, ready: def.ready, strokes: def.strokes, dir: join(dir, 'screen') });
                  const video = `clips/${key}.mp4`;
                  const sheet = `sheets/${key}.png`;
                  const done = await finishClip(compBrowser, { rec, kind: device, name: def.name, does: def.does, style, scheme, platform, scale: args.scale, work: dir, video: join(outDir, video), sheet: join(outDir, sheet) }, { crf: args.crf, maxBytes: args.maxKb * 1024 });
                  result = { ...base, detected: rec.detected, video, sheet: done.keyFrames ? sheet : null, frames: rec.frames.length, durationMs: Math.round(rec.frames.length * FRAME_MS), keyFrames: done.keyFrames, firstChange: firstChange(rec.frames), bytes: done.bytes };
                  delete result.error;
                  break;
                } catch (err) {
                  result = { ...base, error: err instanceof Error ? err.message.split('\n')[0] : String(err) };
                  log(`  retry ${key} (${result.error})`);
                }
              }
              if (def.source && !result.error) {
                const pair = loadPair(def.source.pair);
                try {
                  let src = sources.get(pair.source.repo);
                  if (!src) {
                    src = await startSource(pair.source.repo, pair.source.screen, undefined, log);
                    sources.set(pair.source.repo, src);
                  }
                  const sdir = join(dir, 'source');
                  await recBrowser?.close().catch(() => undefined);
                  recBrowser = await launchRec();
                  const rec = await recordScreen(recBrowser, { url: `${src.url}${pair.source.screen}`, device, profileName: 'Desktop Chrome', viewport: pair.viewport, scheme: pair.scheme, scale: 1, setup: pair.source.setup, strokes: def.source.strokes, dir: join(sdir, 'screen') });
                  const video = `clips/${key}.source.mp4`;
                  const sheet = `sheets/${key}.source.png`;
                  await finishClip(compBrowser, { rec, kind: 'window', name: def.name, does: def.does, style: `source of ${pair.id}`, scheme: pair.scheme, platform: 'web', scale: 1, work: sdir, video: join(outDir, video), sheet: join(outDir, sheet), side: 'Source' }, { crf: args.crf, maxBytes: args.maxKb * 1024 });
                  result.source = { pair: pair.id, video, sheet, note: `${pair.source.how}${pair.source.reconstruction ? ' A reconstruction from source parts.' : ''}` };
                } catch (err) {
                  result.source = { pair: pair.id, video: null, sheet: null, note: `The source clip could not be recorded: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}` };
                }
              }
              results.set(key, result);
              if (result.error) failed = true;
              log(`  ${result.error ? 'FAIL' : 'ok  '}  ${key}${result.error ? `: ${result.error}` : `: ${result.frames} frames, ${Math.round(result.bytes.video / 1024)} KB clip, ${Math.round(result.bytes.sheet / 1024)} KB sheet, detected ${result.detected}; ${result.firstChange ? `first change ${result.firstChange.afterDownMs}ms after the finger landed${result.firstChange.whileDown ? ', while down' : ', after it lifted'}` : 'no change'}`}`);
              if (!args.keep) rmSync(dir, { recursive: true, force: true });
            }
    }
    // Keep the pack's own order: clips, then styles, platforms, devices, schemes.
    const order = (c: ClipResult) => [file.clips.indexOf(c.clip), styles.indexOf(c.style), platforms.indexOf(c.platform), devs.indexOf(c.device), schemes.indexOf(c.scheme)].map((n) => String(n < 0 ? 99 : n).padStart(2, '0')).join('');
    const pack: PackResult = { order: file.order, title: file.title, date: new Date().toISOString(), commit: commitOfRepo(), load, cpus: cpus().length, chromium: chromiumVersion, clips: [...results.values()].sort((a, b) => order(a).localeCompare(order(b))), note: file.note };
    writeFileSync(packJson, `${JSON.stringify(pack, null, 1)}\n`);
    writeFileSync(join(outDir, 'index.html'), indexHtml(pack, args.scale));
    writeFileSync(join(outDir, 'index.md'), indexMarkdown(pack));
    const template = readFileSync(join(SIGNOFF_DIR, 'device-script.template.md'), 'utf8');
    writeFileSync(join(outDir, 'device-script.md'), deviceScript(template, pack, file, args.preview));
    mkdirSync(SIGNOFF_DIR, { recursive: true });
    const sheetPath = join(SIGNOFF_DIR, `${file.order}.md`);
    writeFileSync(sheetPath, signSheet(pack, file, readAnswers(sheetPath), file.ask ?? null));
    const total = pack.clips.reduce((n, c) => n + c.bytes.video + c.bytes.sheet, 0);
    log(`Wrote ${outDir} (${Math.round(total / 1024)} KB of clips and sheets) and ${sheetPath}`);
    return failed ? 1 : 0;
  } finally {
    await stopAll();
  }
}

if (process.argv[1] && /record[\\/]run\.ts$/.test(process.argv[1])) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
      process.exit(2);
    },
  );
}
