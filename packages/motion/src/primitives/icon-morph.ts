// Icon morph (order 1.22): one glyph becomes another in the same place, built
// from parts that rotate, scale and cross fade. Copy to check, eye to eye
// off, plus to close, menu to close, play to pause.
//
// - `iconMorph({ from, to })`: the old glyph turns by `turn` degrees while it
//   shrinks to `scale.morph` and fades out (duration.morph on ease.exit,
//   holding its last frame so the caller removes it when it likes); the new
//   glyph turns in from the other side, grows past rest on the bouncy spring
//   and settles. Both start on the same frame: the new state never waits.
// - `iconTurn(el, from, to)`: one glyph that turns to a new angle on the
//   snappy spring, for a chevron that opens or a plus that becomes a close
//   mark. The rest angle is the component's CSS for the new state.
// - `iconParts(parts)`: the parts of one glyph (the two bars of a close mark,
//   the three lines of a menu) settle one stagger step apart from
//   `scale.morph`, for a glyph drawn from parts.
// - Reduced: a cross fade with no turn or scale. Mode `none`: nothing.
import { round } from '../core';
import { fadeOnly, played, resolveMode, run, scaleVar, spec, springTiming, STAGGER_DELAY, STAGGER_MAX_STEPS, type PrimitiveOptions } from './shared';

/** The id of every animation an icon morph starts. */
export const ICON_MORPH_ID = 'icon-morph';

export interface IconMorphOptions extends PrimitiveOptions {
  /** The glyph that leaves. Optional: a morph may only bring a glyph in. */
  from?: Element | null;
  /** The glyph that arrives. */
  to?: Element | null;
  /** Degrees the old glyph turns as it leaves; the new one turns in from minus this. Default 90. Use 0 for no turn. */
  turn?: number;
}

/** Keyframes of the leaving glyph. */
export function iconOutFrames(turn: number, prefix = 'ds'): Keyframe[] {
  return [
    { transform: 'none', opacity: 1 },
    { transform: `rotate(${round(turn)}deg) scale(${scaleVar('scale.morph', prefix)})`, opacity: 0 },
  ];
}

/** Keyframes of the arriving glyph. */
export function iconInFrames(turn: number, prefix = 'ds'): Keyframe[] {
  return [
    { transform: `rotate(${round(-turn)}deg) scale(${scaleVar('scale.morph', prefix)})`, opacity: 0, offset: 0 },
    { opacity: 1, offset: 0.4 },
    { transform: 'none', opacity: 1, offset: 1 },
  ];
}

/** Plays the morph. Returns the animations it started. */
export function iconMorph(opts: IconMorphOptions): Animation[] {
  const mode = resolveMode(opts);
  if (mode === 'none') return [];
  const prefix = opts.prefix ?? 'ds';
  const turn = opts.turn ?? 90;
  if (mode === 'reduced') {
    return played([run(opts.from, fadeOnly('exit', { fill: 'forwards' }), `${ICON_MORPH_ID}-out`, prefix), run(opts.to, fadeOnly('enter'), `${ICON_MORPH_ID}-in`, prefix)]);
  }
  return played([
    run(opts.from, spec(iconOutFrames(turn, prefix), { duration: 'duration.morph', easing: 'ease.exit' }, { fill: 'forwards' }), `${ICON_MORPH_ID}-out`, prefix),
    run(opts.to, spec(iconInFrames(turn, prefix), springTiming('bouncy')), `${ICON_MORPH_ID}-in`, prefix),
  ]);
}

/**
 * Turns a glyph from one angle to another on the snappy spring. The element's
 * CSS should already hold the new angle; this plays the way there. Reduced and
 * mode `none`: nothing (the new angle shows at once).
 */
export function iconTurn(el: Element | null | undefined, fromDeg: number, toDeg: number, opts: PrimitiveOptions = {}): Animation | null {
  if (resolveMode(opts) !== 'full' || fromDeg === toDeg) return null;
  const prefix = opts.prefix ?? 'ds';
  return run(el, spec([{ transform: `rotate(${round(fromDeg)}deg)` }, { transform: `rotate(${round(toDeg)}deg)` }], springTiming('snappy')), `${ICON_MORPH_ID}-turn`, prefix);
}

/** Settles the parts of one glyph from `scale.morph`, one stagger step apart, on the bouncy spring. Reduced: a fade. */
export function iconParts(parts: Iterable<Element | null | undefined>, opts: PrimitiveOptions = {}): Animation[] {
  const mode = resolveMode(opts);
  if (mode === 'none') return [];
  const prefix = opts.prefix ?? 'ds';
  return played(
    [...parts].map((el, i) => {
      const step = Math.min(i, STAGGER_MAX_STEPS);
      const delay = mode === 'full' && step > 0 ? { delay: STAGGER_DELAY, delaySteps: step, fill: 'backwards' as FillMode } : {};
      const s =
        mode === 'reduced'
          ? fadeOnly('enter')
          : spec(
              [
                { transform: `scale(${scaleVar('scale.morph', prefix)})`, opacity: 0 },
                { transform: 'none', opacity: 1 },
              ],
              springTiming('bouncy'),
              delay,
            );
      return run(el, s, `${ICON_MORPH_ID}-part`, prefix);
    }),
  );
}
