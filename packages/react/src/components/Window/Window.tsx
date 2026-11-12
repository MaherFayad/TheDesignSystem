'use client';
// Window: an app window. A title bar, a body and an optional footer, that
// opens, closes, zooms, minimizes and moves.
//
// Sources: GoBanana `components/window/WindowLayer.tsx` (the layer, kinds,
// focus in and back, Escape), `components/window/motion.ts` (now
// packages/motion window patterns), `desktop/Window.tsx` (drag by the title
// bar, arrow keys move the window, clamp to view) and `FrameLights.tsx`.
//
// One markup for every style. Optional parts (style.json `optionalParts`):
// - `controls`: the traffic lights at the start of the title bar. Desk turns
//   it on. The close light is then part `close`.
// - Without `controls` (Studio), the title bar ends with an IconButton, part
//   `close`. So `close` is in every style: the light or the icon button.
// - `titlebar` is always rendered: it names the window and is the drag
//   handle. Desk also lists it in style.json, which changes nothing here.
//
// Motion comes from the style's preset (styleMotion.ts): Desk windows grow
// out of their origin, Studio panels fade. Web Animations API only, transform
// and opacity only, never waiting on an end event.
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import {
  arrowDelta,
  createWindowManager,
  minimizeTarget,
  moveFrame,
  type WindowBounds,
  type WindowManagerState,
  type WindowRect,
} from '@the-system/shared';
import { animateWindow, settle, settled } from '@the-system/motion';
import { useOptionalPart, useTheme } from '../../theme/hooks';
import { IconButton } from '../IconButton';
import { TitleBar, type TitleBarHeading } from '../TitleBar';
import { WindowControls } from '../WindowControls';
import { windowMotionMode } from './styleMotion';
import { useControllable } from './useControllable';
import { useWindowLayerContext } from './WindowLayer';

export type WindowKind = 'canvas' | 'finder' | 'settings';
export type WindowState = 'active' | 'inactive';
/** An element, a ref to one, or a screen rect. */
export type WindowAnchor = HTMLElement | RefObject<HTMLElement | null> | WindowRect | null;

export interface WindowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /**
   * Size and body padding. canvas: a large window with a margin of the layer
   * around it, no body padding. finder: wide, under the top edge. settings: a
   * centered window that fits its content. Default settings.
   */
  kind?: WindowKind;
  /** The title. It names the window (aria-labelledby). Long titles truncate. */
  title: ReactNode;
  /** The element of the title. Default h2. */
  titleAs?: TitleBarHeading;
  /** IconButtons or small Buttons at the end of the title bar. */
  actions?: ReactNode;
  /** The footer part, under the body: the window's Buttons. */
  footer?: ReactNode;
  /** The body. */
  children?: ReactNode;
  open?: boolean;
  /** Default true. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  zoomed?: boolean;
  defaultZoomed?: boolean;
  /** With it, or inside a WindowLayer, the zoom light works. */
  onZoomedChange?: (zoomed: boolean) => void;
  minimized?: boolean;
  defaultMinimized?: boolean;
  /**
   * With it the minimize light works. The app shows the way back (a dock, a
   * list) and sets minimized to false.
   */
  onMinimizedChange?: (minimized: boolean) => void;
  /**
   * Where the window sits in its layer: `x` from the inline start edge, `y`
   * from the top, in px. null lets the kind place it. Controlled with
   * onFrameChange.
   */
  frame?: WindowRect | null;
  defaultFrame?: WindowRect | null;
  onFrameChange?: (frame: WindowRect) => void;
  /** Drag by the title bar and move with the arrow keys. Default true inside a WindowLayer or with a frame. */
  movable?: boolean;
  /** What the window grows out of when it opens and shrinks into when it closes. Focus returns to it. */
  origin?: WindowAnchor;
  /** Where a minimized window goes: the dock. Default the bottom center of the layer. */
  dock?: WindowAnchor;
  /** aria-modal and a Tab loop inside the window. Default false. */
  modal?: boolean;
  /** Accessible name of the close control. Default "Close window", in Arabic "إغلاق النافذة". */
  closeLabel?: string;
  /** Accessible name of the minimize light. Default "Minimize window", in Arabic "تصغير النافذة". */
  minimizeLabel?: string;
  /** Accessible name of the zoom light. Default "Zoom window", in Arabic "تكبير النافذة". */
  zoomLabel?: string;
  /** Accessible name of the lights group. Default "Window controls", in Arabic "أزرار النافذة". */
  controlsLabel?: string;
  /** Accessible name of the move handle (the title, focusable while the window can move). Default "Move window", in Arabic "تحريك النافذة". */
  moveLabel?: string;
  /** Description of the move handle: its keys. Default names the arrow keys, Shift and, when zoom works, Enter. */
  moveHint?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The built in labels, per language, as Dialog and Toast have them. A prop
 * always wins. Arabic: noun form labels, no diacritics (the GoBanana Arabic
 * copy cookbook).
 */
