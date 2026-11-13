'use client';
// Motion hooks of the selection controls and lists family (order 1.22),
// shared by ListBox, Select, Combobox, Autocomplete, MultiSelect, TagField,
// List and FilterBar. Not exported from the package barrel.
//
// The motion itself is the selection motion helper of @the-system/motion
// (helpers/selection-motion.ts), one copy for both frameworks: the row
// glide (watchGlide, interaction row-glide), add, remove and reorder
// (FlipGroup, interaction collection-flip) and the popup rows (staggerRows,
// interaction menu-rows). This file only starts and times them for React.
//
// Every hook reads the style's mode through useMotion().mode(id), so a
// style tunes or turns it off, and the person's reduced motion wins: the
// glide and the travel stop, entering items and rows fade in. Nothing waits
// on transitionend or animationend.
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import {
  FlipGroup,
  POPUP_LIST_ROWS,
  POPUP_RESULTS,
  exitGhost,
  staggerRows,
  watchGlide,
  type FlipGroupOptions,
  type RowGlideOptions,
} from '@the-system/motion';
import { useMotion } from '../../internal/motion';

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

/**
 * Plays add, remove and reorder on the items of `container` after each
 * commit that changed them (FLIP). The first commit only measures, so a
 * first paint plays nothing.
 */
export function useFlipGroup(container: RefObject<Element | null>, options: FlipGroupOptions): void {
  const motion = useMotion();
  const modeRef = useRef(motion.mode);
  modeRef.current = motion.mode;
  const group = useRef<FlipGroup | null>(null);
  group.current ??= new FlipGroup(options, (id) => modeRef.current(id));
  group.current.options = options;
  useLayoutEffect(() => {
    group.current?.update(container.current);
  });
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

/**
 * The rows of a picker popup (Combobox, Autocomplete, MultiSelect, TagField):
 * they stagger in after the surface when it opens (menu-rows), and when the
 * results change while it stays open (a query), the rows that stay slide to
 * their new place and the new ones rise in one short stagger step apart
 * (interaction "combobox-results", order 1.23). The highlight marker of the
 * ListBox follows the lit row on its own. Returns the ref callback for the
 * popup content; `forward` gets the node too.
 */
export function usePopupRows(forward?: (node: HTMLElement | null) => void) {
  const popup = useRef<HTMLElement | null>(null);
  const ref = useStaggerOnOpen(POPUP_LIST_ROWS, (node) => {
    // Review B6: the popup leaves at once on close and a copy plays the exit.
    if (!node) exitGhost(popup.current);
    popup.current = node;
    forward?.(node);
  });
  // The list, not the popup, so a scroll of the list is not read as a move.
  const list = useRef<{ readonly current: Element | null }>({
    get current() {
      return popup.current?.querySelector("[data-ds='list-box']") ?? null;
    },
  });
  useFlipGroup(list.current, POPUP_RESULTS);
  return ref;
}
