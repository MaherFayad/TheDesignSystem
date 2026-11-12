'use client';
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
//
// Motion, interaction list-stagger (pattern list-stagger): on the first
// paint of its rows, each row fades and rises in one delay.reveal-step after
// the one before, capped at LIST_STAGGER_MAX_STEPS, through useMotion().play
// so the style's preset sets it or turns it off. Only opacity and transform
// move: every row is in the DOM and read by assistive tech at once. It never
// plays again on a re-render, an added row or a reorder, and not when the
// rows come from server HTML that is already on screen (hydration). Under
// reduced motion the pattern plays a fade with no delay.
import {
  Children,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useMotion } from '../../internal/motion';
import { useFlipGroup, useRowGlide } from '../ListBox/selectionMotion';

/** The rows of a list element. */
const rowsOf = (list: Element) => Array.from(list.querySelectorAll(":scope > [data-part='item']"));

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
  /**
   * ListItem elements, as direct children (or in a Fragment). Empty detection
   * counts direct elements, so a wrapper component that renders no rows still
   * counts as one.
   */
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/** Renders leading or trailing content: a name becomes a 16px system Icon, a node is used as is. */
function slot(content: ListSlotContent): ReactNode {
  return typeof content === 'string' ? <Icon name={content} size="md" /> : content;
}

const noSubscribe = () => () => {};

/**
 * Plays list-stagger once, the first time the list has rows on screen, and
 * returns the ref for the list element. Rows hydrated from server HTML
 * skip it: they are already painted.
 */
function useFirstPaintStagger(hasRows: boolean, ref: Ref<HTMLElement> | undefined) {
  const motion = useMotion();
  // True only while React hydrates server HTML: the first render reads the server snapshot.
  const hydrating = useSyncExternalStore(noSubscribe, () => false, () => true);
  // Rows in server HTML are painted already; rows that arrive later on the client are a first paint.
  const fresh = useRef(!hydrating || !hasRows);
  const played = useRef(false);
  const node = useRef<HTMLElement | null>(null);
  // collection-flip: rows added, removed or moved after the first paint travel, pop in or shrink out.
  useFlipGroup(node, { items: rowsOf });
  // row-glide: the hover fill of a linked row travels from the row the pointer left.
  const glideRef = useRowGlide({ rows: "[data-part='item'][data-linked]:not([data-disabled], [data-active])", lit: 'hover' });
  useLayoutEffect(() => {
    if (played.current || !hasRows) return;
    played.current = true;
    const el = node.current;
    if (!fresh.current || !el) return;
    let index = 0;
    for (const item of Array.from(el.children)) {
      if (item.getAttribute('data-part') !== 'item') continue;
      motion.play(item, 'list-stagger', 'list-stagger', { index });
      index += 1;
    }
  }, [hasRows, motion]);
  return useCallback(
    (el: HTMLElement | null) => {
      node.current = el;
      glideRef(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: HTMLElement | null }).current = el;
    },
    [ref, glideRef],
  );
}

/**
 * A list of rows. With no rows it renders the `empty` message in a div with
 * the same `data-ds`, so an empty list is not announced as a list of one.
 */
export function List({ size = 'md', variant = 'plain', ordered = false, empty, children, ref, ...rest }: ListProps) {
  const rows = Children.toArray(children).filter(isValidElement);
  const setRef = useFirstPaintStagger(rows.length > 0, ref);
  const common = { 'data-ds': 'list', 'data-size': size, 'data-variant': variant } as const;
  // list-style: none makes Safari and VoiceOver drop the list role, so it is set again.
  const listRole = { role: 'list' } as const;
  if (rows.length === 0) {
    return (
      <div
        {...(rest as HTMLAttributes<HTMLDivElement>)}
        // A name on a plain div is not allowed: a labelled empty list is a group.
        role={rest['aria-label'] || rest['aria-labelledby'] ? 'group' : rest.role}
        {...common}
        ref={setRef}
      >
        {empty !== undefined && <p data-part="empty">{empty}</p>}
      </div>
    );
  }
  return ordered ? (
    <ol {...listRole} {...(rest as HTMLAttributes<HTMLOListElement>)} {...common} ref={setRef}>
      {rows}
    </ol>
  ) : (
    <ul {...listRole} {...(rest as HTMLAttributes<HTMLUListElement>)} {...common} ref={setRef}>
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
  /**
   * Dims the row. A link loses its href and keeps focus with aria-disabled
   * (anatomy rule 5), and its click handler does not run. Actions are the
   * caller's to disable.
   */
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
      aria-current={!linked && active ? 'true' : rest['aria-current']}
    >
      <span data-part="separator" aria-hidden="true" />
      {/* The row's hover fill, which glides from the row the pointer left (row-glide). Decorative, no part name. */}
      <span aria-hidden="true" />
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
          tabIndex={disabled ? 0 : linkProps?.tabIndex}
          onClick={
            disabled
              ? (event) => {
                  event.preventDefault();
                }
              : linkProps?.onClick
          }
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
