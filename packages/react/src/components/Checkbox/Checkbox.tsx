'use client';
import { useId, useState, type ComponentProps, type MouseEvent, type ReactNode, type Ref } from 'react';
import { Checkbox as RadixCheckbox } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { useFieldControl } from '../Field/Field';
import { useCheckboxGroupItem } from './group-context';

export type CheckboxSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type CheckboxTone = Extract<Tone, 'neutral' | 'accent' | 'danger'>;
export type CheckboxCheckedState = boolean | 'indeterminate';
export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';

type RadixRootProps = ComponentProps<typeof RadixCheckbox.Root>;

export interface CheckboxProps
  extends Omit<RadixRootProps, 'className' | 'style' | 'children' | 'title' | 'asChild' | 'ref' | 'value'> {
  /** The box size: sm 12, md 16, lg 24 px, in a target of 24, 24 px and the lg control height (40 to 48 px by density). Default md. */
  size?: CheckboxSize;
  /** The fill of the checked box. Default neutral. */
  tone?: CheckboxTone;
  /** Visible text after the box. Clicking it toggles the box. Without it, pass aria-label. */
  label?: ReactNode;
  /** A hint under the label. Joins aria-describedby. */
  description?: ReactNode;
  /** Marks the choice invalid. Inside a Field or a CheckboxGroup it follows them. */
  invalid?: boolean;
  /** Keeps the value and focus, but ignores clicks and Space. */
  readOnly?: boolean;
  /**
   * The value sent with the form when checked. Inside a CheckboxGroup it is
   * the value this box adds to the group's array, and it is required there.
   */
  value?: string;
  /** Class name of the root. */
  className?: string;
  /** Inline style of the root. */
  style?: ComponentProps<'div'>['style'];
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the control, the element with role checkbox. */
  ref?: Ref<HTMLButtonElement>;
}

export function checkboxState(checked: CheckboxCheckedState): CheckboxState {
  if (checked === 'indeterminate') return 'indeterminate';
  return checked ? 'checked' : 'unchecked';
}

/**
 * One on or off choice, with an indeterminate state for a parent of mixed
 * children. Behavior from Radix Checkbox: the control is a button with role
 * checkbox; Space toggles and Enter does nothing, as a native checkbox.
 *
 * The control is a 24px target (the lg control height at lg). The indicator inside it is the
 * visible box, with a check or a minus glyph, so the state never relies on
 * color alone. The label is a native label bound to the control, so it
 * extends the target.
 *
 * Inside a Field it reads id, aria-describedby, invalid, disabled and
 * required from the Field. Inside a CheckboxGroup it reads its checked
 * state, size, name, disabled and invalid from the group, keyed by `value`.
 */
export function Checkbox({
  size,
  tone = 'neutral',
  label,
  description,
  invalid,
  disabled,
  readOnly,
  required,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  onClick,
  value,
  name,
  className,
  style,
  rootProps,
  id,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: CheckboxProps) {
  const group = useCheckboxGroupItem(value);
  const descriptionId = useId();
  const ownId = useId();
  const hasDescription = description !== undefined && description !== null && description !== false;

  const control = useFieldControl({
    id,
    'aria-describedby': [hasDescription ? descriptionId : undefined, describedBy].filter(Boolean).join(' ') || undefined,
    invalid: invalid ?? group?.invalid,
    disabled: disabled ?? group?.disabled,
    readOnly: readOnly ?? group?.readOnly,
    required,
  });
  const controlId = control.id ?? ownId;

  const [own, setOwn] = useState<CheckboxCheckedState>(defaultChecked);
  const checked: CheckboxCheckedState = group ? group.checked : (checkedProp ?? own);
  const state = checkboxState(checked);
  const isReadOnly = Boolean(control.readOnly);

  const onChange = (next: CheckboxCheckedState) => {
    if (isReadOnly) return;
    if (checkedProp === undefined) setOwn(next);
    group?.toggle(next === true);
    onCheckedChange?.(next);
  };

  const onControlClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    // Radix skips the toggle when the click is prevented. Space on a button is a click too.
    if (isReadOnly) event.preventDefault();
  };

  const iconSize = size ?? group?.size ?? 'md';
  const hasLabel = label !== undefined && label !== null && label !== false;

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      data-ds="checkbox"
      data-size={iconSize}
      data-tone={tone}
      data-state={state}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      data-readonly={isReadOnly ? '' : undefined}
    >
      <RadixCheckbox.Root
        {...rest}
        ref={ref}
        id={controlId}
        name={name ?? group?.name}
        value={value}
        checked={checked}
        onCheckedChange={onChange}
        onClick={onControlClick}
        disabled={control.disabled}
        required={Boolean(control['aria-required'])}
        aria-describedby={control['aria-describedby']}
        aria-invalid={control['aria-invalid']}
        aria-readonly={isReadOnly || undefined}
        data-part="control"
      >
        <RadixCheckbox.Indicator forceMount data-part="indicator">
          {state === 'checked' && <Icon name="check" size={iconSize} />}
          {state === 'indeterminate' && <Icon name="minus" size={iconSize} />}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {hasLabel && (
        <label htmlFor={controlId} data-part="label">
          {label}
        </label>
      )}
      {hasDescription && (
        <p id={descriptionId} data-part="description">
          {description}
        </p>
      )}
    </div>
  );
}
