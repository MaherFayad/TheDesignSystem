// Motion helpers of the selection controls and lists family (orders 1.22 and
// 1.23), shared by ListBox, Select, Combobox, Autocomplete, MultiSelect,
// TagField, List and FilterBar. One copy for both frameworks (order 1.29):
// React keeps its hooks in
// packages/react/src/components/ListBox/selectionMotion.ts and Angular its
// wiring in packages/angular/src/internal/motion-selection.ts; both import
// these from @the-system/motion.
//
// - Row glide (interaction row-glide): the lit row of a list draws its fill
//   on an unnamed aria-hidden layer inside the row (the first child,
//   `span[aria-hidden='true']` with no data-part). When the lit row changes,
//   the new row's layer travels from where the old row's layer was drawn, on
//   the snappy spring with a stretch along the travel (flipPlay). The row
//   itself never moves, so the pointer never chases a target, and the fill
//   is on the new row from the first frame for hit testing and reading.
// - Flip group (interaction collection-flip): items of a collection that
//   change place travel from their old box (flipPlay); new items pop in; an
//   item that left is drawn once more by a clone in its old box that shrinks
//   out (flipExit), so the rest close the gap while it goes. The clone is
//   aria-hidden, inert, has no ids and takes no pointer.
// - staggerRows (interaction menu-rows): the rows of a popup that just opened
//   arrive one stagger step apart, after the surface (staggerGroup).
// - rollValue (interaction picker-value-roll): the value of a Select rolls to
//   the new label like a drum.
//
// Every helper takes the style's mode for its interaction, so a style tunes
// or turns it off, and the person's reduced motion wins: the glide and the
// travel stop, entering items and rows fade in. Nothing waits on
// transitionend or animationend.
import { ANIMATION_ID_PREFIX, readDuration, readEasing, settled, type PatternMode } from '../core';
import { flipExit, flipPlay, rectOf } from '../primitives/flip';
import { STAGGER_ID, staggerGroup, staggerStep } from '../primitives/stagger';
import { STAGGER_DELAY, STAGGER_MAX_STEPS, distanceVar, played, run, spec, springTiming, stepsWithin } from '../primitives/shared';
import { drawnScale } from './selection-marker';

// ---------------------------------------------------------------- row glide

/** The glide layer of a row: its first unnamed aria-hidden span. */
export const GLIDE_LAYER = ":scope > span[aria-hidden='true']:not([data-part])";

function layerOf(row: Element | null | undefined): Element | null {
  return row?.querySelector(GLIDE_LAYER) ?? null;
}

/** Travels the layer of `to` from where the layer of `from` is drawn now. */
export function glideRow(from: Element | null | undefined, to: Element | null | undefined, mode: PatternMode): Animation[] {
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

/**
 * Starts the glide on `el`; returns the function that stops it. Rows are lit
 * by `attribute` (a MutationObserver sees it move), or by the pointer over
 * them when `attribute` is null.
 */
export function watchGlide(el: Element, rows: string, attribute: string | null, mode: () => PatternMode): () => void {
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
      if (from && to) glideRow(from, to, mode());
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
    if (from) glideRow(from, row, mode());
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

// ---------------------------------------------------------------- flip group

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
  /** The items of the collection, in order, read after each render. */
  items: (container: Element) => Element[];
  /** The interaction id the style's preset names. Default collection-flip. */
  interaction?: string;
  /** Draw a removed item shrinking out. Default true. */
  ghosts?: boolean;
  /**
   * An item that moved farther than the container is tall (it was out of
   * view in a list that scrolls) arrives like a new item instead of flying
   * across the list. Default false. Order 1.23.
   */
  nearOnly?: boolean;
}

/**
 * Plays add, remove and reorder on the items of a container after each
 * render that changed them (FLIP). The first update only measures, so a
 * first paint plays nothing. React calls `update` from a layout effect with
 * no dependencies (useFlipGroup), Angular from afterRenderEffect. `options`
 * may be replaced between updates (React passes the latest props).
 */
export class FlipGroup {
  private last: Map<Element, Spot> | null = null;

  constructor(
    public options: FlipGroupOptions,
    private readonly mode: (interaction: string) => PatternMode,
  ) {}

  /** Measures the items of `el` and plays what changed since the last update. */
  update(el: Element | null | undefined): void {
    const { items, interaction = 'collection-flip', ghosts = true, nearOnly = false } = this.options;
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
    const far = nearOnly ? el.clientHeight : Infinity;
    for (const [item, s] of before) {
      const at = spots.get(item);
      if (!at || Math.abs(at.y - s.y) > far) continue;
      rects.set(item, { x: s.x + o.x, y: s.y + o.y, width: s.width, height: s.height });
    }
    flipPlay({ rects }, { items: now, mode, spring: 'snappy', enter: 'pop' });
  }
}

// ---------------------------------------------------------------- popup rows

/** The first rows a popup staggers; the rest arrive with the last step. */
export const STAGGER_ROWS = 12;

/**
 * Rows of a popup that just opened (order 1.29, review N25 and ten weakest
 * #9): every row fades in with the surface, on its spring with no delay, so
 * no empty card shows and the last row is readable when the surface is; only
 * the rise is staggered, one step apart after the surface. Reduced: a fade
 * with no delay.
 */
export function staggerRows(container: Element | null, rows: string, mode: PatternMode): Animation[] {
  if (!container || mode === 'none') return [];
  const list = Array.from(container.querySelectorAll(rows)).slice(0, STAGGER_ROWS);
  if (mode === 'reduced' || list.length === 0) return staggerGroup(list, { phase: 'enter', mode });
  const maxSteps = Math.min(STAGGER_MAX_STEPS, stepsWithin(list[0], STAGGER_MAX_STEPS));
  return played(
    list.flatMap((el, i) => {
      const step = staggerStep(i, { offset: 1, maxSteps });
      const fade = spec([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 1 }], { duration: 'duration.spring-snappy', easing: 'ease.out' });
      const rise = spec([{ transform: `translateY(${distanceVar('distance.enter')})` }, { transform: 'none' }], springTiming('soft'), {
        delay: STAGGER_DELAY,
        delaySteps: step,
        fill: 'backwards',
      });
      return [run(el, fade, STAGGER_ID), run(el, rise, STAGGER_ID)];
    }),
  );
}

