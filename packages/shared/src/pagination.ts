/**
 * Pagination helpers: which page numbers to show, and which items a page
 * holds. Pure, shared by every framework. Pages are numbered from 1.
 *
 * `pageRange` keeps the first and last `boundaries` pages, the current page
 * with `siblings` pages on each side, and puts an ellipsis marker where pages
 * are left out. A gap of exactly one page shows that page instead of an
 * ellipsis, so the length stays the same as the current page moves and the
 * controls do not jump under the pointer.
 */

/** Marks a run of hidden pages before or after the current page. */
export type PageEllipsis = 'ellipsis-start' | 'ellipsis-end';

/** One slot of a page range: a page number or an ellipsis marker. */
export type PageRangeItem = number | PageEllipsis;

/** True when a range slot is an ellipsis marker. */
export function isEllipsis(item: PageRangeItem): item is PageEllipsis {
  return typeof item !== 'number';
}

function span(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i += 1) out.push(i);
  return out;
}

/** Clamps a page number into 1 to total. A total under 1 gives 1. */
export function clampPage(page: number, total: number): number {
  const last = Math.max(1, Math.floor(total));
  if (!Number.isFinite(page)) return 1;
  return Math.min(last, Math.max(1, Math.floor(page)));
}

/**
 * The page numbers to show for `current` of `total` pages, with ellipsis
 * markers for hidden runs. `siblings` pages on each side of the current page
 * (default 1) and `boundaries` pages at each end (default 1). A total under 1
 * gives an empty list.
 */
export function pageRange(current: number, total: number, siblings = 1, boundaries = 1): PageRangeItem[] {
  const count = Math.floor(total);
  if (!Number.isFinite(count) || count < 1) return [];
  const page = clampPage(current, count);
  const sib = Math.max(0, Math.floor(siblings));
  const bound = Math.max(0, Math.floor(boundaries));

  // Short enough to show every page: the boundaries, the siblings, the current page and two slots for ellipses.
  if (count <= 2 * bound + 2 * sib + 3) return span(1, count);

  const start = span(1, bound);
  const end = span(count - bound + 1, count);
  // Keep the window of siblings the same width near the ends.
  const lo = Math.max(Math.min(page - sib, count - bound - 2 * sib - 1), bound + 2);
  const hi = Math.min(Math.max(page + sib, bound + 2 * sib + 2), count - bound - 1);

  const out: PageRangeItem[] = [...start];
  out.push(lo > bound + 2 ? 'ellipsis-start' : bound + 1);
  out.push(...span(lo, hi));
  out.push(hi < count - bound - 1 ? 'ellipsis-end' : count - bound);
  out.push(...end);
  return out;
}

/** The items one page holds, numbered from 1. An empty list gives start 0 and end 0. */
export interface ItemRange {
  start: number;
  end: number;
  total: number;
}

/** The first and last item on `page` for `pageSize` items per page out of `total`: page 2 of 20 per page out of 312 is 21 to 40. */
export function itemRange(page: number, pageSize: number, total: number): ItemRange {
  const count = Math.max(0, Math.floor(total));
  const size = Math.max(1, Math.floor(pageSize));
  if (count === 0) return { start: 0, end: 0, total: 0 };
  const p = clampPage(page, Math.ceil(count / size));
  const start = (p - 1) * size + 1;
  return { start, end: Math.min(count, p * size), total: count };
}

/** The number of pages for `total` items at `pageSize` per page. At least 1. */
export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, Math.floor(pageSize))));
}
