// The stack of interaction "toast-stack" (order 1.23). The toasts of a
// toaster share one grid cell (Toast.css), so they overlap: the newest is in
// front, and the older ones sit behind it, a few px further from the edge,
// a little smaller, clipped to the strip that peeks out. On hover or focus
// the stack expands into a list; it collapses again when the pointer and the
// focus leave.
//
// Nothing here animates. This file measures the toasts and writes, on each
// one, the working values the CSS reads (its place in the stack and its
// height), and on the viewport the height of the front toast and of the
// expanded list. The CSS places the toasts with `translate`, `scale` and
// `clip-path` from those values and transitions them, so a toast that joins,
// a toast that leaves, an expand and a collapse are all the same transition.
// Layout never animates.
//
// A MutationObserver sees a toast added or removed and every data-state
// change (an open toast that starts its exit leaves the order at once, so the
// others move while it plays out). A ResizeObserver sees a toast that grows
// or shrinks in place (a repeat count, an update). Both callbacks run before
// the next paint, so a toast is never drawn in the wrong place.

/** A toast as the stack sees it: its element, its height and whether it is still open. */
export interface StackEntry {
  el: HTMLElement;
  height: number;
  open: boolean;
}

/** Where one toast goes: its index from the front, and its offset in the expanded list. */
export interface StackPlace {
  index: number;
  /** The distance from the edge to the toast's near side when the stack is expanded, in px. */
  offset: number;
}

export interface StackLayout {
  places: Map<HTMLElement, StackPlace>;
  /** The height of the front toast, in px. 0 with no open toast. */
  front: number;
  /** The height of the expanded list, gaps included, in px. */
  total: number;
}

/**
 * The stack from the toasts in DOM order (oldest first). Only open toasts
 * take a place; the newest is index 0. A closed toast (playing its exit)
 * keeps the place it had, so it is left out.
 */
export function stackLayout(entries: readonly StackEntry[], gap: number): StackLayout {
  const places = new Map<HTMLElement, StackPlace>();
  const open = entries.filter((e) => e.open).reverse();
  let offset = 0;
  open.forEach((e, index) => {
    places.set(e.el, { index, offset });
    offset += e.height + gap;
  });
  return { places, front: open[0]?.height ?? 0, total: open.length === 0 ? 0 : offset - gap };
}

const TOASTS = ':scope > [data-ds="toast"]';

function px(n: number): string {
  return `${Math.round(n * 100) / 100}px`;
}

/** Measures the viewport's toasts and writes the stack values on them. */
export function writeStack(viewport: HTMLElement): StackLayout {
  const els = Array.from(viewport.querySelectorAll<HTMLElement>(TOASTS));
  const gap = typeof getComputedStyle === 'function' ? Number.parseFloat(getComputedStyle(viewport).rowGap) || 0 : 0;
  const layout = stackLayout(
    els.map((el) => ({ el, height: el.offsetHeight, open: el.getAttribute('data-state') !== 'closed' })),
    gap,
  );
  for (const el of els) {
    const place = layout.places.get(el);
    // A closing toast keeps its last values, so it plays its exit where it was.
    if (!place) continue;
    el.style.setProperty('--_toast-index', String(place.index));
    el.style.setProperty('--_toast-offset', px(place.offset));
    el.style.setProperty('--_toast-height', px(el.offsetHeight));
  }
  viewport.style.setProperty('--_toaster-front-height', px(layout.front));
  viewport.style.setProperty('--_toaster-height', px(layout.total));
  return layout;
}

/**
 * Keeps the stack values of a toaster viewport up to date until the returned
 * function is called.
 */
export function watchStack(viewport: HTMLElement): () => void {
  const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => writeStack(viewport));
  const observed = new Set<Element>();
  const sync = () => {
    const now = new Set<Element>(viewport.querySelectorAll(TOASTS));
    for (const el of now) if (!observed.has(el)) resizes?.observe(el);
    for (const el of observed) if (!now.has(el)) resizes?.unobserve(el);
    observed.clear();
    for (const el of now) observed.add(el);
    writeStack(viewport);
  };
  sync();
  if (typeof MutationObserver === 'undefined') return () => resizes?.disconnect();
  const mutations = new MutationObserver(sync);
  mutations.observe(viewport, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] });
  return () => {
    mutations.disconnect();
    resizes?.disconnect();
  };
}
