// Drawer: a full height panel over the page, at the inline end or start, for
// a secondary task (filters, details). The twin of
// packages/react/src/components/Drawer/Drawer.tsx, on the same DOM, so the
// drawer block of Dialog.css applies as is.
//
//   <ng-container dsDrawer [(open)]="open" size="md" side="end">
//     <button dsButton dsDrawerTrigger>Filter boards</button>
//     <ng-template dsDrawerContent title="Filter boards" description="Only boards that match every filter show in the list.">
//       <div dsDrawerBody>...</div>
//       <div dsDrawerFooter><button dsButton dsDrawerClose>Discard changes</button></div>
//     </ng-template>
//   </ng-container>
//
// The DOM, as React:
//
//   <body>
//     <div data-ds="theme" data-dialog-layer ...axes>
//       <div data-ds="drawer" data-size data-side data-state data-dragging?>
//         <div data-part="backdrop">                 modal only
//         <div data-part="panel" role="dialog">
//           <div data-part="handle" aria-hidden>     the swipe to dismiss, a pointer path
//             <span data-part="handle-bar">
//           <div data-part="header">
//             <h2 data-part="title">
//             <p data-part="description">
//             <button data-ds="close-button" data-part="close">
//           <div data-part="body">                   scrolls
//           <div data-part="footer">
//
// Rendering follows the Angular Dialog (components/dialog/dialog.ts): a CDK
// ComponentPortal whose host is the themed portal wrapper, the focus trap
// by hand with InteractivityChecker, the scroll lock and the page hidden
// from assistive tech, all only while modal.
//
// Names that differ from React, by frameworks.md:
// - `onOpenChange` is the `openChange` output of `[(open)]`.
// - React lifts a DrawerTitle and a DrawerDescription out of the children
//   into the header. A template cannot be reordered, so the title and the
//   description are the `title` and `description` inputs of
//   dsDrawerContent, as the Angular Dialog's.
// - DrawerBody and DrawerFooter are `[dsDrawerBody]` and `[dsDrawerFooter]`,
//   the Dialog's body and footer under the Drawer's names.
//
// Modal (default): a backdrop, focus stays inside, the page does not
// scroll, Escape and a backdrop press close it (with dismissible false the
// panel nudges instead, interaction dialog-refuse). Non modal: no backdrop,
// no focus trap, the page keeps scrolling, a press on the page never closes
// it, an Escape in a page field belongs to that field, and on close focus
// stays where the person is working. The swipe to dismiss on the handle is
// the same math as React (helpers/drawer-swipe.ts in @the-system/motion).
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
  type Signal,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { captureFocusReturn, dialogInitialFocus, focusReturnTarget, type FocusReturn, type OverlaySize } from '@the-system/shared';
import {
  dragVelocity,
  drawerSwipeCloses,
  drawerSwipeDirection,
  drawerSwipeOffset,
  durationMs,
  readDuration,
  readEasing,
  swipeAxis,
  swipeOffset,
  swipeSign,
  type DragSample,
  type SwipeDirection,
} from '@the-system/motion';
import { consumeHostAttributes } from '../../internal/host';
import { followTriggerTitle, injectTriggerRow } from '../../internal/trigger-row';
import { injectMotion } from '../../internal/motion';
import { animationsDone, hideOthers, isInFloatingLayer, isTopModalLayer, lockScroll, popModalLayer, pushModalLayer, tabbables, wrapTab } from '../../behavior';
import { DsLayerTheme, DsThemeService, layerThemeProviders, syncDirectionality } from '../../theme';
import type { ThemeValue } from '../../theme';
import { DsCloseButton } from '../close-button/close-button';
import { DsDialogBody, DsDialogFooter } from '../dialog/dialog';
import { isInsideToaster } from '../toast/is-inside-toaster';

export type DrawerSize = Extract<OverlaySize, 'sm' | 'md' | 'lg' | 'xl'>;
export type DrawerSide = 'start' | 'end';

