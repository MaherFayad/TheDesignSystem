'use client';
// DialogBase: the modal internals every dialog family member shares, as
// ButtonBase is for the buttons. Dialog, AlertDialog, Drawer and Sheet (and
// later CommandPalette and Lightbox) render through it:
//
// - the themed portal: a Theme that copies every axis of the Theme the
//   overlay is rendered in (the Toaster pattern), straight into body;
// - the root layer (`data-ds` of the caller) that holds the backdrop and the
//   panel, mounted while open and until both have played their exit;
// - the focus rule and the focus return (packages/shared dialog-focus.ts);
// - Escape: Radix gives it to the top layer, and an Escape from inside the
//   panel that no layer took still closes it while a toast shows above;
// - outside clicks and focus that land in the Toaster never close it;
// - `dismissible` false: Escape and outside clicks do nothing.
//
// Scroll lock, the focus trap, aria-modal and hiding the page come from the
// Radix primitive the caller passes (Dialog or AlertDialog): DialogBase takes
// their Overlay and Content, so the behavior of each primitive stays its own
// (AlertDialog never closes on an outside click, whatever is passed here).
//
// Motion is CSS, but for one beat. Under reduced motion every animation is
// none, so Radix unmounts at once and nothing here waits for an
// animationend.
//
// Refused (order 1.23, interaction "dialog-refuse"): a press on the backdrop
// of an AlertDialog (which never closes on an outside click) or of a dialog
// with dismissible false, and Escape on a dialog with dismissible false, do
// not close it. The panel nudges instead: a shake along the inline axis
// (the catalog pattern "shake" in its shape: out, back past its place, a
// smaller swing, rest) of --_dialog-refuse-shift (space.m, a panel is large,
// so the catalog's space.3xs would not read) inside duration.roll on
// ease.out, no change of light, played with the Web Animations API. The
// style's mode for "dialog-refuse" (useMotion) applies: none or reduced
// motion leaves it still. A second refusal cancels the first
// and plays again, so a rapid series never stacks or sticks. A refused
// press keeps focus where it was (order 1.29, review 3 B8): its pointerdown
// and mousedown defaults are prevented, so focus never falls to the body.
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  DIALOG_ACTION_SELECTOR,
  captureFocusReturn,
  dialogInitialFocus,
  focusReturnTarget,
  type FocusReturn,
} from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { durationMs, readDuration, readEasing } from '@the-system/motion';
import { useMotion } from '../../internal/motion';
import { isInsideToaster } from '../Toast/isInsideToaster';

/** Sets a ref of any kind. */
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

/** The roots built on DialogBase. CommandPalette and Lightbox join in lane 6D. */
export type DialogKind = 'dialog' | 'alert-dialog' | 'drawer' | 'sheet' | 'command-palette' | 'lightbox';

/** What every family member keeps in its context: the open state and the trigger. */
export interface DialogBaseState {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** false: only the overlay's own actions close it. */
  dismissible: boolean;
  /** The trigger, for the focus return. */
  triggerRef: RefObject<HTMLElement | null>;
}

/** The Radix focus and outside events DialogBase handles. */
interface FocusEventLike {
  defaultPrevented: boolean;
  preventDefault(): void;
}
interface OutsideEventLike extends FocusEventLike {
  target: EventTarget | null;
}

/** The Content props DialogBase sets. Both Radix Dialog.Content and AlertDialog.Content accept them. */
export interface DialogBaseContentHandlers {
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: CustomEvent<{ originalEvent: PointerEvent }>) => void;
  onInteractOutside?: (event: CustomEvent<{ originalEvent: PointerEvent | FocusEvent }>) => void;
  onFocusOutside?: (event: CustomEvent<{ originalEvent: FocusEvent }>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
}

/** A Radix Content: the panel. */
// Each Radix Content has its own prop type; DialogBase passes the shared subset.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PanelPrimitive = (props: any) => JSX.Element | ReactNode;

export interface DialogBaseProps extends DialogBaseContentHandlers {
  /** The family member's state. */
  state: DialogBaseState;
  /** The root's data-ds. */
  kind: DialogKind;
  /** Data attributes of the root besides data-ds and data-state (data-size, data-tone, data-side). */
  rootAttributes?: Record<string, string | boolean | undefined>;
  /** The tone the focus rule reads. AlertDialog passes danger, so focus opens on Cancel. */
  focusTone?: string;
  /** The Radix Overlay, or null for no backdrop (a non modal Drawer). */
  Backdrop: PanelPrimitive | null;
  /** The Radix Content. */
  Panel: PanelPrimitive;
  /** Props for the panel: aria-*, the rest of the Radix Content props. */
  panelProps?: Record<string, unknown>;
  /** The panel's ref (the element with role dialog). */
  panelRef?: Ref<HTMLDivElement>;
  /** Props for the backdrop element. */
  backdropProps?: Record<string, unknown>;
  /** Class name of the root. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Development warnings, by the caller's name. */
  devName?: string;
  /** The panel's children. */
  children?: ReactNode;
}

