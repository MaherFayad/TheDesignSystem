// ConsentField: one consent, its purpose, a link to the details and, when
// given, a record line. The twin of
// packages/react/src/components/ConsentField/ConsentField.tsx.
//
//   <div dsConsentField name="marketing" purpose="Send me offers by email." detailsHref="/privacy"
//        version="2.1" [(checked)]="granted" (decision)="store($event)"></div>
//
// Never ticked in advance. There is no defaultChecked input, a static
// `checked` or `defaultChecked` attribute is dropped, and the state starts
// denied. `[(checked)]` is for showing a choice the person already made.
//
// The control is the Checkbox (a form that is sent) or the Switch (settings
// that save at once): the system dsCheckbox and dsSwitch. Their root carries
// data-part control, as React's rootProps. They read no Field: the error's
// own context below wraps only the error, as in React (dsNoFieldContext).
//
// Inside a dsForm, the form's error for `name` shows in the error part,
// with requiredError in place of the form's words when given. The error is
// the system FieldError with a Field context of its own (viewProviders), as
// in Fieldset.
//
// It implements ControlValueAccessor with a boolean value, so `formControl`,
// `formControlName` and `ngModel` bind the granted state.
//
// Names that differ from React: `onCheckedChange` is the `checkedChange`
// output of `[(checked)]`; `onDecision` is the `decision` output. `purpose`,
// `detailsLabel`, `meta` and `error` take a string or a TemplateRef.
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
  type TemplateRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsFieldContext } from '../field/field-context';
import { DsFieldError } from '../field-error/field-error';
import { DsErrorContext, hasContent } from '../fieldset/error-context';
import { DsFormContext } from '../form/form-context';
import { DsLink } from '../link/link';
import { DsCheckbox } from '../checkbox/checkbox';
import { DsSwitch } from '../switch/switch';

export type ConsentFieldSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type ConsentFieldState = 'granted' | 'denied';
export type ConsentFieldControl = 'checkbox' | 'switch';
/** A node prop in Angular: text, or a template. */
export type ConsentFieldText = string | TemplateRef<unknown>;

/** What the app stores when the person decides. */
export interface ConsentRecord {
  /** The form name of the consent, when given. */
  name: string | undefined;
  granted: boolean;
  /** The version of the purpose text the person saw, when given. */
  version: string | undefined;
  /** When the choice was made, as an ISO 8601 string. */
  at: string;
}

const detailsByLang = { en: 'How we use your data', ar: 'طريقة استخدام بياناتك' } as const;

let nextId = 0;

/**
 * Gives the control no Field context. ConsentField provides one for its
 * error part through viewProviders, which reaches its whole template; the
 * control gets its describedby from ConsentField itself, as in React.
 */
@Directive({
  selector: '[dsNoFieldContext]',
  providers: [{ provide: DsFieldContext, useValue: null }],
})
class DsNoFieldContext {
  constructor() {
    consumeHostAttributes(['dsNoFieldContext']);
  }
}

