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
// - Under breakpoint.tablet the menu button opens a Drawer from the inline
//   start. Its root carries `data-part="mobile"`. It is titled with the
//   panel name ("Site menu") and holds a Sidebar with collapsible false,
//   one group per menu, then the end actions in its footer: on phones the
//   bar hides the end actions, so no label is cut to an ellipsis at 320px
//   (WCAG 1.4.10). With no items there is no menu button, so the end
//   actions stay in the bar and wrap to a row of their own when needed.
//   Drawer gives the focus trap, Escape and the return to the button.
// - The chevron of a trigger is Button's own `end` part; the Navbar turns
//   it over, it does not own it.
// - Motion of order 1.22 (proposed), from motion/src/helpers/indicator.ts:
//   "nav-current-slide": when another link of the bar becomes current, its
//   bar (the link's ::before) slides from the old one on the snappy spring,
//   stretched on the way. "nav-hover-follow": the hover veil (::after)
//   slides from the link the pointer just left. No DOM is added.
// - `sticky` keeps the bar at the top and reserves the same room as
//   scroll padding on the page (WCAG 2.4.11).
// - `placement` (order DU1, docs/plan/reset-duo.md) is auto, bottom or
//   side, inherited from the nearest PageShell when not set. It stamps
//   data-placement only when not auto; under auto the CSS decides from the
//   PageShell's size (container ds-shell). In a side placement the brand
//   and the links stay in the top row and the end actions (or, on phones,
//   the menu button) go to the column at the inline end. The DOM order
//   never changes, so focus goes brand, links, end actions, menu button in
//   every placement, which is the column's top to bottom order after the
//   top row. The links keep Radix's horizontal arrow keys: they stay a row.
// - Pushed screen form (order C2, docs/plan/reset-mobile.md, proposed):
//   `back` draws a back IconButton (part back, the chevron-back glyph,
//   which mirrors in right to left) at the inline start of the button row,
//   in the part start with the `start` actions after it. `heading` draws the
//   page's h1 (part heading) on a row of its own under the buttons, as the
//   large title of a pushed screen. Both are optional and independent: a
//   heading with no back is the large title under a row of actions. The
//   heading is the last child, so the reading order is the buttons, then
//   the title, as drawn (WCAG 1.3.1, 2.4.3).
// - Bar groups (order C2): an attached ButtonGroup in start or end is one
//   capsule holding several IconButtons. Each stays its own button, with
//   its own name and target; the group has a name of its own (role group).
//   The Navbar draws no seam between them; a platform paints the capsule.
// - Large title collapse (order K1, docs/plan/reset-mobile.md, proposed):
//   on `ios`, a Navbar with a heading in a PageShell header collapses when
//   the shell's main scrolls: the large title scrolls away and the bar's
//   inline title fades in. ios.css draws it; where scroll timelines exist
//   the title follows the scroll there (CSS only). This file stamps the
//   state, `data-collapsed` on the root, for both paths, from a scroll
//   listener on main: the heading sits in the header, outside the scroller,
//   so an IntersectionObserver rooted on main cannot see it. Collapsed is
//   main scrolled past the heading's height where the title follows the
//   scroll, and past its first pixel where it does not (no scroll timeline,
//   or reduced motion), so the title never sits over content that scrolled
//   under it. The inline title is the heading's text in
//   `data-inline-title`, drawn by CSS as generated content with empty
//   alternative text: the h1 stays the one heading for assistive tech in
//   both states, and stays in the tree while it is out of view.
// - Two line title (order C5, docs/plan/reset-mobile.md, proposed): below
//   360 wide the large title wraps to two lines instead of an ellipsis
//   (WCAG 1.4.10; the platform CSS draws it). The collapse never assumes one
//   line: the heading's height is measured (a ResizeObserver, so a wrap, a
//   font that loads late or a turn of the device is seen) and written on
//   the PageShell root as --_navbar-heading-size, which the platform CSS
//   reads for the room main keeps at its start and for the range the title
//   scrolls away in; the collapse point is that same height.
import { createElement, useEffect, useLayoutEffect, useRef, useState, type ElementType, type HTMLAttributes, type MouseEvent, type ReactNode, type Ref } from 'react';
import { NavigationMenu } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerTrigger } from '../Drawer';
import { Sidebar, SidebarGroup, SidebarItem } from '../Sidebar';
import { inFrame, planFollow, planInk, prefersReducedMotion } from '@the-system/motion';
import { useHoverFollow, useIndicatorTrack } from '../../internal/indicator';
import { useMotion } from '../../internal/motion';
import { placementAttr, usePlacement, type BarPlacement } from '../PageShell/placement';

