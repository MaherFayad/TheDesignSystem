// AlertDialog: a modal question about an action that cannot be undone. The
// twin of packages/react/src/components/AlertDialog/AlertDialog.tsx, on the
// same DOM, so the alert block of Dialog.css and the platform files apply as
// they are. No close part: Cancel is the way out, so the person always
// answers the question.
//
//   <ng-container dsAlertDialog tone="danger" [(open)]="open">
//     <button dsButton dsAlertDialogTrigger>Delete board</button>
//     <ng-template dsAlertDialogContent title="Delete the board Spring launch?" description="This cannot be undone.">
//       <div dsAlertDialogFooter>
//         <button dsButton dsAlertDialogCancel>Keep board</button>
//         <button dsButton dsAlertDialogAction tone="danger" emphasis="solid" (click)="remove()">Delete board</button>
//       </div>
//     </ng-template>
//   </ng-container>
//
// The DOM, as React:
//
//   <body>
//     <div data-ds="theme" data-dialog-layer ...axes>
//       <div data-ds="alert-dialog" data-size data-tone data-state data-segment?>
//         <div data-part="backdrop">
//         <div data-part="panel" role="alertdialog">
//           <div data-part="titlebar" data-ds="title-bar">   optional part
//           <span data-part="icon"><svg data-ds="icon"></span>
//           <h2 data-part="title">
//           <p data-part="description">
//           <fieldset data-ds="fieldset" data-part="body" data-variant="inset">   order M9.6, optional
//             <legend data-part="legend"><span data-visually-hidden>
//             <div data-part="body">...fields</div>
//           <div data-part="footer">
//             <button data-ds="button" data-part="cancel" data-dialog-cancel>
//             <button data-ds="button" data-part="action" data-primary?>
//
// Focus opens on Cancel in every tone (the focus rule read as danger), so
// Enter never runs the action by accident; with a body of fields, on the
// first field. A press on the backdrop never closes it: the panel nudges
// (interaction dialog-refuse). Rendering and the modal rules are the
// Dialog's (internal/modal-portal.ts).
//
// The default action (order M9.6): dsAlertDialogAction with `primary`
// carries data-primary and is a solid Button, tone accent, or danger in a
// danger alert, unless the Button sets its own (DS_BUTTON_PRESET, the
// Angular form of React's cloneElement; a tone counts as the Button's own
// when it is written on the element or is not neutral). Return in a body
// field runs it. With `requiresValue` it is aria-disabled while the first
// field of the body is empty.
//
// Names that differ from React, by frameworks.md: `onOpenChange` is the
// `openChange` output of `[(open)]`; the title and the description are
// inputs of dsAlertDialogContent; AlertDialogBody is
// `fieldset[dsAlertDialogBody]`.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  InjectionToken,
  TemplateRef,
  afterEveryRender,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  isDevMode,
  model,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import type { IconName } from '@the-system/icons';
