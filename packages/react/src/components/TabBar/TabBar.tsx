'use client';
// TabBar: the bottom bar of three to five destinations on phone layouts
// (web). A hand built `nav` of links.
//
// Sources: GoBanana desktop.css lines 1327 to 1542 (the phone home screen)
// was not reachable in this session; the look follows the dials table and
// the platform convention for a bottom bar: an icon over a short label,
// labels always visible, the current destination marked by weight, a pill
// behind its icon and aria-current, never by color alone.
//
// The DOM:
//
//   <nav data-ds="tab-bar" aria-label data-size>
//     <a data-part="item" href aria-current="page"? data-active?>
//       <span data-part="item-icon">                       a system icon, decorative
//         <span data-part="item-badge">                    a count or a dot, on the icon's corner
//       <span data-part="item-label">                      always visible
//     <div data-part="accessory">                          `accessory`, first child (order C2): a mini player
//     <a data-part="search" href aria-current="page"?>     TabBarSearch, last child (order M9.9)
//       <span data-part="item-icon">                       the search glyph, decorative
//       <span data-part="item-label">                      the name; drawn on web and android
//     <div data-part="search" data-expanded>               the same item while active with a field
//       <div data-ds="search-field">                       the app's SearchField
//
// The badge text is part of the link name ("Inbox, 3 new"); a dot badge
// says its words in visually hidden text. The bar pads its block end by the
// safe area inset, so the home indicator of a phone never covers a label.
// Where the bar sits (fixed at the bottom, in a PageShell) is the layout's
// choice; a fixed bar needs the page to keep the same room at its end.
//
// Placement (order DU1, docs/plan/reset-duo.md): `placement` is auto,
// bottom or side, inherited from the nearest PageShell when not set. It
// stamps data-placement only when not auto; under auto the CSS decides from
// the PageShell's size (container ds-shell). The DOM never changes with it.
//
// Keys: every item stays a tab stop, in reading order. The arrow keys move
// along the bar as it is drawn: Left and Right when it is a row (flipped in
// right to left), Up and Down when it is a column. Home and End go to the
// first and last item; the arrows wrap. The axis comes from the placement,
// and for auto from where the items are at the moment of the key press, so
// nothing is measured during render. The nav role takes no aria-orientation
// (ARIA 1.2 does not allow it on navigation), so the axis is not announced:
// the links are reached with Tab in every placement.
//
// Search item (order M9.9, docs/plan/reset-ios-families.md, proposed):
// TabBarSearch is a destination like any item, with its own part, so a
// platform can draw it apart from the others. It goes last in the bar. On
// web and android it is the last item of the bar, an icon over its label;
// on ios the platform draws it as a round item beside the capsule, and in
// the column (placement side) under the capsule. The DOM is the same in
// every case. With a `field` (a SearchField) and `active`, the item turns
// into that field (data-expanded): the link leaves and the field takes its
// place, as the music app does with its search tab. When the item had focus
// or was pressed, focus follows into the field, and back to the link when
// the field goes, so focus is never dropped on the page (WCAG 2.4.3).
//
// Accessory and compact form (order C2, docs/plan/reset-mobile.md,
// proposed): `accessory` is content that belongs to the bar but is not a
// destination, such as a mini player (a Toolbar with its own name). It sits
// in the part accessory, first in the bar, drawn as a row above the items,
// so the reading and focus order is the accessory, then the items, as drawn
// (WCAG 2.4.3). The bar's arrow keys skip it; it keeps its own. `compact`
// (data-compact) is the bar of a pushed or scrolled screen: only the
// current item, the accessory and the search item show, in one row, in
// that order; the accessory moves in the DOM to just before the search item
// so focus keeps the drawn order. The other items are not drawn and are not
// tab stops; the current item still leads to its destination, where the
// app shows the full bar again. In the side column (placement side) a
// platform takes the accessory out of the capsule (ios.css).
import { useLayoutEffect, useRef, cloneElement, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { pressOrigin } from './pressOrigin';
import { pressHandlers } from '../../internal/pressed';
import { Children, createContext, isValidElement, use, type AnchorHTMLAttributes, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { Slot } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { placementAttr, usePlacement, type BarPlacement } from '../PageShell/placement';

/** Where the bar sits: CSS decides (auto), always at the bottom, or always in a column at the inline end. */
export type TabBarPlacement = BarPlacement;

/** md: a 48px bar (icon 16px). lg: a 56px bar with 24px icons and 44px targets, for touch layouts. */
export type TabBarSize = Extract<Size, 'md' | 'lg'>;

interface TabBarOwnProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** TabBarItem elements. Three to five. */
  children?: ReactNode;
  /** Default md. lg gives 44px targets for touch layouts. */
  size?: TabBarSize;
  /**
   * Where the bar sits. auto: CSS decides from the PageShell's size (a
   * column at the inline end when the shell is wide and short, on `ios`).
   * bottom: always a row at the bottom. side: always a column at the inline
   * end. Default: the nearest PageShell's placement, else auto. Stamps
   * data-placement only when not auto.
   */
  placement?: TabBarPlacement;
  /**
   * Content that belongs to the bar but is not a destination: a mini player
   * (a Toolbar with its own aria-label). Drawn in the part accessory, a row
   * above the items, first in the focus order. Default none.
   */
  accessory?: ReactNode;
  /**
   * The compact bar of a pushed or scrolled screen: only the current item,
   * the accessory and the search item, in one row. The other items are not
   * drawn and are not tab stops. Default false. Sets data-compact.
   */
  compact?: boolean;
  ref?: Ref<HTMLElement>;
}

/** A tab bar needs a name: `aria-label`, or `aria-labelledby`. */
export type TabBarProps = TabBarOwnProps &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

const TabBarSizeContext = createContext<TabBarSize>('md');

/** The bottom navigation of a phone layout: a nav landmark with a name. */
export function TabBar({ size = 'md', placement: placementProp, accessory, compact = false, children, onKeyDown, ...rest }: TabBarProps) {
  const placement = usePlacement(placementProp);
  const content = withAccessory(children, accessory, compact);
  return (
    <nav
      {...rest}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) moveFocus(event, placement);
      }}
      data-ds="tab-bar"
      data-size={size}
      data-placement={placementAttr(placement)}
      data-compact={compact ? '' : undefined}
    >
      <TabBarSizeContext value={size}>{content}</TabBarSizeContext>
    </nav>
  );
}

