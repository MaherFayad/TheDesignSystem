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

/** The pattern ids of the catalog: the 18 of order 1.11, then `fade` and `press`, which the components asked for. */
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
  'fade',
  'press',
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
  /**
   * For a loop that is not the activity itself: on the web the loop count is
   * computed from the live duration token so that every loop ends before
   * this many ms (at least one loop). `iterations` holds the count at the
   * base token value.
   */
  loopLimitMs?: number;
  /** A delay token, multiplied by `delaySteps`. */
  delay?: DelayToken;
  delaySteps?: number;
}

/** Numbers for Reanimated (wave 2): ms, cubic bezier points, scales, px and springs. */
export interface NativeMotion {
  duration: number;
  /** Cubic bezier points. Linear is `[0, 0, 1, 1]`. */
  easing: readonly [number, number, number, number];
  /** Reduced form duration in ms; 0 when the reduced form is no motion. */
  reducedDuration: number;
  /** Loops. `-1` loops until stopped, as Reanimated's `withRepeat` reads it. Default 1. */
  iterations?: number;
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

/** Timing a preset gives one phase of the full form. */
export interface PhaseTiming {
  duration?: DurationToken;
  easing?: EaseToken;
}

/**
 * A style's choice for one pattern. Timing rows change the full form only;
 * the reduced form keeps its own timing.
 */
export interface PatternPreset {
  mode: PatternMode;
  /** A duration token that replaces the pattern's own, in both phases. */
  duration?: DurationToken;
  /** An ease token that replaces the pattern's own, in both phases. */
  easing?: EaseToken;
  /** Timing for the enter phase only. Wins over `duration` and `easing`. */
  enter?: PhaseTiming;
  /** Timing for the exit phase only. Wins over `duration` and `easing`. */
  exit?: PhaseTiming;
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
    const p = opts.preset;
    if (reduced || !p) return out;
    const phase = p[input?.phase === 'exit' ? 'exit' : 'enter'];
    const duration = phase?.duration ?? p.duration;
    const easing = phase?.easing ?? p.easing;
    if (duration) out.duration = duration;
    if (easing && out.easing !== 'linear') out.easing = easing;
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

/** WCAG 2.2.2: anything that moves for more than five seconds needs a way to pause it. */
export const LOOP_LIMIT_MS = 5000;

/** The loop count that ends before `limitMs` at a duration, at least 1. */
export function loopsWithin(durationMs: number, limitMs = LOOP_LIMIT_MS): number {
  if (!(durationMs > 0)) return 1;
  return Math.max(1, Math.floor((limitMs - 1) / durationMs));
}

/** Cancels the running animations of an element, so the next one measures its real frame. */
export function settle(el: Element): void {
  if (typeof el.getAnimations !== 'function') return;
  for (const a of el.getAnimations()) a.cancel();
}

export interface PlayOptions {
  /**
   * Running catalog animations whose id starts with `ds-motion:<group>` are
   * replaced too, not only the one with the same id. The window patterns
   * use `window-`, so a close replaces a grow.
   */
  group?: string;
}

/** True for an animation that holds its last frame after it ends: an exit. */
function holdsEnd(a: Animation): boolean {
  const fill = (a.effect?.getTiming().fill ?? 'auto') as FillMode;
  return fill === 'forwards' || fill === 'both';
}

/**
 * The first keyframe replaced by the live values of the element, for the
 * properties it sets. Read while the old animation still runs, so a quick
 * reverse starts where the element is instead of jumping.
 */
function fromLiveFrame(el: Element, frames: Keyframe[]): Keyframe[] {
  if (typeof getComputedStyle !== 'function' || frames.length === 0) return frames;
  const cs = getComputedStyle(el);
  const first: Keyframe = { ...frames[0] };
  for (const prop of ['transform', 'opacity'] as const) {
    if (!(prop in first)) continue;
    const live = cs.getPropertyValue(prop).trim();
    if (live) first[prop] = live;
  }
  return [first, ...frames.slice(1)];
}

/**
 * Plays a spec on an element with token timing. Null when there is no Web
 * Animations API.
 *
 * Before it plays, it cancels the catalog animations it replaces: its own id
 * (or its group), and any catalog animation that holds an end frame (an exit
 * of another pattern would otherwise cover the new one). When one of those
 * is still in flight, the new animation starts from the live frame. Other
 * catalog animations on the element, such as a spinner, keep playing.
 */
export function play(el: Element, spec: MotionSpec, id: string, prefix = 'ds', opts: PlayOptions = {}): Animation | null {
  if (spec.keyframes.length === 0 || typeof el.animate !== 'function') return null;
  const ownId = `${ANIMATION_ID_PREFIX}${id}`;
  let keyframes = spec.keyframes;
  if (typeof el.getAnimations === 'function') {
    const sameKind = (a: Animation) => {
      const aid = String(a.id);
      return aid === ownId || (opts.group !== undefined && aid.startsWith(`${ANIMATION_ID_PREFIX}${opts.group}`));
    };
    const replaced = el.getAnimations().filter((a) => String(a.id).startsWith(ANIMATION_ID_PREFIX) && (sameKind(a) || holdsEnd(a)));
    if (replaced.some((a) => a.playState === 'running' || a.playState === 'paused')) keyframes = fromLiveFrame(el, keyframes);
    for (const a of replaced) a.cancel();
  }
  const style = (el as HTMLElement).style as CSSStyleDeclaration | undefined;
  if (style) {
    style.transformOrigin = spec.origin;
    // On SVG, transform-box defaults to the view box: make the origin the element's own box.
    if (typeof SVGElement !== 'undefined' && el instanceof SVGElement) style.transformBox = 'fill-box';
  }
  const delay = spec.delay ? readDuration(el, spec.delay, prefix) * (spec.delaySteps ?? 1) : 0;
  const duration = readDuration(el, spec.duration, prefix);
  const iterations = spec.loopLimitMs ? loopsWithin(duration, spec.loopLimitMs) : (spec.iterations ?? 1);
  return el.animate(keyframes, {
    id: ownId,
    duration,
    easing: spec.easing === 'linear' ? 'linear' : readEasing(el, spec.easing, prefix),
    fill: spec.fill,
    iterations,
    delay,
  });
}

/**
 * The loops under `root` (its own and its descendants'): catalog animations
 * with more than one loop, and any animation that loops forever, such as the
 * CSS spinners the components play, which carry no catalog id.
 */
function loopsUnder(root: Element | Document): Animation[] {
  if (typeof root.getAnimations !== 'function') return [];
  return root.getAnimations({ subtree: true } as GetAnimationsOptions).filter((a) => {
    const n = a.effect?.getTiming().iterations ?? 1;
    return n === Infinity || (String(a.id).startsWith(ANIMATION_ID_PREFIX) && n > 1);
  });
}

/** The loops `pauseLoops` paused, so `resumeLoops` leaves alone a loop something else paused. */
const pausedByUs = new WeakSet<Animation>();

/** The roots `pauseLoops` paused and `resumeLoops` has not played again. */
const pausedRoots = new Set<Element | Document>();

/** Pauses the running loops under `root` and remembers them. Returns how many. */
function pauseUnder(root: Element | Document): number {
  let n = 0;
  for (const a of loopsUnder(root)) {
    if (a.playState === 'running') {
      a.pause();
      pausedByUs.add(a);
      n += 1;
    }
  }
  return n;
}

/**
 * A loop that starts after the pause (a spinner that mounts, or a CSS
 * animation the stylesheet restarts) is a new Animation. While a root is
 * paused, one listener pauses each new loop under it as it starts.
 */
function onLoopStart(event: Event): void {
  const target = event.target as Element | null;
  if (!target || typeof target.getAnimations !== 'function') return;
  for (const root of pausedRoots) {
    if (root === target || root.contains(target)) pauseUnder(target);
  }
}

/**
 * Pauses every loop under `root` (a spinner, the thinking dots, a shimmer, a
 * component's CSS spinner, and any other endless animation under it, the
 * system's or not) and returns how many it paused. Loops that start later
 * under `root` are paused too, until `resumeLoops(root)`. Wire it to a pause
 * control, or call it when the page asks for less motion. WCAG 2.2.2 asks
 * for a way to pause anything that moves for more than five seconds. Do not
 * await `settled()` on a paused or endless loop: it never ends.
 */
export function pauseLoops(root: Element | Document): number {
  const doc = 'documentElement' in root ? root : root.ownerDocument;
  if (pausedRoots.size === 0) doc?.addEventListener('animationstart', onLoopStart, true);
  pausedRoots.add(root);
  return pauseUnder(root);
}

/**
 * Plays again the loops under `root` that `pauseLoops` paused, and stops
 * pausing new ones. Returns how many. A loop it plays again runs even if the
 * stylesheet has since set animation-play-state: paused on it.
 */
export function resumeLoops(root: Element | Document): number {
  pausedRoots.delete(root);
  if (pausedRoots.size === 0) {
    const doc = 'documentElement' in root ? root : root.ownerDocument;
    doc?.removeEventListener('animationstart', onLoopStart, true);
  }
  let n = 0;
  for (const a of loopsUnder(root)) {
    if (a.playState === 'paused' && pausedByUs.has(a)) {
      a.play();
      pausedByUs.delete(a);
      n += 1;
    }
  }
  return n;
}

/**
 * Resolves when the animation ends or is cancelled. Resolves at once for
 * null and for an animation that is already idle: after a cancel the browser
 * puts a new `finished` promise in place that stays pending while the
 * animation is idle, so awaiting it would never end. A loop that never ends
 * (an endless spinner, or one `pauseLoops` paused) never resolves: do not
 * await it.
 */
export async function settled(animation: Animation | null | undefined): Promise<void> {
  if (!animation || animation.playState === 'idle') return;
  try {
    await animation.finished;
  } catch {
    // Cancelled: nothing to wait for.
  }
}
