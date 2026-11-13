// The check of a Stepper step that turns complete (round 3). One copy for
// both frameworks (order 1.29): React's Stepper.tsx and Angular's stepper.ts
// play it on a change only. Exported as drawStepCheck: the selection family
// has its own drawCheck (./selection-marker).
import { readDuration, readEasing, type PatternMode } from '../core';

/** The length of the system check path (M20 6 9 17l-5-5) in its 24 unit box, rounded up. */
export const CHECK_LENGTH = 24;

/**
 * Draws a check path from its end (the short stroke) to its start with
 * stroke-dashoffset, on the soft spring. Full mode only; the check is whole
 * at once otherwise, and whole again when the animation ends.
 */
export function drawStepCheck(path: Element | null | undefined, mode: PatternMode): Animation | null {
  if (!path || mode !== 'full' || typeof path.animate !== 'function') return null;
  const dash = `${CHECK_LENGTH} ${CHECK_LENGTH}`;
  return path.animate(
    [
      { strokeDasharray: dash, strokeDashoffset: -CHECK_LENGTH },
      { strokeDasharray: dash, strokeDashoffset: 0 },
    ],
    { duration: readDuration(path, 'duration.spring-soft'), easing: readEasing(path, 'ease.out'), id: 'ds-motion:stepper-check' },
  );
}
