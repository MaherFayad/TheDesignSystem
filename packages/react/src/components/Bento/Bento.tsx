// Bento: a grid of tiles of mixed sizes for overviews and landing sections.
//
// Sources: the tile grid of Figma-Killer-2 (the Widget tile and its
// dashboard grid: borderless tiles on a darker parent, set apart by a 1px
// gap). GoBanana `.st-tile-grid`, `.st-tile` and site `landing.css` could
// not be read in the lane session that built this file.
//
// Hand built on CSS grid. Items flow in source order with no dense packing,
// so the reading order is the visual order. A tile spans one or two columns
// and one or two rows (`data-span`). Under breakpoint.tablet the grid has at
// most two columns, under breakpoint.phone one, and every tile spans one
// column there.
//
// Not interactive: a tile holds its own controls, or is itself a Card.
import type { HTMLAttributes, Ref } from 'react';

/** Columns at full width. Default 4. */
export type BentoColumns = 2 | 3 | 4;
/** Columns by rows. */
export type BentoSpan = '1x1' | '2x1' | '1x2' | '2x2';

export interface BentoProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Columns at full width: 2, 3 or 4. Default 4. Two under breakpoint.tablet, one under breakpoint.phone. */
  columns?: BentoColumns;
  /** The element. Use ul with BentoItem as li when the tiles are a list. Default div. */
  as?: 'div' | 'ul' | 'section';
  ref?: Ref<HTMLElement>;
}

export interface BentoItemProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Columns by rows: 1x1, 2x1 (wide), 1x2 (tall), 2x2 (large). Default 1x1. */
  span?: BentoSpan;
  /** The element. li inside a ul Bento. Default div. */
  as?: 'div' | 'li' | 'article';
  ref?: Ref<HTMLElement>;
}

/** The grid. */
export function Bento({ columns = 4, as = 'div', ref, ...rest }: BentoProps) {
  // Every allowed element takes the same props; narrow to one for the checker.
  const Element = as as 'div';
  return <Element {...rest} ref={ref as Ref<HTMLDivElement>} data-ds="bento" data-columns={String(columns)} />;
}

/** One tile. */
export function BentoItem({ span = '1x1', as = 'div', ref, ...rest }: BentoItemProps) {
  const Element = as as 'div';
  return <Element {...rest} ref={ref as Ref<HTMLDivElement>} data-part="item" data-span={span} />;
}
