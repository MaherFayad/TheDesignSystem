// streaming-text: each chunk of text that streams in fades in where it
// lands. Opacity only: text never moves under the reader. Wrap each chunk,
// not each letter, and stop wrapping once the stream ends. Reduced: no
// motion, the text appears.
import { definePattern, stillSpec, type MotionInput } from '../core';
import { durationMs, easeBezier } from '../tokens';

export const streamingText = definePattern<MotionInput>({
  id: 'streaming-text',
  tokens: ['duration.base', 'ease.out'],
  spec: () => ({
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    duration: 'duration.base',
    easing: 'ease.out',
    fill: 'none',
    origin: '50% 50%',
  }),
  reduced: () => stillSpec('duration.base'),
  native: {
    duration: durationMs['duration.base'],
    easing: easeBezier['ease.out'],
    reducedDuration: 0,
  },
});
