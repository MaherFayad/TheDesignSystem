// swap: one glyph or label gives way to another in the same place, for a
// state that changes in answer to an action: Copy to Copied, Show to Hide.
// `exit` plays on the old content: it rolls out a few px and fades. `enter`
// plays on the new content: it rolls in from the other side and fades in.
// Both run at once, so the new state never waits for the old to leave; the
// action itself has already happened. Direction `up` (default) rolls the new
// content in from below. Reduced: a fade.
import { definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, spacePx } from '../tokens';
import { negSpace, space } from './values';

export interface SwapInput extends MotionInput {
  /** `up` rolls the new content in from below, `down` from above. Default `up`. */
  direction?: 'up' | 'down';
}

export const swap = definePattern<SwapInput>({
  id: 'swap',
  tokens: ['duration.base', 'ease.emphasized', 'ease.exit', 'ease.out', 'space.xs'],
  spec: ({ phase, direction = 'up' }) => {
    const below = space('space.xs');
    const above = negSpace('space.xs');
    const [from, to] = direction === 'up' ? [below, above] : [above, below];
    return phase === 'exit'
      ? {
          keyframes: [
            { transform: 'none', opacity: 1 },
            { transform: `translateY(${to})`, opacity: 0 },
          ],
          duration: 'duration.base',
          easing: 'ease.exit',
          fill: 'forwards',
          origin: '50% 50%',
        }
      : {
          keyframes: [
            { transform: `translateY(${from})`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          duration: 'duration.base',
          easing: 'ease.emphasized',
          fill: 'none',
          origin: '50% 50%',
        };
  },
  reduced: ({ phase }) => fadeSpec(phase),
  native: {
    duration: durationMs['duration.base'],
    easing: easeBezier['ease.emphasized'],
    reducedDuration: durationMs['duration.base'],
    travelY: spacePx['space.xs'],
  },
});
