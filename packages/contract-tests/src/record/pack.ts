// Builds the clips of a pack: records the screen frames (screen.ts), draws
// each one into its frame with the caption and the touch point (compose.ts),
// encodes the clip with ffmpeg as H.264 MP4 (it plays on iOS, Android and in
// a desktop browser), and writes the contact sheet of its four moments.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Browser } from '@playwright/test';
import type { PlatformArg, Device } from '../perceive/types';
import { applyFrame, frameHtml, frameState, keyFrames, platformLabel, seconds, sheetHtml, PHONE, titleCase, type FrameKind } from './compose';
import { FRAME_MS } from './capture';
import { DEVICES, type ScreenRecording } from './screen';
import type { ClipResult, KeyFrames } from './types';

/** The gallery page of a clip. `auto` leaves the platform key out, so the page detects the phone. */
export function clipUrl(base: string, slug: string, opts: { style: string; scheme: string; platform: PlatformArg; caseId?: string }): string {
  const q = new URLSearchParams();
  q.set('style', opts.style);
  q.set('scheme', opts.scheme);
  if (opts.platform !== 'auto') q.set('platform', opts.platform);
  q.set('dir', 'ltr');
  q.set('lang', 'en');
  if (opts.caseId) q.set('case', opts.caseId);
  q.set('chrome', '0');
  return `${base}/c/${slug}?${q.toString()}`;
}

export function clipKey(clip: string, style: string, platform: string, device: string, scheme: string): string {
  return [clip, style, platform, device, scheme].join('-');
}

/** The device as the caption names it. */
export function frameName(kind: FrameKind): string {
  return kind === 'window' ? 'a plain window (the source screen is not a phone screen)' : `an ${DEVICES[kind as Device]} frame`.replace(/^an ([^aeiouAEIOU])/, 'a $1');
}

export interface ComposeJob {
  rec: ScreenRecording;
  kind: FrameKind;
  name: string;
  does: string;
  style: string;
  scheme: 'light' | 'dark';
  platform: PlatformArg;
  scale: number;
  work: string;
  video: string;
  sheet: string;
  /** A label for the sheet title, "Source" for a source clip. */
  side?: string;
}

/** Draws every frame into its frame page and captures it. */
async function composeFrames(browser: Browser, job: ComposeJob): Promise<string> {
  const out = join(job.work, 'composed');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const caption = { name: job.side ? `${job.name}, ${job.side.toLowerCase()}` : job.name, style: job.style, scheme: job.scheme, platform: platformLabel(job.platform, job.rec.detected), deviceName: frameName(job.kind), does: job.does };
  const html = join(job.work, 'frame.html');
  writeFileSync(html, frameHtml({ device: job.kind, viewport: job.rec.viewport, caption, frames: job.rec.frames, dark: job.scheme === 'dark' }));
  const page = await browser.newPage({ deviceScaleFactor: job.scale, viewport: { width: 1200, height: 1200 } });
  try {
    await page.goto(pathToFileURL(html).href);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const main = page.locator('main');
    const box = await main.boundingBox();
    if (box) await page.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) });
    const rel = relative(job.work, job.rec.dir);
    for (let i = 0; i < job.rec.frames.length; i += 1) {
      const src = `${rel}/${String(i).padStart(4, '0')}.png`;
      await page.evaluate(applyFrame, frameState(job.rec.frames, i, src, PHONE[job.kind].top));
      await main.screenshot({ path: join(out, `${String(i).padStart(4, '0')}.png`), animations: 'allow', caret: 'initial' });
    }
  } finally {
    await page.close();
  }
  return out;
}

/** H.264 MP4 at 60 frames a second; crf trades size for detail. */
export function encode(framesDir: string, video: string, crf = 30): void {
  mkdirSync(join(video, '..'), { recursive: true });
  const res = spawnSync(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-framerate', '60', '-i', join(framesDir, '%04d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-r', '60', '-movflags', '+faststart', video],
    { encoding: 'utf8' },
  );
  if (res.status !== 0) throw new Error(`ffmpeg failed: ${res.stderr || res.error?.message}`);
}

