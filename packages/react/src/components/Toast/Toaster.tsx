'use client';
// Toaster: mount once near the root, inside the root Theme. It renders the
// Radix Toast provider and viewport, and one Toast per item of the shared
// store (`toast()` from @the-system/shared).
//
// Who owns time: the store. Every Radix Toast gets duration Infinity, so the
// Radix timer never runs. The store keeps one timer per open toast through
// its clock, and this component only tells it when to pause: while the
// pointer is over the toasts, while focus is inside them, and while the
// window is blurred or the tab hidden. The pointer and focus listeners are
// native listeners on the portal layer, so they fire whatever the pointer
// comes from. Angular reuses the same store and reports the same pauses.
//
// Announce once per change (WCAG 4.1.3): the Toaster owns two visually
// hidden live regions inside its layer, polite (role status) and assertive
// (role alert, for danger). A toast is read when it shows, and again on each
// repeat or update (its version goes up), as "label. title. description.
// action alternative", the toast's own text in the toast's language. The
// toast keeps its element across a repeat or an update (it is keyed by id),
// so focus stays and the enter does not replay. Radix's own announcer is
// sent to a detached element, so nothing is read twice; the toast itself has
// no live role.
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
// page:
// - aria-hidden on every other child of <body>: the library Radix uses
//   (aria-hidden) never hides an element with an aria-live attribute, so the
//   portal Theme carries aria-live="off" (off is the default, so nothing is
//   announced through it) and the toasts stay in the accessibility tree.
// - pointer-events: none on <body>: Radix gives every toast layer
//   pointer-events auto, and Toast.css sets it on the toasts as well, so
//   the toasts take the pointer and their buttons work.
// - a focus trap. The Toaster does not fight it. A dialog built on Radix
//   calls `isInsideToaster(event.target)` in onFocusOutside,
//   onPointerDownOutside and onInteractOutside and prevents the default, so
//   working with a toast never closes the dialog. The limit: while a modal
//   dialog is open, keyboard focus stays in the dialog, so F8 and Tab do not
//   reach the toasts. That is why a toast with an action never times out:
//   its action is still there when the dialog closes.
//
// Motion (order 1.23). The toasts share one grid cell and stack with depth:
// the newest in front, the older ones behind it, peeking a few px further
// from the edge, smaller, clipped to the strip that shows. stack.ts measures
// the toasts and writes their place; Toast.css draws it with translate,
// scale and clip-path and transitions them. While the pointer is over the
// toasts or focus is inside them, the viewport carries data-expanded and
// the stack opens into a list; it closes again when both leave. The same
// moments pause the store, so a person reading a toast never races its
// timer. The viewport carries data-paused whenever the store is paused
// (hover, focus, window blurred, tab hidden): the progress line of a timed
// toast (its `progress` part, a CSS animation that runs for the toast's
// duration) pauses on it, so the line and the store's timer move together
// (WCAG 2.2.1), and a repeat or an update (a new version) starts both again.
// The swipe is the Toaster's own (swipe.ts): Radix's clamps to one way and
// reads distance only. The toast follows the finger toward its edge, gives
// a little against the other way, and closes past a distance or on a fast
// flick; let go short, it springs back. Layout never animates and the store
// never waits.
//
// Escape closes a toast only when focus is inside the toaster, so Escape in
// a Window, a Dialog or a form never also closes a toast, a persistent
// danger toast included. The key is not prevented, so the component that
// has focus still gets it. Radix gives Escape to the top Radix layer only,
// and a toast shown above an open dialog is that layer: the system Dialog
// closes itself from its own keydown fallback, but a raw Radix Dialog from
// a consumer does not see that Escape while a toast shows above it (the
// manifest says so).
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Toast as RadixToast, VisuallyHidden } from 'radix-ui';
import { toastStore, toastUrgency, type ToastItem, type ToastStore } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { isInsideToaster } from './isInsideToaster';
import { watchStack } from './stack';
import { START_BUFFER, rubberBand, swipeAxis, swipeCloses, swipeOffset, swipeSign, swipeVelocity, type SwipeDirection, type SwipeSample } from './swipe';
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

/** One announcement: the toast label in the page language, then the toast's text in its own. */
interface Line {
  key: string;
  label: string;
  text: string;
  lang?: string;
  urgent: boolean;
}

/** The text a screen reader hears for a toast, after the label. */
export function toastAnnouncement(item: Pick<ToastItem, 'title' | 'description' | 'action'>): string {
  const parts = [item.title, item.description, item.action ? (item.action.altText ?? item.action.label) : undefined];
  return parts
    .map((p) => p?.trim())
    .filter((p): p is string => !!p)
    .map((p) => (/[.!?؟。]$/.test(p) ? p : `${p}.`))
    .join(' ');
}