import { DsIcon } from '@the-system/icons/angular';
import { DIALOG_ACTION_SELECTOR, DIALOG_FIELD_SELECTOR, dialogInitialFocus, overlaySegment, type OverlaySize, type Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { injectFold } from '../../internal/fold';
import { connectModalPortal, playRefusal } from '../../internal/modal-portal';
import { followTriggerTitle, injectTriggerRow } from '../../internal/trigger-row';
import { isTopModalLayer, tabbables, wrapTab } from '../../behavior';
import { DsLayerTheme, DsThemeService, layerThemeProviders, syncDirectionality } from '../../theme';
import type { ThemeValue } from '../../theme';
import { DS_BUTTON_PRESET, type ButtonPreset, type ButtonTone } from '../button/button-base';
import { DsTitleBar } from '../title-bar/title-bar';
import { DsWindowControls } from '../window-controls/window-controls';
import { isInsideToaster } from '../toast/is-inside-toaster';

export type AlertDialogSize = Extract<OverlaySize, 'sm' | 'md'>;
export type AlertDialogTone = Extract<Tone, 'neutral' | 'danger'>;
/** The icon above the title: a system icon name, a template, or false for none. */
export type AlertDialogIcon = IconName | TemplateRef<unknown> | false;

/** The built in words, the same strings as React. Arabic: Gulf MSA noun forms. */
export const alertDialogLabels = {
  en: { controls: 'Alert controls', close: 'Cancel', minimize: 'Minimize alert', zoom: 'Zoom alert' },
  ar: { controls: 'أزرار التنبيه', close: 'إلغاء', minimize: 'تصغير التنبيه', zoom: 'تكبير التنبيه' },
} as const;

/** The default icon per tone. */
const toneIcon: Record<AlertDialogTone, IconName> = { neutral: 'info', danger: 'warning' };

let nextId = 0;

// ------------------------------------------------------------------ dsAlertDialog

/** The root: state and the variant axes. Renders no element of its own: put it on an ng-container. */
@Directive({ selector: '[dsAlertDialog]', exportAs: 'dsAlertDialog' })
export class DsAlertDialog {
  /** The open state. Two way: `[(open)]`. Emits false for Escape, Cancel and the action. */
  readonly open = model(false);
  /** Opens on first render when true. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** The width, from the dialog.width tokens: sm 360, md 440 px. Default md. */
  readonly size = input<AlertDialogSize>('md');
  /** danger: the action destroys something. The title and the icon take the danger color. Default neutral. */
  readonly tone = input<AlertDialogTone>('neutral');
  /** false: Escape does nothing. Use it while the action runs, with the action Button loading. Default true. */
  readonly dismissible = input(true, { transform: booleanAttribute });

  private readonly base = `ds-alert-dialog-${++nextId}`;
  readonly panelId = `${this.base}-panel`;
  readonly titleId = `${this.base}-title`;
  readonly descriptionId = `${this.base}-description`;
  /** Whether the first field of the body holds a value; null with no field in the body. */
  readonly filled = signal<boolean | null>(null);
  /** The trigger, where focus returns on close. */
  trigger: HTMLElement | null = null;

  constructor() {
    consumeHostAttributes(['dsAlertDialog', 'open', 'defaultOpen', 'size', 'tone', 'dismissible']);
    afterNextRender(() => {
      if (this.defaultOpen() && !this.open()) this.open.set(true);
    });
  }

  setOpen(open: boolean): void {
    this.open.set(open);
  }
}

function injectAlertDialog(name: string): DsAlertDialog {
  const alert = inject(DsAlertDialog, { optional: true });
  if (!alert) throw new Error(`${name} must be used inside a dsAlertDialog.`);
  return alert;
}

// ------------------------------------------------------------------ trigger, cancel, action, footer

/**
 * Opens the alert dialog. Put it on a dsButton, or on a List row
 * (`li[dsListItem]`), whose title then carries the trigger. Focus returns to
 * it on close.
 */
@Directive({
  selector: '[dsAlertDialogTrigger]',
  host: {
    '[attr.aria-haspopup]': 'row ? null : "dialog"',
    '[attr.aria-expanded]': 'row ? null : alert.open() ? "true" : "false"',
    '[attr.aria-controls]': '!row && alert.open() ? alert.panelId : null',
    '[attr.data-state]': 'row ? null : alert.open() ? "open" : "closed"',
    '(click)': 'row || alert.setOpen(true)',
  },
})
export class DsAlertDialogTrigger {
  protected readonly alert = injectAlertDialog('dsAlertDialogTrigger');
  protected readonly row = injectTriggerRow();

  constructor() {
    const el = consumeHostAttributes(['dsAlertDialogTrigger']);
    const alert = this.alert;
    alert.trigger = el;
    let current: HTMLElement = el;
    inject(DestroyRef).onDestroy(() => {
      if (alert.trigger === current) alert.trigger = null;
    });
    const row = this.row;
    if (row) {
      row.connect(
        () => ({ id: null, haspopup: 'dialog', expanded: alert.open(), controls: alert.open() ? alert.panelId : null, state: alert.open() ? 'open' : 'closed' }),
        { click: () => alert.setOpen(true) },
      );
      followTriggerTitle(row, (title) => (alert.trigger = current = title));
    }
  }
}

/** The safe answer (Keep board). Closes the alert dialog and takes focus when it opens. */
@Directive({
  selector: '[dsAlertDialogCancel]',
  host: { 'data-part': 'cancel', 'data-dialog-cancel': '', '(click)': 'alert.setOpen(false)' },
})
export class DsAlertDialogCancel {
  protected readonly alert = injectAlertDialog('dsAlertDialogCancel');
  constructor() {
    consumeHostAttributes(['dsAlertDialogCancel']);
  }
}

/**
 * The action that cannot be undone, or with primary, the default answer.
 * Put it on a dsButton that names the consequence (Delete board). It closes
 * the alert dialog after a press; call event.preventDefault() in its
 * (click) handler to keep it open while the action runs, then close it from
 * code.
 */
@Directive({
  selector: '[dsAlertDialogAction]',
  providers: [{ provide: DS_BUTTON_PRESET, useFactory: () => inject(forwardRef(() => DsAlertDialogAction)).preset }],
  host: { 'data-part': 'action', '[attr.data-primary]': 'primary() ? "" : null', '(click)': 'onClick($event)' },
})
export class DsAlertDialogAction {
  /** The default action: data-primary, solid, tone accent (danger in a danger alert) unless the Button sets its own; Return in a body field runs it. Default false. */
  readonly primary = input(false, { transform: booleanAttribute });
  /** aria-disabled while the first field of the body is empty, so neither a press nor Return runs it. No effect without a body. Default false. */
  readonly requiresValue = input(false, { transform: booleanAttribute });

  protected readonly alert = injectAlertDialog('dsAlertDialogAction');
  private readonly ownTone = inject(new HostAttributeToken('tone'), { optional: true });

  readonly preset: ButtonPreset = {
    emphasis: (own) => own ?? (this.primary() ? 'solid' : undefined),
    tone: (own) => {
      if (!this.primary() || this.ownTone !== null || own !== 'neutral') return own;
      return (this.alert.tone() === 'danger' ? 'danger' : 'accent') satisfies ButtonTone;
    },
    disabled: () => this.requiresValue() && this.alert.filled() === false,
  };

  constructor() {
    consumeHostAttributes(['dsAlertDialogAction', 'primary', 'requiresValue']);
  }

  /** After every handler of the press has run: closes unless one called preventDefault. */
  protected onClick(event: MouseEvent): void {
    queueMicrotask(() => {
      if (!event.defaultPrevented) this.alert.setOpen(false);
    });
  }
}

/** Cancel first, the action last, at the inline end. */
@Directive({ selector: '[dsAlertDialogFooter]', host: { 'data-part': 'footer' } })
export class DsAlertDialogFooter {
  constructor() {
    consumeHostAttributes(['dsAlertDialogFooter']);
  }
}

// ------------------------------------------------------------------ dsAlertDialogBody

/** A text field: an input that takes text (not a button or a check). */
function isTextField(el: EventTarget | null): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  return !['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'range', 'color', 'hidden'].includes(el.type);
}

/**
 * The body of an alert with fields (order M9.6): an inset Fieldset whose
 * root is the alert's body part. Its legend names the group for a screen
 * reader and is visually hidden: the title above is the visible heading.
 * Focus opens on its first field. Return in a field runs the primary
 * action, unless it is aria-disabled.
 *
 *   <fieldset dsAlertDialogBody legend="Folder details">
 *     <div dsField label="Name"><div dsInput variant="plain"></div></div>
 *   </fieldset>
 */
@Component({
  selector: 'fieldset[dsAlertDialogBody]',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'fieldset',
    'data-part': 'body',
    'data-size': 'md',
    'data-variant': 'inset',
    '(input)': 'read()',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    <legend data-part="legend"><span data-visually-hidden="">
      @if (isText(legend())) {{{ legend() }}} @else {<ng-container [ngTemplateOutlet]="$any(legend())" />}
    </span></legend>
    <div data-part="body"><ng-content /></div>
  `,
})
export class DsAlertDialogBody {
  /** The name of the group of fields (Folder details), read with the first field. Required. Visually hidden. */
  readonly legend = input.required<string | TemplateRef<unknown>>();

  private readonly alert = injectAlertDialog('dsAlertDialogBody');
  private readonly host = consumeHostAttributes(['dsAlertDialogBody', 'legend']);
  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  constructor() {
    // A bound value, a reset or the clear button can change it with no input event: read it after every render.
    afterEveryRender(() => this.read());
    inject(DestroyRef).onDestroy(() => this.alert.filled.set(null));
  }

  protected read(): void {
    const field = this.host.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(DIALOG_FIELD_SELECTOR);
    const next = field ? field.value.trim() !== '' : null;
    if (this.alert.filled() !== next) this.alert.filled.set(next);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.defaultPrevented) return;
    // The key that ends an IME composition is not a command; a modifier asks for something else.
    if (event.isComposing || event.keyCode === 229) return;
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    if (!isTextField(event.target)) return;
    const panel = this.host.closest('[data-part="panel"]');
    const primary = panel?.querySelector<HTMLElement>('[data-part="action"][data-primary]');
    if (!primary) return;
    event.preventDefault();
    if (primary.getAttribute('aria-disabled') === 'true') return;
    primary.click();
  }
}

// ------------------------------------------------------------------ the layer

interface LayerData {
  content: DsAlertDialogContent;
  alert: DsAlertDialog;
  theme: Signal<ThemeValue>;
}

const ALERT_LAYER = new InjectionToken<LayerData>('DS_ALERT_DIALOG_LAYER');

/** The portal: the themed wrapper (its own host), the root, the backdrop and the panel. Internal: dsAlertDialogContent creates it. */
@Component({
  selector: 'div[data-dialog-layer]',
  imports: [NgTemplateOutlet, DsIcon, DsTitleBar, DsWindowControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: layerThemeProviders(() => inject(ALERT_LAYER).theme),
  hostDirectives: [DsLayerTheme],
  template: `
    <div data-ds="alert-dialog" [attr.data-size]="alert.size()" [attr.data-tone]="alert.tone()" [attr.data-state]="state()"
      [attr.data-segment]="segment()" (pointerdown)="onRootPointerDown($event)" (mousedown)="onRootMouseDown($event)">
      <div #backdrop data-part="backdrop" [attr.data-state]="state()" aria-hidden="true"></div>
      <div #panel role="alertdialog" [id]="alert.panelId" [attr.data-state]="state()" data-part="panel" tabindex="-1" aria-modal="true"
        [attr.aria-labelledby]="content.title() !== undefined ? alert.titleId : null"
        [attr.aria-describedby]="content.description() !== undefined ? alert.descriptionId : null">
        @if (titlebarOn()) {
          <div dsTitleBar data-part="titlebar" [as]="content.title() !== undefined ? 'h2' : 'div'"
            [title]="content.title() !== undefined ? barTitle : undefined"
            [controls]="controlsOn() ? lights : undefined"></div>
        }
        @if (icon(); as value) {
          <span data-part="icon" aria-hidden="true">
            @if (isTemplate(value)) {
              <ng-container [ngTemplateOutlet]="value" />
            } @else {
              <svg dsIcon [name]="value" size="lg"></svg>
            }
          </span>
        }
        @if (!titlebarOn() && content.title() !== undefined) {
          <h2 [id]="alert.titleId" data-part="title">{{ content.title() }}</h2>
        }
        @if (content.description() !== undefined) {
          <p [id]="alert.descriptionId" data-part="description">{{ content.description() }}</p>
        }
        <ng-container [ngTemplateOutlet]="content.template" />
      </div>
    </div>
    <ng-template #barTitle><span data-dialog-title [id]="alert.titleId">{{ content.title() }}</span></ng-template>
    <ng-template #lights>
      <div dsWindowControls [label]="words().controls" [closeLabel]="words().close" [minimizeLabel]="words().minimize"
        [zoomLabel]="words().zoom" [onClose]="alert.dismissible() ? closeFn : undefined"></div>
    </ng-template>
  `,
})
export class DsAlertDialogLayer {
  private readonly data = inject(ALERT_LAYER);
  protected readonly content = this.data.content;
  protected readonly alert = this.data.alert;
  private readonly theme = inject(DsThemeService);
  private readonly checker = inject(InteractivityChecker);
  private readonly motion = injectMotion();

  readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  readonly backdrop = viewChild.required<ElementRef<HTMLElement>>('backdrop');

  readonly closing = signal(false);
  readonly state = computed(() => (this.alert.open() && !this.closing() ? 'open' : 'closed'));
  private readonly fold = injectFold();
  /** Order DU5: the segment of the alert on a folded screen, absent without a fold. */
  protected readonly segment = computed(() => overlaySegment(this.fold()));
  protected readonly words = computed(() => {
    const lang = this.theme.value().lang;
    return lang === 'ar' || lang.startsWith('ar-') ? alertDialogLabels.ar : alertDialogLabels.en;
  });
  protected readonly titlebarOn = this.theme.optionalPart('alert-dialog', 'titlebar');
  protected readonly controlsOn = this.theme.optionalPart('alert-dialog', 'controls');
  protected readonly icon = computed(() => {
    const value = this.content.icon();
    return value === undefined ? toneIcon[this.alert.tone()] : value;
  });
  protected readonly closeFn = () => this.close();
  protected readonly isTemplate = (v: unknown): v is TemplateRef<unknown> => v instanceof TemplateRef;
  private refusal: Animation | null = null;

  constructor() {
    syncDirectionality(inject(Directionality), this.theme.value);
  }

  close(): void {
    this.alert.setOpen(false);
  }

  isTop(): boolean {
    return isTopModalLayer(this);
  }

  refuse(): void {
    this.refusal = playRefusal(this.panel().nativeElement, this.motion, this.theme.value().dir, this.refusal);
  }

  /** A press on the backdrop never closes an alert: the panel nudges, and focus stays where it was. */
  protected onRootPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.state() !== 'open') return;
    if ((event.target as Element | null)?.getAttribute?.('data-part') !== 'backdrop') return;
    event.preventDefault();
    this.refuse();
  }

  /** A touch press still sends a compatibility mousedown, whose default moves focus. */
  protected onRootMouseDown(event: MouseEvent): void {
    if (this.state() !== 'open') return;
    if ((event.target as Element | null)?.getAttribute?.('data-part') === 'backdrop') event.preventDefault();
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isTop() || this.closing()) return;
    if (isInsideToaster(event.target)) return;
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (this.alert.dismissible()) this.close();
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

  /** The focus rule read as danger: the first field of a body, else Cancel, else the first action, else the panel. */
  focusInitial(): void {
    const panel = this.panel().nativeElement;
    if (isDevMode() && panel.querySelector('[data-part="title"]:not(:empty), [data-dialog-title]:not(:empty)') === null) {
      console.warn('AlertDialog: opened with no title. Use the title input of dsAlertDialogContent.');
    }
    const target = dialogInitialFocus(panel, 'danger') ?? panel.querySelector<HTMLElement>(DIALOG_ACTION_SELECTOR) ?? panel;
    target.focus();
  }

  animated(): Element[] {
    return [this.panel().nativeElement, this.backdrop().nativeElement];
  }
}

// ------------------------------------------------------------------ dsAlertDialogContent

/**
 * The alert content: an ng-template with the body and the footer. While the
 * alert is open it renders in a portal at the end of body, with the icon,
 * the title and the description (or the Desk title bar) above it.
 */
@Directive({ selector: 'ng-template[dsAlertDialogContent]', exportAs: 'dsAlertDialogContent' })
export class DsAlertDialogContent {
  /** The question, naming the action and its object: Delete the board Spring launch? It names the alert. */
  readonly title = input<string | undefined>(undefined);
  /** What cannot be undone, in one or two sentences. It describes the alert. */
  readonly description = input<string | undefined>(undefined);
  /** The icon above the title. Default info, warning for tone danger. false shows none. Hidden from assistive tech. */
  readonly icon = input<AlertDialogIcon | undefined>(undefined);

  readonly template = inject<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    const alert = injectAlertDialog('dsAlertDialogContent');
    const theme = inject(DsThemeService);
    connectModalPortal({
      open: alert.open,
      component: DsAlertDialogLayer,
      token: ALERT_LAYER,
      data: () => ({ content: this, alert, theme: theme.value }) satisfies LayerData,
      trigger: () => alert.trigger,
    });
  }
}

/** Everything a template needs for an alert dialog. */
export const DS_ALERT_DIALOG = [
  DsAlertDialog,
  DsAlertDialogTrigger,
  DsAlertDialogContent,
  DsAlertDialogBody,
  DsAlertDialogFooter,
  DsAlertDialogCancel,
  DsAlertDialogAction,
] as const;
