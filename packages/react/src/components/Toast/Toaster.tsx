'use client';
// Toaster: mount once near the root, inside the root Theme. It renders the
// Radix Toast provider and viewport, and one Toast per item of the shared
// store (`toast()` from @the-system/shared).
//
// Who owns time: the store. Every Radix Toast gets duration Infinity, so the
// Radix timer never runs. The store keeps one timer per open toast through
// its clock, and this component only tells it when to pause: while the
// pointer is over the toasts, while focus is inside them, and while the
// window is blurred or the tab hidden. Angular reuses the same store and
// reports the same pauses, so both frameworks time toasts the same way.
//
// Announce once (WCAG 4.1.3): Radix reads each toast through its own
// visually hidden status region when the toast mounts, assertive for danger
// (type "foreground") and polite for the rest (type "background"). The toast
// itself has no live role, so it is not read twice. A repeat or an update
// remounts the toast (its key holds the version), which reads it once more.
//
// The themed portal. The viewport is portaled to <body>, outside every Theme
// element, where the token selectors would not reach it. So the portal
// starts with a Theme that copies every axis of the Theme the Toaster is
// mounted in (useTheme), and the toasts read the right tokens, language and
// direction. That Theme is `display: contents`, so it paints nothing. Any
// overlay that portals out (Dialog, Popover, Menu) follows the same order:
//
//   const theme = useTheme();
//   createPortal(<Theme style={theme.style} scheme={theme.scheme} ...every axis>{layer}</Theme>, document.body)
//
// Above a modal dialog. The viewport sits on z.toast (10000), over z.dialog
// (9500). A modal Radix Dialog then does three things to the rest of the
// page, and each is handled here:
// - aria-hidden on every other child of <body>: the library Radix uses
//   (aria-hidden) never hides an element with an aria-live attribute, so the
//   portal Theme carries aria-live="off" (off is the default, so nothing is
//   announced through it) and stays in the accessibility tree.
// - pointer-events: none on <body>: Radix gives every toast layer
//   pointer-events auto, and Toast.css sets it on the toasts as well.
// - a focus trap: its FocusScope listens for focusin and focusout on the
//   document and pulls focus back. The Toaster listens on the document too,
//   from its mount (so before any dialog opens), and stops those events
//   from going further when focus moves into the toasts. Mount the Toaster
//   before any dialog can open. F8 and Tab then reach the toasts.
// Escape closes the newest toast first (it is the top Radix layer), and the
// next Escape closes the dialog.
import { useEffect, useState, useSyncExternalStore, type FocusEvent } from 'react';
import { createPortal } from 'react-dom';
import { Toast as RadixToast } from 'radix-ui';
import { toastStore, toastUrgency, type ToastItem, type ToastStore } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { ToastParts, toastDirFor, toastLabelsFor } from './Toast';

/** Where the toasts sit. end is the inline end: right in English, left in Arabic. */
export type ToasterPosition = 'bottom-end' | 'bottom-center' | 'top-end' | 'top-center';

export interface ToasterProps {
  /** Default bottom-end. */
  position?: ToasterPosition;
  /**
   * The name of the notifications region. Default "Notifications" (Arabic
   * under lang ar). `{hotkey}` in it is replaced by the hotkey, for example
   * "Notifications ({hotkey})".
   */
  label?: string;
  /** The keys that move focus to the toasts, as KeyboardEvent code or modifier names. Default ["F8"]. */
  hotkey?: string[];
  /** Read before each toast's text by screen readers. Default "Notification" (Arabic under lang ar). */
  toastLabel?: string;
  /** The accessible name of each close button. Default "Close notification" (Arabic under lang ar). */
  closeLabel?: string;
  /** The store to render. Default the app wide store behind `toast()`. */
  store?: ToastStore;
}

/** The swipe that closes a toast: toward the edge it sits on. */
function swipeFor(position: ToasterPosition, dir: 'ltr' | 'rtl'): 'up' | 'down' | 'left' | 'right' {
  if (position === 'bottom-center') return 'down';
  if (position === 'top-center') return 'up';
  return dir === 'rtl' ? 'left' : 'right';
}

/** Mount once near the root, inside the root Theme. Renders the toasts of `toast()`. */
export function Toaster({ position = 'bottom-end', label, hotkey = ['F8'], toastLabel, closeLabel, store = toastStore }: ToasterProps) {
  const theme = useTheme();
  const words = toastLabelsFor(theme.lang);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [away, setAway] = useState(false);
  const [hidden, setHidden] = useState(false);

  // The portal needs the document, so it renders after the first commit (safe on the server).
  useEffect(() => setBody(document.body), []);

  // Window blurred and tab hidden pause the timers, as Radix does.
  useEffect(() => {
    const onBlur = () => setAway(true);
    const onFocus = () => setAway(false);
    const onVisibility = () => setHidden(document.visibilityState === 'hidden');
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // An emptied stack gives no pointerleave, so the hover flag resets with it.
  const anyOpen = snapshot.visible.some((t) => t.state === 'open');
  useEffect(() => {
    if (!anyOpen) setHovered(false);
  }, [anyOpen]);

  const paused = hovered || focused || away || hidden;
  useEffect(() => {
    if (paused) store.pause();
    else store.resume();
  }, [paused, store]);
  useEffect(() => () => store.resume(), [store]);

  // Focus into the toasts must not be pulled back by a modal dialog's focus trap. See the header.
  useEffect(() => {
    if (!layer) return;
    const inside = (node: EventTarget | null) => node instanceof Node && layer.contains(node);
    const onFocusIn = (event: globalThis.FocusEvent) => {
      if (inside(event.target)) event.stopImmediatePropagation();
    };
    const onFocusOut = (event: globalThis.FocusEvent) => {
      if (inside(event.relatedTarget)) event.stopImmediatePropagation();
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [layer]);

  if (!body) return null;

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

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
      ref={setLayer}
      aria-live="off"
      data-toaster-layer=""
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
    >
      <RadixToast.Provider label={toastLabel ?? words.toast} duration={Infinity} swipeDirection={swipeFor(position, theme.dir)}>
        {snapshot.visible.map((item) => (
          <ToasterItem key={`${item.id}:${item.version}`} item={item} store={store} closeLabel={closeLabel ?? words.close} />
        ))}
        <RadixToast.Viewport
          data-ds="toaster"
          data-position={position}
          label={label ?? words.region}
          hotkey={hotkey}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        />
      </RadixToast.Provider>
    </Theme>,
    body,
  );
}

function ToasterItem({ item, store, closeLabel }: { item: ToastItem; store: ToastStore; closeLabel: string }) {
  return (
    <RadixToast.Root
      asChild
      open={item.state === 'open'}
      duration={Infinity}
      type={toastUrgency(item.tone) === 'assertive' ? 'foreground' : 'background'}
      onOpenChange={(open) => {
        if (!open) store.dismiss(item.id);
      }}
    >
      <li data-ds="toast" data-tone={item.tone} lang={item.lang} dir={toastDirFor(item.lang)}>
        <ToastParts
          tone={item.tone}
          title={item.title}
          description={item.description}
          count={item.count}
          action={item.action}
          closeLabel={item.lang !== undefined ? toastLabelsFor(item.lang).close : closeLabel}
        />
      </li>
    </RadixToast.Root>
  );
}
