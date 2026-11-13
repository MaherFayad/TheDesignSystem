'use client';
// Motion helpers of the selection controls and lists family (order 1.22),
// shared by ListBox, Select, Combobox, Autocomplete, MultiSelect, TagField,
// List and FilterBar. Not exported from the package barrel.
//
// - useRowGlide (interaction row-glide): the lit row of a list draws its
//   fill on an unnamed aria-hidden layer inside the row (the first child,
//   `span[aria-hidden='true']` with no data-part). When the lit row changes,
//   the new row's layer travels from where the old row's layer was drawn, on
//   the snappy spring with a stretch along the travel (flipPlay). The row
//   itself never moves, so the pointer never chases a target, and the fill
//   is on the new row from the first frame for hit testing and reading.
// - useFlipGroup (interaction collection-flip): items of a collection that
//   change place travel from their old box (flipPlay); new items pop in; an
//   item that left is drawn once more by a clone in its old box that shrinks
//   out (flipExit), so the rest close the gap while it goes. The clone is
//   aria-hidden, inert, has no ids and takes no pointer.
// - staggerRows (interaction menu-rows): the rows of a popup that just opened
//   arrive one stagger step apart, after the surface (staggerGroup).
//
// Every helper reads the style's mode through useMotion().mode(id), so a
// style tunes or turns it off, and the person's reduced motion wins: the
// glide and the travel stop, entering items and rows fade in. Nothing waits
// on transitionend or animationend.
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { flipExit, flipPlay, rectOf, settled, staggerGroup, type PatternMode } from '@the-system/motion';
import { useMotion } from '../../internal/motion';

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

export interface RowGlideOptions {
  /** The rows that can be lit. */
  rows: string;
  /** What lights a row: an attribute the component sets (data-highlighted), or the pointer over it. */
  lit: { attribute: string } | 'hover';
  /** The interaction id the style's preset names. Default row-glide. */
  interaction?: string;
}

/** Starts the glide on `el`; returns the function that stops it. */
function watchGlide(el: Element, rows: string, attribute: string | null, mode: () => PatternMode): () => void {
  if (attribute !== null) {
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
  let current: Element | null = null;
  const over = (event: Event) => {
    const row = (event.target as Element | null)?.closest?.(rows) ?? null;
    if (!row || !el.contains(row) || row === current) return;
    const from = current;
    current = row;
    if (from) glide(from, row, mode());
  };
  const leave = () => {
    current = null;
  };
  el.addEventListener('pointerover', over);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointerover', over);
    el.removeEventListener('pointerleave', leave);
  };
}

/**
 * Glides the fill of the lit row between the rows of an element. Returns a
 * ref callback for the element that holds the rows (it may mount late, as a
 * popup does).
 */
export function useRowGlide({ rows, lit, interaction = 'row-glide' }: RowGlideOptions): (el: Element | null) => void {
  const motion = useMotion();
  const modeRef = useRef(motion.mode);
  modeRef.current = motion.mode;
  const stop = useRef<(() => void) | null>(null);
  const attribute = lit === 'hover' ? null : lit.attribute;
  useEffect(() => () => stop.current?.(), []);
  return useCallback(
    (el: Element | null) => {
      stop.current?.();
      stop.current = el ? watchGlide(el, rows, attribute, () => modeRef.current(interaction)) : null;
    },
    [rows, attribute, interaction],
  );
}

