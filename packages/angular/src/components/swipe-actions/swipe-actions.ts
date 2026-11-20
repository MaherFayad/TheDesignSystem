// SwipeActions (order M9.7): actions hidden at either side of one row,
// revealed by a horizontal swipe, with a menu of the same actions as the path
// that needs no drag (WCAG 2.2 2.5.7). The twin of
// packages/react/src/components/SwipeActions/SwipeActions.tsx: the same DOM,
// the same gesture math (swipe.ts in @the-system/shared), so
// SwipeActions.css draws it.
//
// Two forms, one behavior:
// - In a List, pass the options to the row: `<li dsListItem [swipe]="{ end,
//   menuLabel }">`. React passes a SwipeActions element with no children;
//   an Angular input takes the options object. The row's own parts stay
//   direct children of the row and move by --_list-shift; the row draws the
//   swipe root as its last child, part swipe (DsSwipeActionsPart).
// - Anywhere else, `<div dsSwipeActions [end]="..." menuLabel="...">`
//   wraps the content in a `content` part.
//
//   <li data-part="item">  ...row parts, moved by --_list-shift...
//     <div data-ds="swipe-actions" data-part="swipe" data-state data-dragging? data-armed? data-settling?>
//       <div data-part="actions" data-side="start" data-tone role="group" aria-label inert?>  Buttons, part action
//       <div data-part="actions" data-side="end" ...>                    drawn in reverse: the first at the edge
//       <span><button data-ds="icon-button" data-part="menu">            opens a DropdownMenu of every action
//
// The gesture, as React: a touch or pen press that moves more across than
// down becomes a swipe and takes pointer capture; a steeper move is left to
// the page scroll. A mouse drags only with `pointer`. The move is written as
// an inline property on each move, with no change detection; on release the
// row springs open, closed, or past the full swipe threshold runs the first
// action of that side. One row is open at a time; a press outside, a tap on
// the open content, Escape or an action closes it. The click that ends a
// swipe is swallowed. Shift+F10 or the context menu key opens the menu.
// Action groups are inert while closed. Settling waits on the Web Animations
// API `finished` promise of the transform transitions, never transitionend.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import type { IconName } from '@the-system/icons';
import {
  SWIPE_MAX_ACTIONS,
  SWIPE_SWALLOW_CLICK_MS,
  defaultSwipeFull,
  isSwipeMenuKey,
  swipeArmed,
  swipeAxis,
  swipeDrawnOffset,
  swipeRelease,
  swipeRestOffset,
  swipeVelocity,
  toInline,
  toPhysical,
  type SwipeFull,
  type SwipeSample,
  type SwipeSizes,
  type SwipeState,
  type Tone,
} from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import { DsDropdownMenu, DsDropdownMenuContent, DsDropdownMenuItem, DsDropdownMenuSeparator, DsDropdownMenuTrigger } from '../dropdown-menu/dropdown-menu';

export type SwipeActionTone = Extract<Tone, 'neutral' | 'accent' | 'warning' | 'danger'>;
export type SwipeActionsFull = SwipeFull;
export type SwipeActionsState = SwipeState;

export interface SwipeAction {
  /** Visible text under the icon and the name in the menu. English: a verb. Arabic: a noun form. */
  label: string;
  /** A system icon name, drawn above the label. */
  icon?: IconName;
  /** neutral, accent, warning or danger. Default neutral. */
  tone?: SwipeActionTone;
  /** Runs on a press of the action, its menu item, or a full swipe when it is first on its side. */
  onSelect: () => void;
  /** The app can undo this action. A first end action that is danger runs by a full swipe only when this is true. */
  undoable?: boolean;
}

/** The options of a swipe: what React's SwipeActions takes besides its children. */
export interface SwipeActionsOptions {
  /** Actions at the inline start, revealed by a swipe toward the inline end. At most three; the first sits at the edge. */
  start?: SwipeAction[];
  /** Actions at the inline end, revealed by a swipe toward the inline start. At most three; the first sits at the edge. */
  end?: SwipeAction[];
  /** The side whose first action a long swipe runs, or none. Default: end when the first end action is not danger or is undoable. */
  fullSwipe?: SwipeActionsFull;
  /** The name of the menu button and of each action group: Actions for Sara Alqahtani. Required. */
  menuLabel: string;
  /** Lets a mouse drag the row too. Touch and pen always can. Default false. */
  pointer?: boolean;
}

interface Run {
  id: number;
  x0: number;
  y0: number;
  from: number;
  fromState: SwipeState;
  offset: number;
  moved: boolean;
  dir: 'ltr' | 'rtl';
  sizes: SwipeSizes;
  samples: SwipeSample[];
}

