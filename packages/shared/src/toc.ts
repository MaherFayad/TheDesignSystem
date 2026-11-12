/**
 * Table of contents helpers: build the nested list from a flat run of
 * headings, and pick the heading the reader is in from their positions.
 * Pure, shared by every framework.
 */

/** One heading of the page, in document order. Level 1 is the top level of the list, not h1. */
export interface TocHeading {
  /** The id of the heading element: the link goes to #id. */
  id: string;
  /** The text shown in the list. */
  label: string;
  /** Depth: 1 for the top level of the list, 2 under it, and so on. */
  level: number;
}

/** A heading with the headings nested under it. */
export interface TocNode extends TocHeading {
  children: TocNode[];
}

/**
 * Nests a flat run of headings by level. A heading deeper than the one
 * before it nests under that one, however many levels it skips, so an h2
 * followed by an h4 still reads as parent and child. Levels in the result are
 * the nesting depth, starting at 1.
 */
export function buildTree(headings: readonly TocHeading[]): TocNode[] {
  const roots: TocNode[] = [];
  // Open ancestors: the source level of each, and its node.
  const stack: { source: number; node: TocNode }[] = [];
  for (const h of headings) {
    while (stack.length > 0 && stack[stack.length - 1]!.source >= h.level) stack.pop();
    const node: TocNode = { id: h.id, label: h.label, level: stack.length + 1, children: [] };
    if (stack.length === 0) roots.push(node);
    else stack[stack.length - 1]!.node.children.push(node);
    stack.push({ source: h.level, node });
  }
  return roots;
}

/** The headings of a tree in document order, with their nesting depth as level. */
export function flattenTree(nodes: readonly TocNode[]): TocHeading[] {
  const out: TocHeading[] = [];
  const walk = (list: readonly TocNode[]) => {
    for (const n of list) {
      out.push({ id: n.id, label: n.label, level: n.level });
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** Where a heading sits: its id and the distance of its top edge from the top of the viewport, in px. */
export interface HeadingRect {
  id: string;
  top: number;
}

/**
 * The heading the reader is in: the last one whose top edge has passed
 * `offset` px from the top of the viewport (the height of a sticky header,
 * plus a little). Before the first heading it is the first. With `atEnd`
 * (the page is scrolled to the bottom) it is the last, so a short final
 * section can still be marked. Rects are in document order. No rects give
 * null.
 */
export function activeHeading(rects: readonly HeadingRect[], offset = 0, atEnd = false): string | null {
  if (rects.length === 0) return null;
  if (atEnd) return rects[rects.length - 1]!.id;
  let active = rects[0]!.id;
  for (const r of rects) {
    if (r.top - offset <= 1) active = r.id;
    else break;
  }
  return active;
}
