// The close part of a toast: the CloseButton DOM of
// packages/react/src/components/CloseButton/CloseButton.tsx on the Button
// base (data-ds="close-button", neutral ghost, the close icon, aria-label).
// Private to the toast folder: the Angular CloseButton comes with order A1.1
// on another branch. Once it lands, Toast uses it and this file goes.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ButtonEmphasis } from '../button/button-base';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsButtonBase } from '../button/button-base';

@Component({
  selector: 'button[dsToastClose]',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'close-button',
    '[attr.aria-label]': 'label()',
  },
  template: `<span data-part="icon"><svg dsIcon name="close" size="md"></svg></span>`,
})
export class DsToastClose extends DsButtonBase {
  /** The accessible name, set as aria-label. */
  readonly label = input.required<string>();
  /** Fixed: the close part is always a ghost button. */
  readonly emphasis = computed<ButtonEmphasis | undefined>(() => 'ghost');
  protected readonly defaultEmphasis: ButtonEmphasis = 'ghost';

  constructor() {
    super();
    consumeHostAttributes(['dsToastClose', 'label']);
  }
}
