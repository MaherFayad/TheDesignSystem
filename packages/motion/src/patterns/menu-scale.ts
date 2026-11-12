// menu-scale: a menu, popover or select list scales up from its trigger side
// (`origin`, Radix gives it as --radix-*-content-transform-origin) while it
// fades in. Exit is shorter and on the exit ease. Reduced: a fade.
import { byPhase, definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, scaleValue } from '../tokens';
import { scale } from './values';

export interface MenuScaleInput extends MotionInput {
  /** The transform origin, the side of the trigger. Default top center. */
  origin?: string;
}

export const menuScale = definePattern<MenuScaleInput>({
  id: 'menu-scale',
  tokens: ['duration.base', 'duration.quick', 'ease.emphasized', 'ease.exit', 'ease.out', 'scale.press'],
  spec: ({ phase, origin = '50% 0' }) => ({
    keyframes: byPhase(phase, [
      { transform: `scale(${scale('scale.press')})`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ]),
    duration: phase === 'exit' ? 'duration.quick' : 'duration.base',
    easing: phase === 'exit' ? 'ease.exit' : 'ease.emphasized',
    fill: phase === 'exit' ? 'forwards' : 'none',
    origin,
  }),
  reduced: ({ phase }) => fadeSpec(phase, phase === 'exit' ? 'duration.quick' : 'duration.base'),
  native: {
    duration: durationMs['duration.base'],
    exitDuration: durationMs['duration.quick'],
    easing: easeBezier['ease.emphasized'],
    reducedDuration: durationMs['duration.base'],
    fromScale: scaleValue['scale.press'],
  },
});
