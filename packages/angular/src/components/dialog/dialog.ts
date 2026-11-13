// Dialog: a modal task that must be finished or dismissed. The twin of
// packages/react/src/components/Dialog/Dialog.tsx, on the same DOM, so
// Dialog.css and the Desk recipe apply as they are:
//
//   <body>
//     <div data-dialog-layer data-ds="theme" ...axes>     the portal theme, display: contents
//       <div data-ds="dialog" data-size data-tone data-state>   root: the fixed layer
//         <div data-part="backdrop" data-state>
//         <div data-part="panel" role="dialog" aria-modal="true" data-state>
//           <div data-part="titlebar" data-ds="title-bar">        Desk only (optional part)
//             <div data-part="controls"><div dsWindowControls>     Desk only (optional part)
//             <h2 data-part="title"><span data-dialog-title id>...</span></h2>
//           <h2 data-part="title">                                Studio
//           <button data-part="close" dsCloseButton>               Studio
//           <p data-part="description">
//           <div data-part="body">  <div data-part="footer">      from the content template
//
// Usage:
//
//   <ng-container dsDialog size="sm" tone="danger" [(open)]="open">
//     <button dsButton dsDialogTrigger>Delete project</button>
//     <ng-template dsDialogContent title="Delete the project?" description="...">
//       <div dsDialogBody>...</div>
//       <div dsDialogFooter>
//         <button dsButton dsDialogClose>Keep project</button>
//       </div>
//     </ng-template>
//   </ng-container>
//
// Rendering: dsDialogContent attaches a ComponentPortal (CDK Portal) of the
// layer component straight into document.body through a DomPortalOutlet.
// The layer's host element is created from its selector,
// `div[data-dialog-layer]`, so it is the themed portal wrapper itself: no
// CDK overlay container, wrapper or pane, and no cdk-dialog-container. The
// reasons are in behavior/dialog-behavior.ts.
//
// Motion is CSS, but for one beat (Dialog.css, pattern "dialog"). On close the root,
// the backdrop and the panel switch to data-state="closed"; after that
// render the layer waits for the running animations (getAnimations, the
// Web Animations API `finished` promise) and then disposes the portal. With
// no animation (reduced motion, a 0ms duration) it disposes at once.
//
// Refused (order 1.23, interaction "dialog-refuse"), as React's
// DialogBase.tsx: a press on the backdrop of a dialog with dismissible
// false, and Escape on it, do not close it. The panel nudges instead: a
// shake along the inline axis (out, back past its place, a smaller swing,
// rest) of --_dialog-refuse-shift inside duration.roll on ease.out, played
// with the Web Animations API. The style's mode for "dialog-refuse"
// (injectMotion) applies: none or reduced motion leaves it still. A second
// refusal cancels the first and plays again. The Angular port has no
// AlertDialog, so the alert form of the refusal has no host here.
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
  isDevMode,
  model,
  signal,
  untracked,
  viewChild,
  type OnInit,
  type Signal,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
  DIALOG_ACTION_SELECTOR,
  captureFocusReturn,
  dialogInitialFocus,
  focusReturnTarget,
  type FocusReturn,
  type OverlaySize,
  type Tone,
} from '@the-system/shared';
import { durationMs, readDuration, readEasing } from '@the-system/motion';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { animationsDone, hideOthers, lockScroll, tabbables, wrapTab } from '../../behavior';
import { DsThemeScope, DsThemeService, attributesOf, syncDirectionality, themeScopeProviders } from '../../theme';
import type { ThemeValue } from '../../theme';
import { DsCloseButton } from '../close-button/close-button';
import { isInsideToaster } from '../toast/is-inside-toaster';
import { DsTitleBar } from '../title-bar/title-bar';
import { DsWindowControls } from '../window-controls/window-controls';

export type DialogSize = Extract<OverlaySize, 'sm' | 'md' | 'lg' | 'xl' | '2xl'>;
export type DialogTone = Extract<Tone, 'neutral' | 'danger'>;

const dialogLabels = {
  en: { close: 'Close dialog', controls: 'Dialog controls', minimize: 'Minimize dialog', zoom: 'Zoom dialog' },
  ar: { close: 'إغلاق النافذة', controls: 'أزرار النافذة', minimize: 'تصغير النافذة', zoom: 'تكبير النافذة' },
} as const;

function labelsFor(lang: string) {
  return lang === 'ar' || lang.startsWith('ar-') ? dialogLabels.ar : dialogLabels.en;
}

