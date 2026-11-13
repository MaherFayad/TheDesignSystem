// progress-celebrate (orders 1.22 and 1.23): the completion beat of
// ProgressBar and ProgressCircle. One copy for both frameworks (order 1.29):
// React's useCelebrate (packages/react/src/components/ProgressBar/
// ProgressBar.tsx) and Angular's components keep a Celebrate and call
// `update` after each render.
import { play, type PatternMode } from '../core';
import { popMark } from './digit-roller';

/**
 * progress-celebrate: the completion beat of one element. `update`
 * pops the element once each time `done` turns true after the first call,
 * and (round 3) sends out one halo from the element, or from its descendant
 * that `halo` selects (ProgressCircle: its indicator).
 */
export class Celebrate {
  private was: boolean | undefined;

  update(el: Element | null | undefined, done: boolean, mode: PatternMode, axis: 'both' | 'block' = 'block', halo?: string): Animation | null {
    const before = this.was ?? done;
    this.was = done;
    if (!done || before) return null;
    const pop = popMark(el, mode, axis);
    const ring = halo ? el?.querySelector(halo) : el;
    haloBurst(ring, mode);
    return pop;
  }
}

/**
 * Round 3: the completion beat's halo. A box-shadow ring in the fill color
 * grows from the element by distance.shift and fades, once, over
 * duration.celebrate on ease.out. Full mode only.
 */
export function haloBurst(el: Element | null | undefined, mode: PatternMode): Animation | null {
  if (!el || mode !== 'full') return null;
  return play(
    el,
    {
      keyframes: [
        { boxShadow: '0 0 0 0 var(--_progress-bar-fill, var(--_progress-circle-fill))' },
        { boxShadow: '0 0 0 var(--ds-distance-shift) transparent' },
      ],
      duration: 'duration.celebrate',
      easing: 'ease.out',
      fill: 'none',
      origin: '50% 50%',
    },
    'progress-halo',
  );
}