const windowLabels = {
  en: {
    close: 'Close window',
    minimize: 'Minimize window',
    zoom: 'Zoom window',
    controls: 'Window controls',
    move: 'Move window',
    hint: 'Arrow keys move the window. Shift moves it further.',
    hintZoom: 'Arrow keys move the window. Shift moves it further. Enter zooms it.',
  },
  ar: {
    close: 'إغلاق النافذة',
    minimize: 'تصغير النافذة',
    zoom: 'تكبير النافذة',
    controls: 'أزرار النافذة',
    move: 'تحريك النافذة',
    hint: 'مفاتيح الأسهم لتحريك النافذة، ومع Shift لمسافة أبعد.',
    hintZoom: 'مفاتيح الأسهم لتحريك النافذة، ومع Shift لمسافة أبعد، وEnter لتكبيرها.',
  },
} as const;

function windowLabelsFor(lang: string) {
  return lang === 'ar' || lang.startsWith('ar-') ? windowLabels.ar : windowLabels.en;
}

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';

function isElement(anchor: object): anchor is HTMLElement {
  return 'getBoundingClientRect' in anchor;
}

function elementOf(anchor: WindowAnchor | undefined): HTMLElement | null {
  if (!anchor) return null;
  if (isElement(anchor)) return anchor;
  if ('current' in anchor) return anchor.current;
  return null;
}

function rectOf(anchor: WindowAnchor | undefined): WindowRect | null {
  if (!anchor) return null;
  if (isElement(anchor) || 'current' in anchor) {
    const el = elementOf(anchor);
    return el?.isConnected ? el.getBoundingClientRect() : null;
  }
  return anchor;
}

function boundsOf(el: HTMLElement | null): WindowBounds {
  return { width: el?.clientWidth ?? 0, height: el?.clientHeight ?? 0 };
}

/** The frame an element has now inside its container, `x` from the inline start edge. */
function measureFrame(el: HTMLElement, container: HTMLElement, dir: 'ltr' | 'rtl'): WindowRect {
  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  const x = dir === 'rtl' ? c.right - container.clientLeft - r.right : r.left - c.left - container.clientLeft;
  return { x, y: r.top - c.top - container.clientTop, width: r.width, height: r.height };
}

/**
 * After a window closes or minimizes, focus goes to the first of these that
 * is on the page: the origin, the next active window of the layer, the
 * element that had focus before the window opened, the dock, the layer. It
 * moves only when focus is inside the leaving window or lost on the page,
 * never away from an element the person moved to since.
 */
function focusAfterLeaving(candidates: (HTMLElement | null | undefined)[], from: HTMLElement | null): void {
  const now = document.activeElement;
  if (now && now !== document.body && !(from?.contains(now) ?? false)) return;
  for (const el of candidates) {
    if (!el?.isConnected || el === from || (from?.contains(el) ?? false) || el.closest('[hidden]')) continue;
    el.focus({ preventScroll: true });
    if (document.activeElement === el) return;
  }
}

/**
 * An app window. role dialog, named by its title, not modal by default.
 * Arrow keys move it while focus is on the window or in its title bar
 * (Shift for a larger step), Escape closes it, and focus goes back to the
 * origin or the element that had it.
 */
