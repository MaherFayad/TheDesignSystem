'use client';
// ContextMenu: the actions of an item, opened on right click, on a long
// press (touch and pen), or from the keyboard with Shift+F10 or the Menu key
// on the focused item. Built on Radix ContextMenu (roles menu, menuitem,
// menuitemcheckbox, menuitemradio; roving focus, typeahead, Home and End,
// submenus toward the inline end, Escape, collision handling).
//
// The look is the DropdownMenu surface: the root is data-ds="context-menu"
// with the same parts, and DropdownMenu.css styles both roots with one
// selector list. Source: Figma-Killer-2 `ContextMenu/` (the menu opens at the
// pointer, keeps to the viewport, scrolls when long, plays a short exit).
//
// The DOM:
//
//   <div data-state="closed|open">                      the trigger: the child element you pass (asChild)
//   <body>
//     <div data-ds="theme" data-menu-layer>              the portal Theme, display: contents
//       <div data-radix-popper-content-wrapper>          Radix positioning
//         <div data-ds="context-menu" role="menu" data-size data-state data-side data-align>
//           ... the DropdownMenu parts: label, item, checkbox-item, radio-item,
//               indicator, start, text, shortcut, end, group, separator, sub-trigger
//     <div data-ds="theme" data-menu-layer>              one layer per open submenu
//       <div data-ds="context-menu" data-part="sub-content" role="menu" data-size data-state>
//
// Keyboard: Radix opens a context menu only on the contextmenu event. Some
// browsers send that event for Shift+F10 and the Menu key, some do not, and
// none anchor it to the focused item. The trigger handles both keys itself:
// it stops the browser default and sends one contextmenu event from the
// focused element, at its inline start and block end corner, so the menu
// opens under the item in every browser and in both directions.
//
// Motion is CSS only (pattern "menu-scale"), as in DropdownMenu: nothing
// waits for an animationend.
import {
  createContext,
  use,
  useCallback,
  useMemo,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type SyntheticEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ContextMenu as RadixMenu } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { type ButtonSlotContent } from '../Button/ButtonBase';
import { useControllable } from '../Window/useControllable';
import {
  IndicatorGlyph,
  ItemContent,
  TRIGGER_GAP,
  VIEWPORT_GUTTER,
  assignRef,
  physicalSide,
  textOf,
  useMenuLayer,
} from '../DropdownMenu/menuShared';

/** Menu sizes: sm rows are 24px, md rows follow menu.item.height (28px at default density). */
export type ContextMenuSize = Extract<Size, 'sm' | 'md'>;
/** Item tones: danger marks a destructive action. */
export type ContextMenuItemTone = Extract<Tone, 'neutral' | 'danger'>;
/** Leading or trailing content of an item: a system icon name or a node. */
export type ContextMenuSlotContent = ButtonSlotContent;

/** Gap between the pointer and the menu, in CSS px: the menu never sits under the pointer. */
const POINTER_GAP = 2;

interface MenuContextValue {
  open: boolean;
  size: ContextMenuSize;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(name: string): MenuContextValue {
  const ctx = use(MenuContext);
  if (!ctx) throw new Error(`${name} must be used inside a ContextMenu.`);
  return ctx;
}

const SubContext = createContext<{ open: boolean } | null>(null);

// ------------------------------------------------------------------ ContextMenu

export interface ContextMenuProps {
  /** Called with true when the menu opens and false when it closes (an item chosen, Escape, a click outside). */
  onOpenChange?: (open: boolean) => void;
  /**
   * true: while open, the rest of the page is hidden from assistive tech and
   * takes no pointer input. Default false, as DropdownMenu: Tab never leaves
   * the open menu and a click outside closes it.
   */
  modal?: boolean;
  /** Row height and type size: sm 24px, md menu.item.height (28px at default density). Default md. */
  size?: ContextMenuSize;
  /** A ContextMenuTrigger, then a ContextMenuContent. */
  children?: ReactNode;
}

/**
 * The root: state and the size axis. Renders no element of its own. The menu
 * opens where the pointer is, so it has no controlled open prop: a menu
 * opened by code would have no place to open.
 */
export function ContextMenu({ onOpenChange, modal = false, size = 'md', children }: ContextMenuProps) {
  const [open, setOpen] = useControllable<boolean>(undefined, false, onOpenChange);
  const value = useMemo<MenuContextValue>(() => ({ open, size }), [open, size]);
  return (
    <RadixMenu.Root open={open} onOpenChange={setOpen} modal={modal}>
      <MenuContext value={value}>{children}</MenuContext>
    </RadixMenu.Root>
  );
}

// ------------------------------------------------------------------ ContextMenuTrigger

export interface ContextMenuTriggerProps extends Omit<ComponentProps<typeof RadixMenu.Trigger>, 'asChild' | 'children'> {
  /**
   * One element, the item the menu acts on (a card, a row, a canvas object),
   * rendered as the trigger. It, or an element inside it, must take focus so
   * Shift+F10 and the Menu key can reach the menu.
   */
  children: ReactElement;
  /** true: right click, long press and the keys open nothing, and the browser menu shows. Default false. */
  disabled?: boolean;
}

/** True for the keys that open a context menu from the keyboard. */
function isMenuKey(event: KeyboardEvent): boolean {
  return event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey);
}

