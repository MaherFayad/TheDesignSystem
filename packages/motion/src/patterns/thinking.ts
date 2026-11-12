// thinking: the three dots of an assistant that is working. Each dot lifts
// and brightens in turn (`index` 0 to 2 sets its offset in the loop). One
// cycle is duration.shimmer (1.4s), well under three flashes a second. It
// loops while the work runs and stops the moment the first text arrives.
// Announce the state in text. Reduced: no motion, the dots stay still.
import { definePattern, stillSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, spacePx } from '../tokens';
import { negSpace } from './values';

export interface ThinkingInput extends MotionInput {
  /** The dot, from 0. */
  index?: number;
}

/** The share of one cycle between two dots. */
export const THINKING_DOT_STEP = 0.2;

export const thinking = definePattern<ThinkingInput>({
  id: 'thinking',
  tokens: ['duration.shimmer', 'ease.default', 'space.4xs'],
  spec: ({ index = 0 }) => {
    const peak = Math.min(0.2 + Math.max(0, index) * THINKING_DOT_STEP, 0.8);
    return {
      keyframes: [
        { transform: 'none', opacity: 0.4 },
        { transform: `translateY(${negSpace('space.4xs')})`, opacity: 1, offset: peak },
        { transform: 'none', opacity: 0.4 },
      ],
      duration: 'duration.shimmer',
      easing: 'ease.default',
      fill: 'none',
      origin: '50% 50%',
      iterations: Infinity,
    };
  },
  reduced: () => stillSpec('duration.shimmer'),
  native: {
    duration: durationMs['duration.shimmer'],
    easing: easeBezier['ease.default'],
    reducedDuration: 0,
    liftY: spacePx['space.4xs'],
    dotStep: THINKING_DOT_STEP,
  },
});
