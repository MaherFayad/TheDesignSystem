// The ink of the shared pill (order 1.23, interaction round 3, proposed),
// for Angular: a copy of packages/react/src/components/Tabs/ink.ts, which
// has no React import, so the twins, the keyframes and the holds are the
// same in both frameworks. Lead change: move it into packages/motion and
// import it from both.
//
// While the pill of a list slides from one item to the next, the text under
// it takes the selected color exactly where the pill is, and only there: a
// label half under the pill is half in each color.
//
// How: for the slide that internal/indicator.ts started, every label the
// pill can pass gets a twin, a clone in the selected color laid over it
// (aria-hidden, data-part="label-ink", no pointer). Each twin is cut with
// clip-path to the pill's box along the travel axis, keyframe for keyframe
// with the slide (the same offsets, duration and easing, read from the slide
// itself), so the cut and the pill stay together, stretch included. While
// the twins play, the label of the item the pill reaches holds the rest
// color under its twin, so it turns only where the pill covers it. The twins
// are removed when their animation ends or is cancelled; a second change
// first removes the twins of the first. Nothing waits on an animation event:
// the color of every label is right with no twin at all.
//
// Users here: SegmentedControl and ToggleGroup.
import { ANIMATION_ID_PREFIX, type MotionRect } from '@the-system/motion';

export const INK_ID = `${ANIMATION_ID_PREFIX}indicator-ink`;

/** The part name of a twin. */
export const INK_PART = 'label-ink';

interface InkState {
  twins: HTMLElement[];
  holds: Animation[];
}

const states = new WeakMap<Element, InkState>();

/** Removes the twins and holds a list drew, if any. */
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
 * rest box `to`.
 */
export function slideBoxes(anim: Animation, to: MotionRect): { offset: number; box: MotionRect }[] {
  const effect = anim.effect as KeyframeEffect | null;
  if (!effect || typeof effect.getKeyframes !== 'function') return [];
  const cx = to.x + to.width / 2;
  const cy = to.y + to.height / 2;
  const frames = effect.getKeyframes();
  return frames.map((k, i) => {
    const t = String(k.transform ?? 'none');
    const tr = /translate\(\s*([-\d.e]+)px,\s*([-\d.e]+)px\)/.exec(t);
    const sc = /scale\(\s*([-\d.e]+),\s*([-\d.e]+)\)/.exec(t);
    const dx = tr ? num(tr[1]) : 0;
    const dy = tr ? num(tr[2]) : 0;
    const sx = sc ? num(sc[1]) : 1;
    const sy = sc ? num(sc[2]) : 1;
    const w = to.width * sx;
    const h = to.height * sy;
    const offset = typeof k.computedOffset === 'number' ? k.computedOffset : i / Math.max(1, frames.length - 1);
    return { offset, box: { x: cx + dx - w / 2, y: cy + dy - h / 2, width: w, height: h } };
  });
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
}

/** Plays the ink with a slide. Returns the twin animations. */
export function playInk(opts: InkOptions): Animation[] {
  clearInk(opts.anchor);
  const { slide } = opts;
  if (!slide) return [];
  if (opts.switch && typeof getComputedStyle === 'function' && getComputedStyle(opts.anchor).getPropertyValue(opts.switch).trim() === '0') return [];
  // Read after the last ink is cleared, so no hold of it is read as a color.
  const restColor = colorOf(opts.restFrom);
  const inkColor = colorOf(opts.inkFrom);
  if (!inkColor || !restColor || inkColor === restColor) return [];
  const boxes = slideBoxes(slide, opts.to);
  if (boxes.length < 2) return [];
  const timing = slide.effect?.getTiming();
  const duration = Number(timing?.duration ?? 0);
  if (!(duration > 0)) return [];
  const easing = String(timing?.easing ?? 'linear');
  const state: InkState = { twins: [], holds: [] };
  const out: Animation[] = [];
  for (const part of opts.parts) {
    const host = part as HTMLElement;
    const parent = (host.offsetParent as HTMLElement | null) ?? host.parentElement;
    if (!parent || typeof host.animate !== 'function') continue;
    const r = host.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(host);
    const twin = host.cloneNode(true) as HTMLElement;
    for (const el of [twin, ...twin.querySelectorAll('[id]')]) el.removeAttribute('id');
    for (const el of [twin, ...twin.querySelectorAll('[href]')]) el.removeAttribute('href');
    twin.setAttribute('aria-hidden', 'true');
    twin.inert = true;
    twin.setAttribute('data-part', INK_PART);
    for (const a of ['data-state', 'data-active', 'role', 'tabindex', 'aria-current', 'aria-selected']) twin.removeAttribute(a);
    const s = twin.style;
    // Placed in the containing block of the part with offsets, which are CSS px even when a page zooms, so it lands on the part.
    const own = host.offsetParent === parent;
    const pr = parent.getBoundingClientRect();
    // CSS px per box px: boxes are measured after any zoom, offsets and styles before it.
    const k = host.offsetWidth > 0 && r.width > 0 ? host.offsetWidth / r.width : 1;
    s.position = 'absolute';
    s.left = `${own ? host.offsetLeft : (r.left - pr.left) * k - parent.clientLeft + parent.scrollLeft}px`;
    s.top = `${own ? host.offsetTop : (r.top - pr.top) * k - parent.clientTop + parent.scrollTop}px`;
    s.width = `${host.offsetWidth || r.width}px`;
    s.height = `${host.offsetHeight || r.height}px`;
    s.margin = '0';
    s.boxSizing = 'border-box';
    // The layout of the part is copied, so a part drawn by its own data-part rules keeps its text where it was.
    s.display = cs.display === 'inline' ? 'inline-block' : cs.display;
    s.alignItems = cs.alignItems;
    s.justifyContent = cs.justifyContent;
    s.gap = cs.gap;
    s.padding = cs.padding;
    s.borderStyle = 'solid';
    s.borderColor = 'transparent';
    s.borderWidth = cs.borderWidth;
    s.font = cs.font;
    s.letterSpacing = cs.letterSpacing;
    s.textAlign = cs.textAlign;
    s.direction = cs.direction;
    s.background = 'none';
    s.boxShadow = 'none';
    s.textDecorationLine = 'none';
    s.whiteSpace = 'nowrap';
    s.pointerEvents = 'none';
    s.color = inkColor;
    s.transform = 'none';
    parent.append(twin);
    state.twins.push(twin);
    const frames: Keyframe[] = boxes.map(({ offset, box }) => ({ offset, clipPath: insetFor(r, box, opts.axis, k) }));
    const a = twin.animate(frames, { id: INK_ID, duration, easing, fill: 'forwards' });
    if (slide.startTime !== null) a.startTime = slide.startTime;
    const drop = () => twin.remove();
    a.finished.then(drop, drop);
    out.push(a);
  }
  for (const el of opts.reaching) {
    if (typeof el.animate !== 'function') continue;
    const h = el.animate([{ color: restColor }, { color: restColor }], { id: INK_ID, duration });
    if (slide.startTime !== null) h.startTime = slide.startTime;
    state.holds.push(h);
  }
  states.set(opts.anchor, state);
  return out;
}

/** The computed text color of an element, or an empty string. */
export function colorOf(el: Element | null | undefined): string {
  if (!el || typeof getComputedStyle !== 'function') return '';
  return getComputedStyle(el).color;
}
