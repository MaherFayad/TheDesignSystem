'use client';
// The shared sliding indicator of the navigation family (order 1.22,
// interaction round 2, proposed). One pill or mark slides from the item it
// leaves to the item it reaches for Tabs, SegmentedControl, ToggleGroup,
// Navbar, Sidebar, Rail, Pagination, Stepper and the hover pill of
// Breadcrumbs, and the small answers around it (labels that dip and pop,
// an icon that pops, an arrow that winds up, a label that rolls).
//
// - Only transform and opacity animate, with the Web Animations API. Timing
//   comes from the live spring tokens on the element (ease.spring-*,
//   duration.spring-*), so each style keeps its feel: Neutral restrained,
//   Desk long with overshoot, Studio in steps.
// - The layer that moves is decorative: an aria-hidden element or a pseudo
//   element of an item (the WAAPI `pseudoElement` option). Hit areas never
//   move; the item is at its place from the first frame.
// - Boxes are measured, so right to left needs nothing. The transform is
//   worked out for the default transform origin (the center), so a layer must
//   not set its own origin.
// - The travel stretches along its axis by up to scale.stretch, more for a
//   longer hop, and settles on the spring (which passes rest where the style's
//   spring overshoots).
// - A second change while a slide plays starts from where the pill is drawn,
//   not from where it was headed. Nothing waits on an animation event.
// - Mode `reduced` and `none` (from useMotion().mode, which folds in the
//   person's setting): no travel; the mark is at its new place at once.
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { ANIMATION_ID_PREFIX, distancePx, durationMs, readDuration, readEasing, scaleValue, type MotionRect, type PatternMode } from '@the-system/motion';

export type Pseudo = '::before' | '::after';

/** What moves: an element, or one of its pseudo elements. */
export interface Layer {
  el: Element;
  pseudo?: Pseudo;
}

type SpringName = 'soft' | 'snappy' | 'bouncy';

/** The id of every animation this file starts. */
export const SLIDE_ID = `${ANIMATION_ID_PREFIX}indicator-slide`;
export const ANSWER_ID = `${ANIMATION_ID_PREFIX}indicator-answer`;

const num = (value: string | undefined, fallback: number): number => {
  const n = Number.parseFloat(value ?? '');
  return Number.isFinite(n) ? n : fallback;
};

const round = (n: number, digits = 3): number => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

function readVar(el: Element, name: string): string {
  if (typeof getComputedStyle !== 'function') return '';
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** A scale token read live on the element, with its base value as the fallback. */
export function scaleOf(el: Element, name: 'stretch' | 'anticipate' | 'pop' | 'enter'): number {
  return num(readVar(el, `--ds-scale-${name}`), scaleValue[`scale.${name}`]);
}

/** A distance token read live on the element, in px. */
export function distanceOf(el: Element, name: 'nudge' | 'shift' | 'enter' | 'lift'): number {
  return num(readVar(el, `--ds-distance-${name}`), distancePx[`distance.${name}`]);
}

function timing(el: Element, spring: SpringName): { duration: number; easing: string } {
  return { duration: readDuration(el, `duration.spring-${spring}`), easing: readEasing(el, `ease.spring-${spring}`) };
}

const canAnimate = (el: Element | null | undefined): el is Element => Boolean(el && typeof el.animate === 'function');

/** -1 in a right to left layout, else 1: the sign of a move toward the inline end. */
export function inlineSign(el: Element): 1 | -1 {
  if (typeof getComputedStyle !== 'function') return 1;
  return getComputedStyle(el).direction === 'rtl' ? -1 : 1;
}

// ---------------------------------------------------------------- boxes

/** The box of a layer at rest, in viewport px. A pseudo element is read from its computed offsets. */
export function layerRect(layer: Layer): MotionRect {
  const r = layer.el.getBoundingClientRect();
  if (!layer.pseudo || typeof getComputedStyle !== 'function') return { x: r.x, y: r.y, width: r.width, height: r.height };
  const cs = getComputedStyle(layer.el, layer.pseudo);
  const host = layer.el as HTMLElement;
  return {
    x: r.x + (host.clientLeft || 0) + num(cs.left, 0),
    y: r.y + (host.clientTop || 0) + num(cs.top, 0),
    width: num(cs.width, r.width),
    height: num(cs.height, r.height),
  };
}

/** A box relative to an anchor (with its scroll), so it survives a page or list scroll. */
export function toLocal(r: MotionRect, anchor: Element): MotionRect {
  const a = anchor.getBoundingClientRect();
  return { x: r.x - a.x + anchor.scrollLeft, y: r.y - a.y + anchor.scrollTop, width: r.width, height: r.height };
}

/** A box relative to an anchor back in viewport px. */
export function fromLocal(r: MotionRect, anchor: Element): MotionRect {
  const a = anchor.getBoundingClientRect();
  return { x: r.x + a.x - anchor.scrollLeft, y: r.y + a.y - anchor.scrollTop, width: r.width, height: r.height };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The box between two boxes at progress t. */
export function between(a: MotionRect, b: MotionRect, t: number): MotionRect {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), width: lerp(a.width, b.width, t), height: lerp(a.height, b.height, t) };
}