/** Where the bar's actions sit: CSS decides (auto), always in the top row, or always in a column at the inline end. */
export type NavbarPlacement = BarPlacement;

/** The links of the bar itself, not those in a panel. */
const BAR_LINK = '[data-part="list"] > [data-part="item"] > [data-part="link"]';

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

/** The back control of a pushed screen: an IconButton with the chevron-back glyph. */
export interface NavbarBack {
  /**
   * The accessible name of the back button. Name it after where it goes,
   * the title of the page before: Library. Arabic: المكتبة. Required.
   */
  label: string;
  /** The page it goes back to. With href the button is a link (rendered as `linkAs`); without, a button that calls onClick. */
  href?: string;
  /** Called on a press, before a link is followed. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
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
  /** Actions at the inline end: sign in, a theme switch, an account menu. An attached ButtonGroup of IconButtons is one capsule of bar buttons. */
  end?: ReactNode;
  /**
   * Actions at the inline start of the button row, after the back button:
   * an IconButton, or an attached ButtonGroup of IconButtons as one
   * capsule. They stay in the bar on phones. Default none.
   */
  start?: ReactNode;
  /**
   * The back control of a pushed screen: an IconButton (part back) at the
   * inline start of the button row, before `start`. Its glyph mirrors in
   * right to left. Default none.
   */
  back?: NavbarBack;
  /**
   * The page's title as its h1, on a row of its own under the buttons (part
   * heading): the large title of a pushed screen. Keep one h1 on the page.
   * On `ios` in a PageShell header it collapses into the bar's inline title
   * when main scrolls (data-collapsed). Default none: the bar draws no
   * heading, and a brand may be the title.
   */
  heading?: ReactNode;
  /** Keeps the bar at the top of the scrolling page and reserves scroll padding. Default false. Sets data-sticky. */
  sticky?: boolean;
  /** The component every link renders as, for a router. It gets href, children and the link attributes. Default "a". */
  linkAs?: ElementType;
  /** The label of a menu whose panel is open at first render. Default none. */
  defaultOpenMenu?: string;
  /**
   * The menu button's name (one stable name; aria-expanded carries the
   * state) and the phone list's name: the title of the Drawer and the name
   * of the nav inside it. Default "Menu" and "Site menu", in Arabic too.
   */
  menuLabels?: { button: string; panel: string };
  /**
   * Where the actions sit on a phone shell. auto: CSS decides from the
   * PageShell's size (a column at the inline end when the shell is wide and
   * short, on `ios`). bottom: always in the top row. side: always in the
   * column; the brand and links stay in the top row. Default: the nearest
   * PageShell's placement, else auto. Stamps data-placement only when not
   * auto.
   */
  placement?: NavbarPlacement;
  ref?: Ref<HTMLElement>;
}

