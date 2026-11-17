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
//
// Sections (order M9.2, proposed): a List whose children are ListSection
// elements is a column of sections. Each section is an li with role
// presentation that holds a heading (part section-header, tabindex -1 so a
// SectionIndex jump can move focus to it), a nested List of its rows
// (labelled by the heading, so a reader says "list, 4 items" per section)
// and an optional footer (part section-footer, the nested list's
// description). The outer ul then takes role group when it has a name and
// role none when it has not, because its children are not list items. The
// nested List takes the outer size and variant, so the card look of an
// inset list is drawn per section. Rows and sections do not mix in one
// List.
//
// Swipe rows (order M9.7, proposed): a ListItem with `swipe` (a
// SwipeActions element with no children) keeps its parts as direct children
// and adds the SwipeActions root as its last child, part swipe. The row's
// parts move by --_list-shift, which the swipe writes on the row while it is
// dragged, open or settling; the SwipeActions root moves its action groups
// and menu by its own property. The row's pointer, click and key handlers
// carry the swipe (useSwipeController).
//
// Order C1 (proposed), from the first three test screens:
// - titleLines (List, ListSection rows, ListItem): 1, 2, 3 or all. Above 1 the
//   title wraps to that many lines, the row grows, and the other parts line
//   up with the first line (data-title-lines on the row).
// - variant flush: full width rows with a hairline between them that
//   starts at the text edge, past the start part whatever its size, and
//   runs to the row's inline end. No platform turns it into a card.
// - onSelect: a row that acts in place (play a song) is a button, not a
//   link. The title takes role button and tabindex 0 and its hit area
//   covers the row, as a link's does; Enter and Space run onSelect (data-
//   action on the row). No bare <button> outside Button (the gate), and a
//   system Button would make the title a part of Button, so the title is a
//   span with the button role and the keys of a native button.
// - chevron: false on a linked row asks the platform for no disclosure
//   chevron (data-no-chevron).
// - control: one control spanning the row (a slider row), between the start
//   and end glyphs (part control).
// - footer: the row's own buttons under its text (part footer), above the
//   row's hit area like actions.
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useCallback,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useMotion } from '../../internal/motion';
import { pressHandlers } from '../../internal/pressed';
import { setPressPoint, staggerGroup } from '@the-system/motion';
import { useFlipGroup, useRowGlide } from '../ListBox/selectionMotion';
import { SwipeActions, useSwipeController, type SwipeActionsProps } from '../SwipeActions/SwipeActions';

/** The rows of a list element. */
const rowsOf = (list: Element) => Array.from(list.querySelectorAll(":scope > [data-part='item']"));

export type ListSize = Extract<Size, 'sm' | 'md'>;
export type ListVariant = 'plain' | 'divided' | 'inset' | 'flush';
/** How many lines a row's title may take before it ends with an ellipsis; all never cuts it. */
export type ListTitleLines = 1 | 2 | 3 | 'all';
/** Leading or trailing content: a system icon name, or a node. */
export type ListSlotContent = IconName | ReactElement;

