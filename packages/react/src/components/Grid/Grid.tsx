// Grid: a two dimension layout with responsive columns. A CSS grid with a
// fixed column count (1 to 12) or as many columns as fit (auto-fit) at a
// minimum item size. Fixed counts fall to one column under breakpoint.phone
// unless keepColumns is set, so nothing scrolls sideways at 320px.
//
// Source: GoBanana `.st-tile-grid` could not be read in this session (the repo
// was not reachable); the behavior follows the order and the dials table, and
// Studio's 1px tile gap belongs to Bento. GridItem is the optional span
// wrapper (`data-part="item"`).
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import type { SpaceStep } from '../Stack/space';

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto-fit';
/** The smallest item width for auto-fit: sm 10rem, md 15rem, lg 24rem (derived from the breakpoint tokens). */
export type GridMinItemSize = 'sm' | 'md' | 'lg';
export type GridElement = 'div' | 'section' | 'ul' | 'ol';

export interface GridProps extends HTMLAttributes<HTMLElement> {
  /** A column count from 1 to 12, or auto-fit: as many columns as fit at minItemSize. Default auto-fit. */
  columns?: GridColumns;
  /** The smallest item width with columns auto-fit. Default md. Ignored with a number. */
  minItemSize?: GridMinItemSize;
  /** Space between cells, both axes, a `space.*` step. Default l. */
  gap?: SpaceStep;
  /** Space between rows when it differs from gap. */
  rowGap?: SpaceStep;
  /** Keeps a fixed column count on phones instead of falling to one column. Default false. */
  keepColumns?: boolean;
  /** The element to render. Default div. ul and ol get role list and no bullets; use GridItem as li. */
  as?: GridElement;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}

/**
 * Lays its children out in columns and rows. Reading order and focus order
 * are the DOM order: cells fill the start side first, the right in Arabic.
 */
export function Grid({
  columns = 'auto-fit',
  minItemSize = 'md',
  gap = 'l',
  rowGap,
  keepColumns = false,
  as: Element = 'div',
  ref,
  children,
  ...rest
}: GridProps) {
  const listRole = Element === 'ul' || Element === 'ol' ? 'list' : undefined;
  const attrs = {
    role: listRole,
    ...rest,
    ref,
    'data-ds': 'grid',
    'data-columns': String(columns),
    'data-min': columns === 'auto-fit' ? minItemSize : undefined,
    'data-gap': gap,
    'data-row-gap': rowGap,
    'data-keep-columns': keepColumns ? '' : undefined,
  };
  const Tag = Element as 'div';
  return <Tag {...(attrs as HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> })}>{children}</Tag>;
}

export type GridSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full';
export type GridRowSpan = 1 | 2 | 3 | 4;

export interface GridItemProps extends HTMLAttributes<HTMLElement> {
  /** Columns the item spans, or full for the whole row. Default 1. Falls to one column with the grid on phones. */
  span?: GridSpan;
  /** Rows the item spans. Default 1. */
  rowSpan?: GridRowSpan;
  /** The element to render. Default div; li inside a list Grid. */
  as?: 'div' | 'li' | 'article' | 'section';
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}

/** An optional wrapper that lets one cell span more columns or rows. */
export function GridItem({ span = 1, rowSpan = 1, as: Element = 'div', ref, children, ...rest }: GridItemProps) {
  const attrs = {
    ...rest,
    ref,
    'data-part': 'item',
    'data-span': span === 1 ? undefined : String(span),
    'data-row-span': rowSpan === 1 ? undefined : String(rowSpan),
  };
  const Tag = Element as 'div';
  return <Tag {...(attrs as HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> })}>{children}</Tag>;
}