export function Window({
  kind = 'settings',
  title,
  titleAs = 'h2',
  actions,
  footer,
  children,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  zoomed: zoomedProp,
  defaultZoomed = false,
  onZoomedChange,
  minimized: minimizedProp,
  defaultMinimized = false,
  onMinimizedChange,
  frame: frameProp,
  defaultFrame = null,
  onFrameChange,
  movable: movableProp,
  origin,
  dock,
  modal = false,
  closeLabel: closeLabelProp,
  minimizeLabel: minimizeLabelProp,
  zoomLabel: zoomLabelProp,
  controlsLabel: controlsLabelProp,
  moveLabel: moveLabelProp,
  moveHint,
  id,
  style,
  ref,
  onKeyDown,
  onPointerDown,
  onFocus,
  'aria-label': ariaLabel,
  ...rest
}: WindowProps) {
  const reactId = useId();
  const windowId = id ?? `ds-window${reactId}`;
  const titleId = `${windowId}-title`;
  const layerCtx = useWindowLayerContext();
  const [ownManager] = useState(() => createWindowManager());
  const manager = layerCtx?.manager ?? ownManager;
  const managerState: WindowManagerState = useSyncExternalStore(manager.subscribe, manager.getState, manager.getState);
  const entry = managerState.windows[windowId];

  const theme = useTheme();
  const words = windowLabelsFor(theme.lang);
  const closeLabel = closeLabelProp ?? words.close;
  const minimizeLabel = minimizeLabelProp ?? words.minimize;
  const zoomLabel = zoomLabelProp ?? words.zoom;
  const controlsLabel = controlsLabelProp ?? words.controls;
  const moveLabel = moveLabelProp ?? words.move;
  const dir = theme.dir;
  const mode = windowMotionMode(theme.styleData.motionPreset);
  const controlsOn = useOptionalPart('window', 'controls');

  const [isOpen, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [zoomed, setZoomed] = useControllable(zoomedProp, defaultZoomed, onZoomedChange);
  const [minimized, setMinimized] = useControllable(minimizedProp, defaultMinimized, onMinimizedChange);
  const frame = frameProp !== undefined ? frameProp : (entry?.frame ?? defaultFrame);

  // Mounted while open, and while the close motion plays.
  const [present, setPresent] = useState(isOpen);
  if (isOpen && !present) setPresent(true);
  // Hidden once the minimize motion has played.
  const [folded, setFolded] = useState(minimized);
  if (!minimized && folded) setFolded(false);
  const [dragging, setDragging] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const titleBarRef = useRef<HTMLDivElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const minimizedRef = useRef(minimized);
  minimizedRef.current = minimized;
  const zoomedRef = useRef(zoomed);
  zoomedRef.current = zoomed;
  const frameRef = useRef(frame);
  frameRef.current = frame;
  // The values the last effect run saw. Compared, not counted, so the double
  // effect run of StrictMode does nothing twice.
  const prevOpen = useRef<boolean | null>(null);
  const lastRect = useRef<WindowRect | null>(null);
  const zoomFrom = useRef<WindowRect | null>(null);
  const drag = useRef<{ pointer: number; x: number; y: number; frame: WindowRect } | null>(null);

  const container = useCallback((): HTMLElement | null => {
    return layerCtx?.layer.current ?? (rootRef.current?.offsetParent as HTMLElement | null) ?? null;
  }, [layerCtx]);

  /** Where focus goes when this window closes or minimizes. */
  const leaveFocus = () => {
    const next = manager.getState().active;
    const nextEl = next && next !== windowId ? document.getElementById(next) : null;
    focusAfterLeaving([elementOf(origin), nextEl, returnTo.current, elementOf(dock), layerCtx?.layer.current], rootRef.current);
  };

  const movable = movableProp ?? (layerCtx !== null || frameProp != null || defaultFrame !== null);
  const canMove = movable && !zoomed;
  const active = layerCtx ? managerState.active === windowId : true;
  const zIndex = layerCtx ? managerState.order.indexOf(windowId) + 1 : undefined;
  const zoomable = layerCtx !== null || onZoomedChange !== undefined;
  const minimizable = onMinimizedChange !== undefined;

  // In the manager while open.
  useLayoutEffect(() => {
    if (!isOpen) return;
    manager.open(windowId, { frame: frameRef.current ?? null, zoomed: zoomedRef.current, minimized: minimizedRef.current });
    return () => manager.close(windowId);
  }, [isOpen, manager, windowId]);

  // Open: join the manager, grow out of the origin, move focus in.
  // Close: leave the manager, shrink back into the origin, then unmount.
  useLayoutEffect(() => {
    const el = rootRef.current;
    const prev = prevOpen.current;
    prevOpen.current = isOpen;
    if (prev === isOpen) return;
    const first = prev === null;
    if (isOpen) {
      if (!el || minimizedRef.current) return;
      const to = el.getBoundingClientRect();
      animateWindow(el, 'grow', { mode, from: rectOf(origin), to });
      // Focus moves in when the window opens after mount, or on mount when its origin has focus (it was just pressed).
      const originEl = elementOf(origin);
      if (!first || (originEl !== null && document.activeElement === originEl)) {
        returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        el.focus({ preventScroll: true });
      }
      return;
    }
    if (first || !el) return;
    const anim = animateWindow(el, 'close', { mode, from: el.getBoundingClientRect(), to: rectOf(origin) });
    void settled(anim).then(() => {
      if (isOpenRef.current) return;
      leaveFocus();
      setPresent(false);
    });
    // Runs on open changes only; the frame, origin and mode are read as they are then.
  }, [isOpen]);

  // Zoom: a FLIP from the frame the window had.
  // The move handle is rendered only while the window can move, so zoom
  // takes it away. Focus on it would drop to the body (WCAG 2.4.3): it goes
  // to the window element instead, and back to the handle on restore.
  const handleFocused = useRef(false);
  const backToHandle = useRef(false);
  const prevZoomed = useRef(zoomed);
  useLayoutEffect(() => {
    if (prevZoomed.current === zoomed) return;
    prevZoomed.current = zoomed;
    const el = rootRef.current;
    manager.zoom(windowId, boundsOf(container()), zoomed);
    if (!el) return;
    const lost = !document.activeElement || document.activeElement === document.body || !el.contains(document.activeElement);
    if (zoomed && handleFocused.current && lost) {
      backToHandle.current = true;
      el.focus({ preventScroll: true });
    } else if (!zoomed && backToHandle.current) {
      backToHandle.current = false;
      if (document.activeElement === el || lost) el.querySelector<HTMLElement>('[data-part="move"]')?.focus({ preventScroll: true });
    }
    const from = zoomFrom.current ?? lastRect.current;
    zoomFrom.current = null;
    animateWindow(el, 'zoom', { mode, from, to: el.getBoundingClientRect() });
  }, [zoomed]);

  // Minimize: fall into the dock, then hide. Restore: grow back out of it.
  const prevMinimized = useRef(minimized);
  useLayoutEffect(() => {
    if (prevMinimized.current === minimized) return;
    prevMinimized.current = minimized;
    const el = rootRef.current;
    const box = container();
    const layerRect = box?.getBoundingClientRect();
    const target =
      rectOf(dock) ??
      (layerRect ? shift(minimizeTarget(boundsOf(box)), layerRect.left, layerRect.top) : null);
    if (minimized) {
      manager.minimize(windowId);
      if (!el) return;
      const anim = animateWindow(el, 'minimize', { mode, from: el.getBoundingClientRect(), to: target });
      void settled(anim).then(() => {
        if (!minimizedRef.current) return;
        leaveFocus();
        setFolded(true);
      });
      return;
    }
    manager.restore(windowId);
    if (!el) return;
    animateWindow(el, 'grow', { mode, from: target, to: el.getBoundingClientRect() });
    el.focus({ preventScroll: true });
  }, [minimized]);

  // The rect after every commit, for a zoom that comes from a prop.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (el && !el.hidden) lastRect.current = el.getBoundingClientRect();
  });

  const commitFrame = useCallback(
    (next: WindowRect) => {
      manager.move(windowId, next);
      onFrameChange?.(next);
    },
    [manager, windowId, onFrameChange],
  );

  /** The frame now: the stored one, or the one the layout gave it. */
  const currentFrame = (): WindowRect | null => {
    if (frame) return frame;
    const el = rootRef.current;
    const box = container();
    if (!el || !box) return null;
    settle(el);
    return measureFrame(el, box, dir);
  };

  const moveBy = (delta: { x: number; y: number }) => {
    const from = currentFrame();
    if (!from) return;
    commitFrame(moveFrame(from, delta, boundsOf(container())));
  };

  const requestClose = () => setOpen(false);
  const toggleZoom = () => {
    zoomFrom.current = rootRef.current?.getBoundingClientRect() ?? null;
    setZoomed(!zoomed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const el = rootRef.current;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      requestClose();
      return;
    }
    if (modal && event.key === 'Tab' && el) {
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.tabIndex >= 0 && !n.hasAttribute('disabled') && !n.closest('[hidden]'),
      );
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (!firstItem || !lastItem) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && (document.activeElement === firstItem || document.activeElement === el)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as Element;
    const onHandle = target.getAttribute('data-part') === 'move' && titleBarRef.current?.contains(target) === true;
    if (onHandle && event.key === 'Enter' && zoomable) {
      event.preventDefault();
      toggleZoom();
      return;
    }
    if (!canMove || (target !== el && !onHandle)) return;
    const delta = arrowDelta(event.key, event.shiftKey, dir);
    if (!delta) return;
    event.preventDefault();
    moveBy(delta);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    manager.focus(windowId);
  };

  const onBarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canMove || event.button !== 0) return;
    if ((event.target as Element).closest('button, a, input, select, textarea, [data-part="actions"]')) return;
    const start = currentFrame();
    if (!start) return;
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, frame: start };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    rootRef.current?.focus({ preventScroll: true });
    setDragging(true);
  };

  const onBarPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== event.pointerId) return;
    const dx = event.clientX - d.x;
    commitFrame(moveFrame(d.frame, { x: dir === 'rtl' ? -dx : dx, y: event.clientY - d.y }, boundsOf(container())));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );

  if (!present) return null;

  const placed: CSSProperties =
    frame && !zoomed
      ? {
          position: 'absolute',
          insetInlineStart: frame.x,
          insetBlockStart: frame.y,
          insetInlineEnd: 'auto',
          insetBlockEnd: 'auto',
          inlineSize: frame.width,
          blockSize: frame.height,
          maxInlineSize: 'none',
          maxBlockSize: 'none',
          margin: 0,
        }
      : {};

  // Without the lights (Studio) the same actions are IconButtons at the end
  // of the title bar, each only when the window can do it. They are parts of
  // the TitleBar (its nearest root): minimize, zoom, close.
  const buttons = controlsOn ? null : (
    <>
      {minimizable && <IconButton data-part="minimize" icon="minimize" label={minimizeLabel} size="sm" onClick={() => setMinimized(true)} />}
      {zoomable && <IconButton data-part="zoom" icon="zoom" label={zoomLabel} size="sm" aria-pressed={zoomed} onClick={toggleZoom} />}
      <IconButton data-part="close" icon="close" label={closeLabel} size="sm" onClick={requestClose} />
    </>
  );
  const hint = moveHint ?? (zoomable ? words.hintZoom : words.hint);

  return (
    <div
      {...rest}
      ref={setRootRef}
      id={windowId}
      role="dialog"
      aria-modal={modal ? true : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : titleId}
      tabIndex={-1}
      hidden={folded}
      data-ds="window"
      data-kind={kind}
      data-state={active ? 'active' : 'inactive'}
      data-layered={layerCtx ? '' : undefined}
      data-movable={canMove ? '' : undefined}
      data-zoomed={zoomed ? '' : undefined}
      data-minimized={minimized ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      style={{ ...style, zIndex, ...placed }}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onFocus={(event) => {
        onFocus?.(event);
        handleFocused.current = (event.target as Element).getAttribute('data-part') === 'move';
        manager.focus(windowId);
      }}
    >
      <TitleBar
        ref={titleBarRef}
        data-part="titlebar"
        title={title}
        as={titleAs}
        titleId={titleId}
        active={active}
        controls={
          controlsOn ? (
            <WindowControls
              label={controlsLabel}
              closeLabel={closeLabel}
              minimizeLabel={minimizeLabel}
              zoomLabel={zoomLabel}
              active={active}
              zoomed={zoomed}
              onClose={requestClose}
              onMinimize={minimizable ? () => setMinimized(true) : undefined}
              onZoom={zoomable ? toggleZoom : undefined}
            />
          ) : undefined
        }
        actions={
          actions !== undefined || buttons ? (
            <>
              {actions}
              {buttons}
            </>
          ) : undefined
        }
        moveLabel={canMove ? moveLabel : undefined}
        moveHint={hint}
        onPointerDown={onBarPointerDown}
        onPointerMove={onBarPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={(event) => {
          if (zoomable && !(event.target as Element).closest('button, a, input, [data-part="actions"]')) toggleZoom();
        }}
      />
      <div data-part="body">{children}</div>
      {footer !== undefined && footer !== null && <div data-part="footer">{footer}</div>}
    </div>
  );
}

function shift(rect: WindowRect, x: number, y: number): WindowRect {
  return { ...rect, x: rect.x + x, y: rect.y + y };
}
