// pop: a small mark or glyph lands in its place. It scales up from about
// 94% (scale.press twice) to full size while it fades in, on the
// emphasized curve, which settles fast and never overshoots on the web. For
// a character that fills an OTP cell, a star that a rating fills, a check
// that lands in a box. Exit plays it backward and holds the last frame.
// Native settles on spring.press. Reduced: a fade.
import { byPhase, definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, scaleValue, springValue } from '../tokens';
import { scale } from './values';

export interface PopInput extends MotionInput {
  /** The position in a run of marks (a rating sweep). Each step waits delay.reveal-step / 2. Default 0. */
  index?: number;
}

/** A run of pops waits at most this many steps, so the last one starts within 300ms. */
export const POP_MAX_STEPS = 6;

export const pop = definePattern<PopInput>({
  id: 'pop',
  tokens: ['duration.medium', 'duration.base', 'ease.emphasized', 'ease.exit', 'ease.out', 'scale.press', 'delay.reveal-step', 'spring.press'],
  spec: ({ phase, index = 0 }) => {
    const steps = Math.min(POP_MAX_STEPS, Math.max(0, Math.floor(index)));
    return {
      // From scale.press squared: about 94%, a visible land that stays small.
      keyframes: byPhase(phase, [
        { transform: `scale(calc(${scale('scale.press')} * ${scale('scale.press')}))`, opacity: 0 },
        { transform: 'none', opacity: 1 },
      ]),
      duration: 'duration.medium',
      easing: phase === 'exit' ? 'ease.exit' : 'ease.emphasized',
      fill: phase === 'exit' ? 'forwards' : 'backwards',
      origin: '50% 50%',
      ...(steps > 0 && phase !== 'exit' ? { delay: 'delay.reveal-step' as const, delaySteps: steps / 2 } : {}),
    };
  },
  reduced: ({ phase }) => fadeSpec(phase),
  native: {
    duration: durationMs['duration.medium'],
    easing: easeBezier['ease.emphasized'],
    reducedDuration: durationMs['duration.base'],
    fromScale: Math.round(scaleValue['scale.press'] * scaleValue['scale.press'] * 10000) / 10000,
    stepDelay: durationMs['delay.reveal-step'] / 2,
    spring: springValue['spring.press'],
  },
});
