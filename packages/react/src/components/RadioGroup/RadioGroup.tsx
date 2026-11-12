'use client';
// RadioGroup: one choice among a few visible options.
//
// Behavior: Radix RadioGroup. The Radix root is the system root
// (`data-ds="radio-group"`, role radiogroup) and each Radix item is the
// `control` part (role radio). Radix gives the roving tab stop (Tab enters
// at the checked item), arrows that move and select in the reading
// direction (the Theme wires the Radix direction provider), Space to select,
// and all four arrows in either orientation, as in a native radio group
// (no orientation goes to Radix; aria-orientation is set here),
// and a hidden native input per item for form posts.
//
// Source: GoBanana could not be fetched in the lane session, so the look
// follows the dials table (PLAN.md 3.7) and the nearest components here:
// Input (the control border, the focus ring) and Field (legend, description
// and error type).
import { createContext, use, useId, type ComponentProps, type ReactNode } from 'react';
import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { useControllable } from '../../internal/useControllable';

export type RadioGroupSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type RadioGroupTone = Extract<Tone, 'neutral' | 'accent'>;
export type RadioGroupOrientation = 'vertical' | 'horizontal';

interface RadioGroupContextValue {
  value: string | undefined;
  disabled: boolean;
  invalid: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps
  extends Omit<
    ComponentProps<'div'>,
    'title' | 'dir' | 'defaultValue' | 'onChange' | 'children' | 'role' | 'aria-orientation'
  > {
  /**
   * The visible question the options answer. Rendered as the legend and used
   * as the group name. Without it, name the group with aria-labelledby (a
   * heading above it) or aria-label.
   */
  label?: ReactNode;
  /** A hint for the whole group, under the legend. Joins aria-describedby. */
  description?: ReactNode;
  /** What is wrong and how to fix it. While it shows, the group is invalid. */
  error?: ReactNode;
  /** Marks the group invalid. When not passed, the group is invalid while it shows an error. `false` hides the error. */
  invalid?: boolean;
  /** The checked value, controlled. */
  value?: string;
  /** The checked value at first render, uncontrolled. */
  defaultValue?: string;
  /** Called with the new value when a person picks an option. */
  onValueChange?: (value: string) => void;
  /** Disables every option. Native disabled: the options leave the tab order. */
  disabled?: boolean;
  /** Sets aria-required on the group and required on the hidden inputs. */
  required?: boolean;
  /** The form field name of the hidden inputs. */
  name?: string;
  /** vertical: one option per line. horizontal: options on one line that wraps. Default vertical. */
  orientation?: RadioGroupOrientation;
  /** Control and text size. Default md. */
  size?: RadioGroupSize;
  /** neutral: the checked control takes the text color. accent: the primary fill. Default neutral. */
  tone?: RadioGroupTone;
  /** Arrow keys wrap from the last option to the first. Default true. */
  loop?: boolean;
  /** RadioGroupItem elements. */
  children?: ReactNode;
}

/**
 * A group of radio options with a legend, a description and an error. The
 * options are RadioGroupItem children. One option is checked at a time; a
 * group starts with none checked unless it gets a value.
 */
export function RadioGroup({
  label,
  description,
  error,
  invalid,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  required = false,
  name,
  orientation = 'vertical',
  size = 'md',
  tone = 'neutral',
  loop = true,
  children,
  'aria-describedby': describedBy,
  ...rest
}: RadioGroupProps) {
  const base = useId();
  const [current, setCurrent] = useControllable<string>(value, defaultValue ?? '', onValueChange);
  const hasLabel = label !== undefined && label !== null && label !== false;
  const hasDescription = description !== undefined && description !== null && description !== false;
  const showError = error !== undefined && error !== null && error !== false && invalid !== false;
  const isInvalid = invalid ?? showError;
  const ids = {
    legend: `${base}legend`,
    description: `${base}description`,
    error: `${base}error`,
  };
  const describedByIds =
    [hasDescription ? ids.description : undefined, showError ? ids.error : undefined, describedBy]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <RadioGroupContext value={{ value: current, disabled, invalid: isInvalid }}>
      <RadixRadioGroup.Root
        aria-labelledby={hasLabel ? ids.legend : undefined}
        {...rest}
        aria-describedby={describedByIds}
        aria-invalid={isInvalid ? true : undefined}
        value={current}
        onValueChange={setCurrent}
        disabled={disabled}
        required={required}
        name={name}
        loop={loop}
        aria-orientation={orientation}
        data-ds="radio-group"
        data-size={size}
        data-tone={tone}
        data-orientation={orientation}
        data-invalid={isInvalid ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
      >
        {hasLabel && (
          <div id={ids.legend} data-part="legend">
            {label}
            {required && (
              <span data-part="required" aria-hidden="true">
                *
              </span>
            )}
          </div>
        )}
        {hasDescription && (
          <p id={ids.description} data-part="description">
            {description}
          </p>
        )}
        <div data-part="items">{children}</div>
        {showError && (
          <p id={ids.error} data-part="error">
            <Icon name="danger" size="md" />
            <span>{error}</span>
          </p>
        )}
      </RadixRadioGroup.Root>
    </RadioGroupContext>
  );
}

export interface RadioGroupItemProps
  extends Omit<ComponentProps<'button'>, 'title' | 'value' | 'children' | 'type' | 'className' | 'style'> {
  /** The value this option sets. */
  value: string;
  /** The visible name of the option. */
  label: ReactNode;
  /** A line of help under the label. Joins the option's aria-describedby. */
  description?: ReactNode;
  /** Disables this option only. */
  disabled?: boolean;
  /** Class name of the item row. */
  className?: string;
  /** Inline style of the item row. */
  style?: ComponentProps<'div'>['style'];
}

/**
 * One option: a row with the round control, the label and an optional
 * description. The control gets the ref and native props. The label is a
 * `<label>` bound to the control, so a click on the text selects.
 */
export function RadioGroupItem({
  value,
  label,
  description,
  disabled,
  className,
  style,
  id,
  'aria-describedby': describedBy,
  ...rest
}: RadioGroupItemProps) {
  const group = use(RadioGroupContext);
  const base = useId();
  const controlId = id ?? `${base}control`;
  const descriptionId = `${base}description`;
  const hasDescription = description !== undefined && description !== null && description !== false;
  const checked = group?.value === value;
  const isDisabled = Boolean(disabled || group?.disabled);
  const describedByIds = [hasDescription ? descriptionId : undefined, describedBy].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={className}
      style={style}
      data-part="item"
      data-state={checked ? 'checked' : 'unchecked'}
      data-disabled={isDisabled ? '' : undefined}
      data-invalid={group?.invalid ? '' : undefined}
    >
      <RadixRadioGroup.Item
        {...rest}
        id={controlId}
        value={value}
        disabled={disabled}
        aria-describedby={describedByIds}
        data-part="control"
      >
        <RadixRadioGroup.Indicator forceMount data-part="indicator" />
      </RadixRadioGroup.Item>
      <label htmlFor={controlId} data-part="label">
        {label}
      </label>
      {hasDescription && (
        <p id={descriptionId} data-part="description">
          {description}
        </p>
      )}
    </div>
  );
}