/**
 * Puts the accessory where it is drawn: first (a row above the items), or in
 * the compact bar just before the search item (after the items when there is
 * none). Keyed, so React moves the accessory rather than mounting it again
 * when compact changes.
 */
function withAccessory(children: ReactNode, accessory: ReactNode, compact: boolean): ReactNode {
  if (accessory === undefined || accessory === null || accessory === false) return children;
  const box = (
    <div key="ds-tab-bar-accessory" data-part="accessory">
      {accessory}
    </div>
  );
  const list = Children.toArray(children);
  if (!compact) return [box, ...list];
  const at = list.findIndex((child) => isValidElement(child) && (child as ReactElement).type === TabBarSearch);
  return at < 0 ? [...list, box] : [...list.slice(0, at), box, ...list.slice(at)];
}

export interface TabBarItemProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title' | 'children'> {
  /** The visible label, a short noun: Home, Search, Inbox. Always shown. */
  label: string;
  /** A system icon name, decorative: the label names the link. */
  icon: IconName;
  /** The current destination: aria-current="page" and data-active. Default false. */
  active?: boolean;
  /** A count (a number, Western digits, 99+ past 99) or true for a dot. */
  badge?: number | boolean;
  /**
   * The words the badge adds to the link name. Default "new" after a count
   * ("Inbox, 3 new"), and "New" for a dot (Arabic: "جديد").
   */
  badgeLabel?: string;
  /** Renders the single child element (a router link) as the item; its children are replaced by the parts. */
  asChild?: boolean;
  /** One element when asChild is set. */
  children?: ReactElement;
  ref?: Ref<HTMLAnchorElement>;
}

/**
 * The items of this bar, not of a bar nested inside it: every TabBarItem,
 * and the search item while it is a link (not while it is a field).
 */
function itemsOf(bar: HTMLElement): HTMLElement[] {
  // The compact bar draws only the current item of the TabBarItems (order C2).
  const item = bar.hasAttribute('data-compact') ? '[data-part="item"][data-active]' : '[data-part="item"]';
  return Array.from(bar.querySelectorAll<HTMLElement>(`${item}, [data-part="search"]:not([data-expanded])`)).filter((el) => {
    if (el.closest('[data-ds="tab-bar"]') !== bar) return false;
    // The accessory's own content (a Toolbar's items) is not an item of the bar.
    const accessory = el.closest('[data-part="accessory"]');
    return accessory === null || !bar.contains(accessory);
  });
}

/**
 * The axis the bar is drawn on. side and bottom say it; auto reads where the
 * first two items are, at the moment of the key press: one under the other
 * is a column. With no layout (a test DOM) the bar is a row.
 */
