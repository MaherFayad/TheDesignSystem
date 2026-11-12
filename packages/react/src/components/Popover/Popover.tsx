'use client';
// Popover: non modal content anchored to a trigger, for a small form or
// details. Built on Radix Popover (positioning, collision handling, Escape,
// outside click, focus into the content and back to the trigger).
//
// Sources: GoBanana could not be fetched in this session, so the look comes
// from Figma-Killer-2 `ui/components/InspectorPopover` (the surface, the
// panel radius and shadow, the title band, the scrolling body, the enter
// motion from 97%) and the dials table of PLAN.md 3.7 (Desk: glass).
//
// The DOM:
//
//   <body>
//     <div data-ds="theme" data-popover-layer>        the portal Theme, display: contents
//       <div data-radix-popper-content-wrapper>       Radix: positions the content
//         <div data-ds="popover" role="dialog" data-size data-state data-side data-align>   root: Radix Content
//           <h2 data-part="title">
//           <button data-part="close" data-ds="icon-button">
//           <div data-part="body">
//           <div data-part="footer">
//           <span><svg data-part="arrow"></span>        Radix Arrow, positioned by Radix
//
// The root is the Radix Content itself (the order's anatomy). It is not
// modal: the page stays usable, Tab leaves the popover at its end, and a
// click outside closes it.
//
// Focus on open: an element marked data-autofocus, else the first field in
// the body, else the first footer action, else the root itself. Never the
// close control first: it is the last way out, Escape is the first.
//
// Motion, pattern "menu-scale" (Popover.css): the root scales up from 97%
// toward the trigger side from the Radix transform origin while it fades.
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
import { Popover as RadixPopover } from 'radix-ui';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { IconButton } from '../IconButton';
import { useControllable } from '../Window/useControllable';
import {
  ArrowShape,
  ThemedPortal,
  isArabic,
  physicalSide,
  useLayerPresence,
  type FloatingAlign,
  type FloatingSide,
} from './FloatingLayer';

export type PopoverSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type PopoverSide = FloatingSide;
export type PopoverAlign = FloatingAlign;

const popoverLabels = {
  en: { close: 'Close popover' },
  ar: { close: 'إغلاق النافذة' },
} as const;

/** Fields first, then actions: where focus goes when the popover opens. */
const FIELD_SELECTOR =
  'input:not([type="hidden"]), select, textarea, [role="switch"], [role="checkbox"], [role="radio"], [role="combobox"], [role="slider"], [contenteditable="true"]';
const ACTION_SELECTOR = 'button, a[href], [tabindex]:not([tabindex="-1"])';

function firstUsable(scope: Element | null | undefined, selector: string): HTMLElement | null {
  if (!scope) return null;
  for (const el of Array.from(scope.querySelectorAll<HTMLElement>(selector))) {
    if (el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true' || el.closest('[hidden], [inert]')) continue;
    return el;
  }
  return null;
}

/** The first `[data-part=<part>]` of this root, not of a popover nested inside it. */
function ownPart(root: HTMLElement, part: string): HTMLElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLElement>(`[data-part="${part}"]`)).find(
      (el) => el.parentElement?.closest('[data-ds="popover"]') === root,
    ) ?? null
  );
}

/** The popover focus rule (manifest Popover a11y.focus). Null: the root itself. */
export function popoverInitialFocus(root: HTMLElement): HTMLElement | null {
  return (
    firstUsable(root, '[data-autofocus]') ??
    firstUsable(ownPart(root, 'body'), FIELD_SELECTOR) ??
    firstUsable(ownPart(root, 'footer'), ACTION_SELECTOR) ??
    null
  );
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  size: PopoverSize;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(name: string): PopoverContextValue {
  const ctx = use(PopoverContext);
  if (!ctx) throw new Error(`${name} must be used inside a Popover.`);
  return ctx;
}

// ------------------------------------------------------------------ Popover

export interface PopoverProps {
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with false for Escape, an outside click, the close control and PopoverClose. */
  onOpenChange?: (open: boolean) => void;
  /** The width: sm 240, md 320, lg 440 px, never wider than the space beside the trigger. Default md. */
  size?: PopoverSize;
  children?: ReactNode;
}

/** The root: state and the size. Renders no element of its own. */
export function Popover({ open: openProp, defaultOpen = false, onOpenChange, size = 'md', children }: PopoverProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const value = useMemo<PopoverContextValue>(() => ({ open, setOpen, size }), [open, setOpen, size]);
  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen} modal={false}>
      <PopoverContext value={value}>{children}</PopoverContext>
    </RadixPopover.Root>
  );
}

// ------------------------------------------------------------------ PopoverTrigger

export interface PopoverTriggerProps extends Omit<ComponentProps<typeof RadixPopover.Trigger>, 'asChild' | 'children'> {
  /** One element, a system Button or IconButton, that opens the popover. */
  children: ReactElement;
}

/** Opens and closes the popover. Renders its child as the trigger (aria-haspopup dialog, aria-expanded). */
export function PopoverTrigger({ children, ...rest }: PopoverTriggerProps) {
  usePopoverContext('PopoverTrigger');
  return (
    <RadixPopover.Trigger {...rest} asChild>
      {children}
    </RadixPopover.Trigger>
  );
}

// ------------------------------------------------------------------ PopoverAnchor

