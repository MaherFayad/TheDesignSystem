// Toaster: mount once near the root, inside the root dsTheme. The twin of
// packages/react/src/components/Toast/Toaster.tsx, on the DOM Radix Toast
// renders there, so Toast.css applies as is:
//
//   <body>
//     <div data-toaster-layer data-ds="theme" aria-live="off" ...axes>      the portal theme, display: contents
//       <span data-toaster-announce="polite" role="status">              visually hidden live regions
//       <span data-toaster-announce="assertive" role="alert">
//       <div role="region" aria-label="Notifications" tabindex="-1">    the Radix viewport wrapper
//         <span tabindex="0">                                            focus proxy, while toasts show
//         <ol data-ds="toaster" data-position tabindex="-1">
//           <li data-ds="toast" data-state data-swipe-direction data-tone tabindex="0">...parts
//         <span tabindex="0">                                            focus proxy, while toasts show
//
//   <ng-container dsToaster />
//   toast.success('Draft saved');
//
// Who owns time: the store (`@the-system/shared` toast.ts). The view only
// tells it when to pause: while the pointer is over the toasts, while focus
// is inside them, and while the window is blurred or the tab hidden, the
// same rule as React. danger toasts and toasts with an action stay until
// closed, because the store gives them an infinite duration.
//
// Announce once per change (WCAG 4.1.3): two visually hidden live regions
// inside the layer, polite and assertive (danger), read "label. title.
// description. action alternative" when a toast shows and again on each
// repeat or update. The toast itself has no live role.
//
// The themed portal: a CDK ComponentPortal into document.body, as Dialog
// does. The layer's host is created from its selector, so it is the themed
// wrapper itself, with every axis copied from the dsTheme the toaster is
// declared in. It carries aria-live="off", so a modal dialog's hideOthers
// leaves it in the accessibility tree; it sits on z.toast, above z.dialog.
//
// Keys, as Radix Toast: F8 focuses the list; Tab and Shift+Tab walk the
// toasts newest first through two focus proxies; Escape closes a toast only
// when the key comes from inside the toaster (the focused toast, or the
// newest from the list) and is never prevented.
//
// Motion (order 1.23), as React's Toaster.tsx. The toasts share one grid
// cell and stack with depth (data-stacked on the list): the newest in front,
// the older ones behind it, peeking past it, smaller, clipped to the strip
// that shows. toast-stack.ts in @the-system/motion measures the toasts
// and writes their place; Toast.css draws it with translate, scale and
// clip-path and transitions them. While the pointer is over the toasts or
// focus is inside them the list carries data-expanded and the stack opens
// into a list. The list carries data-paused whenever the store is paused
// (hover, focus, window blurred, tab hidden): the progress line of a timed
// toast (its `progress` part, a CSS animation over the toast's duration)
// pauses on it, so the line and the store's timer move together (WCAG
// 2.2.1); a repeat or an update (a new version) starts both again. The swipe
// is React's (toast-swipe.ts in @the-system/motion): the toast follows the finger toward
// its edge, gives a little against the other way, and closes past a distance
// or on a fast flick; let go short, it springs back. Layout never animates
// and the store never waits.
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
  type Signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { toastStore, toastUrgency, type ToastAction, type ToastItem, type ToastSnapshot, type ToastStore } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import {
  START_BUFFER,
  swipeAxis,
  swipeCloses,
  swipeOffset,
  swipeRubberBand,
  swipeSign,
  swipeVelocity,
  watchStack,
  type SwipeDirection,
  type SwipeSample,
} from '@the-system/motion';
import { animationsDone } from '../../behavior';
import { DsThemeScope, DsThemeService, attributesOf, themeScopeProviders } from '../../theme';
import type { ThemeValue } from '../../theme';
import { TOAST_PARTS_IMPORTS, TOAST_PARTS_TEMPLATE, toastDirFor, toastIcons, toastLabelsFor, type ToastPartsData } from './toast';

/** Where the toasts sit. end is the inline end: right in English, left in Arabic. */
export type ToasterPosition = 'bottom-end' | 'bottom-center' | 'top-end' | 'top-center';

/**
 * The positions a toaster takes: one of `ToasterPosition`, or `auto`, which
 * follows the platform axis of the theme: top-center on ios (a banner from
 * the top), bottom-end elsewhere (android.css then places the snackbar at
 * the start). The list carries the resolved value in data-position.
 */
