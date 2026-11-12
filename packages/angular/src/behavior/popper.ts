// Positioning for popups that open from an anchor (DropdownMenu and its
// submenus), on our own element. React gets this from Radix Popper, which
// runs Floating UI with the middleware offset, shift (with limitShift), flip,
// size and a transform origin. The shared CSS reads what that writes: the
// fixed wrapper with a translate, and the `--radix-popper-*` variables the
// content maps to its own names. So this file computes the same numbers the
// same way, and writes them in the same order, for the same pixels and the
// same DOM.
//
// Why not the CDK FlexibleConnectedPositionStrategy: it positions an overlay
// pane (an element the React DOM does not have), works on its own
// fallback list rather than Floating UI's flip and shift order, and does not
// produce the available sizes or the origin the CSS reads. No dependency is
// added: the steps are small.
//
// Scope: the strategy is fixed, the clipping rect is the viewport (no
// clipping ancestors: the layer sits in body), no arrow.

export type PopperSide = 'top' | 'bottom' | 'left' | 'right';
export type PopperAlign = 'start' | 'center' | 'end';

export interface PopperOptions {
  side: PopperSide;
  align: PopperAlign;
  /** Gap along the side, px. */
  sideOffset: number;
  /** Shift along the alignment axis, px. */
  alignOffset: number;
  /** Space kept from the viewport edge, px. */
  padding: number;
  /** Right to left: start alignment on a top or bottom side is the right edge. */
  rtl: boolean;
}

