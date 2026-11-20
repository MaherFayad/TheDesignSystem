// Sheet: a panel that rises from the block end (the bottom), for phone
// layouts and quick tasks. The twin of
// packages/react/src/components/Sheet/Sheet.tsx, on the same DOM, so the
// sheet block of Dialog.css and the platform files apply as they are.
//
//   <ng-container dsSheet [(open)]="open" size="md" [detents]="[0.5, 1]" [(detent)]="detent">
//     <button dsButton dsSheetTrigger>Share board</button>
//     <ng-template dsSheetContent title="Share Spring launch" description="People with the link can view the board.">
//       <ng-template dsSheetHeaderAction><button dsIconButton icon="share" label="Share pass"></button></ng-template>
//       <ng-container dsSheetConfirm label="Save list" (click)="save($event)" />
//       <div dsSheetBody>...</div>
//       <div dsSheetFooter><button dsButton dsSheetClose>Discard invite</button></div>
//     </ng-template>
//   </ng-container>
//
// The DOM, as React:
//
//   <body>
//     <div data-ds="theme" data-dialog-layer ...axes>
//       <div data-ds="sheet" data-size data-state data-dragging? data-detent? data-segment?>
//         <div data-part="backdrop">
//         <div data-part="panel" role="dialog">
//           <div data-part="handle" aria-hidden>              no detents: a pointer path only
//           <button data-ds="button" data-part="handle">       with detents: the button path
//             <span data-part="handle-bar">
//           <div data-part="titlebar" data-ds="title-bar">    optional part, replaces the header
//           <div data-part="header">
//             <h2 data-part="title">  <p data-part="description">
//             <button data-ds="close-button" data-part="close">
//             <div data-part="header-action">                  order C5, dsSheetHeaderAction
//             <button data-ds="button" data-part="confirm">    order M9.6, dsSheetConfirm
//           <div data-part="body">  <div data-part="footer">  from the content template
//
// Rendering and the modal rules are the Dialog's (internal/modal-portal.ts,
// behavior/dialog-behavior.ts): a CDK ComponentPortal whose host is the
// themed portal wrapper, one modal stack, Tab wrapped by hand with the CDK
// InteractivityChecker, the scroll lock and the page hidden while open.
//
// Names that differ from React, by frameworks.md:
// - `onOpenChange` and `onDetentChange` are the outputs of `[(open)]` and
//   `[(detent)]`.
// - A template cannot be reordered, so the title and the description are
//   inputs of dsSheetContent. SheetHeaderAction is an
//   `ng-template[dsSheetHeaderAction]` and SheetConfirm an
//   `ng-container[dsSheetConfirm]` inside the content template: the layer
//   draws them in the header, in React's order.
// - SheetConfirm's onClick is the `click` output; call
//   `event.preventDefault()` in it to keep the sheet open.
// - The Tooltip React shows on the ios confirm has no Angular form yet.
//
// Detents, the drag, the rubber band and the toast clearance follow React
// line for line, on the shared math in @the-system/motion
// (helpers/sheet-detents.ts). The fold (order DU5): data-segment on the
// root, from overlaySegment, while open.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
  untracked,
  viewChild,
  type Signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { dialogInitialFocus, overlaySegment, type OverlaySize } from '@the-system/shared';
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
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { injectFold } from '../../internal/fold';
import { connectModalPortal, playRefusal } from '../../internal/modal-portal';
import { followTriggerTitle, injectTriggerRow } from '../../internal/trigger-row';
import { isTopModalLayer, tabbables, wrapTab } from '../../behavior';
import { DsLayerTheme, DsThemeService, layerThemeProviders, syncDirectionality } from '../../theme';
import type { ThemeValue } from '../../theme';
import { DsButton } from '../button/button';
import { DsButtonBase, type ButtonEmphasis, type ButtonSlotContent } from '../button/button-base';
import { DsCloseButton } from '../close-button/close-button';
import { DsDialogBody, DsDialogFooter } from '../dialog/dialog';
import { DsTitleBar } from '../title-bar/title-bar';
import { DsWindowControls } from '../window-controls/window-controls';
import { isInsideToaster } from '../toast/is-inside-toaster';

