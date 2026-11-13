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
// - Each item of a collapsed sidebar shows a Tooltip with its label on hover
//   and focus (WCAG 1.4.13). The Tooltip is always rendered and only turned
//   off while expanded, so collapsing never remounts an item. The hint is the
//   item's own name, so it is not wired as its description too.
// - The groups sit in a `body` part that scrolls; the header and the footer
//   are outside it. Nothing is drawn over a scrolling item, so a focused item
//   is never hidden (WCAG 2.4.11) and no footer link covers part of an item.
// - The width never animates (only transform and opacity may), so collapse
//   is instant. An opened group fades in (pattern "fade-rise").
// - Motion of order 1.22 (proposed), from motion/src/helpers/indicator.ts:
//   "nav-current-slide": when another item becomes current, its edge bar
//   (the item's ::before) slides from the old one along the column on the
//   snappy spring, stretched on the way, and the labels dip and pop.
//   "nav-hover-follow": the hover veil (::after) slides from the item the
//   pointer just left. "sidebar-collapse": the width still changes at once;
//   on expand the labels, counts and group titles come in from the inline
//   start after the panel, a stagger step apart (staggerGroup), and on
//   collapse the icons gather (scale.anticipate) and settle. No DOM is added.
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
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
import { followIndicator, popIn, readDuration, readEasing, staggerGroup, type IndicatorTrack, type PatternMode } from '@the-system/motion';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme';
import { useHoverFollow, useIndicatorTrack } from '../../internal/indicator';
import { useMotion } from '../../internal/motion';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Tooltip, TooltipProvider } from '../Tooltip';

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

/** Where the current item's edge bar was last drawn, for the slide. */
const TrackContext = createContext<IndicatorTrack | null>(null);

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

/** Flattens fragments, so a header or footer inside a fragment is still found. */
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flatten(child.props.children) : [child],
  );
}

function renderStart(content: SidebarSlotContent): ReactNode {
  return typeof content === 'string' ? <Icon name={content} size="md" /> : content;
}

/** Round 3: clips the expanded panel back to the width it had and opens the clip to its new width, on the soft spring. */
function revealPanel(root: HTMLElement, from: number, to: number, mode: PatternMode): void {
  if (mode !== 'full' || typeof root.animate !== 'function' || !(from > 0) || from >= to) return;
  const rtl = getComputedStyle(root).direction === 'rtl';
  const cut = `${Math.round(to - from)}px`;
  root.animate([{ clipPath: rtl ? `inset(0 0 0 ${cut})` : `inset(0 ${cut} 0 0)` }, { clipPath: 'inset(0)' }], {
    id: 'ds-motion:sidebar-reveal',
    duration: readDuration(root, 'duration.spring-soft'),
    easing: readEasing(root, 'ease.spring-soft'),
  });
}

/** Round 3: each label wipes in from the inline start with clip-path, delay.stagger apart after two steps, at most six steps. */
function wipeLabels(labels: NodeListOf<Element>, mode: PatternMode): void {
  if (mode !== 'full') return;
  labels.forEach((el, i) => {
    if (typeof el.animate !== 'function') return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const step = readDuration(el, 'delay.stagger');
    el.animate([{ clipPath: rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }], {
      id: 'ds-motion:sidebar-labels',
      duration: readDuration(el, 'duration.spring-soft'),
      easing: readEasing(el, 'ease.spring-soft'),
      delay: step * Math.min(6, i + 2),
      fill: 'backwards',
    });
  });
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
  const track = useIndicatorTrack();
  const motion = useMotion();
  const rootRef = useRef<HTMLElement | null>(null);
  const setRootRef = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useHoverFollow(rootRef, {
    item: '[data-part="item"]:not([data-disabled])',
    pseudo: '::after',
    mode: () => motion.mode('nav-hover-follow'),
  });

  // Collapse and expand: the width changes at once; the parts answer after it.
  const wasCollapsed = useRef(collapsed);
  const lastWidth = useRef(0);
  useLayoutEffect(() => {
    const root = rootRef.current;
    const before = wasCollapsed.current;
    wasCollapsed.current = collapsed;
    const width = root ? root.getBoundingClientRect().width : 0;
    const from = lastWidth.current;
    lastWidth.current = width;
    if (!root || before === collapsed) return;
    const mode = motion.mode('sidebar-collapse');
    if (collapsed) {
      for (const icon of root.querySelectorAll('[data-part="item-icon"]')) popIn(icon, mode);
      return;
    }
    const labels = root.querySelectorAll('[data-part="item-label"], [data-part="item-count"], [data-part="group-label"]');
    if (mode !== 'full') {
      staggerGroup(labels, { mode, from: 'inline', offset: 2, spring: 'soft' });
      return;
    }
    // Round 3: the panel is uncovered from its collapsed width to its new width with clip-path
    // (the layout took the width at once), and the labels wipe in from the inline start, a stagger step apart.
    revealPanel(root, from, width, mode);
    wipeLabels(labels, mode);
  }, [collapsed, motion]);

  // The header goes first and the footer last; everything else goes in the scrolling body.
  const head: ReactNode[] = [];
  const body: ReactNode[] = [];
  const foot: ReactNode[] = [];
  for (const child of flatten(children)) {
    if (isValidElement(child) && child.type === SidebarHeader) head.push(child);
    else if (isValidElement(child) && child.type === SidebarFooter) foot.push(child);
    else body.push(child);
  }

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        size,
        setCollapsed,
        toggle: collapsible ? words : null,
        registerHeader,
      }}
    >
      <TooltipProvider>
        <TrackContext value={track}>
          <nav {...rest} ref={setRootRef} aria-label={label} data-ds="sidebar" data-size={size} data-state={collapsed ? 'collapsed' : 'expanded'}>
            {collapsible && headers === 0 && (
              <div data-part="header">
                <SidebarToggle />
              </div>
            )}
            {head}
            {body.length > 0 && <div data-part="body">{body}</div>}
            {foot}
          </nav>
        </TrackContext>
      </TooltipProvider>
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

