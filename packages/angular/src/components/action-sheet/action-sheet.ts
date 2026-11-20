// ActionSheet: a short list of actions on one object, opened from the
// control that names the object. The twin of
// packages/react/src/components/ActionSheet/ActionSheet.tsx, on the same
// DOM, so ActionSheet.css and the platform files apply as they are.
//
//   <ng-container dsActionSheet [(open)]="open" placement="auto">
//     <button dsIconButton dsActionSheetTrigger icon="more" label="More options for Spring launch"></button>
//     <ng-template dsActionSheetContent title="Spring launch" description="The board is shared with 4 people.">
//       <button dsActionSheetAction tone="danger" (click)="remove()">Delete board</button>
//       <button dsActionSheetAction>Duplicate board</button>
//     </ng-template>
//   </ng-container>
//
// The DOM, as React:
//
//   <body>
//     <div data-ds="theme" data-dialog-layer ...axes>            the portal theme, its own host
//       <div data-ds="action-sheet" data-state data-placement>
//         <div data-part="backdrop" data-state>                    transparent when anchored
//         <div data-radix-popper-content-wrapper>                  anchored only, placed as Radix Popper does
//           <div data-part="panel" role="dialog | alertdialog">
//             <h2 data-part="title">
//             <p data-part="description">
//             <div data-part="actions">
//               <button data-ds="button" data-part="action" data-tone>
//               <button data-ds="button" data-part="cancel" data-dialog-cancel>
//
// Rendering follows the Angular Dialog (components/dialog/dialog.ts): a CDK
// ComponentPortal whose host is the themed portal wrapper, the focus trap
// by hand with InteractivityChecker, the scroll lock and the page hidden
// from assistive tech (behavior/). The anchored card is placed with
// behavior/popper.ts, the same Floating UI steps Radix Popper runs, and
// the panel maps the --radix-popper-* variables to the --radix-popover-*
// names ActionSheet.css reads.
//
// Names that differ from React, by frameworks.md:
// - `onOpenChange` is the `openChange` output of `[(open)]`.
// - ActionSheetAction and ActionSheetCancel are the buttons themselves,
//   `button[dsActionSheetAction]` and `button[dsActionSheetCancel]`, on the
//   Button base, with Button's parts. A press runs the caller's (click)
//   first; preventDefault in it keeps the sheet open, as React.
// - React lifts the Cancel out of its children and puts it last. A
//   template cannot be reordered, so a dsActionSheetCancel is written last
//   by the caller; with none, the sheet adds one after the actions.
// - The danger check reads the tone of the actions in the template, which
//   register with the sheet, where React reads its children's props.
//
// Focus as React: alertdialog and focus on Cancel when an action is tone
// danger, else dialog and focus on the first action that is not disabled.
// Up and Down move between the items and wrap, Home and End go to the ends,
// Tab moves through them inside the sheet, Escape cancels. Focus returns to
// the trigger. With dismissible false, Escape and a press outside nudge the
// panel instead (interaction dialog-refuse).
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
import { DsIcon } from '@the-system/icons/angular';
import {
  captureFocusReturn,
  focusReturnTarget,
  resolveActionSheetPlacement,
  type ActionSheetPlacement,
  type ActionSheetPlacementChoice,
  type ActionSheetResolved,
  type FocusReturn,
  type Tone,
} from '@the-system/shared';
import { durationMs, readDuration, readEasing } from '@the-system/motion';
import { consumeHostAttributes } from '../../internal/host';
import { followTriggerTitle, injectTriggerRow } from '../../internal/trigger-row';
import { injectMotion } from '../../internal/motion';
import { animationsDone, hideOthers, isTopModalLayer, lockScroll, popModalLayer, pushModalLayer, tabbables, wrapTab } from '../../behavior';
import { autoPlace, computePopper, writePopper, type PopperAlign, type PopperSide } from '../../behavior/popper';
import { attributesOf, DsLayerTheme, DsThemeService, layerThemeProviders, syncDirectionality } from '../../theme';
import type { ThemeValue } from '../../theme';
import { DsButtonBase, isIconName, type ButtonEmphasis, type ButtonSlotContent } from '../button/button-base';
import { isInsideToaster } from '../toast/is-inside-toaster';

