// chart-draw: a series appears by scaling its group in from the start of the
// value axis: `inline` for lines and bars that run along the reading
// direction (from the inline start, so it flips in RTL), `block` for columns
// (from the baseline). Never animate stroke-dashoffset or a path. Reduced: a
// fade.
import { definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier } from '../tokens';

export interface ChartDrawInput extends MotionInput {
  /** The axis the series grows along. Default `inline`. */
  axis?: 'inline' | 'block';
}

export const chartDraw = definePattern<ChartDrawInput>({
  id: 'chart-draw',
  tokens: ['duration.reveal', 'duration.base', 'ease.reveal', 'ease.out'],
  spec: ({ axis = 'inline', dir }) => ({
    keyframes: [
      { transform: axis === 'block' ? 'scaleY(0)' : 'scaleX(0)', opacity: 0 },
      { opacity: 1, offset: 0.2 },
      { transform: 'none', opacity: 1 },
    ],
    duration: 'duration.reveal',
    easing: 'ease.reveal',
    fill: 'none',
    origin: axis === 'block' ? '50% 100%' : dir === 'rtl' ? '100% 50%' : '0 50%',
  }),
  reduced: () => fadeSpec('enter'),
  native: {
    duration: durationMs['duration.reveal'],
    easing: easeBezier['ease.reveal'],
    reducedDuration: durationMs['duration.base'],
  },
});
