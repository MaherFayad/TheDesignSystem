// Motion helpers of the text inputs and forms family (orders 1.21 to 1.23,
// proposed), one copy for both frameworks (order 1.29): the beats, the
// leaving copy, the error shake and the digit roll layer. React keeps its
// hooks (packages/react/src/components/Input/useErrorShake.ts,
// NumberField/useDigitLayer.ts) and Angular its wiring
// (packages/angular/src/internal/motion-fields.ts); both import this file
// from @the-system/motion.
//
// A beat is one Web Animations API animation with token timing: its
// duration, delay and ease are read from the element's live CSS variables,
// so a style changes the feel through its tokens and reduced motion (every
// duration and delay token 0ms) lands it at once. Transform and opacity
// move, and since order 1.23 the paint properties of the motion ruling
// (clip-path, stroke-dashoffset, box-shadow, colors). A keyframe may name an
// ease token in `easing` (`ease.spring-bouncy`) for the segment it starts, so one animation can hold an anticipation on
// one curve and a spring on another.
//
// Every beat takes the style's mode for its interaction (React's
// `useMotion().mode(id)`, Angular's `injectMotion().mode(id)`): `none` plays nothing, `reduced` plays the
// reduced beat (opacity only, or nothing), `full` plays the beat. A beat
// never holds its end frame unless it says so: the component CSS holds the
// rest look, and the beat plays the way there. Nothing waits on
// transitionend or animationend.
import {
  ANIMATION_ID_PREFIX,
  readDir,
  readDuration,
  readEasing,
  type DelayToken,
  type DurationToken,
  type EaseToken,
  type PatternMode,
} from '../core';
import { rollDigits } from '../primitives/digit-roll';
import { READABLE_AT, readableEnter } from '../primitives/shared';

/** A motion token as a CSS value with its base value as the fallback, for keyframes. */
export const token = {
  nudge: 'var(--ds-distance-nudge, 2px)',
  shift: 'var(--ds-distance-shift, 4px)',
  enter: 'var(--ds-distance-enter, 6px)',
  lift: 'var(--ds-distance-lift, 2px)',
  pop: 'var(--ds-scale-pop, 1.05)',
  anticipate: 'var(--ds-scale-anticipate, 0.95)',
  scaleEnter: 'var(--ds-scale-enter, 0.97)',
  morph: 'var(--ds-scale-morph, 0.5)',
} as const;

/** One animation of an interaction, with token timing. */
export interface Beat {
  keyframes: Keyframe[];
  duration: DurationToken;
  easing?: EaseToken | 'linear';
  delay?: DelayToken;
  /** How many delay steps to wait. Default 1 when `delay` is set. */
  steps?: number;
  fill?: FillMode;
  /** `add` plays on top of a transform the component CSS already holds (a check that wipes in). */
  composite?: CompositeOperation;
  /** The transform origin the keyframes assume. */
  origin?: string;
}

/** The fade a reduced beat plays: opacity only. */
export const fadeInBeat: Beat = {
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
  duration: 'duration.base',
  easing: 'ease.out',
};

function resolveFrames(el: Element, frames: Keyframe[]): Keyframe[] {
  return frames.map((f) => (typeof f.easing === 'string' && f.easing.startsWith('ease.') ? { ...f, easing: readEasing(el, f.easing as EaseToken) } : f));
}

/**
 * Plays a beat on `el` for an interaction. Returns the Animation, or null
 * when nothing plays (no element, no Web Animations API, mode `none`, or a
 * reduced mode with no reduced beat). A beat with the same id on the same
 * element is cancelled first, so a quick second trigger restarts it and
 * nothing stacks.
 */
