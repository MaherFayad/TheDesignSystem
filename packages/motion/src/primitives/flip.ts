// FLIP move (order 1.22): items that change place in a list, a stack or a
// grid travel from where they were to where they are now, on a spring.
//
//   const snap = flipSnapshot(items);   // First: before the DOM changes
//   ...change the DOM (React commits)...
//   flipPlay(snap, { items: newItems }); // Last, Invert, Play
//
// - Items in both lists travel from their old box to the new one. The
//   snapshot reads the box as drawn (with any running transform), so a second
//   change while a move still plays starts from where the item is, not from
//   where it was headed.
// - Items only in the new list enter: they rise from `scale.enter` and fade
//   in on the bouncy spring, a stagger step apart (capped).
// - `stretch` adds a squash and stretch along the travel, for a sliding
//   indicator: the moving box grows to `scale.stretch` on the axis of travel
//   halfway and settles.
// - `scale: true` also animates size (a thumbnail that becomes a full view).
//   Without it only position moves, so text never squashes.
// - Exits: an item that leaves is gone from the DOM when the new layout is
//   measured; call `flipExit(el)` before removing it if the component can wait
//   a frame, or let it go at once (the gap closing is the visible answer).
// - Reduced: no travel; entering items fade in. Mode `none`: nothing.
// - Never moves layout: only transform and opacity. The item is at its new
//   place for hit testing from the first frame, so the pointer never chases
//   a target.
import type { MotionRect } from '../core';
import { between, round, usableRect } from '../core';
import { distanceVar, fadeOnly, played, resolveMode, run, scaleVar, spec, springTiming, STAGGER_DELAY, STAGGER_MAX_STEPS, type PrimitiveOptions, type MotionSpring } from './shared';

/** The id of every animation a FLIP move starts. */
export const FLIP_ID = 'flip';

/** Boxes of a set of elements, as drawn, before a change. */
export interface FlipSnapshot {
  rects: Map<Element, MotionRect>;
}

/** The box of an element as drawn now, transforms included. */
export function rectOf(el: Element): MotionRect {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

/** First: measures every element before the DOM changes. */
export function flipSnapshot(elements: Iterable<Element>): FlipSnapshot {
  const rects = new Map<Element, MotionRect>();
  for (const el of elements) rects.set(el, rectOf(el));
  return { rects };
}

export interface FlipOptions extends PrimitiveOptions {
  /** The elements after the change. Default: the snapshot's elements that are still in the document. */
  items?: Iterable<Element>;
  /** The spring of the move. Default `snappy`. */
  spring?: MotionSpring;
  /** Animate size as well as position. Default false. */
  scale?: boolean;
  /** Stretch along the travel axis while moving: `x`, `y` or `auto` (the longer travel). Default none. */
  stretch?: 'x' | 'y' | 'auto';
  /** How a new element enters: `pop` (scale and fade on the bouncy spring), `fade`, or `none`. Default `pop`. */
  enter?: 'pop' | 'fade' | 'none';
  /** Stagger the entering elements. Default true. */
  stagger?: boolean;
}

/** The transform that draws an element at `last` over its old box `first`. */
export function invert(first: MotionRect, last: MotionRect, withScale: boolean): string | null {
  const dx = round(first.x - last.x);
  const dy = round(first.y - last.y);
  if (withScale && usableRect(first) && usableRect(last)) {
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(first.width - last.width) < 0.5 && Math.abs(first.height - last.height) < 0.5) return null;
    return between(first, last);
  }
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;
  return `translate(${dx}px, ${dy}px)`;
}

/** Keyframes for one move, with an optional stretch at the middle of the travel. */
export function moveFrames(from: string, stretch: 'x' | 'y' | null, prefix = 'ds'): Keyframe[] {
  if (!stretch) return [{ transform: from }, { transform: 'none' }];
  const s = scaleVar('scale.stretch', prefix);
  const mid = stretch === 'x' ? `scale(${s}, 1)` : `scale(1, ${s})`;
  return [{ transform: from, offset: 0 }, { transform: mid, offset: 0.45 }, { transform: 'none', offset: 1 }];
}

/** Last, Invert, Play. Returns the animations it started. */
export function flipPlay(snap: FlipSnapshot, opts: FlipOptions = {}): Animation[] {
  const mode = resolveMode(opts);
  const prefix = opts.prefix ?? 'ds';
  const items = [...(opts.items ?? [...snap.rects.keys()].filter((el) => el.isConnected))];
  if (mode === 'none') return [];
  // Cancel moves still in flight so the new layout is measured at rest.
  for (const el of items) cancelFlip(el);
  const out: (Animation | null)[] = [];
  let entering = 0;
  for (const el of items) {
    const first = snap.rects.get(el);
    if (!first) {
      const step = opts.stagger === false ? 0 : Math.min(entering, STAGGER_MAX_STEPS);
      entering += 1;
      out.push(run(el, enterSpec(mode, opts.enter ?? 'pop', step, prefix), FLIP_ID, prefix));
      continue;
    }
    if (mode === 'reduced') continue;
    const last = rectOf(el);
    const from = invert(first, last, opts.scale ?? false);
    if (!from) continue;
    const axis = opts.stretch === 'auto' ? (Math.abs(first.x - last.x) >= Math.abs(first.y - last.y) ? 'x' : 'y') : (opts.stretch ?? null);
    const origin = opts.scale ? '0 0' : '50% 50%';
    out.push(run(el, spec(moveFrames(from, axis, prefix), springTiming(opts.spring ?? 'snappy'), { origin }), FLIP_ID, prefix));
  }
  return played(out);
}

function enterSpec(mode: 'full' | 'reduced', enter: 'pop' | 'fade' | 'none', step: number, prefix: string) {
  if (enter === 'none') return null;
  const delay = step > 0 ? { delay: STAGGER_DELAY, delaySteps: step } : {};
  if (mode === 'reduced' || enter === 'fade') return fadeOnly('enter', delay);
  return spec(
    [
      { transform: `translateY(${distanceVar('distance.shift', prefix)}) scale(${scaleVar('scale.enter', prefix)})`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ],
    springTiming('bouncy'),
    delay,
  );
}

/** Cancels a FLIP move on an element, so it sits at its real place. */
export function cancelFlip(el: Element): void {
  if (typeof el.getAnimations !== 'function') return;
  for (const a of el.getAnimations()) if (String(a.id) === `ds-motion:${FLIP_ID}`) a.cancel();
}

/**
 * An item on its way out: it shrinks to `scale.enter` and fades on a quick
 * exit curve, holding its last frame until the caller removes it. Faster
 * than an entrance. Reduced: a fade. The caller never waits for it to end
 * before changing state; it may remove the element at any time.
 */
export function flipExit(el: Element, opts: PrimitiveOptions = {}): Animation | null {
  const mode = resolveMode(opts);
  if (mode === 'none') return null;
  const prefix = opts.prefix ?? 'ds';
  const s =
    mode === 'reduced'
      ? fadeOnly('exit', { fill: 'forwards' })
      : spec(
          [
            { transform: 'none', opacity: 1 },
            { transform: `scale(${scaleVar('scale.enter', prefix)})`, opacity: 0 },
          ],
          { duration: 'duration.quick', easing: 'ease.exit' },
          { fill: 'forwards' },
        );
  return run(el, s, `${FLIP_ID}-exit`, prefix);
}