/** The private property SwipeActions.css reads for the move, in screen px. */
const SHIFT = '--_swipe-actions-x';

/** The one row that is open on the page. Opening another closes it. */
let openRow: { close: () => void } | null = null;

/** The width the buttons of an action group take on screen. */
function groupWidth(panel: HTMLElement | null | undefined): number {
  if (!panel) return 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const child of Array.from(panel.children)) {
    const r = child.getBoundingClientRect();
    min = Math.min(min, r.left);
    max = Math.max(max, r.right);
  }
  return max > min ? max - min : 0;
}

/** The elements a controller reads, from the component that draws the parts. */
export interface SwipeElements {
  root: HTMLElement | null;
  start: HTMLElement | null;
  end: HTMLElement | null;
  menu: HTMLElement | null;
}

/**
 * The swipe behavior, the twin of React's useSwipeController. Create it in
 * an injection context. `hostVar` is a second inline property the move is
 * written into on the host (the List row's own, for its parts). Internal to
 * the package: ListItem and SwipeActions use it.
 */
export class SwipeController {
  readonly state = signal<SwipeState>('closed');
  readonly dragging = signal(false);
  readonly armed = signal(false);
  readonly settling = signal(0);
  readonly menuOpen: WritableSignal<boolean | undefined> = signal(false);

  readonly start: Signal<SwipeAction[]> = computed(() => (this.opts()?.start ?? []).slice(0, SWIPE_MAX_ACTIONS));
  readonly end: Signal<SwipeAction[]> = computed(() => (this.opts()?.end ?? []).slice(0, SWIPE_MAX_ACTIONS));
  /** The end group as drawn: the first action at the outer edge, so in reverse. */
  readonly endDrawn: Signal<SwipeAction[]> = computed(() => [...this.end()].reverse());
  readonly label: Signal<string> = computed(() => this.opts()?.menuLabel ?? '');
  readonly off: Signal<boolean> = computed(() => this.opts() === null);

  private host: HTMLElement | null = null;
  private elements: () => SwipeElements = () => ({ root: null, start: null, end: null, menu: null });
  private run: Run | null = null;
  private swallowUntil = 0;
  private readonly self = { close: () => this.close() };
  private readonly injector = inject(Injector);

  constructor(
    private readonly opts: () => SwipeActionsOptions | null,
    private readonly hostVar?: string,
  ) {
    // One row open at a time.
    effect(() => {
      const state = this.state();
      untracked(() => {
        if (state === 'closed') {
          if (openRow === this.self) openRow = null;
          return;
        }
        if (openRow && openRow !== this.self) openRow.close();
        openRow = this.self;
      });
    });
    // A press outside the open row closes it.
    effect((onCleanup) => {
      if (this.state() === 'closed') return;
      const doc = untracked(() => this.host?.ownerDocument);
      if (!doc) return;
      const onDown = (event: Event) => {
        const target = event.target as Node | null;
        if (target && this.host?.contains(target)) return;
        this.close();
      };
      doc.addEventListener('pointerdown', onDown, true);
      onCleanup(() => doc.removeEventListener('pointerdown', onDown, true));
    });
    // Settling: keep the attribute until the transform transitions end (WAAPI finished), or at once when none run.
    effect((onCleanup) => {
      if (this.settling() === 0) return;
      let live = true;
      onCleanup(() => {
        live = false;
      });
      afterNextRender(
        () => {
          if (!live) return;
          const el = this.host;
          const done = () => this.settling.set(0);
          if (!el || typeof el.getAnimations !== 'function') return done();
          const moving = el
            .getAnimations({ subtree: true })
            .filter((a) => (a as Animation & { transitionProperty?: string }).transitionProperty === 'transform');
          if (moving.length === 0) return done();
          void Promise.allSettled(moving.map((a) => a.finished)).then(() => {
            if (live && !this.run) done();
          });
        },
        { injector: this.injector },
      );
    });
    inject(DestroyRef).onDestroy(() => {
      if (openRow === this.self) openRow = null;
    });
  }

  /** The root's state attributes, for host or element bindings. */
  readonly attrs = computed(() => ({
    state: this.state(),
    dragging: this.dragging() ? '' : null,
    armed: this.armed() ? '' : null,
    settling: this.settling() > 0 && !this.dragging() ? '' : null,
  }));

  /** Where the parts are drawn. */
  useElements(read: () => SwipeElements): void {
    this.elements = read;
  }

