// Stateful button morph (order 1.22): idle, loading, success and error as one
// choreography inside a button whose width never changes.
//
//   idle to loading:     the button dips to scale.anticipate and springs back
//                        (the press answered); the label rolls up and out;
//                        the spinner pops in one stagger step later.
//   loading to success:  the spinner shrinks away; the check turns in from
//                        minus 45 degrees, grows past rest and settles (the
//                        bouncy spring); the button swells to scale.pop once
//                        over duration.celebrate.
//   loading to error:    the spinner shrinks away; the error glyph pops in;
//                        the button shakes along the inline axis once.
//   success or error
//   to idle:             the glyph rolls down and out; the label rolls back
//                        in from below on the soft spring.
//   idle to success or
//   error (no loading):  the label rolls out and the glyph comes in as above.
//
// The component holds the rest look of each part for its current state in
// CSS (the label at opacity 0 while loading, the spinner at opacity 0 at
// rest, and so on), with every part stacked in one grid cell so the label
// keeps the width. This primitive only plays the way between two rest
// looks, with fill none: when it ends or is cancelled, each part sits where
// the CSS puts it. The state, the disabled state and the announcement never
// wait for it.
//
// Reduced: the parts cross fade, the button does not move. Mode `none`:
// nothing.
import { readDir } from '../core';
import { distanceVar, fadeOnly, negDistanceVar, played, resolveMode, run, scaleVar, spec, springTiming, STAGGER_DELAY, type PrimitiveOptions } from './shared';

/** The id of every animation a button morph starts. */
export const BUTTON_MORPH_ID = 'button-morph';

export type MorphState = 'idle' | 'loading' | 'success' | 'error';

/** The parts of the button the morph moves. Any may be missing. */
export interface MorphParts {
  root: Element | null | undefined;
  label?: Element | null;
  spinner?: Element | null;
  success?: Element | null;
  error?: Element | null;
}

/** The part that shows in a state. */
export function partFor(parts: MorphParts, state: MorphState): Element | null | undefined {
  if (state === 'loading') return parts.spinner;
  if (state === 'success') return parts.success;
  if (state === 'error') return parts.error;
  return parts.label;
}

/** Plays the way from one state to the next. Returns the animations it started. */
export function buttonMorph(parts: MorphParts, from: MorphState, to: MorphState, opts: PrimitiveOptions = {}): Animation[] {
  const mode = resolveMode(opts);
  if (mode === 'none' || from === to) return [];
  const prefix = opts.prefix ?? 'ds';
  const leaving = partFor(parts, from);
  const arriving = partFor(parts, to);
  if (mode === 'reduced') {
    return played([run(leaving, fadeOnly('exit'), `${BUTTON_MORPH_ID}-out`, prefix), run(arriving, fadeOnly('enter'), `${BUTTON_MORPH_ID}-in`, prefix)]);
  }
  const back = to === 'idle';
  const out: (Animation | null)[] = [];
  // The part that leaves rolls out: up when the button moves on, down when it goes back to rest.
  const outY = back ? distanceVar('distance.shift', prefix) : negDistanceVar('distance.shift', prefix);
  const leaveFrames: Keyframe[] =
    from === 'loading'
      ? [
          { transform: 'none', opacity: 1 },
          { transform: `scale(${scaleVar('scale.morph', prefix)})`, opacity: 0 },
        ]
      : [
          { transform: 'none', opacity: 1 },
          { transform: `translateY(${outY})`, opacity: 0 },
        ];
  out.push(run(leaving, spec(leaveFrames, { duration: 'duration.quick', easing: 'ease.exit' }), `${BUTTON_MORPH_ID}-out`, prefix));

  // The part that arrives, one stagger step after the leave starts.
  const delay = { delay: STAGGER_DELAY, delaySteps: 1, fill: 'backwards' as FillMode };
  if (to === 'idle') {
    out.push(
      run(
        arriving,
        spec(
          [
            { transform: `translateY(${negDistanceVar('distance.shift', prefix)})`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          springTiming('soft'),
          delay,
        ),
        `${BUTTON_MORPH_ID}-in`,
        prefix,
      ),
    );
  } else if (to === 'loading') {
    out.push(
      run(
        arriving,
        spec(
          [
            { transform: `scale(${scaleVar('scale.morph', prefix)})`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          springTiming('bouncy'),
          delay,
        ),
        `${BUTTON_MORPH_ID}-in`,
        prefix,
      ),
    );
    // Anticipation: the button dips and springs back. Its pressed color is CSS.
    out.push(
      run(
        parts.root,
        spec([{ transform: 'none' }, { transform: `scale(${scaleVar('scale.anticipate', prefix)})`, offset: 0.3 }, { transform: 'none' }], springTiming('snappy')),
        `${BUTTON_MORPH_ID}-root`,
        prefix,
      ),
    );
  } else {
    out.push(
      run(
        arriving,
        spec(
          [
            { transform: `rotate(${to === 'success' ? -45 : 0}deg) scale(${scaleVar('scale.morph', prefix)})`, opacity: 0, offset: 0 },
            { opacity: 1, offset: 0.4 },
            { transform: 'none', opacity: 1, offset: 1 },
          ],
          springTiming('bouncy'),
          delay,
        ),
        `${BUTTON_MORPH_ID}-in`,
        prefix,
      ),
    );
    if (to === 'success') {
      out.push(
        run(
          parts.root,
          spec([{ transform: 'none' }, { transform: `scale(${scaleVar('scale.pop', prefix)})`, offset: 0.35 }, { transform: 'none' }], { duration: 'duration.celebrate', easing: 'ease.out' }),
          `${BUTTON_MORPH_ID}-root`,
          prefix,
        ),
      );
    } else if (parts.root) {
      const d = readDir(parts.root) === 'rtl' ? -1 : 1;
      const x = (n: number) => `translateX(calc(${n * d} * ${distanceVar('distance.nudge', prefix)}))`;
      out.push(
        run(parts.root, spec([{ transform: 'none' }, { transform: x(1) }, { transform: x(-1) }, { transform: x(1) }, { transform: 'none' }], { duration: 'duration.celebrate', easing: 'ease.out' }), `${BUTTON_MORPH_ID}-root`, prefix),
      );
    }
  }
  return played(out);
}
