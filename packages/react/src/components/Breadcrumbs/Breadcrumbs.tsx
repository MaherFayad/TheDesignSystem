'use client';
// Breadcrumbs: the path from the top of a site to the current page. A `nav`
// with a label around an ordered list; every step but the last is a system
// Link, the last is the current page with aria-current="page".
//
// No source: designed from the dials table (PLAN.md 3.7) and the nearest
// component, Link.
//
// The DOM:
//
//   <nav data-ds="breadcrumbs" aria-label="Breadcrumbs" data-size>
//     <ol data-part="list">
//       <li data-part="item">
//         <a data-ds="link" data-part="link" href>          a system Link
//         <span data-part="separator" aria-hidden="true">   chevron-forward, mirrored in RTL
//       <li data-part="item">
//         <button data-ds="icon-button" data-part="overflow" aria-haspopup="menu">
//                                                         the DropdownMenu trigger for the collapsed middle steps
//         <span data-part="separator">
//       <li data-part="item">
//         <span data-part="current" aria-current="page">    the current page, not a link
//
// Decisions:
// - The overflow part is the menu's trigger, an IconButton. The DropdownMenu
//   root renders no element of its own, so the trigger carries the part.
// - The separator sits inside the item it follows, so the list has only li
//   children, and it is hidden from assistive tech.
// - A long step truncates with an ellipsis. Its full text stays in the DOM,
//   so it is the accessible name, and hover or keyboard focus shows it whole.
//   There is no native title: Tooltip owns hints.
// - Steps in the overflow menu are menu items: choosing one calls onNavigate,
//   or, without it, sends the browser to the href.
import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { Icon } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../DropdownMenu';
import { IconButton } from '../IconButton';
import { Link } from '../Link';

export type BreadcrumbsSize = Extract<Size, 'sm' | 'md'>;

/** One step of the path. */
export interface BreadcrumbItem {
  /** The page name, as its heading says it. */
  label: string;
  /** Where the step goes. The last item, the current page, needs none. */
  href?: string;
  /**
   * A router link to render as the step, through Link asChild: an element
   * with its own href and the label as its child. Overrides href.
   */
  link?: ReactElement;
}

const words = {
  en: { label: 'Breadcrumbs', overflow: 'Show hidden pages' },
  ar: { label: 'مسار التنقل', overflow: 'الصفحات المخفية' },
} as const;

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface BreadcrumbsProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  /** The path, from the top level to the current page. The last item is the current page. */
  items: readonly BreadcrumbItem[];
  /** Type size: sm is font.size.xs, md font.size.s (one step up in Arabic). Default md. */
  size?: BreadcrumbsSize;
  /**
   * The most steps to show. With more, the first step, an overflow menu and
   * the last maxItems minus 2 steps show; the rest move into the menu.
   * Default none: every step shows and the list wraps.
   */
  maxItems?: number;
  /** The accessible name of the nav. Default "Breadcrumbs", in Arabic "مسار التنقل". */
  label?: string;
  /** The accessible name of the overflow button. Default "Show hidden pages", in Arabic "الصفحات المخفية". */
  overflowLabel?: string;
  /** Called when a step is chosen from the overflow menu. Default: the browser goes to its href. */
  onNavigate?: (item: BreadcrumbItem, index: number) => void;
  ref?: Ref<HTMLElement>;
}

/** The visible plan: steps by index, with an overflow marker where steps are collapsed. */
export function collapseItems(count: number, maxItems?: number): (number | 'overflow')[] {
  const all = Array.from({ length: count }, (_, i) => i);
  if (maxItems === undefined || count <= maxItems) return all;
  const tail = Math.max(1, maxItems - 2);
  if (count <= tail + 2) return all;
  return [0, 'overflow', ...all.slice(count - tail)];
}

function Separator() {
  return (
    <span data-part="separator" aria-hidden="true">
      <Icon name="chevron-forward" size="sm" />
    </span>
  );
}

/** The path to the current page, as a labelled nav with an ordered list. */
export function Breadcrumbs({
  items,
  size = 'md',
  maxItems,
  label,
  overflowLabel,
  onNavigate,
  ref,
  ...rest
}: BreadcrumbsProps) {
  const { lang } = useTheme();
  const t = words[lang === 'ar' ? 'ar' : 'en'];
  const plan = collapseItems(items.length, maxItems);
  const shown = new Set(plan.filter((p): p is number => p !== 'overflow'));
  const hidden = items.map((item, index) => ({ item, index })).filter(({ index }) => !shown.has(index));
  const last = items.length - 1;

  return (
    <nav {...rest} ref={ref} data-ds="breadcrumbs" data-size={size} aria-label={label ?? t.label}>
      <ol data-part="list">
        {plan.map((entry) => {
          if (entry === 'overflow') {
            return (
              <li key="overflow" data-part="item">
                <DropdownMenu size={size === 'sm' ? 'sm' : 'md'}>
                  <DropdownMenuTrigger>
                    <IconButton data-part="overflow" icon="more" size={size === 'sm' ? 'xs' : 'sm'} label={overflowLabel ?? t.overflow} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {hidden.map(({ item, index }) => (
                      <DropdownMenuItem
                        key={index}
                        textValue={item.label}
                        onSelect={() => {
                          if (onNavigate) onNavigate(item, index);
                          else if (item.href) window.location.assign(item.href);
                        }}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Separator />
              </li>
            );
          }
          const item = items[entry]!;
          if (entry === last) {
            return (
              <li key={entry} data-part="item">
                <span data-part="current" aria-current="page">
                  {item.label}
                </span>
              </li>
            );
          }
          return (
            <li key={entry} data-part="item">
              {item.link ? (
                <Link asChild data-part="link">
                  {item.link}
                </Link>
              ) : (
                <Link data-part="link" href={item.href}>
                  {item.label}
                </Link>
              )}
              <Separator />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