/** The built in words. Arabic: Gulf MSA noun forms. */
export const drawerLabels = {
  en: { close: 'Close drawer' },
  ar: { close: 'إغلاق الشريط الجانبي' },
} as const;

const isArabic = (lang: string) => lang === 'ar' || lang.startsWith('ar-');

let nextId = 0;

// ------------------------------------------------------------------ dsDrawer

/** The root: state and the variant axes. Renders no element of its own: put it on an ng-container. */
@Directive({ selector: '[dsDrawer]', exportAs: 'dsDrawer' })
export class DsDrawer {
  /** The open state. Two way: `[(open)]`. Emits false for Escape, a backdrop press, the close control and dsDrawerClose. */
  readonly open = model(false);
  /** Opens on first render when true. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** The width, from the dialog.width tokens: sm 360, md 440, lg 520, xl 640 px. Full width on phones. Default md. */
  readonly size = input<DrawerSize>('md');
  /** The edge it comes from, in reading order: end is the right in English and the left in Arabic. Default end. */
  readonly side = input<DrawerSide>('end');
  /** true: a backdrop covers the page, focus stays inside, the page does not scroll. false: the page stays usable. Default true. */
  readonly modal = input(true, { transform: booleanAttribute });
  /** false: only the drawer's own actions close it; Escape and the backdrop do nothing. Default true. */
  readonly dismissible = input(true, { transform: booleanAttribute });

  private readonly base = `ds-drawer-${++nextId}`;
  readonly panelId = `${this.base}-panel`;
  readonly titleId = `${this.base}-title`;
  readonly descriptionId = `${this.base}-description`;
  /** The trigger, where focus returns on close. */
  trigger: HTMLElement | null = null;

  constructor() {
    consumeHostAttributes(['dsDrawer', 'open', 'defaultOpen', 'size', 'side', 'modal', 'dismissible']);
    afterNextRender(() => {
      if (this.defaultOpen() && !this.open()) this.open.set(true);
    });
  }

  setOpen(open: boolean): void {
    this.open.set(open);
  }
}

function injectDrawer(name: string): DsDrawer {
  const drawer = inject(DsDrawer, { optional: true });
  if (!drawer) throw new Error(`${name} must be used inside a dsDrawer.`);
  return drawer;
}

// ------------------------------------------------------------------ trigger, close, body, footer

/**
 * Opens the drawer. Put it on a dsButton, or on a List row (`li[dsListItem]`),
 * whose title then carries the trigger (internal/trigger-row.ts). Focus
 * returns to it on close.
 */
@Directive({
  selector: '[dsDrawerTrigger]',
  host: {
    '[attr.aria-haspopup]': 'row ? null : "dialog"',
    '[attr.aria-expanded]': 'row ? null : drawer.open() ? "true" : "false"',
    '[attr.aria-controls]': '!row && drawer.open() ? drawer.panelId : null',
    '[attr.data-state]': 'row ? null : drawer.open() ? "open" : "closed"',
    '(click)': 'row || drawer.setOpen(!drawer.open())',
  },
})
export class DsDrawerTrigger {
  protected readonly drawer = injectDrawer('dsDrawerTrigger');
  protected readonly row = injectTriggerRow();

  constructor() {
    const el = consumeHostAttributes(['dsDrawerTrigger']);
    const drawer = this.drawer;
    drawer.trigger = el;
    let current: HTMLElement = el;
    inject(DestroyRef).onDestroy(() => {
      if (drawer.trigger === current) drawer.trigger = null;
    });
    const row = this.row;
    if (row) {
      row.connect(
        () => ({ id: null, haspopup: 'dialog', expanded: drawer.open(), controls: drawer.open() ? drawer.panelId : null, state: drawer.open() ? 'open' : 'closed' }),
        { click: () => drawer.setOpen(!drawer.open()) },
      );
      followTriggerTitle(row, (title) => (drawer.trigger = current = title));
    }
  }
}

