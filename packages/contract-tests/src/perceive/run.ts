// npm run perceive -- --component <slug>[,<slug>] --style <id> --platform <id> [--device pixel|iphone]
// npm run perceive -- --all --style neutral --platform android
// npm run perceive -- --calibrate
// npm run perceive -- --list
//
// The perception gate (order R0.8). Starts the React gallery (the same runner
// as `npm run compare`), opens each component's normal page at a phone
// profile with touch, drives a real touch gesture through CDP, samples every
// frame at 1x in real time, and reports latency from `pointerdown` to the
// first visual change, the headline part's travel, scale or fill area, the
// length of its main change and which other elements react. Pressables are
// also held down for 600ms to read the press while the finger is down.
// Neutral and Liquid are judged on the rich profile, Studio and Desk on the
// quiet one (ruling 3). Writes table.md and result.json to
// docs/reports/reset/perceive/<style>-<platform>-<device>/ unless --out says
// otherwise. Exit 0 when every interaction passes, 1 when one fails, 2 when
// the gate itself could not run.
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, loadavg } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, devices, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { analyze, analyzeHold } from './analyze';
import { compareWithAudit } from './calibration';
import { BASELINE_SAMPLE, INTERACTIONS, findInteraction, profileFor } from './catalog';
import { drag, holdPointer, touchSession, type Point } from './gesture';
import { auditCall, quietChecks, richChecks, sentences } from './profiles';
import { calibrationMarkdown, runMarkdown, type RunInfo } from './report';
import { pageNow, startSampler, stopSampler, type SamplerConfig } from './sampler';
import { quietSource } from './sources';
import type { Device, HoldResult, Interaction, InteractionResult, Measured, PlatformArg, Profile, Recording, Track } from './types';
import { settle } from '../compare/probe';
import { REPO, startSystem, type Server } from '../compare/sources';

export const DEVICES: Record<Device, string> = { pixel: 'Pixel 7', iphone: 'iPhone 15 Pro' };
const PLATFORMS: PlatformArg[] = ['auto', 'web', 'ios', 'android', 'macos'];

interface Args {
  ids: string[];
  styles: string[];
  platforms: PlatformArg[];
  devices: Device[] | null;
  profile: Profile | null;
  scheme: 'light' | 'dark';
  holdMs: number | null;
  pressHold: number;
  calibrate: boolean;
  list: boolean;
  out: string | null;
  systemUrl: string | null;
  frames: boolean;
  tag: string | null;
}

export function parseArgs(argv: string[]): Args {
  const out: Args = { ids: [], styles: [], platforms: [], devices: null, profile: null, scheme: 'light', holdMs: null, pressHold: 600, calibrate: false, list: false, out: null, systemUrl: null, frames: false, tag: null };
  const list = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] ?? '';
    const [flag, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const value = () => inline ?? argv[++i] ?? '';
    if (flag === '--component' || flag === '--components') out.ids.push(...list(value()));
    else if (flag === '--all') out.ids.push(...INTERACTIONS.map((x) => x.id));
    else if (flag === '--sample') out.ids.push(...BASELINE_SAMPLE);
    else if (flag === '--style' || flag === '--styles') out.styles.push(...list(value()));
    else if (flag === '--platform' || flag === '--platforms') {
      for (const p of list(value())) {
        if (!PLATFORMS.includes(p as PlatformArg)) throw new Error(`Unknown platform ${p}; use ${PLATFORMS.join(', ')}`);
        out.platforms.push(p as PlatformArg);
      }
    } else if (flag === '--device' || flag === '--devices') {
      out.devices = list(value()).map((d) => {
        if (d !== 'pixel' && d !== 'iphone') throw new Error(`Unknown device ${d}; use pixel or iphone`);
        return d;
      });
    } else if (flag === '--profile') {
      const p = value();
      if (p !== 'rich' && p !== 'quiet') throw new Error('--profile is rich or quiet');
      out.profile = p;
    } else if (flag === '--scheme') out.scheme = value() === 'dark' ? 'dark' : 'light';
    else if (flag === '--hold') out.holdMs = Number(value());
    else if (flag === '--press-hold') out.pressHold = Number(value());
    else if (flag === '--calibrate') out.calibrate = true;
    else if (flag === '--list') out.list = true;
    else if (flag === '--out') out.out = value();
    else if (flag === '--system-url') out.systemUrl = value().replace(/\/+$/, '');
    else if (flag === '--frames') out.frames = true;
    else if (flag === '--tag') out.tag = value();
    else if (flag === '--help' || flag === '-h') {
      out.list = true;
    } else throw new Error(`Unknown argument: ${a}`);
  }
  return out;
}

