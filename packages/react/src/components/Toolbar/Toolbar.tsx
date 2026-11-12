'use client';
// Toolbar: a row of controls for one context (a text editor, a canvas).
// Built on Radix Toolbar (role toolbar, one tab stop, roving focus with the
// arrow keys in the reading direction, Home and End).
//
// Sources: Figma-Killer-2 `AlignBar/` (a row of icon buttons with a trailing
// button that opens the rarer actions in a menu). GoBanana `Dashboard.tsx`
// was not reachable in this session; the look follows the dials table.
//
// The DOM:
//
//   <div data-ds="toolbar" role="toolbar" aria-label data-size data-emphasis data-orientation data-overflowing?>
//     <button data-ds="button|icon-button" data-part="item">          ToolbarButton (a system Button or IconButton)
//     <a data-ds="link" data-part="item">                             ToolbarLink (a system Link)
//     <div data-part="group" role="group" aria-label>                  ToolbarGroup or ToolbarToggleGroup
//       <button data-ds="icon-button" data-part="item" data-state="on|off" aria-pressed>   ToolbarToggleItem
//     <div data-part="separator" role="separator" aria-orientation>    ToolbarSeparator
//     <button data-ds="icon-button" data-part="more" aria-haspopup="menu">  the overflow trigger, "More tools"
//
// Items are system components carrying the toolbar's data-part (anatomy.md:
// a nested component keeps its own data-ds). Their size and emphasis come
// from the toolbar unless the item sets its own.
//
// Overflow: with overflow "menu" (the default) the toolbar measures its
// top level children (items, groups and separators) whenever it or its
// parent changes size. The ones that do not fit get data-overflowed and are
// hidden, and the "More tools" trigger appears at the end. Its menu is built
// when it opens, from the hidden children: one entry per item, with the
// item's name, icon, pressed and disabled state; choosing one clicks the
// hidden item, so its own handler (or link) runs. Hidden items cannot take
// focus, so the arrow keys skip them. overflow "wrap" lets the row wrap.
//
// A Tooltip on icon only items belongs here once Tooltip (1.6.6) is merged.
// Until then each IconButton carries its name as aria-label.
import {
  createContext,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Toolbar as RadixToolbar } from 'radix-ui';