/** Closes the drawer: Cancel, or Done in a details drawer. Marked data-dialog-cancel. */
@Directive({
  selector: '[dsDrawerClose]',
  host: { 'data-dialog-cancel': '', '(click)': 'drawer.setOpen(false)' },
})
export class DsDrawerClose {
  protected readonly drawer = injectDrawer('dsDrawerClose');
  constructor() {
    consumeHostAttributes(['dsDrawerClose']);
  }
}

/** The content. It scrolls inside; while it scrolls it joins the tab order. The Dialog's body. */
@Directive({ selector: '[dsDrawerBody]' })
export class DsDrawerBody extends DsDialogBody {
  constructor() {
    super();
    consumeHostAttributes(['dsDrawerBody']);
  }
}

/** The actions at the inline end. Cancel first, the primary action last. The Dialog's footer. */
@Directive({ selector: '[dsDrawerFooter]' })
export class DsDrawerFooter extends DsDialogFooter {
  constructor() {
    super();
    consumeHostAttributes(['dsDrawerFooter']);
  }
}

// ------------------------------------------------------------------ the layer

interface LayerData {
  content: DsDrawerContent;
  drawer: DsDrawer;
  theme: Signal<ThemeValue>;
}

const DRAWER_LAYER = new InjectionToken<LayerData>('DS_DRAWER_LAYER');

/** The open drawers, the top one last. */

interface Swipe {
  id: number;
  x: number;
  y: number;
  along: number;
  samples: DragSample[];
}

