// The motion catalog core: the types every pattern shares, `definePattern`
// that turns a pattern definition into the exported object, and the web
// helper that plays a pattern with the Web Animations API.
//
// - Only transform and opacity move. A keyframe never holds another property;
//   the transform origin is set on the element before the animation plays.
// - Timing comes from token names. The web reads their CSS variable values at
//   run time (getComputedStyle), so a style or reduced motion (every duration
//   and delay token is 0ms there) changes them without code. Distances and
//   scales sit in the keyframes as `var(--ds-...)` with the token value as the
//   fallback, so the browser resolves them on the element.
// - Every pattern has a reduced form: opacity only, or nothing.
// - Never wait on transitionend or animationend: await `settled(animation)`.

/** A duration token name, for example `duration.base`. */
export type DurationToken = `duration.${string}`;
/** A delay token name, for example `delay.reveal-step`. */
export type DelayToken = `delay.${string}`;
/** An ease token name, for example `ease.out`. */
export type EaseToken = `ease.${string}`;
/** Any token path a pattern reads: duration, delay, ease, scale, space or spring. */
export type TokenPath = `${'duration' | 'delay' | 'ease' | 'scale' | 'space' | 'spring'}.${string}`;

/** The 18 pattern ids of the catalog. Fixed by order 1.11. */
export const PATTERN_IDS = [
  'fade-rise',
  'menu-scale',
  'dialog',
  'sheet',
  'toast',
  'accordion-height',
  'tab-indicator',
  'list-stagger',
  'drag-drop',
  'window-grow',
  'window-zoom',
  'window-minimize',
  'skeleton-shimmer',
  'spinner',
  'number-roll',
  'chart-draw',
  'thinking',
  'streaming-text',
] as const;

export type PatternId = (typeof PATTERN_IDS)[number];

/** A box on the screen in CSS px, as the browser measures it. DOMRect fits. */
export interface MotionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Enter plays when a part appears, exit when it leaves. */
export type MotionPhase = 'enter' | 'exit';
/** The reading direction. Patterns that travel along the inline axis flip in RTL. */
export type MotionDir = 'ltr' | 'rtl';

/** What a pattern plays: keyframes plus the token names of its timing. */
export interface MotionSpec {
  keyframes: Keyframe[];
  duration: DurationToken;
  easing: EaseToken | 'linear';
  /** `forwards` for a part that leaves: it holds the last frame until removed. */
  fill: FillMode;
  /** The transform origin the keyframes assume, set on the element before playing. */
  origin: string;
  /** Loops. Default 1. */
  iterations?: number;
  /** A delay token, multiplied by `delaySteps`. */
  delay?: DelayToken;
  delaySteps?: number;
}

/** Numbers for Reanimated (wave 2): ms, cubic bezier points, scales, px and springs. */
export interface NativeMotion {
  duration: number;
  easing: readonly [number, number, number, number] | 'linear';
  /** Reduced form duration in ms; 0 when the reduced form is no motion. */
  reducedDuration: number;
  [key: string]: unknown;
}

/** The input every pattern takes. Each pattern adds its own fields. */
export interface MotionInput {
  phase?: MotionPhase;
  dir?: MotionDir;
}

export interface PatternDefinition<I extends MotionInput> {
  id: PatternId;
  /** Every token path the pattern reads, in its full and reduced forms. */
  tokens: readonly TokenPath[];
  /** The full form. */
  spec: (input: I) => MotionSpec;
  /** The reduced form: keyframes hold opacity only, or there are none. */
  reduced: (input: I) => MotionSpec;
  native: NativeMotion;
}

/** How a style plays one pattern: the full form, the reduced form, or nothing. */
export type PatternMode = 'full' | 'reduced' | 'none';

export interface PatternPreset {
  mode: PatternMode;
  /** A duration token that replaces the pattern's own. */
  duration?: DurationToken;
  /** An ease token that replaces the pattern's own. */
  easing?: EaseToken;
}

