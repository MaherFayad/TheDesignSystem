// spinner: one full turn per duration.spin, linear, for as long as the work
// runs. Pair it with a text label for assistive tech. Reduced: no motion, the
// icon stays still and the label carries the state.
//
// Pausing (WCAG 2.2.2). The spinner loops until the work ends. That is
// allowed without a pause control only under the essential exception: the
// spinner is the one sign that work is running, and nothing else on the page
// can be used while it turns (a blocking load, a submit that holds the
// form). In every other case, for example a spinner in a list row while the
// rest of the page stays usable, give the person a pause control and call
// `pauseLoops(root)` and `resumeLoops(root)` from core, or pause the returned
// Animation. Stop and remove the spinner the moment the work ends.
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
    easing: [0, 0, 1, 1],
    reducedDuration: 0,
    iterations: -1,
  },
});
