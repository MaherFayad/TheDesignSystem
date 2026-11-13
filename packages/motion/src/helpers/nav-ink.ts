// The ink of the shared pill (order 1.23, interaction round 3, proposed).
// While the pill of a list slides from one item to the next, the text under
// it takes the selected color exactly where the pill is, and only there: a
// label half under the pill is half in each color.
//
// How: for the slide that helpers/indicator.ts started, every label the
// pill passes gets a twin, a copy in the selected color laid over it
// (aria-hidden, inert, data-part="label-ink", no pointer). Each twin is cut
// with clip-path to the pill's box along the travel axis, keyframe for
// keyframe with the slide (the same offsets, duration and easing, read from
// the slide itself), so the cut and the pill stay together, stretch
// included. While the twins play, the label of the item the pill reaches
// holds the rest color under its twin, so it turns only where the pill
// covers it. The twins leave the page when their animation ends or is
// cancelled; a second change first takes out the twins of the first.
// Nothing waits on an animation event: the color of every label is right
// with no twin at all.
//
// Order 1.29 (review B2, B14, N30):
// - No ink under forced colors, or when the pill is not drawn (a style or
//   forced colors hides it): the selected label is then the system's
//   selected text from the first frame.
// - A style that turns the ink off (`switch`) is read first, before any
//   other read.
// - Every box, offset and color is read before the first write, so one
//   press costs one style and layout pass, not one per label. The twins are
//   built once per label and kept (off the page) for the next slide; only
//   their inline look is written again. Labels the pill never passes get no
//   twin. Only clip-path animates.
// - A slide's translate is in the pill's CSS px; under CSS zoom (or a scaled
//   ancestor) a CSS px is not a box px, so the boxes scale by the zoom.
//
// One copy for both frameworks (order 1.29): React (Tabs, SegmentedControl,
// ToggleGroup, Navbar, Sidebar, Rail) and Angular (SegmentedControl,
// ToggleGroup) import it from @the-system/motion.
import { ANIMATION_ID_PREFIX, type MotionRect } from '../core';
import { zoomOf } from './indicator';

export const INK_ID = `${ANIMATION_ID_PREFIX}indicator-ink`;

/** The part name of a twin. */
export const INK_PART = 'label-ink';

interface InkState {
  twins: HTMLElement[];
  /** The clip of each twin and the holds of the reached labels. */
  holds: Animation[];
}

const states = new WeakMap<Element, InkState>();

/** The twin built for a part, kept for the next slide while the part's markup is the same. */
const twinCache = new WeakMap<Element, { html: string; twin: HTMLElement }>();

/** Takes the twins a list drew off the page and ends its holds, if any. */
export function clearInk(anchor: Element): void {
  const s = states.get(anchor);
  if (!s) return;
  for (const t of s.twins) t.remove();
  for (const h of s.holds) h.cancel();
  states.delete(anchor);
}

const num = (s: string | undefined): number => {
  const n = Number.parseFloat(s ?? '');
  return Number.isFinite(n) ? n : 0;
};

/**
 * The box the slide draws at each of its keyframes, in viewport px. The
 * slide is `translate(dx, dy) scale(sx, sy)` with the center origin over the
 * rest box `to`. The translate is in the pill's CSS px: `zoom` is the box px
 * per CSS px (the CSS zoom, or an ancestor's scale), default 1.
 */
export function slideBoxes(anim: Animation, to: MotionRect, zoom = 1): { offset: number; box: MotionRect }[] {
  const effect = anim.effect as KeyframeEffect | null;
  if (!effect || typeof effect.getKeyframes !== 'function') return [];
  return frameBoxes(effect.getKeyframes(), to, zoom);
}

