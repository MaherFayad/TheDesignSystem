// Motion helpers of the selection controls and lists family (order 1.22),
// shared by ListBox, Select, Combobox, Autocomplete, MultiSelect, TagField
// and FilterBar. The twin of
// packages/react/src/components/ListBox/selectionMotion.ts: the framework
// free parts (glide, watchGlide, the spots, ghostOut, the flip step and
// staggerRows) are copied as they are, so the same @the-system/motion calls
// run with the same arguments. Lead change: move them into packages/motion
// so both frameworks import one copy.
//
// - Row glide (interaction row-glide): the lit row of a list draws its fill
//   on an unnamed aria-hidden layer inside the row (the first child,
//   `span[aria-hidden='true']` with no data-part). When the lit row changes,
//   the new row's layer travels from where the old row's layer was drawn
//   (flipPlay). A MutationObserver on the lit attribute drives it, so no
//   change detection timing is involved.
// - Flip group (interaction collection-flip): items that change place travel
//   from their old box; new items pop in; an item that left is drawn once
//   more by an inert clone that shrinks out (flipExit). Run `FlipGroup.update`
//   after each render that may have changed the items (afterRenderEffect).
// - staggerRows (interaction menu-rows): the rows of a popup that just opened
//   arrive one stagger step apart, after the surface (staggerGroup).
//
// Every helper reads the style's mode through injectMotion().mode(id), so a
// style tunes or turns it off, and the person's reduced motion wins. Nothing
// waits on transitionend or animationend.
import { DestroyRef, inject } from '@angular/core';
import { flipExit, flipPlay, rectOf, settled, staggerGroup, type PatternMode } from '@the-system/motion';
import { injectMotion } from './motion';

/** The glide layer of a row: its first unnamed aria-hidden span. */
export const GLIDE_LAYER = ":scope > span[aria-hidden='true']:not([data-part])";

function layerOf(row: Element | null | undefined): Element | null {
  return row?.querySelector(GLIDE_LAYER) ?? null;
}

/** Travels the layer of `to` from where the layer of `from` is drawn now. */
export function glide(from: Element | null | undefined, to: Element | null | undefined, mode: PatternMode): Animation[] {
  const a = layerOf(from);
  const b = layerOf(to);
  if (!a || !b || a === b || mode === 'none') return [];
  const first = rectOf(a);
  if (first.width === 0 && first.height === 0) return [];
  return flipPlay({ rects: new Map([[b, first]]) }, { items: [b], spring: 'snappy', stretch: 'y', scale: true, mode, enter: 'none' });
}