/** The device a platform gets when none is named: an iPhone for ios, else a Pixel. */
export function devicesFor(platform: PlatformArg, asked: Device[] | null): Device[] {
  if (asked) return asked;
  return platform === 'ios' ? ['iphone'] : ['pixel'];
}

export function pageUrl(base: string, ix: Interaction, style: string, platform: PlatformArg, scheme: string): string {
  const q = new URLSearchParams();
  q.set('style', style);
  q.set('scheme', scheme);
  if (platform !== 'auto') q.set('platform', platform);
  q.set('dir', 'ltr');
  q.set('lang', 'en');
  if (ix.case) q.set('case', ix.case);
  q.set('chrome', '0');
  return `${base}/c/${ix.slug}?${q.toString()}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const medianOf = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 'unknown' : String(s[Math.floor(s.length / 2)]);
};

async function openAndAim(page: Page, url: string, ix: Interaction): Promise<{ point: Point; detected: string | null }> {
  await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
  await page.locator('[data-demo-case]').first().waitFor({ state: 'attached', timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.evaluate(settle, 3000);
  await sleep(150);
  let loc = ix.case ? page.locator(`[data-demo-case="${ix.case}"]`).locator(ix.target.selector) : page.locator(ix.target.selector);
  if (ix.target.text) loc = loc.filter({ hasText: ix.target.text });
  const target = loc.nth(ix.target.nth ?? 0);
  await target.waitFor({ state: 'visible', timeout: 30_000 });
  await target.scrollIntoViewIfNeeded();
  await page.evaluate(settle, 1500);
  await target.evaluate((el) => el.setAttribute('data-perceive-target', ''));
  const box = await target.boundingBox();
  if (!box) throw new Error(`the target ${ix.target.selector} has no box`);
  const at = ix.at ?? { x: 0.5, y: 0.5 };
  const detected = await page.evaluate(() => document.documentElement.getAttribute('data-platform'));
  return { point: { x: box.x + box.width * at.x, y: box.y + box.height * at.y }, detected };
}

/** Records one gesture: sampler on, 120ms of rest, the gesture, then frames until the change settles. */
async function record(page: Page, ix: Interaction, point: Point, cfg: SamplerConfig, gesture: { kind: Interaction['gesture']; holdMs: number }): Promise<Recording> {
  const cdp = await touchSession(page);
  try {
    await page.evaluate(startSampler, cfg);
    await sleep(120);
    if (gesture.kind === 'drag') await drag(cdp, point, ix.dragStep ?? 3.6);
    else await holdPointer(cdp, point, gesture.holdMs);
    const after = gesture.kind === 'long-press' ? 900 : gesture.kind === 'hold' ? 400 : 1200;
    await sleep(after);
    await page.evaluate(pageNow);
    return await page.evaluate(stopSampler, cfg.scheme);
  } finally {
    await cdp.detach().catch(() => undefined);
  }
}

function slimTrack(t: Track) {
  const { animations, ...rest } = t;
  return { ...rest, animations: animations.map((a) => ({ type: a.type, name: a.name, props: a.props, duration: a.duration, delay: a.delay, easing: a.easing, keyEasing: a.keyEasing })) };
}

function slimMeasured(m: Measured) {
  return {
    ...m,
    headline: m.headline ? slimTrack(m.headline) : null,
    secondaries: m.secondaries.map((t) => ({ desc: t.desc, ownTravel: t.ownTravel, colourDelta: t.colourDelta, start: t.start, totalMs: t.totalMs })),
    cuts: m.cuts.map((t) => ({ desc: t.desc, cut: t.cut })),
    tooShortOrSmall: m.tooShortOrSmall.map((x) => ({ desc: x.track.desc, why: x.why })),
    tracks: m.tracks.filter((t) => t.changed && !t.preMoving).map(slimTrack),
  };
}

export async function measureOne(context: BrowserContext, base: string, ix: Interaction, opts: { style: string; platform: PlatformArg; device: Device; profile: Profile; scheme: 'light' | 'dark'; holdMs: number | null; pressHold: number; frames: boolean }): Promise<{ result: InteractionResult; recording: Recording | null }> {
  const url = pageUrl(base, ix, opts.style, opts.platform, opts.scheme);
  const cfg: SamplerConfig = { target: '[data-perceive-target]', root: ix.root ?? null, overlay: ix.overlay ?? null, headline: ix.headline, headlineIn: ix.headlineIn ?? 'root', scheme: opts.scheme };
  const holdMs = opts.holdMs ?? ix.holdMs ?? 90;
  const base0: InteractionResult = { id: ix.id, name: ix.name, does: ix.does, style: opts.style, platform: opts.platform, detectedPlatform: null, device: opts.device, profile: opts.profile, gesture: ix.gesture, holdMs, measured: null, hold: null, checks: [], pass: false, call: null, callWhy: '', sentences: [] };
  const page = await context.newPage();
  await page.addInitScript({ content: 'window.__name = (f) => f;' });
  let recording: Recording | null = null;
  try {
    const { point, detected } = await openAndAim(page, url, ix);
    base0.detectedPlatform = detected;
    recording = await record(page, ix, point, cfg, { kind: ix.gesture, holdMs });
    const measured = analyze(recording, { gesture: ix.gesture });
    let hold: HoldResult | null = null;
    if (ix.pressable && opts.pressHold > 0) {
      const again = await openAndAim(page, url, ix);
      const held = await record(page, ix, again.point, cfg, { kind: 'hold', holdMs: opts.pressHold });
      hold = analyzeHold(held);
    }
    const checks = opts.profile === 'rich' ? richChecks(ix, measured, detected ?? opts.platform) : quietChecks(measured, quietSource(opts.style, ix.id));
    if (hold) checks.push({ id: 'held', label: `Press shows while the finger is held ${hold.holdMs}ms`, pass: hold.onAfter !== null && hold.onAfter <= 32 && hold.share >= 0.95, measured: hold.onAfter === null ? 'nothing while held' : `from ${hold.onAfter}ms, ${hold.shownMs}ms of the hold`, limit: 'from 32ms or sooner, for the whole hold' });
    const call = auditCall(ix, measured);
    const result: InteractionResult = { ...base0, measured, hold, checks, pass: checks.every((c) => c.pass), call: call.call, callWhy: call.why, sentences: sentences(ix, measured, hold) };
    return { result, recording: opts.frames ? recording : null };
  } catch (err) {
    return { result: { ...base0, error: err instanceof Error ? err.message.split('\n')[0] : String(err) }, recording: null };
  } finally {
    await page.close().catch(() => undefined);
  }
}

function usage(): string {
  return [
    'npm run perceive -- --component <slug>[,<slug>] --style <id>[,<id>] --platform <auto|web|ios|android|macos>[,...] [--device pixel|iphone]',
    '  --all             the twenty components of the motion audit',
    '  --sample          button, switch, checkbox, tabs, toast, dialog',
    '  --profile rich|quiet   default: quiet for studio and desk, rich for the rest',
    '  --hold <ms>       how long a tap holds the finger down (default 90)',
    '  --press-hold <ms> the held press measured on pressables (default 600, 0 skips it)',
    '  --scheme light|dark, --out <dir>, --system-url <url>, --frames (keep every frame), --tag <name>',
    '  --calibrate       the audit run: all twenty, Neutral, platform web, Pixel; compares with the audit table',
    `Interactions: ${INTERACTIONS.map((i) => i.id).join(', ')}`,
  ].join('\n');
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
  if (args.list) {
    console.log(usage());
    return 0;
  }
  if (args.calibrate) {
    args.ids = INTERACTIONS.map((i) => i.id);
    args.styles = ['neutral'];
    args.platforms = ['web'];
    args.devices = ['pixel'];
    args.profile = 'rich';
  }
  if (args.ids.length === 0) {
    console.error('Name the interactions with --component, --all or --sample.');
    console.error(usage());
    return 2;
  }
  const missing = args.ids.filter((id) => !findInteraction(id));
  if (missing.length > 0) {
    console.error(`No interaction called ${missing.join(', ')}. ${usage()}`);
    return 2;
  }
  const ixs = [...new Set(args.ids)].map((id) => findInteraction(id) as Interaction);
  const styles = args.styles.length > 0 ? args.styles : ['neutral'];
  const platforms = args.platforms.length > 0 ? args.platforms : ['auto' as PlatformArg];
  const log = (line: string) => console.log(line);
  let server: Server | undefined;
  let browser: Browser | undefined;
  const stopAll = async () => {
    await browser?.close().catch(() => undefined);
    await server?.close().catch(() => undefined);
  };
  process.once('SIGINT', () => void stopAll().then(() => process.exit(130)));
  process.once('SIGTERM', () => void stopAll().then(() => process.exit(143)));
  let failed = false;
  try {
    server = await startSystem(args.systemUrl ?? undefined, log);
    browser = await chromium.launch();
    const chromiumVersion = browser.version();
    for (const style of styles) {
      for (const platform of platforms) {
        for (const device of devicesFor(platform, args.devices)) {
          const profile = args.profile ?? profileFor(style);
          const newContext = async () => {
            if (!browser?.isConnected()) browser = await chromium.launch();
            return browser.newContext({ ...devices[DEVICES[device]], colorScheme: args.scheme, reducedMotion: 'no-preference' });
          };
          let context = await newContext();
          const load = loadavg();
          const results: InteractionResult[] = [];
          const recordings: Record<string, Recording> = {};
          log(`\n${style}, platform ${platform}, ${device}, ${profile} profile (load ${load.map((l) => l.toFixed(2)).join(' ')})`);
          for (const ix of ixs) {
            const opts = { style, platform, device, profile, scheme: args.scheme, holdMs: args.holdMs, pressHold: args.pressHold, frames: args.frames };
            let { result, recording } = await measureOne(context, server.url, ix, opts);
            // Under load Chromium can drop a page or the whole browser, or a page can take too long: try twice more on a fresh context.
            for (let attempt = 2; result.error && attempt <= 3; attempt += 1) {
              log(`  retry ${ix.id} (${result.error})`);
              await context.close().catch(() => undefined);
              context = await newContext();
              ({ result, recording } = await measureOne(context, server.url, ix, opts));
            }
            results.push(result);
            if (recording) recordings[ix.id] = recording;
            const m = result.measured;
            log(`  ${result.pass ? 'pass' : 'FAIL'}  ${ix.id.padEnd(18)} ${result.error ? `error: ${result.error}` : `latency ${m?.latency ?? 'none'}ms${m?.startsAtRelease ? ' at release' : ''}, main ${m?.mainMs ?? 'none'}ms, moves ${m?.headline ? Math.max(m.headline.travel, m.headline.ownTravel) : 0}px, call ${result.call}`}`);
            if (!result.pass) failed = true;
          }
          await context.close().catch(() => undefined);
          const label = args.calibrate ? 'calibration' : (args.tag ?? `${style}-${platform}-${device}`);
          const outDir = resolve(args.out ? (styles.length * platforms.length > 1 || (args.devices?.length ?? 1) > 1 ? join(args.out, `${style}-${platform}-${device}`) : args.out) : join(REPO, 'docs/reports/reset/perceive', label));
          mkdirSync(outDir, { recursive: true });
          const info: RunInfo = {
            date: new Date().toISOString(),
            style,
            platform,
            device: DEVICES[device],
            profile,
            scheme: args.scheme,
            load,
            cpus: cpus().length,
            chromium: chromiumVersion,
            url: server.url,
            notes: [
              `Detected platform on the page: ${[...new Set(results.map((r) => r.detectedPlatform ?? 'none'))].join(', ')}.`,
              `Median frame interval: ${medianOf(results.map((r) => r.measured?.frameMs ?? 0).filter((x) => x > 0))}ms (16.7ms is 60 frames a second).`,
              ...(load[0] !== undefined && load[0] > cpus().length ? [`The machine was loaded (load average ${load[0].toFixed(2)} on ${cpus().length} cores): latencies and frame times may read longer than on an idle machine.`] : []),
            ],
          };
          const json = { info, results: results.map((r) => ({ ...r, measured: r.measured ? slimMeasured(r.measured) : null })) };
          writeFileSync(join(outDir, 'result.json'), `${JSON.stringify(json, null, 1)}\n`);
          writeFileSync(join(outDir, 'table.md'), runMarkdown(info, results));
          if (args.frames) writeFileSync(join(outDir, 'frames.json'), JSON.stringify(recordings));
          if (args.calibrate) {
            const cal = compareWithAudit(results);
            writeFileSync(join(outDir, 'calibration.md'), calibrationMarkdown(info, cal));
            log(`\nCalibration: ${cal.pass ? 'pass' : 'fail'}; ${cal.counts.invisible} invisible, ${cal.counts.wrong} wrong, ${cal.counts.fine} fine; ${cal.lines.filter((l) => l.pass).length} of ${cal.lines.length} numbers within 10 percent.`);
            for (const l of cal.lines.filter((x) => !x.pass)) log(`  off: ${l.id} ${l.what}: audit ${l.audit}, gate ${l.measured}`);
            for (const c of cal.calls.filter((x) => x.audit !== x.gate)) log(`  call: ${c.id}: audit ${c.audit}, gate ${c.gate} (${c.why})`);
            failed = !cal.pass;
          }
          log(`Wrote ${outDir}`);
        }
      }
    }
    return failed ? 1 : 0;
  } finally {
    await stopAll();
  }
}

if (process.argv[1] && /perceive[\\/]run\.ts$/.test(process.argv[1])) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
      process.exit(2);
    },
  );
}
