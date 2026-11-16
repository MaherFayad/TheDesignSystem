// Frame exact capture. A screencast in headless Chromium gives 15 to 30
// frames a second, fewer under load, so a 158ms switch would show in two or
// three frames. Instead the page runs on a clock this file drives: Chromium's
// headless shell with begin frame control draws a frame only when asked, and
// virtual time moves the page's clock (timers, `performance.now`, event
// times and the animation timeline) by exactly 1000/60 ms before each frame.
// Every frame of the clip is therefore one 60th of a second of the page's own
// time, whatever the load on the machine, and the clip plays back at real
// speed. The cost: a long task on the page takes no page time here, so jank
// and dropped frames cannot show (the device check covers those).
//
// Touch goes through the perception gate's CDP helpers (../perceive/gesture.ts).
// With begin frame control a touch event is only acknowledged once a frame is
// drawn, so the dispatch is started, a frame is drawn, and then the dispatch
// is awaited for a moment; one that needs more frames is collected at the end.
import { createHash } from 'node:crypto';
import type { Browser, BrowserContext, BrowserContextOptions, CDPSession, Page } from '@playwright/test';

/** Launch flags for frame exact capture (the deterministic mode of the headless shell). */
export const FRAME_ARGS = [
  '--deterministic-mode',
  '--enable-begin-frame-control',
  '--disable-new-content-rendering-timeout',
  '--run-all-compositor-stages-before-draw',
  '--disable-threaded-animation',
  '--disable-threaded-scrolling',
  '--disable-checker-imaging',
  '--disable-image-animation-resync',
];

export const FRAME_MS = 1000 / 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function within<T>(what: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    what.finally(() => clearTimeout(timer)),
    new Promise<T>((_, fail) => {
      timer = setTimeout(() => fail(new Error(`${label} took longer than ${ms / 1000}s`)), ms);
    }),
  ]);
}

const monotonicMs = (): number => Number(process.hrtime.bigint() / 1000n) / 1000;

/**
 * A page whose frames this side draws. Playwright cannot ask for begin frame
 * control itself, so the target is made through the browser's CDP session in
 * the context's own browser context (found through a marker page), which
 * keeps the context's viewport, user agent, touch and colour scheme.
 */
export class FramedPage {
  readonly page: Page;
  readonly cdp: CDPSession;
  private pumping: Promise<void> | null = null;
  private pumpOn = false;
  private clockPaused = false;
  private ticks = 0;
  private budgetDone: (() => void) | null = null;
  private waiting: Promise<void>[] = [];
  private inputError: Error | null = null;

  private constructor(page: Page, cdp: CDPSession) {
    this.page = page;
    this.cdp = cdp;
    cdp.on('Emulation.virtualTimeBudgetExpired', () => this.budgetDone?.());
  }

  static async open(browser: Browser, options: BrowserContextOptions): Promise<{ context: BrowserContext; framed: FramedPage }> {
    const context = await browser.newContext(options);
    const marker = await context.newPage();
    const tag = `about:blank#ds-record-${Math.random().toString(36).slice(2)}`;
    await marker.goto(tag);
    const bs = await browser.newBrowserCDPSession();
    try {
      const { targetInfos } = (await bs.send('Target.getTargets')) as { targetInfos: { url: string; browserContextId?: string }[] };
      const browserContextId = targetInfos.find((t) => t.url === tag)?.browserContextId;
      if (!browserContextId) throw new Error('could not find the browser context of the recording');
      const opened = context.waitForEvent('page', { timeout: 30_000 });
      await bs.send('Target.createTarget', { url: 'about:blank', browserContextId, enableBeginFrameControl: true } as never);
      const page = await opened;
      await marker.close();
      await page.addInitScript({ content: 'window.__name = (f) => f;' });
      const cdp = await context.newCDPSession(page);
      const framed = new FramedPage(page, cdp);
      framed.startPump();
      return { context, framed };
    } finally {
      await bs.detach().catch(() => undefined);
    }
  }

  private async begin(screenshot: boolean, frameTimeTicks: number): Promise<Buffer | null> {
    const res = (await within(
      this.cdp.send('HeadlessExperimental.beginFrame', { frameTimeTicks, interval: FRAME_MS, ...(screenshot ? { screenshot: { format: 'png' } } : {}) } as never) as Promise<{ screenshotData?: string }>,
      30_000,
      'a frame',
    )) as { screenshotData?: string };
    return res.screenshotData ? Buffer.from(res.screenshotData, 'base64') : null;
  }

  /** Draws frames on the wall clock, so the page loads and runs as usual while it is set up. */
  startPump(): void {
    if (this.pumpOn) return;
    this.pumpOn = true;
    this.pumping = (async () => {
      while (this.pumpOn) {
        await this.begin(false, monotonicMs()).catch(() => undefined);
        await sleep(16);
      }
    })();
  }

  async stopPump(): Promise<void> {
    this.pumpOn = false;
    await this.pumping;
    this.pumping = null;
  }

  /** Stops the wall clock: from here the page's time moves only with `frame`. */
  async pauseClock(): Promise<void> {
    await this.stopPump();
    await this.cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
    this.clockPaused = true;
    this.ticks = monotonicMs();
  }

  /**
   * One frame: starts `input` (a touch dispatch), moves the page's clock by
   * 1000/60 ms, draws the frame, then waits for the input to be acknowledged.
   * Returns the frame as PNG bytes when asked.
   */
  async frame<T>(screenshot: boolean, input?: () => Promise<T>): Promise<Buffer | null> {
    if (!this.clockPaused) throw new Error('pauseClock before drawing frames');
    const pending = input ? input() : null;
    const expired = new Promise<void>((done) => (this.budgetDone = done));
    await this.cdp.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: FRAME_MS });
    await within(expired, 30_000, 'the page clock');
    this.ticks += FRAME_MS;
    const shot = await this.begin(screenshot, this.ticks);
    if (pending) {
      // Most touch events are acknowledged with the frame they land in. A move the page handles with
      // pointer capture can wait for a later frame, so the clip goes on and the ack is collected later.
      const settled = pending.then(
        () => undefined,
        (err: unknown) => {
          this.inputError ??= err instanceof Error ? err : new Error(String(err));
        },
      );
      const acked = await Promise.race([settled.then(() => true), sleep(250).then(() => false)]);
      if (!acked) this.waiting.push(settled);
    }
    if (this.inputError) throw this.inputError;
    return shot;
  }

  /** Waits for every touch event still to be acknowledged; call it after the last frame. */
  async drain(): Promise<void> {
    await within(Promise.all(this.waiting), 30_000, 'the touch events');
    this.waiting = [];
    if (this.inputError) throw this.inputError;
  }

  async evaluate<R, A>(fn: (arg: A) => R | Promise<R>, arg: A): Promise<R> {
    return this.page.evaluate(fn as never, arg) as Promise<R>;
  }
}

export function hashOf(png: Buffer): string {
  return createHash('sha1').update(png).digest('hex').slice(0, 16);
}
