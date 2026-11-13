'use client';
// Sheet: a panel that rises from the block end (the bottom), for phone
// layouts and quick tasks. Built on Radix Dialog through DialogBase (the
// themed portal, the focus rule and return, toasts above, Dialog.css).
//
// No source: designed from the dials table (PLAN.md 3.7) and Dialog, with
// radius.sheet. The handle can be dragged down to close the sheet; the close
// control and Escape are its key path (WCAG 2.5.7), so with no detents the
// handle itself is hidden from assistive tech and out of the tab order.
//
// Detents (order 1.29). With the `detents` prop (fractions of the viewport
// height, or px, smallest first) the sheet rests at one of those heights:
// the root carries data-detent (the index of the current one) and the
// working values --_dialog-detent-height (its height) and --_dialog-detent-max
// (the largest). The panel is as tall as the largest; a smaller detent moves
// it down by transform, so motion stays on transform. The handle is then a
// native button in the tab order (still part `handle`): ArrowUp and ArrowDown
// step through the detents, Home and End go to the ends, Enter, Space and a
// click take the next one, round to the smallest (the button path for the
// drag, WCAG 2.5.7). A drag follows the pointer between the detents, gives a
// rubber band past the largest (into --_dialog-drag-y), and on release
// settles on the detent nearest to where it would coast, by position and
// speed (helpers/sheet-detents.ts in @the-system/motion, shared with
// Angular). When the sheet may close, a flick or a drag well below the
// smallest detent closes it.
//
//   <body>
//     <div data-ds="theme" data-dialog-layer>
//       <div data-ds="sheet" data-size data-state data-dragging data-detent>   style --_sheet-toast-end while top toasts show
//         <div data-part="backdrop">                  Radix Overlay
//         <div data-part="panel" role="dialog">       Radix Content
//           <div data-part="handle" aria-hidden>       no detents: a pointer path only
//           <button data-part="handle" type="button" aria-label>   with detents: the button path
//             <span data-part="handle-bar">            order 1.23: the drawn bar, so it can take a radius
//           <div data-part="titlebar" data-ds="title-bar">   order 1.29, optional part: replaces the header
//             <div data-part="controls"><WindowControls/></div>   optional part
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
// The speed is read over the last 100ms with the release as the last sample
// (order 1.29, review 3 N28), so a drag that pauses before the release has
// no speed left and never counts as a flick.
// Order 1.23: a rubber band. Above its open place the panel follows a
// third of the pointer travel (RUBBER_SHARE), so the sheet gives a little
// and springs back instead of not moving; with dismissible false, a drag
// down gives the same third, so a refused close is felt as well.
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { useOptionalPart, useTheme } from '../../theme/hooks';
import { TitleBar } from '../TitleBar';
import { WindowControls } from '../WindowControls';
import { DialogBody, DialogFooter, type DialogBodyProps, type DialogFooterProps } from '../Dialog';
import { DialogBase, assignRef, usePanelElement, type DialogBaseState } from '../Dialog/DialogBase';
import { isArabic, splitHeader } from '../Drawer/Drawer';
import { useControllable } from '../../internal/useControllable';
import {
  detentDragOffset,
  detentForKey,
  detentHeights,
  dragCloses,
  dragVelocity,
  settleDetent,
  type Detent,
  type DragSample,
} from '@the-system/motion';

export type SheetSize = Extract<OverlaySize, 'sm' | 'md' | 'lg'>;

const sheetLabels = {
  en: {
    close: 'Close sheet',
    size: (n: number, of: number) => `Sheet size, ${n} of ${of}`,
    controls: 'Sheet controls',
    minimize: 'Minimize sheet',
    zoom: 'Zoom sheet',
  },
  ar: {
    close: 'إغلاق النافذة السفلية',
    size: (n: number, of: number) => `حجم النافذة السفلية، ${n} من ${of}`,
    controls: 'أزرار النافذة السفلية',
    minimize: 'تصغير النافذة السفلية',
    zoom: 'تكبير النافذة السفلية',
  },
} as const;