export type ToasterPositionProp = ToasterPosition | 'auto';

/** The position `auto` resolves to on a platform. */
export function resolveToasterPosition(position: ToasterPositionProp, platform: string | undefined): ToasterPosition {
  if (position !== 'auto') return position;
  return platform === 'ios' ? 'top-center' : 'bottom-end';
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

/** Radix's tab stops inside a toast: tabIndex 0 or more, not disabled or hidden. */
function tabbableCandidates(container: HTMLElement): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  const doc = container.ownerDocument;
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const el = node as HTMLElement & { disabled?: boolean; type?: string };
      if (el.disabled || el.hidden || (el.tagName === 'INPUT' && el.type === 'hidden')) return NodeFilter.FILTER_SKIP;
      return el.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  while (walker.nextNode()) nodes.push(walker.currentNode as HTMLElement);
  return nodes;
}

/** Focuses the first candidate that takes focus. True when focus moved or was already on one. */
function focusFirst(candidates: HTMLElement[]): boolean {
  const before = candidates[0]?.ownerDocument.activeElement ?? null;
  return candidates.some((candidate) => {
    if (candidate === before) return true;
    candidate.focus();
    return candidate.ownerDocument.activeElement !== before;
  });
}

/** One announcement: the toast label in the page language, then the toast's text in its own. */
interface Line {
  key: string;
  label: string;
  text: string;
  lang?: string;
  urgent: boolean;
}

/** The visually hidden style of Radix VisuallyHidden, as React serializes it. */
const HIDDEN = 'border: 0px; width: 1px; height: 1px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; overflow-wrap: normal;';

interface ToasterData {
  toaster: DsToaster;
  theme: Signal<ThemeValue>;
}

const TOASTER = new InjectionToken<ToasterData>('DS_TOASTER');

// ------------------------------------------------------------------ dsToaster

/**
 * Mount once near the root, inside the root dsTheme. Renders no element of
 * its own: put it on an ng-container. Renders the toasts of `toast()`.
 */
@Directive({ selector: '[dsToaster]', exportAs: 'dsToaster' })
export class DsToaster {
  /** Default bottom-end. `auto` follows the platform axis (see `ToasterPositionProp`). */
  readonly position = input<ToasterPositionProp>('bottom-end');
  /** The name of the notifications region. Default "Notifications" (Arabic under lang ar). `{hotkey}` is replaced by the hotkey. */
  readonly label = input<string | undefined>(undefined);
  /** The keys that move focus to the toasts, as KeyboardEvent code or modifier names. Default ["F8"]. */
  readonly hotkey = input<string[]>(['F8']);
  /** Read before each toast's text by screen readers. Default "Notification" (Arabic under lang ar). */
  readonly toastLabel = input<string | undefined>(undefined);
  /** The accessible name of each close button. Default "Close notification" (Arabic under lang ar). */
  readonly closeLabel = input<string | undefined>(undefined);
  /** The store to render. Default the app wide store behind `toast()`. */
  readonly store = input<ToastStore>(toastStore);

  private readonly theme = inject(DsThemeService);
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  private readonly doc = inject(DOCUMENT);
  private outlet: DomPortalOutlet | null = null;

  constructor() {
    consumeHostAttributes(['dsToaster', 'position', 'label', 'hotkey', 'toastLabel', 'closeLabel', 'store']);
    // The portal needs the document, so it mounts after the first render (safe on the server).
    afterNextRender(() => this.mount());
    inject(DestroyRef).onDestroy(() => this.unmount());
  }

  private mount(): void {
    if (this.outlet) return;
    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: TOASTER, useValue: { toaster: this, theme: this.theme.value } satisfies ToasterData }],
    });
    this.outlet = new DomPortalOutlet(this.doc.body, this.appRef, injector);
    const ref = this.outlet.attach(new ComponentPortal(DsToasterLayer, null, injector));
    ref.changeDetectorRef.detectChanges();
  }

  private unmount(): void {
    // detach, not dispose: DomPortalOutlet.dispose removes its outlet element, here document.body.
    this.outlet?.detach();
    this.outlet = null;
  }
}

// ------------------------------------------------------------------ one toast in the toaster

