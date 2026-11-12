// Meter: a measured value in a known range, such as storage used or a score.
// The twin of packages/react/src/components/Meter/Meter.tsx, on the same DOM,
// so Meter.css applies as is. The level and the tone come from the shared
// rule (`@the-system/shared` meter.ts), as in React.
//
//   <div role="meter" aria-valuenow aria-valuemin aria-valuemax aria-valuetext
//        data-ds="meter" data-size data-tone data-level>
//     <span data-part="label" id>       when label is set
//     <span data-part="value">
//     <span data-part="track"><span data-part="indicator" style="--_meter-fraction: f">
//
//   <div dsMeter [value]="72" [max]="100" [low]="60" [high]="85" [optimum]="0" label="Storage used"></div>
import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  isDevMode,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { meterLevel, meterLevelLabelsFor, meterTone, type MeterLevel, type MeterTone, type Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme';
import { formatPercent, validMax } from '../progress-bar/format';
import type { ProgressLabelContent } from '../progress-bar/progress-bar';

export type MeterSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type { MeterLevel, MeterTone };

function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

let nextId = 0;

@Component({
  selector: 'div[dsMeter]',
  exportAs: 'dsMeter',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'meter',
    'data-ds': 'meter',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-valuetext]': 'ariaText()',
    '[attr.aria-valuenow]': 'clamped()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-level]': 'level()',
  },
  template: `
    @if (hasLabel()) {
      <span data-part="label" [id]="labelId">@if (labelTemplate(); as tpl) {<ng-container [ngTemplateOutlet]="tpl" />} @else {<ng-container>{{ labelText() }}</ng-container>}</span>
    }
    <span data-part="value">{{ text() }}</span>
    <span data-part="track"><span [style.--_meter-fraction]="fraction()" data-part="indicator"></span></span>
  `,
})
export class DsMeter {
  /** The measured value. Clamped into [min, max]. */
  readonly value = input.required<number>();
  /** Default 0. */
  readonly min = input<number>(0);
  /** Default 100. */
  readonly maxInput = input<number | undefined>(undefined, { alias: 'max' });
  /** The top of the low region, as in the HTML meter. Default: no low region. */
  readonly low = input<number | undefined>(undefined);
  /** The bottom of the high region. Default: no high region. */
  readonly high = input<number | undefined>(undefined);
  /** The best value. Sets the tone: success in its region, warning one region away, danger two away. */
  readonly optimum = input<number | undefined>(undefined);
  /** Visible text that names the measure. It labels the meter. Without it, pass aria-label. */
  readonly label = input<ProgressLabelContent | null | undefined>(undefined);
  /** Builds the value text from the clamped value, min and max. Default: a whole percent of the range. */
  readonly valueText = input<((value: number, min: number, max: number) => string) | undefined>(undefined);
  /** Words for each level, shown after the value and read in aria-valuetext. Default Low, Medium, High (Arabic under lang ar). */
  readonly levelLabels = input<Partial<Record<MeterLevel, string>> | undefined>(undefined);
  /** Shows the level word after the value. Default true when low or high is set. */
  readonly showLevel = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Overrides the tone the thresholds give. Prefer thresholds. */
  readonly tone = input<MeterTone | undefined>(undefined);
  /** Track thickness: sm 4, md 8, lg 12 px. Default md. */
  readonly size = input<MeterSize>('md');
  /** The accessible name when there is no visible label. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Points the name at other elements; wins over the label part. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  private readonly theme = inject(DsThemeService);
  protected readonly labelId = `ds-meter-label-${++nextId}`;

  readonly max = computed(() => validMax(this.maxInput(), this.min(), this.min() + 100));
  readonly clamped = computed(() => {
    const v = this.value();
    return Number.isFinite(v) ? Math.min(this.max(), Math.max(this.min(), v)) : this.min();
  });
  private readonly range = computed(() => ({
    min: this.min(),
    max: this.max(),
    low: this.low(),
    high: this.high(),
    optimum: this.optimum(),
  }));
  readonly level = computed(() => meterLevel(this.clamped(), this.range()));
  readonly resolvedTone = computed(() => this.tone() ?? meterTone(this.clamped(), this.range()));
  protected readonly fraction = computed(() => (this.clamped() - this.min()) / (this.max() - this.min()));
  private readonly amount = computed(() => {
    const fn = this.valueText();
    return fn ? fn(this.clamped(), this.min(), this.max()) : formatPercent(this.fraction(), this.theme.value().lang);
  });
  private readonly hasRegions = computed(() => this.low() !== undefined || this.high() !== undefined);
  private readonly withLevel = computed(() => this.showLevel() ?? this.hasRegions());
  private readonly spoken = computed(() => {
    const word = { ...meterLevelLabelsFor(this.theme.value().lang), ...this.levelLabels() }[this.level()];
    // The comma follows the script of the level word, not the page.
    return `${this.amount()}${/[؀-ۿ]/.test(word) ? '، ' : ', '}${word}`;
  });
  readonly text = computed(() => (this.withLevel() ? this.spoken() : this.amount()));
  /** aria-valuetext says the level whenever there are thresholds, so it is never left to color alone. */
  readonly ariaText = computed(() => (this.withLevel() || this.hasRegions() ? this.spoken() : this.amount()));
  protected readonly hasLabel = computed(() => {
    const label = this.label();
    return label !== undefined && label !== null && label !== '';
  });
  protected readonly labelText = computed(() => {
    const label = this.label();
    return typeof label === 'string' ? label : null;
  });
  protected readonly labelTemplate = computed(() => {
    const label = this.label();
    return typeof label === 'string' || label == null ? null : label;
  });
  protected readonly labelledBy = computed(
    () => this.ariaLabelledby() ?? (this.hasLabel() && this.ariaLabel() === undefined ? this.labelId : null),
  );

  constructor() {
    consumeHostAttributes([
      'dsMeter', 'value', 'min', 'max', 'low', 'high', 'optimum', 'label', 'valueText', 'levelLabels', 'showLevel', 'tone', 'size',
      'aria-label', 'aria-labelledby',
    ]);
    if (isDevMode()) {
      afterNextRender(() => {
        if (!this.hasLabel() && this.ariaLabel() === undefined && this.ariaLabelledby() === undefined) {
          console.warn('Meter: no accessible name. Pass label, or aria-label when the meter has no visible text.');
        }
      });
    }
  }
}
