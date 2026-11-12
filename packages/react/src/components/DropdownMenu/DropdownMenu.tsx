'use client';
// DropdownMenu: a menu of actions or options opened from a trigger. Built on
// Radix DropdownMenu (roles menu, menuitem, menuitemcheckbox, menuitemradio;
// roving focus, typeahead, Home and End, submenus that open toward the
// inline end, Escape and focus back to the trigger, collision handling).
//
// Sources: GoBanana `.st-menu` in studio-components.css (the Studio surface:
// surface-3, the card radius, the menu shadow, 28px rows, the check that
// carries the selected state, the separator on surface-2, the 0.97 scale
// in), GoBanana desktop `MenuBarMenu.tsx` and `.mb-menu` in desktop.css (the
// Desk glass menu: hairline, strong blur, the yellow highlight row, hints at
// the end), Figma-Killer-2 `ContextMenu/` (the concentric item radius, the
// trailing check, the submenu chevron, the scrollable menu capped to the
// viewport).
//
// The DOM:
//
//   <button data-ds="button" aria-haspopup="menu">      the trigger, a system Button (asChild)
//   <body>
//     <div data-ds="theme" data-menu-layer>              the portal Theme, display: contents
//       <div data-radix-popper-content-wrapper>          Radix positioning (fixed, transform)
//         <div data-ds="dropdown-menu" role="menu" data-size data-state data-side data-align>
//           <div data-part="label">                      a heading for the next items
//           <div data-part="item" role="menuitem" data-tone? data-highlighted? data-disabled?>
//             <span data-part="start">                   leading icon or node
//             <span data-part="text">                    the visible label
//             <span data-part="shortcut">                a key hint, plain text
//             <span data-part="end">                     trailing icon or node
//           <div data-part="checkbox-item" role="menuitemcheckbox" data-state="checked|unchecked|indeterminate">
//             <span data-part="indicator">               the check (or minus), never color alone
//           <div data-part="group" role="group">         a DropdownMenuGroup or a RadioGroup
//             <div data-part="radio-item" role="menuitemradio" data-state>
//           <div data-part="separator" role="separator">
//           <div data-part="sub-trigger" aria-haspopup="menu" data-state="open|closed">
//             ... <span data-part="end"><svg chevron-forward, mirrored in RTL>
//     <div data-ds="theme" data-menu-layer>              a second layer for each open submenu
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="dropdown-menu" data-part="sub-content" role="menu" data-size data-state>
//
// The themed portal (the Toaster and Dialog pattern): the content is
// portaled to <body>, outside every Theme element, so it starts with a Theme
// that copies every axis of the Theme the menu is rendered in. A submenu has
// its own layer for the same reason, and because a parent with a transform
// (the enter motion) or a backdrop filter (Desk glass) would become the
// containing block of a fixed child and clip it. The layer mounts on open
// and unmounts once the content has played its exit (the content's ref
// becomes null), so a closed menu leaves nothing in <body>.
//
// A submenu is its own root (data-ds="dropdown-menu") carrying the parent's
// part name sub-content (anatomy.md: a nested component may carry both). Its
// items then belong to it, and the CSS styles both menus with one selector.
//
// Motion is CSS only (DropdownMenu.css, pattern "menu-scale"): data-state
// open plays the enter from the transform origin Radix computes on the
// trigger side, closed plays the exit, and Radix keeps the content mounted
// until the animation ends. Under reduced motion the animations are none and
// every duration token is 0ms, so Radix unmounts at once and nothing waits
// for an animationend.
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { DropdownMenu as RadixMenu } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { type ButtonSlotContent } from '../Button/ButtonBase';
import { useControllable } from '../Window/useControllable';
import {
  ITEM_SELECTOR,
  IndicatorGlyph,
  ItemContent,
  TRIGGER_GAP,
  VIEWPORT_GUTTER,
  assignRef,
  physicalSide,
  textOf,
  useMenuLayer,
  type MenuSide,
} from './menuShared';

/** Menu sizes: sm rows are 24px, md rows follow menu.item.height (28px at default density). */
export type DropdownMenuSize = Extract<Size, 'sm' | 'md'>;
/** Item tones: danger marks a destructive action. */
export type DropdownMenuItemTone = Extract<Tone, 'neutral' | 'danger'>;
/** Leading or trailing content of an item: a system icon name or a node. */
export type DropdownMenuSlotContent = ButtonSlotContent;
/** Where the menu opens, in logical words: block-end is below the trigger, inline-end is after it in reading order. */
export type DropdownMenuSide = MenuSide;
/** How the menu lines up with the trigger along that side. start follows the reading direction. */
export type DropdownMenuAlign = 'start' | 'center' | 'end';

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  size: DropdownMenuSize;
  /** Set by ArrowUp on the trigger: focus the last item once the menu is open. */
  focusLast: RefObject<boolean>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(name: string): MenuContextValue {
  const ctx = use(MenuContext);
  if (!ctx) throw new Error(`${name} must be used inside a DropdownMenu.`);
  return ctx;
}