export type SheetSize = Extract<OverlaySize, 'sm' | 'md' | 'lg'>;
export type { Detent as SheetDetent };

/** The built in words, the same strings as React. Arabic: Gulf MSA noun forms. */
export const sheetLabels = {
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

const isArabic = (lang: string) => lang === 'ar' || lang.startsWith('ar-');

/** The share of the pointer travel the panel follows past where it may go (no detents). */
export const RUBBER_SHARE = 1 / 3;

/** Movement before a press on the detent handle counts as a drag, not a click, in px. */
const CLICK_SLOP = 4;

let nextId = 0;

// ------------------------------------------------------------------ dsSheet

/** The root: state, the size and the detents. Renders no element of its own: put it on an ng-container. */
@Directive({ selector: '[dsSheet]', exportAs: 'dsSheet' })
export class DsSheet {
  /** The open state. Two way: `[(open)]`. Emits false for Escape, a backdrop press, the close control, dsSheetClose and a drag down. */
  readonly open = model(false);
  /** Opens on first render when true. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** The most of the screen's height it takes: sm half, md three quarters, lg all of it under a gap. Default md. */
  readonly size = input<SheetSize>('md');
  /** false: only the sheet's own actions close it; Escape, the backdrop and a drag do nothing. Default true. */
  readonly dismissible = input(true, { transform: booleanAttribute });
  /** The heights the sheet rests at, smallest first: a fraction of the viewport height (0.5 is half) or px (320). Default none. */
  readonly detents = input<readonly Detent[] | undefined>(undefined);
  /** The detent, an index into detents. Two way: `[(detent)]`, the twin of onDetentChange. */
  readonly detent = model<number | undefined>(undefined);
  /** The detent it opens at. Default 0, the smallest. */
  readonly defaultDetent = input(0);

  private readonly base = `ds-sheet-${++nextId}`;
  readonly panelId = `${this.base}-panel`;
  readonly titleId = `${this.base}-title`;
  readonly descriptionId = `${this.base}-description`;
  /** The trigger, where focus returns on close. */
  trigger: HTMLElement | null = null;
  /** The detent in use: the bound one, else the default. */
  readonly currentDetent = computed(() => this.detent() ?? this.defaultDetent());
  /** dsSheetHeaderAction and dsSheetConfirm parts of the open content, in template order. */
  readonly headerActions = signal<readonly DsSheetHeaderAction[]>([]);
  readonly confirms = signal<readonly DsSheetConfirm[]>([]);

  constructor() {
    consumeHostAttributes(['dsSheet', 'open', 'defaultOpen', 'size', 'dismissible', 'detents', 'detent', 'defaultDetent']);
    afterNextRender(() => {
      if (this.defaultOpen() && !this.open()) this.open.set(true);
    });
  }

  setOpen(open: boolean): void {
    this.open.set(open);
  }

  setDetent(index: number): void {
    this.detent.set(index);
  }
}

function injectSheet(name: string): DsSheet {
  const sheet = inject(DsSheet, { optional: true });
  if (!sheet) throw new Error(`${name} must be used inside a dsSheet.`);
  return sheet;
}

// ------------------------------------------------------------------ trigger, close, body, footer

/**
 * Opens the sheet. Put it on a dsButton, or on a List row (`li[dsListItem]`),
 * whose title then carries the trigger (internal/trigger-row.ts). Focus
 * returns to it on close.
 */
@Directive({
  selector: '[dsSheetTrigger]',
  host: {
    '[attr.aria-haspopup]': 'row ? null : "dialog"',
    '[attr.aria-expanded]': 'row ? null : sheet.open() ? "true" : "false"',
    '[attr.aria-controls]': '!row && sheet.open() ? sheet.panelId : null',
    '[attr.data-state]': 'row ? null : sheet.open() ? "open" : "closed"',
    '(click)': 'row || sheet.setOpen(true)',
  },
})
export class DsSheetTrigger {
  protected readonly sheet = injectSheet('dsSheetTrigger');
  protected readonly row = injectTriggerRow();

  constructor() {
    const el = consumeHostAttributes(['dsSheetTrigger']);
    const sheet = this.sheet;
    sheet.trigger = el;
    let current: HTMLElement = el;
    inject(DestroyRef).onDestroy(() => {
      if (sheet.trigger === current) sheet.trigger = null;
    });
    const row = this.row;
    if (row) {
      row.connect(
        () => ({ id: null, haspopup: 'dialog', expanded: sheet.open(), controls: sheet.open() ? sheet.panelId : null, state: sheet.open() ? 'open' : 'closed' }),
        { click: () => sheet.setOpen(true) },
      );
      followTriggerTitle(row, (title) => (sheet.trigger = current = title));
    }
  }
}

/** Closes the sheet: Cancel, or Done. Marked data-dialog-cancel. */
@Directive({
  selector: '[dsSheetClose]',
  host: { 'data-dialog-cancel': '', '(click)': 'sheet.setOpen(false)' },
})
export class DsSheetClose {
  protected readonly sheet = injectSheet('dsSheetClose');
  constructor() {
    consumeHostAttributes(['dsSheetClose']);
  }
}

/** The content. It scrolls inside; while it scrolls it joins the tab order. The Dialog's body. */
@Directive({ selector: '[dsSheetBody]' })
export class DsSheetBody extends DsDialogBody {
  constructor() {
    super();
    consumeHostAttributes(['dsSheetBody']);
  }
}

/** The actions at the inline end. Cancel first, the primary action last. The Dialog's footer. */
@Directive({ selector: '[dsSheetFooter]' })
export class DsSheetFooter extends DsDialogFooter {
  constructor() {
    super();
    consumeHostAttributes(['dsSheetFooter']);
  }
}

/**
 * One more action in the header, between the close control and the confirm
 * (order C5). An ng-template inside dsSheetContent holding one element: an
 * IconButton with its label, or a component that renders one as its
 * trigger. The layer draws it in `div[data-part="header-action"]`. One per
 * sheet: a second is left out with a warning in development.
 */
@Directive({ selector: 'ng-template[dsSheetHeaderAction]' })
export class DsSheetHeaderAction {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    const sheet = injectSheet('dsSheetHeaderAction');
    sheet.headerActions.update((list) => [...list, this]);
    if (isDevMode() && untracked(sheet.headerActions).length > 1) {
      console.warn('Sheet: a sheet takes one SheetHeaderAction. Put other actions in the body or in a menu.');
    }
    inject(DestroyRef).onDestroy(() => sheet.headerActions.update((list) => list.filter((a) => a !== this)));
  }
}