const usable = (r: MotionRect | null | undefined): r is MotionRect => Boolean(r && (r.width >= 1 || r.height >= 1));

// ---------------------------------------------------------------- the slide

export interface SlideOptions {
  /** The style's mode for this interaction, from useMotion().mode(id). */
  mode: PatternMode;
  /** The axis that stretches. Default auto: the longer travel. */
  axis?: 'x' | 'y' | 'auto';
  /** A mark that is only drawn while it travels: it fades out as it lands. */
  ghost?: boolean;
  /** Default snappy. */
  spring?: SpringName;
}

/** Cancels a running slide on a layer, so it is measured at rest. */
export function cancelSlide(layer: Layer): void {
  const el = layer.el;
  if (typeof el.getAnimations !== 'function') return;
  for (const a of el.getAnimations({ subtree: Boolean(layer.pseudo) } as GetAnimationsOptions)) {
    if (String(a.id) !== SLIDE_ID) continue;
    const target = (a.effect as KeyframeEffect | null)?.pseudoElement ?? null;
    if ((layer.pseudo ?? null) === target && ((a.effect as KeyframeEffect | null)?.target ?? el) === el) a.cancel();
  }
}

/**
 * The keyframes that draw a layer resting at `to` over `from`, stretched
 * along its travel halfway, then at rest. Center origin.
 */
