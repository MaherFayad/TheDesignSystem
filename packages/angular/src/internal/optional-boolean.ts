// A boolean input that can also be left out. `undefined` means "not set", so
// the value can fall back to a parent (a Field, a group); a bare static
// attribute (`<div dsCheckbox disabled>`) is true, as booleanAttribute reads it.
import { booleanAttribute } from '@angular/core';

export function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}