interface SheetContextValue extends DialogBaseState {
  size: SheetSize;
  detents: readonly Detent[] | undefined;
  detent: number;
  setDetent: (index: number) => void;
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
  /**
   * The heights the sheet rests at, smallest first: a fraction of the
   * viewport height (0.5 is half) or px (320). With detents the size only
   * names the sizing family; the largest detent sets the panel's height,
   * clamped to the room under the top gap. Default none.
   */
  detents?: readonly Detent[];
  /** Controlled detent, an index into detents, with onDetentChange. */
  detent?: number;
  /** The detent it opens at. Default 0, the smallest. */
  defaultDetent?: number;
  /** Called with the index of the detent the sheet settles at. */
  onDetentChange?: (index: number) => void;
  children?: ReactNode;
}

/** The root: state and the size. Renders no element of its own. */
export function Sheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  size = 'md',
  dismissible = true,
  detents,
  detent: detentProp,
  defaultDetent = 0,
  onDetentChange,
  children,
}: SheetProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [detent, setDetent] = useControllable(detentProp, defaultDetent, onDetentChange);
  const triggerRef = useRef<HTMLElement | null>(null);
  const value = useMemo<SheetContextValue>(
    () => ({ open, setOpen, size, dismissible, triggerRef, detents, detent, setDetent }),
    [open, setOpen, size, dismissible, detents, detent, setDetent],
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

/** Where a title renders: in the header, or inside the optional title bar's heading. */
const SheetTitleSlot = createContext<'header' | 'titlebar'>('header');

/** The title. It names the sheet. Put it as a direct child of SheetContent, or use the title prop. */
export function SheetTitle({ children, ...props }: SheetTitleProps) {
  if (use(SheetTitleSlot) === 'titlebar') {
    // Inside the optional title bar heading (TitleBar renders the h2 and its part).
    return (
      <RadixDialog.Title asChild>
        <span {...(props as ComponentProps<'span'>)} data-dialog-title="">
          {children}
        </span>
      </RadixDialog.Title>
    );
  }
  return (
    <RadixDialog.Title {...props} data-part="title">
      {children}
    </RadixDialog.Title>
  );
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

/** The share of the pointer travel the panel follows past where it may go (no detents). */
export const RUBBER_SHARE = 1 / 3;

/** Movement before a press on the detent handle counts as a drag, not a click, in px. */
const CLICK_SLOP = 4;

interface Drag {
  id: number;
  startY: number;
  /** The drawn offset, px down. */
  dy: number;
  /** The gesture, for its speed at the release (helpers/sheet-detents.ts). */
  samples: DragSample[];
  moved: boolean;
}

interface DetentHandle {
  /** The detent heights in px, smallest first. */
  heights: readonly number[];
  index: number;
  label: string;
  onSettle: (index: number) => void;
}

/**
 * The drag handle. With no detents a pointer path only (the close control
 * and Escape are the key path). With detents a native button: the keys and
 * a click move between the detents (the button path).
 */
function SheetHandle({
  onDragging,
  dismissible,
  onDismiss,
  detents,
}: {
  onDragging: (on: boolean) => void;
  dismissible: boolean;
  onDismiss: () => void;
  detents?: DetentHandle;
}) {
  const panelRef = usePanelElement();
  const drag = useRef<Drag | null>(null);
  /** Set by a drag that moved, so the click that follows its release does not also step. */
  const dragged = useRef(false);

  const reset = () => panelRef?.current?.style.removeProperty('--_dialog-drag-y');

  const end = (event: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    onDragging(false);
    dragged.current = d.moved;
    const panel = panelRef?.current;
    if (!panel) return;
    // The release is the last sample: a pointer that rested before it lifted has no speed left (N28).
    d.samples.push({ t: event.timeStamp, y: d.samples[d.samples.length - 1]?.y ?? d.startY });
    const velocity = dragVelocity(d.samples);
    const close = () => {
      // The offset stays while it closes, so the exit plays from where the
      // panel is. A controlled parent that keeps it open gets it back in place.
      onDismiss();
      queueMicrotask(() => {
        if (panel.isConnected && panel.getAttribute('data-state') === 'open') reset();
      });
    };
    if (cancelled) return reset();
    if (detents && detents.heights.length > 0) {
      const rest = detents.heights[detents.index] ?? detents.heights[0] ?? 0;
      const to = settleDetent(detents.heights, rest, d.dy, velocity, dismissible);
      if (to.kind === 'close') return close();
      reset();
      detents.onSettle(to.index);
      return;
    }
    const height = panel.getBoundingClientRect().height;
    if (dismissible && dragCloses(d.dy, velocity, height)) close();
    else reset();
  };

  const pointerProps = {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || !panelRef?.current) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      drag.current = { id: event.pointerId, startY: event.clientY, dy: 0, samples: [{ t: event.timeStamp, y: event.clientY }], moved: false };
      dragged.current = false;
      onDragging(true);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d || d.id !== event.pointerId) return;
      const raw = event.clientY - d.startY;
      if (Math.abs(raw) > CLICK_SLOP) d.moved = true;
      if (detents && detents.heights.length > 0) {
        const rest = detents.heights[detents.index] ?? detents.heights[0] ?? 0;
        d.dy = detentDragOffset(raw, rest, detents.heights, dismissible);
      } else {
        // Down follows the pointer; up, and down on a sheet that will not close, give a third (the rubber band).
        d.dy = raw < 0 || !dismissible ? raw * RUBBER_SHARE : raw;
      }
      d.samples.push({ t: event.timeStamp, y: event.clientY });
      if (d.samples.length > 16) d.samples.shift();
      panelRef?.current?.style.setProperty('--_dialog-drag-y', `${d.dy}px`);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => end(event, false),
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => end(event, true),
    onLostPointerCapture: (event: ReactPointerEvent<HTMLElement>) => end(event, true),
  };

  if (!detents) {
    return (
      <div data-part="handle" aria-hidden="true" {...pointerProps}>
        <span data-part="handle-bar" />
      </div>
    );
  }

  const count = detents.heights.length;
  return (
    <button
      type="button"
      data-part="handle"
      aria-label={detents.label}
      {...pointerProps}
      onClick={() => {
        // A drag that moved is not a click; a press without one, Enter and Space step.
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        const next = detentForKey('Enter', detents.index, count);
        if (next !== null) detents.onSettle(next);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') return;
        const next = detentForKey(event.key, detents.index, count);
        if (next === null) return;
        event.preventDefault();
        detents.onSettle(next);
      }}
    >
      <span data-part="handle-bar" />
    </button>
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
 * carries data-size, data-state, data-dragging and, with detents,
 * data-detent. `ref` and the Radix
 * Content props go to the panel; className, style and rootProps go to the
 * root.
 */
export function SheetContent({ title, description, closeLabel, children, className, style, rootProps, ref, ...rest }: SheetContentProps) {
  const ctx = useSheetContext('SheetContent');
  const theme = useTheme();
  const words = isArabic(theme.lang) ? sheetLabels.ar : sheetLabels.en;
  const [dragging, setDragging] = useState(false);
  const toastEnd = useTopToastEnd(ctx.open);
  // The panel as state, so the detents are measured again once the portal has mounted it.
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null);
  const setPanel = useCallback(
    (node: HTMLDivElement | null) => {
      setPanelEl(node);
      assignRef(ref, node);
    },
    [ref],
  );
  const heights = useDetentHeights(ctx.open ? ctx.detents : undefined, panelEl);
  const detentIndex = heights.length > 0 ? Math.max(0, Math.min(heights.length - 1, ctx.detent)) : -1;
  const detentStyle: Record<string, string> = {};
  if (detentIndex >= 0) {
    detentStyle['--_dialog-detent-height'] = `${heights[detentIndex]}px`;
    detentStyle['--_dialog-detent-max'] = `${heights[heights.length - 1]}px`;
  }
  if (toastEnd > 0) detentStyle['--_sheet-toast-end'] = `${toastEnd}px`;
  const rootStyle = Object.keys(detentStyle).length > 0 ? ({ ...style, ...detentStyle } as CSSProperties) : style;
  const titlebarOn = useOptionalPart('sheet', 'titlebar');
  const controlsOn = useOptionalPart('sheet', 'controls');
  const split = splitHeader({
    children,
    title,
    description,
    Title: SheetTitle,
    Description: SheetDescription,
    closeLabel: closeLabel ?? words.close,
    closeDisabled: !ctx.dismissible,
  });
  const { others } = split;
  // With the style's title bar (order 1.29, Dialog's pattern): the bar with the title, then the description.
  const header = titlebarOn ? (
    <>
      <TitleBar
        data-part="titlebar"
        as={split.titleNode ? 'h2' : 'div'}
        title={<SheetTitleSlot value="titlebar">{split.titleNode}</SheetTitleSlot>}
        controls={
          controlsOn ? (
            <WindowControls
              label={words.controls}
              closeLabel={closeLabel ?? words.close}
              minimizeLabel={words.minimize}
              zoomLabel={words.zoom}
              onClose={() => ctx.setOpen(false)}
              closeDisabled={!ctx.dismissible}
            />
          ) : undefined
        }
        actions={controlsOn ? undefined : split.closeButton}
      />
      {split.descriptionNode}
    </>
  ) : (
    split.header
  );
  const { onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onInteractOutside, onFocusOutside, onKeyDown, ...panelProps } = rest;
  return (
    <DialogBase
      state={ctx}
      kind="sheet"
      devName="Sheet"
      rootAttributes={{
        'data-size': ctx.size,
        'data-dragging': dragging,
        'data-detent': detentIndex >= 0 ? String(detentIndex) : undefined,
      }}
      Backdrop={RadixDialog.Overlay}
      Panel={RadixDialog.Content}
      panelProps={panelProps}
      panelRef={setPanel}
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
      <SheetHandle
        onDragging={setDragging}
        dismissible={ctx.dismissible}
        onDismiss={() => ctx.setOpen(false)}
        detents={
          ctx.detents
            ? {
                heights,
                index: Math.max(0, detentIndex),
                label: words.size(Math.max(0, detentIndex) + 1, Math.max(1, heights.length)),
                onSettle: ctx.setDetent,
              }
            : undefined
        }
      />
      {header}
      {others}
    </DialogBase>
  );
}

// ------------------------------------------------------------------ detent heights

/**
 * The detent heights in px, smallest first, from the viewport height and the
 * room under the root's top gap (helpers/sheet-detents.ts). Measured when
 * the panel mounts and on every resize; empty with no detents.
 */
function useDetentHeights(detents: readonly Detent[] | undefined, panel: HTMLDivElement | null): number[] {
  const [heights, setHeights] = useState<number[]>([]);
  const key = detents?.join(',') ?? '';
  useLayoutEffect(() => {
    if (!key) {
      setHeights([]);
      return;
    }
    const list = key.split(',').map(Number);
    const measure = () => {
      const root = panel?.parentElement;
      const viewport = window.innerHeight;
      let room = viewport;
      if (root) {
        const cs = getComputedStyle(root);
        const inner = root.clientHeight - (Number.parseFloat(cs.paddingTop) || 0) - (Number.parseFloat(cs.paddingBottom) || 0);
        if (inner > 0) room = inner;
      }
      const next = detentHeights(list, viewport, room);
      setHeights((prev) => (prev.length === next.length && prev.every((h, i) => h === next[i]) ? prev : next));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [key, panel]);
  return heights;
}
