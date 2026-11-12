'use client';
// HoverCard: a preview card for a link or a person, on hover and on keyboard
// focus of the trigger. Read only: whatever the card shows must also be
// reachable without it (the page it links to, the profile it previews).
//
// Behavior from Radix HoverCard: it opens after a delay on pointer hover and
// on focus of the trigger, stays open while the pointer is over the trigger
// or the card, and closes on Escape, on blur and when the pointer leaves
// both. Radix takes the links inside the card out of the tab order
// (tabindex -1), so the card never traps or adds tab stops: the card is never
// the only way to reach its links.
//
// Sources: no source (the order says so). Designed from the dials table of
// PLAN.md 3.7 and the nearest component, Popover: the same surface, arrow,
// glass in Desk and the "menu-scale" motion, with one body part and no title,
// close or footer.
//
// The DOM:
//
//   <body>
//     <div data-ds="theme" data-hover-card-layer>     the portal Theme, display: contents
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="hover-card" data-size data-state data-side data-align>   root: Radix Content
//           <div data-part="body">
//           <span><svg data-part="arrow"></span>
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { HoverCard as RadixHoverCard } from 'radix-ui';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { ArrowShape, ThemedPortal, physicalSide, useLayerPresence, type FloatingAlign, type FloatingSide } from '../Popover/FloatingLayer';
import { useControllable } from '../../internal/useControllable';

export type HoverCardSize = Extract<Size, 'sm' | 'md'>;
export type HoverCardSide = FloatingSide;
export type HoverCardAlign = FloatingAlign;

/** Open delay on hover in ms. Focus opens at once. */
export const HOVER_CARD_OPEN_DELAY = 500;
/** Close delay in ms after the pointer leaves the trigger and the card. */
export const HOVER_CARD_CLOSE_DELAY = 300;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

interface HoverCardContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  size: HoverCardSize;
}

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCardContext(name: string): HoverCardContextValue {
  const ctx = use(HoverCardContext);
  if (!ctx) throw new Error(`${name} must be used inside a HoverCard.`);
  return ctx;
}

// ------------------------------------------------------------------ HoverCard

export interface HoverCardProps {
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The width: sm 240, md 320 px. Default md. */
  size?: HoverCardSize;
  /** Open delay on hover in ms. Default 500. Focus opens at once. */
  openDelay?: number;
  /** Close delay in ms. Default 300. */
  closeDelay?: number;
  children?: ReactNode;
}

/** The root: state, delays and the size. Renders no element of its own. */
export function HoverCard({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  size = 'md',
  openDelay = HOVER_CARD_OPEN_DELAY,
  closeDelay = HOVER_CARD_CLOSE_DELAY,
  children,
}: HoverCardProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const value = useMemo<HoverCardContextValue>(() => ({ open, setOpen, size }), [open, setOpen, size]);
  return (
    <RadixHoverCard.Root open={open} onOpenChange={setOpen} openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardContext value={value}>{children}</HoverCardContext>
    </RadixHoverCard.Root>
  );
}

// ------------------------------------------------------------------ HoverCardTrigger

export interface HoverCardTriggerProps extends Omit<ComponentProps<typeof RadixHoverCard.Trigger>, 'asChild' | 'children'> {
  /** One element that takes focus and works on its own: a link to the page or the profile the card previews. */
  children: ReactElement;
}

/** The link the card previews. Renders its child (always asChild). */
export function HoverCardTrigger({ children, onFocus, ...rest }: HoverCardTriggerProps) {
  const ctx = useHoverCardContext('HoverCardTrigger');
  return (
    <RadixHoverCard.Trigger
      {...rest}
      // Radix waits openDelay on focus as on hover. Keyboard focus opens at once,
      // and preventDefault stops the Radix focus handler, whose openDelay timer
      // would open the card again after an early Escape (WCAG 1.4.13).
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented) return;
        ctx.setOpen(true);
        event.preventDefault();
      }}
      asChild
    >
      {children}
    </RadixHoverCard.Trigger>
  );
}

// ------------------------------------------------------------------ HoverCardContent

export interface HoverCardContentProps
  extends Omit<ComponentProps<typeof RadixHoverCard.Content>, 'asChild' | 'forceMount' | 'side' | 'align' | 'children' | 'sideOffset'> {
  /** The preferred side. start and end follow the reading direction. It flips when there is no room. Default bottom. */
  side?: HoverCardSide;
  /** Alignment along the trigger, mirrored in right to left layouts. Default start. */
  align?: HoverCardAlign;
  /** Distance from the trigger in px, the arrow included. Default 8. */
  sideOffset?: number;
  /** Shows the arrow. Default true. */
  arrow?: boolean;
  /** The preview, rendered in part body. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * The portal and the root (`data-ds="hover-card"`, the Radix Content). It
 * carries data-size, data-state, data-side and data-align; the children go
 * in part body. ref, className, style and every other prop go to the root.
 */
export function HoverCardContent({
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
  arrow = true,
  children,
  ref,
  collisionPadding = 8,
  hideWhenDetached = true,
  ...rest
}: HoverCardContentProps) {
  const ctx = useHoverCardContext('HoverCardContent');
  const theme = useTheme();
  const [mounted, presenceRef] = useLayerPresence(ctx.open);
  const userRef = useRef(ref);
  userRef.current = ref;
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      presenceRef(node);
      assignRef(userRef.current, node);
    },
    [presenceRef],
  );

  if (!mounted) return null;

  return (
    <ThemedPortal layer="hover-card">
      <RadixHoverCard.Content
        {...rest}
        ref={setRef}
        data-ds="hover-card"
        data-size={ctx.size}
        side={physicalSide(side, theme.dir)}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        hideWhenDetached={hideWhenDetached}
      >
        <div data-part="body">{children}</div>
        {arrow && (
          <RadixHoverCard.Arrow asChild>
            <ArrowShape />
          </RadixHoverCard.Arrow>
        )}
      </RadixHoverCard.Content>
    </ThemedPortal>
  );
}
