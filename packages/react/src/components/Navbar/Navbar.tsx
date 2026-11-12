'use client';
// Navbar: the top bar of a site or app. A brand, primary links and menus
// with dropdown panels, actions at the end, and a menu button on phones.
//
// Sources: GoBanana site `SiteNav.tsx` and desktop `desktop.css` (menu bar)
// could not be fetched in the lane session. The look follows the dials
// table in section 3.7 of PLAN.md (Neutral: top bar; Desk: menu bar) and
// the nearest components here: DropdownMenu for the panel surface, Sidebar
// for the phone list.
//
// Decisions:
// - Behavior is Radix NavigationMenu: Tab between items, Enter and Space
//   open a panel, ArrowDown moves into it, Escape closes, arrows move
//   between triggers in the reading direction.
// - Items are data (`items`), not children: the same list renders twice,
//   as the bar on wide screens and as the phone list under
//   breakpoint.tablet. `linkAs` takes a router link component.
// - The current page is `aria-current="page"` plus weight and a bar under
//   the link, never color alone.
// - The `mobile` part should be a Drawer root (order 1.6.3). Drawer is not
//   built yet, so the phone list is a disclosure panel under the bar: the
//   menu button (an IconButton with aria-expanded) shows and hides it, and
//   Escape closes it and returns focus to the button. It holds a Sidebar
//   with collapsible false, one group per menu. When Drawer lands, swap the
//   panel for a Drawer root carrying `data-part="mobile"`.
// - `sticky` keeps the bar at the top and reserves the same room as
//   scroll padding on the page (WCAG 2.4.11).
import {
  createElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { NavigationMenu } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Sidebar, SidebarGroup, SidebarItem } from '../Sidebar';

export type NavbarSize = Extract<Size, 'md' | 'lg'>;

/** One link in the bar, or in a panel. */
export interface NavbarLink {
  /** Visible text, a noun: "Pricing", "Docs". */
  label: string;
  href: string;
  /** One line under the label, in a panel only. */
  description?: string;
  /** The current page. */
  active?: boolean;
  /** A leading icon in the phone list. */
  start?: IconName;
}

/** A menu: a trigger in the bar that opens a panel of links. */
export interface NavbarMenu {
  label: string;
  links: NavbarLink[];
}

export type NavbarItem = NavbarLink | NavbarMenu;

function isMenu(item: NavbarItem): item is NavbarMenu {
  return 'links' in item;
}

const menuLabels = {
  en: { button: 'Menu', panel: 'Site menu' },
  ar: { button: 'القائمة', panel: 'قائمة الموقع' },
} as const;

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface NavbarProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'dir' | 'defaultValue' | 'onChange'> {
  /** The accessible name of the nav landmark ("Main"). Required. */
  label: string;
  /** Bar height and type: md 48px, lg 60px at default density. Default md. */
  size?: NavbarSize;
  /** The brand: a logo link to the home page. */
  brand?: ReactNode;
  /** The primary links and menus. */
  items: NavbarItem[];
  /** Actions at the inline end: sign in, a theme switch, an account menu. */
  end?: ReactNode;
  /** Keeps the bar at the top of the scrolling page and reserves scroll padding. Default false. Sets data-sticky. */
  sticky?: boolean;
  /** The component every link renders as, for a router. It gets href, children and the link attributes. Default "a". */
  linkAs?: ElementType;
  /** The label of a menu whose panel is open at first render. Default none. */
  defaultOpenMenu?: string;
  /**
   * The menu button's name (one stable name; aria-expanded carries the
   * state) and the phone list's landmark name. Default "Menu" and "Site
   * menu", in Arabic too.
   */
  menuLabels?: { button: string; panel: string };
  ref?: Ref<HTMLElement>;
}

