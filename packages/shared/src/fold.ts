// The fold of a foldable screen, as a page can know it (order DU5,
// docs/plan/reset-duo.md sections 3, 4 and 5.2). Shared by React and Angular.
//
// A page sees the fold only through the viewport segments API
// (`window.viewport.segments`, behind a flag in Safari, shipped in Chrome):
// two rectangles, side by side when the fold runs top to bottom (the device
// held open like a book, `horizontal-viewport-segments: 2`) or one above the
// other when it runs across (`vertical-viewport-segments: 2`). The gap
// between them is the band (the hinge), where nothing interactive may sit.
// With one segment, or without the API, there is no fold and nothing here
// changes a layout. A model is never detected and `screen` is never read
// (frameworks.md, platform axis).
//
// Pure: it reads only the window it is given, so it runs on any DOM and in
// tests.

/** A rectangle in CSS px, in viewport coordinates (a DOMRect has these). */
export interface FoldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The fold, when there are two segments. */
export interface Fold {
  /**
   * columns: the two segments sit side by side (the fold runs top to
   * bottom). rows: one above the other (the fold runs across).
   */
  layout: 'columns' | 'rows';
  /** The two segments, in reading order of the screen: left then right, or top then bottom. */
  segments: readonly [FoldRect, FoldRect];
  /** The band between them. Zero wide when the segments touch. */
  band: FoldRect;
}

/** A segment named by its place: start and end follow the reading direction. */
export type FoldSegment = 'start' | 'end' | 'top' | 'bottom';

/** Padding per physical side, as floating-ui (Radix Popper) takes it. */
export interface PhysicalPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

function rectOf(r: unknown): FoldRect | null {
  if (!r || typeof r !== 'object') return null;
  const o = r as Record<string, unknown>;
  const x = finite(o.x) ? o.x : finite(o.left) ? o.left : NaN;
  const y = finite(o.y) ? o.y : finite(o.top) ? o.top : NaN;
  if (!finite(x) || !finite(y) || !finite(o.width) || !finite(o.height) || o.width <= 0 || o.height <= 0) return null;
  return { x, y, width: o.width, height: o.height };
}

/**
 * The fold from a list of segments (what `window.viewport.segments` gives),
 * or null for anything but two segments that sit side by side or one above
 * the other.
 */
export function foldFrom(segments: ArrayLike<unknown> | null | undefined): Fold | null {
  if (!segments || segments.length !== 2) return null;
  const a = rectOf(segments[0]);
  const b = rectOf(segments[1]);
  if (!a || !b) return null;
  // Side by side: one ends where (or before) the other starts along x.
  if (a.x + a.width <= b.x || b.x + b.width <= a.x) {
    const [left, right] = a.x <= b.x ? [a, b] : [b, a];
    const top = Math.max(left.y, right.y);
    const bottom = Math.min(left.y + left.height, right.y + right.height);
    return {
      layout: 'columns',
      segments: [left, right],
      band: { x: left.x + left.width, y: top, width: right.x - (left.x + left.width), height: Math.max(0, bottom - top) },
    };
  }
  if (a.y + a.height <= b.y || b.y + b.height <= a.y) {
    const [upper, lower] = a.y <= b.y ? [a, b] : [b, a];
    const left = Math.max(upper.x, lower.x);
    const right = Math.min(upper.x + upper.width, lower.x + lower.width);
    return {
      layout: 'rows',
      segments: [upper, lower],
      band: { x: left, y: upper.y + upper.height, width: Math.max(0, right - left), height: lower.y - (upper.y + upper.height) },
    };
  }
  return null;
}

/** The fold of a window, from `window.viewport.segments`; null without the API or with one segment. */
export function readFold(view: Window | null | undefined): Fold | null {
  if (!view) return null;
  try {
    const viewport = (view as unknown as { viewport?: { segments?: ArrayLike<unknown> | null } }).viewport;
    return foldFrom(viewport?.segments);
  } catch {
    return null;
  }
}

