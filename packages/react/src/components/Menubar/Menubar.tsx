'use client';
// Menubar: the application menu row (File, Edit, View), Desk's menu bar.
// Built on Radix Menubar (role menubar with menuitem triggers; ArrowLeft and
// ArrowRight move between menus in reading order, ArrowDown opens, Escape
// closes, typeahead; once one menu is open, the pointer and the arrow keys
// open the next one).
//
// The row is the root. Each menu is a DropdownMenu surface: its content is
// a dropdown-menu root carrying the part name content (anatomy.md: a nested
// component may carry both), with the DropdownMenu item parts, so
// DropdownMenu.css draws the menus and Menubar.css draws the row.
//
// Sources: GoBanana desktop `MenuBarMenu.tsx`, `MenuClock.tsx` and the menu
// bar rules in desktop.css were not reachable from this session. The row is
// designed from the dials table in PLAN.md 3.7, the Desk DropdownMenu recipe
// (itself from GoBanana `.mb-menu`) and the color.material.menubar token.
//
// The DOM:
//
//   <div data-ds="menubar" data-size>                       the row; draws the surface
//     <div data-part="bar" role="menubar" aria-label>       the Radix root: the titles
//     <button data-part="trigger" role="menuitem" aria-haspopup="menu"
//             aria-expanded data-state="open|closed" data-highlighted? data-disabled?>
//       <span data-part="text" data-text="File">File</span>   the label; data-text reserves the open weight
//     ...
//     </div>
//     <div data-part="end">                                  a slot at the inline end, outside role menubar
//   <body>
//     <div data-ds="theme" data-menu-layer="menubar">         the portal Theme, display: contents
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="dropdown-menu" data-part="content" role="menu" data-size data-state data-side data-align>
//           ... the DropdownMenu parts
//     <div data-ds="theme" data-menu-layer="menubar">         one layer per open submenu
//       <div data-ds="dropdown-menu" data-part="sub-content" role="menu">
//
// The trigger is a part of the row, not a system Button: Radix renders it
// (no button element is written here), and the row draws it as a menu
// title, which a Button's fill, weight and Desk label roll would not be.
//
// The current menu is shown by fill and weight, never color alone. The
// weight change would shift the row, so the text part reserves the width
// of its open weight (Menubar.css).
//
// Motion: the menus play "menu-origin" from DropdownMenu.css (the surface
// from the trigger side, the rows one stagger step apart). The row itself
// does not move; its lit fill (the trigger's ::after) slides from title to
// title, interaction "menu-row-slide": on the arrow keys through the focus
// handlers of useRowSlide, and when the open menu changes with the pointer
// through the layout effect in Menubar.
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Menubar as RadixMenubar } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { type ButtonSlotContent } from '../Button/ButtonBase';
import { useControllable } from '../../internal/useControllable';
import { useMotion } from '../../internal/motion';
import {
  ROW_SLIDE_ID,
  IndicatorGlyph,
  ItemContent,
  MenuHighlight,
  TRIGGER_GAP,
  VIEWPORT_GUTTER,
  assignRef,
  physicalSide,
  slideHighlight,
  textOf,
  useMenuLayer,
  useRowSlide,
  type MenuSide,
} from '../DropdownMenu/menuShared';

/** Row and menu sizes: sm is a 28px row with 24px menu rows, md a size.control.md row with menu.item.height rows. */
export type MenubarSize = Extract<Size, 'sm' | 'md'>;
/** Item tones: danger marks a destructive action. */
export type MenubarItemTone = Extract<Tone, 'neutral' | 'danger'>;
/** Leading or trailing content of an item: a system icon name or a node. */
export type MenubarSlotContent = ButtonSlotContent;
/** Where a menu opens, in logical words. Default block-end, under its trigger. */
export type MenubarSide = MenuSide;
/** How a menu lines up with its trigger. start follows the reading direction. */
export type MenubarAlign = 'start' | 'center' | 'end';

/** The name of the menu layer: DropdownMenu.css maps the Radix menubar measures for it. */
const LAYER = 'menubar';

interface BarContextValue {
  value: string;
  size: MenubarSize;
}

const BarContext = createContext<BarContextValue | null>(null);

function useBar(name: string): BarContextValue {
  const ctx = use(BarContext);
  if (!ctx) throw new Error(`${name} must be used inside a Menubar.`);
  return ctx;
}

const MenuContext = createContext<{ open: boolean } | null>(null);

function useMenu(name: string): { open: boolean } {
  const ctx = use(MenuContext);
  if (!ctx) throw new Error(`${name} must be used inside a MenubarMenu.`);
  return ctx;
}

const SubContext = createContext<{ open: boolean } | null>(null);

// ------------------------------------------------------------------ Menubar

