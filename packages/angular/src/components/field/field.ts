// Field: one label, one description and one error message wired to one
// control. The twin of packages/react/src/components/Field/Field.tsx.
//
//   <div dsField label="Board name" description="Shown on the board card." [error]="error()">
//     <div dsInput></div>
//   </div>
//
//   <div dsField required>
//     <label dsFieldLabel>Email</label>
//     <div dsInput type="email"></div>
//     <p dsFieldDescription>Sign in links go here.</p>
//   </div>
//
// The field provides itself as DsFieldContext. A control (dsInput,
// dsTextarea and the rest) reads its ids and state through DI, so it needs
// no extra input. Order in the DOM: label, control, description, error (a
// floating field puts the label after the control, order 1.23). The
// description and the error join the control's aria-describedby only while
// they exist.
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  afterEveryRender,
  afterNextRender,
  booleanAttribute,
  forwardRef,
  computed,
  inject,
  input,
  signal,
  type TemplateRef,
} from '@angular/core';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { playBeat, slideIn } from '@the-system/motion';
import { DsFieldError } from '../field-error/field-error';
import { DsLabel } from '../label/label';
import { DsFieldContext, settleAfterFirstRender, type FieldPart } from './field-context';

export type FieldOrientation = 'vertical' | 'horizontal';
/** Text of the one line API: a string, or a template for richer content (a bidi span in Arabic). */
export type FieldText = string | TemplateRef<unknown>;

let nextId = 0;

/** The interaction id of the description entrance in the registry. */
export const FIELD_MESSAGE_ENTER = 'field-message-enter';

/**
 * A hint that helps fill the control. Joins aria-describedby. One created
 * after the field's first render slides in from distance.shift above and
 * fades in on the soft spring (interaction field-message-enter).
 */
@Directive({
  selector: 'p[dsFieldDescription]',
  exportAs: 'dsFieldDescription',
  host: {
    'data-part': 'description',
    '[attr.id]': 'hostId()',
  },
})
export class DsFieldDescription {
  readonly id = input<string | undefined>(undefined);
  private readonly field = inject(DsFieldContext, { optional: true });
  protected readonly hostId = computed(() => this.id() ?? this.field?.descriptionId ?? null);

  constructor() {
    consumeHostAttributes(['dsFieldDescription', 'id']);
    const unregister = this.field?.register('description');
    if (unregister) inject(DestroyRef).onDestroy(unregister);
    if (this.field?.settled) {
      const motion = injectMotion();
      const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      afterNextRender(() => playBeat(el, slideIn(), FIELD_MESSAGE_ENTER, motion.mode(FIELD_MESSAGE_ENTER)));
    }
  }
}