  /** Listens on the host, the element whose content moves. Returns the remover. */
  attach(host: HTMLElement): () => void {
    this.host = host;
    const on: Array<[string, EventListener, boolean]> = [
      ['pointerdown', (e) => this.onPointerDown(e as PointerEvent), false],
      ['pointermove', (e) => this.onPointerMove(e as PointerEvent), false],
      ['pointerup', (e) => this.onPointerUp(e as PointerEvent), false],
      ['pointercancel', (e) => this.onPointerCancel(e as PointerEvent), false],
      ['lostpointercapture', (e) => this.onLostCapture(e as PointerEvent), false],
      ['click', (e) => this.onClickCapture(e as MouseEvent), true],
      ['keydown', (e) => this.onKeyDown(e as KeyboardEvent), false],
    ];
    for (const [type, fn, capture] of on) host.addEventListener(type, fn, capture);
    return () => {
      for (const [type, fn, capture] of on) host.removeEventListener(type, fn, capture);
      if (this.host === host) this.host = null;
    };
  }

  /** Springs back to closed. Focus inside an action group moves to the menu button first, as the group turns inert. */
  close(): void {
    const { root, menu } = this.elements();
    const active = root?.ownerDocument.activeElement;
    if (root && active && root.contains(active) && !menu?.contains(active)) menu?.focus();
    this.run = null;
    this.dragging.set(false);
    this.armed.set(false);
    const shifted = Number.parseFloat(root?.style.getPropertyValue(SHIFT) || '0') !== 0;
    if (this.state() !== 'closed' || shifted) this.settling.update((n) => n + 1);
    this.state.set('closed');
    this.write(0, 'ltr');
  }

  /** Runs an action from a group or the menu: the row closes first. */
  choose(action: SwipeAction): void {
    this.close();
    action.onSelect();
  }

  private full(): SwipeFull {
    return this.opts()?.fullSwipe ?? defaultSwipeFull(this.end());
  }

  private write(offset: number, dir: 'ltr' | 'rtl'): void {
    const x = `${toPhysical(offset, dir)}px`;
    const root = this.elements().root;
    root?.style.setProperty(SHIFT, x);
    if (this.hostVar && this.host && this.host !== root) this.host.style.setProperty(this.hostVar, x);
  }

  private measure(): SwipeSizes {
    const { start, end } = this.elements();
    return {
      start: this.start().length > 0 ? groupWidth(start) : 0,
      end: this.end().length > 0 ? groupWidth(end) : 0,
      row: this.host?.getBoundingClientRect().width ?? 0,
    };
  }

  private directionOf(): 'ltr' | 'rtl' {
    return this.host && getComputedStyle(this.host).direction === 'rtl' ? 'rtl' : 'ltr';
  }

  private inGroupOrMenu(target: EventTarget | null): boolean {
    const el = target instanceof Element ? target : null;
    const part = el?.closest("[data-part='actions'], [data-part='menu']");
    return Boolean(part && this.elements().root?.contains(part));
  }

  private finish(r: Run, timeStamp: number): void {
    r.samples.push({ t: timeStamp, offset: r.offset });
    const result = swipeRelease(r.offset, swipeVelocity(r.samples), r.sizes, this.full());
    this.run = null;
    this.swallowUntil = performance.now() + SWIPE_SWALLOW_CLICK_MS;
    this.dragging.set(false);
    this.armed.set(false);
    if (result.run) {
      const action = (result.run === 'start' ? this.start() : this.end())[0];
      this.close();
      action?.onSelect();
      return;
    }
    if (result.state === 'closed') {
      this.close();
      return;
    }
    this.state.set(result.state);
    this.write(swipeRestOffset(result.state, r.sizes), r.dir);
  }

