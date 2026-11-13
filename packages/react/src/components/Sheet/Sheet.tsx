'use client';
// Sheet: a panel that rises from the block end (the bottom), for phone
// layouts and quick tasks. Built on Radix Dialog through DialogBase (the
// themed portal, the focus rule and return, toasts above, Dialog.css).
//
// No source: designed from the dials table (PLAN.md 3.7) and Dialog, with
// radius.sheet. Detents are wave 2. The handle can be dragged down to close
// the sheet; the close control and Escape are its key path (WCAG 2.5.7), so
// the handle itself is hidden from assistive tech and out of the tab order.
//
//   <body>
//     <div data-ds="theme" data-dialog-layer>
//       <div data-ds="sheet" data-size data-state data-dragging>   style --_sheet-toast-end while top toasts show
//         <div data-part="backdrop">                  Radix Overlay
//         <div data-part="panel" role="dialog">       Radix Content
//           <div data-part="handle" aria-hidden>
//           <div data-part="header">
//             <h2 data-part="title">
//             <p data-part="description">
//             <button data-ds="close-button" data-part="close">
//           <div data-part="body">
//           <div data-part="footer">
//
// The drag: pointer events on the handle with pointer capture. While it
// moves, the panel's --_dialog-drag-y follows the pointer (never above its
// open place) and the root carries data-dragging, which turns the snap
// transition off. On release past a quarter of the panel's height, or on a
// quick flick down, the sheet closes and its exit plays from where it is;
// otherwise it snaps back. With dismissible false it always snaps back.
// Order 1.23: a rubber band. Above its open place the panel follows a
// third of the pointer travel (RUBBER_SHARE), so the sheet gives a little
// and springs back instead of not moving; with dismissible false, a drag
// down gives the same third, so a refused close is felt as well.
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import type { OverlaySize } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { DialogBody, DialogFooter, type DialogBodyProps, type DialogFooterProps } from '../Dialog';
import { DialogBase, assignRef, usePanelElement, type DialogBaseState } from '../Dialog/DialogBase';
import { isArabic, splitHeader } from '../Drawer/Drawer';
import { useControllable } from '../../internal/useControllable';

export type SheetSize = Extract<OverlaySize, 'sm' | 'md' | 'lg'>;

const sheetLabels = {
  en: { close: 'Close sheet' },
  ar: { close: 'إغلاق النافذة السفلية' },
} as const;

/** Past this share of the panel's height, a release closes the sheet. */
const DISMISS_SHARE = 0.25;
/** A flick: px per ms downward, over at least a few px. */
const FLICK_SPEED = 0.5;
const FLICK_MIN = 8;

interface SheetContextValue extends DialogBaseState {
  size: SheetSize;
}

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext(name: string): SheetContextValue {
  const ctx = use(SheetContext);
  if (!ctx) throw new Error(`${name} must be used inside a Sheet.`);
  return ctx;
}

// ------------------------------------------------------------------ Sheet

export interface SheetProps {
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with false for Escape, a backdrop click, the close control, SheetClose and a drag down. */
  onOpenChange?: (open: boolean) => void;
  /** The most of the screen's height it takes: sm half, md three quarters, lg all of it under a gap. Default md. */
  size?: SheetSize;
  /** false: only the sheet's own actions close it; Escape, the backdrop and a drag do nothing. Default true. */
  dismissible?: boolean;
  children?: ReactNode;
}

/** The root: state and the size. Renders no element of its own. */
export function Sheet({ open: openProp, defaultOpen = false, onOpenChange, size = 'md', dismissible = true, children }: SheetProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const triggerRef = useRef<HTMLElement | null>(null);
  const value = useMemo<SheetContextValue>(
    () => ({ open, setOpen, size, dismissible, triggerRef }),
    [open, setOpen, size, dismissible],
  );
  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <SheetContext value={value}>{children}</SheetContext>
    </RadixDialog.Root>
  );
}

// ------------------------------------------------------------------ trigger and close

export interface SheetTriggerProps extends Omit<ComponentProps<typeof RadixDialog.Trigger>, 'asChild' | 'children'> {
  /** One element, a system Button, that opens the sheet. */
  children: ReactElement;
}

/** Opens the sheet. Renders its child, a Button. Focus returns to it on close. */
export function SheetTrigger({ children, ref, ...rest }: SheetTriggerProps) {
  const ctx = useSheetContext('SheetTrigger');
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      ctx.triggerRef.current = node;
      assignRef(ref, node);
    },
    [ctx.triggerRef, ref],
  );
  return (
    <RadixDialog.Trigger {...rest} ref={setRef} asChild>
      {children}
    </RadixDialog.Trigger>
  );
}