/**
 * The confirm button in the header, at the inline end (order M9.6). An
 * ng-container inside dsSheetContent; the layer draws the Button. A press
 * emits `click`, then closes the sheet unless the handler calls
 * event.preventDefault(). While disabled it is aria-disabled and stays in
 * the tab order.
 */
@Directive({ selector: 'ng-container[dsSheetConfirm]' })
export class DsSheetConfirm {
  /** What the confirm does, a verb plus a noun (Save list). The visible label, and its name where only the icon shows. */
  readonly label = input.required<string>();
  /** The icon: a system icon name or a template, hidden from assistive tech. Default check. */
  readonly icon = input<ButtonSlotContent>('check');
  /** aria-disabled: it stays in the tab order and a press does nothing. Default false. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows the loading look and keeps the sheet open while the work runs. Default false. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** React's onClick. Call event.preventDefault() to keep the sheet open. */
  readonly click = output<MouseEvent>();

  constructor() {
    const sheet = injectSheet('dsSheetConfirm');
    sheet.confirms.update((list) => [...list, this]);
    inject(DestroyRef).onDestroy(() => sheet.confirms.update((list) => list.filter((c) => c !== this)));
  }
}

// ------------------------------------------------------------------ the handle with detents

/**
 * The detent handle: the system button base, ghost, the bar its only
 * content, as React's ButtonRoot with ds button. Internal: the layer draws it.
 */
