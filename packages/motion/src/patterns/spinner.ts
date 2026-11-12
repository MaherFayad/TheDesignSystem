// spinner: one full turn per duration.spin, linear, for as long as the work
// runs. A spinner is the activity indicator itself, so it loops; pair it
// with a text label for assistive tech. Reduced: no motion, the icon stays
// still and the label carries the state.
import { definePattern, stillSpec, type MotionInput } from '../core';
import { durationMs } from '../tokens';

export const spinner = definePattern<MotionInput>({
  id: 'spinner',
  tokens: ['duration.spin'],
  spec: () => ({
    keyframes: [{ transform: 'rotate(0turn)' }, { transform: 'rotate(1turn)' }],
    duration: 'duration.spin',
    easing: 'linear',
    fill: 'none',
    origin: '50% 50%',
    iterations: Infinity,
  }),
  reduced: () => stillSpec('duration.spin'),
  native: {
    duration: durationMs['duration.spin'],
    easing: 'linear',
    reducedDuration: 0,
    iterations: Infinity,
  },
});
