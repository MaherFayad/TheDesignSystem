// toast: a toast travels in from its edge (`edge`: the toaster sits at the
// top or the bottom) a few px and scales up from 98% as it fades in. Exit
// fades and shrinks in place. The values of Toast.css. Reduced: a fade.
import { definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, scaleValue, spacePx } from '../tokens';
import { negSpace, scale, space } from './values';

export interface ToastInput extends MotionInput {
  /** The edge the toaster sits on. Default `bottom`. */
  edge?: 'top' | 'bottom';
}

export const toast = definePattern<ToastInput>({
  id: 'toast',
  tokens: ['duration.toast-enter', 'duration.toast-exit', 'ease.out', 'ease.exit', 'scale.dialog-enter', 'space.xs'],
  spec: ({ phase, edge = 'bottom' }) =>
    phase === 'exit'
      ? {
          keyframes: [
            { transform: 'none', opacity: 1 },
            { transform: `scale(${scale('scale.dialog-enter')})`, opacity: 0 },
          ],
          duration: 'duration.toast-exit',
          easing: 'ease.exit',
          fill: 'forwards',
          origin: '50% 50%',
        }
      : {
          keyframes: [
            { transform: `translateY(${edge === 'top' ? negSpace('space.xs') : space('space.xs')}) scale(${scale('scale.dialog-enter')})`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          duration: 'duration.toast-enter',
          easing: 'ease.out',
          fill: 'none',
          origin: '50% 50%',
        },
  reduced: ({ phase }) => fadeSpec(phase, phase === 'exit' ? 'duration.toast-exit' : 'duration.toast-enter'),
  native: {
    duration: durationMs['duration.toast-enter'],
    exitDuration: durationMs['duration.toast-exit'],
    easing: easeBezier['ease.out'],
    reducedDuration: durationMs['duration.toast-enter'],
    fromScale: scaleValue['scale.dialog-enter'],
    translateY: spacePx['space.xs'],
  },
});