/** clip-path inset() that keeps only the part of `r` inside `box` along the axis. Negative insets are kept, so frames interpolate in a straight line. */
export function insetFor(r: MotionRect, box: MotionRect, axis: 'x' | 'y', k = 1): string {
  const round = (n: number) => Math.round(n * k * 100) / 100;
  const pad = round(Math.max(r.width, r.height));
  if (axis === 'x') {
    const left = box.x - r.x;
    const right = r.x + r.width - (box.x + box.width);
    return `inset(${-pad}px ${round(right)}px ${-pad}px ${round(left)}px)`;
  }
  const top = box.y - r.y;
  const bottom = r.y + r.height - (box.y + box.height);
  return `inset(${round(top)}px ${-pad}px ${round(bottom)}px ${-pad}px)`;
}

export interface InkOptions {
  /** The slide followIndicator started, or null (then nothing plays). */
  slide: Animation | null;
  /** The rest box of the pill (the end of the slide), in viewport px. */
  to: MotionRect;
  /** The list or row that holds the items: one ink per anchor at a time. */
  anchor: Element;
  /** Every element that can turn color under the pill (labels, icons), one entry per item. */
  parts: Element[];
  /** The parts of the item the pill reaches: they hold the rest color while the twins play. */
  reaching: Element[];
  /** A part at rest and not selected (the part the pill leaves): its color is the rest color. */
  restFrom: Element | null | undefined;
  /** A part of the item the pill reaches: its color is the ink. */
  inkFrom: Element | null | undefined;
  axis: 'x' | 'y';
  /** A private property on the anchor's root that a style sets to 0 to turn the ink off (`--_tabs-ink`). */
  switch?: `--_${string}`;
  /** The pill: when it is not drawn (hidden by a style or by forced colors), there is no ink. */
  indicator?: Element | null;
}

/** True under forced colors: the system draws the selected item, a twin would paint over it. */
export function forcedColors(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(forced-colors: active)').matches;
}

/** The look of a part, read once before any write. */
interface PartRead {
  part: HTMLElement;
  parent: HTMLElement;
  r: MotionRect;
  /** CSS px per box px. */
  k: number;
  left: number;
  top: number;
  width: number;
  height: number;
  html: string;
  look: Record<string, string>;
}

/** The computed properties a twin copies, so a part drawn by its own data-part rules keeps its text where it was. */
const LOOK = ['display', 'alignItems', 'justifyContent', 'gap', 'padding', 'borderWidth', 'font', 'letterSpacing', 'textAlign', 'direction'] as const;

function readPart(part: Element, span: { lo: number; hi: number }, axis: 'x' | 'y'): PartRead | null {
  const host = part as HTMLElement;
  if (typeof host.animate !== 'function') return null;
  const parent = (host.offsetParent as HTMLElement | null) ?? host.parentElement;
  if (!parent) return null;
  const b = host.getBoundingClientRect();
  if (b.width < 1 || b.height < 1) return null;
  // A part the pill never passes keeps its own color the whole slide: no twin.
  const lo = axis === 'x' ? b.left : b.top;
  const hi = axis === 'x' ? b.right : b.bottom;
  if (hi <= span.lo || lo >= span.hi) return null;
  const r = { x: b.left, y: b.top, width: b.width, height: b.height };
  const k = host.offsetWidth > 0 ? host.offsetWidth / b.width : 1;
  // Placed in the containing block of the part with offsets, which are CSS px even when a page zooms, so it lands on the part.
  const own = host.offsetParent === parent;
  let left = host.offsetLeft;
  let top = host.offsetTop;
  if (!own) {
    const pr = parent.getBoundingClientRect();
    left = (b.left - pr.left) * k - parent.clientLeft + parent.scrollLeft;
    top = (b.top - pr.top) * k - parent.clientTop + parent.scrollTop;
  }
  const cs = getComputedStyle(host);
  const look: Record<string, string> = {};
  for (const p of LOOK) look[p] = cs[p];
  if (look.display === 'inline') look.display = 'inline-block';
  return { part: host, parent, r, k, left, top, width: host.offsetWidth || b.width, height: host.offsetHeight || b.height, html: host.innerHTML, look };
}

