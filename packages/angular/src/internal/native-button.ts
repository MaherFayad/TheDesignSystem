// A native button that is a part of a system control, not an action: the
// control of a Checkbox or a Switch, a radio, a star of a Rating. React gets
// these from Radix, which renders a plain `<button>`. The lint gate asks every
// template button to carry a ds directive, so the part carries this one. It
// only removes its own marker, so the DOM equals the Radix DOM.
import { Directive } from '@angular/core';
import { consumeHostAttributes } from './host';

@Directive({ selector: 'button[dsNativeButton]' })
export class DsNativeButton {
  constructor() {
    consumeHostAttributes(['dsNativeButton']);
  }
}