/** The swipe that closes a toast: toward the edge it sits on. */
function swipeFor(position: ToasterPosition, dir: 'ltr' | 'rtl'): SwipeDirection {
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
  const [mute, setMute] = useState<HTMLElement | null>(null);
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [away, setAway] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const seen = useRef(new Map<string, number>());
  const pending = useRef<Line[]>([]);
  const flush = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set while an Escape that must not close a toast is being handled. */
  const keepOnEscape = useRef(false);

  // The portal needs the document, so it renders after the first commit (safe on the server).
  // Radix announces each toast through a portal of its own; it goes to a detached element.
  useEffect(() => {
    setBody(document.body);
    setMute(document.createElement('div'));
  }, []);

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

  // Pointer and focus inside the layer, as native listeners (a React handler
  // on a portaled element misses a pointer that comes from the page).
  useEffect(() => {
    if (!layer) return;
    const onOver = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest?.('[data-ds="toast"]')) setHovered(true);
    };
    // The expanded list takes the pointer in its gaps too (Toast.css), so moving between two toasts keeps it open.
    const onOut = (event: PointerEvent) => {
      const next = event.relatedTarget as Element | null;
      if (!next?.closest?.('[data-ds="toaster"]')) setHovered(false);
    };
    const onFocusIn = () => setFocused(true);
    const onFocusOut = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node && layer.contains(event.relatedTarget))) setFocused(false);
    };
    layer.addEventListener('pointerover', onOver);
    layer.addEventListener('pointerout', onOut);
    layer.addEventListener('focusin', onFocusIn);
    layer.addEventListener('focusout', onFocusOut);
    return () => {
      layer.removeEventListener('pointerover', onOver);
      layer.removeEventListener('pointerout', onOut);
      layer.removeEventListener('focusin', onFocusIn);
      layer.removeEventListener('focusout', onFocusOut);
    };
  }, [layer]);

  // Escape closes a toast only from inside the toaster (see the header).
  // This runs before Radix's document listener and only marks the key press.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Never prevented here: the focused component (a Dialog's fallback) skips a prevented key.
      keepOnEscape.current = !isInsideToaster(event.target);
      setTimeout(() => {
        keepOnEscape.current = false;
      }, 0);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  // The stack: each toast's place, written before the next paint (stack.ts).
  useEffect(() => {
    const viewport = layer?.querySelector<HTMLElement>('[data-ds="toaster"]');
    if (!viewport) return;
    return watchStack(viewport);
  }, [layer]);

  // An emptied stack gives no pointerout, so the hover flag resets with it.
  const anyOpen = snapshot.visible.some((t) => t.state === 'open');
  useEffect(() => {
    if (!anyOpen) setHovered(false);
  }, [anyOpen]);

  const paused = hovered || focused || away || hidden;
  const expanded = (hovered || focused) && anyOpen;
  useEffect(() => {
    if (paused) store.pause();
    else store.resume();
  }, [paused, store]);
  useEffect(() => () => store.resume(), [store]);

  // Announce each toast once when it shows, and once per repeat or update.
  const announceLabel = toastLabel ?? words.toast;
  useEffect(() => {
    const live = new Set(snapshot.visible.map((t) => t.id));
    for (const id of [...seen.current.keys()]) if (!live.has(id)) seen.current.delete(id);
    const fresh = snapshot.visible.filter((t) => t.state === 'open' && seen.current.get(t.id) !== t.version);
    if (fresh.length === 0) return;
    for (const t of fresh) {
      seen.current.set(t.id, t.version);
      pending.current.push({
        key: `${t.id}:${t.version}`,
        label: t.lang !== undefined ? toastLabelsFor(t.lang).toast : announceLabel,
        text: toastAnnouncement(t),
        lang: t.lang,
        urgent: toastUrgency(t.tone) === 'assertive',
      });
    }
    if (flush.current !== null) return;
    // Empty the regions first, so the same words are read again on a repeat.
    setLines([]);
    flush.current = setTimeout(() => {
      flush.current = null;
      setLines(pending.current);
      pending.current = [];
      if (clear.current !== null) clearTimeout(clear.current);
      clear.current = setTimeout(() => setLines([]), 5000);
    }, 100);
  }, [snapshot, announceLabel]);
  useEffect(
    () => () => {
      if (flush.current !== null) clearTimeout(flush.current);
      if (clear.current !== null) clearTimeout(clear.current);
    },
    [],
  );

  if (!body || !mute) return null;

  const region = (urgent: boolean) =>
    lines
      .filter((l) => l.urgent === urgent)
      .map((l) => (
        <p key={l.key}>
          {l.label}.{' '}
          <span lang={l.lang} dir={toastDirFor(l.lang)}>
            {l.text}
          </span>
        </p>
      ));

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
    >
      <VisuallyHidden.Root role="status" aria-live="polite" aria-atomic="false" data-toaster-announce="polite">
        {region(false)}
      </VisuallyHidden.Root>
      <VisuallyHidden.Root role="alert" aria-live="assertive" aria-atomic="false" data-toaster-announce="assertive">
        {region(true)}
      </VisuallyHidden.Root>
      <RadixToast.Provider label={announceLabel} duration={Infinity} swipeDirection={swipeFor(position, theme.dir)} announcerContainer={mute}>
        {snapshot.visible.map((item) => (
          <ToasterItem
            key={item.id}
            item={item}
            store={store}
            closeLabel={closeLabel ?? words.close}
            keepOnEscape={keepOnEscape}
            direction={swipeFor(position, theme.dir)}
          />
        ))}
        <RadixToast.Viewport
          data-ds="toaster"
          data-position={position}
          data-stacked=""
          data-expanded={expanded ? '' : undefined}
          data-paused={paused ? '' : undefined}
          label={label ?? words.region}
          hotkey={hotkey}
        />
      </RadixToast.Provider>
    </Theme>,
    body,
  );
}