export interface MenubarProps
  extends Omit<ComponentProps<typeof RadixMenubar.Root>, 'asChild' | 'value' | 'defaultValue' | 'onValueChange' | 'dir'> {
  /** The value of the open MenubarMenu, or "" when none is open. Controlled, with onValueChange. */
  value?: string;
  /** Default "": no menu open. */
  defaultValue?: string;
  /** Called with the value of the menu that opens, or "" when the open menu closes. */
  onValueChange?: (value: string) => void;
  /** Row height, type size and the size of every menu: sm or md. Default md. */
  size?: MenubarSize;
  /** ArrowLeft on the first menu goes to the last, and back. Default true. */
  loop?: boolean;
  /** MenubarMenu elements, then an optional MenubarEnd. Name the row with aria-label ("Application menu"): it goes on the bar. */
  children?: ReactNode;
}

/**
 * The row: the root `data-ds="menubar"`, a plain element that holds the
 * role menubar part (`bar`) and, next to it, the MenubarEnd slot, so the
 * status text is never owned by the menubar role. Props, aria-label
 * included, spread onto the bar; className and style go to the root.
 */
export function Menubar({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  size = 'md',
  loop = true,
  className,
  style,
  children,
  ...rest
}: MenubarProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange);
  const ctx = useMemo<BarContextValue>(() => ({ value, size }), [value, size]);
  const menus: ReactNode[] = [];
  const end: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === MenubarEnd) end.push(child);
    else menus.push(child);
  });
  // Interaction "menu-row-slide" on the row: the open fill slides from the old title to the new one.
  const motion = useMotion();
  const slide = useRowSlide();
  const rowRef = useRef<HTMLDivElement | null>(null);
  const openTitle = useRef<Element | null>(null);
  useLayoutEffect(() => {
    const now = value ? (rowRef.current?.querySelector('[data-part="trigger"][data-state="open"]') ?? null) : null;
    if (now && openTitle.current && openTitle.current !== now) slideHighlight(openTitle.current, now, motion.mode(ROW_SLIDE_ID));
    openTitle.current = now;
    // Runs when the open menu changes; the motion mode is read as it is then.
  }, [value]);
  return (
    <div ref={rowRef} data-ds="menubar" data-size={size} className={className} style={style} onFocus={slide.onFocus} onBlur={slide.onBlur}>
      <RadixMenubar.Root {...rest} value={value} onValueChange={setValue} loop={loop} data-part="bar">
        <BarContext value={ctx}>{menus}</BarContext>
      </RadixMenubar.Root>
      {end}
    </div>
  );
}

// ------------------------------------------------------------------ MenubarMenu

export interface MenubarMenuProps {
  /** The value Menubar value and onValueChange use for this menu. Default: a generated id. */
  value?: string;
  /** A MenubarTrigger, then a MenubarContent. */
  children?: ReactNode;
}

/** One menu of the row: a trigger and its content. Renders no element of its own. */
export function MenubarMenu({ value: valueProp, children }: MenubarMenuProps) {
  const bar = useBar('MenubarMenu');
  const id = useId();
  const value = valueProp ?? id;
  const ctx = useMemo(() => ({ open: bar.value === value }), [bar.value, value]);
  return (
    <RadixMenubar.Menu value={value}>
      <MenuContext value={ctx}>{children}</MenuContext>
    </RadixMenubar.Menu>
  );
}

// ------------------------------------------------------------------ MenubarTrigger

export interface MenubarTriggerProps extends Omit<ComponentProps<typeof RadixMenubar.Trigger>, 'asChild' | 'children'> {
  /** The menu title: a short noun (File, Edit, View). Plain text reserves its open weight; a node does not. */
  children?: ReactNode;
}

/**
 * The menu title in the row (role menuitem with aria-haspopup menu). Click,
 * Enter, Space or ArrowDown opens its menu. `disabled` is the native
 * disabled of the Radix trigger: drawn dimmed, skipped by the arrow keys.
 */
export function MenubarTrigger({ children, ...rest }: MenubarTriggerProps) {
  return (
    <RadixMenubar.Trigger {...rest} data-part="trigger">
      <span data-part="text" data-text={textOf(children)}>
        {children}
      </span>
    </RadixMenubar.Trigger>
  );
}

// ------------------------------------------------------------------ MenubarContent

export interface MenubarContentProps
  extends Omit<ComponentProps<typeof RadixMenubar.Content>, 'asChild' | 'forceMount' | 'side' | 'align'> {
  /** Where the menu opens. Default block-end (under the trigger). Radix flips it when there is no room. */
  side?: MenubarSide;
  /** How it lines up with the trigger. Default start. */
  align?: MenubarAlign;
  /** Gap to the trigger in px. Default 4. */
  sideOffset?: number;
  /** Space kept from the viewport edge in px. Default 8. */
  collisionPadding?: ComponentProps<typeof RadixMenubar.Content>['collisionPadding'];
  children?: ReactNode;
}

