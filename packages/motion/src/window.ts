// Window motion: the named patterns `window-grow`, `window-close`,
// `window-zoom` and `window-minimize`, as Web Animations API keyframes, plus
// the web helper that plays them. Ported from GoBanana
// `components/window/motion.ts`.
//
// - Only transform and opacity move.
// - Durations and eases are token names. The web reads their CSS variable
//   values at run time (getComputedStyle), so a style or reduced motion
//   (every duration token is 0ms there) changes them without code.
// - Every pattern has a reduced motion form: an opacity fade on duration.base
//   (120ms, the source fade; 0ms under prefers-reduced-motion like every
//   duration token), or nothing for zoom.
// - Never wait on transitionend or animationend: use `animation.finished`
//   (see `settled`). A 0ms animation finishes at once.

/** A box on the screen in CSS px, as the browser measures it. DOMRect fits. */
export interface MotionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A duration token name, for example `duration.window-open`. */
export type DurationToken = `duration.${string}`;
/** An ease token name, for example `ease.window`. */
export type EaseToken = `ease.${string}`;

/** A pattern ready to play: keyframes plus the token names of its timing. */
export interface WindowMotionSpec {
  /** The pattern name from the catalog, for example `window-grow`. */
  name: WindowPatternName;
  keyframes: Keyframe[];
  duration: DurationToken;
  easing: EaseToken;
  /** `forwards` for a window that leaves (close, minimize): it stays at the last frame until removed. */
  fill: FillMode;
  /**
   * The transform origin the keyframes assume. It is set on the element
   * before the animation plays, so the keyframes hold only transform and
   * opacity.
   */
  origin: string;
}

export type WindowPattern = 'grow' | 'close' | 'zoom' | 'minimize';
export type WindowPatternName = `window-${WindowPattern}`;

export interface WindowMotionInput {
  /** Where the motion starts: the trigger (grow), the old frame (zoom), the window (close, minimize). */
  from?: MotionRect | null;
  /** Where the motion ends: the window (grow, zoom), the trigger or the dock (close, minimize). */
  to?: MotionRect | null;
  /** The reduced motion form: opacity only, or no motion at all for zoom. */
  reduced?: boolean;
}

/** A rect smaller than this on either side is not used. Same as the shared manager. */
const MIN_SIDE = 4;
/**
 * Transform origins: rect to rect patterns scale from the top left corner,
 * the 92% forms from the center, minimize from the bottom center.
 */
const TOP_START = '0 0';
const CENTER = '50% 50%';
const BOTTOM_CENTER = '50% 100%';

/** The scale a window grows from, or shrinks to, when there is no trigger. */
export const WINDOW_REST_SCALE = 0.92;

const usable = (r: MotionRect | null | undefined): r is MotionRect => Boolean(r && r.width > MIN_SIDE && r.height > MIN_SIDE);

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** The transform (origin 0 0) that draws a box sitting at `to` over `from`. */
export function between(from: MotionRect, to: MotionRect): string {
  const sx = to.width ? from.width / to.width : 1;
  const sy = to.height ? from.height / to.height : 1;
  return `translate(${round(from.x - to.x)}px, ${round(from.y - to.y)}px) scale(${round(sx, 4)}, ${round(sy, 4)})`;
}

const fadeIn: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
const fadeOut: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];

/**
 * window-grow: the window grows out of the control that opened it (`from`,
 * the trigger rect) into its frame (`to`). Opacity settles early while the
 * transform runs the whole way. Without a trigger it scales up from 92%.
 * Reduced: a fade in.
 */
export function windowGrow({ from, to, reduced = false }: WindowMotionInput = {}): WindowMotionSpec {
  const base = { name: 'window-grow', duration: 'duration.window-open', easing: 'ease.window', fill: 'none', origin: TOP_START } as const;
  if (reduced) return { ...base, duration: 'duration.base', keyframes: fadeIn };
  if (usable(from) && usable(to)) {
    return {
      ...base,
      keyframes: [
        { transform: between(from, to), opacity: 0.35 },
        { opacity: 1, offset: 0.35 },
        { transform: 'none', opacity: 1 },
      ],
    };
  }
  return {
    ...base,
    origin: CENTER,
    keyframes: [
      { transform: `scale(${WINDOW_REST_SCALE})`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ],
  };
}

/**
 * window-close: the window (`from`) shrinks back into its trigger (`to`) and
 * fades. Without a trigger it scales down to 92%. Reduced: a fade out.
 */
export function windowClose({ from, to, reduced = false }: WindowMotionInput = {}): WindowMotionSpec {
  const base = { name: 'window-close', duration: 'duration.window-close', fill: 'forwards', origin: TOP_START } as const;
  if (reduced) return { ...base, duration: 'duration.base', easing: 'ease.exit', keyframes: fadeOut };
  if (usable(from) && usable(to)) {
    return {
      ...base,
      easing: 'ease.window',
      keyframes: [
        { transform: 'none', opacity: 1 },
        { transform: between(to, from), opacity: 0 },
      ],
    };
  }
  return {
    ...base,
    origin: CENTER,
    easing: 'ease.exit',
    keyframes: [
      { transform: 'none', opacity: 1 },
      { transform: `scale(${WINDOW_REST_SCALE})`, opacity: 0 },
    ],
  };
}

/**
 * window-zoom: a FLIP. Call after the frame changed: the window is at `to`
 * and is drawn over its old frame `from` first. Reduced: no motion.
 */
export function windowZoom({ from, to, reduced = false }: WindowMotionInput = {}): WindowMotionSpec {
  const base = { name: 'window-zoom', duration: 'duration.zoom', easing: 'ease.window', fill: 'none', origin: TOP_START } as const;
  if (reduced || !usable(from) || !usable(to)) return { ...base, keyframes: [] };
  return {
    ...base,
    keyframes: [
      { transform: between(from, to) },
      { transform: 'none' },
    ],
  };
}

/**
 * window-minimize: a genie like shrink of the window (`from`) toward the dock
 * (`to`): it narrows first, then falls in, bottom center first. Without a
 * target it scales down and fades in place. Reduced: a fade out.
 */
export function windowMinimize({ from, to, reduced = false }: WindowMotionInput = {}): WindowMotionSpec {
  // Token gap: no duration.window-minimize (the source is 320ms); duration.window-open (300ms) is the nearest.
  const base = { name: 'window-minimize', duration: 'duration.window-open', easing: 'ease.window', fill: 'forwards', origin: BOTTOM_CENTER } as const;
  if (reduced) return { ...base, duration: 'duration.base', keyframes: fadeOut };
  if (!usable(from) || !usable(to)) {
    return {
      ...base,
      keyframes: [
        { transform: 'none', opacity: 1 },
        { transform: 'scale(0.2)', opacity: 0 },
      ],
    };
  }
  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height);
  const s = Math.max(0.04, Math.min(to.width / from.width, to.height / from.height));
  return {
    ...base,
    keyframes: [
      { transform: 'none', opacity: 1 },
      {
        transform: `translate(${round(dx * 0.25)}px, ${round(dy * 0.15)}px) scale(0.55, 0.7)`,
        opacity: 0.9,
        offset: 0.4,
      },
      { transform: `translate(${round(dx)}px, ${round(dy)}px) scale(${round(s, 4)})`, opacity: 0 },
    ],
  };
}

