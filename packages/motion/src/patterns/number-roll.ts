// number-roll: the new value of a number rolls in from below when it goes
// up and from above when it goes down, while the old value rolls out the
// other way (phase `exit`). Play it on a clip with overflow hidden, one per
// changed digit or one for the whole value. Reduced: a fade.
import { definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier } from '../tokens';

export interface NumberRollInput extends MotionInput {
  /** `up` when the value grew. Default `up`. */
  direction?: 'up' | 'down';
}

export const numberRoll = definePattern<NumberRollInput>({
  id: 'number-roll',
  tokens: ['duration.roll', 'duration.base', 'ease.emphasized', 'ease.out', 'ease.exit'],
  spec: ({ phase, direction = 'up' }) => {
    const sign = direction === 'up' ? 1 : -1;
    return phase === 'exit'
      ? {
          keyframes: [
            { transform: 'none', opacity: 1 },
            { transform: `translateY(${-100 * sign}%)`, opacity: 0 },
          ],
          duration: 'duration.roll',
          easing: 'ease.emphasized',
          fill: 'forwards',
          origin: '50% 50%',
        }
      : {
          keyframes: [
            { transform: `translateY(${100 * sign}%)`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          duration: 'duration.roll',
          easing: 'ease.emphasized',
          fill: 'none',
          origin: '50% 50%',
        };
  },
  reduced: ({ phase }) => fadeSpec(phase),
  native: {
    duration: durationMs['duration.roll'],
    easing: easeBezier['ease.emphasized'],
    reducedDuration: durationMs['duration.base'],
  },
});
