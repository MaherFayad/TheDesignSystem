// Records the screen frames of one clip: opens the page with a phone profile
// and touch, runs the setup on the wall clock, then stops the clock and draws
// every frame while the finger strokes play out, one 60th of a second each.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { devices, type Browser, type Page } from '@playwright/test';
import { holdPointer, touchDown, touchMove, touchSession, touchUp, type Point } from '../perceive/gesture';
import { settle } from '../compare/probe';
import type { Step } from '../compare/types';
import type { Device } from '../perceive/types';
import { FRAME_MS, FramedPage, hashOf } from './capture';
import type { Aim, FrameInfo, Path, Stroke } from './types';

export const DEVICES: Record<Device, string> = { pixel: 'Pixel 7', iphone: 'iPhone 15 Pro' };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface ScreenRecording {
  frames: FrameInfo[];
  /** The PNG of frame i is <dir>/<i padded to 4>.png. */
  dir: string;
  viewport: { width: number; height: number };
  detected: string | null;
}

export interface ScreenJob {
  url: string;
  device: Device;
  scheme: 'light' | 'dark';
  /** Pixels per CSS px of the capture. */
  scale: number;
  /** The demo case the aims search in, when they do not search the whole document. */
  caseId?: string;
  setup?: (Stroke | Step)[];
  ready?: string;
  strokes: Stroke[];
  /** A Playwright device profile name in place of the phone's (a source screen that is a desktop screen); touch stays on. */
  profileName?: string;
  /** Overrides the device profile's viewport (a source screen's pair viewport). */
  viewport?: { width: number; height: number };
  dir: string;
  /** Rest before the first stroke, in ms. */
  leadMs?: number;
  /** After the last stroke: stop once the screen has not changed for this long. */
  quietMs?: number;
  /** After the last stroke: stop after this long at most. */
  tailMaxMs?: number;
}

/** Runs in the page: the point of an aim in viewport CSS px, or null when it is not there. */
export function pointOf(arg: { aim: Aim; caseId: string | null; scroll: boolean }): { x: number; y: number } | null {
  const scope: ParentNode = !arg.aim.inDocument && arg.caseId ? (document.querySelector(`[data-demo-case="${arg.caseId}"]`) ?? document) : document;
  let els = Array.from(scope.querySelectorAll(arg.aim.selector)).filter((el) => el.getBoundingClientRect().width > 0);
  if (arg.aim.text) els = els.filter((el) => (el.textContent ?? '').includes(arg.aim.text as string));
  const el = els[arg.aim.nth ?? 0];
  if (!el) return null;
  if (arg.scroll) el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  const at = arg.aim.at ?? { x: 0.5, y: 0.5 };
  return { x: r.x + r.width * at.x, y: r.y + r.height * at.y };
}

/** Runs in the page: the direction an attribute names on the first match. */
export function directionOf(arg: { selector: string; attribute: string }): string | null {
  return document.querySelector(arg.selector)?.getAttribute(arg.attribute) ?? null;
}

/** The end of a drag, given the direction an element names. */
export function pathDelta(path: Path, direction: string | null): { dx: number; dy: number } {
  if ('dx' in path) return { dx: path.dx, dy: path.dy };
  const d = path.distance;
  if (direction === 'left') return { dx: -d, dy: 0 };
  if (direction === 'up') return { dx: 0, dy: -d };
  if (direction === 'down') return { dx: 0, dy: d };
  return { dx: d, dy: 0 };
}

const isStroke = (s: Stroke | Step): s is Stroke => 'aim' in s;

async function runStep(page: Page, step: Step): Promise<void> {
  const timeout = 30_000;
  if (step.click) await page.locator(step.click).first().click({ timeout });
  else if (step.hover) await page.locator(step.hover).first().hover({ timeout });
  else if (step.focus) await page.locator(step.focus).first().focus({ timeout });
  else if (step.press) await page.keyboard.press(step.press);
  else if (step.wait) await page.locator(step.wait).first().waitFor({ state: 'visible', timeout });
  else if (step.waitMs !== undefined) await page.waitForTimeout(step.waitMs);
  else if (step.attr) await page.locator(step.attr.selector).first().evaluate((el, a) => (a.value === null ? el.removeAttribute(a.name) : el.setAttribute(a.name, a.value)), step.attr);
}