/** The top bar: brand, links and menus on wide screens; a menu button and a list on phones. */
export function Navbar({
  label,
  size = 'md',
  brand,
  items,
  end,
  start,
  back,
  heading,
  sticky = false,
  linkAs = 'a',
  defaultOpenMenu,
  menuLabels: labels,
  placement: placementProp,
  ref,
  ...rest
}: NavbarProps) {
  const placement = usePlacement(placementProp);
  const { lang, platform } = useTheme();
  const words = labels ?? menuLabels[lang === 'ar' ? 'ar' : 'en'];
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const hasHeading = heading !== undefined && heading !== null && heading !== false;
  const collapsed = useLargeTitleCollapse(rootRef, headingRef, hasHeading && platform === 'ios');
  const inlineTitle = useInlineTitle(headingRef, heading, hasHeading);
  const motion = useMotion();
  const track = useIndicatorTrack();
  useHoverFollow(rootRef, { item: BAR_LINK, pseudo: '::after', mode: () => motion.mode('nav-hover-follow') });

  // The current link of the bar: its bar (::before) slides from the link that was current (nav-current-slide).
  // Order 1.29 (review B14): read with every other list of the commit, write after (inFrame).
  useLayoutEffect(() => {
    const mode = motion.mode('nav-current-slide');
    inFrame(() => {
      const root = rootRef.current;
      const current = root?.querySelectorAll<HTMLElement>(`${BAR_LINK}[data-active]`);
      if (!root || !root.isConnected || !current || current.length !== 1) {
        track.key = null;
        return;
      }
      const link = current[0]!;
      const left = track.el;
      const plan = planFollow(track, link.getAttribute('href') ?? '', { el: link, pseudo: '::before' }, { mode, anchor: root, axis: 'x' });
      // Round 3: the link text takes the current color where the bar is (helpers/nav-ink.ts in @the-system/motion).
      const ink = plan.slide
        ? planInk({
            switch: '--_navbar-ink',
            slide: plan.slide,
            to: plan.to,
            anchor: root,
            parts: Array.from(root.querySelectorAll(BAR_LINK)),
            reaching: [link],
            restFrom: left !== link ? left : null,
            inkFrom: link,
            axis: 'x',
          })
        : null;
      return () => {
        const slide = plan.write();
        ink?.(slide);
      };
    });
  });
  // Radix builds element ids from item values, so values are indexes, never labels with spaces.
  const openIndex = defaultOpenMenu === undefined ? -1 : items.findIndex((item) => item.label === defaultOpenMenu);
  const openValue = openIndex < 0 ? undefined : `item-${openIndex}`;

  // Close the phone list when the window grows past the breakpoint and the bar shows again.
  useEffect(() => {
    if (!mobileOpen || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(min-width: 48rem)'); // breakpoint.tablet
    const onChange = () => {
      if (query.matches) setMobileOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [mobileOpen]);

  const setRootRef = (node: HTMLElement | null) => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
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
      ref={setRootRef}
      aria-label={label}
      defaultValue={openValue}
      data-ds="navbar"
      data-size={size}
      data-sticky={sticky ? '' : undefined}
      data-placement={placementAttr(placement)}
      data-collapsed={collapsed ? '' : undefined}
      data-inline-title={inlineTitle || undefined}
    >
      {(back !== undefined || start !== undefined) && (
        <div data-part="start">
          {back !== undefined && <BackButton back={back} linkAs={linkAs} size={size} />}
          {start}
        </div>
      )}
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
                    end={<Icon name="chevron-down" size="sm" />}
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
        <Drawer open={mobileOpen} onOpenChange={setMobileOpen} side="start" size="sm">
          <DrawerTrigger>
            <IconButton data-part="menu-button" icon="menu" size={size === 'lg' ? 'lg' : 'md'} label={words.button} />
          </DrawerTrigger>
          <DrawerContent
            title={words.panel}
            rootProps={{ 'data-part': 'mobile' } as Record<string, string>}
            // The window grew past the breakpoint: the button is hidden, so focus goes to the first item of the bar.
            onCloseAutoFocus={(event) => {
              if (typeof window.matchMedia !== 'function' || !window.matchMedia('(min-width: 48rem)').matches) return;
              const first = rootRef.current?.querySelector<HTMLElement>('[data-part="list"] a, [data-part="list"] button');
              if (!first) return;
              event.preventDefault();
              first.focus();
            }}
          >
            <DrawerBody>
              <Sidebar label={words.panel} collapsible={false}>
                {groupsOf(items).map((group, i) => (
                  <SidebarGroup key={group.label ?? `links-${i}`} label={group.label}>
                    {group.links.map((link, j) => (
                      <SidebarItem key={`${j}-${link.href}`} start={link.start} active={link.active} asChild>
                        {/* Following a link closes the list, so a router page change never sits under it. */}
                        {createElement(
                          linkAs,
                          {
                            href: link.href,
                            onClick: () => setMobileOpen(false),
                          },
                          link.label,
                        )}
                      </SidebarItem>
                    ))}
                  </SidebarGroup>
                ))}
              </Sidebar>
            </DrawerBody>
            {end !== undefined && <DrawerFooter>{end}</DrawerFooter>}
          </DrawerContent>
        </Drawer>
      )}
      {hasHeading && (
        <h1 ref={headingRef} data-part="heading">
          {heading}
        </h1>
      )}
    </NavigationMenu.Root>
  );
}