/**
 * A menu of the row: a dropdown-menu root with the part name content, role
 * menu, named by its trigger, portaled into a Theme layer. It never grows
 * past the viewport: a long menu scrolls inside.
 */
export function MenubarContent({
  side = 'block-end',
  align = 'start',
  sideOffset = TRIGGER_GAP,
  collisionPadding = VIEWPORT_GUTTER,
  onEscapeKeyDown,
  ref,
  children,
  ...rest
}: MenubarContentProps) {
  const bar = useBar('MenubarContent');
  const menu = useMenu('MenubarContent');
  const layer = useMenuLayer(menu.open, LAYER);
  const { onContent } = layer;
  const node = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      node.current = el;
      assignRef(ref, el);
      onContent(el);
    },
    [ref, onContent],
  );
  return layer.render(
    <RadixMenubar.Content
      {...rest}
      ref={setRef}
      onEscapeKeyDown={(event) => {
        onEscapeKeyDown?.(event);
        if (event.defaultPrevented) return;
        // Focus goes back to the title at once, not after the exit motion (Radix returns it on unmount).
        const id = node.current?.getAttribute('aria-labelledby');
        if (id) document.getElementById(id)?.focus();
      }}
      side={physicalSide(side, layer.dir)}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      data-ds="dropdown-menu"
      data-part="content"
      data-size={bar.size}
    >
      {children}
      <MenuHighlight />
    </RadixMenubar.Content>,
  );
}

// ------------------------------------------------------------------ MenubarEnd

export interface MenubarEndProps extends ComponentProps<'div'> {
  /** Status at the inline end of the row: a clock, a sync state. Text, not controls. */
  children?: ReactNode;
}

/**
 * A slot at the inline end of the row, outside the menubar role, so its text
 * is read in the page. Plain status text such as a clock; never a menu or a
 * control. Put it last among the Menubar children.
 */
export function MenubarEnd(props: MenubarEndProps) {
  return <div {...props} data-part="end" />;
}

// ------------------------------------------------------------------ items

interface ItemCommonProps {
  /** Leading content: a system icon name or a node. Decorative: the text names the item. */
  start?: MenubarSlotContent;
  /** Trailing content: a system icon name or a node. Decorative. */
  end?: MenubarSlotContent;
  /** A key hint shown at the inline end, plain text (for example "Ctrl+S"). It does not bind the key. */
  shortcut?: string;
}

export interface MenubarItemProps extends ItemCommonProps, Omit<ComponentProps<typeof RadixMenubar.Item>, 'asChild'> {
  /** danger: a destructive action, drawn in the danger text color. Default neutral. */
  tone?: MenubarItemTone;
  /** The label. English: a verb plus a noun. Arabic: a noun form. */
  children?: ReactNode;
}

/** An action. onSelect runs on click, Enter and Space, then the menu closes (event.preventDefault() keeps it open). */
export function MenubarItem({ start, end, shortcut, tone = 'neutral', textValue, children, ...rest }: MenubarItemProps) {
  return (
    <RadixMenubar.Item {...rest} textValue={textValue ?? textOf(children)} data-part="item" data-tone={tone === 'danger' ? 'danger' : undefined}>
      <ItemContent start={start} end={end} shortcut={shortcut}>
        {children}
      </ItemContent>
    </RadixMenubar.Item>
  );
}

export interface MenubarCheckboxItemProps extends ItemCommonProps, Omit<ComponentProps<typeof RadixMenubar.CheckboxItem>, 'asChild'> {
  children?: ReactNode;
}

/** An option that is on or off (role menuitemcheckbox). The check icon shows the state; indeterminate shows a minus. */
export function MenubarCheckboxItem({ start, end, shortcut, textValue, children, ...rest }: MenubarCheckboxItemProps) {
  return (
    <RadixMenubar.CheckboxItem {...rest} textValue={textValue ?? textOf(children)} data-part="checkbox-item">
      <ItemContent
        start={start}
        end={end}
        shortcut={shortcut}
        indicator={
          <span data-part="indicator" aria-hidden="true">
            <RadixMenubar.ItemIndicator>
              <IndicatorGlyph checked={rest.checked} />
            </RadixMenubar.ItemIndicator>
          </span>
        }
      >
        {children}
      </ItemContent>
    </RadixMenubar.CheckboxItem>
  );
}

export interface MenubarRadioGroupProps extends Omit<ComponentProps<typeof RadixMenubar.RadioGroup>, 'asChild'> {
  children?: ReactNode;
}

