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
// no extra input. Order in the DOM: label, control, description, error. The
// description and the error join the control's aria-describedby only while
// they exist.
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  booleanAttribute,
  forwardRef,
  computed,
  inject,
  input,
  signal,
  type TemplateRef,
} from '@angular/core';
import { consumeHostAttributes } from '../../internal/host';
import { DsFieldError } from '../field-error/field-error';
import { DsLabel } from '../label/label';
import { DsFieldContext, type FieldPart } from './field-context';

export type FieldOrientation = 'vertical' | 'horizontal';
/** Text of the one line API: a string, or a template for richer content (a bidi span in Arabic). */
export type FieldText = string | TemplateRef<unknown>;

let nextId = 0;

/** A hint that helps fill the control. Joins aria-describedby. */
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
    '[attr.data-invalid]': 'invalid() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
  },
  template: `
    @if (label() !== undefined && label() !== null) {
      <label dsFieldLabel>
        <ng-container *ngTemplateOutlet="textTemplate; context: { $implicit: label() }" />
      </label>
    }
    <ng-content />
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
    consumeHostAttributes(['dsField', 'invalid', 'disabled', 'readOnly', 'required', 'orientation', 'label', 'description', 'error']);
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

