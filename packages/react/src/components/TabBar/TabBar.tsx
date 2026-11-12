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
import { Children, isValidElement, type AnchorHTMLAttributes, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { Slot } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';

/** md: a 48px bar (icon 16px). lg: a 56px bar with 24px icons and 44px targets, for touch layouts. */
export type TabBarSize = Extract<Size, 'md' | 'lg'>;

interface TabBarOwnProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** TabBarItem elements. Three to five. */
  children?: ReactNode;
  /** Default md. lg gives 44px targets for touch layouts. */
  size?: TabBarSize;
  ref?: Ref<HTMLElement>;
}

/** A tab bar needs a name: `aria-label`, or `aria-labelledby`. */
export type TabBarProps = TabBarOwnProps &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

/** The bottom navigation of a phone layout: a nav landmark with a name. */
export function TabBar({ size = 'md', children, ...rest }: TabBarProps) {
  return (
    <nav {...rest} data-ds="tab-bar" data-size={size}>
      {children}
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

const words = { en: { count: 'new', dot: 'New' }, ar: { count: 'جديد', dot: 'جديد' } } as const;

/** One destination of the bar: an icon over a label, with an optional badge. */
export function TabBarItem({ label, icon, active = false, badge, badgeLabel, asChild = false, children, ref, ...rest }: TabBarItemProps) {
  const { lang } = useTheme();
  const w = words[lang === 'ar' ? 'ar' : 'en'];
  const showBadge = badge !== undefined && badge !== false && badge !== 0;
  const count = typeof badge === 'number' ? (badge > 99 ? '99+' : String(badge)) : null;
  const hidden = count !== null ? `${lang === 'ar' ? '،' : ','} ${count} ${badgeLabel ?? w.count}` : `${lang === 'ar' ? '،' : ','} ${badgeLabel ?? w.dot}`;

  const parts = (
    <>
      <span data-part="item-icon">
        <Icon name={icon} size="md" />
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