/** The top of the sidebar: brand or workspace, then the toggle when the sidebar is collapsible. A direct child of Sidebar. */
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

/** The bottom of the sidebar. It stays in view while the groups scroll. A direct child of Sidebar. */
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

/**
 * Sits between the Tooltip trigger and the item. The hint is the item's own
 * label, so the tooltip id is dropped from aria-describedby and the label is
 * not read twice. Every other trigger prop (handlers, ref) merges onto the
 * item through Slot; the item keeps its own aria-describedby.
 */
function WithoutHintDescription({
  'aria-describedby': _hint,
  ...rest
}: { 'aria-describedby'?: string; children: ReactElement } & Record<string, unknown>) {
  return <Slot.Root {...rest} />;
}

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
  const { collapsed } = useSidebar();
  const track = useContext(TrackContext);
  const motion = useMotion();
  const shown = !count ? undefined : count > COUNT_MAX ? `${COUNT_MAX}+` : String(count);
  const key = useId();
  const itemRef = useRef<HTMLAnchorElement | null>(null);
  const setItemRef = useCallback(
    (node: HTMLAnchorElement | null) => {
      itemRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // The current item: its edge bar slides from the item that was current (nav-current-slide).
  useLayoutEffect(() => {
    const el = itemRef.current;
    const root = el?.closest('[data-ds="sidebar"]');
    if (!active || !el || !root || !track) return;
    const other = track.el;
    followIndicator(
      track,
      key,
      { el, pseudo: '::before' },
      {
        mode: motion.mode('nav-current-slide'),
        anchor: root,
        axis: 'y',
        label: el.querySelector(':scope > [data-part="item-label"]'),
        // Two items marked current at once: the bar does not jump between them.
        slide: !(other && other !== el && other.isConnected && other.hasAttribute('data-active')),
      },
    );
  });

  const attrs = {
    ...rest,
    ref: setItemRef,
    href: disabled ? undefined : href,
    // Without href an <a> has no role and no tab stop: give both back.
    role: disabled ? (rest.role ?? 'link') : rest.role,
    tabIndex: disabled ? (rest.tabIndex ?? 0) : rest.tabIndex,
    'data-part': 'item',
    'data-active': active ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    'aria-current': active ? ('page' as const) : rest['aria-current'],
    'aria-disabled': disabled ? true : rest['aria-disabled'],
    // Set on purpose, also when undefined: the item's own value wins over the Tooltip trigger's, so no tooltip state lands on the part.
    'data-state': undefined,
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

  let item: ReactElement;
  let label: ReactNode = children;
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
    label = text;
    item = <a {...attrs}>{render(text)}</a>;
  }
  if (asChild && !disabled && isValidElement<{ children?: ReactNode }>(children)) label = children.props.children;

  // Collapsed: the label is hidden, so a Tooltip shows it. Always rendered, off while expanded, so the item never remounts.
  const withHint = (
    <Tooltip content={label} side="end" disabled={!collapsed}>
      <WithoutHintDescription>{item}</WithoutHintDescription>
    </Tooltip>
  );

  return inList ? <li>{withHint}</li> : withHint;
}