/** The portal: the themed wrapper (its own host), the root, the backdrop and the panel. Internal: dsDrawerContent creates it. */
@Component({
  selector: 'div[data-dialog-layer]',
  imports: [NgTemplateOutlet, DsCloseButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: layerThemeProviders(() => inject(DRAWER_LAYER).theme),
  hostDirectives: [DsLayerTheme],
  host: {
  },
  template: `
    <div data-ds="drawer" [attr.data-part]="content.rootPart() ?? null" [attr.data-size]="drawer.size()" [attr.data-side]="drawer.side()" [attr.data-state]="state()"
      [attr.data-dragging]="dragging() ? '' : null" (pointerdown)="onRootPointerDown($event)" (mousedown)="onRootMouseDown($event)">
      @if (drawer.modal()) {
        <div #backdrop data-part="backdrop" [attr.data-state]="state()" aria-hidden="true"
          (pointerdown)="pressedBackdrop = true" (click)="onBackdropClick()"></div>
      }
      <div #panel role="dialog" [id]="drawer.panelId" [attr.data-state]="state()" data-part="panel" tabindex="-1"
        [attr.aria-modal]="drawer.modal() ? 'true' : null" [attr.aria-busy]="content.ariaBusy() ? 'true' : null"
        [attr.aria-labelledby]="content.title() !== undefined ? drawer.titleId : null"
        [attr.aria-describedby]="content.description() !== undefined ? drawer.descriptionId : null">
        <div data-part="handle" aria-hidden="true" (pointerdown)="onHandleDown($event)" (pointermove)="onHandleMove($event)"
          (pointerup)="onHandleEnd($event, false)" (pointercancel)="onHandleEnd($event, true)" (lostpointercapture)="onHandleEnd($event, true)">
          <span data-part="handle-bar"></span>
        </div>
        <div data-part="header">
          @if (content.title(); as text) {
            <h2 [id]="drawer.titleId" data-part="title">{{ text }}</h2>
          }
          @if (content.description(); as text) {
            <p [id]="drawer.descriptionId" data-part="description">{{ text }}</p>
          }
          <button dsCloseButton data-part="close" [label]="closeName()" size="sm" [disabled]="!drawer.dismissible()" (click)="close()"></button>
        </div>
        <ng-container [ngTemplateOutlet]="content.template" />
      </div>
    </div>
  `,
})
export class DsDrawerLayer {
  private readonly data = inject(DRAWER_LAYER);
  protected readonly content = this.data.content;
  protected readonly drawer = this.data.drawer;
  private readonly theme = inject(DsThemeService);
  private readonly checker = inject(InteractivityChecker);
  private readonly motion = injectMotion();

  readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  readonly backdrop = viewChild<ElementRef<HTMLElement>>('backdrop');

  readonly closing = signal(false);
  readonly state = computed(() => (this.drawer.open() && !this.closing() ? 'open' : 'closed'));
  protected readonly dragging = signal(false);
  protected readonly closeName = computed(
    () => this.content.closeLabel() ?? (isArabic(this.theme.value().lang) ? drawerLabels.ar : drawerLabels.en).close,
  );
  protected pressedBackdrop = false;
  private refusal: Animation | null = null;
  private swipe: Swipe | null = null;

  constructor() {
    syncDirectionality(inject(Directionality), this.theme.value);
  }

  close(): void {
    this.drawer.setOpen(false);
  }

  isTop(): boolean {
    return isTopModalLayer(this);
  }

  push(): void {
    pushModalLayer(this);
  }

  pop(): void {
    popModalLayer(this);
  }

  /** The refused nudge (interaction dialog-refuse), as React's DialogBase. */
  refuse(): void {
    this.refusal?.cancel();
    this.refusal = null;
    const panel = this.panel().nativeElement;
    if (typeof panel.animate !== 'function' || this.motion.mode('dialog-refuse') !== 'full') return;
    const set = typeof getComputedStyle === 'function' && getComputedStyle(panel).getPropertyValue('--ds-duration-roll').trim() !== '';
    const duration = set ? readDuration(panel, 'duration.roll') : durationMs['duration.roll'];
    if (duration <= 0) return;
    const sign = this.theme.value().dir === 'rtl' ? -1 : 1;
    const at = (k: number) => ({ transform: `translateX(calc(var(--_dialog-refuse-shift) * ${sign * k}))` });
    this.refusal = panel.animate([{ transform: 'none' }, at(1), at(-0.7), at(0.35), { transform: 'none' }], {
      duration,
      easing: readEasing(panel, 'ease.out'),
      id: 'ds-motion:dialog-refuse',
    });
  }

  /** A press on the backdrop that will not close the drawer: the panel nudges, and focus stays where it was. */
  protected onRootPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.drawer.dismissible() || this.state() !== 'open') return;
    if ((event.target as Element | null)?.getAttribute?.('data-part') !== 'backdrop') return;
    event.preventDefault();
    this.refuse();
  }

  /** A touch press still sends a compatibility mousedown, whose default moves focus. */
  protected onRootMouseDown(event: MouseEvent): void {
    if (this.drawer.dismissible() || this.state() !== 'open') return;
    if ((event.target as Element | null)?.getAttribute?.('data-part') === 'backdrop') event.preventDefault();
  }

  protected onBackdropClick(): void {
    const pressed = this.pressedBackdrop;
    this.pressedBackdrop = false;
    if (pressed && this.drawer.dismissible() && this.isTop()) this.close();
  }

  /** Escape for the top drawer, and Tab while modal. Non modal: an Escape in a page field belongs to that field. */
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isTop() || this.closing()) return;
    if (isInsideToaster(event.target)) return;
    // A menu or a popover above the modal keeps its own keys (Tab loop); Escape it has taken comes prevented.
    if (isInFloatingLayer(event.target)) return;
    const modal = this.drawer.modal();
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      const inside = event.target instanceof Element && event.target.closest('[data-ds="drawer"]') !== null;
      if (!modal && !inside) return;
      event.preventDefault();
      event.stopPropagation();
      if (this.drawer.dismissible()) this.close();
      else this.refuse();
      return;
    }
    if (modal && event.key === 'Tab') {
      wrapTab(event, this.panel().nativeElement, this.checker);
      if (event.defaultPrevented) event.stopPropagation();
    }
  }

  /** Modal: focus that lands outside the top drawer comes back in. */
  onDocumentFocusin(event: FocusEvent): void {
    if (!this.drawer.modal() || !this.isTop() || this.closing()) return;
    const panel = this.panel().nativeElement;
    const target = event.target;
    if (target instanceof Node && panel.contains(target)) return;
    if (isInFloatingLayer(target)) return;
    if (isInsideToaster(target)) return;
    (tabbables(panel, this.checker)[0] ?? panel).focus();
  }

  /** The focus rule (shared dialog-focus.ts), else the first tab stop, else the panel. */
  focusInitial(): void {
    const panel = this.panel().nativeElement;
    const target = dialogInitialFocus(panel, 'neutral') ?? tabbables(panel, this.checker)[0] ?? panel;
    target.focus();
  }

  /** The elements whose exit animation the close waits for. */
  animated(): Element[] {
    return [this.panel().nativeElement, this.backdrop()?.nativeElement ?? null].filter((el): el is HTMLElement => el !== null);
  }

  // ---------------------------------------------------------------- swipe to dismiss

  private direction(): SwipeDirection {
    const t = this.theme.value();
    return drawerSwipeDirection(this.drawer.side(), t.dir === 'rtl' ? 'rtl' : 'ltr', t.platform);
  }

  private write(drawn: number): void {
    const { x, y } = swipeOffset(this.direction(), drawn);
    const panel = this.panel().nativeElement;
    panel.style.setProperty('--_dialog-drag-x', `${x}px`);
    panel.style.setProperty('--_dialog-drag-y', `${y}px`);
  }

  private reset(): void {
    const panel = this.panel().nativeElement;
    panel.style.removeProperty('--_dialog-drag-x');
    panel.style.removeProperty('--_dialog-drag-y');
  }

  protected onHandleDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.swipe = { id: event.pointerId, x: event.clientX, y: event.clientY, along: 0, samples: [{ t: event.timeStamp, y: 0 }] };
    this.dragging.set(true);
  }

  protected onHandleMove(event: PointerEvent): void {
    const g = this.swipe;
    if (!g || g.id !== event.pointerId) return;
    const direction = this.direction();
    const main = swipeAxis(direction) === 'x' ? event.clientX - g.x : event.clientY - g.y;
    g.along = main * swipeSign(direction);
    g.samples.push({ t: event.timeStamp, y: g.along });
    if (g.samples.length > 16) g.samples.shift();
    this.write(drawerSwipeOffset(g.along, this.drawer.dismissible()));
  }

  protected onHandleEnd(event: PointerEvent, cancelled: boolean): void {
    const g = this.swipe;
    if (!g || g.id !== event.pointerId) return;
    this.swipe = null;
    this.dragging.set(false);
    if (cancelled) return this.reset();
    // The release is the last sample: a pause before it leaves no speed.
    g.samples.push({ t: event.timeStamp, y: g.along });
    const panel = this.panel().nativeElement;
    const rect = panel.getBoundingClientRect();
    const size = swipeAxis(this.direction()) === 'x' ? rect.width : rect.height;
    if (this.drawer.dismissible() && drawerSwipeCloses(g.along, dragVelocity(g.samples), size)) {
      // The offset stays, so the exit plays from where the panel is; a parent that keeps it open gets it back.
      this.close();
      queueMicrotask(() => {
        if (panel.isConnected && untracked(this.drawer.open)) this.reset();
      });
      return;
    }
    this.reset();
  }
}

