// tab-indicator: the selected mark of tabs or a segmented control slides
// from the old item to the new one. A FLIP: move the indicator to its new
// frame first, then play from `from` (the old frame) to `to` (the new one).
// Rects are measured, so RTL needs nothing. Reduced: no motion, it jumps.
import { between, definePattern, stillSpec, usableRect, type MotionInput, type MotionRect } from '../core';
import { durationMs, easeBezier } from '../tokens';

export interface TabIndicatorInput extends MotionInput {
  from?: MotionRect | null;
  to?: MotionRect | null;
}

export const tabIndicator = definePattern<TabIndicatorInput>({
  id: 'tab-indicator',
  tokens: ['duration.medium', 'ease.standard'],
  spec: ({ from, to }) => ({
    keyframes: usableRect(from) && usableRect(to) ? [{ transform: between(from, to) }, { transform: 'none' }] : [],
    duration: 'duration.medium',
    easing: 'ease.standard',
    fill: 'none',
    origin: '0 0',
  }),
  reduced: () => stillSpec('duration.medium'),
  native: {
    duration: durationMs['duration.medium'],
    easing: easeBezier['ease.standard'],
    reducedDuration: 0,
  },
});