/** The option rows of the ListBox inside a picker popup. */
export const POPUP_LIST_ROWS = "[data-ds='list-box'] [data-part='option']";

/** The flip group options of interaction "combobox-results": the options of the ListBox in a picker popup. */
export const POPUP_RESULTS: FlipGroupOptions = {
  items: (el) => Array.from(el.querySelectorAll("[data-part='option']")),
  interaction: 'combobox-results',
  ghosts: false,
  nearOnly: true,
};

// ---------------------------------------------------------------- picker value roll

const ROLL_ID = `${ANIMATION_ID_PREFIX}picker-value-roll`;

/**
 * Interaction "picker-value-roll": the value part rolls to the new label like
 * a drum. The new label comes up from one line below and the old one, drawn
 * once more by an inert aria-hidden copy laid over the value part, leaves one
 * line up. A clip-path that moves against the travel keeps both inside the
 * value box (the value part itself is what moves, so its own overflow cannot
 * clip it). The new label is the real text from the first frame. Reduced: a
 * fade of the new label. Never waits on animationend.
 */
export function rollValue(el: HTMLElement | null, before: string | null, mode: PatternMode): void {
  if (!el || mode === 'none' || typeof el.animate !== 'function') return;
  const reduced = mode === 'reduced';
  const duration = readDuration(el, reduced ? 'duration.base' : 'duration.spring-snappy');
  for (const a of el.getAnimations?.() ?? []) if (String(a.id) === ROLL_ID) a.cancel();
  if (reduced) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { id: ROLL_ID, duration, easing: readEasing(el, 'ease.out') });
    return;
  }
  const easing = readEasing(el, 'ease.spring-snappy');
  el.animate(
    [
      { transform: 'translateY(100%)', clipPath: 'inset(0 0 100% 0)' },
      { transform: 'none', clipPath: 'inset(0 0 0 0)' },
    ],
    { id: ROLL_ID, duration, easing },
  );
  const host = el.parentElement;
  if (!before || !host) return;
  // The old label, once more, over the value part: it rolls up and out, faster than the new one comes in.
  const ghost = el.ownerDocument.createElement('span');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.setAttribute('inert', '');
  ghost.textContent = before;
  // The value part may still be empty here (the framework fills it after this render): the copy spans from
  // its inline start to the icon, over the full height of the trigger, its text centred as the value's is.
  const h = host.getBoundingClientRect();
  const v = el.getBoundingClientRect();
  const icon = el.nextElementSibling as HTMLElement | null;
  const hs = getComputedStyle(host);
  const rtl = hs.direction === 'rtl';
  // Drawn px back to CSS px (a CSS zoom on the page).
  const k = drawnScale(host);
  const start = (rtl ? h.right - v.right : v.left - h.left) / k - host.clientLeft;
  const padEnd = parseFloat(rtl ? hs.paddingLeft : hs.paddingRight) || 0;
  const gap = parseFloat(hs.columnGap) || 0;
  const room = host.clientWidth - start - padEnd - (icon?.offsetWidth ?? 0) - gap;
  const g = ghost.style;
  g.position = 'absolute';
  g.insetBlockStart = '0';
  g.insetInlineStart = `${start}px`;
  g.inlineSize = `${Math.max(0, room)}px`;
  g.blockSize = `${host.clientHeight}px`;
  g.display = 'flex';
  g.alignItems = 'center';
  g.overflow = 'hidden';
  g.whiteSpace = 'nowrap';
  g.textOverflow = 'ellipsis';
  g.pointerEvents = 'none';
  g.color = getComputedStyle(el).color;
  host.append(ghost);
  const out = ghost.animate(
    [
      { transform: 'none', clipPath: 'inset(0 0 0 0)', opacity: 1 },
      { transform: 'translateY(-100%)', clipPath: 'inset(100% 0 0 0)', opacity: 0 },
    ],
    { id: ROLL_ID, duration: readDuration(el, 'duration.quick') || duration, easing: readEasing(el, 'ease.exit'), fill: 'forwards' },
  );
  const drop = () => ghost.remove();
  out.finished.then(drop, drop);
}