/** The tone of one action: danger for one that deletes or removes. */
export type ActionSheetActionTone = Extract<Tone, 'neutral' | 'danger'>;

// The placement rule lives in @the-system/shared (order C5): re-exported here for this folder's demo and spec.
export { ACTION_SHEET_ROOM, resolveActionSheetPlacement, type ActionSheetPlacement, type ActionSheetPlacementChoice, type ActionSheetResolved } from '@the-system/shared';

/** The gap between the trigger and an anchored card on web and macos, and the space it keeps from the viewport edges, as React. */
const GAP = 8;
const COLLISION_PADDING = 16;

const centered: ActionSheetResolved = { placement: 'center', offset: GAP, align: 'end' };

const cancelWords = { en: 'Cancel', ar: 'إلغاء' } as const;
const isArabic = (lang: string) => lang === 'ar' || lang.startsWith('ar-');

let nextId = 0;

// ------------------------------------------------------------------ dsActionSheet

/** The root: state and placement. Renders no element of its own: put it on an ng-container. */
@Directive({ selector: '[dsActionSheet]', exportAs: 'dsActionSheet' })
export class DsActionSheet {
  /** The open state. Two way: `[(open)]`. Emits false for an action, Cancel, Escape and a press outside. */
  readonly open = model(false);
  /** Opens on first render when true. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /**
   * Where the sheet sits. auto (default): anchored to the trigger on ios, a
   * bottom sheet on android, anchored on web and macos when there is room
   * beside the trigger, else in the center. Resolved when it opens.
   */
  readonly placement = input<ActionSheetPlacementChoice>('auto');
  /** false: Escape and a press outside do nothing, while an action runs. Default true. */
  readonly dismissible = input(true, { transform: booleanAttribute });

  private readonly theme = inject(DsThemeService);
  private readonly base = `ds-action-sheet-${++nextId}`;
  readonly panelId = `${this.base}-panel`;
  readonly titleId = `${this.base}-title`;
  readonly descriptionId = `${this.base}-description`;
  /** The trigger: the anchor of an anchored sheet, and where focus returns on close. */
  trigger: HTMLElement | null = null;
  /** The placement in use, held while the sheet is open. */
  readonly resolved = signal<ActionSheetResolved>(centered);
  /** Actions of tone danger in the template. */
  readonly dangers = signal(0);
  /** Cancel items in the template. With none, the sheet adds one. */
  readonly cancels = signal(0);

  constructor() {
    consumeHostAttributes(['dsActionSheet', 'open', 'defaultOpen', 'placement', 'dismissible']);
    afterNextRender(() => {
      if (this.defaultOpen() && !this.open()) this.setOpen(true);
    });
  }

  setOpen(open: boolean): void {
    this.open.set(open);
  }

  /** Reads the placement for this opening: once, when it opens, and held while it is open. */
  resolve(): void {
    const t = this.theme.value();
    this.resolved.set(resolveActionSheetPlacement(this.placement(), t.platform, this.trigger, t.dir));
  }
}

function injectSheet(name: string): DsActionSheet {
  const sheet = inject(DsActionSheet, { optional: true });
  if (!sheet) throw new Error(`${name} must be used inside a dsActionSheet.`);
  return sheet;
}

// ------------------------------------------------------------------ trigger

/**
 * Opens the sheet. Put it on a dsButton or dsIconButton that names the
 * object, or on a List row (`li[dsListItem]`), whose title then carries the
 * trigger (internal/trigger-row.ts). Focus returns to it on close.
 */
@Directive({
  selector: '[dsActionSheetTrigger]',
  host: {
    '[attr.aria-haspopup]': 'row ? null : "dialog"',
    '[attr.aria-expanded]': 'row ? null : sheet.open() ? "true" : "false"',
    '[attr.aria-controls]': '!row && sheet.open() ? sheet.panelId : null',
    '[attr.data-state]': 'row ? null : sheet.open() ? "open" : "closed"',
  },
})
export class DsActionSheetTrigger {
  protected readonly sheet = injectSheet('dsActionSheetTrigger');
  protected readonly row = injectTriggerRow();