export type PopoverAnchorProps = ComponentProps<typeof RadixPopover.Anchor>;

/** Positions the popover against this element instead of the trigger. */
export function PopoverAnchor(props: PopoverAnchorProps) {
  return <RadixPopover.Anchor {...props} />;
}

// ------------------------------------------------------------------ PopoverClose

export interface PopoverCloseProps extends Omit<ComponentProps<typeof RadixPopover.Close>, 'asChild' | 'children'> {
  /** One element, a system Button, that closes the popover. */
  children: ReactElement;
}

/** Closes the popover. Renders its child, a Button. */
export function PopoverClose({ children, ...rest }: PopoverCloseProps) {
  return (
    <RadixPopover.Close {...rest} asChild>
      {children}
    </RadixPopover.Close>
  );
}

// ------------------------------------------------------------------ parts

export type PopoverTitleProps = ComponentProps<'h2'>;

/** The title. It names the popover (aria-labelledby). */
export function PopoverTitle(props: PopoverTitleProps) {
  return <RadixPopover.Title {...props} data-part="title" />;
}

export type PopoverBodyProps = ComponentProps<'div'>;

/** The content. It scrolls inside when the popover reaches the space left in the viewport. */
export function PopoverBody(props: PopoverBodyProps) {
  return <div {...props} data-part="body" />;
}

export type PopoverFooterProps = ComponentProps<'div'>;

/** Up to two actions at the inline end. */
export function PopoverFooter(props: PopoverFooterProps) {
  return <div {...props} data-part="footer" />;
}

// ------------------------------------------------------------------ PopoverContent

export interface PopoverContentProps
  extends Omit<
    ComponentProps<typeof RadixPopover.Content>,
    'title' | 'asChild' | 'forceMount' | 'side' | 'align' | 'children' | 'sideOffset'
  > {
  /** The title, for the common case. The same as a PopoverTitle as the first child. */
  title?: ReactNode;
  /** The preferred side. start and end follow the reading direction. It flips when there is no room. Default bottom. */
  side?: PopoverSide;
  /** Alignment along the trigger. start and end follow the reading direction. Default center. */
  align?: PopoverAlign;
  /** Distance from the trigger in px, room for the arrow included. Default 8. */
  sideOffset?: number;
  /** Shows the arrow that points at the trigger. Default true. */
  arrow?: boolean;
  /** Shows the close IconButton (part close). Default true. Escape and an outside click always close. */
  close?: boolean;
  /** Accessible name of the close control. Default "Close popover" (Arabic under lang ar). */
  closeLabel?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * The portal and the root (`data-ds="popover"`, the Radix Content). It
 * carries data-size, data-state, data-side and data-align. `ref`, className,
 * style and every other prop go to the root.
 */
export function PopoverContent({
  title,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  arrow = true,
  close = true,
  closeLabel,
  children,
  ref,
  onOpenAutoFocus,
  onCloseAutoFocus,
  collisionPadding = 8,
  hideWhenDetached = false,
  ...rest
}: PopoverContentProps) {
  const ctx = usePopoverContext('PopoverContent');
  const theme = useTheme();
  const [mounted, presenceRef] = useLayerPresence(ctx.open);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // The consumer ref sits in a ref, so setRef keeps one identity: a new
  // inline ref during the exit never unmounts the portal early.
  const userRef = useRef(ref);
  userRef.current = ref;
  // What had focus on open: the fallback for focus return when there is no trigger (a PopoverAnchor only).
  const openedFrom = useRef<HTMLElement | null>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && !rootRef.current) {
        const active = node.ownerDocument.activeElement;
        openedFrom.current = active instanceof HTMLElement && active !== node.ownerDocument.body ? active : null;
      }
      rootRef.current = node;
      presenceRef(node);
      assignRef(userRef.current, node);
    },
    [presenceRef],
  );

  if (!mounted) return null;

  const closeName = closeLabel ?? (isArabic(theme.lang) ? popoverLabels.ar.close : popoverLabels.en.close);

  return (
    <ThemedPortal layer="popover">
      <RadixPopover.Content
        {...rest}
        ref={setRef}
        data-ds="popover"
        data-size={ctx.size}
        side={physicalSide(side, theme.dir)}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        hideWhenDetached={hideWhenDetached}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (event.defaultPrevented) return;
          // Radix returns focus to the trigger. With no trigger, back to what had focus on open.
          const doc = rootRef.current?.ownerDocument ?? document;
          const back = openedFrom.current;
          openedFrom.current = null;
          if (doc.activeElement && doc.activeElement !== doc.body) return;
          if (back?.isConnected) {
            event.preventDefault();
            back.focus();
          }
        }}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented || !rootRef.current) return;
          event.preventDefault();
          (popoverInitialFocus(rootRef.current) ?? rootRef.current).focus();
        }}
      >
        {title !== undefined && title !== null && <PopoverTitle>{title}</PopoverTitle>}
        {close && (
          <RadixPopover.Close asChild>
            <IconButton data-part="close" icon="close" label={closeName} size="xs" />
          </RadixPopover.Close>
        )}
        {children}
        {arrow && (
          <RadixPopover.Arrow asChild>
            <ArrowShape />
          </RadixPopover.Arrow>
        )}
      </RadixPopover.Content>
    </ThemedPortal>
  );
}