// ------------------------------------------------------------------ dsDrawerContent

/**
 * The drawer content: an ng-template with the body and the footer. While
 * the drawer is open it renders in a portal at the end of body, with the
 * handle and the header (title, description, close control) above it.
 */
@Directive({ selector: 'ng-template[dsDrawerContent]', exportAs: 'dsDrawerContent' })
export class DsDrawerContent {
  /** The title. It names the drawer. */
  readonly title = input<string | undefined>(undefined);
  /** One line under the title. It describes the drawer. */
  readonly description = input<string | undefined>(undefined);
  /** Accessible name of the close control. Default "Close drawer" (Arabic under lang ar). */
  readonly closeLabel = input<string | undefined>(undefined);
  /**
   * data-part on the root, for a component that owns the drawer as one of
   * its parts (order A5: the Navbar's phone list is the root with part
   * mobile). React passes it in rootProps.
   */
  readonly rootPart = input<string | undefined>(undefined);
  /** aria-busy on the panel, while its content loads. React passes it as a prop of DrawerContent. */
  readonly ariaBusy = input<boolean | undefined>(undefined, { alias: 'aria-busy' });

  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly drawer = injectDrawer('dsDrawerContent');
  private readonly theme = inject(DsThemeService);
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  private readonly doc = inject(DOCUMENT);