  constructor() {
    const el = consumeHostAttributes(['dsActionSheetTrigger']);
    const sheet = this.sheet;
    sheet.trigger = el;
    let current: HTMLElement = el;
    // The caller's own (click) runs first: this listens from after the first render, and it may keep the sheet shut.
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      sheet.setOpen(!sheet.open());
    };
    const row = this.row;
    if (row) {
      // On a row the title runs the click, after the row's own handlers.
      row.connect(
        () => ({ id: null, haspopup: 'dialog', expanded: sheet.open(), controls: sheet.open() ? sheet.panelId : null, state: sheet.open() ? 'open' : 'closed' }),
        { click },
      );
      followTriggerTitle(row, (title) => (sheet.trigger = current = title));
    } else {
      afterNextRender(() => el.addEventListener('click', click));
    }
    inject(DestroyRef).onDestroy(() => {
      el.removeEventListener('click', click);
      if (sheet.trigger === current) sheet.trigger = null;
    });
  }
}

// ------------------------------------------------------------------ items

/** The look of the items for a placement: rows of text at the bottom, capsules elsewhere. */
function itemEmphasis(placement: ActionSheetPlacement): ButtonEmphasis {
  return placement === 'bottom' ? 'ghost' : 'soft';
}

/** Marks the Cancel the layer adds, so it does not count as the caller's. */
const BUILT_IN_CANCEL = new InjectionToken<boolean>('DS_ACTION_SHEET_BUILT_IN_CANCEL');

/** Button's parts, for the items: start, label, end, the loading spinner and status, the hit area. */
const ITEM_TEMPLATE = `
  @if (start(); as content) {
    <span data-part="start">
      @if (isIconName(content)) {
        <svg dsIcon [name]="content" size="md"></svg>
      } @else {
        <ng-container [ngTemplateOutlet]="content" />
      }
    </span>
  }
  <span data-part="label"><ng-content>{{ fallback() }}</ng-content></span>
  @if (end(); as content) {
    <span data-part="end">
      @if (isIconName(content)) {
        <svg dsIcon [name]="content" size="md"></svg>
      } @else {
        <ng-container [ngTemplateOutlet]="content" />
      }
    </span>
  }
  @if (loading()) {
    <span data-part="spinner" aria-hidden="true"></span>
    <span data-part="status" role="status">{{ loadingLabel() }}</span>
  }
  @if (spinnerLeaving()) {
    <span data-part="spinner" aria-hidden="true"></span>
  }
  <span data-part="hit" aria-hidden="true"></span>
`;

/** The shared item: a large full width Button that closes the sheet after the caller's (click), unless it called preventDefault. */
@Directive()
abstract class ActionSheetItem extends DsButtonBase {
  protected readonly sheet = injectSheet('An ActionSheet item');
  /** Leading content: an icon name or a template. */
  readonly start = input<ButtonSlotContent | undefined>(undefined);
  protected readonly isIconName = isIconName;
  protected abstract readonly fallback: Signal<string>;

  constructor() {
    super();
    consumeHostAttributes(['start', 'end']);
    // After the caller's own (click), which Angular adds when the element is made.
    const click = (event: MouseEvent) => {
      if (!event.defaultPrevented && !this.inert()) this.sheet.setOpen(false);
    };
    afterNextRender(() => this.host.addEventListener('click', click));
    inject(DestroyRef).onDestroy(() => this.host.removeEventListener('click', click));
  }
}

/** One action. A press runs the caller's (click), then closes the sheet unless it called event.preventDefault(). */
@Component({
  selector: 'button[dsActionSheetAction]',
  exportAs: 'dsActionSheetAction',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'button',
    'data-part': 'action',
    'data-full-width': '',
    'data-wrap': '',
  },
  template: ITEM_TEMPLATE,
})
export class DsActionSheetAction extends ActionSheetItem {
  // tone is the Button base's input: neutral (default) or danger. danger: the action deletes or
  // removes; the sheet becomes an alertdialog and focus opens on Cancel.
  /** Trailing content: an icon name or a template. */
  readonly end = input<ButtonSlotContent | undefined>(undefined);
  readonly emphasis = computed<ButtonEmphasis | undefined>(() => itemEmphasis(this.sheet.resolved().placement));
  protected readonly defaultEmphasis: ButtonEmphasis = 'soft';
  protected readonly fallback = signal('');
  override readonly size = signal<'lg'>('lg') as never;

