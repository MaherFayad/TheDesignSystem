// The Field wiring, in a file of its own so Label, FieldError and the
// controls can read it without importing Field, which renders them. The twin
// of packages/react/src/components/Field/context.ts.
//
// DsField provides itself as DsFieldContext. A control injects it with
// `inject(DsFieldContext, { optional: true })`.
import { afterNextRender, computed, type Signal } from '@angular/core';

export type FieldPart = 'description' | 'error';

export abstract class DsFieldContext {
  abstract readonly controlId: Signal<string>;
  abstract readonly labelId: string;
  abstract readonly descriptionId: string;
  abstract readonly errorId: string;
  abstract readonly invalid: Signal<boolean>;
  /** The invalid input as passed. `false` hides the error message of the one line API. */
  abstract readonly invalidProp: Signal<boolean | undefined>;
  abstract readonly disabled: Signal<boolean>;
  abstract readonly readOnly: Signal<boolean>;
  abstract readonly required: Signal<boolean>;
  abstract readonly hasDescription: Signal<boolean>;
  abstract readonly hasError: Signal<boolean>;
  /** A description or an error joins aria-describedby while it is registered. Returns the unregister function. */
  abstract register(part: FieldPart): () => void;
  /** A control with its own id tells the field, so the label points at it. */
  abstract setControlId(id: string | undefined): void;
  /**
   * True once the field's first render is done (order 1.22), the twin of
   * React's `settled` ref. A description or an error created after it
   * slides in; one that is there on the first render does not move. The
   * owner sets it with `settleAfterFirstRender`.
   */
  settled = false;
}

/** Marks a field context settled after the owner's first render. Call in an injection context. */
export function settleAfterFirstRender(context: DsFieldContext): void {
  afterNextRender(() => (context.settled = true));
}

export interface FieldControlOwn {
  id?: string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

export interface FieldControlState {
  id: string | undefined;
  describedBy: string | undefined;
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
}

/**
 * The twin of React's useFieldControl: the state a control writes on its
 * native element to join the nearest Field. A value the control passes
 * itself wins over the Field. Order of aria-describedby: description, error,
 * then the control's own.
 */
export function fieldControl(field: DsFieldContext | null, own: () => FieldControlOwn): Signal<FieldControlState> {
  return computed(() => {
    const o = own();
    const describedBy = [
      field?.hasDescription() ? field.descriptionId : undefined,
      field?.hasError() ? field.errorId : undefined,
      o.describedBy,
    ]
      .filter(Boolean)
      .join(' ');
    return {
      id: o.id ?? field?.controlId(),
      describedBy: describedBy || undefined,
      invalid: o.invalid ?? field?.invalid() ?? false,
      disabled: o.disabled ?? field?.disabled() ?? false,
      readOnly: o.readOnly ?? field?.readOnly() ?? false,
      required: o.required ?? field?.required() ?? false,
    };
  });
}
