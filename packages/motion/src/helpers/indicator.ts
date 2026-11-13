// The shared sliding indicator of the navigation family (order 1.22,
// interaction round 2, proposed). One pill or mark slides from the item it
// leaves to the item it reaches for Tabs, SegmentedControl, ToggleGroup,
// Navbar, Sidebar, Rail, Pagination, Stepper and the hover pill of
// Breadcrumbs, and the small answers around it (labels that dip and pop,
// an icon that pops, an arrow that winds up, a label that rolls).
//
// One copy for both frameworks (order 1.29): React keeps its hooks in
// packages/react/src/internal/indicator.ts and Angular its wiring in
// packages/angular/src/internal/indicator.ts; both import this file from
// @the-system/motion, so timing, eases, keyframes and reduced motion are the
// same in both.
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
// - Mode `reduced` and `none` (the style's mode for the interaction, which
//   folds in the person's setting): no travel; the mark is at its new place
//   at once.
import { ANIMATION_ID_PREFIX, readDuration, readEasing, type MotionRect, type PatternMode } from '../core';
import { distancePx, durationMs, scaleValue } from '../tokens';

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

/** The box at `t` (0 to 1) of the way from `a` to `b`. Exported as rectBetween: the core already exports a `between`. */
export function rectBetween(a: MotionRect, b: MotionRect, t: number): MotionRect {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), width: lerp(a.width, b.width, t), height: lerp(a.height, b.height, t) };
}

/**
 * Box px per CSS px of an element: its CSS zoom (Element.currentCSSZoom),
 * 1 where the browser has none. Boxes are measured after zoom, a translate
 * is written before it (order 1.29, review N30).
 */
