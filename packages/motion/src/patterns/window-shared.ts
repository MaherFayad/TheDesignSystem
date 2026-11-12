// Shared by the three window patterns: the spec shape Window.tsx plays and
// the rest scale. Moved from window.ts with the same values.
import type { DurationToken, EaseToken, MotionInput, MotionRect, MotionSpec } from '../core';

export type WindowPattern = 'grow' | 'close' | 'zoom' | 'minimize';
export type WindowPatternName = `window-${WindowPattern}`;

/** A window pattern ready to play: keyframes plus the token names of its timing. */
export interface WindowMotionSpec {
  /** The pattern name, for example `window-grow`. `window-close` is the exit of `window-grow`. */
  name: WindowPatternName;
  keyframes: Keyframe[];
  duration: DurationToken;
  easing: EaseToken;
  /** `forwards` for a window that leaves (close, minimize): it stays at the last frame until removed. */
  fill: FillMode;
  /** The transform origin the keyframes assume, set on the element before playing. */
  origin: string;
}

export interface WindowMotionInput extends MotionInput {
  /** Where the motion starts: the trigger (grow), the old frame (zoom), the window (close, minimize). */
  from?: MotionRect | null;
  /** Where the motion ends: the window (grow, zoom), the trigger or the dock (close, minimize). */
  to?: MotionRect | null;
  /** The reduced motion form: opacity only, or no motion at all for zoom. */
  reduced?: boolean;
}

/**
 * The scale a window grows from, or shrinks to, when there is no trigger:
 * the value of the token scale.window-enter. The catalog test checks it
 * against packages/tokens/src/base/scale.json.
 */
export const WINDOW_REST_SCALE = 0.92;

/** Transform origins: rect to rect scales from the top left, the 92% forms from the center, minimize from the bottom center. */
export const TOP_START = '0 0';
export const CENTER = '50% 50%';
export const BOTTOM_CENTER = '50% 100%';

/** A window spec as a catalog spec. */
export function asSpec({ keyframes, duration, easing, fill, origin }: WindowMotionSpec): MotionSpec {
  return { keyframes, duration, easing, fill, origin };
}
