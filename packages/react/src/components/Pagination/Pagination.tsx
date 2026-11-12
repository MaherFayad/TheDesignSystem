'use client';
// Pagination: moves between pages of a list. A labelled `nav` of system
// Buttons and IconButtons, or links (Button asChild) when `getHref` is set.
//
// No source: designed from the dials table (PLAN.md 3.7) and the nearest
// components, Button ghost and the ToggleGroup item look.
//
// The DOM:
//
//   <nav data-ds="pagination" aria-label="Pagination" data-size data-shape>
//     <span data-part="summary">21 to 40 of 312</span>          with itemCount
//     <button data-ds="icon-button" data-part="first">          chevrons-back, mirrored in RTL
//     <button data-ds="icon-button" data-part="previous">       chevron-back
//     <button data-ds="button" data-part="page" aria-current="page" data-active>
//     <span data-part="ellipsis" aria-hidden="true">
//     <button data-ds="icon-button" data-part="next">           chevron-forward
//     <button data-ds="icon-button" data-part="last">           chevrons-forward
//
// Decisions:
// - Page numbers come from pageRange in @the-system/shared: the row keeps the
//   same length as the page changes, so controls do not jump under the
//   pointer. Each page control is keyed by its number, so focus stays on the
//   control the reader pressed.
// - The ends stay focusable when there is nowhere to go (aria-disabled and
//   data-disabled, the Button rule), so focus is not lost on the last page.
// - Numbers use Western digits in both languages, grouped with a comma.
// - Under breakpoint.phone the compact form keeps the ends and the current
//   page and the last page (CSS), with a compact-only ellipsis (data-compact)
//   between them when pages are hidden, and the summary wraps above.
import { useMemo, type HTMLAttributes, type MouseEvent, type ReactElement, type Ref } from 'react';
import type { IconName } from '@the-system/icons/react';
import { clampPage, isEllipsis, itemRange, pageCount as countPages, pageRange, type Shape, type Size } from '@the-system/shared';
import { useTheme } from '../../theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { useControllable } from '../../internal/useControllable';

export type PaginationSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type PaginationShape = Extract<Shape, 'default' | 'pill' | 'square'>;

const digits = new Intl.NumberFormat('en-US');
const n = (value: number) => digits.format(value);

const words = {
  en: {
    label: 'Pagination',
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    page: (p: number) => `Page ${n(p)}`,
    summary: (s: number, e: number, t: number) => `${n(s)} to ${n(e)} of ${n(t)}`,
    empty: 'No items',
  },
  ar: {
    label: 'التنقل بين الصفحات',
    first: 'الصفحة الأولى',
    previous: 'الصفحة السابقة',
    next: 'الصفحة التالية',
    last: 'الصفحة الأخيرة',
    page: (p: number) => `صفحة ${n(p)}`,
    summary: (s: number, e: number, t: number) => `${n(s)} إلى ${n(e)} من ${n(t)}`,
    empty: 'ما فيه عناصر',
  },
} as const;

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children' | 'onChange'> {
  /** The current page, from 1. Controlled, with onPageChange. */
  page?: number;
  /** The first page shown when uncontrolled. Default 1. */
  defaultPage?: number;
  /** Called with the new page when a control is pressed. */
  onPageChange?: (page: number) => void;
  /** The number of pages. Default: worked out from itemCount and pageSize, else 1. */
  pageCount?: number;
  /** The number of items in the list. Turns on the summary ("21 to 40 of 312"). */
  itemCount?: number;
  /** Items per page, for the summary and the page count. Default 20. */
  pageSize?: number;
  /** Pages shown on each side of the current page. Default 1. */
  siblings?: number;
  /** Pages always shown at each end. Default 1. */
  boundaries?: number;
  /** Shows the first and last page buttons. Default true. */
  showEnds?: boolean;
  /** Turns every control into a link to this URL. Default none: buttons. */
  getHref?: (page: number) => string;
  /** Control height, as Button: sm 28, md 32, lg 44. Default md. */
  size?: PaginationSize;
  /** Corner shape of every control, as Button. Default default. */
  shape?: PaginationShape;
  /** Every control is inert, for example while the list loads. Default false. */
  disabled?: boolean;
  /** The accessible name of the nav. Default "Pagination", in Arabic "التنقل بين الصفحات". */
  label?: string;
  /** Replaces the summary text. Gets the first item, the last item and the total (0, 0 and 0 for an empty list). Default "21 to 40 of 312", and "No items" for an empty list. */
  formatSummary?: (start: number, end: number, total: number) => string;
  ref?: Ref<HTMLElement>;
}

