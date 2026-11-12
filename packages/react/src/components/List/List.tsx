// List: a vertical list of rows with optional start, end, description and
// actions. Not a selection list (that is ListBox) and not tabular data
// (that is Table).
//
// Sources: Figma-Killer-2 `WidgetList/` (rows of a primary cell and a meta
// cell, a thin rule between them) and `PropertyList/` (start content, a
// summary that ellipsizes, trailing actions that never get squeezed).
// GoBanana `MailApp.tsx` was not reachable in this session.
//
// A row that goes somewhere takes `href`: the title becomes the link and its
// hit area covers the whole row (the link's ::before, which is also the
// focus layer), so the row is one Tab stop. Actions sit above that hit area
// and are their own Tab stops. No bare buttons: actions are system Buttons
// or IconButtons the caller passes.
import {
  Children,
  isValidElement,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';

export type ListSize = Extract<Size, 'sm' | 'md'>;
export type ListVariant = 'plain' | 'divided' | 'inset';
/** Leading or trailing content: a system icon name, or a node. */
export type ListSlotContent = IconName | ReactElement;

export interface ListProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** sm or md row height and text. md rows are at least list.row.height plus a small inset. Default md. */
  size?: ListSize;
  /** plain: rows only. divided: a hairline between rows. inset: rows grouped on a rounded surface. Default plain. */
  variant?: ListVariant;
  /** Renders an ol, for rows whose order means something (steps, a ranking). Default false. */
  ordered?: boolean;
  /** Shown when there are no rows: what is missing and what to do next. Required words, no default. */
  empty?: ReactNode;
  /** ListItem elements. */
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/** Renders leading or trailing content: a name becomes a 16px system Icon, a node is used as is. */
function slot(content: ListSlotContent): ReactNode {
  return typeof content === 'string' ? <Icon name={content} size="md" /> : content;
}

/**
 * A list of rows. With no rows it renders the `empty` message in a div with
 * the same `data-ds`, so an empty list is not announced as a list of one.
 */
export function List({ size = 'md', variant = 'plain', ordered = false, empty, children, ...rest }: ListProps) {
  const rows = Children.toArray(children).filter(isValidElement);
  const common = { 'data-ds': 'list', 'data-size': size, 'data-variant': variant } as const;
  // list-style: none makes Safari and VoiceOver drop the list role, so it is set again.
  const listRole = { role: 'list' } as const;
  if (rows.length === 0) {
    return (
      <div {...(rest as HTMLAttributes<HTMLDivElement>)} {...common} ref={rest.ref as Ref<HTMLDivElement>}>
        {empty !== undefined && <p data-part="empty">{empty}</p>}
      </div>
    );
  }
  return ordered ? (
    <ol {...listRole} {...(rest as HTMLAttributes<HTMLOListElement>)} {...common} ref={rest.ref as Ref<HTMLOListElement>}>
      {rows}
    </ol>
  ) : (
    <ul {...listRole} {...(rest as HTMLAttributes<HTMLUListElement>)} {...common} ref={rest.ref as Ref<HTMLUListElement>}>
      {rows}
    </ul>
  );
}

export interface ListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'title'> {
  /** The row's main text. With `href` it becomes the link. */
  title: ReactNode;
  /** A second line under the title. It wraps to at most two lines. */
  description?: ReactNode;
  /** Leading content: an icon name, an Avatar, a checkmark. Decorative unless the node names itself. */
  start?: ListSlotContent;
  /** Trailing content that is not an action: a time, a count, a Badge. */
  end?: ReactNode;
  /** Buttons or IconButtons for this row. They are their own Tab stops and sit above the row link. */
  actions?: ReactNode;
  /** Makes the row a link: the title becomes an anchor whose hit area covers the row. */
  href?: string;
  /** Extra props for the anchor: target, rel, onClick for a router. */
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'title' | 'children'>;
  /** The current row, for example the open mail or the current page. Sets data-active and aria-current on the link. */
  active?: boolean;
  /** Dims the row. A link loses its href and is out of the tab order; actions are the caller's to disable. */
  disabled?: boolean;
  ref?: Ref<HTMLLIElement>;
}

/** One row of a List. */
export function ListItem({
  title,
  description,
  start,
  end,
  actions,
  href,
  linkProps,
  active = false,
  disabled = false,
  ...rest
}: ListItemProps) {
  const linked = href !== undefined;
  return (
    <li
      {...rest}
      data-part="item"
      data-active={active ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-linked={linked ? '' : undefined}
    >
      <span data-part="separator" aria-hidden="true" />
      {start !== undefined && (
        <span data-part="start" aria-hidden={typeof start === 'string' ? 'true' : undefined}>
          {slot(start)}
        </span>
      )}
      {linked ? (
        <a
          {...linkProps}
          data-part="title"
          href={disabled ? undefined : href}
          aria-disabled={disabled ? 'true' : undefined}
          role={disabled ? 'link' : undefined}
          aria-current={active ? (linkProps?.['aria-current'] ?? 'true') : linkProps?.['aria-current']}
        >
          {title}
        </a>
      ) : (
        <span data-part="title">{title}</span>
      )}
      {description !== undefined && description !== null && <span data-part="description">{description}</span>}
      {end !== undefined && end !== null && <span data-part="end">{end}</span>}
      {actions !== undefined && actions !== null && <span data-part="actions">{actions}</span>}
    </li>
  );
}
