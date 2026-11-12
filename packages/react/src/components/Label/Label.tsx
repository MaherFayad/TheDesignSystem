'use client';
import type { ComponentProps, ReactNode } from 'react';
import { Label as LabelPrimitive, VisuallyHidden } from 'radix-ui';
import type { Size } from '@the-system/shared';
import { useField } from '../Field/context';
import { useTheme } from '../../theme/hooks';

export type LabelSize = Extract<Size, 'sm' | 'md'>;

export interface LabelProps extends Omit<ComponentProps<'label'>, 'title'> {
  /** Text size. md matches the label of a Field; sm sits next to a small control. Default md. */
  size?: LabelSize;
  /**
   * Shows the required mark, an aria-hidden asterisk. Inside a Field it
   * follows the Field, whose control carries aria-required. Outside a Field
   * the word in `requiredText` joins the label, so the control's name says
   * it is required.
   */
  required?: boolean;
  /**
   * The word read after the label outside a Field when `required` is set.
   * Default "required", or "مطلوب" when the nearest Theme is Arabic (a
   * plain lang attribute without a Theme does not count).
   */
  requiredText?: string;
  /** Text after the label for a field that may stay empty, for example "Optional". */
  optional?: ReactNode;
  /** Draws the label as disabled. Inside a Field it follows the Field. */
  disabled?: boolean;
  /** Marks the label of an invalid control. Inside a Field it follows the Field. */
  invalid?: boolean;
  children?: ReactNode;
}

/**
 * The visible name of a control: a native `<label>` (Radix Label, so a
 * double click does not select the text). A click on it focuses or toggles
 * the control it points at with `htmlFor`, or the control it wraps.
 *
 * Inside a Field, Field renders it as its `label` part and passes the ids
 * and the state. Alone it labels a Switch, a Checkbox or a Slider.
 */
export function Label({ size = 'md', required, requiredText, optional, disabled, invalid, children, ...rest }: LabelProps) {
  const field = useField();
  const { lang } = useTheme();
  const isRequired = required ?? field?.required ?? false;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const hasOptional = optional !== undefined && optional !== null && optional !== false && !isRequired;
  // Inside a required Field the control carries aria-required, so the word would be read twice.
  const word = field?.required ? undefined : (requiredText ?? (lang.toLowerCase().startsWith('ar') ? 'مطلوب' : 'required'));

  return (
    <LabelPrimitive.Root {...rest} data-ds="label" data-size={size} data-disabled={isDisabled ? '' : undefined} data-invalid={isInvalid ? '' : undefined}>
      {children}
      {isRequired &&
        (word ? (
          <span data-part="required">
            <span aria-hidden="true">*</span>
            <VisuallyHidden.Root> {word}</VisuallyHidden.Root>
          </span>
        ) : (
          <span data-part="required" aria-hidden="true">
            *
          </span>
        ))}
      {/* A real space, so the name reads "Company Optional", not "CompanyOptional". */}
      {hasOptional && (
        <>
          {' '}
          <span data-part="optional">{optional}</span>
        </>
      )}
    </LabelPrimitive.Root>
  );
}
