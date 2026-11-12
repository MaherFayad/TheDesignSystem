// Resizable panel math, pure TypeScript: sizes in percent of the group,
// limits per panel, a resize across one handle, collapse and restore. No DOM
// and no framework, so React, Angular and React Native share it.
//
// A group of n panels has n - 1 handles. Handle i sits between panel i (the
// panel before it, in reading order) and panel i + 1 (the panel after it).
// A positive delta moves handle i toward the end: the panel before grows and
// the panel after shrinks by the same amount, so the sum stays 100.
//
// Collapse: a collapsible panel that is pushed below its min snaps to its
// collapsed size once it passes the threshold, halfway between the collapsed
// size and the min. Dragged back past the same line, it opens at its min.

/** The limits of one panel, in percent of the group. */
export interface PanelLimits {
  /** Smallest open size. */
  min: number;
  /** Largest size. */
  max: number;
  /** The panel may collapse below its min. */
  collapsible: boolean;
  /** The size of the collapsed panel. 0 hides it. */
  collapsedSize: number;
}

/** Arrow key step, in percent. */
export const RESIZE_STEP = 5;

/** Tolerance for float comparisons, in percent. */
const EPSILON = 0.01;

/** Fills the limits that were not given: min 0, max 100, not collapsible, collapsed size 0. */
export function panelLimits(input: Partial<PanelLimits> = {}): PanelLimits {
  const min = clamp(input.min ?? 0, 0, 100);
  const max = clamp(input.max ?? 100, min, 100);
  const collapsible = input.collapsible ?? false;
  const collapsedSize = clamp(input.collapsedSize ?? 0, 0, min);
  return { min, max, collapsible, collapsedSize };
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi);
}

/** n equal sizes that add up to 100. */
export function evenSizes(count: number): number[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, () => 100 / count);
}

/** True when the panel sits at its collapsed size. */
export function isCollapsed(size: number, limits: PanelLimits): boolean {
  return limits.collapsible && size <= limits.collapsedSize + EPSILON;
}

function lowest(size: number, limits: PanelLimits): number {
  return isCollapsed(size, limits) ? limits.collapsedSize : limits.min;
}

/**
 * Makes sizes valid: one per panel, each inside its limits (a collapsed panel
 * stays collapsed), adding up to 100. Room left over, or taken back, goes to
 * the panels from the last to the first.
 */
export function clampSizes(sizes: readonly number[], limits: readonly PanelLimits[]): number[] {
  const n = limits.length;
  if (n === 0) return [];
  const input = sizes.length === n && sizes.every((s) => Number.isFinite(s) && s >= 0) ? [...sizes] : evenSizes(n);
  const total = input.reduce((a, b) => a + b, 0) || 100;
  const out = input.map((s, i) => {
    const l = limits[i] as PanelLimits;
    const scaled = (s / total) * 100;
    if (isCollapsed(scaled, l)) return l.collapsedSize;
    return clamp(scaled, l.min, l.max);
  });
  let rest = 100 - out.reduce((a, b) => a + b, 0);
  for (let i = n - 1; i >= 0 && Math.abs(rest) > EPSILON; i--) {
    const l = limits[i] as PanelLimits;
    const s = out[i] as number;
    if (isCollapsed(s, l)) continue;
    const next = clamp(s + rest, l.min, l.max);
    rest -= next - s;
    out[i] = next;
  }
  // Every open panel is at a limit: open a collapsed one to take the rest.
  for (let i = n - 1; i >= 0 && rest > EPSILON; i--) {
    const l = limits[i] as PanelLimits;
    const s = out[i] as number;
    const next = clamp(s + rest, s, l.max);
    rest -= next - s;
    out[i] = next;
  }
  return out;
}

/**
 * Moves handle `handle` by `delta` percent toward the end. Only the two
 * panels next to the handle change. A collapsible panel collapses past the
 * threshold and opens again at its min when dragged back. Returns new sizes;
 * the input is not changed.
 */