/** True when two folds are the same (so a hook keeps its state). */
export function sameFold(a: Fold | null, b: Fold | null): boolean {
  if (a === b) return true;
  if (!a || !b || a.layout !== b.layout) return false;
  const eq = (p: FoldRect, q: FoldRect) => p.x === q.x && p.y === q.y && p.width === q.width && p.height === q.height;
  return eq(a.segments[0], b.segments[0]) && eq(a.segments[1], b.segments[1]);
}

/**
 * The segment a modal overlay (Dialog, AlertDialog, Sheet) is placed in
 * (reset-duo.md 5.2): the inline start segment when the segments sit side
 * by side, the bottom one when they are stacked (interactive parts go to
 * the bottom half). Null without a fold.
 */
export function overlaySegment(fold: Fold | null): FoldSegment | null {
  if (!fold) return null;
  return fold.layout === 'columns' ? 'start' : 'bottom';
}

/** The segment a point lies in, by name; null without a fold. A point in the band counts for the nearer side. */
export function segmentAt(fold: Fold | null, point: { x: number; y: number }, dir: string = 'ltr'): FoldSegment | null {
  if (!fold) return null;
  if (fold.layout === 'rows') return point.y < fold.band.y + fold.band.height / 2 ? 'top' : 'bottom';
  const leftSide = point.x < fold.band.x + fold.band.width / 2;
  return leftSide !== (dir === 'rtl') ? 'start' : 'end';
}

/**
 * Collision padding for a floating overlay (Popover, menus, Tooltip) that
 * keeps it inside the segment of its anchor point: the far edges of the
 * other segment and the band become padding, so the overlay flips or
 * shifts into its own segment and never straddles the band. `base` is the
 * padding the overlay asks for anyway; `edges` adds per side room (the safe
 * area of a side column). Without a fold the result is base plus edges.
 */
export function foldPadding(
  fold: Fold | null,
  point: { x: number; y: number },
  viewport: { width: number; height: number },
  base: PhysicalPadding,
  edges: Partial<PhysicalPadding> = {},
): PhysicalPadding {
  const out: PhysicalPadding = {
    top: Math.max(base.top, edges.top ?? 0),
    right: Math.max(base.right, edges.right ?? 0),
    bottom: Math.max(base.bottom, edges.bottom ?? 0),
    left: Math.max(base.left, edges.left ?? 0),
  };
  if (!fold) return out;
  if (fold.layout === 'columns') {
    const leftSide = point.x < fold.band.x + fold.band.width / 2;
    if (leftSide) out.right = Math.max(out.right, viewport.width - fold.band.x + base.right);
    else out.left = Math.max(out.left, fold.band.x + fold.band.width + base.left);
  } else {
    const upper = point.y < fold.band.y + fold.band.height / 2;
    if (upper) out.bottom = Math.max(out.bottom, viewport.height - fold.band.y + base.bottom);
    else out.top = Math.max(out.top, fold.band.y + fold.band.height + base.top);
  }
  return out;
}

/** Padding for every side from one number or a partial object, as Radix takes collisionPadding. */
export function paddingOf(value: number | Partial<PhysicalPadding> | undefined): PhysicalPadding {
  if (typeof value === 'number') return { top: value, right: value, bottom: value, left: value };
  return { top: value?.top ?? 0, right: value?.right ?? 0, bottom: value?.bottom ?? 0, left: value?.left ?? 0 };
}

/**
 * The sizes, in percent, of a list and its detail side by side (SplitView)
 * that put the divide in the band (reset-duo.md 5.2): each pane takes the
 * part of its own segment the box covers. `box` is the room the panes share,
 * in viewport px (the root's content box). The first pane is at the inline
 * start: the left segment in `ltr`, the right one in `rtl`. Null without a
 * side by side fold, or when the band is not inside the box (then nothing
 * changes the split).
 */
export function foldSplit(fold: Fold | null, box: { left: number; right: number }, dir: string = 'ltr'): [number, number] | null {
  if (!fold || fold.layout !== 'columns') return null;
  const left = fold.band.x - box.left;
  const right = box.right - (fold.band.x + fold.band.width);
  if (!(left > 0) || !(right > 0)) return null;
  const [first, second] = dir === 'rtl' ? [right, left] : [left, right];
  const firstShare = Math.round((first / (first + second)) * 10000) / 100;
  return [firstShare, Math.round((100 - firstShare) * 100) / 100];
}
