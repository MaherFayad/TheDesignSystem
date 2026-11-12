// Interaction "window-settle" (order 1.22, proposed): the Desk window motion
// (grow, close, zoom, minimize, from packages/motion) gains a settle. A
// second animation is added on top of the window pattern (composite add, so
// it multiplies the pattern's own transform and never fights it):
//
// - land, after a grow, a zoom or a restore: near the end of the pattern the
//   window swells to scale.lift and settles back to its size;
// - gather, at the start of a close or a minimize: the window swells to
//   scale.lift for a moment before it shrinks away (the anticipation).
//
// Only transform moves, timed by tokens read on the element. It plays only
// when the style grows its windows (window mode `grow`) and the interaction
// plays in full; reduced motion and other styles play nothing more than the
// pattern. Nothing waits for it: the state has already changed.
import { ANIMATION_ID_PREFIX, readDuration, readEasing, type DurationToken, type PatternMode, type WindowMotionMode } from '@the-system/motion';

/** The id of the settle animation. */
export const WINDOW_SETTLE_ID = 'window-settle';

/** Share of the pattern's duration after which the land swell starts. */
const LAND_AT = 0.55;

/** Plays the settle on a window element. Returns the Animation, or null. */
export function settleWindow(
  el: HTMLElement,
  phase: 'land' | 'gather',
  pattern: DurationToken,
  windowMode: WindowMotionMode,
  mode: PatternMode,
): Animation | null {
  if (windowMode !== 'grow' || mode !== 'full' || typeof el.animate !== 'function') return null;
  const patternMs = readDuration(el, pattern);
  const duration = phase === 'land' ? readDuration(el, 'duration.spring-bouncy') : readDuration(el, 'duration.quick');
  if (patternMs <= 0 || duration <= 0) return null;
  const id = `${ANIMATION_ID_PREFIX}${WINDOW_SETTLE_ID}`;
  for (const a of el.getAnimations?.() ?? []) if (String(a.id) === id) a.cancel();
  return el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(var(--ds-scale-lift, 1.01))', offset: 0.35 }, { transform: 'scale(1)' }],
    {
      id,
      duration,
      delay: phase === 'land' ? patternMs * LAND_AT : 0,
      easing: readEasing(el, phase === 'land' ? 'ease.out' : 'ease.exit'),
      composite: 'add',
    },
  );
}
