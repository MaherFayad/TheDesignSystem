'use client';
// Dock: a row of app shortcuts at the block end of the screen. In Desk it is
// the glass dock with a magnify effect (packages/styles/desk/recipes/Dock.css);
// in other styles it is a plain row of icon tiles.
//
// Sources: GoBanana desktop `Dock.tsx` and desktop.css lines 1169 to 1287
// were not reachable in this session; the look follows the Desk dials
// ("menu bar, dock, windows", glass at 24 and 40px blur) and the dock
// material token (color.material.dock).
//
// The DOM:
//
//   <nav data-ds="dock" aria-label data-size>
//     <a data-part="item" href aria-current="page"? data-active? data-open?>
//       <span data-part="item-icon">           a system icon in a tile, or a node (an app image)
//       <span data-part="item-label">          the name: always in the link, drawn on hover and focus
//       <span data-part="item-indicator">      a dot under the tile while the app is open
//     <span data-part="separator" aria-hidden> a line between groups of apps
//
// Every item is a link, so its name is the link text and never only a
// native title. An app that opens a window rather than a page still gets an
// href (its route or a hash) and handles onClick; with asChild the item
// renders a router link. A system Button is not used: its own parts would
// own the label and the indicator.
import { Children, isValidElement, type AnchorHTMLAttributes, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { Slot } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';

/** md: 44px tiles (size.control.lg). lg: larger tiles for a desktop home screen. */
export type DockSize = Extract<Size, 'md' | 'lg'>;

interface DockOwnProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** DockItem and DockSeparator elements. */
  children?: ReactNode;
  /** Default md. */
  size?: DockSize;
  ref?: Ref<HTMLElement>;
}

/** A dock needs a name: `aria-label` (Apps), or `aria-labelledby`. */
export type DockProps = DockOwnProps &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

/** A nav landmark of app shortcuts. Every item is a tab stop. */
export function Dock({ size = 'md', children, ...rest }: DockProps) {
  return (
    <nav {...rest} data-ds="dock" data-size={size}>
      {children}
    </nav>
  );
}

export interface DockItemProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title' | 'children'> {
  /** The app name. In the link text, drawn above the tile on hover and focus. */
  label: string;
  /** A system icon name drawn in a tile, or a node (an app image, decorative: give it an empty alt). */
  icon: IconName | ReactElement;
  /** The current page belongs to this app: aria-current="page" and data-active. Default false. */
  active?: boolean;
  /** The app is open (has a window): the indicator dot and data-open. Default false. */
  open?: boolean;
  /** The words the open state adds to the name. Default "open" (Arabic: "مفتوح"). */
  openLabel?: string;
  /** Renders the single child element (a router link) as the item; its children are replaced by the parts. */
  asChild?: boolean;
  /** One element when asChild is set. */
  children?: ReactElement;
  ref?: Ref<HTMLAnchorElement>;
}

const openWords = { en: 'open', ar: 'مفتوح' } as const;

/** One app shortcut. */
export function DockItem({ label, icon, active = false, open = false, openLabel, asChild = false, children, ref, ...rest }: DockItemProps) {
  const { lang } = useTheme();
  const ar = lang === 'ar';
  const parts = (
    <>
      <span data-part="item-icon">{typeof icon === 'string' ? <Icon name={icon} size="lg" /> : icon}</span>
      <span data-part="item-label">
        {label}
        {open && <span data-part="item-status">{`${ar ? '،' : ','} ${openLabel ?? openWords[ar ? 'ar' : 'en']}`}</span>}
      </span>
      {open && <span data-part="item-indicator" aria-hidden="true" />}
    </>
  );
  const attrs = {
    ...rest,
    ref,
    'data-part': 'item',
    'data-active': active ? '' : undefined,
    'data-open': open ? '' : undefined,
    'aria-current': active ? ('page' as const) : rest['aria-current'],
  };
  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) throw new Error('DockItem with asChild needs one element as its child.');
    return (
      <Slot.Root {...attrs}>
        <Slot.Slottable child={child}>{() => parts}</Slot.Slottable>
      </Slot.Root>
    );
  }
  return <a {...attrs}>{parts}</a>;
}

export type DockSeparatorProps = Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children'>;

/** A line between groups of apps. Decorative. */
export function DockSeparator(props: DockSeparatorProps) {
  return <span {...props} data-part="separator" aria-hidden="true" />;
}