interface SubContextValue {
  open: boolean;
}

const SubContext = createContext<SubContextValue | null>(null);

// ------------------------------------------------------------------ DropdownMenu

export interface DropdownMenuProps {
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called on open and on close (an item chosen, Escape, a click outside). */
  onOpenChange?: (open: boolean) => void;
  /**
   * true: while open, the rest of the page is hidden from assistive tech
   * (aria-hidden) and takes no pointer input. Default false: the menu button
   * pattern needs neither (Tab never leaves the open menu, and a click or
   * focus outside closes it), and axe flags focusable content under
   * aria-hidden when no aria-modal dialog is open.
   */
  modal?: boolean;
  /** Row height and type size: sm 24px, md menu.item.height (28px at default density). Default md. */
  size?: DropdownMenuSize;
  children?: ReactNode;
}

/** The root: state and the size axis. Renders no element of its own. */
export function DropdownMenu({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  modal = false,
  size = 'md',
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const focusLast = useRef(false);
  const value = useMemo<MenuContextValue>(() => ({ open, setOpen, size, focusLast }), [open, setOpen, size]);
  return (
    <RadixMenu.Root open={open} onOpenChange={setOpen} modal={modal}>
      <MenuContext value={value}>{children}</MenuContext>
    </RadixMenu.Root>
  );
}

// ------------------------------------------------------------------ DropdownMenuTrigger

export interface DropdownMenuTriggerProps extends Omit<ComponentProps<typeof RadixMenu.Trigger>, 'asChild' | 'children'> {
  /** One element, a system Button or IconButton, rendered as the trigger. */
  children: ReactElement;
}

/**
 * Opens the menu. Renders its child, a system Button or IconButton, with
 * aria-haspopup, aria-expanded and data-state. Enter, Space and ArrowDown
 * open it with focus on the first item; ArrowUp opens it with focus on the
 * last item. Focus returns to it on close.
 */
export function DropdownMenuTrigger({ children, onKeyDown, ...rest }: DropdownMenuTriggerProps) {
  const ctx = useMenuContext('DropdownMenuTrigger');
  return (
    <RadixMenu.Trigger
      {...rest}
      asChild
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== 'ArrowUp' || ctx.open) return;
        if (event.currentTarget.getAttribute('aria-disabled') === 'true' || rest.disabled) return;
        event.preventDefault();
        ctx.focusLast.current = true;
        ctx.setOpen(true);
      }}
    >
      {children}
    </RadixMenu.Trigger>
  );
}

// ------------------------------------------------------------------ DropdownMenuContent

export interface DropdownMenuContentProps
  extends Omit<ComponentProps<typeof RadixMenu.Content>, 'asChild' | 'forceMount' | 'side' | 'align'> {
  /** Where the menu opens. Default block-end (below the trigger). Radix flips it when there is no room. */
  side?: DropdownMenuSide;
  /** How it lines up with the trigger. Default start (the trigger's inline start edge). */
  align?: DropdownMenuAlign;
  /** Gap to the trigger in px. Default 4. */
  sideOffset?: number;
  /** Space kept from the viewport edge in px. Default 8. */
  collisionPadding?: ComponentProps<typeof RadixMenu.Content>['collisionPadding'];
  /** Labels, items, groups, separators and submenus. */
  children?: ReactNode;
}

/**
 * The menu: the root `data-ds="dropdown-menu"`, role menu, named by the
 * trigger. Portaled into a Theme layer. It never grows past the viewport:
 * a long menu scrolls inside. Props spread onto the root.
 */
