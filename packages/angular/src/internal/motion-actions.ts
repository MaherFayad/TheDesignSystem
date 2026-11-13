// Motion helpers of the actions family that React keeps in a component file.
// Framework free: copied from packages/react/src/components/ToggleButton/
// ToggleButton.tsx so both frameworks play the same spec. A lead change
// would move it into packages/motion.
import { cssToken, scaleValue, type MotionSpec } from '@the-system/motion';

/** The parts of a ToggleButton that pop, in the order they land. */
export const TOGGLE_POP_PARTS = ':scope > :is([data-part="icon"], [data-part="start"], [data-part="label"], [data-part="end"])';

/** The way the content of a ToggleButton lands: a pop past rest when on, a small sink when off. */
export function toggleLandSpec(on: boolean, step: number): MotionSpec {
  const delay = step > 0 ? { delay: 'delay.stagger' as const, delaySteps: Math.min(step, 6) } : {};
  if (on) {
    return {
      keyframes: [{ transform: 'none' }, { transform: `scale(${cssToken('scale.pop', scaleValue['scale.pop'])})`, offset: 0.4 }, { transform: 'none' }],
      duration: 'duration.celebrate',
      easing: 'ease.out',
      fill: 'backwards',
      origin: '50% 50%',
      ...delay,
    };
  }
  return {
    keyframes: [{ transform: `scale(${cssToken('scale.anticipate', scaleValue['scale.anticipate'])})` }, { transform: 'none' }],
    duration: 'duration.spring-soft',
    easing: 'ease.spring-soft',
    fill: 'backwards',
    origin: '50% 50%',
    ...delay,
  };
}
