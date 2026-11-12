'use client';
import { createContext, use } from 'react';

export interface FieldContextValue {
  controlId: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
  invalid: boolean;
  /** The invalid prop as passed. `false` hides every error message. */
  invalidProp: boolean | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  hasDescription: boolean;
  hasError: boolean;
  register: (part: 'description' | 'error') => () => void;
  setControlId: (id: string | undefined) => void;
}

/**
 * The Field wiring, in a file of its own so Label and FieldError can read it
 * without importing Field, which renders them.
 */
export const FieldContext = createContext<FieldContextValue | null>(null);

/** The nearest Field, or null outside one. */
export function useField(): FieldContextValue | null {
  return use(FieldContext);
}
