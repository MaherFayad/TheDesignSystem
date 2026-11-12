// FloatingActionButton: the one main action of a screen, floating above the
// content at the inline end and the block end. On the Button base: a solid
// fill, a touch size (44px or more), an elevation, and an extended form with
// a visible label.
//
//   <button dsFloatingActionButton icon="plus" label="Create board"></button>
//   <button dsFloatingActionButton icon="plus" label="Create board" extended position="absolute"></button>
//
// The twin of packages/react/src/components/FloatingActionButton/FloatingActionButton.tsx.
// `asChild` has no Angular form: `a[dsFloatingActionButton]` is the link form.
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DsIcon } from '@the-system/icons/angular';
import type { Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsButtonBase, isIconName, type ButtonEmphasis, type ButtonSize, type ButtonSlotContent, type ButtonTone } from '../button/button-base';

export type FloatingActionButtonSize = Extract<Size, 'md' | 'lg'>;
/** Where it floats: the viewport (fixed), the nearest positioned container (absolute), or in the flow (static). */
export type FloatingActionButtonPosition = 'fixed' | 'absolute' | 'static';

@Component({
  selector: 'button[dsFloatingActionButton], a[dsFloatingActionButton]',
  exportAs: 'dsFloatingActionButton',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'floating-action-button',
    '[attr.data-extended]': 'extended() ? "" : null',
    '[attr.data-position]': 'position()',
    '[attr.aria-label]': 'extended() ? null : label()',
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
    @if (extended()) {
      <span data-part="label">{{ label() }}</span>
    }
    @if (loading()) {
      <span data-part="spinner" aria-hidden="true"></span>
      <span data-part="status" role="status">{{ loadingLabel() }}</span>
    }
  `,
})
export class DsFloatingActionButton extends DsButtonBase {
  /** The icon: a system icon name or a template. Hidden from assistive tech. */
  readonly icon = input.required<ButtonSlotContent>();
  /** The action, a verb plus a noun. The accessible name, and the visible text when extended. */
  readonly label = input.required<string>();
  /** Shows the label beside the icon. Default false. */
  readonly extended = input(false, { transform: booleanAttribute });
  /** Default fixed. */
  readonly position = input<FloatingActionButtonPosition>('fixed');
  /** md 44px, lg 48px: never under the touch target. Default lg, also inside a ButtonGroup. */
  override readonly size = input<ButtonSize | undefined>('lg' satisfies FloatingActionButtonSize);
  /** Default accent: the main action. */
  override readonly tone = input<ButtonTone>('accent');

  /** Always solid: not an input. */
  readonly emphasis = computed<ButtonEmphasis | undefined>(() => 'solid');
  protected readonly defaultEmphasis: ButtonEmphasis = 'solid';
  protected readonly isIconName = isIconName;

  constructor() {
    super();
    consumeHostAttributes(['dsFloatingActionButton', 'icon', 'label', 'extended', 'position']);
  }

  protected override isIconOnly(): boolean {
    return !this.extended();
  }
}