@Component({
  selector: 'div[dsConsentField]',
  exportAs: 'dsConsentField',
  imports: [NgTemplateOutlet, DsFieldError, DsLink, DsCheckbox, DsSwitch, DsNoFieldContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsConsentField), multi: true }],
  viewProviders: [{ provide: DsFieldContext, useFactory: () => inject(DsConsentField).errorContext }],
  host: {
    'data-ds': 'consent-field',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'granted() ? "granted" : "denied"',
    '[attr.data-required]': 'required() ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
  },
  template: `
    @if (control() === 'switch') {
      <div dsSwitch dsNoFieldContext data-part="control" [id]="controlId" [size]="size()" [name]="name()" [value]="value()" [checked]="granted()"
        [disabled]="isDisabled()" [required]="required()" [invalid]="isInvalid()" [aria-labelledby]="purposeId" [aria-describedby]="describedBy()"
        (checkedChange)="decide($event === true)"></div>
    } @else {
      <div dsCheckbox dsNoFieldContext data-part="control" [id]="controlId" [size]="size()" [name]="name()" [value]="value()" [checked]="granted()"
        [disabled]="isDisabled()" [required]="required()" [invalid]="isInvalid()" [aria-labelledby]="purposeId" [aria-describedby]="describedBy()"
        (checkedChange)="decide($event === true)"></div>
    }
    <div data-part="text">
      <label [attr.id]="purposeId" [attr.for]="controlId" data-part="purpose"><ng-container *ngTemplateOutlet="text; context: { $implicit: purpose() }" />@if (required()) {<span data-part="required" aria-hidden="true">{{ ' *' }}</span>}</label>
      @if (showMeta()) {
        <p [attr.id]="metaId" data-part="meta"><ng-container *ngTemplateOutlet="text; context: { $implicit: meta() }" /></p>
      }
      @if (detailsHref() !== undefined) {
        <a dsLink data-part="details" [href]="detailsHref()" [external]="detailsExternal()" [size]="size() === 'sm' ? 'xs' : 'sm'" standalone><ng-container *ngTemplateOutlet="text; context: { $implicit: detailsText() }" /></a>
      }
      @if (showError()) {
        <p dsFieldError [size]="size() === 'sm' ? 'sm' : 'md'"><ng-container *ngTemplateOutlet="text; context: { $implicit: shownError() }" /></p>
      }
    </div>
    <ng-template #text let-value>@if (isText(value)) {{{ value }}} @else {<ng-container [ngTemplateOutlet]="value" />}</ng-template>
  `,
})
export class DsConsentField implements ControlValueAccessor {
  /** What the person agrees to, in one sentence that names one purpose. It is the control's label. Required. */
  readonly purpose = input.required<ConsentFieldText>();
  /** The choice on record. Starts denied; there is no default checked. Write `[(checked)]` to show a choice already made. */
  readonly checked = model(false);
  /** checkbox in a form that is sent, switch in settings that save at once. Default checkbox. */
  readonly control = input<ConsentFieldControl>('checkbox');
  /** The form name. The value sent while granted is `value`. */
  readonly name = input<string | undefined>(undefined);
  /** The value sent while granted. Default "granted". */
  readonly value = input('granted');
  /** Where the details live. Renders the details link. */
  readonly detailsHref = input<string | undefined>(undefined);
  /** The text of the details link. Default "How we use your data", or Arabic under lang ar. */
  readonly detailsLabel = input<ConsentFieldText | undefined>(undefined);
  /** Opens the details in a new tab. Default false. */
  readonly detailsExternal = input(false, { transform: booleanAttribute });
  /** A record line under the purpose: the version of the text or the date of the choice. */
  readonly meta = input<ConsentFieldText | null | undefined>(undefined);
  /** The version of the purpose text, passed back in the record. */
  readonly version = input<string | undefined>(undefined);
  /** The service cannot work without this consent. Shows the required mark and sets aria-required. */
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Unset: invalid while an error shows. `false` hides the error. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  /** An error shown now, for a required consent left denied. */
  readonly error = input<ConsentFieldText | null | undefined>(undefined);
  /** Inside a dsForm: what the error says when the form finds this consent left off. Default the form's own message. */
  readonly requiredError = input<ConsentFieldText | undefined>(undefined);
  /** Control and text size. Default md. */
  readonly size = input<ConsentFieldSize>('md');
  /** Joins the meta and error ids on the control, after them. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });
  /** A record of each choice, for the app to store. React's onDecision. */
  readonly decision = output<ConsentRecord>();

  private readonly theme = inject(DsThemeService);
  private readonly form = inject(DsFormContext, { optional: true });
  private readonly base = `ds-consent-${++nextId}-`;
  protected readonly controlId = `${this.base}control`;
  protected readonly purposeId = `${this.base}purpose`;
  protected readonly metaId = `${this.base}meta`;
  private readonly errorId = `${this.base}error`;
  private readonly formDisabled = signal(false);

