// Window motion, kept for Window.tsx: the window patterns now live in the
// catalog (patterns/window-grow.ts, window-zoom.ts, window-minimize.ts) with
// the same values; this file keeps the names Window.tsx and its tests use,
// and the web helper `animateWindow`. `window-close` is the exit of
// `window-grow`.
import { prefersReducedMotion, readDuration, readEasing, settle, type MotionRect } from './core';
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
}

/**
 * Plays a window pattern on `el` with the Web Animations API and returns
 * the Animation, or null when there is nothing to play (mode `none`, a zoom
 * with no motion, or no Web Animations API). Duration and easing come from
 * the tokens on the element. Await `settled(animation)`, never an end event.
 */
export function animateWindow(el: HTMLElement, pattern: WindowPattern, opts: AnimateWindowOptions = {}): Animation | null {
  const { mode = 'grow', prefix = 'ds', ...input } = opts;
  const spec = windowMotionFor(mode, pattern, { ...input, reduced: input.reduced ?? prefersReducedMotion() });
  if (!spec || spec.keyframes.length === 0 || typeof el.animate !== 'function') return null;
  settle(el);
  el.style.transformOrigin = spec.origin;
  return el.animate(spec.keyframes, {
    duration: readDuration(el, spec.duration, prefix),
    easing: readEasing(el, spec.easing, prefix),
    fill: spec.fill,
  });
}