/** The frame plan of the strokes: what the finger does on each frame. */
export interface PlannedStroke {
  stroke: Stroke;
  downAt: number;
  /** Frames the finger stays still after it lands. */
  holdFrames: number;
  moveFrames: number;
  restFrames: number;
  pauseFrames: number;
}

export function planStroke(stroke: Stroke): Omit<PlannedStroke, 'downAt' | 'stroke'> {
  const f = (ms: number) => Math.max(0, Math.round(ms / FRAME_MS));
  const holdFrames = Math.max(1, f(stroke.holdMs ?? 100));
  return { holdFrames, moveFrames: stroke.path ? Math.max(1, f(stroke.moveMs ?? 250)) : 0, restFrames: stroke.path ? f(stroke.restMs ?? 0) : 0, pauseFrames: f(stroke.pauseAfterMs ?? 900) };
}

export async function recordScreen(browser: Browser, job: ScreenJob): Promise<ScreenRecording> {
  const named = devices[job.profileName ?? DEVICES[job.device]];
  if (!named) throw new Error(`No device profile ${job.profileName ?? job.device}`);
  const profile = job.profileName ? { ...named, hasTouch: true } : named;
  const viewport = job.viewport ?? profile.viewport;
  const { context, framed } = await FramedPage.open(browser, { ...profile, viewport, deviceScaleFactor: job.scale, colorScheme: job.scheme, reducedMotion: 'no-preference' });
  const page = framed.page;
  mkdirSync(job.dir, { recursive: true });
  try {
    await page.goto(job.url, { waitUntil: 'load', timeout: 120_000 });
    await page.locator('body').waitFor({ state: 'attached', timeout: 60_000 });
    if (job.caseId || job.url.includes('/c/')) await page.locator('[data-demo-case]').first().waitFor({ state: 'attached', timeout: 60_000 }).catch(() => undefined);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.evaluate(settle, 3000);
    const detected = await page.evaluate(() => document.documentElement.getAttribute('data-platform'));
    const caseId = job.caseId ?? null;

    // Setup on the wall clock, with touch for strokes.
    for (const s of job.setup ?? []) {
      if (isStroke(s)) {
        const p = await page.evaluate(pointOf, { aim: s.aim, caseId, scroll: true });
        if (!p) throw new Error(`setup: nothing matches ${s.aim.selector}${s.aim.text ? ` "${s.aim.text}"` : ''}`);
        await page.evaluate(settle, 1000);
        const p2 = (await page.evaluate(pointOf, { aim: s.aim, caseId, scroll: false })) ?? p;
        const cdp = await touchSession(page);
        await holdPointer(cdp, p2, s.holdMs ?? 90);
        await cdp.detach().catch(() => undefined);
        await sleep(300);
      } else await runStep(page, s);
    }
    if (job.ready) await page.locator(job.ready).first().waitFor({ state: 'visible', timeout: 30_000 });
    // Bring the first target into view while the clock still runs, then let everything come to rest.
    // After a setup the wait is short: what the setup opened may close on its own timer (a toast).
    const first = job.strokes[0];
    if (first) await page.evaluate(pointOf, { aim: first.aim, caseId, scroll: !first.aim.inDocument });
    await page.evaluate(settle, job.setup?.length ? 1000 : 3000);
    await sleep(job.setup?.length ? 150 : 400);

    // A blinking caret would make every frame differ and hide when the screen really answers the finger.
    await page.addStyleTag({ content: '* { caret-color: transparent; }' });
    await framed.pauseClock();
    const cdp = await touchSession(page);
    const frames: FrameInfo[] = [];
    let finger: Point | null = null;
    let downAt: number | null = null;
    let upAt: number | null = null;
    const shoot = async (edge: FrameInfo['edge'], input?: () => Promise<unknown>) => {
      // A frame with nothing new to draw can come back without pixels: the screen is the one before.
      let png = await framed.frame(true, input);
      const index = frames.length;
      if (!png && index > 0) png = readFileSync(join(job.dir, `${String(index - 1).padStart(4, '0')}.png`));
      for (let tries = 0; !png && tries < 10; tries += 1) png = await framed.frame(true);
      if (!png) throw new Error('the first frame came back without pixels');
      writeFileSync(join(job.dir, `${String(index).padStart(4, '0')}.png`), png);
      frames.push({
        index,
        finger: finger ? 'down' : 'up',
        x: finger?.x ?? (edge === 'up' ? (frames[index - 1]?.x ?? null) : null),
        y: finger?.y ?? (edge === 'up' ? (frames[index - 1]?.y ?? null) : null),
        downFor: finger && downAt !== null ? (index - downAt) * FRAME_MS : null,
        upFor: !finger && upAt !== null ? (index - upAt) * FRAME_MS : null,
        edge,
        hash: png ? hashOf(png) : '',
      });
    };
    const idle = async (n: number) => {
      for (let i = 0; i < n; i += 1) await shoot(null);
    };
    const resolved = new Map<string, Point>();
    try {
      // The lead in: at least leadMs, and on until the screen has been still for 200ms (2s at most),
      // so whatever the setup opened has come to rest before the finger lands.
      const lead = Math.round((job.leadMs ?? 400) / FRAME_MS);
      const restFrames = Math.round(200 / FRAME_MS);
      const stillFor = () => {
        let n = 0;
        for (let i = frames.length - 1; i > 0 && frames[i]!.hash === frames[i - 1]!.hash; i -= 1) n += 1;
        return n;
      };
      await idle(lead);
      for (let n = 0; n < Math.round(2000 / FRAME_MS) && stillFor() < restFrames; n += 1) await shoot(null);
      for (const stroke of job.strokes) {
        const key = JSON.stringify(stroke.aim);
        let p: Point | null = resolved.get(key) ?? null;
        if (!p) p = await page.evaluate(pointOf, { aim: stroke.aim, caseId, scroll: false });
        if (!p) throw new Error(`nothing matches ${stroke.aim.selector}${stroke.aim.text ? ` "${stroke.aim.text}"` : ''} when the stroke starts`);
        resolved.set(key, p);
        const plan = planStroke(stroke);
        const delta = stroke.path ? pathDelta(stroke.path, 'towards' in stroke.path ? await page.evaluate(directionOf, stroke.path.towards) : null) : { dx: 0, dy: 0 };
        const start: Point = p;
        finger = start;
        downAt = frames.length;
        await shoot('down', () => touchDown(cdp, start));
        for (let i = 1; i < plan.holdFrames; i += 1) await shoot(null);
        for (let i = 1; i <= plan.moveFrames; i += 1) {
          const at: Point = { x: start.x + (delta.dx * i) / plan.moveFrames, y: start.y + (delta.dy * i) / plan.moveFrames };
          finger = at;
          await shoot(null, () => touchMove(cdp, at));
        }
        for (let i = 0; i < plan.restFrames; i += 1) await shoot(null);
        finger = null;
        upAt = frames.length;
        await shoot('up', () => touchUp(cdp));
        await idle(plan.pauseFrames);
      }
      // Run on until the screen has been still for quietMs, or tailMaxMs at most.
      const quiet = Math.round((job.quietMs ?? 500) / FRAME_MS);
      const max = Math.round((job.tailMaxMs ?? 3000) / FRAME_MS);
      let still = 0;
      for (let i = frames.length - 1; i > 0 && frames[i]!.hash === frames[i - 1]!.hash; i -= 1) still += 1;
      for (let n = 0; n < max && still < quiet; n += 1) {
        await shoot(null);
        const l = frames.length - 1;
        still = frames[l]!.hash === frames[l - 1]!.hash ? still + 1 : 0;
      }
      await framed.drain();
    } finally {
      await cdp.detach().catch(() => undefined);
    }
    return { frames, dir: job.dir, viewport: { width: viewport.width, height: viewport.height }, detected };
  } finally {
    await context.close().catch(() => undefined);
  }
}
