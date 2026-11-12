// ProgressCircle: compact progress in a ring, for a file chip, a card corner
// or a table cell. The twin of
// packages/react/src/components/ProgressCircle/ProgressCircle.tsx, on the
// DOM Radix Progress renders there, so ProgressCircle.css applies as is:
//
//   <div role="progressbar" aria-label aria-valuemin aria-valuemax aria-valuenow aria-valuetext
//        data-state data-value data-max data-ds="progress-circle" data-size data-tone>
//     <span data-part="track">
//     <span data-part="indicator" data-state data-value data-max style="--_progress-circle-fraction: f">
//     <span data-part="value" aria-hidden="true">     md and lg, with a value
//
//   <div dsProgressCircle [value]="46" label="Uploading files"></div>
//
// Motion (order 1.22), as React plays it (internal/motion-feedback.ts).
// progress-spring: the new arc starts turned back by the change and turns
// into place on the soft spring, while the value inside rolls digit by
// digit. progress-celebrate: reaching max after being below it pops the
// ring once.
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { Celebrate, DigitRoller, sweepRing } from '../../internal/motion-feedback';
import { DsThemeService } from '../../theme';
import { clampValue, formatPercent, loadingLabelFor, progressState, validMax } from '../progress-bar/format';

export type ProgressCircleSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type ProgressCircleTone = Extract<Tone, 'accent' | 'success' | 'warning' | 'danger'>;

/** undefined keeps the default by size; a boolean attribute still reads as true. */
function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

@Component({
  selector: 'div[dsProgressCircle]',
  exportAs: 'dsProgressCircle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'data-ds': 'progress-circle',
    'aria-valuemin': '0',
    '[attr.aria-label]': 'ariaLabel() ?? label()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'clamped()',
    '[attr.aria-valuetext]': 'text()',
    '[attr.data-state]': 'state()',
    '[attr.data-value]': 'clamped()',
    '[attr.data-max]': 'max()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
  },
  template: `
    <span data-part="track"></span>
    <span [attr.data-state]="state()" [attr.data-value]="clamped()" [attr.data-max]="max()"
      [style.--_progress-circle-fraction]="fraction()" data-part="indicator" #indicator></span>
    @if (visibleValue()) {
      <span data-part="value" aria-hidden="true" #valueEl>{{ text() }}</span>
    }
  `,
})
export class DsProgressCircle {
  /** Progress from 0 to max. null or undefined is the indeterminate form. Out of range values are clamped. */
  readonly value = input<number | null | undefined>(undefined);
  /** The value that means done. Default 100. */
  readonly maxInput = input<number | undefined>(undefined, { alias: 'max' });
  /** The accessible name: the ring has no room for visible text. Required. */
  readonly label = input.required<string>();
  /** Shows the value text inside the ring. Default true at md and lg, false at xs and sm. */
  readonly showValue = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Builds the value text and aria-valuetext from the clamped value and max. Default: a whole percent. */
  readonly valueText = input<((value: number, max: number) => string) | undefined>(undefined);
  /** What aria-valuetext says while indeterminate. Default "Loading", Arabic under lang ar. */
  readonly loadingLabel = input<string | undefined>(undefined);
  /** Ring diameter: xs 16, sm 24, md 44, lg 68 px at the default density. Default md. */
  readonly size = input<ProgressCircleSize>('md');
  /** Indicator color. accent is the primary mark color of the style. Default accent. */
  readonly tone = input<ProgressCircleTone>('accent');
  /** Overrides the name from label, as a spread aria-label does in React. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  private readonly theme = inject(DsThemeService);
  private readonly motion = injectMotion();
  private readonly indicator = viewChild.required<ElementRef<HTMLElement>>('indicator');
  private readonly valueEl = viewChild<ElementRef<HTMLElement>>('valueEl');

  readonly max = computed(() => validMax(this.maxInput(), 0, 100));
  readonly clamped = computed(() => clampValue(this.value(), 0, this.max()));
  readonly state = computed(() => progressState(this.clamped(), this.max()));
  readonly text = computed(() => {
    const value = this.clamped();
    const max = this.max();
    const lang = this.theme.value().lang;
    if (value === null) return this.loadingLabel() ?? loadingLabelFor(lang);
    const fn = this.valueText();
    return fn ? fn(value, max) : formatPercent(value / max, lang);
  });
  protected readonly fraction = computed(() => {
    const value = this.clamped();
    return value === null ? 0 : value / this.max();
  });
  protected readonly visibleValue = computed(() => {
    const size = this.size();
    return (this.showValue() ?? (size === 'md' || size === 'lg')) && this.clamped() !== null;
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const celebrate = new Celebrate();
    const roller = new DigitRoller();
    let lastFraction: number | null | undefined;
    afterRenderEffect(() => {
      const value = this.clamped();
      const fraction = this.fraction();
      const text = this.text();
      const visible = this.visibleValue();
      celebrate.update(host, value !== null && value >= this.max(), this.motion.mode('progress-celebrate'), 'both');
      const mode = this.motion.mode('progress-spring');
      const before = lastFraction === undefined ? (value === null ? null : fraction) : lastFraction;
      lastFraction = value === null ? null : fraction;
      if (before !== null && value !== null && before !== fraction && mode === 'full') sweepRing(this.indicator().nativeElement, before, fraction);
      roller.update(this.valueEl()?.nativeElement, visible ? text : undefined, mode, value ?? undefined);
    });
    consumeHostAttributes(['dsProgressCircle', 'value', 'max', 'label', 'showValue', 'valueText', 'loadingLabel', 'size', 'tone', 'aria-label']);
  }
}