@Component({
  selector: 'button[dsSheetHandle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-ds': 'button', 'data-part': 'handle', '[attr.aria-label]': 'label()' },
  template: `<span data-part="handle-bar"></span><span data-part="hit" aria-hidden="true"></span>`,
})
export class DsSheetHandle extends DsButtonBase {
  readonly label = input.required<string>();
  readonly emphasis = input<ButtonEmphasis | undefined>(undefined);
  protected readonly defaultEmphasis: ButtonEmphasis = 'ghost';

  constructor() {
    super();
    consumeHostAttributes(['dsSheetHandle', 'label']);
  }
}

// ------------------------------------------------------------------ toast clearance

/**
 * Where the toasts of a toaster on the top edge end, in px from the top of
 * the viewport, or 0 when none show, as useTopToastEnd in React: while a
 * Sheet is open a bottom toaster moves to the top edge (Dialog.css), and the
 * root's top padding keeps the panel below the toasts (WCAG 2.4.11). Only
 * the toaster's public data-ds is read. Returns the stop.
 */
function watchTopToastEnd(doc: Document, set: (end: number) => void): () => void {
  const view = doc.defaultView;
  if (!view || typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') return () => undefined;
  let frame = 0;
  const measure = () => {
    frame = 0;
    let bottom = 0;
    for (const toaster of Array.from(doc.querySelectorAll<HTMLElement>("[data-ds='toaster']"))) {
      if (!toaster.querySelector("[data-ds='toast']")) continue;
      const rect = toaster.getBoundingClientRect();
      // A toaster in the lower half sits on the bottom edge: the Sheet has its own place for that.
      if (rect.height === 0 || rect.top > view.innerHeight / 2) continue;
      bottom = Math.max(bottom, rect.bottom);
    }
    // At most half the screen: a tall stack on a short screen must not squeeze the panel away (WCAG 1.4.10).
    set(Math.ceil(Math.min(bottom, view.innerHeight / 2)));
  };
  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(measure);
  };
  const sizes = new ResizeObserver(schedule);
  const watch = () => {
    sizes.disconnect();
    for (const toaster of Array.from(doc.querySelectorAll("[data-ds='toaster']"))) sizes.observe(toaster);
    schedule();
  };
  const touchesToasts = (nodes: NodeList) =>
    Array.from(nodes).some(
      (n) => n instanceof Element && (n.matches("[data-ds='toaster'], [data-ds='toast']") || n.querySelector("[data-ds='toaster']") !== null),
    );
  const tree = new MutationObserver((records) => {
    if (records.some((r) => touchesToasts(r.addedNodes) || touchesToasts(r.removedNodes))) watch();
  });
  tree.observe(doc.documentElement, { childList: true, subtree: true });
  view.addEventListener('resize', schedule);
  watch();
  return () => {
    if (frame) view.cancelAnimationFrame(frame);
    tree.disconnect();
    sizes.disconnect();
    view.removeEventListener('resize', schedule);
  };
}

// ------------------------------------------------------------------ the layer

interface LayerData {
  content: DsSheetContent;
  sheet: DsSheet;
  theme: Signal<ThemeValue>;
}

const SHEET_LAYER = new InjectionToken<LayerData>('DS_SHEET_LAYER');

interface Drag {
  id: number;
  startY: number;
  /** The drawn offset, px down. */
  dy: number;
  samples: DragSample[];
  moved: boolean;
}