/**
 * True when the event reached the trigger through React from a portal (an
 * open DropdownMenu inside the item), not from the item in the page.
 */
function fromPortal(event: SyntheticEvent): boolean {
  return !(event.currentTarget as Node).contains(event.target as Node);
}

/**
 * The area that opens the menu: right click, a long press, or Shift+F10 and
 * the Menu key on the focused element inside it. Renders its child with
 * data-state open or closed.
 */
export function ContextMenuTrigger({
  children,
  onKeyDown,
  onContextMenu,
  onPointerDown,
  disabled = false,
  ...rest
}: ContextMenuTriggerProps) {
  const onKey = useCallback(
    (event: KeyboardEvent<HTMLSpanElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || !isMenuKey(event) || fromPortal(event)) return;
      event.preventDefault();
      const from = event.target as HTMLElement;
      const box = from.getBoundingClientRect();
      const rtl = getComputedStyle(from).direction === 'rtl';
      from.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          button: 2,
          clientX: rtl ? box.right : box.left,
          clientY: box.bottom,
        }),
      );
    },
    [onKeyDown, disabled],
  );
  return (
    <RadixMenu.Trigger
      {...rest}
      asChild
      disabled={disabled}
      onKeyDown={onKey}
      onContextMenu={(event: MouseEvent<HTMLSpanElement>) => {
        onContextMenu?.(event);
        // A right click inside a portal (an open DropdownMenu on the item) is not on the item: Radix skips a prevented event.
        if (fromPortal(event)) event.preventDefault();
      }}
      onPointerDown={(event: PointerEvent<HTMLSpanElement>) => {
        onPointerDown?.(event);
        // The same for a long press: no context menu over another menu.
        if (fromPortal(event) && event.pointerType !== 'mouse') event.preventDefault();
      }}
    >
      {children}
    </RadixMenu.Trigger>
  );
}

// ------------------------------------------------------------------ ContextMenuContent

export interface ContextMenuContentProps
  extends Omit<ComponentProps<typeof RadixMenu.Content>, 'asChild' | 'forceMount' | 'side' | 'align' | 'sideOffset'> {
  /** Space kept from the viewport edge in px. Default 8. Near an edge the menu flips to the other side of the pointer. */
  collisionPadding?: ComponentProps<typeof RadixMenu.Content>['collisionPadding'];
  /** Labels, items, groups, separators and submenus. */
  children?: ReactNode;
}

/**
 * The menu: the root `data-ds="context-menu"`, role menu. It opens at the
 * pointer toward the inline end (to the left in Arabic), in a Theme layer.
 * It never grows past the viewport: a long menu scrolls inside.
 */
export function ContextMenuContent({ collisionPadding = VIEWPORT_GUTTER, ref, children, ...rest }: ContextMenuContentProps) {
  const ctx = useMenuContext('ContextMenuContent');
  const layer = useMenuLayer(ctx.open);
  const { onContent } = layer;
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      assignRef(ref, node);
      onContent(node);
    },
    [ref, onContent],
  );
  return layer.render(
    <RadixMenu.Content
      {...rest}
      ref={setRef}
      side={physicalSide('inline-end', layer.dir)}
      align="start"
      sideOffset={POINTER_GAP}
      collisionPadding={collisionPadding}
      data-ds="context-menu"
      data-size={ctx.size}
    >
      {children}
    </RadixMenu.Content>,
  );
}

// ------------------------------------------------------------------ items

interface ItemCommonProps {
  /** Leading content: a system icon name or a node. Decorative: the text names the item. */
  start?: ContextMenuSlotContent;
  /** Trailing content: a system icon name or a node. Decorative. */
  end?: ContextMenuSlotContent;
  /** A key hint shown at the inline end, plain text (for example "Ctrl+D"). It does not bind the key. */
  shortcut?: string;
}

export interface ContextMenuItemProps extends ItemCommonProps, Omit<ComponentProps<typeof RadixMenu.Item>, 'asChild'> {
  /** danger: a destructive action, drawn in the danger text color. Default neutral. */
  tone?: ContextMenuItemTone;
  /** The label. English: a verb plus a noun. Arabic: a noun form. */
  children?: ReactNode;
}

/** An action. onSelect runs on click, Enter and Space, then the menu closes (event.preventDefault() keeps it open). */
export function ContextMenuItem({ start, end, shortcut, tone = 'neutral', textValue, children, ...rest }: ContextMenuItemProps) {
  return (
    <RadixMenu.Item {...rest} textValue={textValue ?? textOf(children)} data-part="item" data-tone={tone === 'danger' ? 'danger' : undefined}>
      <ItemContent start={start} end={end} shortcut={shortcut}>
        {children}
      </ItemContent>
    </RadixMenu.Item>
  );
}