function axisOf(items: HTMLElement[], placement: BarPlacement): 'row' | 'column' {
  if (placement === 'side') return 'column';
  if (placement === 'bottom' || items.length < 2) return 'row';
  const a = items[0]!.getBoundingClientRect();
  const b = items[1]!.getBoundingClientRect();
  return Math.abs(b.top - a.top) > Math.abs(b.left - a.left) ? 'column' : 'row';
}

/** Arrow keys along the bar's axis, Home and End; every item stays a tab stop. */
function moveFocus(event: KeyboardEvent<HTMLElement>, placement: BarPlacement): void {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const bar = event.currentTarget;
  const items = itemsOf(bar);
  const from = items.indexOf(event.target as HTMLElement);
  if (from < 0) return;
  const last = items.length - 1;
  let to: number | null = null;
  if (event.key === 'Home') to = 0;
  else if (event.key === 'End') to = last;
  else {
    const axis = axisOf(items, placement);
    const rtl = bar.closest('[dir]')?.getAttribute('dir') === 'rtl';
    const steps: Record<string, number> =
      axis === 'column' ? { ArrowDown: 1, ArrowUp: -1 } : { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 };
    const step = steps[event.key];
    if (step !== undefined) to = (from + step + items.length) % items.length;
  }
  if (to === null) return;
  event.preventDefault();
  items[to]!.focus();
}

// The hidden badge name after the label: "Inbox, 3 new"; in Arabic the count
// comes first and the word agrees with a plural of things: "الوارد، 3 جديدة",
// and over 99 "الوارد، أكثر من 99 جديدة" (order P2 F4).
const words = { en: { count: 'new', dot: 'New', over: '99+' }, ar: { count: 'جديدة', dot: 'جديد', over: 'أكثر من 99' } } as const;

/** One destination of the bar: an icon over a label, with an optional badge. */
export function TabBarItem({ label, icon, active = false, badge, badgeLabel, asChild = false, children, ref, ...rest }: TabBarItemProps) {
  const { lang } = useTheme();
  const barSize = use(TabBarSizeContext);
  const w = words[lang === 'ar' ? 'ar' : 'en'];
  const showBadge = badge !== undefined && badge !== false && badge !== 0;
  const count = typeof badge === 'number' ? (badge > 99 ? '99+' : String(badge)) : null;
  const comma = lang === 'ar' ? '،' : ',';
  const spoken = count === '99+' ? w.over : count;
  const hidden = count !== null ? `${comma} ${spoken} ${badgeLabel ?? w.count}` : `${comma} ${badgeLabel ?? w.dot}`;

  const parts = (
    <>
      <span data-part="item-icon">
        <Icon name={icon} size={barSize === 'lg' ? 'lg' : 'md'} />
        {showBadge && (
          <span data-part="item-badge" data-dot={count === null ? '' : undefined} dir="ltr" aria-hidden="true">
            {count}
          </span>
        )}
      </span>
      <span data-part="item-label">{label}</span>
      {showBadge && <span data-part="item-status">{hidden}</span>}
    </>
  );

  const attrs = {
    ...rest,
    ref,
    // Round 3: the press point, for a platform ripple (./pressOrigin.ts).
    // Order M4: data-pressed from pointerdown to the release, so the press
    // shows as the finger lands (internal/pressed.ts).
    ...pressHandlers<HTMLAnchorElement>(
      {
        onPointerDown: (event: PointerEvent<HTMLAnchorElement>) => {
          pressOrigin(event, 'tab-bar');
          rest.onPointerDown?.(event);
        },
        onPointerUp: rest.onPointerUp,
        onPointerCancel: rest.onPointerCancel,
        onLostPointerCapture: rest.onLostPointerCapture,
        onPointerLeave: rest.onPointerLeave,
      },
      rest['aria-disabled'] === true || rest['aria-disabled'] === 'true',
    ),
    'data-part': 'item',
    'data-active': active ? '' : undefined,
    'aria-current': active ? ('page' as const) : rest['aria-current'],
  };

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) throw new Error('TabBarItem with asChild needs one element as its child.');
    return (
      <Slot.Root {...attrs}>
        <Slot.Slottable child={child}>{() => parts}</Slot.Slottable>
      </Slot.Root>
    );
  }
  return <a {...attrs}>{parts}</a>;
}