@Component({
  selector: 'li[dsToasterItem]',
  imports: [TOAST_PARTS_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'toast',
    'data-radix-collection-item': '',
    tabindex: '0',
    style: 'user-select: none; touch-action: none;',
    '[attr.data-state]': 'item().state',
    '[attr.data-swipe-direction]': 'layer.swipeDirection()',
    '[attr.data-tone]': 'item().tone',
    '[attr.lang]': 'item().lang ?? null',
    '[attr.dir]': 'toastDirFor(item().lang) ?? null',
    '(keydown)': 'onKeydown($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'end($event, false)',
    '(pointercancel)': 'end($event, true)',
  },
  // The progress line is keyed by version: a repeat or an update restarts the store's timer, and the line with it.
  template: `${TOAST_PARTS_TEMPLATE}@for (life of life(); track life.version) {<span data-part="progress" aria-hidden="true" [style.--_toast-life]="life.duration + 'ms'"></span>}`,
})
export class DsToasterItem {
  readonly item = input.required<ToastItem>();

  protected readonly layer = inject(DsToasterLayer);
  protected readonly icons = toastIcons;
  protected readonly toastDirFor = toastDirFor;
  readonly element = consumeHostAttributes(['dsToasterItem']);
  private readonly injector = inject(Injector);
  private gesture: Gesture | null = null;
  private leaving = false;

  /** The timed toast's line, one entry per version; none for a toast that stays until closed. */
  protected readonly life = computed(() => {
    const item = this.item();
    return Number.isFinite(item.duration) ? [{ version: item.version, duration: item.duration }] : [];
  });

  protected readonly parts = computed<ToastPartsData>(() => {
    const item = this.item();
    return {
      tone: item.tone,
      title: item.title,
      description: item.description,
      count: item.count,
      action: item.action,
      closeLabel: item.lang !== undefined ? toastLabelsFor(item.lang).close : this.layer.closeLabel(),
      closable: true,
    };
  });

  constructor() {
    // A closed toast plays its exit, then leaves the store at once (or after
    // the store's exitTimeout). Under reduced motion there is no animation,
    // so it leaves on the next render, as Radix Presence unmounts it.
    effect(() => {
      if (this.item().state !== 'closed' || this.leaving) return;
      this.leaving = true;
      const id = untracked(this.item).id;
      afterNextRender(
        () => {
          void animationsDone([this.element]).then(() => this.layer.store().remove(id));
        },
        { injector: this.injector },
      );
    });
    this.layer.register(this);
    inject(DestroyRef).onDestroy(() => this.layer.unregister(this));
  }

  /** Radix handleClose: focus in the toast moves to the list, then the toast closes. */
  close(): void {
    const doc = this.element.ownerDocument;
    if (this.element.contains(doc.activeElement)) this.layer.viewport()?.nativeElement.focus();
    this.layer.store().dismiss(this.item().id);
  }

  protected runAction(action: ToastAction): void {
    action.onAction();
    this.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    this.layer.escapeHandled = event;
    this.close();
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.item().state !== 'open') return;
    this.gesture = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      buffer: event.pointerType === 'touch' ? START_BUFFER.touch : START_BUFFER.other,
      started: false,
      samples: [],
      along: 0,
    };
  }

  private clearMove(): void {
    this.element.style.removeProperty('--radix-toast-swipe-move-x');
    this.element.style.removeProperty('--radix-toast-swipe-move-y');
  }

  protected onPointerMove(event: PointerEvent): void {
    const g = this.gesture;
    if (!g || g.pointerId !== event.pointerId) return;
    const el = this.element;
    const direction = this.layer.swipeDirection();
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    const axis = swipeAxis(direction);
    const main = axis === 'x' ? dx : dy;
    const cross = axis === 'x' ? dy : dx;
    if (!g.started) {
      if (Math.abs(main) <= g.buffer && Math.abs(cross) <= g.buffer) return;
      // A gesture that starts across the axis is not a swipe.
      if (Math.abs(cross) > Math.abs(main)) {
        this.gesture = null;
        return;
      }
      g.started = true;
      el.setAttribute('data-swipe', 'start');
      el.setPointerCapture?.(event.pointerId);
    }
    g.along = main * swipeSign(direction);
    g.samples.push({ t: event.timeStamp, along: g.along });
    if (g.samples.length > 12) g.samples.shift();
    const { x, y } = swipeOffset(direction, swipeRubberBand(g.along));
    el.setAttribute('data-swipe', 'move');
    el.style.setProperty('--radix-toast-swipe-move-x', `${x}px`);
    el.style.setProperty('--radix-toast-swipe-move-y', `${y}px`);
  }

  protected end(event: PointerEvent, cancelled: boolean): void {
    const g = this.gesture;
    if (!g || g.pointerId !== event.pointerId) return;
    this.gesture = null;
    const el = this.element;
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    if (!g.started) return;
    // A swipe is not a click on the button it started on.
    el.addEventListener('click', (click) => click.preventDefault(), { once: true, capture: true });
    this.clearMove();
    // The release is the last sample: a finger that stopped before it lifted has no speed left.
    g.samples.push({ t: event.timeStamp, along: g.along });
    if (!cancelled && swipeCloses(g.along, swipeVelocity(g.samples))) {
      const { x, y } = swipeOffset(this.layer.swipeDirection(), g.along);
      el.setAttribute('data-swipe', 'end');
      el.style.setProperty('--radix-toast-swipe-end-x', `${x}px`);
      el.style.setProperty('--radix-toast-swipe-end-y', `${y}px`);
      this.layer.store().dismiss(this.item().id);
      return;
    }
    el.setAttribute('data-swipe', 'cancel');
  }
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