export interface ListProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** sm or md row height and text. md rows are at least list.row.height plus a small inset. Default md. */
  size?: ListSize;
  /**
   * plain: rows only. divided: a hairline between rows. inset: rows grouped
   * on a rounded surface. flush: full width rows with a hairline from the
   * text edge to the row end, never a card. Default plain.
   */
  variant?: ListVariant;
  /**
   * How many lines each row's title may wrap to; a row's own titleLines
   * wins. all never cuts the title, which keeps it whole with larger text
   * or text spacing (WCAG 2.2 1.4.4, 1.4.12). Default 1 (one line with an
   * ellipsis).
   */
  titleLines?: ListTitleLines;
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
  const glideRef = useRowGlide({ rows: "[data-part='item']:is([data-linked], [data-action]):not([data-disabled], [data-active])", lit: 'hover' });
  useLayoutEffect(() => {
    if (played.current || !hasRows) return;
    played.current = true;
    const el = node.current;
    if (!fresh.current || !el) return;
    // Order 1.23: the stagger primitive (rise and fade on the soft spring, one delay.stagger apart, the
    // steps inside the stagger budget, each row readable early), so Neutral cascades briefly and Studio,
    // whose stagger step is 0ms, lands its rows together with a short rise instead of the same plain fade.
    const items = Array.from(el.children).filter((item) => item.getAttribute('data-part') === 'item');
    staggerGroup(items, { phase: 'enter', spring: 'soft', mode: motion.mode('list-stagger') });
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
export function List({ size = 'md', variant = 'plain', ordered = false, titleLines = 1, empty, children, ref, ...rest }: ListProps) {
  const rows = Children.toArray(children).filter(isValidElement);
  const sectioned = rows.length > 0 && rows.every((row) => row.type === ListSection);
  const setRef = useFirstPaintStagger(rows.length > 0 && !sectioned, ref);
  const common = { 'data-ds': 'list', 'data-size': size, 'data-variant': variant } as const;
  if (sectioned) {
    // The outer list of a sectioned List holds sections, not rows: no variant of its own (each section draws it).
    const named = Boolean(rest['aria-label'] || rest['aria-labelledby']);
    const Tag = ordered ? 'ol' : 'ul';
    return (
      <SectionContext.Provider value={{ size, variant, ordered, titleLines }}>
        <Tag {...(rest as HTMLAttributes<HTMLUListElement>)} role={named ? 'group' : 'none'} data-ds="list" data-size={size} ref={setRef}>
          {rows}
        </Tag>
      </SectionContext.Provider>
    );
  }
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
  return (
    <RowContext.Provider value={titleLines}>
      {ordered ? (
        <ol {...listRole} {...(rest as HTMLAttributes<HTMLOListElement>)} {...common} ref={setRef}>
          {rows}
        </ol>
      ) : (
        <ul {...listRole} {...(rest as HTMLAttributes<HTMLUListElement>)} {...common} ref={setRef}>
          {rows}
        </ul>
      )}
    </RowContext.Provider>
  );
}

/** What a row reads from its List: the title line count the list sets for its rows. */
const RowContext = createContext<ListTitleLines>(1);

/** What a section reads from its List: the rows of every section share the list's size, variant and order. */
const SectionContext = createContext<{ size: ListSize; variant: ListVariant; ordered: boolean; titleLines: ListTitleLines }>({
  size: 'md',
  variant: 'plain',
  ordered: false,
  titleLines: 1,
});

export type ListSectionLevel = 2 | 3 | 4 | 5 | 6;

export interface ListSectionProps extends Omit<HTMLAttributes<HTMLLIElement>, 'title'> {
  /** The section heading, drawn above the rows. It names the section's list and is where a SectionIndex jump puts focus. */
  header?: ReactNode;
  /** A note under the rows: what the section's settings do. Read as the description of the section's list. */
  footer?: ReactNode;
  /** The heading level of the header. Default 3. */
  level?: ListSectionLevel;
  /** Shown when the section has no rows. */
  empty?: ReactNode;
  /** ListItem elements. */
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
}

/**
 * One section of a List: a heading, the rows as a nested list and a footer.
 * Put the id a SectionIndex targets on the section; the jump focuses the
 * heading inside it.
 */
export function ListSection({ header, footer, level = 3, empty, children, ref, ...rest }: ListSectionProps) {
  const { size, variant, ordered, titleLines } = useContext(SectionContext);
  const id = useId();
  const headerId = header !== undefined && header !== null ? `${id}-header` : undefined;
  const footerId = footer !== undefined && footer !== null ? `${id}-footer` : undefined;
  const Heading = `h${level}` as const;
  return (
    <li {...rest} ref={ref} role="presentation" data-part="section">
      {headerId && (
        <Heading data-part="section-header" id={headerId} tabIndex={-1}>
          {header}
        </Heading>
      )}
      <List size={size} variant={variant} ordered={ordered} titleLines={titleLines} empty={empty} aria-labelledby={headerId} aria-describedby={footerId}>
        {children}
      </List>
      {footerId && (
        <p data-part="section-footer" id={footerId}>
          {footer}
        </p>
      )}
    </li>
  );
}

interface ListItemOwnProps extends Omit<HTMLAttributes<HTMLLIElement>, 'title' | 'onSelect'> {
  /** A second line under the title. It wraps to at most two lines. */
  description?: ReactNode;
  /** Leading content: an icon name, an Avatar, a checkmark, a cover. Decorative unless the node names itself. */
  start?: ListSlotContent;
  /** Trailing content that is not an action: a time, a count, a Badge, or the end glyph of a control row. */
  end?: ReactNode;
  /** Buttons or IconButtons for this row. They are their own Tab stops and sit above the row link. */
  actions?: ReactNode;
  /** Makes the row a link: the title becomes an anchor whose hit area covers the row. */
  href?: string;
  /** Extra props for the anchor: target, rel, onClick for a router. */
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'title' | 'children'>;
  /**
   * Makes the row act in place, without going anywhere (play a song): the
   * title becomes a button whose hit area covers the row. Runs on a click,
   * Enter or Space. Ignored with href.
   */
  onSelect?: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void;
  /** On a linked row, false asks the platform not to draw its disclosure chevron. Default true. */
  chevron?: boolean;
  /** How many lines the title may wrap to before an ellipsis. Default: the List's titleLines (1). */
  titleLines?: ListTitleLines;
  /** The row's own buttons under its text, such as a listen capsule and a more button. Their own Tab stops, above the row link. */
  footer?: ReactNode;
  /** The current row, for example the open mail or the current page. Sets data-active and aria-current on the link. */
  active?: boolean;
  /**
   * Dims the row. A link loses its href and keeps focus with aria-disabled
   * (anatomy rule 5), and its click handler does not run. Actions are the
   * caller's to disable.
   */
  disabled?: boolean;
  /**
   * Swipe actions for the row: a SwipeActions element with start and end
   * actions and a menuLabel, no children. The row's own parts are what
   * moves. Not on a disabled row.
   */
  swipe?: ReactElement<SwipeActionsProps>;
  ref?: Ref<HTMLLIElement>;
}

/** A row with a title: text, a link (href) or an action (onSelect). */
interface ListItemTitleRow {
  /** The row's main text. With href it becomes the link, with onSelect the button. */
  title: ReactNode;
  control?: undefined;
}

/** A control row: one control (a Slider) spanning the row, between the start and end glyphs. */
interface ListItemControlRow {
  /** Optional in a control row: drawn above the control across the row. Name the control itself (aria-label). */
  title?: ReactNode;
  /** One control that spans the row, such as a Slider. The row is then not a link or an action; description and footer are not drawn. */
  control: ReactNode;
}

export type ListItemProps = ListItemOwnProps & (ListItemTitleRow | ListItemControlRow);

/** The swipe options of a SwipeActions element passed as `swipe`, or null. */
function swipeOptions(swipe: ReactElement<SwipeActionsProps> | undefined, disabled: boolean) {
  if (disabled || !isValidElement<SwipeActionsProps>(swipe) || swipe.type !== SwipeActions) return null;
  const { start, end, fullSwipe, menuLabel, pointer } = swipe.props;
  return { start, end, fullSwipe, menuLabel, pointer };
}

const present = (node: ReactNode) => node !== undefined && node !== null && node !== false;

/** One row of a List. */
export function ListItem({
  title,
  description,
  start,
  end,
  actions,
  href,
  linkProps,
  onSelect,
  chevron = true,
  titleLines,
  footer,
  control,
  active = false,
  disabled = false,
  swipe,
  ref,
  ...rest
}: ListItemProps) {
  const listLines = useContext(RowContext);
  const lines = titleLines ?? listLines;
  const controlRow = present(control);
  const linked = !controlRow && href !== undefined;
  const action = !controlRow && !linked && onSelect !== undefined;
  const swiper = useSwipeController<HTMLLIElement>(swipeOptions(swipe, disabled), '--_list-shift');
  const { hostRef } = swiper;
  const setRef = useCallback(
    (el: HTMLLIElement | null) => {
      hostRef(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: HTMLLIElement | null }).current = el;
    },
    [hostRef, ref],
  );
  // Platform hook: where the press landed in the row, for a ripple from the touch point.
  // Order M4: a linked or action row carries data-pressed from pointerdown to the release (internal/pressed.ts).
  const press = pressHandlers<HTMLLIElement>(
    {
      onPointerDown: (event) => {
        setPressPoint(event.currentTarget, 'list', event.clientX, event.clientY);
        rest.onPointerDown?.(event);
      },
      onPointerUp: rest.onPointerUp,
      onPointerCancel: rest.onPointerCancel,
      onLostPointerCapture: rest.onLostPointerCapture,
      onPointerLeave: rest.onPointerLeave,
    },
    !(linked || action) || disabled,
  );
  const handlers = swiper.off
    ? press
    : swiper.handlers({ ...press, onPointerMove: rest.onPointerMove, onClickCapture: rest.onClickCapture, onKeyDown: rest.onKeyDown });
  // The action title answers the keys of a native button: Enter on key down, Space on key up.
  const select = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    if (!disabled) onSelect?.(event);
  };
  let titleNode: ReactNode = null;
  if (linked) {
    titleNode = (
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
    );
  } else if (action) {
    titleNode = (
      <span
        data-part="title"
        role="button"
        tabIndex={0}
        aria-disabled={disabled ? 'true' : undefined}
        aria-current={active ? 'true' : undefined}
        onClick={select}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter') {
            event.preventDefault();
            if (!event.repeat) select(event);
          } else if (event.key === ' ') {
            // Space presses on key up, as a native button does; key down only stops the page scroll.
            event.preventDefault();
          }
        }}
        onKeyUp={(event) => {
          if (event.target === event.currentTarget && event.key === ' ') select(event);
        }}
      >
        {title}
      </span>
    );
  } else if (present(title)) {
    titleNode = <span data-part="title">{title}</span>;
  }
  return (
    <li
      {...rest}
      ref={setRef}
      {...handlers}
      data-part="item"
      data-active={active ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-linked={linked ? '' : undefined}
      data-action={action ? '' : undefined}
      data-no-chevron={linked && !chevron ? '' : undefined}
      data-title-lines={lines !== 1 && !controlRow ? String(lines) : undefined}
      aria-current={!linked && !action && active ? 'true' : rest['aria-current']}
    >
      <span data-part="separator" aria-hidden="true" />
      {/* The row's hover fill, which glides from the row the pointer left (row-glide). Decorative, no part name. */}
      <span aria-hidden="true" />
      {start !== undefined && (
        <span data-part="start" aria-hidden={typeof start === 'string' ? 'true' : undefined}>
          {slot(start)}
        </span>
      )}
      {titleNode}
      {!controlRow && present(description) && <span data-part="description">{description}</span>}
      {controlRow && <div data-part="control">{control}</div>}
      {present(end) && <span data-part="end">{end}</span>}
      {present(actions) && <span data-part="actions">{actions}</span>}
      {!controlRow && present(footer) && <div data-part="footer">{footer}</div>}
      {!swiper.off && (
        <div ref={swiper.rootRef} data-ds="swipe-actions" data-part="swipe" {...swiper.attrs}>
          {swiper.parts}
        </div>
      )}
    </li>
  );
}