/** Page controls with first, previous, numbers, next and last, and an optional item summary. */
export function Pagination({
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  pageCount,
  itemCount,
  pageSize = 20,
  siblings = 1,
  boundaries = 1,
  showEnds = true,
  getHref,
  size = 'md',
  shape = 'default',
  disabled = false,
  label,
  formatSummary,
  ref,
  ...rest
}: PaginationProps) {
  const { lang } = useTheme();
  const t = words[lang === 'ar' ? 'ar' : 'en'];
  // A page size or item count that is not a finite number never reaches the count or the summary.
  const perPage = Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 20;
  const items = itemCount !== undefined && Number.isFinite(itemCount) ? itemCount : undefined;
  const raw = pageCount ?? (items !== undefined ? countPages(items, perPage) : 1);
  // Never under one page: a count of 0 or NaN still shows page 1 with inert ends.
  const total = Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 1;
  const [rawPage, setPage] = useControllable(pageProp, defaultPage, onPageChange);
  const page = clampPage(rawPage, total);
  const range = useMemo(() => pageRange(page, total, siblings, boundaries), [page, total, siblings, boundaries]);

  const go = (to: number) => (event: MouseEvent<HTMLElement>) => {
    // A link opened in a new tab or window leaves this page where it is.
    if (getHref && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    if (!getHref) event.preventDefault();
    if (to !== page) setPage(to);
  };

  /** A link child for getHref, else nothing: the Button renders its own <button>. */
  const linkTo = (to: number, text?: string): ReactElement | undefined =>
    getHref ? <a href={getHref(to)}>{text}</a> : undefined;

  const end = (part: 'first' | 'previous' | 'next' | 'last', icon: IconName, to: number) => {
    const inert = disabled || to === page;
    const link = linkTo(to);
    // An inert link loses its href in Button, which would take it out of the tab order: tabIndex 0 keeps it there.
    return (
      <IconButton
        data-part={part}
        icon={icon}
        label={t[part]}
        size={size}
        shape={shape}
        disabled={inert}
        tabIndex={inert && link !== undefined ? 0 : undefined}
        onClick={go(to)}
        asChild={link !== undefined}
      >
        {link}
      </IconButton>
    );
  };

  // No summary for an item count that is not a finite number (NaN, Infinity): it would print as "NaN" or "∞".
  const summary =
    items !== undefined
      ? (() => {
          const r = itemRange(page, perPage, items);
          if (r.total === 0 && !formatSummary) return t.empty;
          return (formatSummary ?? t.summary)(r.start, r.end, r.total);
        })()
      : undefined;

  return (
    <nav {...rest} ref={ref} data-ds="pagination" data-size={size} data-shape={shape} aria-label={label ?? t.label}>
      {summary !== undefined && <span data-part="summary">{summary}</span>}
      {showEnds && end('first', 'chevrons-back', 1)}
      {end('previous', 'chevron-back', Math.max(1, page - 1))}
      {/* flatMap keys every element at one level, so a page keeps its Button (and focus) when the window of pages shifts. */}
      {range.flatMap((item) => {
        if (isEllipsis(item)) {
          return [
            <span key={item} data-part="ellipsis" aria-hidden="true">
              …
            </span>,
          ];
        }
        const active = item === page;
        const text = n(item);
        // The compact form hides every page but the current and the last; this marks the pages between them.
        const compactGap =
          item === total && total - page > 1 ? (
            <span key="compact-gap" data-part="ellipsis" data-compact="" aria-hidden="true">
              …
            </span>
          ) : null;
        const link = linkTo(item, text);
        const pageButton = (
          <Button
            key={`page-${item}`}
            data-part="page"
            data-active={active ? '' : undefined}
            aria-current={active ? 'page' : undefined}
            aria-label={t.page(item)}
            size={size}
            shape={shape}
            emphasis={active ? 'soft' : 'ghost'}
            disabled={disabled}
            tabIndex={disabled && link !== undefined ? 0 : undefined}
            onClick={go(item)}
            asChild={link !== undefined}
          >
            {link ?? text}
          </Button>
        );
        return compactGap ? [compactGap, pageButton] : [pageButton];
      })}
      {end('next', 'chevron-forward', Math.min(total, page + 1))}
      {showEnds && end('last', 'chevrons-forward', total)}
    </nav>
  );
}
