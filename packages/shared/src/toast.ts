/**
 * The toast bus: a framework free queue of short notices, called from
 * anywhere (event handlers, fetch callbacks, error boundaries) without a
 * React or Angular context. Ported from GoBanana `components/studio/toastBus.ts`
 * with the dedupe rule of Figma-Killer-2 `ui/components/Toast/toastBus.ts`.
 *
 *   const id = toast('Draft saved');
 *   toast.danger({ title: 'Could not save draft', action: { label: 'Try again', onAction: save } });
 *   toast.update(id, { tone: 'success', title: 'Draft saved' });
 *   toast.dismiss(id);
 *
 * Rules:
 *
 * - Max visible. At most `max` toasts (default 3) are open at once. The rest
 *   wait in the queue, oldest first, and show when an open one closes.
 * - Dedupe by default. A toast that reads the same as an open or waiting one
 *   (same tone, title and description), or has the same `dedupeKey`, bumps
 *   that toast's `count` and restarts its timer instead of stacking a copy.
 *   `dedupeKey: false` turns it off for one call.
 * - Durations by tone: neutral, info and success 4s, warning 6s. A danger
 *   toast is persistent (duration Infinity) and stays until it is closed,
 *   and so is a toast with an action (WCAG 2.2.1: nobody has to race a
 *   timer to reach a button). `configure()` lengthens the durations and
 *   changes the max for the whole app.
 * - The store owns time. Each open toast with a finite duration has one
 *   timer, run through an injectable clock, so tests use a fake clock. The
 *   view only reports when to pause (hover, focus inside, window blurred) by
 *   calling `pause()` and `resume()`; the time left is kept.
 * - A closed toast stays in `visible` with state `closed` for its exit
 *   animation, then leaves on its own after `exitTimeout` (or when the view
 *   calls `remove(id)`), so nothing waits on an animation event.
 * - The close button (order M9.8, proposed). `closable` left out lets the
 *   view decide by platform: on ios a timed toast drops it, as a
 *   notification banner does; elsewhere it shows. `closable: false` asks
 *   for no close button, and the store keeps that only while the toast
 *   times out: a toast that stays until closed (danger, an action, or a
 *   duration of Infinity) always keeps its close button, so it can always
 *   be closed with a button (WCAG 2.2.1 and 2.5.7), and the store warns in
 *   development. A timed toast without a close button still closes with
 *   Escape when focused, with a swipe, and by its timer, which pauses on
 *   hover and focus and which `configure({ durations })` lengthens.
 * - The banner parts (order M9.8). `start` is what leads the toast in
 *   place of the tone icon: a system icon name, or `{ avatar: { name, src } }`
 *   for a person. `meta` is a short text or a `Date`; a view renders a
 *   `Date` with `toastMeta()` as a relative time ("now", "5m ago") in a
 *   `<time>` element, with Western digits in Arabic.
 *
 * No DOM, no React. `getSnapshot` returns the same object until something
 * changes, and `getServerSnapshot` a constant, so the store is safe for
 * `useSyncExternalStore` and for Angular signals.
 */
import { latinLocale } from './number';

/** The tone of a toast. The shared tone words, without accent. */
export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/** One optional button on a toast, for example "Try again". */
export interface ToastAction {
  /** A verb plus a noun in sentence case: Try again, Undo delete, Open draft. */
  label: string;
  /** Runs on click. The toast closes after it. */
  onAction: () => void;
  /**
   * What a screen reader user hears in place of the button, because the
   * announcement cannot be clicked: where else the same action lives, for
   * example "Save again from the File menu". Default: the label.
   */
  altText?: string;
}

/** A person at the start of a toast. The view draws an Avatar. */
export interface ToastAvatar {
  avatar: {
    /** The person or workspace name: the initials and the fallback color. */
    name: string;
    /** The image URL. */
    src?: string;
  };
}

/**
 * What leads a toast in place of its tone icon (convention 6): a system
 * icon name, or a person. A framework view may also take a node of its own
 * on its static Toast; the bus stays framework free.
 */
export type ToastStart = string | ToastAvatar;

/** True when a start value is a person. */
export function isToastAvatar(start: unknown): start is ToastAvatar {
  if (typeof start !== 'object' || start === null || !('avatar' in start)) return false;
  const avatar = (start as { avatar: unknown }).avatar;
  return typeof avatar === 'object' && avatar !== null && typeof (avatar as { name?: unknown }).name === 'string';
}