export interface TabBarSearchProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title' | 'children' | 'onSelect'> {
  /** The name of the destination: Search (Arabic: بحث). The link name everywhere, and the visible label on web and android. */
  label: string;
  /** A system icon name, decorative. Default search. */
  icon?: IconName;
  /** The current destination: aria-current="page" and data-active. Default false. */
  active?: boolean;
  /**
   * Called on a press of the item, before the link is followed. Without
   * href, the item is a link to nothing that only calls this (a router that
   * navigates by hand); with href, the handler may call preventDefault.
   */
  onSelect?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /**
   * A SearchField the item turns into while it is active (data-expanded).
   * It takes `label` as its accessible name unless it has its own
   * aria-label. Default none: the item stays a link.
   */
  field?: ReactElement<{ 'aria-label'?: string }>;
  /** Renders the single child element (a router link) as the item; its children are replaced by the parts. */
  asChild?: boolean;
  /** One element when asChild is set. */
  children?: ReactElement;
  ref?: Ref<HTMLAnchorElement>;
}

const FOCUSABLE = 'input, textarea, select, button, a[href], [tabindex]:not([tabindex="-1"])';

/** The search destination of the bar: last in the bar, a round item beside the capsule on ios. */
export function TabBarSearch({ label, icon = 'search', active = false, onSelect, field, asChild = false, children, ref, ...rest }: TabBarSearchProps) {
  const barSize = use(TabBarSizeContext);
  const expanded = active && field !== undefined;
  const link = useRef<HTMLAnchorElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  // True while the item or its field holds focus, or after a press on it:
  // the person is at the search item, so focus follows when it changes form.
  const here = useRef(false);
  const was = useRef(expanded);

  useLayoutEffect(() => {
    if (was.current === expanded) return;
    was.current = expanded;
    if (!here.current) return;
    const now = typeof document === 'undefined' ? null : document.activeElement;
    // Leave focus alone when it already moved somewhere real.
    if (now && now !== document.body && now.isConnected && !(box.current?.contains(now) || link.current === now)) return;
    if (expanded) box.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    else link.current?.focus();
  }, [expanded]);

  const track = {
    onFocus: () => {
      here.current = true;
    },
    onBlur: (event: { relatedTarget: EventTarget | null; currentTarget: HTMLElement }) => {
      // Focus that moves to another element ends the stay; focus that is
      // dropped (the element left the page) keeps it, so it can follow.
      const to = event.relatedTarget as Node | null;
      if (to && !event.currentTarget.contains(to)) here.current = false;
    },
  };

  if (expanded) {
    const own = field.props['aria-label'];
    return (
      <div data-part="search" data-expanded="" data-active="" ref={box} {...track}>
        {own === undefined ? cloneElement(field, { 'aria-label': label }) : field}
      </div>
    );
  }

  const setLink = (node: HTMLAnchorElement | null) => {
    link.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };
  const parts = (
    <>
      <span data-part="item-icon">
        <Icon name={icon} size={barSize === 'lg' ? 'lg' : 'md'} />
      </span>
      <span data-part="item-label">{label}</span>
    </>
  );
  const noHref = !asChild && rest.href === undefined;
  const attrs = {
    ...rest,
    ref: setLink,
    ...pressHandlers<HTMLAnchorElement>(
      {
        onPointerDown: (event: PointerEvent<HTMLAnchorElement>) => {
          pressOrigin(event, 'tab-bar');
          rest.onPointerDown?.(event);
        },
        onPointerUp: rest.onPointerUp,
        onPointerCancel: rest.onPointerCancel,
        onLostPointerCapture: rest.onLostPointerCapture,
        onPointerLeave: rest.onPointerLeave,
      },
      rest['aria-disabled'] === true || rest['aria-disabled'] === 'true',
    ),
    onFocus: (event: FocusEvent<HTMLAnchorElement>) => {
      track.onFocus();
      rest.onFocus?.(event);
    },
    onBlur: (event: FocusEvent<HTMLAnchorElement>) => {
      track.onBlur(event);
      rest.onBlur?.(event);
    },
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      here.current = true;
      rest.onClick?.(event);
      onSelect?.(event);
      if (noHref) event.preventDefault();
    },
    // With no href an anchor is not focusable and Enter does nothing: give it both.
    ...(noHref
      ? {
          role: 'link' as const,
          tabIndex: 0,
          onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => {
            rest.onKeyDown?.(event);
            if (!event.defaultPrevented && event.key === 'Enter') event.currentTarget.click();
          },
        }
      : {}),
    'data-part': 'search',
    'data-active': active ? '' : undefined,
    'aria-current': active ? ('page' as const) : rest['aria-current'],
  };

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) throw new Error('TabBarSearch with asChild needs one element as its child.');
    return (
      <Slot.Root {...attrs}>
        <Slot.Slottable child={child}>{() => parts}</Slot.Slottable>
      </Slot.Root>
    );
  }
  return <a {...attrs}>{parts}</a>;
}