export interface AnimateOptions {
  /** Play the reduced form. Default: the person's `prefers-reduced-motion`. */
  reduced?: boolean;
  /** The style's preset for this pattern. */
  preset?: PatternPreset;
  /** The CSS variable prefix. Default `ds`. */
  prefix?: string;
}

export interface MotionPattern<I extends MotionInput> {
  id: PatternId;
  tokens: readonly TokenPath[];
  native: NativeMotion;
  /** The full form spec. */
  spec: (input?: I) => MotionSpec;
  /** The reduced form spec. */
  reducedSpec: (input?: I) => MotionSpec;
  /** The full form keyframes for WAAPI. */
  keyframes: (input?: I) => Keyframe[];
  /** The reduced form keyframes: opacity only, or none. */
  reduced: (input?: I) => Keyframe[];
  /** The spec a preset plays, or null for no motion. */
  specFor: (input?: I, opts?: AnimateOptions) => MotionSpec | null;
  /** Plays the pattern on `el`. Returns the Animation (await `settled`), or null when nothing plays. */
  animate: (el: Element, opts?: I & AnimateOptions) => Animation | null;
}

export function definePattern<I extends MotionInput>(def: PatternDefinition<I>): MotionPattern<I> {
  const spec = (input?: I) => def.spec(input ?? ({} as I));
  const reducedSpec = (input?: I) => def.reduced(input ?? ({} as I));
  const specFor = (input?: I, opts: AnimateOptions = {}): MotionSpec | null => {
    const mode = opts.preset?.mode ?? 'full';
    if (mode === 'none') return null;
    const reduced = mode === 'reduced' || (opts.reduced ?? prefersReducedMotion());
    const s = reduced ? reducedSpec(input) : spec(input);
    if (s.keyframes.length === 0) return null;
    const out = { ...s };
    if (opts.preset?.duration) out.duration = opts.preset.duration;
    if (opts.preset?.easing && out.easing !== 'linear') out.easing = opts.preset.easing;
    return out;
  };
  return {
    id: def.id,
    tokens: def.tokens,
    native: def.native,
    spec,
    reducedSpec,
    keyframes: (input) => spec(input).keyframes,
    reduced: (input) => reducedSpec(input).keyframes,
    specFor,
    animate: (el, opts) => {
      const { reduced, preset, prefix = 'ds', ...rest } = opts ?? ({} as I & AnimateOptions);
      const input = { ...rest, dir: rest.dir ?? readDir(el) } as unknown as I;
      const s = specFor(input, { reduced, preset, prefix });
      return s ? play(el, s, def.id, prefix) : null;
    },
  };
}

// ---------------------------------------------------------------- keyframe helpers

/** A rect smaller than this on either side is not used. Same as the shared window manager. */
const MIN_SIDE = 4;

/** True for a rect large enough to animate from or to. */
export const usableRect = (r: MotionRect | null | undefined): r is MotionRect => Boolean(r && r.width > MIN_SIDE && r.height > MIN_SIDE);

/** Rounds to `digits` decimals, so keyframe strings stay short and stable. */
export function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** The transform (origin 0 0) that draws a box sitting at `to` over `from`. */
export function between(from: MotionRect, to: MotionRect): string {
  const sx = to.width ? from.width / to.width : 1;
  const sy = to.height ? from.height / to.height : 1;
  return `translate(${round(from.x - to.x)}px, ${round(from.y - to.y)}px) scale(${round(sx, 4)}, ${round(sy, 4)})`;
}

/** A token as a CSS value with its value as the fallback: `var(--ds-space-xs, 6px)`. */
export function cssToken(token: TokenPath, fallback: string | number, prefix = 'ds'): string {
  return `var(${tokenVar(token, prefix)}, ${fallback})`;
}

export const fadeIn: readonly Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
export const fadeOut: readonly Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];

/** Enter keyframes as given, or the same frames played backward for exit. */
export function byPhase(phase: MotionPhase | undefined, enter: Keyframe[]): Keyframe[] {
  if (phase !== 'exit') return enter;
  return [...enter].reverse().map((f) => (typeof f.offset === 'number' ? { ...f, offset: 1 - f.offset } : f));
}