/** A set of radio items where one is chosen (role group). Name it with aria-label or a MenubarLabel. */
export function MenubarRadioGroup(props: MenubarRadioGroupProps) {
  return <RadixMenubar.RadioGroup {...props} data-part="group" />;
}

export interface MenubarRadioItemProps extends ItemCommonProps, Omit<ComponentProps<typeof RadixMenubar.RadioItem>, 'asChild'> {
  children?: ReactNode;
}

/** One choice in a MenubarRadioGroup (role menuitemradio). The chosen one carries the check icon. */
export function MenubarRadioItem({ start, end, shortcut, textValue, children, ...rest }: MenubarRadioItemProps) {
  return (
    <RadixMenubar.RadioItem {...rest} textValue={textValue ?? textOf(children)} data-part="radio-item">
      <ItemContent
        start={start}
        end={end}
        shortcut={shortcut}
        indicator={
          <span data-part="indicator" aria-hidden="true">
            <RadixMenubar.ItemIndicator>
              <Icon name="check" size="md" />
            </RadixMenubar.ItemIndicator>
          </span>
        }
      >
        {children}
      </ItemContent>
    </RadixMenubar.RadioItem>
  );
}

export type MenubarLabelProps = Omit<ComponentProps<typeof RadixMenubar.Label>, 'asChild'>;

/** A short heading over the items that follow. Not focusable. */
export function MenubarLabel(props: MenubarLabelProps) {
  return <RadixMenubar.Label {...props} data-part="label" />;
}

export type MenubarGroupProps = Omit<ComponentProps<typeof RadixMenubar.Group>, 'asChild'>;

/** Groups related items (role group). */
export function MenubarGroup(props: MenubarGroupProps) {
  return <RadixMenubar.Group {...props} data-part="group" />;
}

export type MenubarSeparatorProps = Omit<ComponentProps<typeof RadixMenubar.Separator>, 'asChild'>;

/** A line between groups of items (role separator). */
export function MenubarSeparator(props: MenubarSeparatorProps) {
  return <RadixMenubar.Separator {...props} data-part="separator" />;
}

// ------------------------------------------------------------------ submenus

export interface MenubarSubProps {
  /** Controlled open state of the submenu. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A MenubarSubTrigger, then a MenubarSubContent. */
  children?: ReactNode;
}

/** A submenu: a trigger item and a nested menu. */
export function MenubarSub({ open: openProp, defaultOpen = false, onOpenChange, children }: MenubarSubProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <RadixMenubar.Sub open={open} onOpenChange={setOpen}>
      <SubContext value={value}>{children}</SubContext>
    </RadixMenubar.Sub>
  );
}

export interface MenubarSubTriggerProps extends Omit<ComponentProps<typeof RadixMenubar.SubTrigger>, 'asChild'> {
  /** Leading content: a system icon name or a node. */
  start?: MenubarSlotContent;
  children?: ReactNode;
}

/** The item that opens a submenu: ArrowRight (ArrowLeft in RTL), Enter, Space or the pointer. The chevron mirrors in RTL. */
export function MenubarSubTrigger({ start, textValue, children, ...rest }: MenubarSubTriggerProps) {
  return (
    <RadixMenubar.SubTrigger {...rest} textValue={textValue ?? textOf(children)} data-part="sub-trigger">
      <ItemContent start={start} end="chevron-forward">
        {children}
      </ItemContent>
    </RadixMenubar.SubTrigger>
  );
}

export interface MenubarSubContentProps extends Omit<ComponentProps<typeof RadixMenubar.SubContent>, 'asChild' | 'forceMount'> {
  children?: ReactNode;
}

/** The nested menu: a dropdown-menu root with the part name sub-content, in its own menubar layer. */
export function MenubarSubContent({
  ref,
  sideOffset = 0,
  alignOffset,
  collisionPadding = VIEWPORT_GUTTER,
  children,
  ...rest
}: MenubarSubContentProps) {
  const bar = useBar('MenubarSubContent');
  const sub = use(SubContext);
  const layer = useMenuLayer(sub?.open ?? false, LAYER);
  const { onContent } = layer;
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      assignRef(ref, node);
      onContent(node);
    },
    [ref, onContent],
  );
  if (!sub) throw new Error('MenubarSubContent must be used inside a MenubarSub.');
  return layer.render(
    <RadixMenubar.SubContent
      {...rest}
      ref={setRef}
      sideOffset={sideOffset}
      // Lines the first item of the submenu up with its trigger: the menu padding plus the border.
      alignOffset={alignOffset ?? -(TRIGGER_GAP + 1)}
      collisionPadding={collisionPadding}
      data-ds="dropdown-menu"
      data-part="sub-content"
      data-size={bar.size}
    >
      {children}
      <MenuHighlight />
    </RadixMenubar.SubContent>,
  );
}