/** Development only: says what a dialog is missing when it opens. */
function warnInDev(panel: HTMLElement, name: string): void {
  if (process.env.NODE_ENV === 'production') return;
  const named =
    panel.hasAttribute('aria-label') ||
    panel.querySelector('[data-part="title"]:not(:empty), [data-dialog-title]:not(:empty)') !== null;
  if (!named) console.warn(`${name}: opened with no title. Add a ${name}Title as a direct child of ${name}Content, or the title prop.`);
  const footer = Array.from(panel.querySelectorAll('[data-part="footer"]')).find((el) => el.closest('[data-part="panel"]') === panel);
  const actions = footer ? footer.querySelectorAll(DIALOG_ACTION_SELECTOR).length : 0;
  if (actions > 3) console.warn(`${name}: the footer holds ${actions} actions. Keep it to three at most.`);
}

/** The panel element of the nearest DialogBase, for parts that need it (the Sheet handle). */
const PanelElementContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

/** The panel element of the overlay this part renders in. */
export function usePanelElement(): RefObject<HTMLDivElement | null> | null {
  return use(PanelElementContext);
}

/**
 * The portal, the root layer, the backdrop and the panel, with the shared
 * behavior. The root carries `data-ds={kind}`, `data-state` and the
 * caller's attributes.
 */