/** An opacity only spec for a reduced form. */
export function fadeSpec(phase: MotionPhase | undefined, duration: DurationToken = 'duration.base'): MotionSpec {
  return {
    keyframes: phase === 'exit' ? [...fadeOut] : [...fadeIn],
    duration,
    easing: phase === 'exit' ? 'ease.exit' : 'ease.out',
    fill: phase === 'exit' ? 'forwards' : 'none',
    origin: '50% 50%',
  };
}

/** A spec with no motion: the reduced form of a pattern that only moves. */
export function stillSpec(duration: DurationToken): MotionSpec {
  return { keyframes: [], duration, easing: 'ease.out', fill: 'none', origin: '50% 50%' };
}

/** Every property a list of keyframes sets, apart from offset, easing and composite. */
export function animatedProperties(frames: readonly Keyframe[]): string[] {
  const props = new Set<string>();
  for (const f of frames) for (const k of Object.keys(f)) if (k !== 'offset' && k !== 'easing' && k !== 'composite') props.add(k);
  return [...props].sort();
}

// ---------------------------------------------------------------- web

/** The CSS variable of a token name: `duration.window-open` is `--ds-duration-window-open`. */
export function tokenVar(token: string, prefix = 'ds'): string {
  return `--${prefix}-${token.replace(/\./g, '-')}`;
}

/** Parses a CSS time (`300ms`, `0.3s`) to ms. Anything else is 0. */
export function parseDuration(value: string): number {
  const m = /^(-?\d*\.?\d+)(ms|s)$/i.exec(value.trim());
  if (!m) return 0;
  const n = Number.parseFloat(m[1] ?? '0');
  return (m[2] ?? 'ms').toLowerCase() === 's' ? n * 1000 : n;
}

/** True when the person asked for reduced motion. False where there is no window. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readVar(el: Element, token: string, prefix: string): string {
  if (typeof getComputedStyle !== 'function') return '';
  return getComputedStyle(el).getPropertyValue(tokenVar(token, prefix)).trim();
}

/** Reads a duration or delay token on an element, in ms. 0 when it is not set. */
export function readDuration(el: Element, token: DurationToken | DelayToken, prefix = 'ds'): number {
  return parseDuration(readVar(el, token, prefix));
}

/** Reads an ease token on an element. `ease` when it is not set. */
export function readEasing(el: Element, token: EaseToken, prefix = 'ds'): string {
  return readVar(el, token, prefix) || 'ease';
}

/** The reading direction of an element, from its computed style. */
export function readDir(el: Element): MotionDir {
  if (typeof getComputedStyle !== 'function') return 'ltr';
  return getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr';
}

/** The id the catalog gives every Animation it starts: `ds-motion:<pattern>`. */
export const ANIMATION_ID_PREFIX = 'ds-motion:';

/** Cancels the running animations of an element, so the next one measures its real frame. */
export function settle(el: Element): void {
  if (typeof el.getAnimations !== 'function') return;
  for (const a of el.getAnimations()) a.cancel();
}

/** Plays a spec on an element with token timing. Null when there is no Web Animations API. */
export function play(el: Element, spec: MotionSpec, id: string, prefix = 'ds'): Animation | null {
  if (spec.keyframes.length === 0 || typeof el.animate !== 'function') return null;
  if (typeof el.getAnimations === 'function') {
    for (const a of el.getAnimations()) if (a.id === `${ANIMATION_ID_PREFIX}${id}`) a.cancel();
  }
  const style = (el as HTMLElement).style as CSSStyleDeclaration | undefined;
  if (style) style.transformOrigin = spec.origin;
  const delay = spec.delay ? readDuration(el, spec.delay, prefix) * (spec.delaySteps ?? 1) : 0;
  return el.animate(spec.keyframes, {
    id: `${ANIMATION_ID_PREFIX}${id}`,
    duration: readDuration(el, spec.duration, prefix),
    easing: spec.easing === 'linear' ? 'linear' : readEasing(el, spec.easing, prefix),
    fill: spec.fill,
    iterations: spec.iterations ?? 1,
    delay,
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