/** A box relative to the container's content origin, so a scroll or a page shift is not read as a move. */
interface Spot {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Drawn pixels per CSS pixel of `el`: above 1 under a zoom or a scale on an ancestor. */
function drawnScale(el: Element): number {
  const w = el instanceof HTMLElement ? el.offsetWidth : 0;
  const k = w > 0 ? el.getBoundingClientRect().width / w : 1;
  return Number.isFinite(k) && k > 0 ? k : 1;
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
  // Spots are drawn pixels; styles are CSS pixels (they differ under a zoom or a scale).
  const k = drawnScale(container);
  s.inlineSize = `${spot.width / k}px`;
  s.blockSize = `${spot.height / k}px`;
  s.pointerEvents = 'none';
  // Placed by measure: at the origin of its containing block first, then moved by the gap to the old box.
  s.insetBlockStart = '0';
  s.insetInlineStart = '0';
  container.append(clone);
  const at = clone.getBoundingClientRect();
  const o = origin(container);
  const dx = (o.x + spot.x - at.x) / k;
  const dy = (o.y + spot.y - at.y) / k;
  const rtl = getComputedStyle(clone).direction === 'rtl';
  s.insetBlockStart = `${dy}px`;
  s.insetInlineStart = `${rtl ? -dx : dx}px`;
  const exit = flipExit(clone, { mode });
  const drop = () => clone.remove();
  if (exit) settled(exit).then(drop, drop);
  else drop();
}

export interface FlipGroupOptions {
  /** The items of the collection, in order, read after each commit. */
  items: (container: Element) => Element[];
  /** The interaction id the style's preset names. Default collection-flip. */
  interaction?: string;
  /** Draw a removed item shrinking out. Default true. */
  ghosts?: boolean;
}

/**
 * Plays add, remove and reorder on the items of `container` after each
 * commit that changed them (FLIP). The first commit only measures, so a
 * first paint plays nothing.
 */
export function useFlipGroup(container: RefObject<Element | null>, { items, interaction = 'collection-flip', ghosts = true }: FlipGroupOptions): void {
  const motion = useMotion();
  const last = useRef<Map<Element, Spot> | null>(null);
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) {
      last.current = null;
      return;
    }
    // A clone still shrinking out is inert: it is not an item.
    const now = items(el).filter((item) => !item.hasAttribute('inert'));
    const before = last.current;
    const spots = spotsOf(el, now);
    last.current = spots;
    // Rows that arrive in an empty collection are a first paint, not an addition.
    if (!before || before.size === 0) return;
    const moved = now.some((item) => {
      const a = before.get(item);
      const b = spots.get(item);
      return !a || !b || Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5;
    });
    const gone = [...before.keys()].filter((item) => !spots.has(item));
    if (!moved && gone.length === 0) return;
    const mode = motion.mode(interaction);
    if (mode === 'none') return;
    if (ghosts) for (const item of gone) ghostOut(el, item, before.get(item)!, mode);
    const o = origin(el);
    const rects = new Map<Element, { x: number; y: number; width: number; height: number }>();
    for (const [item, s] of before) if (spots.has(item)) rects.set(item, { x: s.x + o.x, y: s.y + o.y, width: s.width, height: s.height });
    flipPlay({ rects }, { items: now, mode, spring: 'snappy', enter: 'pop' });
  });
}

/** The first rows a popup staggers; the rest arrive with the last step. */
const STAGGER_ROWS = 12;

/** Rows of a popup that just opened arrive one stagger step apart, after the surface. */
export function staggerRows(container: Element | null, rows: string, mode: PatternMode): Animation[] {
  if (!container || mode === 'none') return [];
  const list = Array.from(container.querySelectorAll(rows)).slice(0, STAGGER_ROWS);
  return staggerGroup(list, { phase: 'enter', offset: 1, spring: 'soft', mode });
}

/**
 * A ref callback for a popup content that staggers its rows when it mounts
 * (the popup opened), and forwards the node to `forward`.
 */
export function useStaggerOnOpen(rows: string, forward?: (node: HTMLElement | null) => void, interaction = 'menu-rows') {
  const motion = useMotion();
  const modeRef = useRef(motion.mode);
  modeRef.current = motion.mode;
  const forwardRef = useRef(forward);
  forwardRef.current = forward;
  return useCallback(
    (node: HTMLElement | null) => {
      forwardRef.current?.(node);
      if (node) staggerRows(node, rows, modeRef.current(interaction));
    },
    [rows, interaction],
  );
}