  constructor() {
    super();
    consumeHostAttributes(['dsActionSheetAction']);
    let counted = false;
    effect(() => {
      const danger = this.tone() === 'danger';
      if (danger === counted) return;
      counted = danger;
      untracked(() => this.sheet.dangers.update((n) => n + (danger ? 1 : -1)));
    });
    inject(DestroyRef).onDestroy(() => {
      if (counted) this.sheet.dangers.update((n) => n - 1);
    });
  }
}

/** Closes the sheet and runs nothing. Write it last; with none, the sheet adds one with the built in word. */
@Component({
  selector: 'button[dsActionSheetCancel]',
  exportAs: 'dsActionSheetCancel',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'button',
    'data-part': 'cancel',
    'data-dialog-cancel': '',
    'data-full-width': '',
    'data-wrap': '',
  },
  template: ITEM_TEMPLATE,
})
export class DsActionSheetCancel extends ActionSheetItem {
  readonly emphasis = signal<ButtonEmphasis | undefined>('ghost');
  protected readonly defaultEmphasis: ButtonEmphasis = 'ghost';
  protected readonly end = signal<ButtonSlotContent | undefined>(undefined);
  override readonly size = signal<'lg'>('lg') as never;
  private readonly theme = inject(DsThemeService);
  /** The label when none is projected: Cancel, إلغاء in Arabic. */
  protected readonly fallback = computed(() => (isArabic(this.theme.value().lang) ? cancelWords.ar : cancelWords.en));

  constructor() {
    super();
    consumeHostAttributes(['dsActionSheetCancel']);
    if (inject(BUILT_IN_CANCEL, { optional: true })) return;
    this.sheet.cancels.update((n) => n + 1);
    inject(DestroyRef).onDestroy(() => this.sheet.cancels.update((n) => n - 1));
  }
}

// ------------------------------------------------------------------ the layer

interface LayerData {
  content: DsActionSheetContent;
  sheet: DsActionSheet;
  theme: Signal<ThemeValue>;
}

const SHEET_LAYER = new InjectionToken<LayerData>('DS_ACTION_SHEET_LAYER');

/** The content's own style when anchored, as Radix Popover writes it: the --radix-popover-* names map the popper variables. */
const POPOVER_STYLE =
  '--radix-popover-content-transform-origin: var(--radix-popper-transform-origin); --radix-popover-content-available-width: var(--radix-popper-available-width); --radix-popover-content-available-height: var(--radix-popper-available-height); --radix-popover-trigger-width: var(--radix-popper-anchor-width); --radix-popover-trigger-height: var(--radix-popper-anchor-height);';

const ITEM_SELECTOR = ':is([data-part="action"], [data-part="cancel"])';

/** The items of a panel in order, the disabled ones included (they stay focusable). */
function itemsOf(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(`[data-part="actions"] > ${ITEM_SELECTOR}`));
}

/** The open sheets, the top one last. Escape, Tab and focus belong to the top one. */

