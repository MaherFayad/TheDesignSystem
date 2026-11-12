// The InputGroup wiring, in a file of its own so Input and the composite
// fields can read it without importing InputGroup.
//
// A group provides itself as DsInputGroupContext to the content written
// inside it. The control (dsInput, dsSearchField, dsPasswordField) reads it
// and takes data-part="control", the group's size, shape and state where it
// sets none, and the add on ids for aria-describedby. A composite field
// provides null to its own template, so its inner Input is never read as
// the group's control.
import type { Signal } from '@angular/core';
import type { Shape, Size } from '@the-system/shared';

export abstract class DsInputGroupContext {
  abstract readonly size: Signal<Size>;
  abstract readonly shape: Signal<Extract<Shape, 'default' | 'pill'>>;
  /** The invalid input as written on the group, undefined when not set. */
  abstract readonly invalid: Signal<boolean | undefined>;
  abstract readonly disabled: Signal<boolean | undefined>;
  abstract readonly readOnly: Signal<boolean | undefined>;
  /** Ids of the add ons in DOM order, for the control's aria-describedby. */
  abstract readonly addonIds: Signal<readonly string[]>;
}
