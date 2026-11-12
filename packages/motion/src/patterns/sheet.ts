// sheet: a sheet or drawer slides in from its edge, its own size away, and
// slides back out on exit. `side` is logical: `start` and `end` flip in RTL.
// Native settles on spring.sheet. Reduced: a fade.
import { byPhase, definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, springValue } from '../tokens';

export type SheetSide = 'top' | 'bottom' | 'start' | 'end';

export interface SheetInput extends MotionInput {
  /** The edge the sheet sits on. Default `bottom`. */
  side?: SheetSide;
}

/** The transform that puts a sheet just outside its edge. */
export function sheetOffset(side: SheetSide = 'bottom', dir: 'ltr' | 'rtl' = 'ltr'): string {
  if (side === 'top') return 'translateY(-100%)';
  if (side === 'bottom') return 'translateY(100%)';
  const right = (side === 'end') === (dir === 'ltr');
  return right ? 'translateX(100%)' : 'translateX(-100%)';
}

export const sheet = definePattern<SheetInput>({
  id: 'sheet',
  tokens: ['duration.slow', 'duration.base', 'ease.emphasized', 'ease.exit', 'ease.out', 'spring.sheet'],
  spec: ({ phase, side, dir }) => ({
    keyframes: byPhase(phase, [{ transform: sheetOffset(side, dir) }, { transform: 'none' }]),
    duration: 'duration.slow',
    easing: phase === 'exit' ? 'ease.exit' : 'ease.emphasized',
    fill: phase === 'exit' ? 'forwards' : 'none',
    origin: '50% 50%',
  }),
  reduced: ({ phase }) => fadeSpec(phase),
  native: {
    duration: durationMs['duration.slow'],
    easing: easeBezier['ease.emphasized'],
    reducedDuration: durationMs['duration.base'],
    spring: springValue['spring.sheet'],
  },
});
