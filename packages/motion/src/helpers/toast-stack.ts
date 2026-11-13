// The toast stack (order 1.23), one copy for both frameworks (order 1.29):
// the React and the Angular Toaster import it from @the-system/motion.
//
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
// A MutationObserver sees a toast added or removed (the viewport's own child
// list) and each toast's data-state change (an open toast that starts its
// exit leaves the order at once, so the others move while it plays out);
// nothing inside a toast. A ResizeObserver sees a toast that grows or
// shrinks in place (a repeat count, an update). Both callbacks run before
// the next paint, so a toast is never drawn in the wrong place. Each pass
// reads every height first and writes after, and skips a value that has not
// changed (order 1.29, review 3 N44).

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

/** Sets a custom property only when its value changes, so an unchanged stack costs no style work. */
function put(el: HTMLElement, name: string, value: string): void {
  if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value);
}

/**
 * Measures the viewport's toasts and writes the stack values on them. Every
 * height is read first and every value written after (order 1.29, review 3
 * N44), so one pass forces at most one layout; a value that has not changed
 * is not written again.
 */
export function writeStack(viewport: HTMLElement): StackLayout {
  const els = Array.from(viewport.querySelectorAll<HTMLElement>(TOASTS));
  const gap = typeof getComputedStyle === 'function' ? Number.parseFloat(getComputedStyle(viewport).rowGap) || 0 : 0;
  // Reads.
  const entries = els.map((el) => ({ el, height: el.offsetHeight, open: el.getAttribute('data-state') !== 'closed' }));
  const layout = stackLayout(entries, gap);
  // Writes.
  for (const entry of entries) {
    const place = layout.places.get(entry.el);
    // A closing toast keeps its last values, so it plays its exit where it was.
    if (!place) continue;
    put(entry.el, '--_toast-index', String(place.index));
    put(entry.el, '--_toast-offset', px(place.offset));
    put(entry.el, '--_toast-height', px(entry.height));
    // The front height as this toast last saw it, so a toast playing its exit stays where it was.
    put(entry.el, '--_toast-front-height', px(layout.front));
  }
  put(viewport, '--_toaster-front-height', px(layout.front));
  put(viewport, '--_toaster-height', px(layout.total));
  return layout;
}

/**
 * Keeps the stack values of a toaster viewport up to date until the returned
 * function is called. The observers watch only what moves the stack (order
 * 1.29, review 3 N44): the viewport's own child list (a toast added or
 * removed), each toast's data-state, and each toast's size. Changes inside a
 * toast (a button's state, a count) never measure the stack.
 */
export function watchStack(viewport: HTMLElement): () => void {
  const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => writeStack(viewport));
  const mutations = typeof MutationObserver === 'undefined' ? null : new MutationObserver(() => sync());
  const observed = new Set<Element>();
  function sync() {
    const now = new Set<Element>(viewport.querySelectorAll(TOASTS));
    for (const el of now) {
      if (observed.has(el)) continue;
      resizes?.observe(el);
      mutations?.observe(el, { attributes: true, attributeFilter: ['data-state'] });
    }
    for (const el of observed) if (!now.has(el)) resizes?.unobserve(el);
    observed.clear();
    for (const el of now) observed.add(el);
    writeStack(viewport);
  }
  mutations?.observe(viewport, { childList: true });
  sync();
  return () => {
    mutations?.disconnect();
    resizes?.disconnect();
  };
}