export function DialogBase({
  state,
  kind,
  rootAttributes,
  focusTone = 'neutral',
  Backdrop,
  Panel,
  panelProps,
  panelRef: panelRefProp,
  backdropProps,
  className,
  style,
  rootProps,
  devName = 'Dialog',
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  onFocusOutside,
  onKeyDown,
  children,
}: DialogBaseProps) {
  const theme = useTheme();
  const [body, setBody] = useState<HTMLElement | null>(null);

  // The portal needs the document, so it renders after the first commit (safe on the server).
  useEffect(() => setBody(document.body), []);

  // The root stays mounted while open, and until the panel and the backdrop have played their exit.
  const [mounted, setMounted] = useState(state.open);
  if (state.open && !mounted) setMounted(true);
  const openRef = useRef(state.open);
  openRef.current = state.open;
  const alive = useRef({ panel: false, backdrop: false });
  const settle = useCallback(() => {
    if (!openRef.current && !alive.current.panel && !alive.current.backdrop) setMounted(false);
  }, []);
  // A non modal overlay renders no backdrop: nothing to wait for.
  useEffect(() => {
    if (!state.open) settle();
  }, [state.open, settle]);

  const panelRef = useRef<HTMLDivElement | null>(null);

  // The refused nudge: one at a time, the newest wins.
  const motion = useMotion();
  const refusal = useRef<Animation | null>(null);
  const refuse = useCallback(() => {
    refusal.current?.cancel();
    refusal.current = null;
    const panel = panelRef.current;
    if (!panel || typeof panel.animate !== 'function' || motion.mode('dialog-refuse') !== 'full') return;
    // Without the token (a page with no token CSS) the base value; under reduced motion the token is 0.
    const set = typeof getComputedStyle === 'function' && getComputedStyle(panel).getPropertyValue('--ds-duration-roll').trim() !== '';
    const duration = set ? readDuration(panel, 'duration.roll') : durationMs['duration.roll'];
    if (duration <= 0) return;
    const sign = theme.dir === 'rtl' ? -1 : 1;
    const at = (k: number) => ({ transform: `translateX(calc(var(--_dialog-refuse-shift) * ${sign * k}))` });
    refusal.current = panel.animate([{ transform: 'none' }, at(1), at(-0.7), at(0.35), { transform: 'none' }], {
      duration,
      easing: readEasing(panel, 'ease.out'),
      id: 'ds-motion:dialog-refuse',
    });
  }, [motion, theme.dir]);
  const refusesOutside = kind === 'alert-dialog' || !state.dismissible;

  // Where focus goes back (packages/shared dialog-focus.ts), captured on open.
  const returnTo = useRef<{ active: FocusReturn; trigger: FocusReturn } | null>(null);
  const { triggerRef } = state;
  const setPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      alive.current.panel = node !== null;
      if (node && !returnTo.current) {
        returnTo.current = {
          active: captureFocusReturn(node.ownerDocument.activeElement),
          trigger: captureFocusReturn(triggerRef.current),
        };
      }
      assignRef(panelRefProp, node);
      if (!node) settle();
    },
    [panelRefProp, settle, triggerRef],
  );
  const setBackdropRef = useCallback(
    (node: HTMLDivElement | null) => {
      alive.current.backdrop = node !== null;
      if (!node) settle();
    },
    [settle],
  );

  if (!body || !mounted) return null;

  const rootData: Record<string, string> = {};
  for (const [name, value] of Object.entries(rootAttributes ?? {})) {
    if (value === undefined || value === false) continue;
    rootData[name] = value === true ? '' : value;
  }

  return createPortal(
    <Theme
      style={theme.style}
      scheme={theme.scheme}
      density={theme.density}
      contrast={theme.contrast}
      platform={theme.platform}
      glass={theme.glass}
      dir={theme.dir}
      lang={theme.lang}
      data-dialog-layer=""
    >
      <div
        {...rootProps}
        {...rootData}
        className={className}
        style={style}
        data-ds={kind}
        data-state={state.open ? 'open' : 'closed'}
        onPointerDown={(event) => {
          rootProps?.onPointerDown?.(event);
          // A press on the backdrop that will not close the overlay: the panel nudges,
          // and focus stays where it was (review 3, B8; WCAG 2.4.3): the default focus
          // change of the press is prevented, so it never falls to the body.
          if (event.button !== 0 || !refusesOutside || !state.open) return;
          if ((event.target as Element | null)?.getAttribute?.('data-part') !== 'backdrop') return;
          event.preventDefault();
          refuse();
        }}
        onMouseDown={(event) => {
          rootProps?.onMouseDown?.(event);
          // A touch press still sends a compatibility mousedown, whose default moves focus.
          if (!refusesOutside || !state.open) return;
          if ((event.target as Element | null)?.getAttribute?.('data-part') === 'backdrop') event.preventDefault();
        }}
      >
        {Backdrop ? <Backdrop {...backdropProps} ref={setBackdropRef} data-part="backdrop" /> : null}
        <Panel
          {...panelProps}
          ref={setPanelRef}
          data-part="panel"
          onOpenAutoFocus={(event: Event) => {
            onOpenAutoFocus?.(event);
            if (panelRef.current) warnInDev(panelRef.current, devName);
            if (event.defaultPrevented || !panelRef.current) return;
            const target = dialogInitialFocus(panelRef.current, focusTone);
            if (target) {
              event.preventDefault();
              target.focus();
              return;
            }
            // Radix Dialog then focuses the first tab stop itself. Radix
            // AlertDialog would focus its Cancel ref, which may be empty:
            // here the first tab stop, else the panel, takes focus.
            if (kind !== 'alert-dialog') return;
            event.preventDefault();
            (panelRef.current.querySelector<HTMLElement>(DIALOG_ACTION_SELECTOR) ?? panelRef.current).focus();
          }}
          onCloseAutoFocus={(event: Event) => {
            onCloseAutoFocus?.(event);
            if (event.defaultPrevented) return;
            // Back to the trigger, else to what had focus before the overlay
            // opened. When that is gone: its nearest connected focusable
            // ancestor, else the first tab stop of main, else the body.
            event.preventDefault();
            const trigger = triggerRef.current;
            const memo = returnTo.current;
            returnTo.current = null;
            const target = trigger?.isConnected
              ? trigger
              : memo
                ? focusReturnTarget(memo.active.target ? memo.active : memo.trigger, document)
                : null;
            if (target?.isConnected) target.focus();
          }}
          onEscapeKeyDown={(event: KeyboardEvent) => {
            onEscapeKeyDown?.(event);
            if (!state.dismissible) {
              event.preventDefault();
              refuse();
            }
          }}
          onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
            onKeyDown?.(event);
            // Radix gives Escape to the top layer only. While a toast shows above
            // the overlay, the toast is that layer and the overlay never hears the
            // key. An Escape from inside the panel that no layer took (none
            // prevented it) still closes it. When the overlay is the top layer,
            // Radix has already handled and prevented it.
            if (event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.defaultPrevented) return;
            if (!state.dismissible) return;
            if (!panelRef.current?.contains(event.target as Node)) return;
            event.preventDefault();
            state.setOpen(false);
          }}
          // Working with a toast above the overlay never closes it, and focus may move into the toasts.
          onPointerDownOutside={(event: OutsideEventLike) => {
            onPointerDownOutside?.(event as CustomEvent<{ originalEvent: PointerEvent }>);
            if (!state.dismissible || isInsideToaster(event.target)) event.preventDefault();
          }}
          onInteractOutside={(event: OutsideEventLike) => {
            onInteractOutside?.(event as CustomEvent<{ originalEvent: PointerEvent | FocusEvent }>);
            if (!state.dismissible || isInsideToaster(event.target)) event.preventDefault();
          }}
          onFocusOutside={(event: OutsideEventLike) => {
            onFocusOutside?.(event as CustomEvent<{ originalEvent: FocusEvent }>);
            if (isInsideToaster(event.target)) event.preventDefault();
          }}
        >
          <PanelElementContext value={panelRef}>{children}</PanelElementContext>
        </Panel>
      </div>
    </Theme>,
    body,
  );
}
