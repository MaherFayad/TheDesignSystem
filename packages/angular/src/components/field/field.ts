// Field: one label, one description and one error message wired to one
// control. The twin of packages/react/src/components/Field/Field.tsx, ported
// to the minimum the Dialog demo needs: the one line API (label,
// description, error inputs) and the wiring a dsInput reads through DI.
//
//   <div dsField label="Board name" [error]="error()"><div dsInput></div></div>
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';

export type FieldOrientation = 'vertical' | 'horizontal';

let nextId = 0;

@Component({
  selector: 'div[dsField]',
  exportAs: 'dsField',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'field',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
  },
  template: `
    @if (label() !== undefined) {
      <label [id]="labelId" [attr.for]="controlId" data-part="label">{{ label() }}@if (required()) {<span data-part="required" aria-hidden="true">*</span>}</label>
    }
    <ng-content />
    @if (hasDescription()) {
      <p [id]="descriptionId" data-part="description">{{ description() }}</p>
    }
    @if (hasError()) {
      <p [id]="errorId" data-part="error"><svg dsIcon name="danger" size="md"></svg><span>{{ error() }}</span></p>
    }
  `,
})
export class DsField {
  readonly invalid = input<boolean | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** Shows the required mark on the label and sets aria-required on the control. */
  readonly required = input(false, { transform: booleanAttribute });
  readonly orientation = input<FieldOrientation>('vertical');
  readonly label = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  /** The error message. Shown while set, unless invalid is false. */
  readonly error = input<string | null | undefined>(undefined);

  private readonly base = `ds-field-${++nextId}`;
  readonly controlId = `${this.base}-control`;
  readonly labelId = `${this.base}-label`;
  readonly descriptionId = `${this.base}-description`;
  readonly errorId = `${this.base}-error`;

  constructor() {
    consumeHostAttributes(['dsField', 'invalid', 'disabled', 'readOnly', 'required', 'orientation', 'label', 'description', 'error']);
  }

  readonly hasDescription = computed(() => this.description() !== undefined);
  readonly hasError = computed(() => {
    const e = this.error();
    return e !== undefined && e !== null && e !== '' && this.invalid() !== false;
  });
  readonly isInvalid = computed(() => this.invalid() ?? this.hasError());
  /** The control's aria-describedby: description, then error. */
  readonly describedBy = computed(
    () =>
      [this.hasDescription() ? this.descriptionId : undefined, this.hasError() ? this.errorId : undefined]
        .filter(Boolean)
        .join(' ') || undefined,
  );
}
