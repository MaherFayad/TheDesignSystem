// DescriptionList: term and value pairs, such as the details of an order or
// a summary of settings. Hand built on dl, with each pair in a div (allowed
// by HTML), so a pair is one row that styles and tests can find.
//
// Sources: Figma-Killer-2 `ControlRow/` (a label column and a value column,
// stacked on its own line in the stacked layout) and `PropertyList/` (rows
// that hold opaque content, no header of their own).
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import type { Size } from '@the-system/shared';

export type DescriptionListSize = Extract<Size, 'sm' | 'md'>;
export type DescriptionListOrientation = 'horizontal' | 'vertical';

/** One pair for the `items` shortcut. */
export interface DescriptionListEntry {
  /** A stable key. Default the index. */
  key?: string;
  term: ReactNode;
  details: ReactNode;
}

export interface DescriptionListProps extends Omit<HTMLAttributes<HTMLDListElement>, 'title'> {
  /**
   * horizontal: terms in a column at the start, values beside them; it
   * stacks under breakpoint.phone. vertical: each term above its value.
   * Default horizontal.
   */
  orientation?: DescriptionListOrientation;
  /** sm or md text and spacing. Default md. */
  size?: DescriptionListSize;
  /** The pairs as data. Rendered before any children. */
  items?: readonly DescriptionListEntry[];
  /** DescriptionListItem elements. */
  children?: ReactNode;
  ref?: Ref<HTMLDListElement>;
}

/** A list of term and value pairs. */
export function DescriptionList({ orientation = 'horizontal', size = 'md', items, children, ...rest }: DescriptionListProps) {
  return (
    <dl {...rest} data-ds="description-list" data-size={size} data-orientation={orientation}>
      {items?.map((item, i) => (
        <DescriptionListItem key={item.key ?? i} term={item.term}>
          {item.details}
        </DescriptionListItem>
      ))}
      {children}
    </dl>
  );
}

export interface DescriptionListItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The name of the value: Order number, Delivery address. A noun, no colon. */
  term: ReactNode;
  /** The value. Text, a Badge, a Link, or several dd values through `details` as an array. */
  children?: ReactNode;
  /** More than one value for the term, each in its own dd. Wins over children. */
  details?: readonly ReactNode[];
  ref?: Ref<HTMLDivElement>;
}

/** One pair: the term in a dt and its value in a dd, wrapped in a div. */
export function DescriptionListItem({ term, children, details, ...rest }: DescriptionListItemProps) {
  return (
    <div {...rest} data-part="item">
      <dt data-part="term">{term}</dt>
      {details ? (
        details.map((d, i) => (
          <dd key={i} data-part="details">
            {d}
          </dd>
        ))
      ) : (
        <dd data-part="details">{children}</dd>
      )}
    </div>
  );
}
