'use client';
import {
  createContext,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Label } from 'radix-ui';
import { Icon } from '@the-system/icons/react';

export type FieldOrientation = 'vertical' | 'horizontal';

interface FieldContextValue {
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

const FieldContext = createContext<FieldContextValue | null>(null);

/** The nearest Field, or null outside one. */
export function useField(): FieldContextValue | null {
  return use(FieldContext);
}

export interface FieldProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Marks the control invalid. When it is not passed, the field is invalid
   * while it shows an error message. `false` hides the error message.
   */
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Shows the required mark on the label and sets aria-required on the control. */
  required?: boolean;
  /** vertical: label above the control. horizontal: label at the start, control at the end. Default vertical. */
  orientation?: FieldOrientation;
  /** One line API: renders a FieldLabel with this text before the children. */
  label?: ReactNode;
  /** One line API: renders a FieldDescription with this text after the children. */
  description?: ReactNode;
  /** One line API: renders a FieldError with this text after the children. */
  error?: ReactNode;
}

/**
 * Wires one label, one description and one error message to one control.
 * The control reads the wiring with `useFieldControl()`, so Input, and later
 * Select and Textarea, need no extra prop.
 *
 * Order in the DOM: label, control, description, error. The description and
 * the error join the control's aria-describedby only while they render.
 */
export function Field({
  invalid,
  disabled = false,
  readOnly = false,
  required = false,
  orientation = 'vertical',
  label,
  description,
  error,
  children,
  ...rest
}: FieldProps) {
  const base = useId();
  const [ownControlId, setOwnControlId] = useState<string | undefined>(undefined);
  const [counts, setCounts] = useState({ description: 0, error: 0 });

  const register = useCallback((part: 'description' | 'error') => {
    setCounts((c) => ({ ...c, [part]: c[part] + 1 }));
    return () => setCounts((c) => ({ ...c, [part]: c[part] - 1 }));
  }, []);

  const hasError = counts.error > 0;
  const value = useMemo<FieldContextValue>(
    () => ({
      controlId: ownControlId ?? `${base}control`,
      labelId: `${base}label`,
      descriptionId: `${base}description`,
      errorId: `${base}error`,
      invalid: invalid ?? hasError,
      invalidProp: invalid,
      disabled,
      readOnly,
      required,
      hasDescription: counts.description > 0,
      hasError,
      register,
      setControlId: setOwnControlId,
    }),
    [base, ownControlId, invalid, hasError, disabled, readOnly, required, counts.description, register],
  );

  return (
    <FieldContext value={value}>
      <div
        {...rest}
        data-ds="field"
        data-orientation={orientation}
        data-invalid={value.invalid ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
      >
        {label !== undefined && label !== null && <FieldLabel>{label}</FieldLabel>}
        {children}
        {description !== undefined && description !== null && <FieldDescription>{description}</FieldDescription>}
        {error !== undefined && error !== null && <FieldError>{error}</FieldError>}
      </div>
    </FieldContext>
  );
}

export interface FieldLabelProps extends Omit<ComponentProps<'label'>, 'title'> {
  children?: ReactNode;
}

/**
 * The visible name of the control: a `<label>` bound with htmlFor. When the
 * field is required it adds a mark that is a glyph, not a color, and is
 * hidden from the accessible name. The control carries aria-required.
 */
export function FieldLabel({ children, htmlFor, ...rest }: FieldLabelProps) {
  const field = useField();
  return (
    <Label.Root {...rest} id={rest.id ?? field?.labelId} htmlFor={htmlFor ?? field?.controlId} data-part="label">
      {children}
      {field?.required && (
        <span data-part="required" aria-hidden="true">
          *
        </span>
      )}
    </Label.Root>
  );
}

export interface FieldDescriptionProps extends Omit<ComponentProps<'p'>, 'title'> {
  children?: ReactNode;
}

/** A hint that helps fill the control. Joins aria-describedby. */
export function FieldDescription({ children, ...rest }: FieldDescriptionProps) {
  const field = useField();
  const register = field?.register;
  useLayoutEffect(() => register?.('description'), [register]);
  return (
    <p {...rest} id={rest.id ?? field?.descriptionId} data-part="description">
      {children}
    </p>
  );
}

export interface FieldErrorProps extends Omit<ComponentProps<'p'>, 'title'> {
  children?: ReactNode;
}

/**
 * What is wrong and how to fix it. Renders only when it has content and the
 * Field is not marked `invalid={false}`. While it renders, the field is
 * invalid and the message joins aria-describedby.
 *
 * It is not a live region and never role="alert": an error that is on the
 * page when it loads must not interrupt. A screen reader reads it with the
 * control, through aria-describedby, when focus lands there. A form that
 * checks on submit moves focus to the first invalid control.
 */
export function FieldError({ children, ...rest }: FieldErrorProps) {
  const field = useField();
  const shown = children !== undefined && children !== null && children !== false && field?.invalidProp !== false;
  const register = field?.register;
  useLayoutEffect(() => (shown ? register?.('error') : undefined), [shown, register]);
  if (!shown) return null;
  return (
    <p {...rest} id={rest.id ?? field?.errorId} data-part="error">
      <Icon name="danger" size="md" />
      <span>{children}</span>
    </p>
  );
}

export interface FieldControlOptions {
  id?: string;
  'aria-describedby'?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

export interface FieldControlProps {
  id: string | undefined;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  'aria-required': true | undefined;
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
}

/**
 * The props a control spreads on its native element to join the nearest
 * Field: id (the label points at it), aria-describedby (description, then
 * error, then the control's own), aria-invalid, aria-required, disabled and
 * readOnly. A value the control passes itself wins over the Field.
 *
 * Required becomes aria-required, not the native required attribute, so the
 * browser does not show its own validation bubble. Outside a Field it
 * returns the control's own values.
 */
export function useFieldControl(own: FieldControlOptions = {}): FieldControlProps {
  const field = useField();
  const setControlId = field?.setControlId;
  useLayoutEffect(() => {
    if (!setControlId || own.id === undefined) return undefined;
    setControlId(own.id);
    return () => setControlId(undefined);
  }, [setControlId, own.id]);

  const invalid = own.invalid ?? field?.invalid ?? false;
  const disabled = own.disabled ?? field?.disabled ?? false;
  const readOnly = own.readOnly ?? field?.readOnly ?? false;
  const required = own.required ?? field?.required ?? false;
  const describedBy = [
    field?.hasDescription ? field.descriptionId : undefined,
    field?.hasError ? field.errorId : undefined,
    own['aria-describedby'],
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: own.id ?? field?.controlId,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': invalid ? true : undefined,
    'aria-required': required ? true : undefined,
    disabled: disabled || undefined,
    readOnly: readOnly || undefined,
  };
}
