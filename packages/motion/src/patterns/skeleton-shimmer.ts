// skeleton-shimmer: a highlight layer inside a skeleton block travels across
// it in the reading direction. It stops before five seconds, so it needs no
// pause control (WCAG 2.2.2): SHIMMER_ITERATIONS (3, 4.2s) at the base token,
// and on the web the count is computed from the live token, so a style that
// slows the shimmer plays fewer loops.
// Swap the skeleton for content as soon as it is ready. Reduced: no motion,
// the block stays still.
import { definePattern, LOOP_LIMIT_MS, loopsWithin, stillSpec, type MotionInput } from '../core';
import { durationMs } from '../tokens';

/** 3 loops of duration.shimmer (1.4s) is 4.2s: under the five second limit. */
export const SHIMMER_ITERATIONS = loopsWithin(durationMs['duration.shimmer']);

export const skeletonShimmer = definePattern<MotionInput>({
  id: 'skeleton-shimmer',
  tokens: ['duration.shimmer'],
  spec: ({ dir }) => {
    const sign = dir === 'rtl' ? -1 : 1;
    return {
      keyframes: [{ transform: `translateX(${-100 * sign}%)` }, { transform: `translateX(${100 * sign}%)` }],
      duration: 'duration.shimmer',
      easing: 'linear',
      fill: 'none',
      origin: '50% 50%',
      iterations: SHIMMER_ITERATIONS,
      loopLimitMs: LOOP_LIMIT_MS,
    };
  },
  reduced: () => stillSpec('duration.shimmer'),
  native: {
    duration: durationMs['duration.shimmer'],
    easing: [0, 0, 1, 1],
    reducedDuration: 0,
    iterations: SHIMMER_ITERATIONS,
  },
});