import { isIconName, type IconName } from '@the-system/icons';
import type { Emphasis, Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { Button, type ButtonProps } from '../Button';
import { IconButton, type IconButtonProps } from '../IconButton';
import { Link, type LinkProps } from '../Link';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../DropdownMenu';

/** Item height, passed to every item: xs 24, sm 28, md 32, lg 44 (default density). */
export type ToolbarSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
/** Item emphasis, passed to every Button and IconButton that does not set its own. */
export type ToolbarEmphasis = Extract<Emphasis, 'soft' | 'outline' | 'ghost'>;
export type ToolbarOrientation = 'horizontal' | 'vertical';
/** menu: what does not fit moves into a "More tools" menu. wrap: the row wraps onto more lines. */
export type ToolbarOverflow = 'menu' | 'wrap';

interface ToolbarContextValue {
  size: ToolbarSize;
  emphasis: ToolbarEmphasis;
}

const ToolbarContext = createContext<ToolbarContextValue | null>(null);

function useToolbarContext(name: string): ToolbarContextValue {
  const ctx = use(ToolbarContext);
  if (!ctx) throw new Error(`${name} must be used inside a Toolbar.`);
  return ctx;
}

/** Sets a ref of any kind. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

// ------------------------------------------------------------------ overflow

/** One entry of the "More tools" menu, read from a hidden item. */
export interface ToolbarMenuEntry {
  kind: 'item' | 'separator';
  label: string;
  icon?: IconName;
  /** true or false for a toggle item, undefined for a plain item. */
  pressed?: boolean;
  disabled?: boolean;
  /** The hidden element; choosing the entry clicks it. */
  element?: HTMLElement;
}

/** The accessible name of an item: aria-label, else its label part, else its text. */
function nameOf(el: HTMLElement): string {
  const aria = el.getAttribute('aria-label');
  if (aria) return aria;
  const label = el.querySelector('[data-part="label"]');
  return (label?.textContent ?? el.textContent ?? '').trim();
}

function entryOf(el: HTMLElement): ToolbarMenuEntry {
  const icon = el.querySelector('[data-ds="icon"]')?.getAttribute('data-icon') ?? undefined;
  const pressedAttr = el.getAttribute('aria-pressed') ?? el.getAttribute('aria-checked');
  return {
    kind: 'item',
    label: nameOf(el),
    icon: icon && isIconName(icon) ? icon : undefined,
    pressed: pressedAttr === null ? undefined : pressedAttr === 'true',
    disabled: el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('disabled'),
    element: el,
  };
}

/**
 * The menu entries for the hidden top level children of a toolbar, in DOM
 * order. A group gives one entry per item with a separator around it; a
 * separator gives a separator. Separators never lead, trail or repeat.
 */
export function overflowEntries(segments: readonly HTMLElement[]): ToolbarMenuEntry[] {
  const raw: ToolbarMenuEntry[] = [];
  const sep = (): ToolbarMenuEntry => ({ kind: 'separator', label: '' });
  for (const seg of segments) {
    const part = seg.getAttribute('data-part');
    if (part === 'separator') raw.push(sep());
    else if (part === 'group') {
      raw.push(sep());
      for (const item of seg.querySelectorAll<HTMLElement>('[data-part="item"]')) raw.push(entryOf(item));
      raw.push(sep());
    } else if (part === 'item') raw.push(entryOf(seg));
  }
  const out: ToolbarMenuEntry[] = [];
  for (const e of raw) {
    if (e.kind === 'separator' && (out.length === 0 || out[out.length - 1]?.kind === 'separator')) continue;
    out.push(e);
  }
  while (out[out.length - 1]?.kind === 'separator') out.pop();
  return out;
}

/**
 * How many leading segments fit in `available` px, given each segment's
 * size, the gap and the size of the More trigger. All fit: the count of
 * segments. Otherwise the count that fits next to the More trigger, with
 * trailing separators dropped.
 */
export function fitCount(sizes: readonly number[], gap: number, available: number, moreSize: number, isSeparator: (i: number) => boolean): number {
  const n = sizes.length;
  const total = sizes.reduce((sum, s) => sum + s, 0) + gap * Math.max(0, n - 1);
  // Half a pixel of slack for subpixel layout.
  if (total <= available + 0.5) return n;
  let used = moreSize;
  let count = 0;
  for (let i = 0; i < n; i += 1) {
    const next = used + gap + (sizes[i] ?? 0);
    if (next > available + 0.5) break;
    used = next;
    count = i + 1;
  }
  while (count > 0 && isSeparator(count - 1)) count -= 1;
  return count;
}

const SEGMENT_PARTS = new Set(['item', 'group', 'separator']);

// ------------------------------------------------------------------ Toolbar

interface ToolbarOwnProps extends Omit<ComponentProps<typeof RadixToolbar.Root>, 'asChild' | 'dir' | 'title' | 'orientation'> {
  /** ToolbarButton, ToolbarLink, ToolbarGroup, ToolbarToggleGroup and ToolbarSeparator elements. */
  children?: ReactNode;
  /** Passed to every item that does not set its own. Default md. */
  size?: ToolbarSize;
  /** Passed to every Button and IconButton item that does not set its own. Default ghost. */
  emphasis?: ToolbarEmphasis;
  /** A row (horizontal, the default) or a column (vertical: the up and down arrows move). */
  orientation?: ToolbarOrientation;
  /** Default true: the arrow keys wrap from the last item to the first. */
  loop?: boolean;
  /** menu (default): what does not fit moves into the "More tools" menu. wrap: the row wraps. */
  overflow?: ToolbarOverflow;
  /** The name of the overflow trigger. Default "More tools" (Arabic: "أدوات أكثر"). Name the context: More text tools. */
  moreLabel?: string;
  ref?: Ref<HTMLDivElement>;
}

/** A toolbar needs a name: `aria-label`, or `aria-labelledby` pointing at a visible heading. */
export type ToolbarProps = ToolbarOwnProps &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

const moreLabels = { en: 'More tools', ar: 'أدوات أكثر' } as const;

/** A labelled row of controls with one tab stop. */
export function Toolbar({
  size = 'md',
  emphasis = 'ghost',
  orientation = 'horizontal',
  loop = true,
  overflow = 'menu',
  moreLabel,
  children,
  ref,
  ...rest
}: ToolbarProps) {
  const { lang } = useTheme();
  const ctx = useMemo<ToolbarContextValue>(() => ({ size, emphasis }), [size, emphasis]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [entries, setEntries] = useState<ToolbarMenuEntry[]>([]);
  const vertical = orientation === 'vertical';

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const segmentsOf = (root: HTMLElement): HTMLElement[] =>
    Array.from(root.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && SEGMENT_PARTS.has(el.getAttribute('data-part') ?? ''),
    );

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const segments = segmentsOf(root);
    if (overflow !== 'menu') {
      for (const el of segments) el.removeAttribute('data-overflowed');
      setOverflowing(false);
      return;
    }
    // Show everything for one synchronous read, then hide what does not fit.
    root.setAttribute('data-measuring', '');
    const style = getComputedStyle(root);
    const pad = vertical
      ? parseFloat(style.paddingBlockStart) + parseFloat(style.paddingBlockEnd)
      : parseFloat(style.paddingInlineStart) + parseFloat(style.paddingInlineEnd);
    const border = vertical
      ? parseFloat(style.borderBlockStartWidth) + parseFloat(style.borderBlockEndWidth)
      : parseFloat(style.borderInlineStartWidth) + parseFloat(style.borderInlineEndWidth);
    const box = root.getBoundingClientRect();
    const available = (vertical ? box.height : box.width) - (pad || 0) - (border || 0);
    const gap = parseFloat(vertical ? style.rowGap : style.columnGap) || 0;
    const sizeOf = (el: Element) => {
      const r = el.getBoundingClientRect();
      return vertical ? r.height : r.width;
    };
    const sizes = segments.map(sizeOf);
    const more = root.querySelector(':scope > [data-part="more"]');
    const moreSize = more ? sizeOf(more) + gap : 0;
    const count = available > 0 ? fitCount(sizes, gap, available, moreSize, (i) => segments[i]?.getAttribute('data-part') === 'separator') : segments.length;
    segments.forEach((el, i) => el.toggleAttribute('data-overflowed', i >= count));
    root.removeAttribute('data-measuring');
    setOverflowing(count < segments.length);
    // Focus never drops to the page: an item that just moved into the menu
    // hands focus to the More tools trigger once it shows.
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && segments.some((el, i) => i >= count && el.contains(focused))) {
      root.setAttribute('data-overflowing', '');
      if (more instanceof HTMLElement) more.focus();
    }
  }, [overflow, vertical]);

  // Measure when the content or the axes change, and whenever the toolbar
  // or its parent changes size (the observer below).
  useLayoutEffect(() => {
    measure();
  }, [measure, children, size, emphasis]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || overflow !== 'menu' || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(root);
    if (root.parentElement) observer.observe(root.parentElement);
    return () => observer.disconnect();
  }, [measure, overflow]);

  const onMenuOpen = useCallback((open: boolean) => {
    const root = rootRef.current;
    if (!open || !root) return;
    setEntries(overflowEntries(segmentsOf(root).filter((el) => el.hasAttribute('data-overflowed'))));
  }, []);

  // In a vertical toolbar ArrowUp and ArrowDown move between items, also on
  // the More trigger, where the menu button would otherwise open on them.
  // Cancelling the key stops both the menu and the roving focus, so focus
  // moves here. Enter and Space still open the menu.
  const onMoreKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const root = rootRef.current;
      if (!root) return;
      event.preventDefault();
      // Hidden items (moved into the menu) are not stops.
      const stops = Array.from(root.querySelectorAll<HTMLElement>('[data-part="item"], :scope > [data-part="more"]')).filter(
        (el) => !el.closest('[data-overflowed]'),
      );
      const at = stops.indexOf(event.currentTarget);
      if (at < 0) return;
      const next = event.key === 'ArrowDown' ? at + 1 : at - 1;
      const target = loop ? stops[(next + stops.length) % stops.length] : stops[next];
      target?.focus();
    },
    [loop],
  );

  const label = moreLabel ?? moreLabels[lang === 'ar' ? 'ar' : 'en'];

  return (
    <RadixToolbar.Root
      {...rest}
      ref={setRef}
      orientation={orientation}
      loop={loop}
      data-ds="toolbar"
      data-size={size}
      data-emphasis={emphasis}
      data-wrap={overflow === 'wrap' ? '' : undefined}
      data-overflowing={overflowing ? '' : undefined}
    >
      <ToolbarContext value={ctx}>
        {children}
        {overflow === 'menu' && (
          <DropdownMenu onOpenChange={onMenuOpen}>
            <DropdownMenuTrigger onKeyDown={vertical ? onMoreKeyDown : undefined}>
              <RadixToolbar.Button asChild>
                <IconButton data-part="more" icon="more" label={label} size={size} emphasis={emphasis} />
              </RadixToolbar.Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={vertical ? 'inline-end' : 'block-end'} align="end">
              {entries.map((entry, i) =>
                entry.kind === 'separator' ? (
                  <DropdownMenuSeparator key={`s${i}`} />
                ) : entry.pressed === undefined ? (
                  <DropdownMenuItem key={`i${i}`} start={entry.icon} disabled={entry.disabled} onSelect={() => entry.element?.click()}>
                    {entry.label}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuCheckboxItem
                    key={`i${i}`}
                    start={entry.icon}
                    checked={entry.pressed}
                    disabled={entry.disabled}
                    onSelect={() => entry.element?.click()}
                  >
                    {entry.label}
                  </DropdownMenuCheckboxItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </ToolbarContext>
    </RadixToolbar.Root>
  );
}

// ------------------------------------------------------------------ items

/**
 * A disabled item. Button and Link swallow every key while their own
 * `disabled` is set, and the arrow keys of the roving focus would stop on
 * the item. So the item is never given `disabled`: it gets aria-disabled
 * (drawn by Toolbar.css) and its click is cancelled here. A cancelled click
 * also stops a Radix toggle, which checks defaultPrevented.
 */
function inertProps<E extends { preventDefault: () => void }>(disabled: boolean | undefined, onClick: ((event: E) => void) | undefined) {
  if (!disabled) return { onClick };
  return {
    'aria-disabled': true as const,
    onClick: (event: E) => {
      event.preventDefault();
    },
  };
}

type ToolbarTextButtonProps = Omit<ButtonProps, 'asChild'> & { icon?: undefined };
type ToolbarIconButtonProps = Omit<IconButtonProps, 'asChild'>;

/**
 * A command in the toolbar. With `icon` it is an IconButton (and `label`, its
 * name, is required); without, a Button with a visible label. It takes the
 * toolbar's size and emphasis unless it sets its own. `disabled` keeps it
 * focusable with aria-disabled, so the arrow keys still reach it.
 */
export type ToolbarButtonProps = ToolbarTextButtonProps | ToolbarIconButtonProps;

export function ToolbarButton({ disabled, onClick, ...props }: ToolbarButtonProps) {
  const ctx = useToolbarContext('ToolbarButton');
  const size = props.size ?? ctx.size;
  const emphasis = props.emphasis ?? ctx.emphasis;
  const inert = inertProps(disabled, onClick);
  return (
    <RadixToolbar.Button asChild>
      {props.icon !== undefined ? (
        <IconButton {...(props as ToolbarIconButtonProps)} {...inert} size={size} emphasis={emphasis as ToolbarIconButtonProps['emphasis']} data-part="item" />
      ) : (
        <Button {...(props as ToolbarTextButtonProps)} {...inert} size={size} emphasis={emphasis} data-part="item" />
      )}
    </RadixToolbar.Button>
  );
}

export type ToolbarLinkProps = Omit<LinkProps, 'asChild' | 'standalone'>;

/** A link in the toolbar: a standalone system Link (a 24px target), in the roving focus. */
export function ToolbarLink({ size, disabled, onClick, href, ...rest }: ToolbarLinkProps) {
  const ctx = useToolbarContext('ToolbarLink');
  // Link has no xs: the toolbar's xs gives the sm link.
  const linkSize = size ?? (ctx.size === 'xs' ? 'sm' : ctx.size);
  const inert = inertProps(disabled, onClick);
  // A disabled link loses its href (nothing can open it) and keeps role link.
  return (
    <RadixToolbar.Link asChild>
      <Link {...rest} {...inert} href={disabled ? undefined : href} role={disabled ? 'link' : rest.role} size={linkSize} standalone data-part="item" />
    </RadixToolbar.Link>
  );
}

interface ToolbarGroupOwnProps extends Omit<ComponentProps<'div'>, 'title' | 'role'> {
  /** ToolbarButton and ToolbarLink elements that belong together. */
  children?: ReactNode;
}

/** A group needs a name: `aria-label`, or `aria-labelledby`. */
export type ToolbarGroupProps = ToolbarGroupOwnProps &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

/** Related items that move into the overflow menu together. role group with a name. */
export function ToolbarGroup(props: ToolbarGroupProps) {
  useToolbarContext('ToolbarGroup');
  return <div {...props} role="group" data-part="group" />;
}

type RadixToggleGroupProps = ComponentProps<typeof RadixToolbar.ToggleGroup>;

/**
 * Items that are on or off. `type="multiple"`: each item toggles on its own
 * (aria-pressed): bold, italic. `type="single"`: one item at most is on
 * (radio semantics): text alignment.
 */
export type ToolbarToggleGroupProps = Omit<RadixToggleGroupProps, 'asChild' | 'title' | 'dir' | 'rovingFocus' | 'disabled'> &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

export function ToolbarToggleGroup(props: ToolbarToggleGroupProps) {
  useToolbarContext('ToolbarToggleGroup');
  return <RadixToolbar.ToggleGroup {...(props as RadixToggleGroupProps)} data-part="group" />;
}

export type ToolbarToggleItemProps = (Omit<ToolbarTextButtonProps, 'value'> | Omit<ToolbarIconButtonProps, 'value'>) & {
  /** The value this item adds to the group's value when on. */
  value: string;
};

/**
 * One item of a ToolbarToggleGroup: an IconButton with `icon` and `label`,
 * or a Button with a visible label. data-state on or off and aria-pressed
 * (or aria-checked in a single group) carry the state; the CSS draws the on
 * state as a filled item, so it never rests on color alone in forced colors
 * (a Highlight frame).
 */
export function ToolbarToggleItem({ value, disabled, onClick, ...props }: ToolbarToggleItemProps) {
  const ctx = useToolbarContext('ToolbarToggleItem');
  const size = props.size ?? ctx.size;
  const emphasis = props.emphasis ?? ctx.emphasis;
  // Never Radix's disabled (it would drop the tab stop): see inertProps.
  const inert = inertProps(disabled, onClick);
  return (
    <RadixToolbar.ToggleItem value={value} asChild>
      {props.icon !== undefined ? (
        <IconButton {...(props as ToolbarIconButtonProps)} {...inert} size={size} emphasis={emphasis as ToolbarIconButtonProps['emphasis']} data-part="item" />
      ) : (
        <Button {...(props as ToolbarTextButtonProps)} {...inert} size={size} emphasis={emphasis} data-part="item" />
      )}
    </RadixToolbar.ToggleItem>
  );
}

export type ToolbarSeparatorProps = Omit<ComponentProps<typeof RadixToolbar.Separator>, 'asChild' | 'title'>;

/** A line between groups of items, across the toolbar's direction. */
export function ToolbarSeparator(props: ToolbarSeparatorProps) {
  useToolbarContext('ToolbarSeparator');
  return <RadixToolbar.Separator {...props} data-part="separator" />;
}