/** The top bar: brand, links and menus on wide screens; a menu button and a list on phones. */
export function Navbar({
  label,
  size = 'md',
  brand,
  items,
  end,
  sticky = false,
  linkAs = 'a',
  defaultOpenMenu,
  menuLabels: labels,
  ref,
  ...rest
}: NavbarProps) {
  const { lang } = useTheme();
  const words = labels ?? menuLabels[lang === 'ar' ? 'ar' : 'en'];
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  // Radix builds element ids from item values, so values are indexes, never labels with spaces.
  const openIndex = defaultOpenMenu === undefined ? -1 : items.findIndex((item) => item.label === defaultOpenMenu);
  const openValue = openIndex < 0 ? undefined : `item-${openIndex}`;

  // Close the phone list when the window grows past the breakpoint and the bar shows again.
  useEffect(() => {
    if (!mobileOpen || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(min-width: 48rem)'); // breakpoint.tablet
    const onChange = () => {
      if (!query.matches) return;
      // Focus inside the list would drop to the body when it unmounts: move it to the button's place in the bar.
      const focusInside = mobileRef.current?.contains(document.activeElement) ?? false;
      setMobileOpen(false);
      if (focusInside) mobileRef.current?.closest('[data-ds="navbar"]')?.querySelector<HTMLElement>('[data-part="list"] a, [data-part="list"] button')?.focus();
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [mobileOpen]);

  const onMobileKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && mobileOpen) {
      event.stopPropagation();
      setMobileOpen(false);
      buttonRef.current?.focus();
    }
  };

  const renderLink = (link: NavbarLink, inPanel: boolean) => (
    <NavigationMenu.Link asChild active={link.active}>
      {createElement(
        linkAs,
        { href: link.href, 'data-part': 'link' },
        inPanel ? (
          <>
            <span data-part="link-label">{link.label}</span>
            {link.description && <span data-part="link-description">{link.description}</span>}
          </>
        ) : (
          link.label
        ),
      )}
    </NavigationMenu.Link>
  );

  return (
    <NavigationMenu.Root
      {...rest}
      ref={ref}
      aria-label={label}
      defaultValue={openValue}
      data-ds="navbar"
      data-size={size}
      data-sticky={sticky ? '' : undefined}
    >
      {brand !== undefined && <div data-part="brand">{brand}</div>}
      <NavigationMenu.List data-part="list">
        {items.map((item, index) => (
          <NavigationMenu.Item key={index} value={`item-${index}`} data-part="item">
            {isMenu(item) ? (
              <>
                <NavigationMenu.Trigger asChild>
                  <Button
                    data-part="trigger"
                    emphasis="ghost"
                    size={size === 'lg' ? 'lg' : 'md'}
                    data-active={item.links.some((l) => l.active) ? '' : undefined}
                    end={
                      <span data-part="trigger-icon">
                        <Icon name="chevron-down" size="sm" />
                      </span>
                    }
                  >
                    {item.label}
                  </Button>
                </NavigationMenu.Trigger>
                <NavigationMenu.Content data-part="content">
                  <ul data-part="content-list">
                    {item.links.map((link, i) => (
                      <li key={`${i}-${link.href}`}>{renderLink(link, true)}</li>
                    ))}
                  </ul>
                </NavigationMenu.Content>
              </>
            ) : (
              renderLink(item, false)
            )}
          </NavigationMenu.Item>
        ))}
        <NavigationMenu.Indicator data-part="indicator" />
      </NavigationMenu.List>
      <NavigationMenu.Viewport data-part="viewport" />
      {end !== undefined && <div data-part="end">{end}</div>}
      {items.length > 0 && (
        <IconButton
          ref={buttonRef}
          data-part="menu-button"
          icon={mobileOpen ? 'close' : 'menu'}
          size={size === 'lg' ? 'lg' : 'md'}
          label={words.button}
          aria-expanded={mobileOpen}
          aria-controls={mobileId}
          onClick={() => setMobileOpen(!mobileOpen)}
          onKeyDown={onMobileKeyDown}
        />
      )}
      <div
        ref={mobileRef}
        data-part="mobile"
        id={mobileId}
        data-state={mobileOpen ? 'open' : 'closed'}
        hidden={!mobileOpen}
        onKeyDown={onMobileKeyDown}
      >
        {mobileOpen && (
          <Sidebar label={words.panel} collapsible={false}>
            {groupsOf(items).map((group, i) => (
              <SidebarGroup key={group.label ?? `links-${i}`} label={group.label}>
                {group.links.map((link, j) => (
                  <SidebarItem key={`${j}-${link.href}`} start={link.start} active={link.active} asChild>
                    {/* Following a link closes the list, so a router page change never sits under it. */}
                    {createElement(linkAs, { href: link.href, onClick: () => setMobileOpen(false) }, link.label)}
                  </SidebarItem>
                ))}
              </SidebarGroup>
            ))}
          </Sidebar>
        )}
      </div>
    </NavigationMenu.Root>
  );
}

/** Plain links run together into one unnamed group; each menu becomes a named group. */
function groupsOf(items: NavbarItem[]): { label?: string; links: NavbarLink[] }[] {
  const groups: { label?: string; links: NavbarLink[] }[] = [];
  for (const item of items) {
    if (isMenu(item)) {
      groups.push({ label: item.label, links: item.links });
    } else {
      const last = groups.at(-1);
      if (last && last.label === undefined) last.links.push(item);
      else groups.push({ links: [item] });
    }
  }
  return groups;
}
