'use client';
// Tooltip: a short hint for a control on hover and focus. The only way to
// show a hint in the system: no native title attribute anywhere.
//
// Behavior from Radix Tooltip: it opens after a delay on pointer hover and at
// once on keyboard focus, stays open while the pointer is over the trigger or
// the tooltip (hoverable, WCAG 1.4.13), closes on Escape without moving focus
// (dismissable), on pointer down, and when the trigger loses focus or the
// pointer leaves both. It is the trigger's description (aria-describedby to
// the role tooltip content), never its name: the control keeps its own label.
// When the hint is the same string as that label (the IconButton case) it is
// not wired as the description either, so it is not read twice.
//
// Sources: Figma-Killer-2 `ui/components/Tooltip` (the bubble on the body
// color with a faint border, the tooltip shadow, the 240px cap, the small
// medium weight text, the arrow with a border on its two outer edges, the
// 80ms fade, Escape caught before a parent panel sees it). GoBanana could not
// be read in this lane.
//
// The provider. Radix needs one TooltipProvider above every tooltip to share
// the open delay and the skip delay (the next tooltip opens at once while the
// pointer moves along a toolbar). Put one near the root of the app, inside
// Theme. A Tooltip with no TooltipProvider above it renders its own, so it
// always works, but each such tooltip then keeps its own delay.
//
// The DOM:
//
//   <body>
//     <div data-ds="theme" data-tooltip-layer>       the portal Theme, display: contents
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="tooltip" role="tooltip" data-state data-side data-align>   root: Radix Content
//           text
//           <span data-part="shortcut"><bdi dir="ltr">   optional; the bdi keeps the keys left to right
//           <span><svg data-part="arrow"></span>
//
// A tooltip hides while its trigger is out of view or hidden
// (hideWhenDetached), so it never floats on alone.
//
// Motion (order 1.22, proposed): interaction "tooltip-rise" in Tooltip.css (a
// delayed open travels out of the trigger side on the snappy spring), and
// interaction "tooltip-follow" here: a tooltip that opens at once inside the
// provider's skip delay (data-state instant-open) slides from where the last
// tooltip was to its own place, and the last one is hidden at once, so one
// tooltip seems to move along the toolbar. Only the drawing moves; the
// tooltip is open and described from its first frame.
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { Tooltip as RadixTooltip } from 'radix-ui';
import { useTheme } from '../../theme/hooks';
import { ArrowShape, ThemedPortal, physicalSide, useLayerPresence, type FloatingAlign, type FloatingSide } from '../Popover/FloatingLayer';
import { useControllable } from '../../internal/useControllable';
import { flipPlay, readDuration, rectOf, type MotionRect, type PatternMode } from '@the-system/motion';
import { useMotion } from '../../internal/motion';

export type TooltipSide = FloatingSide;
export type TooltipAlign = FloatingAlign;

/** Open delay on hover, in ms. Focus opens at once. */
export const TOOLTIP_DELAY = 500;
/** After a tooltip closes, the next one opens at once within this time, in ms. */
export const TOOLTIP_SKIP_DELAY = 300;

const ProviderPresent = createContext(false);

/** The last tooltip that closed: the element, where it was drawn and when (interaction "tooltip-follow"). */
let lastClosed: { el: HTMLElement; rect: MotionRect; at: number } | null = null;

/** Frames to wait for Radix to place a new tooltip before it slides. */
const PLACE_FRAMES = 8;

/**
 * Interaction "tooltip-follow": a tooltip that opened at once right after
 * another one closed slides from the old place to its own on the snappy
 * spring, and the old one is hidden at once. Radix places the content in a
 * later frame (its wrapper waits off screen until then), so the slide starts
 * once it is placed.
 */
function followLast(node: HTMLElement, mode: PatternMode, skipDelay: number): void {
  const prev = lastClosed;
  if (mode !== 'full' || !prev || prev.el === node || node.getAttribute('data-state') !== 'instant-open') return;
  // instant-open already says the provider is inside its skip delay; the portal mounts a frame or two after that.
  if (performance.now() - prev.at > 2 * skipDelay || typeof node.animate !== 'function') return;
  if (prev.el.isConnected) {
    prev.el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: Math.max(readDuration(prev.el, 'duration.quick'), 1), fill: 'forwards' });
  }
  let frames = 0;
  const placed = () => !(node.parentElement?.style.transform ?? '').includes('-200%');
  const step = () => {
    if (!node.isConnected) return;
    if (!placed() && frames++ < PLACE_FRAMES) {
      requestAnimationFrame(step);
      return;
    }
    flipPlay({ rects: new Map([[node, prev.rect]]) }, { items: [node], spring: 'snappy', mode });
  };
  requestAnimationFrame(step);
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

// ------------------------------------------------------------------ TooltipProvider

export interface TooltipProviderProps {
  /** Open delay on hover, in ms. Default 500. */
  delayDuration?: number;
  /** Time after a close in which the next tooltip opens at once, in ms. Default 300. */
  skipDelayDuration?: number;
  children?: ReactNode;
}

/** Shares the delays of every Tooltip under it. One near the root of the app, inside Theme. */
export function TooltipProvider({ delayDuration = TOOLTIP_DELAY, skipDelayDuration = TOOLTIP_SKIP_DELAY, children }: TooltipProviderProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <ProviderPresent value>{children}</ProviderPresent>
    </RadixTooltip.Provider>
  );
}

// ------------------------------------------------------------------ Tooltip

