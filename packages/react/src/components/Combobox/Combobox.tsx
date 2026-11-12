'use client';
// Combobox: pick one value from a long list by typing to filter. ARIA 1.2
// combobox with list autocomplete: focus stays in the input, the popup holds
// a ListBox with virtualFocus, and aria-activedescendant points at the
// highlighted option. Behavior in ComboboxBase (shared with Autocomplete),
// the popup on Radix Popover.
//
// The order names Figma-Killer-2 `Select/SelectMenu.tsx` and
// `ContextMenu/MenuSearchHeader.tsx` as sources; they were not reachable in
// the lane session and were not read. The field follows Input, the popup the
// DropdownMenu surface, the keys the ARIA 1.2 combobox pattern.
import { useMemo } from 'react';
import { flattenListBoxItems, type ListBoxItem } from '../ListBox';
import { useControllable } from '../Window/useControllable';
import { ComboboxBase, type ComboboxBaseProps } from './ComboboxBase';

export type { ComboboxShape, ComboboxSize } from './ComboboxBase';

export interface ComboboxProps extends ComboboxBaseProps {
  /** The options, plain or in titled groups. */
  items: readonly ListBoxItem[];
  /** The chosen option value, controlled with onValueChange. null: none. */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with the chosen value, or null when cleared. */
  onValueChange?: (value: string | null) => void;
  /** The name of the opener button, read by screen readers. Default "Show options". */
  triggerLabel?: string;
  /** The name of the clear button. Default "Clear value". */
  clearLabel?: string;
  /** Submits the value under this name in a form (a hidden input). */
  name?: string;
}

/**
 * A text field that filters a list and keeps one value from it. Typing
 * filters and opens; the first match is highlighted so Enter picks it. On
 * blur the field shows the chosen label again: the value is always an
 * option. Escape closes, a second Escape clears. Native input props go to
 * the input; className, style and rootProps to the root box.
 */
export function Combobox({ items, value: valueProp, defaultValue = null, onValueChange, ...rest }: ComboboxProps) {
  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, onValueChange);
  const label = useMemo(
    () => (value === null ? '' : (flattenListBoxItems(items).find((o) => o.value === value)?.label ?? '')),
    [items, value],
  );
  return (
    <ComboboxBase
      {...rest}
      ds="combobox"
      mode="select"
      items={items}
      value={value}
      selectedLabel={label}
      onSelect={(option) => setValue(option ? option.value : null)}
    />
  );
}