export interface SheetCloseProps extends Omit<ComponentProps<typeof RadixDialog.Close>, 'asChild' | 'children'> {
  /** One element, a system Button: Cancel, or Done. */
  children: ReactElement;
}

/** Closes the sheet. Renders its child, a Button, marked data-dialog-cancel. */
export function SheetClose({ children, ...rest }: SheetCloseProps) {
  return (
    <RadixDialog.Close {...rest} data-dialog-cancel="" asChild>
      {children}
    </RadixDialog.Close>
  );
}

// ------------------------------------------------------------------ parts

export type SheetTitleProps = Omit<ComponentProps<'h2'>, 'title'>;

/** The title. It names the sheet. Put it as a direct child of SheetContent, or use the title prop. */
export function SheetTitle(props: SheetTitleProps) {
  return <RadixDialog.Title {...props} data-part="title" />;
}

export type SheetDescriptionProps = ComponentProps<'p'>;

/** One line under the title. It describes the sheet. */
export function SheetDescription(props: SheetDescriptionProps) {
  return <RadixDialog.Description {...props} data-part="description" />;
}

export type SheetBodyProps = DialogBodyProps;

/** The content. It scrolls inside; while it scrolls it joins the tab order. */
export function SheetBody(props: SheetBodyProps) {
  return <DialogBody {...props} />;
}

export type SheetFooterProps = DialogFooterProps;

/** The actions at the inline end. Cancel first, the primary action last. */
export function SheetFooter(props: SheetFooterProps) {
  return <DialogFooter {...props} />;
}

// ------------------------------------------------------------------ handle

/** The share of the pointer travel the panel follows past where it may go. */
export const RUBBER_SHARE = 1 / 3;

interface Drag {
  id: number;
  startY: number;
  dy: number;
  /** The last move, for the speed of a flick at the end of the drag. */
  lastY: number;
  lastTime: number;
  speed: number;
}

/** The drag handle: a pointer path only (the close control and Escape are the key path). */
function SheetHandle({ onDragging, dismissible, onDismiss }: { onDragging: (on: boolean) => void; dismissible: boolean; onDismiss: () => void }) {
  const panelRef = usePanelElement();
  const drag = useRef<Drag | null>(null);

  const reset = () => panelRef?.current?.style.removeProperty('--_dialog-drag-y');

  const end = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    onDragging(false);
    const panel = panelRef?.current;
    if (!panel) return;
    const height = panel.getBoundingClientRect().height;
    const far = d.dy > height * DISMISS_SHARE;
    const flick = d.speed > FLICK_SPEED && d.dy > FLICK_MIN;
    if (!cancelled && dismissible && (far || flick)) {
      // The offset stays while it closes, so the exit plays from where the
      // panel is. A controlled parent that keeps it open gets it back in place.
      onDismiss();
      queueMicrotask(() => {
        if (panel.isConnected && panel.getAttribute('data-state') === 'open') reset();
      });
    } else reset();
  };

  return (
    <div
      data-part="handle"
      aria-hidden="true"
      onPointerDown={(event) => {
        if (event.button !== 0 || !panelRef?.current) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        drag.current = { id: event.pointerId, startY: event.clientY, dy: 0, lastY: event.clientY, lastTime: event.timeStamp, speed: 0 };
        onDragging(true);
      }}
      onPointerMove={(event) => {
        const d = drag.current;
        if (!d || d.id !== event.pointerId) return;
        // Down follows the pointer; up, and down on a sheet that will not close, give a third (the rubber band).
        const raw = event.clientY - d.startY;
        d.dy = raw < 0 || !dismissible ? raw * RUBBER_SHARE : raw;
        // Speed over the last move only: a slow start and a quick flick still count as a flick.
        d.speed = (event.clientY - d.lastY) / Math.max(1, event.timeStamp - d.lastTime);
        d.lastY = event.clientY;
        d.lastTime = event.timeStamp;
        panelRef?.current?.style.setProperty('--_dialog-drag-y', `${d.dy}px`);
      }}
      onPointerUp={(event) => end(event, false)}
      onPointerCancel={(event) => end(event, true)}
      onLostPointerCapture={(event) => end(event, true)}
    />
  );
}

// ------------------------------------------------------------------ toast clearance

/**
 * Where the toasts of a toaster on the top edge end, in px from the top of
 * the viewport, or 0 when none show. While a Sheet is open a bottom toaster
 * moves to the top edge (Dialog.css), and an lg Sheet reaches the top: the
 * root's top padding then keeps the panel, with its close control, below the
 * toasts (WCAG 2.4.11). Only the toaster's public data-ds is read.
 */
