'use client';
// Sidebar: the side navigation of an app. Groups of links with icons and
// counts, a header and a footer, and a collapsed form that keeps only the
// icons.
//
// Sources: GoBanana admin `AdminNav.tsx` and site `SiteNav.tsx` could not be
// fetched in the lane session, so the look comes from the dials table in
// section 3.7 of PLAN.md (Studio dial 10: rail, sidebars, inspector; Neutral:
// sidebar, top bar) and the nearest components here (DropdownMenu rows,
// Link). Figma-Killer-2 `Section/` gave the collapsible group: the title is
// the toggle and the chevron sits beside it.
//
// Decisions:
// - The root is a `nav` with a label. Landmarks are the consumer's choice
//   (anatomy.md), so the label names this navigation ("Main", "Settings").
// - An item is a link: `aria-current="page"` plus weight and an edge bar on
//   the active one, never color alone. `asChild` takes a router link.
// - A collapsed sidebar keeps every item as an icon. The label stays in the
//   DOM, visually hidden, so it is still the accessible name. Groups show
//   all their items while collapsed: a closed group would hide destinations
//   with no visible way to open them.
// - Tooltip (order 1.6.6) is built by another lane. Once it lands, each item
//   of a collapsed sidebar is wrapped in a Tooltip with its label, at the
//   marked line in SidebarItem.
// - The width never animates (only transform and opacity may), so collapse
//   is instant. An opened group fades in (pattern "fade-rise").
import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Collapsible, Slot } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';

export type SidebarSize = Extract<Size, 'sm' | 'md'>;
/** Leading content of an item: a system icon name or a node. */
export type SidebarSlotContent = IconName | ReactElement;

/** The words of the toggle, per language. */
const toggleLabels = {
  en: { collapse: 'Collapse sidebar', expand: 'Expand sidebar' },
  ar: { collapse: 'طي القائمة الجانبية', expand: 'توسيع القائمة الجانبية' },
} as const;

/** Counts above this show as "99+". */
const COUNT_MAX = 99;

interface SidebarContextValue {
  collapsed: boolean;
  size: SidebarSize;
  setCollapsed: (next: boolean) => void;
  /** The toggle words, or null when the sidebar is not collapsible. */
  toggle: { collapse: string; expand: string } | null;
  /** A SidebarHeader registers itself, wherever it is nested, so the sidebar adds no second header. */
  registerHeader: () => () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/** True inside a group's list, where an item is a list item. In the header or footer it is a bare link. */
const ListContext = createContext(false);

/** The collapsed state and size of the nearest Sidebar. Use it to render a compact brand in the header. */
export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside a Sidebar.');
  return ctx;
}

function useControlled<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [controlled ? value : inner, set];
}

function renderStart(content: SidebarSlotContent): ReactNode {
  return typeof content === 'string' ? <Icon name={content} size="md" /> : content;
}

// ------------------------------------------------------------------ Sidebar

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface SidebarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The accessible name of the navigation landmark ("Main", "Settings"). Required. */
  label: string;
  /** Row height and type: sm 28px rows, md 32px rows (default density). Default md. */
  size?: SidebarSize;
  /** Controlled collapsed state: only icons show. */
  collapsed?: boolean;
  /** Collapsed state at first render when uncontrolled. Default false. */
  defaultCollapsed?: boolean;
  /** Called with the next collapsed state when the toggle is pressed. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Renders the toggle (an IconButton, icon `sidebar`) in the header. Default true. */
  collapsible?: boolean;
  /** The toggle's accessible names. Default "Collapse sidebar" and "Expand sidebar", in Arabic too. */
  toggleLabels?: { collapse: string; expand: string };
  /** A SidebarHeader, SidebarGroups and a SidebarFooter. */
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/**
 * A `nav` landmark with groups of links. The toggle in the header switches
 * between the full form and an icon column.
 */
