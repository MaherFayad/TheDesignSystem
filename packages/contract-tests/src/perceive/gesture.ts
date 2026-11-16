// Real touch gestures through the Chrome DevTools Protocol, the way the
// motion audit drove them: a tap is touch start, a hold of 90ms, touch end;
// a long press holds 900ms; a drag is a series of moves 16ms apart. The
// browser turns them into touch, pointer and (for a tap) emulated mouse
// events, as a phone does. `holdPointer` keeps the finger down for as long as
// a caller asks, so a press state can be read while it is held; the compare
// runner can use it for the press steps it lacks.
import type { CDPSession, Page } from '@playwright/test';

export interface Point {
  x: number;
  y: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A CDP session for touch on this page. */
export async function touchSession(page: Page): Promise<CDPSession> {
  return page.context().newCDPSession(page);
}

export async function touchDown(cdp: CDPSession, p: Point): Promise<void> {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, radiusX: 4, radiusY: 4, force: 1, id: 1 }] });
}

export async function touchMove(cdp: CDPSession, p: Point): Promise<void> {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: p.y, radiusX: 4, radiusY: 4, force: 1, id: 1 }] });
}

export async function touchUp(cdp: CDPSession): Promise<void> {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

/**
 * Puts a finger down at a point, keeps it there for `ms`, runs `whileHeld`
 * (if given) before lifting, then lifts. Returns what `whileHeld` returned.
 * `landed`, when given, waits until the page has seen the finger and returns
 * how many ms ago that was, so the hold is timed from the page's
 * `pointerdown` and not from the moment the event was sent (under load the
 * page can see it late, which would shorten the hold).
 */
export async function holdPointer<T = void>(cdp: CDPSession, p: Point, ms: number, whileHeld?: () => Promise<T>, landed?: () => Promise<number>): Promise<T | undefined> {
  const started = Date.now();
  await touchDown(cdp, p);
  let left = ms - (Date.now() - started);
  if (landed) {
    const ago = await landed().catch(() => null);
    if (ago !== null) left = ms - ago;
  }
  if (left > 0) await sleep(left);
  const out = whileHeld ? await whileHeld() : undefined;
  await touchUp(cdp);
  return out;
}

/** A tap: down, `holdMs` (90 by default), up. */
export async function tap(cdp: CDPSession, p: Point, holdMs = 90): Promise<void> {
  await holdPointer(cdp, p, holdMs);
}

/** A drag along x: down, `steps` moves of `step` px each, 16ms apart, up. */
export async function drag(cdp: CDPSession, p: Point, step: number, steps = 15): Promise<void> {
  await touchDown(cdp, p);
  for (let i = 1; i <= steps; i += 1) {
    await sleep(16);
    await touchMove(cdp, { x: p.x + step * i, y: p.y });
  }
  await sleep(16);
  await touchUp(cdp);
}