export function playBeat(el: Element | null | undefined, beat: Beat, id: string, mode: PatternMode, reduced: Beat | null = fadeInBeat): Animation | null {
  if (!el || mode === 'none' || typeof el.animate !== 'function') return null;
  const b = mode === 'reduced' ? reduced : beat;
  if (!b) return null;
  const ownId = `${ANIMATION_ID_PREFIX}${id}`;
  if (typeof el.getAnimations === 'function') {
    for (const a of el.getAnimations()) if (a.id === ownId) a.cancel();
  }
  if (b.origin && el instanceof HTMLElement) el.style.transformOrigin = b.origin;
  const delay = b.delay ? readDuration(el, b.delay) * (b.steps ?? 1) : 0;
  return el.animate(resolveFrames(el, b.keyframes), {
    id: ownId,
    duration: readDuration(el, b.duration),
    easing: !b.easing || b.easing === 'linear' ? 'linear' : readEasing(el, b.easing),
    delay,
    fill: b.fill ?? (delay > 0 ? 'backwards' : 'none'),
    composite: b.composite ?? 'replace',
  });
}

/** A run of marks spreads over at most this many stagger steps, so a paste or a pick lands as one beat (Neutral about 230ms in all). */
export const RUN_SPREAD_STEPS = 2;

/** The delay step of mark `i` in a run of `n`, spread evenly over RUN_SPREAD_STEPS. */
export function runStep(i: number, n: number): number {
  return n <= 1 ? 0 : (RUN_SPREAD_STEPS * i) / (n - 1);
}

/** +1 when the inline end is on the right (LTR), -1 in RTL. */
export const inlineSign = (el: Element): 1 | -1 => (readDir(el) === 'rtl' ? -1 : 1);

/**
 * A pop that lands with an overshoot: the part dips to `scale.anticipate`
 * (on ease.out, the first quarter), then springs back past rest on the
 * bouncy spring and settles. The overshoot is the spring's own: Desk lands
 * about 25% past, Neutral about 6%, Studio steps with none.
 */
export function dipPop(extra: Partial<Beat> = {}): Beat {
  return {
    keyframes: [
      { transform: 'none', easing: 'ease.out' },
      {
        transform: `scale(${token.anticipate})`,
        offset: 0.25,
        easing: 'ease.spring-bouncy',
      },
      { transform: 'none' },
    ],
    duration: 'duration.spring-bouncy',
    easing: 'linear',
    origin: '50% 50%',
    ...extra,
  };
}

/**
 * A mark that arrives: it grows from `from` (default `scale.morph`) on the
 * bouncy spring, so it lands past full size and settles, while it fades in
 * over the first part of the travel.
 */
export function landPop(from: string = token.morph, extra: Partial<Beat> = {}): Beat {
  return {
    keyframes: [
      { transform: `scale(${from})`, opacity: 0, offset: 0 },
      { opacity: 1, offset: READABLE_AT },
      { transform: 'none', opacity: 1, offset: 1 },
    ],
    duration: 'duration.spring-bouncy',
    easing: 'ease.spring-bouncy',
    origin: '50% 50%',
    ...extra,
  };
}

/**
 * Text that slides in along the block axis from `distance.shift` above, on
 * the soft spring. Panels and text never overshoot. Opacity is full by
 * READABLE_AT of the run (Desk about 100ms), so text is never held below its
 * contrast for more than a moment; the transform carries the rest.
 */
export function slideIn(extra: Partial<Beat> = {}, from = `translateY(calc(-1 * ${token.shift}))`): Beat {
  return {
    keyframes: readableEnter(from),
    duration: 'duration.spring-soft',
    easing: 'ease.spring-soft',
    ...extra,
  };
}

/**
 * A message that comes out from under the control above it (order 1.23):
 * it slides down a full line from behind its own top edge, which a
 * clip-path holds still, so the text appears to emerge from under the
 * control rather than float in. Opacity is full by READABLE_AT; the soft
 * spring carries the slide. Text never overshoots.
 */
