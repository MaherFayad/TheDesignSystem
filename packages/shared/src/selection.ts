// Helpers for SelectionMenu (order M9.11, proposed): the box of a selection
// range, which side of it the menu opens on, how its actions split into
// pages when they do not fit, and what the clipboard allows.
//
// Pure TypeScript. The functions that read the DOM take the node or the
// range they work on and never touch `window` at module scope.

/** A box on the screen in CSS px. A DOMRect fits. */
export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/** A box from its position and size. */
export function selectionBox(x: number, y: number, width: number, height: number): SelectionBox {
  return { x, y, width, height, top: y, left: x, right: x + width, bottom: y + height };
}

/** The empty box, at the top left corner of the viewport. */
export const EMPTY_SELECTION_BOX: SelectionBox = selectionBox(0, 0, 0, 0);

/** The part of a Range this file reads. A DOM Range fits. */
export interface RangeLike {
  collapsed: boolean;
  startContainer: Node;
  getBoundingClientRect(): { x: number; y: number; width: number; height: number };
  getClientRects(): ArrayLike<{ x: number; y: number; width: number; height: number }>;
}

/**
 * The box of a range on the screen: the box around every line it covers.
 * A collapsed range (a caret) has no width; when the engine gives it no box
 * at all, the box of its first line rect is used, else the box of the
 * element that holds it, so a menu for a point never jumps to the corner.
 */
export function rangeRect(range: RangeLike): SelectionBox {
  const box = range.getBoundingClientRect();
  if (box.width > 0 || box.height > 0) return selectionBox(box.x, box.y, box.width, box.height);
  const rects = range.getClientRects();
  const first = rects.length > 0 ? rects[0] : undefined;
  if (first && (first.width > 0 || first.height > 0)) return selectionBox(first.x, first.y, 0, first.height);
  const node = range.startContainer;
  const el = (node.nodeType === 1 ? node : node.parentElement) as Element | null;
  if (el && typeof el.getBoundingClientRect === 'function') {
    const r = el.getBoundingClientRect();
    return selectionBox(r.x, r.y, r.width, r.height);
  }
  return EMPTY_SELECTION_BOX;
}

export type SelectionSide = 'top' | 'bottom';

export interface SelectionSideInput {
  /** The box of the selection. */
  anchor: Pick<SelectionBox, 'top' | 'bottom'>;
  /** The height of the menu. */
  menuHeight: number;
  /** The top and the bottom of the room the menu may use: the viewport, or the visual viewport above a keyboard. */
  viewportTop?: number;
  viewportBottom: number;
  /** The space between the selection and the menu. */
  gap: number;
  /** The space kept from the edges of the room. */
  padding?: number;
}

/**
 * Where the menu opens: above the selection when it fits there, else below
 * it when it fits there, else on the side with more room. The menu never
 * covers the selection when either side has room (WCAG 2.4.11).
 */
export function selectionSide({ anchor, menuHeight, viewportTop = 0, viewportBottom, gap, padding = 0 }: SelectionSideInput): SelectionSide {
  const need = menuHeight + gap;
  const above = anchor.top - (viewportTop + padding);
  const below = viewportBottom - padding - anchor.bottom;
  if (above >= need) return 'top';
  if (below >= need) return 'bottom';
  return below > above ? 'bottom' : 'top';
}

/**
 * Splits actions into pages that fit a row. `widths` are the widths of the
 * actions in order, `room` the inline room of the row, `more` the width of
 * the control that pages forward or back. Every page but the last ends in a
 * forward control and every page but the first starts with a back control,
 * so those take room too. A page always holds at least one action. Returns
 * the action indexes of each page; one page when everything fits.
 */
export function pageActions(widths: readonly number[], room: number, more: number): number[][] {
  const pages: number[][] = [];
  const n = widths.length;
  let i = 0;
  while (i < n) {
    const back = pages.length > 0 ? more : 0;
    let rest = 0;
    for (let k = i; k < n; k += 1) rest += widths[k] ?? 0;
    if (rest <= room - back) {
      pages.push(range(i, n));
      break;
    }
    const budget = room - back - more;
    const page: number[] = [];
    let used = 0;
    while (i < n && (page.length === 0 || used + (widths[i] ?? 0) <= budget)) {
      used += widths[i] ?? 0;
      page.push(i);
      i += 1;
    }
    pages.push(page);
  }
  return pages;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k);
}

/** The page that holds an action, or 0. */
export function pageOf(pages: readonly (readonly number[])[], action: number): number {
  const found = pages.findIndex((p) => p.includes(action));
  return found < 0 ? 0 : found;
}

/** What the page may do with the clipboard. */
export interface ClipboardAccess {
  /** Text can be written: copy and cut. */
  write: boolean;
  /** Text can be read: paste, on a user activation only. */
  read: boolean;
}

/** The part of `navigator` and `window` this file reads. */
export interface ClipboardEnv {
  isSecureContext?: boolean;
  navigator?: { clipboard?: { writeText?: unknown; readText?: unknown } };
}

/**
 * Feature tests the Clipboard API, never assumes it (frameworks.md, "System
 * services"). It needs a secure context. Firefox and some web views have
 * writeText but not readText, so paste is tested on its own.
 */
export function clipboardAccess(env: ClipboardEnv | undefined): ClipboardAccess {
  if (!env || env.isSecureContext === false) return { write: false, read: false };
  const clip = env.navigator?.clipboard;
  return { write: typeof clip?.writeText === 'function', read: typeof clip?.readText === 'function' };
}

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number', '']);

/**
 * True for a node inside a native text field (a text input or a textarea)
 * or an editable region. SelectionMenu never opens there: the browser's own
 * menu serves it.
 */
export function isTextEntry(node: Node | null | undefined): boolean {
  let el = (node && node.nodeType === 1 ? node : node?.parentElement) as HTMLElement | null | undefined;
  while (el) {
    const tag = el.tagName;
    if (tag === 'TEXTAREA') return true;
    if (tag === 'INPUT') return TEXT_INPUT_TYPES.has(((el as HTMLInputElement).type ?? '').toLowerCase());
    if (el.isContentEditable || el.getAttribute?.('contenteditable') === 'true' || el.getAttribute?.('contenteditable') === '') return true;
    el = el.parentElement;
  }
  return false;
}

/** The part of a keyboard event this file reads. */
export interface MenuKeyLike {
  key: string;
  shiftKey: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

/** True for the keys that open a context menu: the context menu key, or Shift+F10. */
export function isMenuKey(event: MenuKeyLike): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey) return false;
  return event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey);
}