/** The portal: the themed wrapper (its own host), the root, the backdrop and the panel. Internal: dsSheetContent creates it. */
@Component({
  selector: 'div[data-dialog-layer]',
  imports: [NgTemplateOutlet, DsButton, DsCloseButton, DsSheetHandle, DsTitleBar, DsWindowControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: layerThemeProviders(() => inject(SHEET_LAYER).theme),
  hostDirectives: [DsLayerTheme],
  template: `
    <div data-ds="sheet" [attr.data-size]="sheet.size()" [attr.data-state]="state()" [attr.data-dragging]="dragging() ? '' : null"
      [attr.data-detent]="detentIndex() >= 0 ? detentIndex() : null" [attr.data-segment]="segment()"
      [style.--_dialog-detent-height]="detentIndex() >= 0 ? heights()[detentIndex()] + 'px' : null"
      [style.--_dialog-detent-max]="detentIndex() >= 0 ? heights()[heights().length - 1] + 'px' : null"
      [style.--_sheet-toast-end]="toastEnd() > 0 ? toastEnd() + 'px' : null"
      (pointerdown)="onRootPointerDown($event)" (mousedown)="onRootMouseDown($event)">
      <div #backdrop data-part="backdrop" [attr.data-state]="state()" aria-hidden="true"
        (pointerdown)="pressedBackdrop = true" (click)="onBackdropClick()"></div>
      <div #panel role="dialog" [id]="sheet.panelId" [attr.data-state]="state()" data-part="panel" tabindex="-1" aria-modal="true"
        [attr.aria-busy]="content.ariaBusy() ? 'true' : null"
        [attr.aria-labelledby]="content.title() !== undefined ? sheet.titleId : null"
        [attr.aria-describedby]="content.description() !== undefined ? sheet.descriptionId : null">
        @if (sheet.detents()) {
          <button dsSheetHandle [label]="handleLabel()"
            (pointerdown)="onHandleDown($event)" (pointermove)="onHandleMove($event)" (pointerup)="onHandleEnd($event, false)"
            (pointercancel)="onHandleEnd($event, true)" (lostpointercapture)="onHandleEnd($event, true)"
            (click)="onHandleClick()" (keydown)="onHandleKeydown($event)"></button>
        } @else {
          <div data-part="handle" aria-hidden="true"
            (pointerdown)="onHandleDown($event)" (pointermove)="onHandleMove($event)" (pointerup)="onHandleEnd($event, false)"
            (pointercancel)="onHandleEnd($event, true)" (lostpointercapture)="onHandleEnd($event, true)"><span data-part="handle-bar"></span></div>
        }
        @if (titlebarOn()) {
          <div dsTitleBar data-part="titlebar" [as]="content.title() !== undefined ? 'h2' : 'div'"
            [title]="content.title() !== undefined ? barTitle : undefined"
            [controls]="controlsOn() ? lights : undefined"
            [actions]="hasEndActions() || !(controlsOn() && !phone()) ? barActions : undefined"></div>
          @if (content.description() !== undefined) {
            <p [id]="sheet.descriptionId" data-part="description">{{ content.description() }}</p>
          }
        } @else {
          <div data-part="header">
            @if (content.title() !== undefined) {
              <h2 [id]="sheet.titleId" data-part="title">{{ content.title() }}</h2>
            }
            @if (content.description() !== undefined) {
              <p [id]="sheet.descriptionId" data-part="description">{{ content.description() }}</p>
            }
            <ng-container [ngTemplateOutlet]="closeButton" />
            <ng-container [ngTemplateOutlet]="endActions" />
          </div>
        }
        <ng-container [ngTemplateOutlet]="content.template" />
      </div>
    </div>
    <ng-template #barTitle><span data-dialog-title [id]="sheet.titleId">{{ content.title() }}</span></ng-template>
    <ng-template #barActions>
      @if (!(controlsOn() && !phone())) {
        <ng-container [ngTemplateOutlet]="closeButton" />
      }
      <ng-container [ngTemplateOutlet]="endActions" />
    </ng-template>
    <ng-template #endActions>
      @if (headerAction(); as action) {
        <div data-part="header-action"><ng-container [ngTemplateOutlet]="action.template" /></div>
      }
      @if (confirm(); as c) {
        <button dsButton data-part="confirm" size="sm" emphasis="solid" tone="accent" [start]="c.icon()"
          [disabled]="c.disabled()" [loading]="c.loading()" (click)="onConfirm(c, $event)">{{ c.label() }}</button>
      }
    </ng-template>
    <ng-template #lights>
      <div dsWindowControls [label]="words().controls" [closeLabel]="closeName()" [minimizeLabel]="words().minimize"
        [zoomLabel]="words().zoom" [onClose]="sheet.dismissible() ? closeFn : undefined"></div>
    </ng-template>
    <ng-template #closeButton>
      <button dsCloseButton data-part="close" [label]="closeName()" size="sm" [disabled]="!sheet.dismissible()" (click)="close()"></button>
    </ng-template>
  `,
})
export class DsSheetLayer {
  private readonly data = inject(SHEET_LAYER);
  protected readonly content = this.data.content;
  protected readonly sheet = this.data.sheet;
  private readonly theme = inject(DsThemeService);
  private readonly checker = inject(InteractivityChecker);
  private readonly motion = injectMotion();

  readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  readonly backdrop = viewChild.required<ElementRef<HTMLElement>>('backdrop');

  readonly closing = signal(false);
  readonly state = computed(() => (this.sheet.open() && !this.closing() ? 'open' : 'closed'));
  private readonly fold = injectFold();
  /** Order DU5: the segment of the sheet on a folded screen, absent without a fold. */
  protected readonly segment = computed(() => overlaySegment(this.fold()));
  protected readonly dragging = signal(false);
  protected readonly toastEnd = signal(0);
  protected readonly words = computed(() => (isArabic(this.theme.value().lang) ? sheetLabels.ar : sheetLabels.en));
  protected readonly closeName = computed(() => this.content.closeLabel() ?? this.words().close);
  protected readonly titlebarOn = this.theme.optionalPart('sheet', 'titlebar');
  protected readonly controlsOn = this.theme.optionalPart('sheet', 'controls');
  /** On a phone the window controls are hidden (the platform CSS), so the title bar carries the close control (order M1). */
  protected readonly phone = computed(() => ['ios', 'android'].includes(this.theme.value().platform));
  protected readonly headerAction = computed(() => this.sheet.headerActions()[0] ?? null);
  protected readonly confirm = computed(() => this.sheet.confirms()[0] ?? null);
  protected readonly hasEndActions = computed(() => this.headerAction() !== null || this.confirm() !== null);

  /** The detent heights in px, smallest first; empty with no detents. */
  protected readonly heights = signal<readonly number[]>([]);
  readonly detentIndex = computed(() => {
    const count = this.heights().length;
    return count > 0 ? Math.max(0, Math.min(count - 1, this.sheet.currentDetent())) : -1;
  });
  protected readonly handleLabel = computed(() =>
    this.words().size(Math.max(0, this.detentIndex()) + 1, Math.max(1, this.heights().length)),
  );

  protected pressedBackdrop = false;
  protected readonly closeFn = () => this.close();
  private refusal: Animation | null = null;
  private drag: Drag | null = null;
  /** Set by a drag that moved, so the click that follows its release does not also step. */
  private dragged = false;

  constructor() {
    syncDirectionality(inject(Directionality), this.theme.value);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const doc = host.ownerDocument;
    let stops: (() => void)[] = [];
    afterNextRender(() => {
      stops.push(watchTopToastEnd(doc, (end) => this.toastEnd.set(end)));
      const view = doc.defaultView;
      if (!view) return;
      const measure = () => this.measureDetents(view);
      measure();
      view.addEventListener('resize', measure);
      stops.push(() => view.removeEventListener('resize', measure));
    });
    inject(DestroyRef).onDestroy(() => {
      for (const stop of stops) stop();
      stops = [];
    });
  }

  /** The detent heights from the viewport height and the room under the root's top gap (helpers/sheet-detents.ts). */
  private measureDetents(view: Window): void {
    const list = this.sheet.detents();
    if (!list || list.length === 0) {
      if (this.heights().length > 0) this.heights.set([]);
      return;
    }
    const root = this.panel().nativeElement.parentElement;
    const viewport = view.innerHeight;
    let room = viewport;
    if (root) {
      const cs = view.getComputedStyle(root);
      const inner = root.clientHeight - (Number.parseFloat(cs.paddingTop) || 0) - (Number.parseFloat(cs.paddingBottom) || 0);
      if (inner > 0) room = inner;
    }
    const next = detentHeights(list, viewport, room);
    const prev = this.heights();
    if (!(prev.length === next.length && prev.every((h, i) => h === next[i]))) this.heights.set(next);
  }

  close(): void {
    this.sheet.setOpen(false);
  }

  isTop(): boolean {
    return isTopModalLayer(this);
  }

  refuse(): void {
    this.refusal = playRefusal(this.panel().nativeElement, this.motion, this.theme.value().dir, this.refusal);
  }

  /** A press on the backdrop that will not close the sheet: the panel nudges, and focus stays where it was. */
  protected onRootPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.sheet.dismissible() || this.state() !== 'open') return;
    if ((event.target as Element | null)?.getAttribute?.('data-part') !== 'backdrop') return;
    event.preventDefault();
    this.refuse();
  }

  /** A touch press still sends a compatibility mousedown, whose default moves focus. */
  protected onRootMouseDown(event: MouseEvent): void {
    if (this.sheet.dismissible() || this.state() !== 'open') return;
    if ((event.target as Element | null)?.getAttribute?.('data-part') === 'backdrop') event.preventDefault();
  }

  protected onBackdropClick(): void {
    const pressed = this.pressedBackdrop;
    this.pressedBackdrop = false;
    if (pressed && this.sheet.dismissible() && this.isTop()) this.close();
  }

  protected onConfirm(confirm: DsSheetConfirm, event: MouseEvent): void {
    confirm.click.emit(event);
    if (!event.defaultPrevented) this.close();
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isTop() || this.closing()) return;
    if (isInsideToaster(event.target)) return;
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (this.sheet.dismissible()) this.close();
      else this.refuse();
      return;
    }
    wrapTab(event, this.panel().nativeElement, this.checker);
  }

  onDocumentFocusin(event: FocusEvent): void {
    if (!this.isTop() || this.closing()) return;
    const panel = this.panel().nativeElement;
    const target = event.target;
    if (target instanceof Node && panel.contains(target)) return;
    if (target instanceof Element && target.closest('[data-menu-layer]')) return;
    if (isInsideToaster(target)) return;
    (tabbables(panel, this.checker)[0] ?? panel).focus();
  }

  focusInitial(): void {
    const panel = this.panel().nativeElement;
    if (isDevMode() && panel.querySelector('[data-part="title"]:not(:empty), [data-dialog-title]:not(:empty)') === null) {
      console.warn('Sheet: opened with no title. Use the title input of dsSheetContent.');
    }
    const target = dialogInitialFocus(panel, 'neutral') ?? tabbables(panel, this.checker)[0] ?? panel;
    target.focus();
  }

  animated(): Element[] {
    return [this.panel().nativeElement, this.backdrop().nativeElement];
  }

  // ---------------------------------------------------------------- the drag

  private resetDrag(): void {
    this.panel().nativeElement.style.removeProperty('--_dialog-drag-y');
  }

  private rest(): number {
    const h = this.heights();
    return h[Math.max(0, this.detentIndex())] ?? h[0] ?? 0;
  }

  protected onHandleDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.drag = { id: event.pointerId, startY: event.clientY, dy: 0, samples: [{ t: event.timeStamp, y: event.clientY }], moved: false };
    this.dragged = false;
    this.dragging.set(true);
  }

  protected onHandleMove(event: PointerEvent): void {
    const d = this.drag;
    if (!d || d.id !== event.pointerId) return;
    const raw = event.clientY - d.startY;
    if (Math.abs(raw) > CLICK_SLOP) d.moved = true;
    const dismissible = this.sheet.dismissible();
    const heights = this.heights();
    if (this.sheet.detents() && heights.length > 0) d.dy = detentDragOffset(raw, this.rest(), heights, dismissible);
    // Down follows the pointer; up, and down on a sheet that will not close, give a third (the rubber band).
    else d.dy = raw < 0 || !dismissible ? raw * RUBBER_SHARE : raw;
    d.samples.push({ t: event.timeStamp, y: event.clientY });
    if (d.samples.length > 16) d.samples.shift();
    this.panel().nativeElement.style.setProperty('--_dialog-drag-y', `${d.dy}px`);
  }

  protected onHandleEnd(event: PointerEvent, cancelled: boolean): void {
    const d = this.drag;
    if (!d || d.id !== event.pointerId) return;
    this.drag = null;
    this.dragging.set(false);
    this.dragged = d.moved;
    const panel = this.panel().nativeElement;
    // The release is the last sample: a pointer that rested before it lifted has no speed left (N28).
    d.samples.push({ t: event.timeStamp, y: d.samples[d.samples.length - 1]?.y ?? d.startY });
    const velocity = dragVelocity(d.samples);
    const dismissible = this.sheet.dismissible();
    const closeNow = () => {
      // The offset stays while it closes, so the exit plays from where the panel is. A parent that keeps it open gets it back.
      this.close();
      queueMicrotask(() => {
        if (panel.isConnected && untracked(this.sheet.open)) this.resetDrag();
      });
    };
    if (cancelled) return this.resetDrag();
    const heights = this.heights();
    if (this.sheet.detents() && heights.length > 0) {
      const to = settleDetent(heights, this.rest(), d.dy, velocity, dismissible);
      if (to.kind === 'close') return closeNow();
      this.resetDrag();
      this.sheet.setDetent(to.index);
      return;
    }
    const height = panel.getBoundingClientRect().height;
    if (dismissible && dragCloses(d.dy, velocity, height)) closeNow();
    else this.resetDrag();
  }

  /** A drag that moved is not a click; a press without one, Enter and Space take the next detent. */
  protected onHandleClick(): void {
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    const next = detentForKey('Enter', Math.max(0, this.detentIndex()), this.heights().length);
    if (next !== null) this.sheet.setDetent(next);
  }

  protected onHandleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') return;
    const next = detentForKey(event.key, Math.max(0, this.detentIndex()), this.heights().length);
    if (next === null) return;
    event.preventDefault();
    this.sheet.setDetent(next);
  }
}

