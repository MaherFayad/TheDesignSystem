// FormField: a Field bound to a Form by name. The twin of FormField in
// packages/react/src/components/Form/Form.tsx, which renders a Field with
// the Form's error for that name, the Form's orientation and data-name.
//
//   <div dsFormField name="email" label="Work email" required>
//     <div dsInput name="email" type="email"></div>
//   </div>
//
// The host is the Field root itself (data-ds field), so it renders the
// Field's DOM: the same template and the same DsFieldContext as dsField.
// It is a component of its own, not dsField with a directive on top,
// because a directive cannot feed the error and the orientation into
// dsField's signal inputs.
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, forwardRef, inject, input, signal } from '@angular/core';
import { consumeHostAttributes } from '../../internal/host';
import { DsFieldDescription, type FieldOrientation, type FieldText } from '../field/field';
import { DsFieldContext, type FieldPart } from '../field/field-context';
import { DsFieldError } from '../field-error/field-error';
import { DsLabel } from '../label/label';
import { DsFormContext } from './form-context';

let nextId = 0;

@Component({
  selector: 'div[dsFormField]',
  exportAs: 'dsFormField',
  imports: [NgTemplateOutlet, DsFieldError, DsLabel, DsFieldDescription],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: DsFieldContext, useExisting: forwardRef(() => DsFormField) }],
  host: {
    'data-ds': 'field',
    '[attr.data-name]': 'name()',
    '[attr.data-orientation]': 'resolvedOrientation()',
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
        <ng-container *ngTemplateOutlet="textTemplate; context: { $implicit: shown() }" />
      </p>
    }
    <ng-template #textTemplate let-text>@if (isText(text)) {{{ text }}} @else {<ng-container [ngTemplateOutlet]="text" />}</ng-template>
  `,
})
export class DsFormField extends DsFieldContext {
  /** The name of the control inside. The Form shows the error of this name. Put the same name on the control. */
  readonly name = input.required<string>();
  /** An error of your own, shown when the Form has none for this name. */
  readonly error = input<FieldText | null | undefined>(undefined);
  /** Unset: invalid while an error shows. `false` hides the error. */
  readonly invalidInput = input<boolean | undefined, unknown>(undefined, {
    alias: 'invalid',
    transform: (v: unknown) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly disabledInput = input(false, { alias: 'disabled', transform: booleanAttribute });
  readonly readOnlyInput = input(false, { alias: 'readOnly', transform: booleanAttribute });
  readonly requiredInput = input(false, { alias: 'required', transform: booleanAttribute });
  /** Default the Form's orientation, then vertical. */
  readonly orientation = input<FieldOrientation | undefined>(undefined);
  readonly label = input<FieldText | null | undefined>(undefined);
  readonly description = input<FieldText | null | undefined>(undefined);

  private readonly form = inject(DsFormContext, { optional: true });
  private readonly base = `ds-form-field-${++nextId}-`;
  private readonly ownControlId = signal<string | undefined>(undefined);
  private readonly counts = signal({ description: 0, error: 0 });

  protected readonly resolvedOrientation = computed(() => this.orientation() ?? this.form?.orientation() ?? 'vertical');
  /** The Form's error for this name wins over the field's own. */
  protected readonly shown = computed<FieldText | null | undefined>(() => this.form?.errors()[this.name()] ?? this.error());
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

  protected readonly showError = computed(() => {
    const e = this.shown();
    return e !== undefined && e !== null && e !== '' && this.invalidInput() !== false;
  });

  constructor() {
    super();
    consumeHostAttributes([
      'dsFormField', 'name', 'invalid', 'disabled', 'readOnly', 'required', 'orientation', 'label', 'description', 'error',
    ]);
  }

  register(part: FieldPart): () => void {
    this.counts.update((c) => ({ ...c, [part]: c[part] + 1 }));
    return () => this.counts.update((c) => ({ ...c, [part]: c[part] - 1 }));
  }

  setControlId(id: string | undefined): void {
    this.ownControlId.set(id);
  }

  protected isText(text: unknown): text is string {
    return typeof text === 'string';
  }
}
