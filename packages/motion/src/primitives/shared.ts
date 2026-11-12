// Shared plumbing for the primitives of order 1.22 (FLIP move, staggered
// group, icon morph, digit roll, stateful button morph).
//
// - A primitive plays catalog style specs through `play()`, so timing comes
//   from tokens read on the element at run time: a style changes the feel
//   through its tokens (spring eases, scales, distances, stagger step), and
//   reduced motion zeroes every duration and delay.
// - Only transform and opacity move.
// - Every primitive takes `mode` (full, reduced or none, from a style preset
//   through `useMotion().mode(id)`) and `reduced` (the person's setting; it
//   defaults to `prefersReducedMotion()`).
// - A primitive never holds a part in its end state with `fill: forwards`
//   unless it says so: the component CSS holds the rest state of each part,
//   and the animation plays from the old look to that rest. When it ends or
//   is cancelled, the part sits where the CSS puts it. Nothing waits on
//   transitionend or animationend.
import { cssToken, play, prefersReducedMotion, readDuration, type DelayToken, type DurationToken, type EaseToken, type MotionSpec, type PatternMode } from '../core';
import { distancePx, durationMs, scaleValue, type DistanceName, type ScaleName } from '../tokens';

/** The three springs of order 1.22. Each is a pair of tokens: `ease.spring-<name>` and `duration.spring-<name>`. */
export type MotionSpring = 'soft' | 'snappy' | 'bouncy';

export const SPRING_NAMES: readonly MotionSpring[] = ['soft', 'snappy', 'bouncy'];

/** The duration and ease tokens of a spring. */
export function springTiming(name: MotionSpring): { duration: DurationToken; easing: EaseToken } {
  return { duration: `duration.spring-${name}`, easing: `ease.spring-${name}` };
}

/** Options every primitive takes. */
export interface PrimitiveOptions {
  /** The style's choice for this interaction. Default `full`. */
  mode?: PatternMode;
  /** Play the reduced form. Default: the person's `prefers-reduced-motion` or `data-motion="reduce"`. */
  reduced?: boolean;
  /** The CSS variable prefix. Default `ds`. */
  prefix?: string;
}

/** What a primitive plays: `full`, `reduced`, or `none` for nothing. */
export function resolveMode(opts: PrimitiveOptions = {}): PatternMode {
  const mode = opts.mode ?? 'full';
  if (mode === 'none') return 'none';
  if (mode === 'reduced') return 'reduced';
  return (opts.reduced ?? prefersReducedMotion()) ? 'reduced' : 'full';
}

/** A scale token as a CSS number with its base value as the fallback. */
export const scaleVar = (name: ScaleName, prefix = 'ds'): string => cssToken(name, scaleValue[name], prefix);
/** A distance token as a CSS length with its base value as the fallback. */
export const distanceVar = (name: DistanceName, prefix = 'ds'): string => cssToken(name, `${distancePx[name]}px`, prefix);
/** A distance token as a negative CSS length. */
export const negDistanceVar = (name: DistanceName, prefix = 'ds'): string => `calc(-1 * ${distanceVar(name, prefix)})`;

/** Builds a spec with sensible defaults. */
export function spec(
  keyframes: Keyframe[],
  timing: { duration: DurationToken; easing: EaseToken | 'linear' },
  extra: Partial<Pick<MotionSpec, 'fill' | 'origin' | 'delay' | 'delaySteps'>> = {},
): MotionSpec {
  return { keyframes, duration: timing.duration, easing: timing.easing, fill: extra.fill ?? 'none', origin: extra.origin ?? '50% 50%', delay: extra.delay, delaySteps: extra.delaySteps };
}

/** An opacity only spec for a reduced form. Enter fades in, exit fades out. */
export function fadeOnly(phase: 'enter' | 'exit', extra: Partial<Pick<MotionSpec, 'fill' | 'delay' | 'delaySteps'>> = {}): MotionSpec {
  return spec(phase === 'exit' ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }], { duration: 'duration.base', easing: phase === 'exit' ? 'ease.exit' : 'ease.out' }, extra);
}

/** Plays a spec with a primitive's id. Null when nothing plays. */
export function run(el: Element | null | undefined, s: MotionSpec | null, id: string, prefix = 'ds'): Animation | null {
  if (!el || !s) return null;
  return play(el, s, id, prefix);
}

/** Drops the nulls from a list of animations. */
export function played(list: (Animation | null)[]): Animation[] {
  return list.filter((a): a is Animation => a !== null);
}

/** The most steps a stagger plays; the parts after that start with the last step. */
export const STAGGER_MAX_STEPS = 6;

/**
 * Text that enters is at full opacity within about 200ms of the trigger, so
 * nothing is read (or measured by axe) below its contrast for more than a
 * moment (lead finding on round 1 `list-stagger`). Two rules carry it: the
 * delays of a stagger add up to at most this budget, and an entering part
 * reaches full opacity early in its own run (`READABLE_AT` of the way), while
 * the transform carries the rest of the entrance.
 */
export const STAGGER_BUDGET_MS = 120;

/** The share of an entrance by which opacity is 1. */
export const READABLE_AT = 0.3;

/**
 * The most stagger steps that fit `STAGGER_BUDGET_MS` at the live
 * `delay.stagger` on `el` (Neutral 24ms: 5 steps; Desk 45ms: 2 steps; Studio
 * 0ms: no wait at all), never more than `max`.
 */
export function stepsWithin(el: Element | null | undefined, max = STAGGER_MAX_STEPS, prefix = 'ds'): number {
  const step = el ? readDuration(el, STAGGER_DELAY, prefix) : 0;
  if (!(step > 0)) return max;
  return Math.max(0, Math.min(max, Math.floor(STAGGER_BUDGET_MS / step)));
}

/** Entrance keyframes from `from`: opacity is 1 by `READABLE_AT`, the transform settles over the whole run. */
export function readableEnter(from: string): Keyframe[] {
  return [
    { transform: from, opacity: 0, offset: 0 },
    { opacity: 1, offset: READABLE_AT },
    { transform: 'none', opacity: 1, offset: 1 },
  ];
}

/** The stagger step token. */
export const STAGGER_DELAY: DelayToken = 'delay.stagger';

/** The base value of a duration token in ms, for tests and native. */
export const baseMs = (token: keyof typeof durationMs): number => durationMs[token];
