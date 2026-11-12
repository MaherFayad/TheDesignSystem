// drag-drop: `lift` raises a picked item a few px as the drag starts; `drop`
// settles it from where it was let go (`from`) into its slot (`to`), a FLIP.
// The item never waits on the drop to commit: the list is already in its new
// order when the settle plays. Native settles on spring.merge. Reduced: no
// motion.
import { between, definePattern, stillSpec, usableRect, type MotionInput, type MotionRect } from '../core';
import { durationMs, easeBezier, spacePx, springValue } from '../tokens';
import { negSpace } from './values';

export interface DragDropInput extends MotionInput {
  /** `lift` when the drag starts, `drop` when the item settles. Default `drop`. */
  step?: 'lift' | 'drop';
  /** Where the item was let go (drop). */
  from?: MotionRect | null;
  /** The slot it settles in (drop). */
  to?: MotionRect | null;
}

export const dragDrop = definePattern<DragDropInput>({
  id: 'drag-drop',
  tokens: ['duration.quick', 'duration.slow', 'ease.out', 'ease.emphasized', 'space.4xs', 'spring.merge'],
  spec: ({ step = 'drop', from, to }) => {
    if (step === 'lift') {
      return {
        keyframes: [{ transform: 'none' }, { transform: `translateY(${negSpace('space.4xs')})` }],
        duration: 'duration.quick',
        easing: 'ease.out',
        fill: 'forwards',
        origin: '50% 50%',
      };
    }
    return {
      keyframes: usableRect(from) && usableRect(to) ? [{ transform: between(from, to) }, { transform: 'none' }] : [],
      duration: 'duration.slow',
      easing: 'ease.emphasized',
      fill: 'none',
      origin: '0 0',
    };
  },
  reduced: () => stillSpec('duration.slow'),
  native: {
    duration: durationMs['duration.slow'],
    liftDuration: durationMs['duration.quick'],
    easing: easeBezier['ease.emphasized'],
    reducedDuration: 0,
    liftY: spacePx['space.4xs'],
    spring: springValue['spring.merge'],
  },
});
