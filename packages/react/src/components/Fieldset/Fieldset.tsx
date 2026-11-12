'use client';
import { useEffect, useId, useMemo, useRef, type ComponentProps, type ReactNode } from 'react';
import type { Size } from '@the-system/shared';
import { FieldContext, type FieldContextValue } from '../Field/context';
import { FieldError } from '../FieldError/FieldError';
import { useFormFieldError } from '../Form/Form';

export type FieldsetSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface FieldsetProps extends Omit<ComponentProps<'fieldset'>, 'title'> {
  /** The name of the group, in a native legend. Required: a screen reader reads it with the first field. */
  legend: ReactNode;
  /** A hint under the legend. Joins the group's aria-describedby. */
  description?: ReactNode;
  /** What is wrong with the group as a whole and how to fix it. A FieldError root with data-part error. */
  error?: ReactNode;
  /**
   * The name the controls of a group share (a checkbox or radio group).
   * Inside a Form, the Form's error for that name shows in the error part,
   * in place of `error`. Rendered as data-name.
   */
  name?: string;
  /** Legend size and the space between the fields. Default md. */
  size?: FieldsetSize;
  /** Native disabled: disables every control inside, buttons included. */
  disabled?: boolean;
  /**
   * Marks the group invalid. When it is not passed, the group is invalid
   * while it shows an error. `false` hides the error.
   */
  invalid?: boolean;
  children?: ReactNode;
}

function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

const noop = () => () => undefined;

/**
 * A group of fields or choices under one legend: a native fieldset, so the
 * legend is the group's name and a screen reader reads it when focus enters
 * the first field. Native disabled disables every control inside.
 *
 * DOM order: legend, description, error, body. The group error sits above
 * the fields, so it is seen before a long list of choices, and it joins the
 * group's aria-describedby.
 *
 * The error part is the system FieldError. It is given a Field context of
 * its own so it takes the group's error id and the error part name; that
 * context wraps the error alone, never the fields in the body.
 */
export function Fieldset({
  legend,
  description,
  error: errorProp,
  name,
  size = 'md',
  disabled = false,
  invalid,
  children,
  'aria-describedby': describedBy,
  ...rest
}: FieldsetProps) {
  const base = useId();
  const descriptionId = `${base}description`;
  const errorId = `${base}error`;
  const formError = useFormFieldError(name);
  const error = formError ?? errorProp;
  const showError = hasContent(error) && invalid !== false;
  const isInvalid = invalid ?? showError;
  const showDescription = hasContent(description);

  // An error that shows after the first paint slides in (order 1.22).
  const settled = useRef(false);
  useEffect(() => {
    settled.current = true;
  }, []);

  const errorContext = useMemo<FieldContextValue>(
    () => ({
      controlId: `${base}group`,
      labelId: `${base}legend`,
      descriptionId,
      errorId,
      invalid: isInvalid,
      invalidProp: invalid,
      disabled,
      readOnly: false,
      required: false,
      hasDescription: showDescription,
      hasError: showError,
      register: noop,
      setControlId: () => undefined,
      settled,
    }),
    [base, descriptionId, errorId, isInvalid, invalid, disabled, showDescription, showError],
  );

  const ariaDescribedBy =
    [showDescription ? descriptionId : undefined, showError ? errorId : undefined, describedBy].filter(Boolean).join(' ') ||
    undefined;

  return (
    <fieldset
      {...rest}
      disabled={disabled || undefined}
      aria-describedby={ariaDescribedBy}
      data-ds="fieldset"
      data-name={name}
      data-size={size}
      data-disabled={disabled ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
    >
      <legend data-part="legend">{legend}</legend>
      {showDescription && (
        <p id={descriptionId} data-part="description">
          {description}
        </p>
      )}
      {showError && (
        <FieldContext value={errorContext}>
          <FieldError size={size === 'sm' ? 'sm' : 'md'}>{error}</FieldError>
        </FieldContext>
      )}
      <div data-part="body">{children}</div>
    </fieldset>
  );
}
