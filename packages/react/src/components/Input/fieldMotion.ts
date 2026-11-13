'use client';
// Motion helpers of the text inputs and forms family (order 1.22, proposed).
//
// A beat is one Web Animations API animation with token timing: its
// duration, delay and ease are read from the element's live CSS variables,
// so a style changes the feel through its tokens and reduced motion (every
// duration and delay token 0ms) lands it at once. Transform and opacity
// move, and since order 1.23 the paint properties of the motion ruling
// (clip-path, stroke-dashoffset, box-shadow, colors). A keyframe may name an ease token in `easing` (`ease.spring-bouncy`)
// for the segment it starts, so one animation can hold an anticipation on
// one curve and a spring on another.
//
// Every beat takes the style's mode for its interaction
// (`useMotion().mode(id)`): `none` plays nothing, `reduced` plays the
// reduced beat (opacity only, or nothing), `full` plays the beat. A beat
// never holds its end frame unless it says so: the component CSS holds the
// rest look, and the beat plays the way there. Nothing waits on
// transitionend or animationend.
import {
  ANIMATION_ID_PREFIX,
  READABLE_AT,
  readableEnter,
  readDir,
  readDuration,
  readEasing,
  type DelayToken,
  type DurationToken,
  type EaseToken,
  type PatternMode,
} from '@the-system/motion';

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