/** The four moments, labelled with their time after the finger went down. */
export function sheetCells(frames: ScreenRecording['frames'], k: KeyFrames): { index: number; label: string; time: string }[] {
  const at = (i: number) => {
    const ms = Math.round((i - k.down) * FRAME_MS);
    return `${seconds(i)} (${ms >= 0 ? `${ms}ms after the finger landed` : 'before'})`;
  };
  const moving = frames.slice(k.down, k.up).some((f) => f.x !== frames[k.down]!.x || f.y !== frames[k.down]!.y);
  return [
    { index: k.down, label: 'Finger down', time: at(k.down) },
    { index: k.mid, label: moving ? 'Mid drag' : 'Held, mid press', time: at(k.mid) },
    { index: k.up, label: 'Finger lifted', time: at(k.up) },
    { index: k.settled, label: 'Settled', time: at(k.settled) },
  ];
}

async function writeSheet(browser: Browser, job: ComposeJob, composed: string, k: KeyFrames): Promise<void> {
  const cells = sheetCells(job.rec.frames, k).map((c) => ({ src: pathToFileURL(join(composed, `${String(c.index).padStart(4, '0')}.png`)).href, label: c.label, time: c.time }));
  const html = join(job.work, 'sheet.html');
  const title = `${job.side ? `${job.side}: ` : ''}${job.name}. ${titleCase(job.style)}, ${job.scheme}, ${platformLabel(job.platform, job.rec.detected)}, ${frameName(job.kind)}`;
  const cellWidth = 300;
  writeFileSync(html, sheetHtml({ title, sub: job.does, cells, cellWidth, dark: job.scheme === 'dark' }));
  const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: cellWidth * 4 + 60, height: 900 } });
  try {
    await page.goto(pathToFileURL(html).href);
    await page.evaluate(() => Promise.all(Array.from(document.images).map((i) => i.decode().catch(() => undefined))));
    mkdirSync(join(job.sheet, '..'), { recursive: true });
    await page.locator('main').screenshot({ path: job.sheet });
  } finally {
    await page.close();
  }
}

/** Composes, encodes and writes the sheet of one recording. */
export async function finishClip(browser: Browser, job: ComposeJob, opts: { crf: number; maxBytes: number }): Promise<{ keyFrames: KeyFrames | null; bytes: { video: number; sheet: number } }> {
  const composed = await composeFrames(browser, job);
  let crf = opts.crf;
  encode(composed, job.video, crf);
  // Keep every file under the limit: raise crf until it fits.
  while (statSync(job.video).size > opts.maxBytes && crf < 40) {
    crf += 3;
    encode(composed, job.video, crf);
  }
  const k = keyFrames(job.rec.frames);
  if (k) await writeSheet(browser, job, composed, k);
  return { keyFrames: k, bytes: { video: statSync(job.video).size, sheet: existsSync(job.sheet) ? statSync(job.sheet).size : 0 } };
}

/** The least change that counts as the screen answering the finger, in CSS px squared (a 5 by 5 px patch). */
export const VISIBLE_CHANGE = 25;

/**
 * When the screen first changed after the first finger down, and whether the
 * finger was still down then. A change under VISIBLE_CHANGE (a hairline that
 * moves by a pixel) does not count.
 */
export function firstChange(frames: ScreenRecording['frames']): ClipResult['firstChange'] {
  const down = frames.findIndex((f) => f.edge === 'down');
  if (down < 1) return null;
  for (let i = down; i < frames.length; i += 1) {
    if (frames[i]!.changed >= VISIBLE_CHANGE) return { afterDownMs: Math.round((i - down) * FRAME_MS), whileDown: frames[i]!.finger === 'down' };
  }
  return null;
}

/** Reads a size for the summary. */
export const sizeOf = (path: string): number => (existsSync(path) ? statSync(path).size : 0);

export const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
