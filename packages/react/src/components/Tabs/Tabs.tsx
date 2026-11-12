'use client';
// Tabs: switch between panels of related content in place. Built on Radix
// Tabs (roles tablist, tab and tabpanel; roving focus; arrow keys that follow
// the reading direction; Home and End; automatic or manual activation).
//
// Sources: Figma-Killer-2 `Tabs/` (the underline style: muted text, the
// active tab in the default text color and a heavier weight, a 2px line
// that sits on the hairline of the list, the panel that stays mounted) and
// `RangeTabs/` (the soft style: a filled pill behind the active label).
// GoBanana `ExportTabs.tsx` and `InstallTabs.tsx` were not reachable in this
// session; the look follows the dials table and the FK2 files.
//
// The DOM:
//
//   <div data-ds="tabs" data-size data-emphasis data-orientation>        Radix Tabs.Root
//     <div data-part="list" role="tablist" aria-label data-orientation> Radix Tabs.List, scrolls on overflow
//       <button data-part="trigger" role="tab" data-state="active|inactive" data-disabled?>
//         <span data-part="indicator" aria-hidden>                        only in the active trigger
//         <span data-part="start">                                       optional icon
//         <span data-part="label">                                       the visible name
//         <span data-part="count">                                       optional number, read with the name
//     <div data-part="panel" role="tabpanel" data-state tabindex="0">     Radix Tabs.Content
//
// The trigger is the button Radix renders (role tab), not a system Button:
// a tab is a choice inside one widget, not an action, and its indicator and
// count must stay parts of Tabs (a part belongs to the nearest root, so
// inside a Button root they would belong to Button). No `<button>` is
// written here.
//
// Motion, pattern "tab-indicator": the indicator lives in the active
// trigger. When the value changes, the new indicator plays a FLIP with the
// Web Animations API from the box of the previous trigger to its own: a
// translate and a scale, nothing else. The duration and ease come from the
// tokens through the private properties in Tabs.css. Under reduced motion
// the duration token is 0ms and no animation runs. Nothing waits for an
// animation event.
import {
  createContext,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react';
import { Tabs as RadixTabs } from 'radix-ui';
import type { Emphasis, Size } from '@the-system/shared';
import { renderSlotContent, type ButtonSlotContent } from '../Button/ButtonBase';
import { useControllable } from '../Window/useControllable';

/** sm triggers are 28px (size.control.sm), md triggers 32px (size.control.md) at default density. */
export type TabsSize = Extract<Size, 'sm' | 'md'>;
/** ghost: an underline under the active tab. soft: a filled pill behind it. */
export type TabsEmphasis = Extract<Emphasis, 'soft' | 'ghost'>;
export type TabsOrientation = 'horizontal' | 'vertical';
/** automatic: an arrow key moves focus and shows its panel. manual: Enter or Space shows it. */
export type TabsActivationMode = 'automatic' | 'manual';
/** Leading content of a trigger: a system icon name or a node. */
export type TabsSlotContent = ButtonSlotContent;

interface TabsContextValue {
  value: string;
  orientation: TabsOrientation;
  /** The trigger elements by value, for the indicator motion. */
  triggers: Map<string, HTMLElement>;
  /** The value shown before the last change, or null on the first render. */
  previous: { current: string | null };
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(name: string): TabsContextValue {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error(`${name} must be used inside Tabs.`);
  return ctx;
}

/** Reads a CSS time ("120ms", "0.2s") as milliseconds. Anything else is 0. */
export function parseTime(value: string): number {
  const v = value.trim();
  const ms = /^(-?[\d.]+)ms$/.exec(v);
  if (ms) return Number(ms[1]);
  const s = /^(-?[\d.]+)s$/.exec(v);
  if (s) return Number(s[1]) * 1000;
  return 0;
}

// ------------------------------------------------------------------ Tabs

export interface TabsProps
  extends Omit<ComponentProps<typeof RadixTabs.Root>, 'asChild' | 'value' | 'defaultValue' | 'onValueChange' | 'dir' | 'title'> {
  /** Controlled value: the value of the active trigger, with onValueChange. */
  value?: string;
  /** The value active at first when uncontrolled. Default: none until a tab is chosen, so always pass one. */
  defaultValue?: string;
  /** Called with the value of the tab that becomes active. */
  onValueChange?: (value: string) => void;
  /** Trigger height and type size. Default md. */
  size?: TabsSize;
  /** ghost draws an underline, soft a filled pill. Default ghost. */
  emphasis?: TabsEmphasis;
  /** horizontal: the list is a row above the panels. vertical: a column at the inline start. Default horizontal. */
  orientation?: TabsOrientation;
  /** Default automatic: arrows move focus and show the panel. manual: arrows move focus, Enter or Space shows it. */
  activationMode?: TabsActivationMode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The tabs root. Holds the value; TabsList and the TabsPanel elements go
 * inside it. The direction comes from the nearest Theme.
 */
export function Tabs({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  size = 'md',
  emphasis = 'ghost',
  orientation = 'horizontal',
  activationMode = 'automatic',
  children,
  ...rest
}: TabsProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange);
  const triggers = useRef(new Map<string, HTMLElement>()).current;
  const previous = useRef<string | null>(null);
  const ctx = useMemo<TabsContextValue>(() => ({ value, orientation, triggers, previous }), [value, orientation, triggers]);

  return (
    <RadixTabs.Root
      {...rest}
      value={value}
      onValueChange={setValue}
      orientation={orientation}
      activationMode={activationMode}
      data-ds="tabs"
      data-size={size}
      data-emphasis={emphasis}
    >
      <TabsContext value={ctx}>{children}</TabsContext>
    </RadixTabs.Root>
  );
}

// ------------------------------------------------------------------ TabsList

interface TabsListOwnProps extends Omit<ComponentProps<typeof RadixTabs.List>, 'asChild' | 'title'> {
  /** TabsTrigger elements. Two to eight; more scroll inside the list. */
  children?: ReactNode;
  /** Default true: arrow keys wrap from the last tab to the first. */
  loop?: boolean;
}

/** A tab list needs a name: `aria-label`, or `aria-labelledby` pointing at a visible heading. */
export type TabsListProps = TabsListOwnProps &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

/** The row (or column) of tabs. It scrolls inside itself when the tabs do not fit, never the page. */
export function TabsList(props: TabsListProps) {
  useTabsContext('TabsList');
  return <RadixTabs.List {...props} data-part="list" />;
}

// ------------------------------------------------------------------ TabsTrigger

export interface TabsTriggerProps extends Omit<ComponentProps<typeof RadixTabs.Trigger>, 'asChild' | 'title' | 'children'> {
  /** The value this tab shows. Equal to one TabsPanel value. */
  value: string;
  /** The visible name: a short noun, sentence case. */
  children: ReactNode;
  /** Leading icon (a system icon name) or node, decorative. */
  start?: TabsSlotContent;
  /** A number shown after the label (open items, comments). Read with the name. */
  count?: number;
  /** Skipped by the arrow keys and cannot be chosen. Drawn with opacity.disabled. */
  disabled?: boolean;
}

/** One tab. The active one carries the indicator and a heavier weight, so color is never the only cue. */
export function TabsTrigger({ value, start, count, children, ref, ...rest }: TabsTriggerProps) {
  const ctx = useTabsContext('TabsTrigger');
  const active = ctx.value === value;
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const ownRef = useRef<HTMLButtonElement | null>(null);

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      const before = ownRef.current;
      ownRef.current = node;
      if (node) ctx.triggers.set(value, node);
      else if (before && ctx.triggers.get(value) === before) ctx.triggers.delete(value);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ctx.triggers, value, ref],
  );

  useLayoutEffect(() => {
    if (!active) return;
    const from = ctx.previous.current;
    ctx.previous.current = value;
    const node = ownRef.current;
    if (!node) return;
    // Keep the active tab in view inside a scrolling list. Not on the first
    // render, so a page never scrolls by itself on load.
    if (from !== null && from !== value && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    const indicator = indicatorRef.current;
    const prev = from !== null && from !== value ? ctx.triggers.get(from) : undefined;
    if (!indicator || !prev || typeof indicator.animate !== 'function') return;
    const style = getComputedStyle(indicator);
    const duration = parseTime(style.getPropertyValue('--_tabs-indicator-duration'));
    if (duration <= 0) return;
    const a = prev.getBoundingClientRect();
    const b = node.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return;
    const vertical = ctx.orientation === 'vertical';
    const shift = vertical ? `translateY(${a.top - b.top}px) scaleY(${a.height / b.height})` : `translateX(${a.left - b.left}px) scaleX(${a.width / b.width})`;
    indicator.animate([{ transform: shift }, { transform: 'none' }], {
      duration,
      easing: style.getPropertyValue('--_tabs-indicator-ease').trim() || 'ease',
    });
  }, [active, value, ctx.previous, ctx.triggers, ctx.orientation]);

  return (
    <RadixTabs.Trigger
      {...rest}
      ref={setRef}
      value={value}
      data-part="trigger"
    >
      {active && <span data-part="indicator" aria-hidden="true" ref={indicatorRef} />}
      {start !== undefined && <span data-part="start">{renderSlotContent(start)}</span>}
      <span data-part="label">{children}</span>
      {/* The space keeps the name "Comments 12"; a flex container drops it from the layout. */}
      {count !== undefined && (
        <>
          {' '}
          <span data-part="count">{count}</span>
        </>
      )}
    </RadixTabs.Trigger>
  );
}

// ------------------------------------------------------------------ TabsPanel

export interface TabsPanelProps extends Omit<ComponentProps<typeof RadixTabs.Content>, 'asChild' | 'title'> {
  /** The value of the tab that shows this panel. */
  value: string;
}

/**
 * The content of one tab. It takes focus with Tab from the list (tabindex 0),
 * so a panel with no focusable content is still reached. Inactive panels
 * unmount unless `forceMount` is set (then they are hidden).
 */
export function TabsPanel(props: TabsPanelProps) {
  useTabsContext('TabsPanel');
  return <RadixTabs.Content {...props} data-part="panel" />;
}