export interface PopperResult {
  x: number;
  y: number;
  side: PopperSide;
  align: PopperAlign;
  availableWidth: number;
  availableHeight: number;
  anchorWidth: number;
  anchorHeight: number;
  /** The transform origin, as Radix writes it: "0% 0px". */
  origin: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Placement = { side: PopperSide; align: PopperAlign | null };

const opposite: Record<PopperSide, PopperSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const isVertical = (side: PopperSide) => side === 'top' || side === 'bottom';

function coordsFrom(ref: Rect, fl: Rect, p: Placement, rtl: boolean): { x: number; y: number } {
  const vertical = isVertical(p.side);
  const cx = ref.x + ref.width / 2 - fl.width / 2;
  const cy = ref.y + ref.height / 2 - fl.height / 2;
  let x = 0;
  let y = 0;
  if (p.side === 'top') [x, y] = [cx, ref.y - fl.height];
  else if (p.side === 'bottom') [x, y] = [cx, ref.y + ref.height];
  else if (p.side === 'right') [x, y] = [ref.x + ref.width, cy];
  else [x, y] = [ref.x - fl.width, cy];
  const commonAlign = vertical ? ref.width / 2 - fl.width / 2 : ref.height / 2 - fl.height / 2;
  const sign = rtl && vertical ? -1 : 1;
  if (p.align === 'start') {
    if (vertical) x -= commonAlign * sign;
    else y -= commonAlign * sign;
  } else if (p.align === 'end') {
    if (vertical) x += commonAlign * sign;
    else y += commonAlign * sign;
  }
  return { x, y };
}

/** How far each edge of the floating rect passes the viewport inset by padding. Positive is overflow. */
function overflowOf(x: number, y: number, fl: Rect, view: Rect, padding: number) {
  return {
    top: view.y + padding - y,
    bottom: y + fl.height - (view.y + view.height - padding),
    left: view.x + padding - x,
    right: x + fl.width - (view.x + view.width - padding),
  };
}

/** The offset middleware: away from the anchor along the side, along the alignment axis by alignOffset. */
function applyOffset(c: { x: number; y: number }, p: Placement, o: PopperOptions): { x: number; y: number } {
  const vertical = isVertical(p.side);
  const mainMulti = p.side === 'left' || p.side === 'top' ? -1 : 1;
  const crossMulti = o.rtl && vertical ? -1 : 1;
  let cross = 0;
  if (p.align) cross = p.align === 'end' ? -o.alignOffset : o.alignOffset;
  return vertical
    ? { x: c.x + cross * crossMulti, y: c.y + o.sideOffset * mainMulti }
    : { x: c.x + o.sideOffset * mainMulti, y: c.y + cross * crossMulti };
}

/** The shift middleware (main axis only) with limitShift: stays in the viewport, never leaves the anchor. */
function applyShift(c: { x: number; y: number }, ref: Rect, fl: Rect, p: Placement, view: Rect, o: PopperOptions) {
  const vertical = isVertical(p.side);
  const axis = vertical ? 'x' : 'y';
  const len = vertical ? 'width' : 'height';
  const minSide = vertical ? 'left' : 'top';
  const maxSide = vertical ? 'right' : 'bottom';
  const ov = overflowOf(c.x, c.y, fl, view, o.padding);
  const value = c[axis];
  const min = value + ov[minSide];
  const max = value - ov[maxSide];
  let next = Math.max(min, Math.min(value, max));
  if (min > max) next = min;
  // limitShift with no offset: the floating edge may not pass the far edge of the anchor.
  const limitMin = ref[axis] - fl[len];
  const limitMax = ref[axis] + ref[len];
  next = Math.max(limitMin, Math.min(next, limitMax));
  return { ...c, [axis]: next } as { x: number; y: number };
}

function place(ref: Rect, fl: Rect, p: Placement, view: Rect, o: PopperOptions) {
  const base = applyOffset(coordsFrom(ref, fl, p, o.rtl), p, o);
  return applyShift(base, ref, fl, p, view, o);
}

/** The flip list Floating UI builds with flipAlignment on: the placement, its other alignment, the opposite side and its other alignment. */
function candidates(p: Placement): Placement[] {
  const other = (a: PopperAlign | null): PopperAlign | null => (a === 'start' ? 'end' : a === 'end' ? 'start' : a);
  const flipped = { side: opposite[p.side], align: p.align };
  if (!p.align || p.align === 'center') return [p, flipped];
  return [p, { side: p.side, align: other(p.align) }, flipped, { side: flipped.side, align: other(p.align) }];
}

function alignmentSides(p: Placement, rtl: boolean): [keyof ReturnType<typeof overflowOf>, keyof ReturnType<typeof overflowOf>] {
  const vertical = isVertical(p.side);
  let main: 'left' | 'right' | 'top' | 'bottom';
  if (vertical) main = p.align === 'end' ? 'right' : 'left';
  else main = p.align === 'end' ? 'bottom' : 'top';
  if (vertical && rtl) main = main === 'left' ? 'right' : 'left';
  const flip = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' } as const;
  return [main, flip[main]];
}

/**
 * Floating UI's getCssDimensions: the computed size, or the offset size when
 * the two disagree after rounding.
 */
export function cssSize(el: HTMLElement): { width: number; height: number } {
  const css = getComputedStyle(el);
  let width = Number.parseFloat(css.width) || 0;
  let height = Number.parseFloat(css.height) || 0;
  if (Math.round(width) !== el.offsetWidth || Math.round(height) !== el.offsetHeight) {
    width = el.offsetWidth;
    height = el.offsetHeight;
  }
  return { width, height };
}

/** Computes where the floating element goes, the side and alignment it ends on, and the room left. */
export function computePopper(anchor: Element, floating: HTMLElement, o: PopperOptions): PopperResult {
  const doc = floating.ownerDocument;
  const r = anchor.getBoundingClientRect();
  const ref: Rect = { x: r.x, y: r.y, width: r.width, height: r.height };
  const size = cssSize(floating);
  const fl: Rect = { x: 0, y: 0, ...size };
  const view: Rect = { x: 0, y: 0, width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight };
  const initial: Placement = { side: o.side, align: o.align === 'center' ? null : o.align };

  // flip: the first candidate with no overflow on its side and its alignment sides.
  const tried: { p: Placement; c: { x: number; y: number }; over: number[] }[] = [];
  let chosen: { p: Placement; c: { x: number; y: number } } | null = null;
  for (const p of candidates(initial)) {
    const c = place(ref, fl, p, view, o);
    const ov = overflowOf(c.x, c.y, fl, view, o.padding);
    const over = [ov[p.side], ...(p.align ? alignmentSides(p, o.rtl).map((s) => ov[s]) : [])];
    tried.push({ p, c, over });
    if (over.every((v) => v <= 0)) {
      chosen = { p, c };
      break;
    }
  }
  if (!chosen) {
    const fitsMain = tried.filter((t) => (t.over[0] ?? 0) <= 0).sort((a, b) => (a.over[1] ?? 0) - (b.over[1] ?? 0))[0];
    const best =
      fitsMain ??
      [...tried].sort(
        (a, b) => a.over.filter((v) => v > 0).reduce((s, v) => s + v, 0) - b.over.filter((v) => v > 0).reduce((s, v) => s + v, 0),
      )[0]!;
    chosen = { p: best.p, c: best.c };
  }

  // size: the room on the open side; the shifted axis gets the whole viewport minus padding.
  const { p, c } = chosen;
  const ov = overflowOf(c.x, c.y, fl, view, o.padding);
  const maxH = fl.height - ov.top - ov.bottom;
  const maxW = fl.width - ov.left - ov.right;
  let availableWidth: number;
  let availableHeight: number;
  if (isVertical(p.side)) {
    availableWidth = maxW;
    availableHeight = Math.min(fl.height - ov[p.side], maxH);
  } else {
    availableHeight = maxH;
    availableWidth = Math.min(fl.width - ov[p.side], maxW);
  }

  const align: PopperAlign = p.align ?? 'center';
  const noArrowAlign = { start: '0%', center: '50%', end: '100%' }[align];
  let origin: string;
  if (p.side === 'bottom') origin = `${noArrowAlign} 0px`;
  else if (p.side === 'top') origin = `${noArrowAlign} ${fl.height}px`;
  else if (p.side === 'right') origin = `0px ${noArrowAlign}`;
  else origin = `${fl.width}px ${noArrowAlign}`;

  // Floating UI rounds the translate to the device pixel grid.
  const dpr = doc.defaultView?.devicePixelRatio || 1;
  const round = (v: number) => Math.round(v * dpr) / dpr;
  return {
    x: round(c.x),
    y: round(c.y),
    side: p.side,
    align,
    availableWidth,
    availableHeight,
    anchorWidth: ref.width,
    anchorHeight: ref.height,
    origin,
  };
}

/**
 * Writes the result on the wrapper in Radix's order, so the style attribute
 * reads the same: position, left, top, transform, min-width, the origin,
 * z-index (copied from the content), then the four size variables.
 */
export function writePopper(wrapper: HTMLElement, result: PopperResult | null, zIndex: string): void {
  const s = wrapper.style;
  s.setProperty('position', 'fixed');
  s.setProperty('left', '0px');
  s.setProperty('top', '0px');
  // Off the page while measuring, as Radix does before the first placement.
  s.setProperty('transform', result ? `translate(${result.x}px, ${result.y}px)` : 'translate(0, -200%)');
  s.setProperty('min-width', 'max-content');
  s.setProperty('--radix-popper-transform-origin', result ? result.origin : ' ');
  if (zIndex) s.setProperty('z-index', zIndex);
  if (!result) return;
  s.setProperty('--radix-popper-available-width', `${result.availableWidth}px`);
  s.setProperty('--radix-popper-available-height', `${result.availableHeight}px`);
  s.setProperty('--radix-popper-anchor-width', `${result.anchorWidth}px`);
  s.setProperty('--radix-popper-anchor-height', `${result.anchorHeight}px`);
}

/**
 * Keeps a floating element placed: now, then on resize, on scroll of any
 * ancestor, and when the anchor or the floating element changes size
 * (Floating UI's autoUpdate). Returns the cleanup.
 */
export function autoPlace(anchor: Element, floating: HTMLElement, update: () => void): () => void {
  const win = floating.ownerDocument.defaultView;
  if (!win) return () => undefined;
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
  update();
  win.addEventListener('resize', schedule);
  win.addEventListener('scroll', schedule, { capture: true, passive: true });
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  observer?.observe(anchor);
  observer?.observe(floating);
  return () => {
    if (frame) win.cancelAnimationFrame(frame);
    win.removeEventListener('resize', schedule);
    win.removeEventListener('scroll', schedule, { capture: true });
    observer?.disconnect();
  };
}