// ------------------------------------------------------------------ the layer

/**
 * The portal: the themed wrapper (its own host), the live regions and the
 * Radix viewport DOM. Internal: dsToaster creates it.
 */
@Component({
  selector: 'div[data-toaster-layer]',
  imports: [DsToasterItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: themeScopeProviders(() => new DsThemeScope(inject(TOASTER).theme)),
  host: {
    'data-ds': 'theme',
    'aria-live': 'off',
    '[attr.data-style]': 'attrs()["data-style"]',
    '[attr.data-scheme]': 'attrs()["data-scheme"]',
    '[attr.data-density]': 'attrs()["data-density"]',
    '[attr.data-contrast]': 'attrs()["data-contrast"]',
    '[attr.data-platform]': 'attrs()["data-platform"]',
    '[attr.data-glass]': 'attrs()["data-glass"]',
    '[attr.dir]': 'attrs().dir',
    '[attr.lang]': 'attrs().lang',
    '(pointerover)': 'onPointerOver($event)',
    '(pointerout)': 'onPointerOut($event)',
    '(focusin)': 'focused.set(true)',
    '(focusout)': 'onFocusOut($event)',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    <span aria-atomic="false" aria-live="polite" data-toaster-announce="polite" role="status" style="position: absolute; ${HIDDEN}">@for (line of polite(); track line.key) {<p><ng-container>{{ line.label }}</ng-container>.<ng-container>{{ ' ' }}</ng-container><span [attr.lang]="line.lang ?? null" [attr.dir]="toastDirFor(line.lang) ?? null">{{ line.text }}</span></p>}</span>
    <span aria-atomic="false" aria-live="assertive" data-toaster-announce="assertive" role="alert" style="position: absolute; ${HIDDEN}">@for (line of assertive(); track line.key) {<p><ng-container>{{ line.label }}</ng-container>.<ng-container>{{ ' ' }}</ng-container><span [attr.lang]="line.lang ?? null" [attr.dir]="toastDirFor(line.lang) ?? null">{{ line.text }}</span></p>}</span>
    <div role="region" tabindex="-1" [attr.aria-label]="regionLabel()" [style.pointer-events]="hasToasts() ? null : 'none'">
      @if (hasToasts()) {
        <span #head tabindex="0" style="position: fixed; ${HIDDEN}" (focus)="onProxyFocus($event, 'forwards')"></span>
      }
      <ol #viewport data-ds="toaster" [attr.data-position]="position()" data-stacked="" [attr.data-expanded]="expanded() ? '' : null"
        [attr.data-paused]="paused() ? '' : null" tabindex="-1" (keydown)="onViewportKeydown($event)">
        @for (item of items(); track item.id) {
          <li dsToasterItem [item]="item"></li>
        }
      </ol>
      @if (hasToasts()) {
        <span #tail tabindex="0" style="position: fixed; ${HIDDEN}" (focus)="onProxyFocus($event, 'backwards')"></span>
      }
    </div>
  `,
})
export class DsToasterLayer {
  private readonly data = inject(TOASTER);
  protected readonly toaster = this.data.toaster;
  private readonly theme = inject(DsThemeService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);

  readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly head = viewChild<ElementRef<HTMLElement>>('head');
  private readonly tail = viewChild<ElementRef<HTMLElement>>('tail');

  readonly store = this.toaster.store;
  private readonly snapshot = signal<ToastSnapshot>(toastStore.getServerSnapshot());
  protected readonly items = computed(() => this.snapshot().visible);
  protected readonly hasToasts = computed(() => this.items().length > 0);
  protected readonly attrs = computed(() => attributesOf(this.theme.value()));
  private readonly words = computed(() => toastLabelsFor(this.theme.value().lang));
  readonly closeLabel = computed(() => this.toaster.closeLabel() ?? this.words().close);
  private readonly announceLabel = computed(() => this.toaster.toastLabel() ?? this.words().toast);
  protected readonly position = computed(() => resolveToasterPosition(this.toaster.position(), this.theme.value().platform));
  readonly swipeDirection = computed(() => swipeFor(this.position(), this.theme.value().dir));
  protected readonly regionLabel = computed(() => {
    const hotkey = this.toaster.hotkey().join('+').replace(/Key/g, '').replace(/Digit/g, '');
    return (this.toaster.label() ?? this.words().region).replace('{hotkey}', hotkey);
  });
  protected readonly toastDirFor = toastDirFor;

  readonly focused = signal(false);
  private readonly hovered = signal(false);
  private readonly away = signal(false);
  private readonly hidden = signal(false);
  /** The one boolean that pauses the store and the progress lines (data-paused). */
  protected readonly paused = computed(() => this.hovered() || this.focused() || this.away() || this.hidden());
  private readonly anyOpen = computed(() => this.items().some((t) => t.state === 'open'));
  /** The stack opens into a list while the pointer is over it or focus is inside (data-expanded). */
  protected readonly expanded = computed(() => (this.hovered() || this.focused()) && this.anyOpen());
  private readonly lines = signal<Line[]>([]);
  protected readonly polite = computed(() => this.lines().filter((l) => !l.urgent));
  protected readonly assertive = computed(() => this.lines().filter((l) => l.urgent));

  private readonly members = new Set<DsToasterItem>();
  private readonly seen = new Map<string, number>();
  private pending: Line[] = [];
  private flush: ReturnType<typeof setTimeout> | null = null;
  private clear: ReturnType<typeof setTimeout> | null = null;
  /** The Escape a toast already handled, so the layer does not close a second one. */
  escapeHandled: KeyboardEvent | null = null;

  constructor() {
    effect((onCleanup) => {
      const store = this.store();
      this.snapshot.set(store.getSnapshot());
      onCleanup(store.subscribe(() => this.snapshot.set(store.getSnapshot())));
    });

    // Pause while hovered, focused, or the window is away; the store keeps the time left.
    effect(() => {
      const store = this.store();
      if (this.paused()) store.pause();
      else store.resume();
    });

    // An emptied stack gives no pointerout, so the hover flag resets with it.
    effect(() => {
      if (!this.anyOpen()) untracked(() => this.hovered.set(false));
    });

    // Announce each toast once when it shows, and once per repeat or update.
    effect(() => {
      const snapshot = this.snapshot();
      const label = this.announceLabel();
      untracked(() => this.announce(snapshot, label));
    });

    // The stack: each toast's place, written before the next paint (toast-stack.ts in @the-system/motion).
    let stopStack: (() => void) | null = null;
    afterNextRender(() => {
      const viewport = this.viewport()?.nativeElement;
      if (viewport) stopStack = watchStack(viewport);
    });

    const win = this.doc.defaultView;
    const onBlur = () => this.away.set(true);
    const onFocus = () => this.away.set(false);
    const onVisibility = () => this.hidden.set(this.doc.visibilityState === 'hidden');
    const onHotkey = (event: KeyboardEvent) => {
      const keys = this.toaster.hotkey();
      const pressed =
        keys.length !== 0 && keys.every((key) => (event as unknown as Record<string, unknown>)[key] === true || event.code === key);
      if (pressed) this.viewport()?.nativeElement.focus();
    };
    win?.addEventListener('blur', onBlur);
    win?.addEventListener('focus', onFocus);
    this.doc.addEventListener('visibilitychange', onVisibility);
    this.doc.addEventListener('keydown', onHotkey);

    inject(DestroyRef).onDestroy(() => {
      win?.removeEventListener('blur', onBlur);
      win?.removeEventListener('focus', onFocus);
      this.doc.removeEventListener('visibilitychange', onVisibility);
      this.doc.removeEventListener('keydown', onHotkey);
      if (this.flush !== null) clearTimeout(this.flush);
      if (this.clear !== null) clearTimeout(this.clear);
      stopStack?.();
      this.store().resume();
    });
  }

  register(item: DsToasterItem): void {
    this.members.add(item);
  }

  unregister(item: DsToasterItem): void {
    this.members.delete(item);
  }

  private announce(snapshot: ToastSnapshot, label: string): void {
    const live = new Set(snapshot.visible.map((t) => t.id));
    for (const id of [...this.seen.keys()]) if (!live.has(id)) this.seen.delete(id);
    const fresh = snapshot.visible.filter((t) => t.state === 'open' && this.seen.get(t.id) !== t.version);
    if (fresh.length === 0) return;
    for (const t of fresh) {
      this.seen.set(t.id, t.version);
      this.pending.push({
        key: `${t.id}:${t.version}`,
        label: t.lang !== undefined ? toastLabelsFor(t.lang).toast : label,
        text: toastAnnouncement(t),
        lang: t.lang,
        urgent: toastUrgency(t.tone) === 'assertive',
      });
    }
    if (this.flush !== null) return;
    // Empty the regions first, so the same words are read again on a repeat.
    this.lines.set([]);
    this.flush = setTimeout(() => {
      this.flush = null;
      this.lines.set(this.pending);
      this.pending = [];
      if (this.clear !== null) clearTimeout(this.clear);
      this.clear = setTimeout(() => this.lines.set([]), 5000);
    }, 100);
  }

  protected onPointerOver(event: PointerEvent): void {
    if ((event.target as Element | null)?.closest?.('[data-ds="toast"]')) this.hovered.set(true);
  }

  /** The expanded list takes the pointer in its gaps too (Toast.css), so moving between two toasts keeps it open. */
  protected onPointerOut(event: PointerEvent): void {
    const next = event.relatedTarget as Element | null;
    if (!next?.closest?.('[data-ds="toaster"]')) this.hovered.set(false);
  }

  protected onFocusOut(event: FocusEvent): void {
    if (!(event.relatedTarget instanceof Node && this.host.contains(event.relatedTarget))) this.focused.set(false);
  }

  /** Escape from inside the toaster but outside any toast (the list, a proxy) closes the newest open toast. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || this.escapeHandled === event) return;
    const items = this.items().filter((t) => t.state === 'open');
    const newest = items[items.length - 1];
    if (!newest) return;
    for (const member of this.members) if (member.item().id === newest.id) member.close();
  }

  /** The toasts' tab stops, newest first going forwards, as Radix sorts them. */
  private sortedCandidates(direction: 'forwards' | 'backwards'): HTMLElement[] {
    const lis = Array.from(this.viewport()?.nativeElement.children ?? []) as HTMLElement[];
    const groups = lis.map((li) => {
      const list = [li, ...tabbableCandidates(li)];
      return direction === 'forwards' ? list : list.reverse();
    });
    return (direction === 'forwards' ? groups.reverse() : groups).flat();
  }

  protected onViewportKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const viewport = this.viewport()?.nativeElement;
    const focused = this.doc.activeElement;
    const backwards = event.shiftKey;
    if (event.target === viewport && backwards) {
      this.head()?.nativeElement.focus();
      return;
    }
    const sorted = this.sortedCandidates(backwards ? 'backwards' : 'forwards');
    const index = sorted.findIndex((c) => c === focused);
    if (focusFirst(sorted.slice(index + 1))) event.preventDefault();
    else (backwards ? this.head() : this.tail())?.nativeElement.focus();
  }

  protected onProxyFocus(event: FocusEvent, direction: 'forwards' | 'backwards'): void {
    const from = event.relatedTarget;
    const viewport = this.viewport()?.nativeElement;
    if (!(from instanceof Node && viewport?.contains(from))) focusFirst(this.sortedCandidates(direction));
  }
}
