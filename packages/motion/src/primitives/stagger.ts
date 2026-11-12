// Staggered group (order 1.22): the parts of one change start one stagger
// step apart (`delay.stagger`), capped at six steps, so a title, a body and
// the actions of an overlay, or the rows of a menu, arrive in reading order.
//
// - Enter: each part rises by `distance.enter` (or comes in from the inline
//   start by `distance.shift` with `from: 'inline'`, or grows from
//   `scale.enter` with `from: 'scale'`) and fades in on the soft spring.
// - Exit: every part leaves at once, faster than it came (duration.quick on
//   ease.exit), and holds its last frame until the caller removes it. Exits
//   never stagger: the person asked for it to go.
// - The content is in the DOM and the accessibility tree from the first
//   frame; only its look arrives in order. A delayed part waits hidden
//   (fill backwards), at most six steps. Studio sets the step to 0ms, so its parts land
//   together.
// - Reduced: a fade with no delay. Mode `none`: nothing.
import { readDir } from '../core';
import { distanceVar, fadeOnly, negDistanceVar, played, resolveMode, run, scaleVar, spec, springTiming, STAGGER_DELAY, STAGGER_MAX_STEPS, type PrimitiveOptions, type MotionSpring } from './shared';

/** The id of every animation a staggered group starts. */
export const STAGGER_ID = 'stagger';

export interface StaggerOptions extends PrimitiveOptions {
  phase?: 'enter' | 'exit';
  /** How each part arrives. Default `block` (rises from below). */
  from?: 'block' | 'inline' | 'scale';
  /** The spring of each part. Default `soft`. */
  spring?: MotionSpring;
  /** The most steps. Default 6. */
  maxSteps?: number;
  /** Steps to wait before the first part, for a group that follows its container. Default 0. */
  offset?: number;
}

/** The step of the part at index `i`: the offset plus the index, capped. */
export function staggerStep(i: number, opts: Pick<StaggerOptions, 'maxSteps' | 'offset'> = {}): number {
  return Math.min((opts.offset ?? 0) + i, opts.maxSteps ?? STAGGER_MAX_STEPS);
}

function enterFrom(from: StaggerOptions['from'], el: Element, prefix: string): string {
  if (from === 'scale') return `scale(${scaleVar('scale.enter', prefix)})`;
  if (from === 'inline') return `translateX(${readDir(el) === 'rtl' ? distanceVar('distance.shift', prefix) : negDistanceVar('distance.shift', prefix)})`;
  return `translateY(${distanceVar('distance.enter', prefix)})`;
}

/** Plays the group. Returns the animations it started. */
export function staggerGroup(parts: Iterable<Element | null | undefined>, opts: StaggerOptions = {}): Animation[] {
  const mode = resolveMode(opts);
  if (mode === 'none') return [];
  const prefix = opts.prefix ?? 'ds';
  const list = [...parts].filter((el): el is Element => Boolean(el));
  if (opts.phase === 'exit') {
    return played(
      list.map((el) =>
        run(
          el,
          mode === 'reduced'
            ? fadeOnly('exit', { fill: 'forwards' })
            : spec(
                [
                  { transform: 'none', opacity: 1 },
                  { transform: `translateY(${negDistanceVar('distance.shift', prefix)})`, opacity: 0 },
                ],
                { duration: 'duration.quick', easing: 'ease.exit' },
                { fill: 'forwards' },
              ),
          STAGGER_ID,
          prefix,
        ),
      ),
    );
  }
  return played(
    list.map((el, i) => {
      const step = staggerStep(i, opts);
      const delay = mode === 'full' && step > 0 ? { delay: STAGGER_DELAY, delaySteps: step } : {};
      const s =
        mode === 'reduced'
          ? fadeOnly('enter')
          : spec(
              [
                { transform: enterFrom(opts.from, el, prefix), opacity: 0 },
                { transform: 'none', opacity: 1 },
              ],
              springTiming(opts.spring ?? 'soft'),
              { ...delay, fill: step > 0 ? 'backwards' : 'none' },
            );
      return run(el, s, STAGGER_ID, prefix);
    }),
  );
}
