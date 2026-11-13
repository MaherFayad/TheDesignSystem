'use client';
import { useId, useState, type ComponentProps, type MouseEvent, type ReactNode, type Ref } from 'react';
import { Checkbox as RadixCheckbox } from 'radix-ui';
import type { Size, Tone } from '@the-system/shared';
import { useFieldControl } from '../Field/Field';
import { useCheckboxGroupItem } from './group-context';

export type CheckboxSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type CheckboxTone = Extract<Tone, 'neutral' | 'accent' | 'danger'>;
export type CheckboxCheckedState = boolean | 'indeterminate';
export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';
type CheckboxGlyph = 'check' | 'minus';

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
  // The glyph stays in the box while unchecked, hidden, so the next check can
  // draw it in (interaction check-draw) and an uncheck can fade it out. It
  // keeps the last glyph shown, a check before any.
  const shown: CheckboxGlyph | undefined = state === 'checked' ? 'check' : state === 'indeterminate' ? 'minus' : undefined;
  const [lastGlyph, setLastGlyph] = useState<CheckboxGlyph>(shown ?? 'check');
  if (shown && shown !== lastGlyph) setLastGlyph(shown);
  const glyph = shown ?? lastGlyph;
  // B5 (order 1.29): the state before the last change. A mark drawn from an
  // empty box carries data-enter, so it takes its glyph's angles at once and
  // only draws: from unchecked to mixed no part of the last check shows.
  const [seen, setSeen] = useState<{ state: CheckboxState; from: CheckboxState }>({ state, from: state });
  if (seen.state !== state) setSeen({ state, from: seen.state });
  const from = seen.state === state ? seen.from : seen.state;
  const enter = state !== 'unchecked' && from === 'unchecked';
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

  const boxSize = size ?? group?.size ?? 'md';
  const hasLabel = label !== undefined && label !== null && label !== false;

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      data-ds="checkbox"
      data-size={boxSize}
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
          {/* The fill that grows from the centre (check-draw, order 1.23): purely visual, no part name. */}
          <span aria-hidden="true" />
          {/*
           * The mark: two strokes that meet at a joint, the short arm then the
           * long arm. Checkbox.css turns and draws them (stroke-dashoffset), so
           * the same two strokes are the check and the dash and morph between them.
           */}
          <svg data-part="mark" data-glyph={glyph} data-enter={enter ? '' : undefined} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M-4.25 0H0" pathLength={1} />
            <path d="M0 0H8.85" pathLength={1} />
          </svg>
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
