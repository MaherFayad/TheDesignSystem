// Button: the one action control of the system. The host element is the
// root, `button[dsButton]` or `a[dsButton]`, and the template renders the
// parts in the React order: start, label, end, spinner, status.
//
//   <button dsButton tone="accent" emphasis="solid" end="arrow-forward">Create board</button>
//   <a dsButton href="#pricing" emphasis="link">See pricing</a>
//
// The twin of packages/react/src/components/Button/Button.tsx. `asChild` has
// no Angular form: the attribute selector already makes a link the button.
import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsButtonBase, isIconName, type ButtonEmphasis, type ButtonSlotContent } from './button-base';

@Component({
  selector: 'button[dsButton], a[dsButton]',
  exportAs: 'dsButton',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'button',
    '[attr.data-full-width]': 'fullWidth() ? "" : null',
    '[attr.data-wrap]': 'wrap() ? "" : null',
  },
  template: `
    @if (start(); as content) {
      <span data-part="start">
        @if (isIconName(content)) {
          <svg dsIcon [name]="content" size="md"></svg>
        } @else {
          <ng-container [ngTemplateOutlet]="content" />
        }
      </span>
    }
    <span data-part="label"><ng-content /></span>
    @if (end(); as content) {
      <span data-part="end">
        @if (isIconName(content)) {
          <svg dsIcon [name]="content" size="md"></svg>
        } @else {
          <ng-container [ngTemplateOutlet]="content" />
        }
      </span>
    }
    @if (loading()) {
      <span data-part="spinner" aria-hidden="true"></span>
      <span data-part="status" role="status">{{ loadingLabel() }}</span>
    }
  `,
})
export class DsButton extends DsButtonBase {
  /** How loud the button is. Default soft, or the emphasis of the ButtonGroup. tone accent with emphasis solid is the primary action. */
  readonly emphasis = input<ButtonEmphasis | undefined>(undefined);
  protected readonly defaultEmphasis: ButtonEmphasis = 'soft';
  /** Leading content before the label: an icon name or a template. */
  readonly start = input<ButtonSlotContent | undefined>(undefined);
  /** Trailing content after the label: an icon name or a template. */
  readonly end = input<ButtonSlotContent | undefined>(undefined);
  /** Fills the width of its container. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** Lets a long label wrap onto more lines. */
  readonly wrap = input(false, { transform: booleanAttribute });

  protected readonly isIconName = isIconName;

  constructor() {
    super();
    consumeHostAttributes(['start', 'end', 'fullWidth', 'wrap']);
  }
}