export function DropdownMenuContent({
  side = 'block-end',
  align = 'start',
  sideOffset = TRIGGER_GAP,
  collisionPadding = VIEWPORT_GUTTER,
  ref,
  children,
  ...rest
}: DropdownMenuContentProps) {
  const ctx = useMenuContext('DropdownMenuContent');
  const layer = useMenuLayer(ctx.open);
  const { onContent } = layer;
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      assignRef(ref, node);
      onContent(node);
      if (node && ctx.focusLast.current) {
        ctx.focusLast.current = false;
        // After Radix has moved focus into the menu (its mount effect), go to the last item.
        requestAnimationFrame(() => {
          const items = Array.from(node.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
            (el) => !el.hasAttribute('data-disabled') && el.closest('[data-ds="dropdown-menu"]') === node,
          );
          items.at(-1)?.focus();
        });
      }
    },
    [ref, onContent, ctx.focusLast],
  );

  return layer.render(
    <RadixMenu.Content
      {...rest}
      ref={setRef}
      side={physicalSide(side, layer.dir)}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      data-ds="dropdown-menu"
      data-size={ctx.size}
    >
      {children}
    </RadixMenu.Content>,
  );
}

// ------------------------------------------------------------------ items

interface ItemCommonProps {
  /** Leading content: a system icon name or a node. Decorative: the text names the item. */
  start?: DropdownMenuSlotContent;
  /** Trailing content: a system icon name or a node. Decorative. */
  end?: DropdownMenuSlotContent;
  /** A key hint shown at the inline end, plain text (for example "Ctrl+D"). It does not bind the key. */
  shortcut?: string;
}

export interface DropdownMenuItemProps
  extends ItemCommonProps,
    Omit<ComponentProps<typeof RadixMenu.Item>, 'asChild'> {
  /** danger: a destructive action, drawn in the danger text color. Default neutral. */
  tone?: DropdownMenuItemTone;
  /** The label. English: a verb plus a noun. Arabic: a noun form. */
  children?: ReactNode;
}

/**
 * An action. onSelect runs on click, Enter and Space, then the menu closes
 * (call event.preventDefault() in onSelect to keep it open). `disabled`
 * keeps it focusable with aria-disabled and skips it on select.
 */
export function DropdownMenuItem({ start, end, shortcut, tone = 'neutral', textValue, children, ...rest }: DropdownMenuItemProps) {
  return (
    <RadixMenu.Item
      {...rest}
      textValue={textValue ?? textOf(children)}
      data-part="item"
      data-tone={tone === 'danger' ? 'danger' : undefined}
    >
      <ItemContent start={start} end={end} shortcut={shortcut}>
        {children}
      </ItemContent>
    </RadixMenu.Item>
  );
}

export interface DropdownMenuCheckboxItemProps
  extends ItemCommonProps,
    Omit<ComponentProps<typeof RadixMenu.CheckboxItem>, 'asChild'> {
  children?: ReactNode;
}

/**
 * An option that is on or off (role menuitemcheckbox). The check icon shows
 * the state, never color alone; `checked="indeterminate"` shows a minus.
 * Choosing it closes the menu unless onSelect calls event.preventDefault().
 */
export function DropdownMenuCheckboxItem({ start, end, shortcut, textValue, children, ...rest }: DropdownMenuCheckboxItemProps) {
  return (
    <RadixMenu.CheckboxItem {...rest} textValue={textValue ?? textOf(children)} data-part="checkbox-item">
      <ItemContent
        start={start}
        end={end}
        shortcut={shortcut}
        indicator={
          <span data-part="indicator" aria-hidden="true">
            <RadixMenu.ItemIndicator>
              <IndicatorGlyph checked={rest.checked} />
            </RadixMenu.ItemIndicator>
          </span>
        }
      >
        {children}
      </ItemContent>
    </RadixMenu.CheckboxItem>
  );
}

export interface DropdownMenuRadioGroupProps extends Omit<ComponentProps<typeof RadixMenu.RadioGroup>, 'asChild'> {
  /** DropdownMenuRadioItem elements, with a DropdownMenuLabel first when the choice needs a name. */
  children?: ReactNode;
}

/** A set of radio items where one is chosen (role group). Name it with aria-label or a DropdownMenuLabel. */
export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
  return <RadixMenu.RadioGroup {...props} data-part="group" />;
}

export interface DropdownMenuRadioItemProps
  extends ItemCommonProps,
    Omit<ComponentProps<typeof RadixMenu.RadioItem>, 'asChild'> {
  children?: ReactNode;
}

/** One choice in a DropdownMenuRadioGroup (role menuitemradio). The chosen one carries the check icon. */
export function DropdownMenuRadioItem({ start, end, shortcut, textValue, children, ...rest }: DropdownMenuRadioItemProps) {
  return (
    <RadixMenu.RadioItem {...rest} textValue={textValue ?? textOf(children)} data-part="radio-item">
      <ItemContent
        start={start}
        end={end}
        shortcut={shortcut}
        indicator={
          <span data-part="indicator" aria-hidden="true">
            <RadixMenu.ItemIndicator>
              <Icon name="check" size="md" />
            </RadixMenu.ItemIndicator>
          </span>
        }
      >
        {children}
      </ItemContent>
    </RadixMenu.RadioItem>
  );
}