export interface TooltipProps {
  /** The hint: short text, one line where it fits, 240px at most. It describes the control and never names it. */
  content: ReactNode;
  /** A keyboard shortcut shown after the hint, for example "Ctrl+C". Always left to right. */
  shortcut?: string;
  /** The preferred side. start and end follow the reading direction. It flips when there is no room. Default top. */
  side?: TooltipSide;
  /** Alignment along the trigger, mirrored in right to left layouts. Default center. */
  align?: TooltipAlign;
  /** Distance from the trigger in px, the arrow included. Default 6. */
  sideOffset?: number;
  /** Shows the arrow. Default true. */
  arrow?: boolean;
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Open delay on hover for this tooltip, in ms. Default from the provider, 500. */
  delayDuration?: number;
  /** true: renders the trigger alone, with no tooltip. Default false. */
  disabled?: boolean;
  /** The trigger: one system element that takes focus (Button, IconButton, a link). */
  children: ReactElement;
  /** Class name, inline style and ref of the root (the tooltip content). */
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
  /** Any other prop for the root. */
  contentProps?: Omit<ComponentProps<typeof RadixTooltip.Content>, 'asChild' | 'side' | 'align' | 'sideOffset' | 'children'>;
}

/** Development only: a trigger that has no name of its own, so the tooltip would hold it. */
function isUnnamed(child: ReactElement): boolean {
  const props = child.props as Record<string, unknown>;
  const text = (v: unknown) => typeof v === 'string' && v.trim() !== '';
  const hasText = (node: ReactNode): boolean =>
    Children.toArray(node).some(
      (c) => text(c) || typeof c === 'number' || (isValidElement<{ children?: ReactNode }>(c) && hasText(c.props.children)),
    );
  return !(text(props.label) || text(props['aria-label']) || text(props['aria-labelledby']) || hasText(props.children as ReactNode));
}

/**
 * Sits between the Radix Trigger and the trigger element: it takes the props
 * Radix merged (ref included), puts back the element's own aria-describedby
 * instead of the tooltip id, and passes the rest on.
 */
function WithoutTooltipDescription({
  own,
  children,
  'aria-describedby': _radix,
  ...rest
}: {
  own?: string;
  children: ReactElement;
  'aria-describedby'?: string;
} & Record<string, unknown>) {
  return cloneElement(children as ReactElement<Record<string, unknown>>, { ...rest, 'aria-describedby': own });
}

/** The trigger's own name, when it is a plain string prop. */
function nameOf(child: ReactElement): string | undefined {
  const props = child.props as Record<string, unknown>;
  const name = props['aria-label'] ?? props.label;
  return typeof name === 'string' ? name : undefined;
}

/**
 * Wraps one trigger. The root (`data-ds="tooltip"`) is the Radix Content
 * with role tooltip; it carries data-state (delayed-open, instant-open,
 * closed), data-side and data-align.
 */
export function Tooltip({
  content,
  shortcut,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  arrow = true,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  delayDuration,
  disabled = false,
  children,
  className,
  style,
  ref,
  contentProps,
}: TooltipProps) {
  const hasProvider = use(ProviderPresent);
  const theme = useTheme();
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const shown = open && !disabled;
  const [mounted, presenceRef] = useLayerPresence(shown);
  // Turning the tooltip off closes it, so it never comes back open on its own.
  useEffect(() => {
    if (disabled && open && openProp === undefined) setOpen(false);
  }, [disabled, open, openProp, setOpen]);
  // Development only, once per instance: a trigger with no name of its own.
  const warned = useRef(false);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || warned.current) return;
    if (isUnnamed(children)) {
      warned.current = true;
      console.warn('Tooltip: the trigger has no accessible name. Give it a label; a tooltip only describes it.');
    }
  }, [children]);
  const userRef = useRef(ref);
  userRef.current = ref;
  const motion = useMotion();
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node;
      presenceRef(node);
      assignRef(userRef.current, node);
      if (node) followLast(node, motionRef.current.mode('tooltip-follow'), TOOLTIP_SKIP_DELAY);
    },
    [presenceRef],
  );
  // Where this tooltip was when it started to close, for the next one to slide from.
  useEffect(() => {
    const node = nodeRef.current;
    if (shown || !node) return;
    lastClosed = { el: node, rect: rectOf(node), at: performance.now() };
  }, [shown]);

  // The tooltip repeats the trigger's name (an IconButton label): it is not
  // also its description, so a screen reader does not say it twice.
  const repeatsName = typeof content === 'string' && nameOf(children) === content;
  const trigger = repeatsName ? (
    <WithoutTooltipDescription own={(children.props as Record<string, unknown>)['aria-describedby'] as string | undefined}>
      {children}
    </WithoutTooltipDescription>
  ) : (
    children
  );

  // Root and Trigger always render, also when disabled, so the trigger is never remounted and keeps focus.
  const tooltip = (
    <RadixTooltip.Root open={shown} onOpenChange={(next) => !disabled && setOpen(next)} delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>{trigger}</RadixTooltip.Trigger>
      {mounted && !disabled && (
        <ThemedPortal layer="tooltip">
          <RadixTooltip.Content
            {...contentProps}
            ref={setRef}
            className={className}
            style={style}
            data-ds="tooltip"
            side={physicalSide(side, theme.dir)}
            align={align}
            sideOffset={sideOffset}
            collisionPadding={contentProps?.collisionPadding ?? 8}
            hideWhenDetached={contentProps?.hideWhenDetached ?? true}
          >
            {content}
            {shortcut && (
              <span data-part="shortcut">
                <bdi dir="ltr">{shortcut}</bdi>
              </span>
            )}
            {arrow && (
              <RadixTooltip.Arrow asChild>
                <ArrowShape />
              </RadixTooltip.Arrow>
            )}
          </RadixTooltip.Content>
        </ThemedPortal>
      )}
    </RadixTooltip.Root>
  );

  return hasProvider ? tooltip : <TooltipProvider>{tooltip}</TooltipProvider>;
}