/** What `toast()` takes. Every field is optional, but a toast needs a title or a description. */
export interface ToastOptions {
  /** A fixed id. A call with the id of an open toast updates that toast. */
  id?: string;
  /** Default neutral. danger stays until closed. */
  tone?: ToastTone;
  /** One line: what happened, naming the thing. */
  title?: string;
  /** More detail, up to three lines. */
  description?: string;
  /** Milliseconds before it closes itself. Infinity keeps it. Default by tone. Ignored for danger and for a toast with an action. */
  duration?: number;
  action?: ToastAction;
  /** Same key, same toast: the count goes up. false turns dedupe off. Default: tone, title and description. */
  dedupeKey?: string | false;
  /** The language of the copy, when it differs from the page (for example "ar"). */
  lang?: string;
  /** Leads the toast in place of the tone icon: a system icon name or `{ avatar: { name, src } }`. */
  start?: ToastStart;
  /** A short text or a time, shown at the trailing top and read after the description. A `Date` reads as a relative time. */
  meta?: string | Date;
  /**
   * false drops the close button of a toast that times out. Ignored, with a
   * warning in development, for a toast that stays until closed (danger, an
   * action, a duration of Infinity). Left out, the view decides by platform:
   * no close button on a timed toast on ios, a close button elsewhere.
   */
  closable?: boolean;
}

/** What `update()` takes. */
export type ToastPatch = Omit<ToastOptions, 'id' | 'dedupeKey'>;

/** One toast in the store. Read only; change it through the store. */
export interface ToastItem {
  readonly id: string;
  readonly tone: ToastTone;
  readonly title?: string;
  readonly description?: string;
  /** Milliseconds, or Infinity for a toast that stays until closed. */
  readonly duration: number;
  readonly action?: ToastAction;
  readonly lang?: string;
  readonly start?: ToastStart;
  readonly meta?: string | Date;
  /**
   * false: no close button (only ever on a toast that times out). true: a
   * close button. undefined: the view decides by platform.
   */
  readonly closable?: boolean;
  /** The resolved dedupe key, or null when dedupe is off for this toast. */
  readonly key: string | null;
  /** How many times it was pushed while open. Shown as a count above 1. */
  readonly count: number;
  /** Goes up on every repeat and update, so a view can announce and restart. */
  readonly version: number;
  /** open while shown, closed while it plays its exit. */
  readonly state: 'open' | 'closed';
}

export interface ToastSnapshot {
  /** What a view renders, oldest first: the open toasts and those playing their exit. */
  readonly visible: readonly ToastItem[];
  /** Open toasts waiting for a place, oldest first. */
  readonly queued: readonly ToastItem[];
}

