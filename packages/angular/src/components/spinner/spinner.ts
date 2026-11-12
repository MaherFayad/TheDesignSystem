// Spinner: a small busy sign for work of unknown length. The twin of
// packages/react/src/components/Spinner/Spinner.tsx, on the same DOM, so
// Spinner.css applies as is. The host element is the root:
//
//   <span dsSpinner label="Loading files"></span>
//   <span dsSpinner size="sm" decorative></span>
//
// With `label`: role status and a visually hidden label part. `decorative`:
// aria-hidden, no role and no label. React types the pair as a union (a
// label is required unless decorative); Angular cannot, so a labelled
// spinner with no label warns in development.
import { ChangeDetectionStrategy, Component, booleanAttribute, input, isDevMode, afterNextRender } from '@angular/core';
import type { Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';

export type SpinnerSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type SpinnerTone = Extract<Tone, 'neutral' | 'accent'>;

@Component({
  selector: 'span[dsSpinner]',
  exportAs: 'dsSpinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'spinner',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.role]': 'decorative() ? null : "status"',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
  },
  template: `
    @if (!decorative()) {
      <span data-part="label">{{ label() }}</span>
    }
  `,
})
export class DsSpinner {
  /** Ring size: xs 12, sm 16, md 24, lg 36 px. Default md. */
  readonly size = input<SpinnerSize>('md');
  /** neutral draws the arc in the text color, accent in the primary mark color of the style. Default neutral. */
  readonly tone = input<SpinnerTone>('neutral');
  /** The accessible name, said by the status region: "Loading files". Required unless decorative. */
  readonly label = input<string | undefined>(undefined);
  /** Hides the spinner from assistive tech. Use it when visible text or an aria-busy parent already says the area is busy. */
  readonly decorative = input(false, { transform: booleanAttribute });

  constructor() {
    consumeHostAttributes(['dsSpinner', 'size', 'tone', 'label', 'decorative']);
    if (isDevMode()) {
      afterNextRender(() => {
        if (!this.decorative() && !this.label()) console.warn('Spinner: no label. Pass label, or decorative when visible text says the area is busy.');
      });
    }
  }
}
