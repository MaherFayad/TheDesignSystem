// Private stand in for the pressable Chip, not exported.
//
// Chip has no Angular port in this checkout. FilterBar renders its quick
// filters as pressable chips, so this renders the DOM of React's pressable
// Chip (ButtonRoot with data-ds chip, aria-pressed, data-selected, the check
// icon while selected, the label) on the shared Button base, and Chip.css
// applies as is. Swap it for the Chip port when it lands: the DOM stays the
// same.
//
// chip-check-pop, as React's PressableChip: a new selected state turns its
// glyph in past its size and back (iconMorph). Not on first paint.
import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, booleanAttribute, input, untracked, viewChild } from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import { iconMorph } from '@the-system/motion';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { DsButtonBase, type ButtonEmphasis, type ButtonShape } from '../button/button-base';

@Component({
  selector: 'button[dsStandInChip]',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'chip',
    '[attr.aria-pressed]': 'selected() === undefined ? null : selected() ? "true" : "false"',
    '[attr.data-selected]': 'selected() ? "" : null',
  },
  template: `
    @if (selected()) {
      <span #icon data-part="icon" aria-hidden="true"><svg dsIcon name="check" [size]="resolvedSize() === 'xs' ? 'sm' : 'md'"></svg></span>
    }
    <span data-part="label"><ng-content /></span>
  `,
})
export class StandInChip extends DsButtonBase {
  readonly emphasis = input<ButtonEmphasis | undefined>(undefined);
  protected readonly defaultEmphasis: ButtonEmphasis = 'soft';
  /** A chip is a pill by default. */
  override readonly shape = input<ButtonShape | undefined>('pill');
  /** Pressed state of a filter chip. Shows the check in place of a start icon. */
  readonly selected = input<boolean | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v === undefined ? undefined : booleanAttribute(v)),
  });

  private readonly icon = viewChild<ElementRef<HTMLSpanElement>>('icon');

  constructor() {
    super();
    consumeHostAttributes(['dsStandInChip', 'selected']);
    const motion = injectMotion();
    let lastSelected: boolean | undefined;
    let painted = false;
    afterRenderEffect(() => {
      const selected = this.selected();
      const icon = this.icon()?.nativeElement;
      untracked(() => {
        const changed = painted && lastSelected !== selected;
        painted = true;
        lastSelected = selected;
        if (changed) iconMorph({ to: icon?.firstElementChild, turn: 45, mode: motion.mode('chip-check-pop') });
      });
    });
  }
}