  private cancel(r: Run): void {
    this.run = null;
    this.dragging.set(false);
    this.armed.set(false);
    if (r.fromState === 'closed') this.close();
    else this.write(r.from, r.dir);
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.off() || e.defaultPrevented || e.button !== 0 || !e.isPrimary) return;
    const host = this.host;
    if (!host || !(e.target instanceof Node) || !host.contains(e.target)) return;
    if (this.inGroupOrMenu(e.target)) return;
    const draggable = e.pointerType !== 'mouse' || (this.opts()?.pointer ?? false);
    if (!draggable && this.state() === 'closed') return;
    const sizes = this.measure();
    const from = swipeRestOffset(this.state(), sizes);
    this.run = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      from,
      fromState: this.state(),
      offset: from,
      moved: false,
      dir: this.directionOf(),
      sizes,
      samples: [{ t: e.timeStamp, offset: from }],
    };
  }

  private onPointerMove(e: PointerEvent): void {
    const r = this.run;
    if (!r || e.pointerId !== r.id) return;
    if (e.pointerType === 'mouse' && !(this.opts()?.pointer ?? false)) return;
    const dx = e.clientX - r.x0;
    if (!r.moved) {
      const axis = swipeAxis(dx, e.clientY - r.y0);
      if (axis === 'pending') return;
      if (axis === 'vertical') {
        this.run = null;
        return;
      }
      r.moved = true;
      this.host?.setPointerCapture?.(e.pointerId);
      if (openRow && openRow !== this.self) openRow.close();
      this.settling.set(0);
      this.dragging.set(true);
    }
    const full = this.full();
    const drawn = swipeDrawnOffset(r.from + toInline(dx, r.dir), r.sizes, full);
    r.offset = drawn;
    r.samples.push({ t: e.timeStamp, offset: drawn });
    if (r.samples.length > 24) r.samples.splice(0, r.samples.length - 24);
    this.write(drawn, r.dir);
    this.armed.set(swipeArmed(drawn, r.sizes, full));
  }

  private onPointerUp(e: PointerEvent): void {
    const r = this.run;
    if (!r || e.pointerId !== r.id) return;
    if (r.moved) {
      this.finish(r, e.timeStamp);
      return;
    }
    this.run = null;
    // A tap on the content of an open row closes it, and its click does nothing else.
    if (r.fromState !== 'closed') {
      this.swallowUntil = performance.now() + SWIPE_SWALLOW_CLICK_MS;
      this.close();
    }
  }

  private onPointerCancel(e: PointerEvent): void {
    const r = this.run;
    if (!r || e.pointerId !== r.id) return;
    if (r.moved) this.cancel(r);
    else this.run = null;
  }

  private onLostCapture(e: PointerEvent): void {
    const r = this.run;
    // Only the host's own loss ends the swipe; a child that loses capture to the host does not.
    if (r && e.pointerId === r.id && r.moved && e.target === this.host) this.cancel(r);
  }

  private onClickCapture(e: MouseEvent): void {
    if (this.off() || this.inGroupOrMenu(e.target)) return;
    if (this.swallowUntil > performance.now()) {
      this.swallowUntil = 0;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.swallowUntil = 0;
    // A pointer click on the content of an open row closes it (a key press on a link still follows it).
    if (this.state() !== 'closed' && e.detail > 0) {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.off() || e.defaultPrevented) return;
    if (isSwipeMenuKey(e.key, e.shiftKey)) {
      e.preventDefault();
      this.menuOpen.set(true);
      return;
    }
    if (e.key === 'Escape' && this.state() !== 'closed') {
      e.preventDefault();
      this.close();
    }
  }
}

/** The action groups and the menu, the children of the swipe root after the content. */
const PARTS = `
  @if (c.start().length > 0) {
    <div
      #startPanel
      data-part="actions"
      data-side="start"
      [attr.data-tone]="c.start()[0]!.tone ?? 'neutral'"
      role="group"
      [attr.aria-label]="c.label()"
      [attr.inert]="c.state() === 'open-start' ? null : ''"
    >
      @for (a of c.start(); track a.label) {
        <button dsButton data-part="action" [tone]="a.tone ?? 'neutral'" emphasis="solid" [start]="a.icon" (click)="c.choose(a)">{{ a.label }}</button>
      }
    </div>
  }
  @if (c.end().length > 0) {
    <div
      #endPanel
      data-part="actions"
      data-side="end"
      [attr.data-tone]="c.end()[0]!.tone ?? 'neutral'"
      role="group"
      [attr.aria-label]="c.label()"
      [attr.inert]="c.state() === 'open-end' ? null : ''"
    >
      @for (a of c.endDrawn(); track a.label) {
        <button dsButton data-part="action" [tone]="a.tone ?? 'neutral'" emphasis="solid" [start]="a.icon" (click)="c.choose(a)">{{ a.label }}</button>
      }
    </div>
  }
  <ng-container dsDropdownMenu [(open)]="menuOpen">
    <span><button #menuButton dsIconButton dsDropdownMenuTrigger data-part="menu" icon="more" [label]="c.label()"></button></span>
    <ng-template dsDropdownMenuContent align="end">
      @for (a of c.start(); track a.label) {
        <div dsDropdownMenuItem [start]="a.icon" [tone]="a.tone === 'danger' ? 'danger' : 'neutral'" (select)="c.choose(a)">{{ a.label }}</div>
      }
      @if (c.start().length > 0 && c.end().length > 0) {
        <div dsDropdownMenuSeparator></div>
      }
      @for (a of c.end(); track a.label) {
        <div dsDropdownMenuItem [start]="a.icon" [tone]="a.tone === 'danger' ? 'danger' : 'neutral'" (select)="c.choose(a)">{{ a.label }}</div>
      }
    </ng-template>
  </ng-container>
`;

