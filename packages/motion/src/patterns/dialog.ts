// dialog: the panel rises a few px and scales up from 98% as it fades in;
// exit plays it backward on the exit ease. The values of Dialog.css
// (pattern "dialog"). The backdrop plays the reduced form. Reduced: a fade.
import { byPhase, definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, scaleValue, spacePx } from '../tokens';
import { scale, space } from './values';

export const dialog = definePattern<MotionInput>({
  id: 'dialog',
  tokens: ['duration.base', 'ease.out', 'ease.exit', 'scale.dialog-enter', 'space.2xs'],
  spec: ({ phase }) => ({
    keyframes: byPhase(phase, [
      { transform: `translateY(${space('space.2xs')}) scale(${scale('scale.dialog-enter')})`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ]),
    duration: 'duration.base',
    easing: phase === 'exit' ? 'ease.exit' : 'ease.out',
    fill: phase === 'exit' ? 'forwards' : 'none',
    origin: '50% 50%',
  }),
  reduced: ({ phase }) => fadeSpec(phase),
  native: {
    duration: durationMs['duration.base'],
    easing: easeBezier['ease.out'],
    exitEasing: easeBezier['ease.exit'],
    reducedDuration: durationMs['duration.base'],
    fromScale: scaleValue['scale.dialog-enter'],
    translateY: spacePx['space.2xs'],
  },
});
