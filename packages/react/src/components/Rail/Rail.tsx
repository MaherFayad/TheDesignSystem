'use client';
// Rail: a narrow column of icon destinations, the Studio rail.
//
// No source: designed from the dials table in section 3.7 of PLAN.md
// (Studio dial 10: rail, sidebars, inspector) and the nearest component,
// Sidebar, whose item states and active bar it shares.
//
// Decisions:
// - The root is a `nav` with a label. Items are links in a list, with
//   `aria-current="page"` plus weight, a fill and an edge bar on the active
//   one, never color alone.
// - Each item shows its icon and a short label under it. `hideLabels` keeps
//   the label only as the accessible name. Every item of a rail with hidden
//   labels, and every item whose label is cut to an ellipsis, shows a
//   Tooltip with the full label on hover and focus (WCAG 1.4.13). The
//   Tooltip is always rendered and only turned off otherwise, so an item
//   never remounts. The hint is the item's own label, so it is not wired as
//   its description too.
// - Targets: md items are size.control.md (32px), sm size.control.sm
//   (28px), never under 24px. On data-platform ios and android they grow to
//   size.touch.ios (44pt) and size.touch.android (48dp) for touch templates.
// - `start` and `end` hold the brand and the account or settings items, at
//   the block start and the block end of the column.
// - No motion: the hover veil fades on duration.fast and collapses under
//   reduced motion; nothing moves, so there is no pattern to name.
import {
  createContext,
  isValidElement,
  useContext,
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
import { Slot } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { Tooltip, TooltipProvider } from '../Tooltip';

export type RailSize = Extract<Size, 'sm' | 'md'>;
/** The icon of an item: a system icon name or a node. */
export type RailSlotContent = IconName | ReactElement;

/** Badges above this show as "99+". */
const BADGE_MAX = 99;

/** True inside the rail's list, where an item is a list item. In start or end it is a bare link. */
const ListContext = createContext(false);

/** True when the rail draws icons only. */
const HideLabelsContext = createContext(false);

// ------------------------------------------------------------------ Rail

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface RailProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The accessible name of the navigation landmark ("Main", "Tools"). Required. */
  label: string;
  /** Item size: sm 28px, md 32px at default density; 44 or 48 on touch platforms. Default md. */
  size?: RailSize;
  /**
   * Draws only the icons; each label stays as the accessible name and shows
   * in a Tooltip on hover and focus. Default false. Sets data-hide-labels.
   */
  hideLabels?: boolean;
  /** The block start of the column: a brand mark or a workspace switcher. */
  start?: ReactNode;
  /** The block end of the column: account, help or settings items. */
  end?: ReactNode;
  /** RailItems, the main destinations. */
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/** A `nav` landmark: a column of icon links with short labels, a start and an end. */
export function Rail({ label, size = 'md', hideLabels = false, start, end, children, ref, ...rest }: RailProps) {
  return (
    <HideLabelsContext.Provider value={hideLabels}>
      <TooltipProvider>
        <nav {...rest} ref={ref} aria-label={label} data-ds="rail" data-size={size} data-hide-labels={hideLabels ? '' : undefined}>
          {start != null && <div data-part="start">{start}</div>}
          <ul data-part="list">
            <ListContext.Provider value={true}>{children}</ListContext.Provider>
          </ul>
          {end != null && (
            <ul data-part="end">
              <ListContext.Provider value={true}>{end}</ListContext.Provider>
            </ul>
          )}
        </nav>
      </TooltipProvider>
    </HideLabelsContext.Provider>
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

/** True while the element's text is cut short (an ellipsis). Measured again whenever it resizes. */
function useTruncated(off: boolean): [(node: HTMLElement | null) => void, boolean] {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [truncated, setTruncated] = useState(false);
  useLayoutEffect(() => {
    if (!node || off) {
      setTruncated(false);
      return;
    }
    const measure = () => setTruncated(node.scrollWidth > node.clientWidth);
    measure();
    if (typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, off]);
  return [setNode, truncated];
}

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface RailItemProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title' | 'children'> {
  /** The icon: a system icon name or a node. Hidden from assistive tech. */
  icon: RailSlotContent;
  /** The short visible label and the accessible name. One word: "Home", "Files". Required. */
  label: string;
  /** A count (over 99 shows "99+", 0 draws nothing) or true for a dot, on the icon's corner. */
  badge?: number | boolean;
  /** What the badge means, read after the label ("3 new"). Default: the number, or nothing for a dot. */
  badgeLabel?: string;
  /** The current page: `aria-current="page"`, `data-active`, weight, a fill and an edge bar. Default false. */
  active?: boolean;
  /** Cannot be followed: no href, aria-disabled and data-disabled, still focusable. Default false. */
  disabled?: boolean;
  /** Renders the single child element (a router link, with no children of its own) as the item. Default false. */
  asChild?: boolean;
  /** With asChild, the router link element. */
  children?: ReactElement;
  ref?: Ref<HTMLAnchorElement>;
}

/** One destination: an icon over a short label, with an optional badge. */
export function RailItem({
  icon,
  label,
  badge,
  badgeLabel,
  active = false,
  disabled = false,
  asChild = false,
  href,
  onClick,
  onAuxClick,
  onKeyDown,
  children,
  ref,
  ...rest
}: RailItemProps) {
  const inList = useContext(ListContext);
  const hideLabels = useContext(HideLabelsContext);
  const [labelRef, truncated] = useTruncated(hideLabels);
  const dot = badge === true;
  const shown = typeof badge === 'number' && badge > 0 ? (badge > BADGE_MAX ? `${BADGE_MAX}+` : String(badge)) : undefined;

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

  const badgePart = (dot || shown !== undefined) && (
    <span data-part="item-badge" data-dot={dot ? '' : undefined}>
      {/* dir ltr: 99+ keeps its order in Arabic. */}
      {shown !== undefined && (
        <span dir="ltr" aria-hidden={badgeLabel ? true : undefined}>
          {shown}
        </span>
      )}
      {badgeLabel && <span data-visually-hidden="">{badgeLabel}</span>}
    </span>
  );

  // The badge sits in the icon box, on its corner. The label comes first in the DOM so the name reads "Inbox 3".
  const content = (
    <>
      {/* dir auto: a Latin label in an Arabic rail truncates at its own end. */}
      <span ref={labelRef} data-part="item-label" dir="auto">
        {label}
      </span>
      {badgePart && ' '}
      <span data-part="item-icon">
        <span aria-hidden="true">{typeof icon === 'string' ? <Icon name={icon} size="md" /> : icon}</span>
        {badgePart}
      </span>
    </>
  );

  let item: ReactElement;
  // A disabled item is always the plain anchor: a router child's own click handler would run first and navigate.
  if (asChild && !disabled) {
    if (!isValidElement(children)) {
      throw new Error('RailItem with asChild needs one element as its child.');
    }
    item = (
      <Slot.Root {...attrs}>
        <Slot.Slottable child={children}>{() => content}</Slot.Slottable>
      </Slot.Root>
    );
  } else {
    item = <a {...attrs}>{content}</a>;
  }

  // The label is hidden or cut short: a Tooltip shows it. Always rendered, off otherwise, so the item never remounts.
  const withHint = (
    <Tooltip content={label} side="end" disabled={!(hideLabels || truncated)}>
      <WithoutHintDescription>{item}</WithoutHintDescription>
    </Tooltip>
  );

  return inList ? <li>{withHint}</li> : withHint;
}