/** Every window pattern by its short name. */
export const windowPatterns: Record<WindowPattern, (input?: WindowMotionInput) => WindowMotionSpec> = {
  grow: windowGrow,
  close: windowClose,
  zoom: windowZoom,
  minimize: windowMinimize,
};

// ---------------------------------------------------------------- style presets

/**
 * How a style moves its windows. Each style pack exports one from
 * `packages/styles/<id>/motion.ts`.
 *
 * - `grow`: open grows out of the trigger, close shrinks back into it, zoom
 *   is a FLIP, minimize falls into the dock (Desk).
 * - `fade`: a short opacity fade on open, close and minimize, no zoom motion
 *   (Studio panels: flat).
 * - `none`: no window motion at all.
 *
 * Under reduced motion every preset plays the reduced form of its patterns.
 */
export type WindowMotionMode = 'grow' | 'fade' | 'none';

export interface StyleMotionPreset {
  /** The preset id, equal to `motionPreset` in the style's style.json. */
  id: string;
  window: WindowMotionMode;
}

/**
 * The spec a preset plays for a pattern: `grow` plays the full pattern,
 * `fade` its opacity form, `none` nothing (null).
 */
export function windowMotionFor(mode: WindowMotionMode, pattern: WindowPattern, input: WindowMotionInput = {}): WindowMotionSpec | null {
  if (mode === 'none') return null;
  const reduced = mode === 'fade' || input.reduced === true;
  if (mode === 'fade' && pattern === 'zoom') return null;
  return windowPatterns[pattern]({ ...input, reduced });
}

// ---------------------------------------------------------------- web

/** The CSS variable of a token name: `duration.window-open` is `--ds-duration-window-open`. */
export function tokenVar(token: string, prefix = 'ds'): string {
  return `--${prefix}-${token.replace(/\./g, '-')}`;
}

/** Parses a CSS time (`300ms`, `0.3s`) to ms. Anything else is 0. */
export function parseDuration(value: string): number {
  const v = value.trim();
  const m = /^(-?\d*\.?\d+)(ms|s)$/i.exec(v);
  if (!m) return 0;
  const n = Number.parseFloat(m[1] ?? '0');
  return (m[2] ?? 'ms').toLowerCase() === 's' ? n * 1000 : n;
}

/** True when the person asked for reduced motion. False where there is no window. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Reads a duration token on an element, in ms. 0 when it is not set. */
export function readDuration(el: Element, token: DurationToken, prefix = 'ds'): number {
  if (typeof getComputedStyle !== 'function') return 0;
  return parseDuration(getComputedStyle(el).getPropertyValue(tokenVar(token, prefix)));
}

/** Reads an ease token on an element. `ease` when it is not set. */
export function readEasing(el: Element, token: EaseToken, prefix = 'ds'): string {
  if (typeof getComputedStyle !== 'function') return 'ease';
  return getComputedStyle(el).getPropertyValue(tokenVar(token, prefix)).trim() || 'ease';
}

export interface AnimateWindowOptions extends WindowMotionInput {
  /** The style's window motion mode. Default `grow`. */
  mode?: WindowMotionMode;
  /** The CSS variable prefix. Default `ds`. */
  prefix?: string;
}

/** Cancels the running animations of an element, so the next one measures its real frame. */
export function settle(el: Element): void {
  if (typeof el.getAnimations !== 'function') return;
  for (const a of el.getAnimations()) a.cancel();
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

/** Resolves when the animation ends or is cancelled. Resolves at once for null. */
export async function settled(animation: Animation | null | undefined): Promise<void> {
  if (!animation) return;
  try {
    await animation.finished;
  } catch {
    // Cancelled: nothing to wait for.
  }
}