  /** Only a real true grants: a static `checked="true"` attribute arrives as a string and stays denied. */
  protected readonly granted = computed(() => this.checked() === true);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly shownError = computed(() => {
    const name = this.name();
    const fromForm = name === undefined ? undefined : this.form?.errors()[name];
    return fromForm !== undefined ? (this.requiredError() ?? fromForm) : this.error();
  });
  protected readonly showError = computed(() => hasContent(this.shownError()) && this.invalid() !== false);
  protected readonly isInvalid = computed(() => this.invalid() ?? this.showError());
  protected readonly showMeta = computed(() => hasContent(this.meta()));
  protected readonly describedBy = computed(
    () => [this.showMeta() ? this.metaId : undefined, this.showError() ? this.errorId : undefined, this.ariaDescribedby()].filter(Boolean).join(' ') || undefined,
  );
  protected readonly detailsText = computed(
    () => this.detailsLabel() ?? (this.theme.value().lang === 'ar' ? detailsByLang.ar : detailsByLang.en),
  );

  /** The context the error part reads. */
  readonly errorContext = new DsErrorContext({
    controlId: this.controlId,
    labelId: this.purposeId,
    descriptionId: this.metaId,
    errorId: this.errorId,
    invalid: this.isInvalid,
    invalidProp: computed(() => this.invalid()),
    disabled: this.isDisabled,
    required: computed(() => this.required()),
    hasDescription: this.showMeta,
    hasError: this.showError,
  });

  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  private onChange: (granted: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** True until the first value from a form arrives: a FormControl that starts true pre-ticks consent. */
  private firstWrite = true;

  constructor() {
    // A string requiredError is the form's message for this name, in the field and in the summary (as React).
    effect((onCleanup) => {
      const name = this.name();
      const message = this.requiredError();
      if (!this.form || name === undefined || typeof message !== 'string' || message === '') return;
      onCleanup(this.form.setRequiredMessage(name, message));
    });
    if (isDevMode()) {
      // The development warnings of the React ConsentField, once, after the first render.
      const strayDefault = this.hostEl.hasAttribute('defaultChecked') || this.hostEl.hasAttribute('defaultchecked');
      afterNextRender(() => {
        if (strayDefault) {
          console.warn('ConsentField: defaultChecked is ignored. A consent never starts given; pass checked only for a choice already on record.');
        }
        this.warnStartedGranted(this.checked() === true);
        if (this.detailsHref() === undefined && !this.isDisabled()) {
          const fieldset = this.hostEl.closest('fieldset');
          if (!fieldset?.querySelector(':scope > [data-part="description"] a[href]')) {
            console.warn('ConsentField: no detailsHref. Link the privacy notice from the consent, or from the description of the surrounding Fieldset.');
          }
        }
      });
      effect(() => {
        if (this.isDisabled() && this.granted()) {
          console.warn('ConsentField: a given consent is disabled, so it cannot be withdrawn. Keep a given consent enabled.');
        }
      });
    }
    consumeHostAttributes([
      'dsConsentField', 'purpose', 'checked', 'defaultChecked', 'control', 'name', 'value', 'detailsHref', 'detailsLabel',
      'detailsExternal', 'meta', 'version', 'required', 'disabled', 'invalid', 'error', 'requiredError', 'size', 'aria-describedby',
    ]);
  }

  protected decide(next: boolean): void {
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
    this.decision.emit({ name: this.name(), granted: next, version: this.version(), at: new Date().toISOString() });
  }

  writeValue(value: unknown): void {
    // PDPL: a consent is never pre ticked. A FormControl that starts true must come from a stored decision with a record line.
    if (this.firstWrite && isDevMode()) this.warnStartedGranted(value === true, 'FormControl');
    this.firstWrite = false;
    this.checked.set(value === true);
  }

  /** Warns when a consent starts given with no record of the choice: no meta, or a meta text with no date. */
  private warnStartedGranted(started: boolean, source = 'checked'): void {
    if (!started) return;
    const meta = this.meta();
    if (!hasContent(meta)) {
      console.warn(
        `ConsentField: ${source} starts true with no meta. Show the record of the choice in meta, such as the date and the text version, or start denied.`,
      );
    } else if (typeof meta === 'string' && !/\d/.test(meta)) {
      console.warn(
        `ConsentField: ${source} starts true and meta has no date. A given consent comes from a stored decision: show when it was given, or start denied.`,
      );
    }
  }

  registerOnChange(fn: (granted: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