/** The heading's measured height, written on the PageShell root for ios.css (order C5). */
const HEADING_SIZE = '--_navbar-heading-size';

/** True where the heading follows the scroll in CSS (ios.css): scroll timelines exist and motion is not reduced. */
function titleFollowsScroll(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: scroll()') && !prefersReducedMotion();
}

/**
 * The large title collapse state (order K1). Active only on `ios`, with a
 * heading, in the header of a PageShell whose main is the scroller. Reads
 * main's scroll offset once per frame while it scrolls; never measures
 * during render.
 */
function useLargeTitleCollapse(rootRef: { current: HTMLElement | null }, headingRef: { current: HTMLElement | null }, active: boolean): boolean {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    const shell = active ? root?.closest('[data-ds="page-shell"]') : null;
    const header = root?.closest('[data-part="header"]');
    const main = shell?.querySelector<HTMLElement>(':scope > [data-part="main"]');
    if (!root || !shell || !main || !header || header.parentElement !== shell) {
      setCollapsed(false);
      return;
    }
    let frame = 0;
    const read = () => {
      frame = 0;
      const title = headingRef.current;
      // Where the title follows the scroll it is gone once main has scrolled its height; elsewhere at the first pixel.
      const at = titleFollowsScroll() && title ? Math.max(1, title.offsetHeight) : 1;
      setCollapsed(main.scrollTop >= at);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(read);
    };
    // Order C5: the heading may wrap (two lines on a narrow shell, WCAG 1.4.10), so its height is
    // measured, never assumed: the shell gets it as --_navbar-heading-size for the room main keeps
    // at its start and the range the title scrolls away in (ios.css). Written on the shell, where
    // that room is worked out; removed when the bar leaves or stops collapsing.
    const shellEl = shell as HTMLElement;
    const size = () => {
      const title = headingRef.current;
      if (!title) return;
      const next = `${title.offsetHeight}px`;
      if (shellEl.style.getPropertyValue(HEADING_SIZE) !== next) shellEl.style.setProperty(HEADING_SIZE, next);
      read();
    };
    size();
    const view = root.ownerDocument.defaultView;
    const observer = view && typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(size) : null;
    if (observer && headingRef.current) observer.observe(headingRef.current);
    else view?.addEventListener('resize', size);
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      main.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      view?.removeEventListener('resize', size);
      shellEl.style.removeProperty(HEADING_SIZE);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [rootRef, headingRef, active]);
  return active && collapsed;
}

/**
 * The text of the inline title: the heading itself when it is a string or
 * a number, else the heading element's text, read after render.
 */
function useInlineTitle(headingRef: { current: HTMLElement | null }, heading: ReactNode, hasHeading: boolean): string {
  const plain = typeof heading === 'string' || typeof heading === 'number' ? String(heading) : null;
  const [read, setRead] = useState('');
  useLayoutEffect(() => {
    if (plain !== null || !hasHeading) return;
    const text = headingRef.current?.textContent?.trim() ?? '';
    setRead((prev) => (prev === text ? prev : text));
  });
  if (!hasHeading) return '';
  return (plain ?? read).trim();
}

/** The back button: a link when it has href, else a button. chevron-back mirrors in right to left (icons/names.ts). */
function BackButton({ back, linkAs, size }: { back: NavbarBack; linkAs: ElementType; size: NavbarSize }) {
  const common = { 'data-part': 'back', icon: 'chevron-back', label: back.label, size: size === 'lg' ? 'lg' : 'md' } as const;
  if (back.href === undefined) return <IconButton {...common} onClick={back.onClick} />;
  return (
    <IconButton {...common} asChild>
      {createElement(linkAs, { href: back.href, onClick: back.onClick })}
    </IconButton>
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