function useTopToastEnd(open: boolean): number {
  const [end, setEnd] = useState(0);
  useEffect(() => {
    if (!open || typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      let bottom = 0;
      for (const toaster of document.querySelectorAll<HTMLElement>("[data-ds='toaster']")) {
        if (!toaster.querySelector("[data-ds='toast']")) continue;
        const rect = toaster.getBoundingClientRect();
        // A toaster in the lower half sits on the bottom edge: the Sheet has its own place for that.
        if (rect.height === 0 || rect.top > window.innerHeight / 2) continue;
        bottom = Math.max(bottom, rect.bottom);
      }
      // At most half the screen: a tall stack on a short screen must not squeeze the panel away (WCAG 1.4.10).
      setEnd(Math.ceil(Math.min(bottom, window.innerHeight / 2)));
    };
    // One measure per frame, however many changes the page makes in it.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const sizes = new ResizeObserver(schedule);
    const watch = () => {
      sizes.disconnect();
      for (const toaster of document.querySelectorAll("[data-ds='toaster']")) sizes.observe(toaster);
      schedule();
    };
    // Only changes that add or remove a toaster or a toast matter.
    const touchesToasts = (nodes: NodeList) =>
      Array.from(nodes).some((n) => n instanceof Element && (n.matches("[data-ds='toaster'], [data-ds='toast']") || n.querySelector("[data-ds='toaster']") !== null));
    const tree = new MutationObserver((records) => {
      if (records.some((r) => touchesToasts(r.addedNodes) || touchesToasts(r.removedNodes))) watch();
    });
    tree.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    watch();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      tree.disconnect();
      sizes.disconnect();
      window.removeEventListener('resize', schedule);
      setEnd(0);
    };
  }, [open]);
  return open ? end : 0;
}

// ------------------------------------------------------------------ SheetContent

export interface SheetContentProps
  extends Omit<
    ComponentProps<typeof RadixDialog.Content>,
    'title' | 'asChild' | 'forceMount' | 'className' | 'style' | 'children'
  > {
  /** The title, for the common case. The same as a SheetTitle child. */
  title?: ReactNode;
  /** The description, for the common case. The same as a SheetDescription child. */
  description?: ReactNode;
  /** Accessible name of the close control. Default "Close sheet" (Arabic under lang ar). */
  closeLabel?: string;
  /** SheetTitle, SheetDescription, SheetBody, SheetFooter. */
  children?: ReactNode;
  /** Class name of the root, the layer that holds the backdrop and the panel. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
}

/**
 * The portal, the backdrop and the panel. The root (`data-ds="sheet"`)
 * carries data-size, data-state and data-dragging. `ref` and the Radix
 * Content props go to the panel; className, style and rootProps go to the
 * root.
 */
export function SheetContent({ title, description, closeLabel, children, className, style, rootProps, ref, ...rest }: SheetContentProps) {
  const ctx = useSheetContext('SheetContent');
  const theme = useTheme();
  const words = isArabic(theme.lang) ? sheetLabels.ar : sheetLabels.en;
  const [dragging, setDragging] = useState(false);
  const toastEnd = useTopToastEnd(ctx.open);
  const rootStyle = toastEnd > 0 ? ({ ...style, '--_sheet-toast-end': `${toastEnd}px` } as CSSProperties) : style;
  const { header, others } = splitHeader({
    children,
    title,
    description,
    Title: SheetTitle,
    Description: SheetDescription,
    closeLabel: closeLabel ?? words.close,
    closeDisabled: !ctx.dismissible,
  });
  const { onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onInteractOutside, onFocusOutside, onKeyDown, ...panelProps } = rest;
  return (
    <DialogBase
      state={ctx}
      kind="sheet"
      devName="Sheet"
      rootAttributes={{ 'data-size': ctx.size, 'data-dragging': dragging }}
      Backdrop={RadixDialog.Overlay}
      Panel={RadixDialog.Content}
      panelProps={panelProps}
      panelRef={ref}
      className={className}
      style={rootStyle}
      rootProps={rootProps}
      onOpenAutoFocus={onOpenAutoFocus}
      onCloseAutoFocus={onCloseAutoFocus}
      onEscapeKeyDown={onEscapeKeyDown}
      onPointerDownOutside={onPointerDownOutside}
      onInteractOutside={onInteractOutside}
      onFocusOutside={onFocusOutside}
      onKeyDown={onKeyDown}
    >
      <SheetHandle onDragging={setDragging} dismissible={ctx.dismissible} onDismiss={() => ctx.setOpen(false)} />
      {header}
      {others}
    </DialogBase>
  );
}