export function emerge(extra: Partial<Beat> = {}): Beat {
  return {
    keyframes: [
      { transform: 'translateY(-100%)', clipPath: 'inset(100% 0 0 0)', opacity: 0, offset: 0 },
      { opacity: 1, offset: READABLE_AT },
      { transform: 'none', clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 1 },
    ],
    duration: 'duration.spring-soft',
    easing: 'ease.spring-soft',
    ...extra,
  };
}

/** The fade a reduced exit plays: opacity only. */
export const fadeOutBeat: Beat = {
  keyframes: [{ opacity: 1 }, { opacity: 0 }],
  duration: 'duration.base',
  easing: 'ease.out',
};

/** A point of a clip-path polygon in percent of the box. */
const at = (x: number, y: number, flip: boolean) => (flip ? `${100 - x}% ${100 - y}%` : `${x}% ${y}%`);
const polygon = (points: [number, number][], flip: boolean) => `polygon(${points.map(([x, y]) => at(x, y, flip)).join(', ')})`;

/**
 * A diagonal wipe (order 1.23, password-reveal): a line at 45 degrees
 * travels across the box from the top left corner to the bottom right one
 * (`back` runs it the other way). `side: 'behind'` keeps what the line has
 * passed (the glyph that arrives), `side: 'ahead'` keeps what it has not
 * passed yet (the glyph that leaves), so two glyphs in one cell trade places
 * along the line, which reads as a slash drawn across an eye, or wiped off
 * it. Each frame is a five point polygon, so the line stays straight at
 * every step.
 */
export function diagonalWipe(side: 'behind' | 'ahead', back = false, extra: Partial<Beat> = {}): Beat {
  const behind: [number, number][][] = [
    [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [100, 0], [100, 0], [0, 100], [0, 100]],
    [[0, 0], [100, 0], [100, 100], [100, 100], [0, 100]],
  ];
  const ahead: [number, number][][] = [
    [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]],
    [[100, 0], [100, 0], [100, 100], [0, 100], [0, 100]],
    [[100, 100], [100, 100], [100, 100], [100, 100], [100, 100]],
  ];
  const frames = side === 'behind' ? behind : ahead;
  return {
    keyframes: frames.map((f, i) => ({ clipPath: polygon(f, back), offset: i / 2 })),
    duration: 'duration.morph',
    easing: 'ease.standard',
    ...extra,
  };
}

/**
 * A decorative copy of an element that leaves after React removed it: a
 * clone with no part, no id and no name, hidden from assistive technology
 * and from the pointer, placed over the box the element had, inside
 * `host` (a positioned element). The caller plays its exit and calls
 * `remove()` when the exit settles. It never holds a value of the form.
 */
export interface LeavingCopy {
  el: HTMLElement;
  remove: () => void;
}

/** The box of `el` relative to the padding box of `host`, read before the DOM changes. */
export interface Snapshot {
  node: HTMLElement;
  inlineStart: number;
  blockStart: number;
  inlineSize: number;
  blockSize: number;
}

export function snapshot(node: HTMLElement | null | undefined, host: HTMLElement | null | undefined): Snapshot | null {
  if (!node || !host) return null;
  const n = node.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  if (n.width === 0 && n.height === 0) return null;
  const rtl = readDir(host) === 'rtl';
  // The boxes are drawn pixels; the copy is placed in CSS pixels. They differ
  // under a zoom or a scale on an ancestor (a dialog while it scales in).
  const k = host.offsetWidth > 0 && h.width > 0 ? h.width / host.offsetWidth : 1;
  const copy = node.cloneNode(true) as HTMLElement;
  // A clone keeps the value attributes, not what the person typed: copy the live values.
  const from = node.querySelectorAll('input, textarea, select');
  const to = copy.querySelectorAll('input, textarea, select');
  from.forEach((f, i) => {
    const t = to[i];
    if (f instanceof HTMLInputElement && t instanceof HTMLInputElement) {
      t.value = f.value;
      t.checked = f.checked;
    } else if ((f instanceof HTMLTextAreaElement || f instanceof HTMLSelectElement) && t) (t as HTMLTextAreaElement).value = f.value;
  });
  return {
    node: copy,
    inlineStart: (rtl ? h.right - n.right : n.left - h.left) / k - host.clientLeft,
    blockStart: (n.top - h.top) / k - host.clientTop,
    inlineSize: n.width / k,
    blockSize: n.height / k,
  };
}

