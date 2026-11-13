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
// Motion, interaction "tab-slide" (order 1.22, proposed), the shared pill of
// react/src/internal/indicator.ts: the indicator lives in the active
// trigger. When the value changes, the new indicator slides from the box the
// old one was drawn in (live, so a second change mid travel starts where
// the pill is), stretching along its travel on the snappy spring, a
// translate and a scale with the center origin, nothing else (no width or
// left). The label it leaves dips to scale.anticipate and the label it
// reaches pops past rest and settles. Boxes are measured relative to the
// list (its scroll included), so RTL needs nothing. useMotion().mode lets
// the style tune or turn it off; under reduced motion the indicator jumps.
// Nothing waits for an animation event.
//
// Round 3 (order 1.23, proposed): the labels no longer dip and pop. The text
// under the pill takes the active color exactly where the pill is (./ink.ts):
// aria-hidden twins (part label-ink) in the active color are cut to the
// pill with clip-path, keyframe for keyframe with the slide, and removed
// when it ends.
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
import { followIndicator, fromLocal, useIndicatorTrack, type IndicatorTrack } from '../../internal/indicator';
import { playInk } from './ink';
import { useMotion } from '../../internal/motion';
import { useControllable } from '../../internal/useControllable';

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
  /** Where the indicator was last drawn, for the slide. */
  track: IndicatorTrack;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(name: string): TabsContextValue {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error(`${name} must be used inside Tabs.`);
  return ctx;
}


// ------------------------------------------------------------------ Tabs

interface TabsBaseProps
  extends Omit<ComponentProps<typeof RadixTabs.Root>, 'asChild' | 'value' | 'defaultValue' | 'onValueChange' | 'dir' | 'title'> {
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
 * Controlled (`value`, with onValueChange) or uncontrolled (`defaultValue`,
 * required then, so a panel always shows on load).
 */
export type TabsProps = TabsBaseProps & ({ value: string; defaultValue?: string } | { value?: undefined; defaultValue: string });

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
  const track = useIndicatorTrack();
  const ctx = useMemo<TabsContextValue>(() => ({ value, orientation, triggers, previous, track }), [value, orientation, triggers, track]);

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

/** The parts of a trigger whose color crosses under the pill. */
const INKED = ':scope > :is([data-part="label"], [data-part="start"])';

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
  const motion = useMotion();
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
    // Keep the active tab in view inside a scrolling list, on load too (a
    // default tab past the visible part). Only the list's own scroll offset
    // is set, never scrollIntoView, so the page around it never scrolls.
    const list = node.parentElement;
    if (from !== value && list) {
      if (ctx.orientation === 'vertical') {
        const top = node.offsetTop - list.offsetTop;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (top + node.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + node.offsetHeight - list.clientHeight;
      } else {
        const l = node.getBoundingClientRect();
        const b = list.getBoundingClientRect();
        if (l.left < b.left) list.scrollLeft -= b.left - l.left;
        else if (l.right > b.right) list.scrollLeft += l.right - b.right;
      }
    }
    const indicator = indicatorRef.current;
    if (!indicator || !list) return;
    const slide = followIndicator(ctx.track, value, { el: indicator }, { mode: motion.mode('tab-slide'), anchor: list });
    // Round 3: the text under the pill takes the active color where the pill is (./ink.ts).
    const inked = (el: Element | undefined) => (el ? [...el.querySelectorAll(INKED)] : []);
    const left = from === null ? undefined : ctx.triggers.get(from);
    playInk({
      switch: '--_tabs-ink',
      slide,
      to: ctx.track.rect ? fromLocal(ctx.track.rect, list) : indicator.getBoundingClientRect(),
      anchor: list,
      parts: [...ctx.triggers.values()].flatMap(inked),
      reaching: inked(node),
      restFrom: left?.querySelector(':scope > [data-part="label"]'),
      inkFrom: node.querySelector(':scope > [data-part="label"]'),
      axis: ctx.orientation === 'vertical' ? 'y' : 'x',
    });
  }, [active, value, ctx.previous, ctx.track, ctx.orientation, ctx.triggers, motion]);

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