/** A swipe in progress: where it started and what it has drawn so far. */
interface Gesture {
  x: number;
  y: number;
  pointerId: number;
  buffer: number;
  started: boolean;
  samples: SwipeSample[];
  along: number;
}

function ToasterItem({
  item,
  store,
  closeLabel,
  keepOnEscape,
  direction,
}: {
  item: ToastItem;
  store: ToastStore;
  closeLabel: string;
  keepOnEscape: { current: boolean };
  direction: SwipeDirection;
}) {
  const gesture = useRef<Gesture | null>(null);

  const clearMove = (el: HTMLElement) => {
    el.style.removeProperty('--radix-toast-swipe-move-x');
    el.style.removeProperty('--radix-toast-swipe-move-y');
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || item.state !== 'open') return;
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      buffer: event.pointerType === 'touch' ? START_BUFFER.touch : START_BUFFER.other,
      started: false,
      samples: [],
      along: 0,
    };
  };

  // Every pointermove is prevented, so Radix's own swipe never starts: this one replaces it.
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    const g = gesture.current;
    if (!g || g.pointerId !== event.pointerId) return;
    const el = event.currentTarget;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    const axis = swipeAxis(direction);
    const main = axis === 'x' ? dx : dy;
    const cross = axis === 'x' ? dy : dx;
    if (!g.started) {
      if (Math.abs(main) <= g.buffer && Math.abs(cross) <= g.buffer) return;
      // A gesture that starts across the axis is not a swipe.
      if (Math.abs(cross) > Math.abs(main)) {
        gesture.current = null;
        return;
      }
      g.started = true;
      el.setAttribute('data-swipe', 'start');
      el.setPointerCapture?.(event.pointerId);
    }
    g.along = main * swipeSign(direction);
    g.samples.push({ t: event.timeStamp, along: g.along });
    if (g.samples.length > 12) g.samples.shift();
    const { x, y } = swipeOffset(direction, rubberBand(g.along));
    el.setAttribute('data-swipe', 'move');
    el.style.setProperty('--radix-toast-swipe-move-x', `${x}px`);
    el.style.setProperty('--radix-toast-swipe-move-y', `${y}px`);
  };

  const end = (event: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.pointerId !== event.pointerId) return;
    gesture.current = null;
    const el = event.currentTarget;
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    if (!g.started) return;
    // A swipe is not a click on the button it started on.
    el.addEventListener('click', (click) => click.preventDefault(), { once: true, capture: true });
    clearMove(el);
    // The release is the last sample: a finger that stopped before it lifted has no speed left.
    g.samples.push({ t: event.timeStamp, along: g.along });
    if (!cancelled && swipeCloses(g.along, swipeVelocity(g.samples))) {
      const { x, y } = swipeOffset(direction, g.along);
      el.setAttribute('data-swipe', 'end');
      el.style.setProperty('--radix-toast-swipe-end-x', `${x}px`);
      el.style.setProperty('--radix-toast-swipe-end-y', `${y}px`);
      store.dismiss(item.id);
      return;
    }
    el.setAttribute('data-swipe', 'cancel');
  };

  return (
    <RadixToast.Root
      asChild
      open={item.state === 'open'}
      duration={Infinity}
      type={toastUrgency(item.tone) === 'assertive' ? 'foreground' : 'background'}
      onOpenChange={(open) => {
        // Radix closes the newest toast on Escape from anywhere; only an Escape from inside the toaster counts.
        if (!open && !keepOnEscape.current) store.dismiss(item.id);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => end(event, false)}
      onPointerCancel={(event) => end(event, true)}
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
        {Number.isFinite(item.duration) && (
          // Keyed by version: a repeat or an update restarts the store's timer, and the line with it.
          <span
            key={item.version}
            data-part="progress"
            aria-hidden="true"
            style={{ '--_toast-life': `${item.duration}ms` } as CSSProperties}
          />
        )}
      </li>
    </RadixToast.Root>
  );
}