/** Puts a snapshot back into `host` as an inert, aria-hidden copy. */
export function leavingCopy(snap: Snapshot, host: HTMLElement): LeavingCopy {
  const el = snap.node;
  // The copy's own part goes, so no query or style finds a second one; inner parts keep their look.
  el.removeAttribute('data-part');
  el.removeAttribute('data-step');
  el.removeAttribute('hidden');
  for (const node of [el, ...el.querySelectorAll('*')]) {
    for (const name of ['id', 'name', 'for', 'aria-live', 'aria-labelledby', 'aria-describedby', 'aria-controls']) node.removeAttribute(name);
    if (node.getAttribute('role') === 'status' || node.getAttribute('role') === 'alert') node.removeAttribute('role');
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement || node instanceof HTMLButtonElement) {
      node.disabled = true;
      node.tabIndex = -1;
    }
  }
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('inert', '');
  const s = el.style;
  s.position = 'absolute';
  s.insetInlineStart = `${snap.inlineStart}px`;
  s.insetBlockStart = `${snap.blockStart}px`;
  s.inlineSize = `${snap.inlineSize}px`;
  s.blockSize = `${snap.blockSize}px`;
  s.margin = '0';
  s.pointerEvents = 'none';
  host.append(el);
  return { el, remove: () => el.remove() };
}

/** Removes `copy` once `anim` ends or is cancelled, or at once when nothing plays. */
export function dropAfter(anim: Animation | null, copy: LeavingCopy): void {
  if (!anim) {
    copy.remove();
    return;
  }
  anim.finished.then(copy.remove, copy.remove);
}

// ---------------------------------------------------------------- the error shake (error-shake)

/** The box that shakes for a native input: give a function defined once, outside the component. */
export type ShakeBox = (input: HTMLInputElement) => Element | null | undefined;

/** The input's parent: the root of Input, OTPField and NumberField. */
export const parentBox: ShakeBox = (input) => input.parentElement;

/** The interaction id in the registry and in the style presets. */
export const ERROR_SHAKE = 'error-shake';

/**
 * The swings of the shake with a settle, toward the inline end first (`sign`
 * is -1 in RTL): shift, about two thirds of it, then nudge, then half a
 * nudge, and the box eases back to rest, over duration.spring-bouncy on
 * ease.out. No luminance change, once per error: never a flash.
 */
export function shakeBeat(sign: 1 | -1): Beat {
  const x = (share: string) => ({
    transform: `translateX(calc(${sign} * ${share}))`,
  });
  return {
    keyframes: [
      { transform: 'none', offset: 0 },
      { ...x(token.shift), offset: 0.14 },
      { ...x(`-0.65 * ${token.shift}`), offset: 0.34 },
      { ...x(token.nudge), offset: 0.54 },
      { ...x(`-0.5 * ${token.nudge}`), offset: 0.74 },
      { transform: 'none', offset: 1 },
    ],
    duration: 'duration.spring-bouncy',
    easing: 'ease.out',
  };
}

/**
 * The shake of one field: `shake` plays it on the box of `input`, never
 * while a shake still plays. The reduced form is no motion: the error color
 * and the message carry the state. The framework decides when to call it
 * (the field turns invalid, or the input gets a native `invalid` event).
 */
export class ErrorShaker {
  private running: Animation | null = null;

