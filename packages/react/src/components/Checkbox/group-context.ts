'use client';
import { createContext, use, useLayoutEffect } from 'react';
import type { Size } from '@the-system/shared';

/** What a CheckboxGroup shares with the Checkbox items inside it. */
export interface CheckboxGroupContextValue {
  /** The checked item values. */
  value: readonly string[];
  /** Adds or removes one item value. */
  toggle: (itemValue: string, on: boolean) => void;
  /** Items announce their value, so a select all item knows the whole set. */
  register: (itemValue: string) => () => void;
  size: Extract<Size, 'sm' | 'md' | 'lg'> | undefined;
  name: string | undefined;
  disabled: boolean | undefined;
  invalid: boolean | undefined;
  readOnly: boolean | undefined;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

export interface CheckboxGroupItem {
  checked: boolean;
  toggle: (on: boolean) => void;
  size: CheckboxGroupContextValue['size'];
  name: string | undefined;
  disabled: boolean | undefined;
  invalid: boolean | undefined;
  readOnly: boolean | undefined;
}

/**
 * The group wiring for one Checkbox, keyed by its value. Null outside a
 * group, or when the Checkbox has no value (a select all item, which the
 * group drives through its own props).
 */
export function useCheckboxGroupItem(value: string | undefined): CheckboxGroupItem | null {
  const group = use(CheckboxGroupContext);
  const register = group?.register;
  useLayoutEffect(() => {
    if (!register || value === undefined) return undefined;
    return register(value);
  }, [register, value]);
  if (!group || value === undefined) return null;
  return {
    checked: group.value.includes(value),
    toggle: (on) => group.toggle(value, on),
    size: group.size,
    name: group.name,
    disabled: group.disabled,
    invalid: group.invalid,
    readOnly: group.readOnly,
  };
}
