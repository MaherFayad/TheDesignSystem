'use client';
import { useCallback, useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Icon } from '@the-system/icons/react';
import { Checkbox, type CheckboxCheckedState, type CheckboxSize } from '../Checkbox/Checkbox';
import { CheckboxGroupContext, type CheckboxGroupContextValue } from '../Checkbox/group-context';

export type CheckboxGroupSize = CheckboxSize;
export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

export interface CheckboxGroupProps
  extends Omit<ComponentProps<'fieldset'>, 'title' | 'defaultValue' | 'onChange' | 'disabled'> {
  /** The question, in a legend. Required: it names the group. */
  legend: ReactNode;
  /** A hint under the legend. Joins the group's aria-describedby. */
  description?: ReactNode;
  /** What is wrong and how to fix it. While it shows, the group and its items are invalid. */
  error?: ReactNode;
  /** Controlled value: the values of the checked items. */
  value?: readonly string[];
  /** Uncontrolled starting value. */
  defaultValue?: readonly string[];
  /** Called with the new array of checked values. */
  onValueChange?: (value: string[]) => void;
  /** Size of every item. Default md. */
  size?: CheckboxGroupSize;
  /** vertical: one item per line. horizontal: items wrap on a line. Default vertical. */
  orientation?: CheckboxGroupOrientation;
  /** The form name every item submits under. */
  name?: string;
  disabled?: boolean;
  /** Marks the group invalid. When it is not passed, the group is invalid while it shows an error. `false` hides the error. */
  invalid?: boolean;
  readOnly?: boolean;
  /**
   * The label of an optional first item that checks or clears every item.
   * It is indeterminate when some items are checked.
   */
  selectAll?: ReactNode;
}

function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false;
}

/**
 * Several Checkbox items under one question, with one value array. A
 * fieldset with a legend, so a screen reader names the group when focus
 * enters it. Tab moves between the items; Space toggles one.
 *
 * Items are Checkbox components with a `value`. They read their checked
 * state, size, name, disabled, invalid and read only from the group.
 */
export function CheckboxGroup({
  legend,
  description,
  error,
  value: valueProp,
  defaultValue = [],
  onValueChange,
  size = 'md',
  orientation = 'vertical',
  name,
  disabled = false,
  invalid,
  readOnly = false,
  selectAll,
  children,
  'aria-describedby': describedBy,
  ...rest
}: CheckboxGroupProps) {
  const base = useId();
  const descriptionId = `${base}description`;
  const errorId = `${base}error`;
  const [own, setOwn] = useState<readonly string[]>(defaultValue);
  const [registered, setRegistered] = useState<readonly string[]>([]);
  const value = valueProp ?? own;

  const showError = hasContent(error) && invalid !== false;
  const isInvalid = invalid ?? showError;
  const showDescription = hasContent(description);

  const commit = useCallback(
    (next: string[]) => {
      if (valueProp === undefined) setOwn(next);
      onValueChange?.(next);
    },
    [valueProp, onValueChange],
  );

  const toggle = useCallback(
    (itemValue: string, on: boolean) => {
      const without = value.filter((v) => v !== itemValue);
      commit(on ? [...without, itemValue] : without);
    },
    [value, commit],
  );

  const register = useCallback((itemValue: string) => {
    setRegistered((list) => (list.includes(itemValue) ? list : [...list, itemValue]));
    return () => setRegistered((list) => list.filter((v) => v !== itemValue));
  }, []);

  const context = useMemo<CheckboxGroupContextValue>(
    () => ({ value, toggle, register, size, name, disabled, invalid: isInvalid, readOnly }),
    [value, toggle, register, size, name, disabled, isInvalid, readOnly],
  );

  const checkedCount = registered.filter((v) => value.includes(v)).length;
  const allState: CheckboxCheckedState =
    checkedCount === 0 ? false : checkedCount === registered.length ? true : 'indeterminate';

  const onSelectAll = () => {
    if (allState === true) commit(value.filter((v) => !registered.includes(v)));
    else commit([...value, ...registered.filter((v) => !value.includes(v))]);
  };

  const ariaDescribedBy =
    [showDescription ? descriptionId : undefined, showError ? errorId : undefined, describedBy].filter(Boolean).join(' ') ||
    undefined;

  return (
    <CheckboxGroupContext value={context}>
      <fieldset
        {...rest}
        aria-describedby={ariaDescribedBy}
        data-ds="checkbox-group"
        data-size={size}
        data-orientation={orientation}
        data-disabled={disabled ? '' : undefined}
        data-invalid={isInvalid ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
      >
        <legend data-part="legend">{legend}</legend>
        {showDescription && (
          <p id={descriptionId} data-part="description">
            {description}
          </p>
        )}
        <div data-part="items">
          {hasContent(selectAll) && (
            <Checkbox
              label={selectAll}
              size={size}
              checked={allState}
              onCheckedChange={onSelectAll}
              disabled={disabled}
              invalid={isInvalid}
              readOnly={readOnly}
              rootProps={{ 'data-part': 'select-all' } as ComponentProps<'div'>}
            />
          )}
          {children}
        </div>
        {showError && (
          <p id={errorId} data-part="error">
            <Icon name="danger" size="md" />
            <span>{error}</span>
          </p>
        )}
      </fieldset>
    </CheckboxGroupContext>
  );
}
