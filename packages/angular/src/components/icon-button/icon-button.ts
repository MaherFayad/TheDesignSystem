// IconButton: a Button with an icon and no visible label. Built on the same
// internals as Button (DsButtonBase). `label` is the accessible name, set as
// aria-label, and is required.
//
//   <button dsIconButton icon="close" label="Close panel"></button>
//
// The twin of packages/react/src/components/IconButton/IconButton.tsx.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsButtonBase, isIconName, type ButtonEmphasis, type ButtonSlotContent } from '../button/button-base';

/** No link emphasis: an icon only link reads as neither a link nor a button. */
export type IconButtonEmphasis = Exclude<ButtonEmphasis, 'link'>;

@Component({
  selector: 'button[dsIconButton], a[dsIconButton]',
  exportAs: 'dsIconButton',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'icon-button',
    '[attr.aria-label]': 'label()',
  },
  template: `
    @let content = icon();
    <span data-part="icon">
      @if (isIconName(content)) {
        <svg dsIcon [name]="content" size="md"></svg>
      } @else {
        <ng-container [ngTemplateOutlet]="content" />
      }
    </span>
    @if (loading()) {
      <span data-part="spinner" aria-hidden="true"></span>
      <span data-part="status" role="status">{{ loadingLabel() }}</span>
    }
    @if (spinnerLeaving()) {
      <span data-part="spinner" aria-hidden="true"></span>
    }
  `,
})
export class DsIconButton extends DsButtonBase {
  /** The icon: a system icon name or a template. Hidden from assistive tech. */
  readonly icon = input.required<ButtonSlotContent>();
  /** The accessible name, set as aria-label. English: a verb plus a noun. */
  readonly label = input.required<string>();
  /** Default ghost, or the emphasis of the ButtonGroup: icon buttons sit in toolbars and headers. */
  readonly emphasis = input<IconButtonEmphasis | undefined>(undefined);
  protected readonly defaultEmphasis: ButtonEmphasis = 'ghost';

  protected override isIconOnly(): boolean {
    return true;
  }

  protected readonly isIconName = isIconName;

  constructor() {
    super();
    consumeHostAttributes(['icon', 'label']);
  }
}