// ------------------------------------------------------------------ dsSheetContent

/**
 * The sheet content: an ng-template with the body, the footer and the
 * header parts. While the sheet is open it renders in a portal at the end of
 * body, with the handle and the header (title, description, close control,
 * header action, confirm) above it.
 */
@Directive({ selector: 'ng-template[dsSheetContent]', exportAs: 'dsSheetContent' })
export class DsSheetContent {
  /** The title. It names the sheet. */
  readonly title = input<string | undefined>(undefined);
  /** One line under the title. It describes the sheet. */
  readonly description = input<string | undefined>(undefined);
  /** Accessible name of the close control. Default "Close sheet" (Arabic under lang ar). */
  readonly closeLabel = input<string | undefined>(undefined);
  /** aria-busy on the panel, while its content loads. */
  readonly ariaBusy = input<boolean | undefined>(undefined, { alias: 'aria-busy' });

  readonly template = inject<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    const sheet = injectSheet('dsSheetContent');
    const theme = inject(DsThemeService);
    connectModalPortal({
      open: sheet.open,
      component: DsSheetLayer,
      token: SHEET_LAYER,
      data: () => ({ content: this, sheet, theme: theme.value }) satisfies LayerData,
      trigger: () => sheet.trigger,
    });
  }
}

/** Everything a template needs for a sheet. */
export const DS_SHEET = [
  DsSheet,
  DsSheetTrigger,
  DsSheetClose,
  DsSheetContent,
  DsSheetBody,
  DsSheetFooter,
  DsSheetHeaderAction,
  DsSheetConfirm,
] as const;