/** The time source. The default wraps Date.now, setTimeout and clearTimeout. */
export interface ToastClock {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface ToastStoreOptions {
  /** Most toasts open at once. Default 3. */
  max?: number;
  /** Default the real clock. */
  clock?: ToastClock;
  /** Overrides of the durations by tone. danger is always Infinity. */
  durations?: Partial<Record<Exclude<ToastTone, 'danger'>, number>>;
  /** Milliseconds a closed toast stays for its exit before it leaves the store. Default 1000. */
  exitTimeout?: number;
}

/** What `configure()` changes. */
export type ToastConfig = Pick<ToastStoreOptions, 'max' | 'durations'>;

export interface ToastStore {
  /** Changes the max and the durations by tone. New durations apply to toasts added after. */
  configure(config: ToastConfig): void;
  /** Adds a toast, or bumps or updates an existing one. Returns its id. */
  add(input: string | ToastOptions, options?: ToastOptions): string;
  /** Changes an open or waiting toast. Restarts its timer. False when there is no such toast. */
  update(id: string, patch: ToastPatch): boolean;
  /** Closes one toast, or every toast when no id is given. Waiting toasts leave at once. */
  dismiss(id?: string): void;
  /** Takes a closed toast out of the store, once its exit has played. */
  remove(id: string): void;
  /** Stops every timer and keeps the time left. */
  pause(): void;
  /** Starts the timers again with the time left. */
  resume(): void;
  isPaused(): boolean;
  subscribe(listener: () => void): () => void;
  getSnapshot(): ToastSnapshot;
  getServerSnapshot(): ToastSnapshot;
}

/** Durations by tone, in milliseconds. */
export const TOAST_DURATIONS: Readonly<Record<ToastTone, number>> = {
  neutral: 4000,
  info: 4000,
  success: 4000,
  warning: 6000,
  danger: Infinity,
};

/** Default most toasts open at once. */
export const TOAST_MAX_VISIBLE = 3;

/** Default time a closed toast keeps for its exit. Longer than any exit duration token. */
export const TOAST_EXIT_TIMEOUT = 1000;

/**
 * How urgently assistive tech announces a toast. danger interrupts
 * (assertive, Radix type "foreground"); the rest wait (polite, "background").
 */
export function toastUrgency(tone: ToastTone): 'assertive' | 'polite' {
  return tone === 'danger' ? 'assertive' : 'polite';
}

/**
 * The dedupe identity of a toast: the caller's key, or tone, title and
 * description joined by a character that cannot appear in copy. null when
 * dedupe is off. The action and the duration are not part of it: two toasts
 * that read the same are one event to the reader.
 */
export function toastDedupeKey(input: Pick<ToastOptions, 'tone' | 'title' | 'description' | 'dedupeKey'>): string | null {
  if (input.dedupeKey === false) return null;
  if (typeof input.dedupeKey === 'string') return `key\u0000${input.dedupeKey}`;
  return `auto\u0000${input.tone ?? 'neutral'}\u0000${input.title ?? ''}\u0000${input.description ?? ''}`;
}

/**
 * Whether a toast draws its close button. A toast that stays until closed
 * always has one. Otherwise the item's own answer wins; left open, a timed
 * toast on ios has none (a notification banner) and has one elsewhere.
 */
export function toastClosable(item: Pick<ToastItem, 'closable' | 'duration'>, platform: string | undefined): boolean {
  if (!Number.isFinite(item.duration)) return true;
  if (item.closable !== undefined) return item.closable;
  return platform !== 'ios';
}

/** The text of a `meta` value and, for a time, its machine readable form. */
export interface ToastMetaText {
  text: string;
  /** An ISO time for the `datetime` attribute, when meta is a `Date`. */
  dateTime?: string;
}

/**
 * The text of a toast's `meta`. A string stays as it is. A `Date` reads as
 * a relative time in the toast's language, short as a banner writes it:
 * "now" under a minute, then "5m ago", "2h ago", "3d ago"; in Arabic
 * "الآن" and "قبل 5 دقائق", always with Western digits.
 */
export function toastMeta(meta: string | Date, lang: string | undefined, now: number = Date.now()): ToastMetaText {
  if (typeof meta === 'string') return { text: meta };
  const time = meta.getTime();
  if (Number.isNaN(time)) return { text: '' };
  const rtf = new Intl.RelativeTimeFormat(latinLocale(lang || 'en'), { style: 'narrow', numeric: 'auto' });
  const seconds = Math.round((time - now) / 1000);
  const abs = Math.abs(seconds);
  let text: string;
  if (abs < 60) text = rtf.format(0, 'second');
  else if (abs < 3_600) text = rtf.format(Math.round(seconds / 60), 'minute');
  else if (abs < 86_400) text = rtf.format(Math.round(seconds / 3_600), 'hour');
  else if (abs < 7 * 86_400) text = rtf.format(Math.round(seconds / 86_400), 'day');
  else text = rtf.format(Math.round(seconds / (7 * 86_400)), 'week');
  return { text, dateTime: meta.toISOString() };
}

/** Development only: a toast that stays until closed asked to drop its close button. */
function warnClosable(title: string | undefined): void {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
  if (env === 'production') return;
  console.warn(
    `toast: closable false is ignored for "${title ?? 'a toast'}". A danger toast, a toast with an action and a toast with no timeout stay until closed, so they keep their close button.`,
  );
}

/** The close answer the store keeps: false only on a toast that times out. */
function resolveClosable(asked: boolean | undefined, duration: number, title: string | undefined): boolean | undefined {
  if (asked !== false) return asked;
  if (Number.isFinite(duration)) return false;
  warnClosable(title);
  return true;
}

const EMPTY: ToastSnapshot = Object.freeze({ visible: Object.freeze([]), queued: Object.freeze([]) });

const realClock: ToastClock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

interface Entry {
  item: ToastItem;
  /** How the key was made, so an update can make it again. */
  keyMode: 'auto' | 'custom' | 'off';
  /** Time left on the timer, in ms. */
  remaining: number;
  startedAt: number;
  handle: unknown;
  /** True once the toast has had a place on screen. */
  shown: boolean;
  /** What the caller asked for the close button, kept so an update can resolve it again. */
  askedClosable: boolean | undefined;
}

function normalize(input: string | ToastOptions, options?: ToastOptions): ToastOptions {
  return typeof input === 'string' ? { ...options, title: input } : { ...input, ...options };
}

/** Creates a toast store. Most apps use the default one behind `toast()`. */
export function createToastStore(options: ToastStoreOptions = {}): ToastStore {
  let max = Math.max(1, options.max ?? TOAST_MAX_VISIBLE);
  const clock = options.clock ?? realClock;
  const exitTimeout = options.exitTimeout ?? TOAST_EXIT_TIMEOUT;
  let durations: Record<ToastTone, number> = { ...TOAST_DURATIONS, ...options.durations, danger: Infinity };

  /** Every toast in the store, oldest first: open (shown or waiting) and closed. */
  let entries: Entry[] = [];
  let paused = false;
  let seq = 0;
  let snapshot: ToastSnapshot = EMPTY;
  const exits = new Map<string, unknown>();
  const listeners = new Set<() => void>();

  const durationFor = (tone: ToastTone, asked: number | undefined, action: ToastAction | undefined): number => {
    if (tone === 'danger' || action !== undefined) return Infinity;
    if (asked === undefined || Number.isNaN(asked) || asked <= 0) return durations[tone];
    return asked;
  };

  const stopTimer = (e: Entry) => {
    if (e.handle === null) return;
    clock.clearTimeout(e.handle);
    e.handle = null;
    e.remaining = Math.max(0, e.remaining - (clock.now() - e.startedAt));
  };

  const startTimer = (e: Entry) => {
    if (paused || e.handle !== null || e.item.state !== 'open' || !e.shown) return;
    if (!Number.isFinite(e.remaining)) return;
    e.startedAt = clock.now();
    e.handle = clock.setTimeout(() => {
      e.handle = null;
      e.remaining = 0;
      close(e.item.id);
    }, e.remaining);
  };

  const restartTimer = (e: Entry) => {
    stopTimer(e);
    e.remaining = e.item.duration;
    startTimer(e);
  };

  /** Gives places to waiting toasts, rebuilds the snapshot and tells the listeners. */
  const commit = () => {
    let open = 0;
    for (const e of entries) {
      if (e.item.state !== 'open') continue;
      if (open < max) {
        if (!e.shown) {
          e.shown = true;
          e.remaining = e.item.duration;
          startTimer(e);
        }
        open += 1;
      }
    }
    const visible = entries.filter((e) => e.shown).map((e) => e.item);
    const queued = entries.filter((e) => !e.shown).map((e) => e.item);
    snapshot = visible.length === 0 && queued.length === 0 ? EMPTY : { visible, queued };
    for (const l of [...listeners]) l();
  };

  const find = (id: string) => entries.find((e) => e.item.id === id);

  function close(id: string): void {
    const e = find(id);
    if (!e || e.item.state !== 'open') return;
    stopTimer(e);
    if (!e.shown) {
      entries = entries.filter((x) => x !== e);
    } else {
      e.item = { ...e.item, state: 'closed' };
      exits.set(
        id,
        clock.setTimeout(() => {
          exits.delete(id);
          remove(id);
        }, exitTimeout),
      );
    }
    commit();
  }

  function remove(id: string): void {
    const e = find(id);
    if (!e || e.item.state !== 'closed') return;
    const exit = exits.get(id);
    if (exit !== undefined) {
      clock.clearTimeout(exit);
      exits.delete(id);
    }
    entries = entries.filter((x) => x !== e);
    commit();
  }

  function update(id: string, patch: ToastPatch): boolean {
    const e = find(id);
    if (!e || e.item.state !== 'open') return false;
    const prev = e.item;
    const tone = patch.tone ?? prev.tone;
    const has = (k: keyof ToastPatch) => Object.prototype.hasOwnProperty.call(patch, k);
    const title = has('title') ? patch.title : prev.title;
    const description = has('description') ? patch.description : prev.description;
    const action = has('action') ? patch.action : prev.action;
    // A new tone, or an action taken away, brings the tone's own duration back, unless the patch names one.
    let duration: number;
    if (tone === 'danger' || action !== undefined) duration = Infinity;
    else if (has('duration')) duration = durationFor(tone, patch.duration, undefined);
    else if (tone !== prev.tone || prev.action !== undefined) duration = durations[tone];
    else duration = prev.duration;
    const key = e.keyMode === 'auto' ? toastDedupeKey({ tone, title, description }) : prev.key;
    if (has('closable')) e.askedClosable = patch.closable;
    e.item = {
      ...prev,
      tone,
      title,
      description,
      duration,
      action,
      lang: has('lang') ? patch.lang : prev.lang,
      start: has('start') ? patch.start : prev.start,
      meta: has('meta') ? patch.meta : prev.meta,
      closable: resolveClosable(e.askedClosable, duration, title),
      key,
      version: prev.version + 1,
    };
    if (e.shown) restartTimer(e);
    commit();
    return true;
  }

  function add(input: string | ToastOptions, extra?: ToastOptions): string {
    const o = normalize(input, extra);
    if (o.id !== undefined) {
      const same = find(o.id);
      if (same && same.item.state === 'open') {
        update(o.id, o);
        return o.id;
      }
      // A closed toast with this id leaves now, so the new one can take the id.
      if (same) {
        const exit = exits.get(o.id);
        if (exit !== undefined) clock.clearTimeout(exit);
        exits.delete(o.id);
        entries = entries.filter((x) => x !== same);
      }
    }
    const tone = o.tone ?? 'neutral';
    const key = toastDedupeKey({ ...o, tone });
    const existing = key === null ? undefined : entries.find((e) => e.item.state === 'open' && e.item.key === key);
    if (existing) {
      const action = o.action ?? existing.item.action;
      const bumped = action !== undefined ? Infinity : existing.item.duration;
      existing.item = {
        ...existing.item,
        count: existing.item.count + 1,
        version: existing.item.version + 1,
        action,
        duration: bumped,
        closable: resolveClosable(existing.askedClosable, bumped, existing.item.title),
      };
      if (existing.shown) restartTimer(existing);
      commit();
      return existing.item.id;
    }
    seq += 1;
    const id = o.id ?? `toast-${seq}`;
    const duration = durationFor(tone, o.duration, o.action);
    const item: ToastItem = {
      id,
      tone,
      title: o.title,
      description: o.description,
      duration,
      action: o.action,
      lang: o.lang,
      start: o.start,
      meta: o.meta,
      closable: resolveClosable(o.closable, duration, o.title),
      key,
      count: 1,
      version: 1,
      state: 'open',
    };
    entries = [
      ...entries,
      {
        item,
        keyMode: o.dedupeKey === false ? 'off' : typeof o.dedupeKey === 'string' ? 'custom' : 'auto',
        remaining: duration,
        startedAt: 0,
        handle: null,
        shown: false,
        askedClosable: o.closable,
      },
    ];
    commit();
    return id;
  }

  return {
    configure(config) {
      if (config.max !== undefined) max = Math.max(1, config.max);
      if (config.durations) durations = { ...durations, ...config.durations, danger: Infinity };
      commit();
    },
    add,
    update,
    remove,
    dismiss(id) {
      if (id !== undefined) {
        close(id);
        return;
      }
      const open = entries.filter((e) => e.item.state === 'open').map((e) => e.item.id);
      if (open.length === 0) return;
      // Waiting toasts leave first, so closing the shown ones does not pull them in.
      entries = entries.filter((e) => e.shown || e.item.state !== 'open');
      for (const openId of open) close(openId);
      commit();
    },
    pause() {
      if (paused) return;
      for (const e of entries) stopTimer(e);
      paused = true;
    },
    resume() {
      if (!paused) return;
      paused = false;
      for (const e of entries) startTimer(e);
    },
    isPaused: () => paused,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => EMPTY,
  };
}

/** `toast()` and its helpers, bound to one store. */
export interface ToastFunction {
  /** Shows a toast. A string is the title. Returns the id. */
  (message: string | ToastOptions, options?: ToastOptions): string;
  success(message: string | ToastOptions, options?: ToastOptions): string;
  /** A danger toast stays until it is closed. */
  danger(message: string | ToastOptions, options?: ToastOptions): string;
  warning(message: string | ToastOptions, options?: ToastOptions): string;
  info(message: string | ToastOptions, options?: ToastOptions): string;
  /** Closes one toast, or all of them. */
  dismiss(id?: string): void;
  /** Changes a toast in place, for example "Saving draft" to "Draft saved". */
  update(id: string, patch: ToastPatch): boolean;
  /** Changes the max and the durations of the store, for example longer toasts for the whole app. */
  configure(config: ToastConfig): void;
  /** The store behind this function, for a view to subscribe to. */
  readonly store: ToastStore;
}

/** Binds `toast()` to a store. */
export function createToastFunction(store: ToastStore): ToastFunction {
  const withTone = (tone: ToastTone) => (message: string | ToastOptions, options?: ToastOptions) =>
    store.add(normalize(message, { ...options, tone }));
  return Object.assign((message: string | ToastOptions, options?: ToastOptions) => store.add(message, options), {
    success: withTone('success'),
    danger: withTone('danger'),
    warning: withTone('warning'),
    info: withTone('info'),
    dismiss: (id?: string) => store.dismiss(id),
    update: (id: string, patch: ToastPatch) => store.update(id, patch),
    configure: (config: ToastConfig) => store.configure(config),
    store,
  });
}

/** The app wide store that `Toaster` renders by default. */
export const toastStore: ToastStore = createToastStore();

/** Shows a toast on the app wide store. See the header of this file. */
export const toast: ToastFunction = createToastFunction(toastStore);
