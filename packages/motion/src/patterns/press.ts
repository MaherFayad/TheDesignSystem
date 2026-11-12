// press: the pressed feedback of a control. `enter` plays on pointer down or
// Space and Enter down: the control scales to scale.press (97%) from its
// center and holds there. `exit` plays on release and returns it to rest.
// The pressed color is a state of the component, not part of the pattern.
// A quick release while the press still plays starts from where the press
// is (the web helper reads the live frame). Native settles with spring.press
// instead of a timed curve. Reduced: no motion, the color change carries the
// state.
import { byPhase, definePattern, stillSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, scaleValue, springValue } from '../tokens';
import { scale } from './values';

export const press = definePattern<MotionInput>({
  id: 'press',
  tokens: ['duration.instant', 'ease.out', 'scale.press', 'spring.press'],
  spec: ({ phase }) => ({
    keyframes: byPhase(phase, [{ transform: 'none' }, { transform: `scale(${scale('scale.press')})` }]),
    duration: 'duration.instant',
    easing: 'ease.out',
    fill: phase === 'exit' ? 'none' : 'forwards',
    origin: '50% 50%',
  }),
  reduced: () => stillSpec('duration.instant'),
  native: {
    duration: durationMs['duration.instant'],
    easing: easeBezier['ease.out'],
    reducedDuration: 0,
    pressedScale: scaleValue['scale.press'],
    spring: springValue['spring.press'],
  },
});