let nextId = 0;

// ------------------------------------------------------------------ dsDialog

/**
 * The root: state and the variant axes. Renders no element of its own:
 * put it on an ng-container.
 */
@Directive({ selector: '[dsDialog]', exportAs: 'dsDialog' })
export class DsDialog implements OnInit {
  /** The open state. Two way: `[(open)]`. Emits openChange for Escape, the backdrop, the close control and dsDialogClose. */
  readonly open = model(false);
  /** Opens on first render when true. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** The width, from the dialog.width tokens: sm 360, md 440, lg 520, xl 640, 2xl 820 px. Default md. */
  readonly size = input<DialogSize>('md');
  /** danger: the title takes the danger color and focus opens on the Cancel action. Default neutral. */
  readonly tone = input<DialogTone>('neutral');
  /** false: Escape and a backdrop click do nothing and the close control is disabled. Default true. */
  readonly dismissible = input(true, { transform: booleanAttribute });

  private readonly base = `ds-dialog-${++nextId}`;
  readonly panelId = `${this.base}-panel`;
  readonly titleId = `${this.base}-title`;
  readonly descriptionId = `${this.base}-description`;
  /** In place title and description parts register here, so the panel points at them. */
  readonly placedTitle = signal(0);
  readonly placedDescription = signal(0);
  /** The trigger, where focus returns on close. */
  trigger: HTMLElement | null = null;

  ngOnInit(): void {
    if (this.defaultOpen()) this.open.set(true);
  }

  setOpen(open: boolean): void {
    this.open.set(open);
  }
}

function injectDialog(name: string): DsDialog {
  const dialog = inject(DsDialog, { optional: true });
  if (!dialog) throw new Error(`${name} must be used inside a dsDialog.`);
  return dialog;
}

// ------------------------------------------------------------------ trigger and close

/** Opens the dialog. Put it on a dsButton. Focus returns to it on close. */
@Directive({
  selector: '[dsDialogTrigger]',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'dialog.open() ? "true" : "false"',
    '[attr.aria-controls]': 'dialog.open() ? dialog.panelId : null',
    '[attr.data-state]': 'dialog.open() ? "open" : "closed"',
    '(click)': 'dialog.setOpen(true)',
  },
})
export class DsDialogTrigger {
  protected readonly dialog = injectDialog('dsDialogTrigger');

  constructor() {
    consumeHostAttributes(['dsDialogTrigger']);
    this.dialog.trigger = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    inject(DestroyRef).onDestroy(() => (this.dialog.trigger = null));
  }
}

/** Closes the dialog: the Cancel action. Marked data-dialog-cancel, so a danger dialog opens focus on it. */
@Directive({
  selector: '[dsDialogClose]',
  host: { 'data-dialog-cancel': '', '(click)': 'dialog.setOpen(false)' },
})
export class DsDialogClose {
  protected readonly dialog = injectDialog('dsDialogClose');
  constructor() {
    consumeHostAttributes(['dsDialogClose']);
  }
}

// ------------------------------------------------------------------ parts in the content template

/** A title in place (the title input is the common case). It names the dialog. */
@Directive({
  selector: '[dsDialogTitle]',
  host: { 'data-part': 'title', '[attr.id]': 'dialog.titleId' },
})
export class DsDialogTitle {
  protected readonly dialog = injectDialog('dsDialogTitle');
  constructor() {
    consumeHostAttributes(['dsDialogTitle']);
    this.dialog.placedTitle.update((n) => n + 1);
    inject(DestroyRef).onDestroy(() => this.dialog.placedTitle.update((n) => n - 1));
  }
}

/** A description in place. It describes the dialog. */
@Directive({
  selector: '[dsDialogDescription]',
  host: { 'data-part': 'description', '[attr.id]': 'dialog.descriptionId' },
})
export class DsDialogDescription {
  protected readonly dialog = injectDialog('dsDialogDescription');
  constructor() {
    consumeHostAttributes(['dsDialogDescription']);
    this.dialog.placedDescription.update((n) => n + 1);
    inject(DestroyRef).onDestroy(() => this.dialog.placedDescription.update((n) => n - 1));
  }
}

/**
 * The content. It scrolls inside when the dialog reaches its maximum height,
 * and joins the tab order while it scrolls.
 */
@Directive({
  selector: '[dsDialogBody]',
  host: { 'data-part': 'body', '[attr.tabindex]': 'scrolls() ? 0 : null' },
})
export class DsDialogBody {
  protected readonly scrolls = signal(false);