export function slideFrames(from: MotionRect, to: MotionRect, stretchMax: number, axis: 'x' | 'y' | 'auto' = 'auto', ghost = false): Keyframe[] {
  const fcx = from.x + from.width / 2;
  const fcy = from.y + from.height / 2;
  const tcx = to.x + to.width / 2;
  const tcy = to.y + to.height / 2;
  const dx = fcx - tcx;
  const dy = fcy - tcy;
  const along = axis === 'auto' ? (Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y') : axis;
  const travel = along === 'x' ? Math.abs(dx) : Math.abs(dy);
  const size = Math.max(1, along === 'x' ? to.width : to.height);
  const s = 1 + (stretchMax - 1) * Math.min(1, travel / size);
  const w = Math.max(1, to.width);
  const h = Math.max(1, to.height);
  const mw = ((from.width + to.width) / 2) * (along === 'x' ? s : 1);
  const mh = ((from.height + to.height) / 2) * (along === 'y' ? s : 1);
  const first: Keyframe = { transform: `translate(${round(dx, 2)}px, ${round(dy, 2)}px) scale(${round(from.width / w)}, ${round(from.height / h)})`, offset: 0 };
  const mid: Keyframe = { transform: `translate(${round(dx / 2, 2)}px, ${round(dy / 2, 2)}px) scale(${round(mw / w)}, ${round(mh / h)})`, offset: 0.45 };
  const last: Keyframe = { transform: 'none', offset: 1 };
  if (ghost) {
    first.opacity = 1;
    mid.opacity = 1;
    last.opacity = 0;
  }
  return [first, mid, last];
}

/**
 * Slides a layer that rests at `to` from `from` (both in viewport px). Call
 * `cancelSlide` and measure `to` first. Returns the animation, or null.
 */
export function slideTo(layer: Layer, from: MotionRect, to: MotionRect, opts: SlideOptions): Animation | null {
  if (opts.mode !== 'full' || !canAnimate(layer.el) || !usable(from) || !usable(to)) return null;
  if (Math.abs(from.x - to.x) < 0.5 && Math.abs(from.y - to.y) < 0.5 && Math.abs(from.width - to.width) < 0.5 && Math.abs(from.height - to.height) < 0.5) return null;
  const t = timing(layer.el, opts.spring ?? 'snappy');
  const frames = slideFrames(from, to, scaleOf(layer.el, 'stretch'), opts.axis, opts.ghost);
  return layer.el.animate(frames, { id: SLIDE_ID, duration: t.duration, easing: t.easing, pseudoElement: layer.pseudo });
}

/** Slides a layer from `from` to where it rests now. */
export function slideIndicator(layer: Layer, from: MotionRect, opts: SlideOptions): Animation | null {
  cancelSlide(layer);
  return slideTo(layer, from, layerRect(layer), opts);
}

// ---------------------------------------------------------------- a track: the pill of one list

/** Where the pill of one list was last drawn, so the next change slides from there. */
export interface IndicatorTrack {
  key: string | null;
  el: Element | null;
  /** The rest box, relative to the anchor. */
  rect: MotionRect | null;
  /** The slide in flight, with its ends relative to the anchor. */
  anim: Animation | null;
  from: MotionRect | null;
  to: MotionRect | null;
  label: Element | null;
}

export function createTrack(): IndicatorTrack {
  return { key: null, el: null, rect: null, anim: null, from: null, to: null, label: null };
}

/** A track kept for the life of a component. */
export function useIndicatorTrack(): IndicatorTrack {
  const ref = useRef<IndicatorTrack | null>(null);
  if (!ref.current) ref.current = createTrack();
  return ref.current;
}

/** Where the pill is drawn now, relative to the anchor: inside a running slide, or at its rest box. */
function liveLocal(track: IndicatorTrack): MotionRect | null {
  const a = track.anim;
  if (a && track.from && track.to && a.playState === 'running') {
    const total = Number(a.effect?.getComputedTiming().duration ?? 0);
    const now = Number(a.currentTime ?? 0);
    if (total > 0) return between(track.from, track.to, Math.min(1, Math.max(0, now / total)));
  }
  return track.rect;
}

export interface FollowOptions extends SlideOptions {
  /** The element that holds the pill and moves with the list (the list, or the root). */
  anchor: Element;
  /** The label of the item the pill reaches: it answers with a small pop. */
  label?: Element | null;
  /** False while the item the pill left is still current (two current items): no slide, no answer. */
  slide?: boolean;
}

/**
 * Call after the commit that made `key` current, with the pill layer of that
 * item. Slides from the box of the last key when the key changed, makes the
 * labels answer, and remembers the new box.
 */
export function followIndicator(track: IndicatorTrack, key: string, layer: Layer, opts: FollowOptions): Animation | null {
  cancelSlide(layer);
  const to = layerRect(layer);
  const changed = track.key !== null && track.key !== key && opts.slide !== false;
  let anim: Animation | null = null;
  const last = changed ? liveLocal(track) : null;
  if (changed && last) {
    anim = slideTo(layer, fromLocal(last, opts.anchor), to, opts);
    answerLabels(track.label, opts.label ?? null, opts.mode);
  }
  track.key = key;
  track.el = layer.el;
  track.rect = toLocal(to, opts.anchor);
  track.anim = anim;
  track.from = anim ? last : null;
  track.to = anim ? track.rect : null;
  track.label = opts.label ?? null;
  return anim;
}

// ---------------------------------------------------------------- small answers

function answer(el: Element | null | undefined, frames: Keyframe[], spring: SpringName, mode: PatternMode, easing?: string): Animation | null {
  if (mode !== 'full' || !canAnimate(el)) return null;
  const t = timing(el, spring);
  for (const a of el.getAnimations?.() ?? []) if (String(a.id) === ANSWER_ID) a.cancel();
  return el.animate(frames, { id: ANSWER_ID, duration: t.duration, easing: easing ?? t.easing, composite: 'add' });
}

/**
 * The label the pill reaches pops from scale.anticipate past rest and
 * settles (bouncy spring); the label it leaves dips to scale.anticipate and
 * comes back (soft spring). Added to any transform the label already has.
 */
export function answerLabels(leaving: Element | null, reaching: Element | null, mode: PatternMode): void {
  if (leaving && leaving !== reaching && leaving.isConnected) {
    const a = scaleOf(leaving, 'anticipate');
    answer(leaving, [{ transform: 'none' }, { transform: `scale(${a})`, offset: 0.35 }, { transform: 'none' }], 'soft', mode, readEasing(leaving, 'ease.out'));
  }
  if (reaching) {
    const a = scaleOf(reaching, 'anticipate');
    answer(reaching, [{ transform: `scale(${a})` }, { transform: 'none' }], 'bouncy', mode);
  }
}

/** A mark that lands: from scale.anticipate past rest and back (bouncy spring), added to its own transform. */
export function popIn(el: Element | null | undefined, mode: PatternMode): Animation | null {
  if (!el) return null;
  const a = scaleOf(el, 'anticipate');
  return answer(el, [{ transform: `scale(${a})` }, { transform: 'none' }], 'bouncy', mode);
}

/**
 * A mark that a CSS transition already moves (the TableOfContents bar)
 * stretches along its travel and settles, added to its own transform. The
 * trailing edge stays: the origin is the edge it leaves from. Plays over the
 * snappy spring's time with the standard ease, so it peaks mid travel.
 */
export function stretchAlong(el: HTMLElement | null | undefined, axis: 'x' | 'y', forward: boolean, mode: PatternMode): Animation | null {
  if (!el || mode !== 'full' || !canAnimate(el)) return null;
  const s = scaleOf(el, 'stretch');
  el.style.transformOrigin = axis === 'y' ? (forward ? '50% 0' : '50% 100%') : forward ? '0 50%' : '100% 50%';
  const mid = axis === 'y' ? `scale(1, ${s})` : `scale(${s}, 1)`;
  for (const a of el.getAnimations?.() ?? []) if (String(a.id) === SLIDE_ID) a.cancel();
  return el.animate([{ transform: 'none' }, { transform: mid, offset: 0.4 }, { transform: 'none' }], {
    id: SLIDE_ID,
    duration: readDuration(el, 'duration.spring-snappy'),
    easing: readEasing(el, 'ease.standard'),
    composite: 'add',
  });
}

/**
 * An arrow that winds up before it goes: back by distance.nudge, then
 * forward by distance.shift, then home. `sign` is 1 toward the inline end in
 * physical px (pass inlineSign for "next"), -1 the other way.
 */
export function windUp(el: Element | null | undefined, sign: 1 | -1, mode: PatternMode): Animation | null {
  if (!el) return null;
  const back = distanceOf(el, 'nudge') * -sign;
  const go = distanceOf(el, 'shift') * sign;
  return answer(
    el,
    [
      { transform: 'none', offset: 0 },
      { transform: `translateX(${back}px)`, offset: 0.25 },
      { transform: `translateX(${go}px)`, offset: 0.6 },
      { transform: 'none', offset: 1 },
    ],
    'bouncy',
    mode,
    readEasing(el, 'ease.out'),
  );
}

/**
 * A label that rolls to a new text: a copy of the old text rolls out (up when
 * `dir` is up) and the host rolls in from the other side, on the snappy
 * spring. The copy is aria-hidden and removed when its roll ends or is
 * cancelled. The host must be a box (inline-block) inside a positioned
 * parent. Reduced: the host fades in. None: nothing.
 */
/** The copy of the old text a roll draws, by host, so a second roll removes the first. */
const rollCopies = new WeakMap<HTMLElement, HTMLElement>();

export function rollText(host: HTMLElement | null | undefined, oldText: string, dir: 'up' | 'down', mode: PatternMode): Animation[] {
  if (!host || mode === 'none' || !canAnimate(host) || !oldText || host.textContent === oldText) return [];
  const t = timing(host, 'snappy');
  for (const a of host.getAnimations?.() ?? []) if (String(a.id) === ANSWER_ID) a.cancel();
  const parent = host.parentElement;
  rollCopies.get(host)?.remove();
  rollCopies.delete(host);
  if (mode === 'reduced') return [host.animate([{ opacity: 0 }, { opacity: 1 }], { id: ANSWER_ID, duration: readDuration(host, 'duration.base'), easing: readEasing(host, 'ease.out') })];
  const sign = dir === 'up' ? 1 : -1;
  const out: Animation[] = [];
  out.push(host.animate([{ transform: `translateY(${100 * sign}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { id: ANSWER_ID, ...t }));
  if (parent) {
    const copy = host.ownerDocument.createElement('span');
    copy.setAttribute('aria-hidden', 'true');
    copy.textContent = oldText;
    const s = copy.style;
    s.position = 'absolute';
    // offsetLeft and offsetTop are physical px from the positioned parent, so place the copy physically.
    s.left = `${host.offsetLeft}px`;
    s.top = `${host.offsetTop}px`;
    s.whiteSpace = 'nowrap';
    s.pointerEvents = 'none';
    copy.dir = 'auto';
    parent.append(copy);
    rollCopies.set(host, copy);
    const a = copy.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-100 * sign}%)`, opacity: 0 }], { id: ANSWER_ID, ...t, fill: 'forwards' });
    const drop = () => copy.remove();
    a.finished.then(drop, drop);
    out.push(a);
  }
  return out;
}

// ---------------------------------------------------------------- hooks

/** Runs `effect` after a commit where `active` turned from false to true (never on the first paint). */
export function useActivated(active: boolean, effect: () => void): void {
  const prev = useRef<boolean | null>(null);
  const run = useRef(effect);
  run.current = effect;
  useLayoutEffect(() => {
    const was = prev.current;
    prev.current = active;
    if (was === false && active) run.current();
  }, [active]);
}

export interface HoverFollowOptions {
  /** A selector for the items, matched with closest() from the pointer target. */
  item: string;
  /** The pseudo element of each item that draws the hover pill. */
  pseudo: Pseudo;
  /** The style's mode, read when the pointer moves. */
  mode: () => PatternMode;
}

/**
 * A hover pill that follows the pointer from item to item: when the pointer
 * enters an item within a short beat (duration.slow) of leaving another, the
 * new item's pill slides from the old one, stretching along the way. CSS
 * fades each pill in and out; this only moves it. Touch does nothing.
 */
export function useHoverFollow(rootRef: RefObject<Element | null>, opts: HoverFollowOptions): void {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let last: Element | null = null;
    let leftAt = -Infinity;
    const itemOf = (target: EventTarget | null): Element | null => {
      const o = optsRef.current;
      const el = target instanceof Element ? target.closest(o.item) : null;
      return el && root.contains(el) ? el : null;
    };
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const over = (event: Event) => {
      const e = event as PointerEvent;
      if (e.pointerType === 'touch') return;
      const item = itemOf(e.target);
      if (!item || item === last) return;
      const from = last;
      const recent = now() - leftAt <= (readDuration(root, 'duration.slow') || durationMs['duration.slow']);
      last = item;
      if (!from || !from.isConnected || !recent) return;
      const o = optsRef.current;
      slideIndicator({ el: item, pseudo: o.pseudo }, layerRect({ el: from, pseudo: o.pseudo }), { mode: o.mode(), axis: 'auto', spring: 'snappy' });
    };
    const out = (event: Event) => {
      const e = event as PointerEvent;
      const item = itemOf(e.target);
      if (!item) return;
      const to = e.relatedTarget instanceof Node ? e.relatedTarget : null;
      if (to && item.contains(to)) return;
      leftAt = now();
    };
    root.addEventListener('pointerover', over);
    root.addEventListener('pointerout', out);
    return () => {
      root.removeEventListener('pointerover', over);
      root.removeEventListener('pointerout', out);
    };
  }, [rootRef]);
}
