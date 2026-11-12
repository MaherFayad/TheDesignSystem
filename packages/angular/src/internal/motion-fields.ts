// Motion helpers of the text inputs and forms family (orders 1.21 and 1.22),
// the Angular twin of packages/react/src/components/Input/fieldMotion.ts,
// Input/useErrorShake.ts and NumberField/useDigitLayer.ts.
//
// The first part is a copy of the framework free React helpers (beats, the
// shake, the leaving copy): lead change, move them into packages/motion so
// both frameworks import one file. The second part wires them the Angular
// way: `errorShake` and `digitLayer` run in an injection context and play
// from `afterRenderEffect` and DOM events, never on change detection timing.
//
// A beat is one Web Animations API animation with token timing: its
// duration, delay and ease are read from the element's live CSS variables,
// so a style changes the feel through its tokens and reduced motion (every
// duration and delay token 0ms) lands it at once. Only transform and opacity
// move. A keyframe may name an ease token in `easing` (`ease.spring-bouncy`)
// for the segment it starts.
//
// Every beat takes the style's mode for its interaction
// (`injectMotion().mode(id)`): `none` plays nothing, `reduced` plays the
// reduced beat (opacity only, or nothing), `full` plays the beat. A beat
// never holds its end frame unless it says so. Nothing waits on
// transitionend or animationend.
import { DestroyRef, afterNextRender, afterRenderEffect, inject } from '@angular/core';
import {
  ANIMATION_ID_PREFIX,
  READABLE_AT,
  readableEnter,
  readDir,
  readDuration,
  readEasing,
  rollDigits,
  type DelayToken,
  type DurationToken,
  type EaseToken,
  type PatternMode,
} from '@the-system/motion';
import { injectMotion } from './motion';

// Framework free part: a copy of packages/react/src/components/Input/fieldMotion.ts.

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
  /** `add` plays on top of a transform the component CSS already holds. */
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
 * element is cancelled first, so a quick second trigger restarts it.
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

/** A run of marks spreads over at most this many stagger steps, so a paste or a pick lands as one beat. */
export const RUN_SPREAD_STEPS = 2;

/** The delay step of mark `i` in a run of `n`, spread evenly over RUN_SPREAD_STEPS. */
export function runStep(i: number, n: number): number {
  return n <= 1 ? 0 : (RUN_SPREAD_STEPS * i) / (n - 1);
}

/** +1 when the inline end is on the right (LTR), -1 in RTL. */
export const inlineSign = (el: Element): 1 | -1 => (readDir(el) === 'rtl' ? -1 : 1);

/** A pop that dips to `scale.anticipate` on ease.out, then springs back past rest on the bouncy spring. */
export function dipPop(extra: Partial<Beat> = {}): Beat {
  return {
    keyframes: [
      { transform: 'none', easing: 'ease.out' },
      { transform: `scale(${token.anticipate})`, offset: 0.25, easing: 'ease.spring-bouncy' },
      { transform: 'none' },
    ],
    duration: 'duration.spring-bouncy',
    easing: 'linear',
    origin: '50% 50%',
    ...extra,
  };
}

/** A mark that arrives: it grows from `from` (default `scale.morph`) on the bouncy spring and fades in over the first part. */
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

/** Text that slides in along the block axis from `distance.shift` above, on the soft spring. Text never overshoots. */
export function slideIn(extra: Partial<Beat> = {}, from = `translateY(calc(-1 * ${token.shift}))`): Beat {
  return {
    keyframes: readableEnter(from),
    duration: 'duration.spring-soft',
    easing: 'ease.spring-soft',
    ...extra,
  };
}

/** A decorative copy of an element that leaves after the view removed it: inert, aria-hidden, over the box it had. */
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
    inlineStart: (rtl ? h.right - n.right : n.left - h.left) - host.clientLeft,
    blockStart: n.top - h.top - host.clientTop,
    inlineSize: n.width,
    blockSize: n.height,
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

// Framework free part: a copy of the shake of packages/react/src/components/Input/useErrorShake.ts.

/** The box that shakes for a native input. */
export type ShakeBox = (input: HTMLInputElement) => Element | null | undefined;

