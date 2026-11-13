// Private stand in for the pressable Chip, not exported.
//
// Chip has no Angular port in this checkout. FilterBar renders its quick
// filters as pressable chips, so this renders the DOM of React's pressable
// Chip (ButtonRoot with data-ds chip, aria-pressed, data-selected, the check
// icon while selected, the label) on the shared Button base, and Chip.css
// applies as is. Swap it for the Chip port when it lands: the DOM stays the
// same.
//
// chip-check-pop (order 1.23), as React's PressableChip: selecting draws the
// check (it pops in past its size and back) while the label slides over to
// make room; clearing turns the start glyph back in (iconMorph). Not on first
// paint. Platform hook: a press writes --_chip-press-x and -press-y.
import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, booleanAttribute, input, untracked, viewChild } from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import { ANIMATION_ID_PREFIX, iconMorph, readDuration, readEasing } from '@the-system/motion';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { drawCheck, drawnScale, setPressPoint } from '../../internal/selection-marker';
import { DsButtonBase, type ButtonEmphasis, type ButtonShape } from '../button/button-base';

@Component({
  selector: 'button[dsStandInChip]',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'chip',
    '[attr.aria-pressed]': 'selected() === undefined ? null : selected() ? "true" : "false"',
    '[attr.data-selected]': 'selected() ? "" : null',
    '(pointerdown)': 'onPressPoint($event)',
  },
  template: `
    @if (selected()) {
      <span #icon data-part="icon" aria-hidden="true"><svg dsIcon name="check" [size]="resolvedSize() === 'xs' ? 'sm' : 'md'"></svg></span>
    }
    <span #label data-part="label"><ng-content /></span>
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
  private readonly label = viewChild.required<ElementRef<HTMLSpanElement>>('label');

  constructor() {
    super();
    consumeHostAttributes(['dsStandInChip', 'selected']);
    const motion = injectMotion();
    let lastSelected: boolean | undefined;
    let painted = false;
    let labelAt: number | null = null;
    afterRenderEffect(() => {
      const selected = this.selected();
      const icon = this.icon()?.nativeElement;
      const label = this.label().nativeElement;
      untracked(() => {
        const was = labelAt;
        // The label's offset from the chip's inline start, so a move of the whole chip is not read as a slide.
        const root = label.parentElement;
        let now: number | null = null;
        if (root) {
          const l = label.getBoundingClientRect();
          const r = root.getBoundingClientRect();
          const k = drawnScale(root);
          now = (getComputedStyle(root).direction === 'rtl' ? l.right - r.right : l.left - r.left) / k;
        }
        labelAt = now;
        const changed = painted && lastSelected !== selected;
        painted = true;
        lastSelected = selected;
        if (!changed) return;
        const mode = motion.mode('chip-check-pop');
        if (selected) drawCheck(icon, mode);
        else iconMorph({ to: icon?.firstElementChild, turn: 45, mode });
        // The label moves when the check takes or gives back its room: it slides there instead of jumping.
        if (was !== null && now !== null && Math.abs(was - now) > 0.5 && mode === 'full' && typeof label.animate === 'function') {
          const duration = readDuration(label, 'duration.spring-snappy');
          if (duration > 0)
            label.animate([{ transform: `translateX(${Math.round((was - now) * 100) / 100}px)` }, { transform: 'none' }], {
              id: `${ANIMATION_ID_PREFIX}chip-check-pop`,
              duration,
              easing: readEasing(label, 'ease.spring-snappy'),
            });
        }
      });
    });
  }

  /** Platform hook: where the press landed, for a ripple from the touch point. */
  protected onPressPoint(event: PointerEvent): void {
    setPressPoint(this.host, 'chip', event.clientX, event.clientY);
  }
}