export function zoomOf(el: Element | null | undefined): number {
  const z = (el as { currentCSSZoom?: number } | null | undefined)?.currentCSSZoom;
  return typeof z === 'number' && Number.isFinite(z) && z > 0 ? z : 1;
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
 * along its travel halfway, then at rest. Center origin. The boxes are in
 * viewport px; `zoom` is the layer's box px per CSS px (zoomOf), so the
 * translate lands on `from` under CSS zoom too.
 */
export function slideFrames(from: MotionRect, to: MotionRect, stretchMax: number, axis: 'x' | 'y' | 'auto' = 'auto', ghost = false, zoom = 1): Keyframe[] {
  const fcx = from.x + from.width / 2;
  const fcy = from.y + from.height / 2;
  const tcx = to.x + to.width / 2;
  const tcy = to.y + to.height / 2;
  const dx = (fcx - tcx) / zoom;
  const dy = (fcy - tcy) / zoom;
  const along = axis === 'auto' ? (Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y') : axis;
  const travel = along === 'x' ? Math.abs(fcx - tcx) : Math.abs(fcy - tcy);
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

/** A slide worked out from reads only: its keyframes and timing. */
export interface SlidePlan {
  frames: Keyframe[];
  duration: number;
  easing: string;
}

/**
 * The slide of a layer that rests at `to` from `from` (both in viewport px),
 * from reads only (the spring and scale tokens), or null when nothing moves.
 */
export function planSlide(layer: Layer, from: MotionRect | null, to: MotionRect, opts: SlideOptions): SlidePlan | null {
  if (!from || opts.mode !== 'full' || !canAnimate(layer.el) || !usable(from) || !usable(to)) return null;
  if (Math.abs(from.x - to.x) < 0.5 && Math.abs(from.y - to.y) < 0.5 && Math.abs(from.width - to.width) < 0.5 && Math.abs(from.height - to.height) < 0.5) return null;
  const t = timing(layer.el, opts.spring ?? 'snappy');
  const frames = slideFrames(from, to, scaleOf(layer.el, 'stretch'), opts.axis, opts.ghost, zoomOf(layer.el));
  return { frames, duration: t.duration, easing: t.easing };
}

/** Starts a planned slide: the only write. */
export function startSlide(layer: Layer, plan: SlidePlan | null): Animation | null {
  if (!plan || !canAnimate(layer.el)) return null;
  return layer.el.animate(plan.frames, { id: SLIDE_ID, duration: plan.duration, easing: plan.easing, pseudoElement: layer.pseudo });
}

/**
 * Slides a layer that rests at `to` from `from` (both in viewport px). Call
 * `cancelSlide` and measure `to` first. Returns the animation, or null.
 */
export function slideTo(layer: Layer, from: MotionRect, to: MotionRect, opts: SlideOptions): Animation | null {
  return startSlide(layer, planSlide(layer, from, to, opts));
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

/** Where the pill is drawn now, relative to the anchor: inside a running slide, or at its rest box. */
function liveLocal(track: IndicatorTrack): MotionRect | null {
  const a = track.anim;
  if (a && track.from && track.to && a.playState === 'running') {
    const total = Number(a.effect?.getComputedTiming().duration ?? 0);
    const now = Number(a.currentTime ?? 0);
    if (total > 0) return rectBetween(track.from, track.to, Math.min(1, Math.max(0, now / total)));
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

/** A follow worked out from reads only. */
export interface FollowPlan {
  /** The slide, or null when the pill jumps (first paint, same key, reduced motion). */
  slide: SlidePlan | null;
  /** The rest box of the pill, in viewport px. */
  to: MotionRect;
  /** Starts the slide and the answers and remembers the box. Call once, after every read of the frame. */
  write(): Animation | null;
}

/** The slides this file started on a layer. */
function slidesOn(layer: Layer): Animation[] {
  const el = layer.el;
  if (typeof el.getAnimations !== 'function') return [];
  return el.getAnimations({ subtree: Boolean(layer.pseudo) } as GetAnimationsOptions).filter((a) => {
    if (String(a.id) !== SLIDE_ID) return false;
    const target = (a.effect as KeyframeEffect | null)?.pseudoElement ?? null;
    return (layer.pseudo ?? null) === target && ((a.effect as KeyframeEffect | null)?.target ?? el) === el;
  });
}

/**
 * The reads of followIndicator, with its writes held in `write` (order
 * 1.29, review B14): a list can read in its commit and write after every
 * other list has read (see inFrame), so one press costs one style pass.
 */
export function planFollow(track: IndicatorTrack, key: string, layer: Layer, opts: FollowOptions): FollowPlan {
  const running = slidesOn(layer);
  // A slide on an element moves its box, so it ends before the box is read
  // (a write, but rare: the pill is usually a new element). A pseudo
  // element's box is read from its computed offsets, which a transform leaves alone.
  if (running.length && !layer.pseudo) for (const a of running) a.cancel();
  const to = layerRect(layer);
  const changed = track.key !== null && track.key !== key && opts.slide !== false;
  const last = changed ? liveLocal(track) : null;
  const from = last ? fromLocal(last, opts.anchor) : null;
  const local = toLocal(to, opts.anchor);
  const slide = planSlide(layer, from, to, opts);
  return {
    slide,
    to,
    write() {
      for (const a of running) a.cancel();
      const anim = startSlide(layer, slide);
      if (from) answerLabels(track.label, opts.label ?? null, opts.mode);
      track.key = key;
      track.el = layer.el;
      track.rect = local;
      track.anim = anim;
      track.from = anim ? last : null;
      track.to = anim ? local : null;
      track.label = opts.label ?? null;
      return anim;
    },
  };
}

/**
 * Call after the commit that made `key` current, with the pill layer of that
 * item. Slides from the box of the last key when the key changed, makes the
 * labels answer, and remembers the new box.
 */
export function followIndicator(track: IndicatorTrack, key: string, layer: Layer, opts: FollowOptions): Animation | null {
  return planFollow(track, key, layer, opts).write();
}

// ---------------------------------------------------------------- one style pass per commit

/** A job of inFrame: reads, and returns its writes (or nothing). */
export type FrameJob = () => (() => void) | void;

let frameJobs: FrameJob[] | null = null;

function flushFrame(): void {
  const jobs = frameJobs ?? [];
  frameJobs = null;
  const writes: (() => void)[] = [];
  const fail = (e: unknown) => queueMicrotask(() => {
    throw e;
  });
  for (const job of jobs) {
    try {
      const w = job();
      if (w) writes.push(w);
    } catch (e) {
      fail(e);
    }
  }
  for (const w of writes) {
    try {
      w();
    } catch (e) {
      fail(e);
    }
  }
}

/**
 * Runs `job` in one microtask with every other job queued in the same task:
 * first every job's reads, then every write a job returns (order 1.29,
 * review B14). Queue it from a layout effect (React) or an after render hook
 * (Angular): the microtask runs after the commit, before the frame is
 * painted, so the first frame already draws the slide; and the reads of the
 * whole commit (other lists, Radix's own) share one style pass instead of
 * one per write.
 */
export function inFrame(job: FrameJob): void {
  if (!frameJobs) {
    frameJobs = [];
    queueMicrotask(flushFrame);
  }
  frameJobs.push(job);
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

// ---------------------------------------------------------------- runners for the framework wiring

/**
 * A runner for "after a render where `active` turned from false to true"
 * (never on the first paint): call it with the current value after each
 * render. React's useActivated and Angular's afterRenderEffect wiring use it.
 */
export function activated(effect: () => void): (active: boolean) => void {
  let prev: boolean | null = null;
  return (active: boolean) => {
    const was = prev;
    prev = active;
    if (was === false && active) effect();
  };
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
 * fades each pill in and out; this only moves it. Touch does nothing. The
 * options may be a function, read at each pointer move (React passes its
 * latest props). Returns the function that stops it.
 */
export function hoverFollow(root: Element, options: HoverFollowOptions | (() => HoverFollowOptions)): () => void {
  const opts = typeof options === 'function' ? options : () => options;
  let last: Element | null = null;
  let leftAt = -Infinity;
  const itemOf = (target: EventTarget | null): Element | null => {
    const el = target instanceof Element ? target.closest(opts().item) : null;
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
    const o = opts();
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
}
