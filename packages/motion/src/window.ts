// Window motion, kept for Window.tsx: the window patterns now live in the
// catalog (patterns/window-grow.ts, window-zoom.ts, window-minimize.ts) with
// the same values; this file keeps the names Window.tsx and its tests use,
// and the web helper `animateWindow`. `window-close` is the exit of
// `window-grow`.
import { play, prefersReducedMotion, type MotionRect, type PatternPreset } from './core';
import { asSpec } from './patterns/window-shared';
import type { WindowMotionMode } from './preset';
import { windowClose, windowGrow } from './patterns/window-grow';
import { windowMinimize } from './patterns/window-minimize';
import type { WindowMotionInput, WindowMotionSpec, WindowPattern } from './patterns/window-shared';
import { windowZoom } from './patterns/window-zoom';

export type { WindowMotionInput, WindowMotionSpec, WindowPattern, WindowPatternName } from './patterns/window-shared';
export { WINDOW_REST_SCALE } from './patterns/window-shared';
export { windowClose, windowGrow, windowMinimize, windowZoom };
export type { MotionRect };

/** Every window pattern by its short name. */
export const windowPatterns: Record<WindowPattern, (input?: WindowMotionInput) => WindowMotionSpec> = {
  grow: windowGrow,
  close: windowClose,
  zoom: windowZoom,
  minimize: windowMinimize,
};

/**
 * The spec a window mode plays for a pattern: `grow` plays the full pattern,
 * `fade` its opacity form, `none` nothing (null).
 */
export function windowMotionFor(mode: WindowMotionMode, pattern: WindowPattern, input: WindowMotionInput = {}): WindowMotionSpec | null {
  if (mode === 'none') return null;
  if (mode === 'fade' && pattern === 'zoom') return null;
  const reduced = mode === 'fade' || input.reduced === true;
  return windowPatterns[pattern]({ ...input, reduced });
}

export interface AnimateWindowOptions extends WindowMotionInput {
  /** The style's window motion mode. Default `grow`. */
  mode?: WindowMotionMode;
  /** The CSS variable prefix. Default `ds`. */
  prefix?: string;
  /**
   * The style's preset row for this window pattern (order 1.29), for example
   * `patternPreset(style, 'window-grow')`: its duration and ease tokens
   * replace the pattern's own in the full form, `enter` for grow, zoom and
   * minimize and `exit` for close, as the catalog patterns take them. Its
   * `mode` is not read: `mode` above says how the style moves its windows.
   * The reduced form keeps its own timing.
   */
  preset?: PatternPreset;
}

/** The phase of a window pattern a preset's `enter` or `exit` timing applies to. */
function phaseOf(pattern: WindowPattern): 'enter' | 'exit' {
  return pattern === 'close' ? 'exit' : 'enter';
}

/**
 * Plays a window pattern on `el` with the Web Animations API and returns
 * the Animation, or null when there is nothing to play (mode `none`, a zoom
 * with no motion, or no Web Animations API). Duration and easing come from
 * the tokens on the element, through the style's `preset` when one is given
 * (Studio's windows land on its stepped ease.spring-bouncy). It plays through `play()` with the pattern name
 * as its id: it replaces the window motion already on the element (from the
 * live frame when one is in flight) and leaves other catalog animations
 * alone. Await `settled(animation)`, never an end event.
 */
export function animateWindow(el: HTMLElement, pattern: WindowPattern, opts: AnimateWindowOptions = {}): Animation | null {
  const { mode = 'grow', prefix = 'ds', preset, ...input } = opts;
  const reduced = mode === 'fade' || (input.reduced ?? prefersReducedMotion());
  const spec = windowMotionFor(mode, pattern, { ...input, reduced });
  if (!spec) return null;
  const timed = { ...spec };
  if (preset && !reduced) {
    const phase = preset[phaseOf(pattern)];
    const duration = phase?.duration ?? preset.duration;
    const easing = phase?.easing ?? preset.easing;
    if (duration) timed.duration = duration;
    if (easing) timed.easing = easing;
  }
  return play(el, asSpec(timed), spec.name, prefix, { group: 'window-' });
}