  shake(input: HTMLInputElement | null | undefined, box: ShakeBox, mode: PatternMode): void {
    const target = input ? box(input) : null;
    if (!target || this.running?.playState === 'running') return;
    this.running = playBeat(target, shakeBeat(inlineSign(target)), ERROR_SHAKE, mode, null);
  }
}

// ---------------------------------------------------------------- the digit roll layer (field-step, scrub-roll)

/**
 * The digit roll layer of NumberField and ScrubInput. The input keeps its
 * text for editing, always. The roll plays in a decorative layer: an unnamed
 * span with aria-hidden="true", a child of the root, laid over the input's
 * box while a roll runs and empty at rest. While the layer holds digits, the
 * component CSS draws the input text transparent (the caret keeps its
 * color), and the layer clips the roll to the input's box. When the roll
 * settles, or the person types, the layer empties and the input text shows
 * again. The roll is `rollDigits`: each changed digit rolls in its own
 * column, from below when the value grew and from above when it fell.
 */
export interface DigitLayerControl {
  /** Rolls the layer from one text to the next over `input`. Plays nothing for mode `none` or without the Web Animations API. */
  roll: (input: HTMLInputElement | null | undefined, from: string, to: string, opts: { mode: PatternMode; direction?: 'up' | 'down' }) => void;
  /** Empties the layer at once, so the input text shows. */
  clear: () => void;
}

/**
 * The layer over an input: its box, as logical offsets from the root's
 * padding box. Read from layout offsets, not from the drawn box: under a
 * zoom or a transform on an ancestor (a page zoom, a dialog that scales in)
 * the drawn box is scaled and the layer would land off the input.
 */
export function placeDigitLayer(layer: HTMLElement, input: HTMLElement, root: HTMLElement): void {
  const s = layer.style;
  // The input's offsets are from the root's padding box when the root is its
  // offset parent (the component CSS positions the root); otherwise subtract the root's own.
  const own = input.offsetParent === root;
  const left = input.offsetLeft - (own ? 0 : root.offsetLeft + root.clientLeft);
  const top = input.offsetTop - (own ? 0 : root.offsetTop + root.clientTop);
  // Physical sides: the layer is direction ltr (digits read left to right),
  // so a logical inset would resolve against its own direction, not the root's.
  s.left = `${left}px`;
  s.top = `${top}px`;
  s.inlineSize = `${input.offsetWidth}px`;
  s.blockSize = `${input.offsetHeight}px`;
  // rollDigits keeps a display it finds; the layer centers its columns on the input's line.
  s.display = 'flex';
}

/**
 * The roll and the clear of one layer, read through `layer` at each call
 * (a React ref or an Angular view query). The framework empties the layer
 * on the input's `beforeinput` (typing, a paste or a cut shows the real
 * text at once).
 */
export function digitLayerControl(layer: () => HTMLElement | null | undefined): DigitLayerControl {
  let run = 0;
  const clear = () => {
    run += 1;
    const el = layer();
    if (!el || el.childElementCount === 0) return;
    for (const a of el.getAnimations?.({
      subtree: true,
    } as GetAnimationsOptions) ?? [])
      a.cancel();
    el.replaceChildren();
    el.style.display = '';
  };
  const roll: DigitLayerControl['roll'] = (target, from, to, { mode, direction }) => {
    const el = layer();
    const root = el?.parentElement;
    if (!el || !root || !target || mode === 'none' || typeof target.animate !== 'function') return;
    if (from === to || from.trim() === '' || to.trim() === '') {
      clear();
      return;
    }
    run += 1;
    const own = run;
    placeDigitLayer(el, target, root);
    // The digits drawn now are where the roll starts: a quick second step rolls on from them.
    const anims = rollDigits(el, from, to, { mode, direction });
    if (anims.length === 0) {
      el.replaceChildren();
      return;
    }
    const done = () => {
      if (own === run) clear();
    };
    void Promise.all(anims.map((a) => a.finished)).then(done, done);
  };
  return { roll, clear };
}
