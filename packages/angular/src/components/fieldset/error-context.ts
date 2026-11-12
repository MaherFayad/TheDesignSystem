// A Field context that serves one FieldError alone, the twin of the
// FieldContext value React's Fieldset and ConsentField wrap around their
// error. The error takes the group's error id and the error part name. It is
// provided with viewProviders, so it reaches the component's own template
// (the error) and never the projected fields in the body.
import { computed, signal, type Signal } from '@angular/core';
import { DsFieldContext } from '../field/field-context';

export interface ErrorContextSource {
  errorId: string;
  descriptionId: string;
  labelId: string;
  controlId: string;
  invalid: Signal<boolean>;
  invalidProp: Signal<boolean | undefined>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  hasDescription: Signal<boolean>;
  hasError: Signal<boolean>;
}

/** A DsFieldContext whose register is a no op: the owner already knows when its error shows. */
export class DsErrorContext extends DsFieldContext {
  readonly controlId: Signal<string>;
  readonly labelId: string;
  readonly descriptionId: string;
  readonly errorId: string;
  readonly invalid: Signal<boolean>;
  readonly invalidProp: Signal<boolean | undefined>;
  readonly disabled: Signal<boolean>;
  readonly readOnly = signal(false).asReadonly();
  readonly required: Signal<boolean>;
  readonly hasDescription: Signal<boolean>;
  readonly hasError: Signal<boolean>;

  constructor(source: ErrorContextSource) {
    super();
    this.controlId = computed(() => source.controlId);
    this.labelId = source.labelId;
    this.descriptionId = source.descriptionId;
    this.errorId = source.errorId;
    this.invalid = source.invalid;
    this.invalidProp = source.invalidProp;
    this.disabled = source.disabled;
    this.required = source.required;
    this.hasDescription = source.hasDescription;
    this.hasError = source.hasError;
  }

  register(): () => void {
    return () => undefined;
  }

  setControlId(): void {
    // The owner sets the ids.
  }
}

/** True for text with content, or a template. */
export function hasContent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== false && value !== '';
}