  private outlet: DomPortalOutlet | null = null;
  private layer: DsDrawerLayer | null = null;
  private layerHost: HTMLElement | null = null;
  private undo: (() => void)[] = [];
  private returnTo: { active: FocusReturn; trigger: FocusReturn } | null = null;
  private generation = 0;

  constructor() {
    effect(() => {
      const open = this.drawer.open();
      untracked(() => (open ? this.mount() : this.unmountAfterExit()));
    });
    inject(DestroyRef).onDestroy(() => this.dispose(false));
  }

  private mount(): void {
    this.generation += 1;
    if (this.layer) {
      this.layer.closing.set(false);
      return;
    }
    this.returnTo = {
      active: captureFocusReturn(this.doc.activeElement),
      trigger: captureFocusReturn(this.drawer.trigger),
    };
    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: DRAWER_LAYER, useValue: { content: this, drawer: this.drawer, theme: this.theme.value } satisfies LayerData }],
    });
    this.outlet = new DomPortalOutlet(this.doc.body, this.appRef, injector);
    const ref = this.outlet.attach(new ComponentPortal(DsDrawerLayer, null, injector));
    ref.changeDetectorRef.detectChanges();
    const layer = ref.instance;
    this.layer = layer;
    this.layerHost = ref.location.nativeElement as HTMLElement;
    layer.push();

    const keydown = (e: KeyboardEvent) => layer.onDocumentKeydown(e);
    const focusin = (e: FocusEvent) => layer.onDocumentFocusin(e);
    this.doc.addEventListener('keydown', keydown, true);
    this.doc.addEventListener('focusin', focusin);
    this.undo = [() => this.doc.removeEventListener('keydown', keydown, true), () => this.doc.removeEventListener('focusin', focusin)];
    // Modal only: the page does not scroll and is hidden from assistive tech.
    if (this.drawer.modal()) this.undo.push(lockScroll(this.doc), hideOthers(this.layerHost));
    afterNextRender(() => layer.focusInitial(), { injector });
  }

  private unmountAfterExit(): void {
    const layer = this.layer;
    if (!layer) return;
    const generation = this.generation;
    layer.closing.set(true);
    afterNextRender(
      () => {
        void animationsDone(layer.animated()).then(() => {
          if (generation === this.generation && this.layer === layer) this.dispose(true);
        });
      },
      { injector: this.injector },
    );
  }

  private dispose(returnFocus: boolean): void {
    const layer = this.layer;
    if (!layer) return;
    // Non modal: when the person is working on the page, focus stays where it is.
    const active = this.doc.activeElement;
    const onPage = active !== null && active !== this.doc.body && active.isConnected && !this.layerHost?.contains(active);
    const keep = !this.drawer.modal() && onPage;
    layer.pop();
    for (const fn of this.undo.reverse()) fn();
    this.undo = [];
    this.outlet?.detach();
    this.outlet = null;
    this.layer = null;
    this.layerHost = null;
    if (!returnFocus || keep) {
      this.returnTo = null;
      return;
    }
    const trigger = this.drawer.trigger;
    const memo = this.returnTo;
    this.returnTo = null;
    const target = trigger?.isConnected
      ? trigger
      : memo
        ? focusReturnTarget(memo.active.target ? memo.active : memo.trigger, this.doc)
        : null;
    if (target?.isConnected) target.focus();
  }
}

/** Everything a template needs for a drawer. */
export const DS_DRAWER = [DsDrawer, DsDrawerTrigger, DsDrawerClose, DsDrawerContent, DsDrawerBody, DsDrawerFooter] as const;