const PARTS_IMPORTS = [DsButton, DsIconButton, DsDropdownMenu, DsDropdownMenuTrigger, DsDropdownMenuContent, DsDropdownMenuItem, DsDropdownMenuSeparator];

/** The part elements of a component that draws PARTS, from its view queries. */
function readParts(
  root: HTMLElement,
  start: Signal<ElementRef<HTMLElement> | undefined>,
  end: Signal<ElementRef<HTMLElement> | undefined>,
  menu: Signal<ElementRef<HTMLElement> | undefined>,
): () => SwipeElements {
  return () => ({ root, start: start()?.nativeElement ?? null, end: end()?.nativeElement ?? null, menu: menu()?.nativeElement ?? null });
}

/**
 * The swipe root inside a List row, part swipe: drawn by ListItem as its
 * last child. Takes the row's controller. Internal to the package.
 */
@Component({
  selector: 'div[dsSwipeActionsPart]',
  imports: PARTS_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'swipe-actions',
    'data-part': 'swipe',
    '[attr.data-state]': 'c.attrs().state',
    '[attr.data-dragging]': 'c.attrs().dragging',
    '[attr.data-armed]': 'c.attrs().armed',
    '[attr.data-settling]': 'c.attrs().settling',
  },
  template: PARTS,
})
export class DsSwipeActionsPart {
  /** The row's controller. */
  readonly controller = input.required<SwipeController>({ alias: 'dsSwipeActionsPart' });
  private readonly host = consumeHostAttributes(['dsSwipeActionsPart']);
  private readonly startPanel = viewChild<ElementRef<HTMLElement>>('startPanel');
  private readonly endPanel = viewChild<ElementRef<HTMLElement>>('endPanel');
  private readonly menuButton = viewChild<ElementRef<HTMLElement>>('menuButton');
  protected get c(): SwipeController {
    return this.controller();
  }
  protected get menuOpen(): WritableSignal<boolean | undefined> {
    return this.controller().menuOpen;
  }

  constructor() {
    effect(() => {
      const c = this.controller();
      untracked(() => c.useElements(readParts(this.host, this.startPanel, this.endPanel, this.menuButton)));
    });
  }
}

/**
 * Actions at either side of one piece of content, revealed by a horizontal
 * swipe, and a menu of the same actions. In a List pass the options to
 * ListItem as `swipe` instead.
 */
@Component({
  selector: 'div[dsSwipeActions]',
  exportAs: 'dsSwipeActions',
  imports: PARTS_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'swipe-actions',
    '[attr.data-state]': 'c.attrs().state',
    '[attr.data-dragging]': 'c.attrs().dragging',
    '[attr.data-armed]': 'c.attrs().armed',
    '[attr.data-settling]': 'c.attrs().settling',
  },
  template: `<div data-part="content"><ng-content /></div>` + PARTS,
})
export class DsSwipeActions {
  /** Actions at the inline start. At most three; the first sits at the edge. */
  readonly start = input<SwipeAction[] | undefined>(undefined);
  /** Actions at the inline end. At most three; the first sits at the edge. */
  readonly end = input<SwipeAction[] | undefined>(undefined);
  /** The side whose first action a long swipe runs, or none. */
  readonly fullSwipe = input<SwipeActionsFull | undefined>(undefined);
  /** The name of the menu button and of each action group. Required. */
  readonly menuLabel = input.required<string>();
  /** Lets a mouse drag the content too. Default false. */
  readonly pointer = input(false, { transform: booleanAttribute });

  private readonly host = consumeHostAttributes(['dsSwipeActions', 'start', 'end', 'fullSwipe', 'menuLabel', 'pointer']);
  protected readonly c = new SwipeController(() => ({
    start: this.start(),
    end: this.end(),
    fullSwipe: this.fullSwipe(),
    menuLabel: this.menuLabel(),
    pointer: this.pointer(),
  }));
  protected readonly menuOpen = this.c.menuOpen;
  private readonly startPanel = viewChild<ElementRef<HTMLElement>>('startPanel');
  private readonly endPanel = viewChild<ElementRef<HTMLElement>>('endPanel');
  private readonly menuButton = viewChild<ElementRef<HTMLElement>>('menuButton');

  constructor() {
    this.c.useElements(readParts(this.host, this.startPanel, this.endPanel, this.menuButton));
    inject(DestroyRef).onDestroy(this.c.attach(this.host));
  }
}