/** The input's parent: the root of Input, OTPField and NumberField. */
export const parentBox: ShakeBox = (input) => input.parentElement;

/** The interaction id in the registry and in the style presets. */
export const ERROR_SHAKE = 'error-shake';

/** The swings of the shake with a settle, toward the inline end first (`sign` is -1 in RTL). */
export function shakeBeat(sign: 1 | -1): Beat {
  const x = (share: string) => ({ transform: `translateX(calc(${sign} * ${share}))` });
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

// Angular part.

/**
 * error-shake: shakes the box of `input` when `invalid` turns on, and when
 * the input gets a native `invalid` event. Never on first paint of a field
 * that starts invalid, never while it stays invalid, never while a shake
 * still plays. The reduced form is no motion. Call in an injection context;
 * `input` and `invalid` are read after render, so a view query is ready.
 */
export function errorShake(input: () => HTMLInputElement | null | undefined, invalid: () => boolean, box: ShakeBox = parentBox): void {
  const motion = injectMotion();
  let running: Animation | null = null;
  const shake = () => {
    const el = input();
    const target = el ? box(el) : null;
    if (!target || running?.playState === 'running') return;
    running = playBeat(target, shakeBeat(inlineSign(target)), ERROR_SHAKE, motion.mode(ERROR_SHAKE), null);
  };
  let was: boolean | undefined;
  afterRenderEffect(() => {
    const now = invalid();
    const before = was;
    was = now;
    if (before === false && now) shake();
  });
  let listening: HTMLInputElement | null = null;
  afterNextRender(() => {
    listening = input() ?? null;
    listening?.addEventListener('invalid', shake);
  });
  inject(DestroyRef).onDestroy(() => listening?.removeEventListener('invalid', shake));
}

/** The digit roll layer of NumberField and ScrubInput (field-step, scrub-roll). */
export interface DigitLayer {
  /** Rolls the layer from one text to the next over `input`. Plays nothing for mode `none` or without the Web Animations API. */
  roll: (input: HTMLInputElement | null | undefined, from: string, to: string, opts: { mode: PatternMode; direction?: 'up' | 'down' }) => void;
  /** Empties the layer at once, so the input text shows. */
  clear: () => void;
}

/** The layer over an input: its box, as logical offsets from the root's padding box. */
function place(layer: HTMLElement, input: HTMLElement, root: HTMLElement): void {
  const i = input.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  const rtl = readDir(root) === 'rtl';
  const s = layer.style;
  s.insetInlineStart = `${(rtl ? r.right - i.right : i.left - r.left) - root.clientLeft}px`;
  s.insetBlockStart = `${i.top - r.top - root.clientTop}px`;
  s.inlineSize = `${i.width}px`;
  s.blockSize = `${i.height}px`;
  // rollDigits keeps a display it finds; the layer centers its columns on the input's line.
  s.display = 'flex';
}

/**
 * The port of React's useDigitLayer. `layer` is the unnamed aria-hidden span,
 * a child of the root, empty at rest; while it holds digits the component CSS
 * draws the input text transparent. Typing, a paste or a cut empties it at
 * once. Call in an injection context.
 */
export function digitLayer(layer: () => HTMLElement | null | undefined, input: () => HTMLInputElement | null | undefined): DigitLayer {
  let run = 0;
  const clear = () => {
    run += 1;
    const el = layer();
    if (!el || el.childElementCount === 0) return;
    for (const a of el.getAnimations?.({ subtree: true } as GetAnimationsOptions) ?? []) a.cancel();
    el.replaceChildren();
    el.style.display = '';
  };
  const roll: DigitLayer['roll'] = (target, from, to, { mode, direction }) => {
    const el = layer();
    const root = el?.parentElement;
    if (!el || !root || !target || mode === 'none' || typeof target.animate !== 'function') return;
    if (from === to || from.trim() === '' || to.trim() === '') {
      clear();
      return;
    }
    run += 1;
    const own = run;
    place(el, target, root);
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
  let listening: HTMLInputElement | null = null;
  afterNextRender(() => {
    listening = input() ?? null;
    listening?.addEventListener('beforeinput', clear);
  });
  inject(DestroyRef).onDestroy(() => listening?.removeEventListener('beforeinput', clear));
  return { roll, clear };
}
