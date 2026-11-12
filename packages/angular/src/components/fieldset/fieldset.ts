// Fieldset: a group of fields or choices under one legend. The twin of
// packages/react/src/components/Fieldset/Fieldset.tsx. The host is the
// native fieldset, so the legend is the group's name and native disabled
// disables every control inside.
//
//   <fieldset dsFieldset legend="Delivery address" description="Where we send the printed boards." [error]="error()">
//     <div dsField label="City"><div dsInput></div></div>
//   </fieldset>
//
// With `name`, inside a dsForm, the form's error for that name shows in the
// error part in place of `error`, as React's useFormFieldError(name), and
// the host renders data-name.
//
// DOM order: legend, description, error, body. The error is the system
// FieldError, given a Field context of its own through viewProviders, so it
// takes the group's error id and the error part name and never reaches the
// projected fields.
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input, type TemplateRef } from '@angular/core';
import type { Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsFieldContext, settleAfterFirstRender } from '../field/field-context';
import { DsFieldError } from '../field-error/field-error';
import { DsFormContext } from '../form/form-context';
import { DsErrorContext, hasContent } from './error-context';

export type FieldsetSize = Extract<Size, 'sm' | 'md' | 'lg'>;
/** A node prop in Angular: text, or a template. */
export type FieldsetText = string | TemplateRef<unknown>;

let nextId = 0;

@Component({
  selector: 'fieldset[dsFieldset]',
  exportAs: 'dsFieldset',
  imports: [NgTemplateOutlet, DsFieldError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: DsFieldContext, useFactory: () => inject(DsFieldset).errorContext }],
  host: {
    'data-ds': 'fieldset',
    '[attr.data-name]': 'name() ?? null',
    '[attr.data-size]': 'size()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
  },
  template: `
    <legend data-part="legend"><ng-container *ngTemplateOutlet="text; context: { $implicit: legend() }" /></legend>
    @if (showDescription()) {
      <p [attr.id]="descriptionId" data-part="description"><ng-container *ngTemplateOutlet="text; context: { $implicit: description() }" /></p>
    }
    @if (showError()) {
      <p dsFieldError [size]="size() === 'sm' ? 'sm' : 'md'"><ng-container *ngTemplateOutlet="text; context: { $implicit: shownError() }" /></p>
    }
    <div data-part="body"><ng-content /></div>
    <ng-template #text let-value>
      @if (isText(value)) {{{ value }}} @else {<ng-container [ngTemplateOutlet]="value" />}
    </ng-template>
  `,
})
export class DsFieldset {
  /** The name of the group, in a native legend. Required: a screen reader reads it with the first field. */
  readonly legend = input.required<FieldsetText>();
  /** A hint under the legend. Joins the group's aria-describedby. */
  readonly description = input<FieldsetText | null | undefined>(undefined);
  /** What is wrong with the group as a whole and how to fix it. A FieldError with data-part error. */
  readonly error = input<FieldsetText | null | undefined>(undefined);
  /**
   * The name the controls of a group share (a checkbox or radio group).
   * Inside a dsForm, the form's error for that name shows in the error part,
   * in place of `error`. Rendered as data-name.
   */
  readonly name = input<string | undefined>(undefined);
  /** Legend size and the space between the fields. Default md. */
  readonly size = input<FieldsetSize>('md');
  /** Native disabled: disables every control inside, buttons included. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the group invalid. Unset: invalid while an error shows. `false` hides the error. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  /** Joins the group's own description and error ids, after them. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly form = inject(DsFormContext, { optional: true });
  private readonly base = `ds-fieldset-${++nextId}-`;
  protected readonly descriptionId = `${this.base}description`;
  /** The form's error for `name` wins over `error`. */
  protected readonly shownError = computed<FieldsetText | null | undefined>(() => {
    const name = this.name();
    return (name === undefined ? undefined : this.form?.errors()[name]) ?? this.error();
  });
  protected readonly showError = computed(() => hasContent(this.shownError()) && this.invalid() !== false);
  protected readonly isInvalid = computed(() => this.invalid() ?? this.showError());
  protected readonly showDescription = computed(() => hasContent(this.description()));
  protected readonly describedBy = computed(
    () =>
      [this.showDescription() ? this.descriptionId : undefined, this.showError() ? `${this.base}error` : undefined, this.ariaDescribedby()]
        .filter(Boolean)
        .join(' ') || null,
  );

  /** The context the error part reads. */
  readonly errorContext = new DsErrorContext({
    controlId: `${this.base}group`,
    labelId: `${this.base}legend`,
    descriptionId: this.descriptionId,
    errorId: `${this.base}error`,
    invalid: this.isInvalid,
    invalidProp: computed(() => this.invalid()),
    disabled: computed(() => this.disabled()),
    required: computed(() => false),
    hasDescription: this.showDescription,
    hasError: this.showError,
  });

  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  constructor() {
    // An error that shows after the first render slides in (order 1.22).
    settleAfterFirstRender(this.errorContext);
    consumeHostAttributes(['dsFieldset', 'legend', 'description', 'error', 'name', 'size', 'disabled', 'invalid', 'aria-describedby']);
  }
}