/** The portal: the themed wrapper (its own host), the root, the backdrop and the panel. Internal: dsActionSheetContent creates it. */
@Component({
  selector: 'div[data-dialog-layer]',
  imports: [NgTemplateOutlet, DsActionSheetCancel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ...layerThemeProviders(() => inject(SHEET_LAYER).theme),
    { provide: BUILT_IN_CANCEL, useValue: true },
  ],
  hostDirectives: [DsLayerTheme],
  host: {
  },
  template: `
    <div data-ds="action-sheet" [attr.data-state]="state()" [attr.data-placement]="placement()"
      (pointerdown)="onRootPointerDown($event)" (mousedown)="onRootMouseDown($event)">
      <div #backdrop data-part="backdrop" [attr.data-state]="state()" aria-hidden="true"
        (pointerdown)="pressedBackdrop = true" (click)="onBackdropClick()"></div>
      @if (anchored()) {
        <div #wrapper data-radix-popper-content-wrapper="" [attr.dir]="attrs().dir">
          <ng-container [ngTemplateOutlet]="panelTemplate" />
        </div>
      } @else {
        <ng-container [ngTemplateOutlet]="panelTemplate" />
      }
    </div>
    <ng-template #panelTemplate>
      <div #panel data-part="panel" [attr.role]="sheet.dangers() > 0 ? 'alertdialog' : 'dialog'" [id]="sheet.panelId"
        [attr.data-state]="state()" [attr.data-side]="anchored() ? side() : null" [attr.data-align]="anchored() ? align() : null"
        [attr.style]="anchored() ? popoverStyle : null" tabindex="-1" aria-modal="true"
        [attr.aria-labelledby]="titleText() !== undefined ? sheet.titleId : null"
        [attr.aria-describedby]="content.description() !== undefined ? sheet.descriptionId : null"
        (keydown)="onPanelKeydown($event)">
        @if (titleText(); as text) {
          <h2 [id]="sheet.titleId" data-part="title" [attr.data-visually-hidden]="content.title() === undefined ? '' : null">{{ text }}</h2>
        }
        @if (content.description(); as text) {
          <p [id]="sheet.descriptionId" data-part="description">{{ text }}</p>
        }
        <div data-part="actions">
          <ng-container [ngTemplateOutlet]="content.template" />
          @if (sheet.cancels() === 0) {
            <button dsActionSheetCancel></button>
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class DsActionSheetLayer {
  private readonly data = inject(SHEET_LAYER);
  protected readonly content = this.data.content;
  protected readonly sheet = this.data.sheet;
  private readonly theme = inject(DsThemeService);
  private readonly checker = inject(InteractivityChecker);
  private readonly motion = injectMotion();

  readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  readonly backdrop = viewChild.required<ElementRef<HTMLElement>>('backdrop');
  readonly wrapper = viewChild<ElementRef<HTMLElement>>('wrapper');

  readonly closing = signal(false);
  readonly state = computed(() => (this.sheet.open() && !this.closing() ? 'open' : 'closed'));
  protected readonly placement = computed(() => this.sheet.resolved().placement);
  protected readonly anchored = computed(() => this.placement() === 'anchored');
  readonly side = signal<PopperSide>('bottom');
  readonly align = signal<PopperAlign>('start');
  protected readonly attrs = computed(() => attributesOf(this.theme.value()));
  protected readonly popoverStyle = POPOVER_STYLE;
  protected readonly titleText = computed(() => this.content.title() ?? this.content.label());
  protected pressedBackdrop = false;
  /** The refused nudge playing now: one at a time, the newest wins. */
  private refusal: Animation | null = null;

  constructor() {
    syncDirectionality(inject(Directionality), this.theme.value);
  }

  close(): void {
    this.sheet.setOpen(false);
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

  /** Up and Down move between the items and wrap; Home and End go to the ends. */
  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const all = itemsOf(this.panel().nativeElement);
    if (all.length === 0) return;
    const at = all.indexOf(event.target as HTMLElement);
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = all.length - 1;
    else if (at < 0) next = event.key === 'ArrowDown' ? 0 : all.length - 1;
    else next = (at + (event.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length;
    event.preventDefault();
    all[next]?.focus();
  }

  /** Escape and Tab for the top sheet. Listens in the capture phase, so a dialog under the sheet does not take them. */
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isTop() || this.closing()) return;
    if (isInsideToaster(event.target)) return;
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      if (this.sheet.dismissible()) this.close();
      else this.refuse();
      return;
    }
    if (event.key === 'Tab') {
      wrapTab(event, this.panel().nativeElement, this.checker);
      if (event.defaultPrevented) event.stopPropagation();
    }
  }

  /** Focus that lands outside the top sheet comes back in. */
  onDocumentFocusin(event: FocusEvent): void {
    if (!this.isTop() || this.closing()) return;
    const panel = this.panel().nativeElement;
    const target = event.target;
    if (target instanceof Node && panel.contains(target)) return;
    if (isInsideToaster(target)) return;
    (tabbables(panel, this.checker)[0] ?? panel).focus();
  }

  /** Cancel when an action is destructive, else the first action that can run. */
  focusInitial(): void {
    const panel = this.panel().nativeElement;
    const all = itemsOf(panel);
    const cancel = all.find((el) => el.getAttribute('data-part') === 'cancel') ?? null;
    const danger = all.some((el) => el.getAttribute('data-tone') === 'danger');
    const first = all.find((el) => el.getAttribute('data-part') === 'action' && el.getAttribute('aria-disabled') !== 'true');
    const target = (danger ? (cancel ?? first) : (first ?? cancel)) ?? tabbables(panel, this.checker)[0] ?? panel;
    target.focus({ preventScroll: true });
  }

  /** The elements whose exit animation the close waits for. */
  animated(): Element[] {
    return [this.panel().nativeElement, this.backdrop().nativeElement];
  }
}

// ------------------------------------------------------------------ dsActionSheetContent

/**
 * The content: an ng-template with the actions. While the sheet is open it
 * renders in a portal at the end of body, with the title and the
 * description above the actions.
 */
@Directive({ selector: 'ng-template[dsActionSheetContent]', exportAs: 'dsActionSheetContent' })
export class DsActionSheetContent {
  /** A short title that names the object (Spring launch). Optional: the trigger often names it already. */
  readonly title = input<string | undefined>(undefined);
  /** One sentence about what the actions do, when a title is not enough. */
  readonly description = input<string | undefined>(undefined);
  /** The accessible name when there is no title: Actions for Spring launch. Read, not shown. A title wins. */
  readonly label = input<string | undefined>(undefined);

  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly sheet = injectSheet('dsActionSheetContent');
  private readonly theme = inject(DsThemeService);
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  private readonly doc = inject(DOCUMENT);

  private outlet: DomPortalOutlet | null = null;
  private layer: DsActionSheetLayer | null = null;
  private undo: (() => void)[] = [];
  private returnTo: { active: FocusReturn; trigger: FocusReturn } | null = null;
  private generation = 0;

  constructor() {
    effect(() => {
      const open = this.sheet.open();
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
    this.sheet.resolve();
    this.returnTo = {
      active: captureFocusReturn(this.doc.activeElement),
      trigger: captureFocusReturn(this.sheet.trigger),
    };
    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: SHEET_LAYER, useValue: { content: this, sheet: this.sheet, theme: this.theme.value } satisfies LayerData }],
    });
    this.outlet = new DomPortalOutlet(this.doc.body, this.appRef, injector);
    const ref = this.outlet.attach(new ComponentPortal(DsActionSheetLayer, null, injector));
    ref.changeDetectorRef.detectChanges();
    const layer = ref.instance;
    this.layer = layer;
    layer.push();

    const keydown = (e: KeyboardEvent) => layer.onDocumentKeydown(e);
    const focusin = (e: FocusEvent) => layer.onDocumentFocusin(e);
    this.doc.addEventListener('keydown', keydown, true);
    this.doc.addEventListener('focusin', focusin);
    this.undo = [
      () => this.doc.removeEventListener('keydown', keydown, true),
      () => this.doc.removeEventListener('focusin', focusin),
      lockScroll(this.doc),
      hideOthers(ref.location.nativeElement as Element),
    ];

    // Anchored: the card is placed next to its trigger as Radix Popper places it, and kept there.
    const wrapper = layer.wrapper()?.nativeElement;
    const trigger = this.sheet.trigger;
    if (wrapper && trigger) {
      const panel = layer.panel().nativeElement;
      const zIndex = getComputedStyle(panel).zIndex;
      const z = zIndex === 'auto' ? '' : zIndex;
      writePopper(wrapper, null, z);
      const { offset, align } = this.sheet.resolved();
      const place = () => {
        const rtl = this.theme.value().dir === 'rtl';
        let last = '';
        for (let i = 0; i < 3; i += 1) {
          const r = computePopper(trigger, wrapper, { side: 'bottom', align, sideOffset: offset, alignOffset: 0, padding: COLLISION_PADDING, rtl });
          writePopper(wrapper, r, z);
          layer.side.set(r.side);
          layer.align.set(r.align);
          const key = JSON.stringify(r);
          if (key === last) break;
          last = key;
        }
        ref.changeDetectorRef.detectChanges();
      };
      this.undo.push(autoPlace(trigger, wrapper, place));
    }
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
    const trigger = this.sheet.trigger;
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

/** Everything a template needs for an action sheet. */
export const DS_ACTION_SHEET = [DsActionSheet, DsActionSheetTrigger, DsActionSheetContent, DsActionSheetAction, DsActionSheetCancel] as const;
