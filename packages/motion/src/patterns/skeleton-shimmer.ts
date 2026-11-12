// skeleton-shimmer: a highlight layer inside a skeleton block travels across
// it in the reading direction. It loops SHIMMER_ITERATIONS times (4.2s), so
// it stops before five seconds and needs no pause control (WCAG 2.2.2).
// Swap the skeleton for content as soon as it is ready. Reduced: no motion,
// the block stays still.
import { definePattern, stillSpec, type MotionInput } from '../core';
import { durationMs } from '../tokens';

/** 3 loops of duration.shimmer (1.4s) is 4.2s: under the five second limit. */
export const SHIMMER_ITERATIONS = 3;

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
    };
  },
  reduced: () => stillSpec('duration.shimmer'),
  native: {
    duration: durationMs['duration.shimmer'],
    easing: 'linear',
    reducedDuration: 0,
    iterations: SHIMMER_ITERATIONS,
  },
});
