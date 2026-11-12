'use client';
// Autocomplete: free text with suggestions (a city, a tag name) where any
// text is allowed. ARIA 1.2 combobox with list autocomplete and no automatic
// selection: the suggestions filter as you type, nothing is highlighted until
// an arrow key moves, so Enter keeps the typed text. Built on the Combobox
// base (ComboboxBase.tsx) and Radix Popover, with a ListBox in the popup.
//
// No source to port: designed from the dials table and Combobox, its nearest
// component. It drops the trigger and clear buttons: the field is a plain
// text field that suggests, not a picker.
import type { ListBoxItem } from '../ListBox';
import { useControllable } from '../Window/useControllable';
import { ComboboxBase, type ComboboxBaseProps } from '../Combobox/ComboboxBase';

export type { ComboboxShape as AutocompleteShape, ComboboxSize as AutocompleteSize } from '../Combobox/ComboboxBase';

export interface AutocompleteProps
  extends Omit<ComboboxBaseProps, 'inputValue' | 'defaultInputValue' | 'onInputValueChange' | 'empty'> {
  /** The suggestions, plain or in titled groups. Choosing one puts its label in the field. */
  items: readonly ListBoxItem[];
  /** The text, controlled with onValueChange. Any text is a valid value. */
  value?: string;
  defaultValue?: string;
  /** Called with the text on every keystroke and when a suggestion is chosen. */
  onValueChange?: (value: string) => void;
  /** Called with the text when Enter is pressed and no suggestion is highlighted. The form still submits. */
  onCommit?: (value: string) => void;
  /** Shown in the popup when no suggestion matches. Default none: the popup closes, since any text is fine. */
  empty?: ComboboxBaseProps['empty'];
  /** Submits the text under this name in a form. */
  name?: string;
}

/**
 * A text field that suggests. Typing filters the suggestions and opens the
 * list; ArrowDown and ArrowUp move through it; Enter on a suggestion puts it
 * in the field, Enter with none highlighted keeps the typed text (and
 * submits the form). Escape closes, a second Escape clears. Native input
 * props go to the input; className, style and rootProps to the root box.
 */
export function Autocomplete({ value: valueProp, defaultValue = '', onValueChange, onCommit, name, ...rest }: AutocompleteProps) {
  const [value, setValue] = useControllable<string>(valueProp, defaultValue, onValueChange);
  return (
    <ComboboxBase
      {...rest}
      name={name}
      ds="autocomplete"
      mode="free"
      value={null}
      selectedLabel=""
      inputValue={value}
      onInputValueChange={setValue}
      onSelect={() => undefined}
      onCommit={onCommit}
    />
  );
}