/** The twin of a part: the one built for its last slide when its markup is the same, or a new copy. Writes nothing to the page. */
function twinOf(read: PartRead): HTMLElement {
  const cached = twinCache.get(read.part);
  if (cached && cached.html === read.html) return cached.twin;
  const twin = read.part.cloneNode(true) as HTMLElement;
  for (const el of [twin, ...twin.querySelectorAll('[id]')]) el.removeAttribute('id');
  for (const el of [twin, ...twin.querySelectorAll('[href]')]) el.removeAttribute('href');
  for (const a of ['data-state', 'data-active', 'role', 'tabindex', 'aria-current', 'aria-selected']) twin.removeAttribute(a);
  twin.setAttribute('aria-hidden', 'true');
  twin.inert = true;
  twin.setAttribute('data-part', INK_PART);
  twinCache.set(read.part, { html: read.html, twin });
  return twin;
}

/** The slide an ink follows, as planned (helpers/indicator.ts planSlide) before it starts. */
export interface InkSlide {
  frames: Keyframe[];
  duration: number;
  easing: string;
}

export interface InkPlanOptions extends Omit<InkOptions, 'slide'> {
  /** The planned slide, or null (then nothing plays). */
  slide: InkSlide | null;
}

/** The box of each keyframe of a planned slide, in viewport px (as slideBoxes). */
export function frameBoxes(frames: (Keyframe | ComputedKeyframe)[], to: MotionRect, zoom = 1): { offset: number; box: MotionRect }[] {
  const cx = to.x + to.width / 2;
  const cy = to.y + to.height / 2;
  return frames.map((k, i) => {
    const t = String(k.transform ?? 'none');
    const tr = /translate\(\s*([-\d.e]+)px,\s*([-\d.e]+)px\)/.exec(t);
    const sc = /scale\(\s*([-\d.e]+),\s*([-\d.e]+)\)/.exec(t);
    const dx = tr ? num(tr[1]) * zoom : 0;
    const dy = tr ? num(tr[2]) * zoom : 0;
    const sx = sc ? num(sc[1]) : 1;
    const sy = sc ? num(sc[2]) : 1;
    const w = to.width * sx;
    const h = to.height * sy;
    const c = (k as ComputedKeyframe).computedOffset;
    const offset = typeof c === 'number' ? c : typeof k.offset === 'number' ? k.offset : i / Math.max(1, frames.length - 1);
    return { offset, box: { x: cx + dx - w / 2, y: cy + dy - h / 2, width: w, height: h } };
  });
}

const none = (): Animation[] => [];

/**
 * The reads of the ink, with its writes held in the function it returns
 * (order 1.29, review B14). Call the function with the slide once it has
 * started (or null, then the ink of the list is cleared). Read in a list's
 * commit, write after every list has read (helpers/indicator.ts inFrame).
 */