// ------------------------------------------------------------------ label, group, separator

export type DropdownMenuLabelProps = Omit<ComponentProps<typeof RadixMenu.Label>, 'asChild'>;

/** A short heading over the items that follow. Not focusable, skipped by the arrow keys. */
export function DropdownMenuLabel(props: DropdownMenuLabelProps) {
  return <RadixMenu.Label {...props} data-part="label" />;
}

export type DropdownMenuGroupProps = Omit<ComponentProps<typeof RadixMenu.Group>, 'asChild'>;

/** Groups related items (role group). */
export function DropdownMenuGroup(props: DropdownMenuGroupProps) {
  return <RadixMenu.Group {...props} data-part="group" />;
}

export type DropdownMenuSeparatorProps = Omit<ComponentProps<typeof RadixMenu.Separator>, 'asChild'>;

/** A line between groups of items (role separator). */
export function DropdownMenuSeparator(props: DropdownMenuSeparatorProps) {
  return <RadixMenu.Separator {...props} data-part="separator" />;
}

// ------------------------------------------------------------------ submenus

export interface DropdownMenuSubProps {
  /** Controlled open state of the submenu. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A DropdownMenuSubTrigger, then a DropdownMenuSubContent. */
  children?: ReactNode;
}

/** A submenu: a trigger item and a nested menu. */
export function DropdownMenuSub({ open: openProp, defaultOpen = false, onOpenChange, children }: DropdownMenuSubProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const value = useMemo<SubContextValue>(() => ({ open }), [open]);
  return (
    <RadixMenu.Sub open={open} onOpenChange={setOpen}>
      <SubContext value={value}>{children}</SubContext>
    </RadixMenu.Sub>
  );
}

export interface DropdownMenuSubTriggerProps extends Omit<ComponentProps<typeof RadixMenu.SubTrigger>, 'asChild'> {
  /** Leading content: a system icon name or a node. */
  start?: DropdownMenuSlotContent;
  /** The label of the submenu. English: a noun or a verb plus a noun ("Share board"). */
  children?: ReactNode;
}

/**
 * The item that opens a submenu. ArrowRight opens it (ArrowLeft in RTL),
 * as do Enter, Space and the pointer. The chevron at the inline end points
 * toward the submenu and mirrors in RTL.
 */
export function DropdownMenuSubTrigger({ start, textValue, children, ...rest }: DropdownMenuSubTriggerProps) {
  return (
    <RadixMenu.SubTrigger {...rest} textValue={textValue ?? textOf(children)} data-part="sub-trigger">
      <ItemContent start={start} end="chevron-forward">
        {children}
      </ItemContent>
    </RadixMenu.SubTrigger>
  );
}

export interface DropdownMenuSubContentProps extends Omit<ComponentProps<typeof RadixMenu.SubContent>, 'asChild' | 'forceMount'> {
  children?: ReactNode;
}

/**
 * The nested menu. A root of its own (`data-ds="dropdown-menu"`) carrying
 * the part name sub-content, in its own Theme layer. It opens toward the
 * inline end of its trigger and flips when there is no room.
 */
export function DropdownMenuSubContent({
  ref,
  sideOffset = 0,
  alignOffset,
  collisionPadding = VIEWPORT_GUTTER,
  children,
  ...rest
}: DropdownMenuSubContentProps) {
  const ctx = useMenuContext('DropdownMenuSubContent');
  const sub = use(SubContext);
  const layer = useMenuLayer(sub?.open ?? false);
  const { onContent } = layer;
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      assignRef(ref, node);
      onContent(node);
    },
    [ref, onContent],
  );
  if (!sub) throw new Error('DropdownMenuSubContent must be used inside a DropdownMenuSub.');
  return layer.render(
    <RadixMenu.SubContent
      {...rest}
      ref={setRef}
      sideOffset={sideOffset}
      // Lines the first item of the submenu up with its trigger: the menu padding plus the border.
      alignOffset={alignOffset ?? -(TRIGGER_GAP + 1)}
      collisionPadding={collisionPadding}
      data-ds="dropdown-menu"
      data-part="sub-content"
      data-size={ctx.size}
    >
      {children}
    </RadixMenu.SubContent>,
  );
}