/** Starts the glide on `el` for rows lit by `attribute`; returns the function that stops it. */
export function watchGlide(el: Element, rows: string, attribute: string, mode: () => PatternMode): () => void {
  if (typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver((records) => {
    let from: Element | null = null;
    let to: Element | null = null;
    for (const r of records) {
      const t = r.target as Element;
      if (!t.matches(rows)) continue;
      if (t.hasAttribute(attribute)) to = t;
      else if (r.oldValue !== null) from = t;
    }
    if (from && to) glide(from, to, mode());
  });
  observer.observe(el, { subtree: true, attributes: true, attributeFilter: [attribute], attributeOldValue: true });
  return () => observer.disconnect();
}

/**
 * The row glide of a component, in an injection context: returns the
 * function to call with the element that holds the rows (or null when it
 * leaves, as a popup does). Stops on destroy.
 */
export function injectRowGlide(rows: string, attribute = 'data-highlighted', interaction = 'row-glide'): (el: Element | null) => void {
  const motion = injectMotion();
  let watched: Element | null = null;
  let stop: (() => void) | null = null;
  inject(DestroyRef).onDestroy(() => stop?.());
  return (el) => {
    if (el === watched) return;
    stop?.();
    watched = el;
    stop = el ? watchGlide(el, rows, attribute, () => motion.mode(interaction)) : null;
  };
}

/** A box relative to the container's content origin, so a scroll or a page shift is not read as a move. */
interface Spot {
  x: number;
  y: number;
  width: number;
  height: number;
}

function origin(container: Element): { x: number; y: number } {
  const r = container.getBoundingClientRect();
  return { x: r.x - container.scrollLeft, y: r.y - container.scrollTop };
}

function spotsOf(container: Element, items: Element[]): Map<Element, Spot> {
  const o = origin(container);
  const out = new Map<Element, Spot>();
  for (const el of items) {
    const r = el.getBoundingClientRect();
    out.set(el, { x: r.x - o.x, y: r.y - o.y, width: r.width, height: r.height });
  }
  return out;
}

/** Draws a removed item once more in its old box, shrinking out, then drops it. */
function ghostOut(container: Element, el: Element, spot: Spot, mode: PatternMode): void {
  if (mode === 'none' || !(el instanceof HTMLElement)) return;
  const clone = el.cloneNode(true) as HTMLElement;
  for (const node of [clone, ...Array.from(clone.querySelectorAll('[id], [tabindex], a, button, input'))]) {
    node.removeAttribute('id');
    if (node !== clone) node.setAttribute('tabindex', '-1');
  }
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('inert', '');
  const s = clone.style;
  s.position = 'absolute';
  s.margin = '0';
  s.boxSizing = 'border-box';
  s.inlineSize = `${spot.width}px`;
  s.blockSize = `${spot.height}px`;
  s.pointerEvents = 'none';
  // Placed by measure: at the origin of its containing block first, then moved by the gap to the old box.
  s.insetBlockStart = '0';
  s.insetInlineStart = '0';
  container.append(clone);
  const at = clone.getBoundingClientRect();
  const o = origin(container);
  const dx = o.x + spot.x - at.x;
  const dy = o.y + spot.y - at.y;
  const rtl = getComputedStyle(clone).direction === 'rtl';
  s.insetBlockStart = `${dy}px`;
  s.insetInlineStart = `${rtl ? -dx : dx}px`;
  const exit = flipExit(clone, { mode });
  const drop = () => clone.remove();
  if (exit) settled(exit).then(drop, drop);
  else drop();
}

export interface FlipGroupOptions {
  /** The items of the collection, in order, read after each render. */
  items: (container: Element) => Element[];
  /** The interaction id the style's preset names. Default collection-flip. */
  interaction?: string;
  /** Draw a removed item shrinking out. Default true. */
  ghosts?: boolean;
}

/**
 * Plays add, remove and reorder on the items of a container after each
 * render that changed them (FLIP), as React's useFlipGroup. The first update
 * only measures, so a first paint plays nothing.
 */
export class FlipGroup {
  private last: Map<Element, Spot> | null = null;

  constructor(
    private readonly options: FlipGroupOptions,
    private readonly mode: (interaction: string) => PatternMode,
  ) {}

  /** Measures the items of `el` and plays what changed since the last update. */
  update(el: Element | null | undefined): void {
    const { items, interaction = 'collection-flip', ghosts = true } = this.options;
    if (!el) {
      this.last = null;
      return;
    }
    // A clone still shrinking out is inert: it is not an item.
    const now = items(el).filter((item) => !item.hasAttribute('inert'));
    const before = this.last;
    const spots = spotsOf(el, now);
    this.last = spots;
    // Rows that arrive in an empty collection are a first paint, not an addition.
    if (!before || before.size === 0) return;
    const moved = now.some((item) => {
      const a = before.get(item);
      const b = spots.get(item);
      return !a || !b || Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5;
    });
    const gone = [...before.keys()].filter((item) => !spots.has(item));
    if (!moved && gone.length === 0) return;
    const mode = this.mode(interaction);
    if (mode === 'none') return;
    if (ghosts) for (const item of gone) ghostOut(el, item, before.get(item)!, mode);
    const o = origin(el);
    const rects = new Map<Element, { x: number; y: number; width: number; height: number }>();
    for (const [item, s] of before) if (spots.has(item)) rects.set(item, { x: s.x + o.x, y: s.y + o.y, width: s.width, height: s.height });
    flipPlay({ rects }, { items: now, mode, spring: 'snappy', enter: 'pop' });
  }
}

/** A flip group of a component, in an injection context: call `update` from an afterRenderEffect. */
export function injectFlipGroup(options: FlipGroupOptions): FlipGroup {
  const motion = injectMotion();
  return new FlipGroup(options, (id) => motion.mode(id));
}

/** The first rows a popup staggers; the rest arrive with the last step. */
const STAGGER_ROWS = 12;

/** Rows of a popup that just opened arrive one stagger step apart, after the surface. */
export function staggerRows(container: Element | null, rows: string, mode: PatternMode): Animation[] {
  if (!container || mode === 'none') return [];
  const list = Array.from(container.querySelectorAll(rows)).slice(0, STAGGER_ROWS);
  return staggerGroup(list, { phase: 'enter', offset: 1, spring: 'soft', mode });
}

/** The rows of the ListBox inside a popup, as the React popups name them. */
export const POPUP_LIST_ROWS = "[data-ds='list-box'] [data-part='option']";

/** The part of a popup layer (internal/popper.ts) the open stagger needs. */
export interface StaggerLayer {
  mounted(): boolean;
  open(): void;
  readonly content: HTMLElement | null;
}

/**
 * Opens a popup layer; when it mounts fresh (not a reopen during its exit),
 * its rows arrive one stagger step after the surface (menu-rows), as
 * React's useStaggerOnOpen on the content's mount.
 */
export function openStaggered(layer: StaggerLayer, rows: string, mode: () => PatternMode): Animation[] {
  const fresh = !layer.mounted();
  layer.open();
  return fresh ? staggerRows(layer.content, rows, mode()) : [];
}