export function Sidebar({
  label,
  size = 'md',
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  collapsible = true,
  toggleLabels: labels,
  children,
  ref,
  ...rest
}: SidebarProps) {
  const [collapsed, setCollapsed] = useControlled(collapsedProp, defaultCollapsed, onCollapsedChange);
  const { lang } = useTheme();
  const words = labels ?? toggleLabels[lang === 'ar' ? 'ar' : 'en'];
  const [headers, setHeaders] = useState(0);
  const registerHeader = useCallback(() => {
    setHeaders((n) => n + 1);
    return () => setHeaders((n) => n - 1);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, size, setCollapsed, toggle: collapsible ? words : null, registerHeader }}>
      <nav
        {...rest}
        ref={ref}
        aria-label={label}
        data-ds="sidebar"
        data-size={size}
        data-state={collapsed ? 'collapsed' : 'expanded'}
      >
        {collapsible && headers === 0 && (
          <div data-part="header">
            <SidebarToggle />
          </div>
        )}
        {children}
      </nav>
    </SidebarContext.Provider>
  );
}

function SidebarToggle() {
  const { collapsed, setCollapsed, toggle } = useSidebar();
  if (!toggle) return null;
  return (
    <IconButton
      data-part="toggle"
      icon="sidebar"
      size="sm"
      // The name says the next action. No aria-expanded: every link stays in place, only drawn smaller.
      label={collapsed ? toggle.expand : toggle.collapse}
      onClick={() => setCollapsed(!collapsed)}
    />
  );
}

// ------------------------------------------------------------------ header and footer

export interface SidebarHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The brand or the workspace switcher. The toggle follows it at the inline end. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** The top of the sidebar: brand or workspace, then the toggle when the sidebar is collapsible. */
export function SidebarHeader({ children, ref, ...rest }: SidebarHeaderProps) {
  const { registerHeader } = useSidebar();
  useLayoutEffect(() => registerHeader(), [registerHeader]);
  return (
    <div {...rest} ref={ref} data-part="header">
      {children}
      <SidebarToggle />
    </div>
  );
}