export function resizeBy(sizes: readonly number[], limits: readonly PanelLimits[], handle: number, delta: number): number[] {
  const out = [...sizes];
  const b = handle;
  const a = handle + 1;
  const lb = limits[b];
  const la = limits[a];
  if (!lb || !la || delta === 0) return out;
  const sb = out[b] as number;
  const sa = out[a] as number;
  const pair = sb + sa;
  // The open range of the panel before: both panels inside their open limits.
  const lo = Math.max(lb.min, pair - la.max);
  const hi = Math.min(lb.max, pair - la.min);
  const target = sb + delta;
  let next: number;
  if (target < lo) {
    next = lb.collapsible && lb.collapsedSize < lb.min && target < (lb.collapsedSize + lb.min) / 2 ? lb.collapsedSize : lo;
  } else if (target > hi) {
    const after = pair - target;
    next = la.collapsible && la.collapsedSize < la.min && after < (la.collapsedSize + la.min) / 2 ? pair - la.collapsedSize : hi;
  } else {
    next = target;
  }
  // The range may be empty when the limits cannot both hold; keep the pair whole.
  next = clamp(next, Math.min(lb.collapsedSize, lo), Math.max(hi, pair - la.collapsedSize));
  out[b] = next;
  out[a] = pair - next;
  return out;
}

/**
 * Moves handle `handle` to its far start (`'min'`: the panel before at its
 * smallest open size) or its far end (`'max'`). Home and End on a handle.
 */
export function resizeToEdge(sizes: readonly number[], limits: readonly PanelLimits[], handle: number, edge: 'min' | 'max'): number[] {
  const out = [...sizes];
  const lb = limits[handle];
  const la = limits[handle + 1];
  if (!lb || !la) return out;
  const pair = (out[handle] as number) + (out[handle + 1] as number);
  const next =
    edge === 'min'
      ? clamp(Math.max(lb.min, pair - la.max), 0, pair)
      : clamp(Math.min(lb.max, pair - lowest(out[handle + 1] as number, la)), 0, pair);
  out[handle] = next;
  out[handle + 1] = pair - next;
  return out;
}

/** The panel Enter collapses and restores on a handle: the one before if it can collapse, else the one after, else -1. */
export function collapseTarget(limits: readonly PanelLimits[], handle: number): number {
  if (limits[handle]?.collapsible) return handle;
  if (limits[handle + 1]?.collapsible) return handle + 1;
  return -1;
}

/** The neighbor that gives or takes the room of panel `index`: the next panel, or the one before for the last. */
function neighborOf(count: number, index: number, handle?: number): number {
  if (handle !== undefined) return handle === index ? index + 1 : handle;
  return index < count - 1 ? index + 1 : index - 1;
}

/**
 * Collapses panel `index` and gives its room to its neighbor across `handle`
 * (default: the next panel, or the one before for the last). A panel that
 * cannot collapse is left as it is.
 */
export function collapsePanel(sizes: readonly number[], limits: readonly PanelLimits[], index: number, handle?: number): number[] {
  const l = limits[index];
  if (!l || !l.collapsible || sizes.length < 2) return [...sizes];
  const out = [...sizes];
  const n = neighborOf(sizes.length, index, handle);
  const freed = (out[index] as number) - l.collapsedSize;
  out[index] = l.collapsedSize;
  out[n] = (out[n] as number) + freed;
  return clampSizes(out, limits);
}

/**
 * Opens a collapsed panel `index` to `size` (default its min), taking the
 * room from its neighbor across `handle`, which never goes below its own min.
 * When the neighbor cannot give enough room to reach the min, nothing changes.
 */
export function expandPanel(sizes: readonly number[], limits: readonly PanelLimits[], index: number, size?: number, handle?: number): number[] {
  const l = limits[index];
  if (!l || sizes.length < 2) return [...sizes];
  const out = [...sizes];
  const n = neighborOf(sizes.length, index, handle);
  const ln = limits[n] as PanelLimits;
  const current = out[index] as number;
  const room = (out[n] as number) - ln.min;
  const want = clamp(size ?? l.min, l.min, l.max) - current;
  const take = Math.max(0, Math.min(want, room));
  // A panel opens only when it can reach its min; otherwise it stays as it is.
  if (current + take < l.min - EPSILON) return out;
  out[index] = current + take;
  out[n] = (out[n] as number) - take;
  return out;
}

/** Sizes rounded for aria-valuenow and for a stored layout: whole percents by default. */
export function roundSizes(sizes: readonly number[], digits = 0): number[] {
  const f = 10 ** digits;
  return sizes.map((s) => Math.round(s * f) / f);
}