export function planInk(opts: InkPlanOptions): (started: Animation | null) => Animation[] {
  const { slide, anchor } = opts;
  const clear = () => {
    clearInk(anchor);
    return [];
  };
  // The cheap answers first, so a list that draws no ink reads nothing more.
  if (
    !slide ||
    !(slide.duration > 0) ||
    forcedColors() ||
    (opts.switch !== undefined && typeof getComputedStyle === 'function' && getComputedStyle(anchor).getPropertyValue(opts.switch).trim() === '0') ||
    hidden(opts.indicator)
  )
    return clear;
  // A hold of the last ink keeps a label at the rest color, so reading a
  // color under it still gives the rest color.
  const restColor = colorOf(opts.restFrom);
  const inkColor = colorOf(opts.inkFrom);
  if (!inkColor || !restColor || inkColor === restColor) return clear;
  // The slide's translate is in the pill's CSS px (slideFrames divides by the same zoom).
  const boxes = frameBoxes(slide.frames, opts.to, zoomOf(opts.indicator ?? opts.parts[0]));
  if (boxes.length < 2) return clear;
  const span = { lo: Infinity, hi: -Infinity };
  for (const { box } of boxes) {
    span.lo = Math.min(span.lo, opts.axis === 'x' ? box.x : box.y);
    span.hi = Math.max(span.hi, opts.axis === 'x' ? box.x + box.width : box.y + box.height);
  }
  const reads: PartRead[] = [];
  for (const part of opts.parts) {
    const read = readPart(part, span, opts.axis);
    if (read) reads.push(read);
  }
  const { duration, easing } = slide;

  return (started) => {
    clearInk(anchor);
    if (!started) return none();
    const state: InkState = { twins: [], holds: [] };
    const out: Animation[] = [];
    for (const read of reads) {
      if (!read.part.isConnected) continue;
      const twin = twinOf(read);
      const s = twin.style;
      s.cssText = '';
      s.position = 'absolute';
      s.left = `${read.left}px`;
      s.top = `${read.top}px`;
      s.width = `${read.width}px`;
      s.height = `${read.height}px`;
      s.margin = '0';
      s.boxSizing = 'border-box';
      for (const p of LOOK) s[p] = read.look[p] ?? '';
      s.borderStyle = 'solid';
      s.borderColor = 'transparent';
      s.background = 'none';
      s.boxShadow = 'none';
      s.textDecorationLine = 'none';
      s.whiteSpace = 'nowrap';
      s.pointerEvents = 'none';
      s.color = inkColor;
      s.transform = 'none';
      s.clipPath = insetFor(read.r, boxes[0]!.box, opts.axis, read.k);
      read.parent.append(twin);
      state.twins.push(twin);
      const frames: Keyframe[] = boxes.map(({ offset, box }) => ({ offset, clipPath: insetFor(read.r, box, opts.axis, read.k) }));
      const a = twin.animate(frames, { id: INK_ID, duration, easing, fill: 'forwards' });
      if (started.startTime !== null) a.startTime = started.startTime;
      // A twin is kept for the next slide, so its clip leaves with it.
      state.holds.push(a);
      const drop = () => {
        if (states.get(anchor) !== state) return;
        twin.remove();
        a.cancel();
      };
      a.finished.then(drop, drop);
      out.push(a);
    }
    for (const el of opts.reaching) {
      if (typeof el.animate !== 'function') continue;
      const h = el.animate([{ color: restColor }, { color: restColor }], { id: INK_ID, duration });
      if (started.startTime !== null) h.startTime = started.startTime;
      state.holds.push(h);
    }
    states.set(anchor, state);
    return out;
  };
}

/** Plays the ink with a slide that has started: planInk, then its writes. Returns the twin animations. */
export function playInk(opts: InkOptions): Animation[] {
  const { slide } = opts;
  const effect = slide?.effect as KeyframeEffect | null | undefined;
  const timing = effect?.getTiming();
  const planned: InkSlide | null =
    slide && effect && typeof effect.getKeyframes === 'function'
      ? { frames: effect.getKeyframes(), duration: Number(timing?.duration ?? 0), easing: String(timing?.easing ?? 'linear') }
      : null;
  return planInk({ ...opts, slide: planned })(slide);
}

/** True when the pill is not drawn: hidden, display none, or visibility hidden. */
function hidden(el: Element | null | undefined): boolean {
  if (!el) return false;
  if ((el as HTMLElement).hidden) return true;
  if (typeof getComputedStyle !== 'function') return false;
  const cs = getComputedStyle(el);
  return cs.display === 'none' || cs.visibility === 'hidden';
}

/** The computed text color of an element, or an empty string. */
export function colorOf(el: Element | null | undefined): string {
  if (!el || typeof getComputedStyle !== 'function') return '';
  return getComputedStyle(el).color;
}