export interface SidebarFooterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The account, help or settings links. Stays at the block end. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** The bottom of the sidebar. It stays in view while the groups scroll. */
export function SidebarFooter({ children, ref, ...rest }: SidebarFooterProps) {
  return (
    <div {...rest} ref={ref} data-part="footer">
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ group

export interface SidebarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The visible heading of the group, and the name of its list. Optional for the first group of a short sidebar. */
  label?: string;
  /** The heading is a button that opens and closes the group (Radix Collapsible). Needs label. Default false. */
  collapsible?: boolean;
  /** Controlled open state of a collapsible group. */
  open?: boolean;
  /** Open state at first render when uncontrolled. Default true. */
  defaultOpen?: boolean;
  /** Called with the next open state. */
  onOpenChange?: (open: boolean) => void;
  /** SidebarItems. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A list of items under an optional heading. A collapsible group stamps
 * `data-state` (`open`, `closed`); a plain group stamps none.
 */
export function SidebarGroup({
  label,
  collapsible = false,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  children,
  ref,
  ...rest
}: SidebarGroupProps) {
  const { collapsed, size } = useSidebar();
  const labelId = useId();
  const [open, setOpen] = useControlled(openProp, defaultOpen, onOpenChange);

  // A collapsed sidebar shows every item: the group is held open and the CSS hides the trigger. The
  // Root stays mounted across collapse, so focus inside the group is never lost.
  if (collapsible && label) {
    return (
      <Collapsible.Root {...rest} ref={ref} data-part="group" open={collapsed || open} onOpenChange={setOpen}>
        <Collapsible.Trigger asChild>
          <Button
            data-part="group-trigger"
            emphasis="ghost"
            wrap
            size={size === 'sm' ? 'xs' : 'sm'}
            end={<Icon name="chevron-down" size="sm" />}
            id={labelId}
          >
            {label}
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content asChild>
          <ul data-part="list" aria-labelledby={labelId}>
            <ListContext.Provider value={true}>{children}</ListContext.Provider>
          </ul>
        </Collapsible.Content>
      </Collapsible.Root>
    );
  }

  return (
    <div {...rest} ref={ref} data-part="group">
      {label && (
        <div data-part="group-label" id={labelId}>
          {label}
        </div>
      )}
      <ul data-part="list" aria-labelledby={label ? labelId : undefined}>
        <ListContext.Provider value={true}>{children}</ListContext.Provider>
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ item

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface SidebarItemProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  /** The visible label, and the accessible name when the sidebar is collapsed. A noun: "Inbox", "Billing". */
  children?: ReactNode;
  /** The leading icon: a system icon name or a node. Needed for the collapsed form. */
  start?: SidebarSlotContent;
  /** A number after the label: unread, open, new. Over 99 shows "99+"; 0 draws nothing. */
  count?: number;
  /** What the count means, read after the label ("12 unread"). Default: the number alone. */
  countLabel?: string;
  /** The current page: `aria-current="page"`, `data-active`, weight and an edge bar. Default false. */
  active?: boolean;
  /** Cannot be followed: no href, aria-disabled and data-disabled, still focusable. Default false. */
  disabled?: boolean;
  /** Renders the single child element (a router link) as the item. Default false. */
  asChild?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

/** One destination: a link with an icon, a label and a count. */
export function SidebarItem({
  children,
  start,
  count,
  countLabel,
  active = false,
  disabled = false,
  asChild = false,
  href,
  onClick,
  onAuxClick,
  onKeyDown,
  ref,
  ...rest
}: SidebarItemProps) {
  const inList = useContext(ListContext);
  const shown = !count ? undefined : count > COUNT_MAX ? `${COUNT_MAX}+` : String(count);

  const attrs = {
    ...rest,
    ref,
    href: disabled ? undefined : href,
    // Without href an <a> has no role and no tab stop: give both back.
    role: disabled ? (rest.role ?? 'link') : rest.role,
    tabIndex: disabled ? (rest.tabIndex ?? 0) : rest.tabIndex,
    'data-part': 'item',
    'data-active': active ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    'aria-current': active ? ('page' as const) : rest['aria-current'],
    'aria-disabled': disabled ? true : rest['aria-disabled'],
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    onAuxClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onAuxClick?.(event);
    },
    onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (!disabled) onKeyDown?.(event);
    },
  };

  const render = (content: ReactNode) => (
    <>
      {start !== undefined && (
        <span data-part="item-icon" aria-hidden="true">
          {renderStart(start)}
        </span>
      )}
      <span data-part="item-label">{content}</span>
      {/* A space for the accessible name ("Inbox 12"); a flex row draws no whitespace. */}
      {shown !== undefined && ' '}
      {shown !== undefined && (
        <span data-part="item-count">
          {/* dir ltr: 99+ keeps its order in Arabic. */}
          <span dir="ltr" aria-hidden={countLabel ? true : undefined}>
            {shown}
          </span>
          {countLabel && <span data-visually-hidden="">{countLabel}</span>}
        </span>
      )}
    </>
  );

  // Tooltip (1.6.6): when it lands, wrap the item below in a Tooltip with its label while the sidebar is collapsed.
  let item: ReactNode;
  // A disabled item is always the plain anchor: a router child's own click handler would run first and navigate.
  if (asChild && !disabled) {
    if (!isValidElement(children)) {
      throw new Error('SidebarItem with asChild needs one element as its child.');
    }
    item = (
      <Slot.Root {...attrs}>
        <Slot.Slottable child={children}>{(content: ReactNode) => render(content)}</Slot.Slottable>
      </Slot.Root>
    );
  } else {
    // A disabled asChild item shows its child's text in the plain anchor.
    const text = asChild && isValidElement<{ children?: ReactNode }>(children) ? children.props.children : children;
    item = <a {...attrs}>{render(text)}</a>;
  }

  return inList ? <li>{item}</li> : item;
}
