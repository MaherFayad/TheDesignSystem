// Motion of the selection controls and lists family (order 1.22), shared by
// ListBox, Select, Combobox, Autocomplete, MultiSelect, TagField and
// FilterBar: the Angular wiring only. The row glide, the flip group, the
// popup row stagger and the value roll are framework free and live once in
// @the-system/motion (helpers/selection-motion.ts, order 1.29), next to
// React's hooks; components import them from there.
//
// This file keeps what needs an injection context: injectRowGlide,
// injectFlipGroup (call `update` from an afterRenderEffect), openStaggered
// on a popup layer and injectPopupResults. Each reads the style's mode
// through injectMotion().mode(id), so a style tunes or turns it off, and
// the person's reduced motion wins. Nothing waits on transitionend or
// animationend.
import { DestroyRef, afterEveryRender, inject, untracked } from '@angular/core';
import { FlipGroup, POPUP_RESULTS, staggerRows, watchGlide, type FlipGroupOptions, type PatternMode } from '@the-system/motion';
import { injectMotion } from './motion';

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

/** A flip group of a component, in an injection context: call `update` from an afterRenderEffect. */
export function injectFlipGroup(options: FlipGroupOptions): FlipGroup {
  const motion = injectMotion();
  return new FlipGroup(options, (id) => motion.mode(id));
}

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

/** The part of a popup layer the results flip needs. */
export interface ResultsLayer {
  mounted(): boolean;
  readonly content: HTMLElement | null;
}

/**
 * Interaction "combobox-results" (order 1.23), as React's usePopupRows in
 * selectionMotion.ts: while the popup of a picker stays open and its results
 * change (a query), the rows that stay slide to their new place and the new
 * ones rise one short stagger step apart; a row that was out of view arrives
 * as new. Measured on the ListBox inside the popup, not the popup, so a scroll
 * of the list is not read as a move. Call in an injection context. The open stagger
 * (openStaggered) and the exit copy (PopupLayer.close) are the other two
 * parts of React's usePopupRows.
 */
export function injectPopupResults(layer: ResultsLayer): FlipGroup {
  const flip = injectFlipGroup(POPUP_RESULTS);
  // After every render while it is mounted, as React's layout effect with no dependencies runs on every
  // commit of the picker: a row that moved since the last render (a new query) flips.
  let was = false;
  afterEveryRender(() => {
    const mounted = untracked(() => layer.mounted());
    if (!mounted && !was) return;
    was = mounted;
    flip.update(mounted ? (layer.content?.querySelector("[data-ds='list-box']") ?? null) : null);
  });
  return flip;
}
