// The Form wiring, in a file of its own so FormField, FormSubmit and
// ConsentField can read it without importing Form. The twin of FormContext
// in packages/react/src/components/Form/Form.tsx.
import type { Signal } from '@angular/core';
import type { FormErrors, Size } from '@the-system/shared';

export type FormSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type FormState = 'idle' | 'submitting' | 'submitted';
export type FormOrientation = 'vertical' | 'horizontal';

/** What dsForm provides through DI. Inject it with `inject(DsFormContext, { optional: true })`. */
export abstract class DsFormContext {
  abstract readonly size: Signal<FormSize>;
  abstract readonly orientation: Signal<FormOrientation>;
  abstract readonly state: Signal<FormState>;
  /** Field errors shown now, by name. */
  abstract readonly errors: Signal<FormErrors>;
  /**
   * Sets the message the form gives a required control of this name left
   * empty, in the field and in the summary. Returns a cleanup. Used by
   * ConsentField `requiredError`, as in React.
   */
  abstract setRequiredMessage(name: string, message: string): () => void;
}
