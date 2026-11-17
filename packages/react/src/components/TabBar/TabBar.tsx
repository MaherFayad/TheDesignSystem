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
import type { KeyboardEvent, PointerEvent } from 'react';
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
  ref?: Ref<HTMLElement>;
}

/** A tab bar needs a name: `aria-label`, or `aria-labelledby`. */
export type TabBarProps = TabBarOwnProps &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

const TabBarSizeContext = createContext<TabBarSize>('md');

/** The bottom navigation of a phone layout: a nav landmark with a name. */
export function TabBar({ size = 'md', placement: placementProp, children, onKeyDown, ...rest }: TabBarProps) {
  const placement = usePlacement(placementProp);
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
    >
      <TabBarSizeContext value={size}>{children}</TabBarSizeContext>
    </nav>
  );
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

/** The items of this bar, not of a bar nested inside it. */
function itemsOf(bar: HTMLElement): HTMLElement[] {
  return Array.from(bar.querySelectorAll<HTMLElement>('[data-part="item"]')).filter(
    (item) => item.closest('[data-ds="tab-bar"]') === bar,
  );
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

const words = { en: { count: 'new', dot: 'New' }, ar: { count: 'جديد', dot: 'جديد' } } as const;

/** One destination of the bar: an icon over a label, with an optional badge. */
export function TabBarItem({ label, icon, active = false, badge, badgeLabel, asChild = false, children, ref, ...rest }: TabBarItemProps) {
  const { lang } = useTheme();
  const barSize = use(TabBarSizeContext);
  const w = words[lang === 'ar' ? 'ar' : 'en'];
  const showBadge = badge !== undefined && badge !== false && badge !== 0;
  const count = typeof badge === 'number' ? (badge > 99 ? '99+' : String(badge)) : null;
  const hidden = count !== null ? `${lang === 'ar' ? '،' : ','} ${count} ${badgeLabel ?? w.count}` : `${lang === 'ar' ? '،' : ','} ${badgeLabel ?? w.dot}`;

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