  constructor() {
    const el = consumeHostAttributes(['dsDialogBody']);
    let observer: ResizeObserver | undefined;
    afterNextRender(() => {
      const measure = () => this.scrolls.set(el.scrollHeight > el.clientHeight + 1);
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      observer = new ResizeObserver(measure);
      observer.observe(el);
      for (const child of Array.from(el.children)) observer.observe(child);
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }
}

/** The actions: up to three Buttons at the inline end. Cancel first, the primary action last. */
@Directive({ selector: '[dsDialogFooter]', host: { 'data-part': 'footer' } })
export class DsDialogFooter {
  constructor() {
    consumeHostAttributes(['dsDialogFooter']);
  }
}

// ------------------------------------------------------------------ focus rule

// The focus rule and the focus return come from packages/shared
// (dialog-focus.ts), the same code React runs.

/** Development only: says what a dialog is missing when it opens. */
function warnInDev(panel: HTMLElement): void {
  if (!isDevMode()) return;
  const named =
    panel.hasAttribute('aria-label') ||
    panel.querySelector('[data-part="title"]:not(:empty), [data-dialog-title]:not(:empty)') !== null;
  if (!named) console.warn('Dialog: opened with no title. Use the title input of dsDialogContent, or a dsDialogTitle.');
  const footer = Array.from(panel.querySelectorAll('[data-part="footer"]')).find((el) => el.closest('[data-part="panel"]') === panel);
  const actions = footer ? footer.querySelectorAll(DIALOG_ACTION_SELECTOR).length : 0;
  if (actions > 3) console.warn(`Dialog: the footer holds ${actions} actions. Keep it to three at most.`);
}

// ------------------------------------------------------------------ the layer

interface LayerData {
  content: DsDialogContent;
  dialog: DsDialog;
  theme: Signal<ThemeValue>;
}

const DIALOG_LAYER = new InjectionToken<LayerData>('DS_DIALOG_LAYER');

/** The open dialogs, the top one last. Escape, Tab and focus belong to the top one. */
const stack: DsDialogLayer[] = [];

/**
 * The portal: the themed wrapper (its own host), the root, the backdrop and
 * the panel. Internal: dsDialogContent creates it.
 */
@Component({
  selector: 'div[data-dialog-layer]',
  imports: [NgTemplateOutlet, DsCloseButton, DsTitleBar, DsWindowControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: themeScopeProviders(() => new DsThemeScope(inject(DIALOG_LAYER).theme)),
  host: {
    'data-ds': 'theme',
    '[attr.data-style]': 'attrs()["data-style"]',
    '[attr.data-scheme]': 'attrs()["data-scheme"]',
    '[attr.data-density]': 'attrs()["data-density"]',
    '[attr.data-contrast]': 'attrs()["data-contrast"]',
    '[attr.data-platform]': 'attrs()["data-platform"]',
    '[attr.data-glass]': 'attrs()["data-glass"]',
    '[attr.dir]': 'attrs().dir',
    '[attr.lang]': 'attrs().lang',
  },
  template: `
    <div data-ds="dialog" [attr.data-size]="dialog.size()" [attr.data-tone]="dialog.tone()" [attr.data-state]="state()">
      <div #backdrop [attr.data-state]="state()" data-part="backdrop" aria-hidden="true"
        (pointerdown)="onBackdropPointerDown($event)" (click)="onBackdropClick()"></div>
      <div #panel role="dialog" [id]="dialog.panelId" [attr.data-state]="state()" data-part="panel" tabindex="-1"
        aria-modal="true" [attr.aria-labelledby]="hasTitle() ? dialog.titleId : null"
        [attr.aria-describedby]="hasDescription() ? dialog.descriptionId : null">
        @if (titlebarOn()) {
          <div dsTitleBar data-part="titlebar" [as]="content.title() !== undefined ? 'h2' : 'div'"
            [title]="content.title() !== undefined ? barTitle : undefined"
            [controls]="controlsOn() ? lights : undefined"
            [actions]="controlsOn() ? undefined : closeButton"></div>
        } @else {
          @if (content.title() !== undefined) {
            <h2 [id]="dialog.titleId" data-part="title">{{ content.title() }}</h2>
          }
          <ng-container [ngTemplateOutlet]="closeButton" />
        }
        @if (content.description() !== undefined) {
          <p [id]="dialog.descriptionId" data-part="description">{{ content.description() }}</p>
        }
        <ng-container [ngTemplateOutlet]="content.template" />
      </div>
    </div>
    <ng-template #barTitle><span data-dialog-title [id]="dialog.titleId">{{ content.title() }}</span></ng-template>
    <ng-template #lights>
      <div dsWindowControls [label]="content.controlsLabel() ?? words().controls" [closeLabel]="closeName()"
        [minimizeLabel]="words().minimize" [zoomLabel]="words().zoom"
        [onClose]="dialog.dismissible() ? closeFn : undefined"></div>
    </ng-template>
    <ng-template #closeButton>
      <button dsCloseButton data-part="close" [label]="closeName()" size="sm"
        [disabled]="!dialog.dismissible()" (click)="close()"></button>
    </ng-template>
  `,
})
export class DsDialogLayer {
  private readonly data = inject(DIALOG_LAYER);
  protected readonly content = this.data.content;
  protected readonly dialog = this.data.dialog;
  private readonly theme = inject(DsThemeService);
  private readonly checker = inject(InteractivityChecker);

  readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  readonly backdrop = viewChild.required<ElementRef<HTMLElement>>('backdrop');

  /** open while the dialog is open, closed while the exit plays. */
  readonly state = computed(() => (this.dialog.open() && !this.closing() ? 'open' : 'closed'));
  readonly closing = signal(false);
  protected readonly attrs = computed(() => attributesOf(this.theme.value()));
  protected readonly words = computed(() => labelsFor(this.theme.value().lang));
  protected readonly closeName = computed(() => this.content.closeLabel() ?? this.words().close);
  protected readonly titlebarOn = this.theme.optionalPart('dialog', 'titlebar');
  protected readonly controlsOn = this.theme.optionalPart('dialog', 'controls');
  protected readonly hasTitle = computed(() => this.content.title() !== undefined || this.dialog.placedTitle() > 0);
  protected readonly hasDescription = computed(
    () => this.content.description() !== undefined || this.dialog.placedDescription() > 0,
  );
  protected pressedBackdrop = false;
  protected readonly closeFn = () => this.close();
  private readonly motion = injectMotion();
  /** The refused nudge playing now: one at a time, the newest wins. */
  private refusal: Animation | null = null;

  constructor() {
    syncDirectionality(inject(Directionality), this.theme.value);
  }

  close(): void {
    this.dialog.setOpen(false);
  }

  /** A press on the backdrop that will not close the dialog: the panel nudges. */
  protected onBackdropPointerDown(event: PointerEvent): void {
    this.pressedBackdrop = true;
    if (event.button !== 0 || this.dialog.dismissible() || this.state() !== 'open') return;
    this.refuse();
  }

  /** The refused nudge (interaction "dialog-refuse"), React's DialogBase refuse(). */
  refuse(): void {
    this.refusal?.cancel();
    this.refusal = null;
    const panel = this.panel().nativeElement;
    if (typeof panel.animate !== 'function' || this.motion.mode('dialog-refuse') !== 'full') return;
    // Without the token (a page with no token CSS) the base value; under reduced motion the token is 0.
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

  protected onBackdropClick(): void {
    const pressed = this.pressedBackdrop;
    this.pressedBackdrop = false;
    if (pressed && this.dialog.dismissible() && this.isTop()) this.close();
  }

  isTop(): boolean {
    return stack[stack.length - 1] === this;
  }

  /** Escape and Tab for the top dialog. */
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isTop() || this.closing()) return;
    // The toaster sits above dialogs: its keys (Tab through toasts, Escape) are its own, as in React.
    if (isInsideToaster(event.target)) return;
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (this.dialog.dismissible()) this.close();
      else this.refuse();
      return;
    }
    wrapTab(event, this.panel().nativeElement, this.checker);
  }

  /** Focus that lands outside the top dialog comes back in. */
  onDocumentFocusin(event: FocusEvent): void {
    if (!this.isTop() || this.closing()) return;
    const panel = this.panel().nativeElement;
    const target = event.target;
    if (target instanceof Node && panel.contains(target)) return;
    // A menu opened from inside the dialog lives in its own portal layer: focus there stays.
    if (target instanceof Element && target.closest('[data-menu-layer]')) return;
    // The toaster sits above dialogs: focus may move into the toasts (F8), as in React.
    if (isInsideToaster(target)) return;
    (tabbables(panel, this.checker)[0] ?? panel).focus();
  }

  /** Runs the focus rule, once the panel has rendered. */
  focusInitial(): void {
    const panel = this.panel().nativeElement;
    warnInDev(panel);
    const target = dialogInitialFocus(panel, this.dialog.tone()) ?? tabbables(panel, this.checker)[0] ?? panel;
    target.focus();
  }

  /** The elements whose exit animation the close waits for. */
  animated(): Element[] {
    return [this.panel().nativeElement, this.backdrop().nativeElement];
  }

  push(): void {
    stack.push(this);
  }

  pop(): void {
    const i = stack.indexOf(this);
    if (i >= 0) stack.splice(i, 1);
  }
}

// ------------------------------------------------------------------ dsDialogContent

/**
 * The dialog content: an ng-template with the body and the footer. While
 * the dialog is open it renders in a portal at the end of body, with the
 * title, the description and the close control (or the Desk title bar)
 * around it.
 */
@Directive({ selector: 'ng-template[dsDialogContent]', exportAs: 'dsDialogContent' })
export class DsDialogContent {
  /** The title: the question being asked. It names the dialog. */
  readonly title = input<string | undefined>(undefined);
  /** One line under the title that says what happens. It describes the dialog. */
  readonly description = input<string | undefined>(undefined);
  /** Accessible name of the close control. Default "Close dialog" (Arabic under lang ar). */
  readonly closeLabel = input<string | undefined>(undefined);
  /** Accessible name of the Desk lights group. Default "Dialog controls". */
  readonly controlsLabel = input<string | undefined>(undefined);

  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly dialog = injectDialog('dsDialogContent');
  private readonly theme = inject(DsThemeService);
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  private readonly doc = inject(DOCUMENT);

