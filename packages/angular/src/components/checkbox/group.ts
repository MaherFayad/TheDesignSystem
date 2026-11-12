// What a CheckboxGroup shares with the Checkbox items inside it, through DI.
// The twin of packages/react/src/components/Checkbox/group-context.ts.
import { InjectionToken, type Signal } from '@angular/core';
import type { Size } from '@the-system/shared';

export interface CheckboxGroupContext {
  /** The checked item values. */
  readonly value: Signal<readonly string[]>;
  /** Adds or removes one item value. */
  toggle(itemValue: string, on: boolean): void;
  /** Items announce their value, so a select all item knows the whole set. Returns the unregister function. */
  register(itemValue: string): () => void;
  readonly size: Signal<Extract<Size, 'sm' | 'md' | 'lg'> | undefined>;
  readonly name: Signal<string | undefined>;
  readonly disabled: Signal<boolean | undefined>;
  readonly invalid: Signal<boolean | undefined>;
  readonly readOnly: Signal<boolean | undefined>;
}

export const DS_CHECKBOX_GROUP = new InjectionToken<CheckboxGroupContext>('DS_CHECKBOX_GROUP');