@Component({
  selector: 'div[dsField]',
  exportAs: 'dsField',
  imports: [NgTemplateOutlet, DsFieldError, DsLabel, DsFieldDescription],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: DsFieldContext, useExisting: forwardRef(() => DsField) }],
  host: {
    'data-ds': 'field',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-floating]': 'floating() ? "" : null',
    '[attr.data-filled]': 'floating() && filled() ? "" : null',
    '[attr.data-invalid]': 'invalid() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '(input)': 'onInput($event)',
  },
  template: `
    @if (!floating() && label() !== undefined && label() !== null) {
      <label dsFieldLabel>
        <ng-container *ngTemplateOutlet="textTemplate; context: { $implicit: label() }" />
      </label>
    }
    <ng-content />
    @if (floating() && label() !== undefined && label() !== null) {
      <label dsFieldLabel>
        <ng-container *ngTemplateOutlet="textTemplate; context: { $implicit: label() }" />
      </label>
    }
    @if (description() !== undefined && description() !== null) {
      <p dsFieldDescription>
        <ng-container *ngTemplateOutlet="textTemplate; context: { $implicit: description() }" />
      </p>
    }
    @if (showError()) {
      <p dsFieldError>
        <ng-container *ngTemplateOutlet="textTemplate; context: { $implicit: error() }" />
      </p>
    }
    <!-- On one line: a text node with no space around it, as React renders the string. -->
    <ng-template #textTemplate let-text>@if (isText(text)) {{{ text }}} @else {<ng-container [ngTemplateOutlet]="text" />}</ng-template>
  `,
})
export class DsField extends DsFieldContext {
  /**
   * Marks the control invalid. When it is not set, the field is invalid while
   * it shows an error message. `false` hides the error message.
   */
  readonly invalidInput = input<boolean | undefined, unknown>(undefined, {
    alias: 'invalid',
    transform: (v: unknown) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly disabledInput = input(false, { alias: 'disabled', transform: booleanAttribute });
  readonly readOnlyInput = input(false, { alias: 'readOnly', transform: booleanAttribute });
  /** Shows the required mark on the label and sets aria-required on the control. */
  readonly requiredInput = input(false, { alias: 'required', transform: booleanAttribute });
  /** vertical: label above the control. horizontal: label at the start, control at the end. Default vertical. */
  readonly orientation = input<FieldOrientation>('vertical');
  /** One line API: renders a field label with this text before the content. */
  readonly label = input<FieldText | null | undefined>(undefined);
  /** One line API: renders a field description with this text after the content. */
  readonly description = input<FieldText | null | undefined>(undefined);
  /** One line API: renders a field error with this text after the content. Empty text renders nothing. */
  readonly error = input<FieldText | null | undefined>(undefined);
  /**
   * A floating label (order 1.23): the `label` rests inside the control's box
   * while the control is empty and has no focus, and rises to its place
   * above the box on focus or once there is a value. The label renders after
   * the control in the DOM (its paint order) and the CSS draws it first; the
   * root carries `data-floating`, and `data-filled` while the control has a
   * value. Use it with the `label` input and one single line control.
   */
  readonly floating = input(false, { transform: booleanAttribute });

  /** True while the control of a floating field has a value. */
  protected readonly filled = signal(false);

  private readonly base = `ds-field-${++nextId}-`;
  private readonly ownControlId = signal<string | undefined>(undefined);
  private readonly counts = signal({ description: 0, error: 0 });

  readonly controlId = computed(() => this.ownControlId() ?? `${this.base}control`);
  readonly labelId = `${this.base}label`;
  readonly descriptionId = `${this.base}description`;
  readonly errorId = `${this.base}error`;
  readonly hasDescription = computed(() => this.counts().description > 0);
  readonly hasError = computed(() => this.counts().error > 0);
  readonly invalidProp = computed(() => this.invalidInput());
  readonly invalid = computed(() => this.invalidInput() ?? this.hasError());
  readonly disabled = computed(() => this.disabledInput());
  readonly readOnly = computed(() => this.readOnlyInput());
  readonly required = computed(() => this.requiredInput());

  /** The error of the one line API renders while it has text and invalid is not false. */
  protected readonly showError = computed(() => {
    const e = this.error();
    return e !== undefined && e !== null && e !== '' && this.invalidInput() !== false;
  });

  constructor() {
    super();
    settleAfterFirstRender(this);
    consumeHostAttributes(['dsField', 'invalid', 'disabled', 'readOnly', 'required', 'orientation', 'label', 'description', 'error', 'floating']);
    // A floating label rests in the box only while the control is empty. A value written by code
    // (a model, a form control) changes without an input event, so read it after every render too.
    const root = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterEveryRender({
      read: () => {
        if (!this.floating()) return;
        const control = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
        this.filled.set(Boolean(control?.value));
      },
    });
  }

  protected onInput(event: Event): void {
    if (this.floating()) this.filled.set(Boolean((event.target as HTMLInputElement | null)?.value));
  }

  register(part: FieldPart): () => void {
    this.counts.update((c) => ({ ...c, [part]: c[part] + 1 }));
    return () => this.counts.update((c) => ({ ...c, [part]: c[part] - 1 }));
  }

  setControlId(id: string | undefined): void {
    this.ownControlId.set(id);
  }

  /** The control's aria-describedby: description, then error. */
  readonly describedBy = computed(
    () => [this.hasDescription() ? this.descriptionId : undefined, this.hasError() ? this.errorId : undefined].filter(Boolean).join(' ') || undefined,
  );

  protected isText(text: unknown): text is string {
    return typeof text === 'string';
  }
}