  private outlet: DomPortalOutlet | null = null;
  private layer: DsDialogLayer | null = null;
  private undo: (() => void)[] = [];
  /** Where focus goes back, captured on open (shared dialog-focus.ts). */
  private returnTo: { active: FocusReturn; trigger: FocusReturn } | null = null;
  private generation = 0;

  constructor() {
    effect(() => {
      const open = this.dialog.open();
      untracked(() => (open ? this.mount() : this.unmountAfterExit()));
    });
    inject(DestroyRef).onDestroy(() => this.dispose(false));
  }

  private mount(): void {
    this.generation += 1;
    if (this.layer) {
      // Reopened while the exit played: stay mounted and open again.
      this.layer.closing.set(false);
      return;
    }
    this.returnTo = {
      active: captureFocusReturn(this.doc.activeElement),
      trigger: captureFocusReturn(this.dialog.trigger),
    };

    // Every axis of the theme the dialog is opened in, copied onto the portal.
    const theme = this.theme.value;
    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: DIALOG_LAYER, useValue: { content: this, dialog: this.dialog, theme } satisfies LayerData }],
    });
    this.outlet = new DomPortalOutlet(this.doc.body, this.appRef, injector);
    const ref = this.outlet.attach(new ComponentPortal(DsDialogLayer, null, injector));
    ref.changeDetectorRef.detectChanges();
    const layer = ref.instance;
    this.layer = layer;
    layer.push();

    const keydown = (e: KeyboardEvent) => layer.onDocumentKeydown(e);
    const focusin = (e: FocusEvent) => layer.onDocumentFocusin(e);
    this.doc.addEventListener('keydown', keydown);
    this.doc.addEventListener('focusin', focusin);
    this.undo = [
      () => this.doc.removeEventListener('keydown', keydown),
      () => this.doc.removeEventListener('focusin', focusin),
      lockScroll(this.doc),
      hideOthers(ref.location.nativeElement as Element),
    ];
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
    layer.pop();
    for (const fn of this.undo.reverse()) fn();
    this.undo = [];
    // detach, not dispose: DomPortalOutlet.dispose removes its outlet element, here document.body.
    this.outlet?.detach();
    this.outlet = null;
    this.layer = null;
    if (!returnFocus) return;
    // Back to the trigger, else to what had focus before the dialog opened.
    // When that is gone too: its nearest connected focusable ancestor, else
    // the first tab stop of main, else the body (focusReturnTarget).
    const trigger = this.dialog.trigger;
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

/** Everything a template needs for a dialog. */
export const DS_DIALOG = [
  DsDialog,
  DsDialogTrigger,
  DsDialogClose,
  DsDialogContent,
  DsDialogTitle,
  DsDialogDescription,
  DsDialogBody,
  DsDialogFooter,
] as const;
