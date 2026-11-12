'use client';
import { useId, useState, type ComponentProps, type MouseEvent, type ReactNode, type Ref } from 'react';
import { Switch as RadixSwitch } from 'radix-ui';
import type { Size, Tone } from '@the-system/shared';
import { useFieldControl } from '../Field/Field';

export type SwitchSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type SwitchTone = Extract<Tone, 'accent'>;

type RadixRootProps = ComponentProps<typeof RadixSwitch.Root>;

export interface SwitchStateText {
  /** Shown while on. */
  on: ReactNode;
  /** Shown while off. */
  off: ReactNode;
}

export interface SwitchProps
  extends Omit<RadixRootProps, 'className' | 'style' | 'children' | 'title' | 'asChild' | 'ref'> {
  /** Track of 16, 24 and 32 px high, in a target of 24 px, 24 px and the lg control height. Default md. */
  size?: SwitchSize;
  /** The fill of the track while on. Only accent. */
  tone?: SwitchTone;
  /** Visible text after the switch. Clicking it toggles. Without it, pass aria-label. */
  label?: ReactNode;
  /** A hint under the label. Joins aria-describedby. */
  description?: ReactNode;
  /**
   * Optional words for the two states, shown after the label, such as On
   * and Off. Hidden from assistive tech: the switch role already says on or
   * off.
   */
  stateText?: SwitchStateText;
  /** Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Keeps the value and focus, but ignores clicks, Space and Enter. */
  readOnly?: boolean;
  /** Class name of the root. */
  className?: string;
  /** Inline style of the root. */
  style?: ComponentProps<'div'>['style'];
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the control, the element with role switch. */
  ref?: Ref<HTMLButtonElement>;
}

function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * An immediate on or off setting. Behavior from Radix Switch: the control is
 * a button with role switch; Space and Enter toggle.
 *
 * The control is a 24px target (the lg control height at lg) that holds the
 * track; the thumb moves to the inline end and the track fills while on, so
 * the state never relies on color alone. In right to left text the thumb
 * moves to the left.
 */
export function Switch({
  size = 'md',
  tone = 'accent',
  label,
  description,
  stateText,
  invalid,
  disabled,
  readOnly,
  required,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  onClick,
  className,
  style,
  rootProps,
  id,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: SwitchProps) {
  const descriptionId = useId();
  const ownId = useId();
  const hasDescription = hasContent(description);

  const control = useFieldControl({
    id,
    'aria-describedby': [hasDescription ? descriptionId : undefined, describedBy].filter(Boolean).join(' ') || undefined,
    invalid,
    disabled,
    readOnly,
    required,
  });
  const controlId = control.id ?? ownId;
  const isReadOnly = Boolean(control.readOnly);

  const [own, setOwn] = useState(defaultChecked);
  const checked = checkedProp ?? own;
  const state = checked ? 'checked' : 'unchecked';

  const onChange = (next: boolean) => {
    if (isReadOnly) return;
    if (checkedProp === undefined) setOwn(next);
    onCheckedChange?.(next);
  };

  const onControlClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    // Radix skips the toggle when the click is prevented. Space and Enter on a button are clicks too.
    if (isReadOnly) event.preventDefault();
  };

  // Inside the label it follows the label's last line; aria-hidden keeps it out of the name.
  const stateNode = stateText ? (
    <span data-part="state-text" aria-hidden="true">
      {checked ? stateText.on : stateText.off}
    </span>
  ) : null;

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      data-ds="switch"
      data-size={size}
      data-tone={tone}
      data-state={state}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      data-readonly={isReadOnly ? '' : undefined}
    >
      <RadixSwitch.Root
        {...rest}
        ref={ref}
        id={controlId}
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
        <span data-part="track">
          {/* The on tint that crosses in (interaction switch-stretch, order 1.22): decorative, styled by Switch.css. */}
          <span aria-hidden="true" />
          <RadixSwitch.Thumb data-part="thumb" />
        </span>
      </RadixSwitch.Root>
      {hasContent(label) ? (
        <label htmlFor={controlId} data-part="label">
          {label}
          {stateNode}
        </label>
      ) : (
        stateNode
      )}
      {hasDescription && (
        <p id={descriptionId} data-part="description">
          {description}
        </p>
      )}
    </div>
  );
}