export interface ContextMenuCheckboxItemProps
  extends ItemCommonProps,
    Omit<ComponentProps<typeof RadixMenu.CheckboxItem>, 'asChild'> {
  children?: ReactNode;
}

/** An option that is on or off (role menuitemcheckbox). The check icon shows the state; indeterminate shows a minus. */
export function ContextMenuCheckboxItem({ start, end, shortcut, textValue, children, ...rest }: ContextMenuCheckboxItemProps) {
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

export interface ContextMenuRadioGroupProps extends Omit<ComponentProps<typeof RadixMenu.RadioGroup>, 'asChild'> {
  children?: ReactNode;
}

/** A set of radio items where one is chosen (role group). Name it with aria-label or a ContextMenuLabel. */
export function ContextMenuRadioGroup(props: ContextMenuRadioGroupProps) {
  return <RadixMenu.RadioGroup {...props} data-part="group" />;
}

export interface ContextMenuRadioItemProps extends ItemCommonProps, Omit<ComponentProps<typeof RadixMenu.RadioItem>, 'asChild'> {
  children?: ReactNode;
}

/** One choice in a ContextMenuRadioGroup (role menuitemradio). The chosen one carries the check icon. */
export function ContextMenuRadioItem({ start, end, shortcut, textValue, children, ...rest }: ContextMenuRadioItemProps) {
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

export type ContextMenuLabelProps = Omit<ComponentProps<typeof RadixMenu.Label>, 'asChild'>;

/** A short heading over the items that follow. Not focusable. */
export function ContextMenuLabel(props: ContextMenuLabelProps) {
  return <RadixMenu.Label {...props} data-part="label" />;
}

export type ContextMenuGroupProps = Omit<ComponentProps<typeof RadixMenu.Group>, 'asChild'>;

/** Groups related items (role group). */
export function ContextMenuGroup(props: ContextMenuGroupProps) {
  return <RadixMenu.Group {...props} data-part="group" />;
}

export type ContextMenuSeparatorProps = Omit<ComponentProps<typeof RadixMenu.Separator>, 'asChild'>;

/** A line between groups of items (role separator). */
export function ContextMenuSeparator(props: ContextMenuSeparatorProps) {
  return <RadixMenu.Separator {...props} data-part="separator" />;
}

// ------------------------------------------------------------------ submenus

export interface ContextMenuSubProps {
  /** Controlled open state of the submenu. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A ContextMenuSubTrigger, then a ContextMenuSubContent. */
  children?: ReactNode;
}

/** A submenu: a trigger item and a nested menu. */
export function ContextMenuSub({ open: openProp, defaultOpen = false, onOpenChange, children }: ContextMenuSubProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <RadixMenu.Sub open={open} onOpenChange={setOpen}>
      <SubContext value={value}>{children}</SubContext>
    </RadixMenu.Sub>
  );
}

export interface ContextMenuSubTriggerProps extends Omit<ComponentProps<typeof RadixMenu.SubTrigger>, 'asChild'> {
  /** Leading content: a system icon name or a node. */
  start?: ContextMenuSlotContent;
  children?: ReactNode;
}

/** The item that opens a submenu: ArrowRight (ArrowLeft in RTL), Enter, Space or the pointer. The chevron mirrors in RTL. */
export function ContextMenuSubTrigger({ start, textValue, children, ...rest }: ContextMenuSubTriggerProps) {
  return (
    <RadixMenu.SubTrigger {...rest} textValue={textValue ?? textOf(children)} data-part="sub-trigger">
      <ItemContent start={start} end="chevron-forward">
        {children}
      </ItemContent>
    </RadixMenu.SubTrigger>
  );
}

export interface ContextMenuSubContentProps extends Omit<ComponentProps<typeof RadixMenu.SubContent>, 'asChild' | 'forceMount'> {
  children?: ReactNode;
}

/** The nested menu: a root of its own (`data-ds="context-menu"`) with the part name sub-content, in its own Theme layer. */
export function ContextMenuSubContent({
  ref,
  sideOffset = 0,
  alignOffset,
  collisionPadding = VIEWPORT_GUTTER,
  children,
  ...rest
}: ContextMenuSubContentProps) {
  const ctx = useMenuContext('ContextMenuSubContent');
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
  if (!sub) throw new Error('ContextMenuSubContent must be used inside a ContextMenuSub.');
  return layer.render(
    <RadixMenu.SubContent
      {...rest}
      ref={setRef}
      sideOffset={sideOffset}
      // Lines the first item of the submenu up with its trigger: the menu padding plus the border.
      alignOffset={alignOffset ?? -(TRIGGER_GAP + 1)}
      collisionPadding={collisionPadding}
      data-ds="context-menu"
      data-part="sub-content"
      data-size={ctx.size}
    >
      {children}
    </RadixMenu.SubContent>,
  );
}
