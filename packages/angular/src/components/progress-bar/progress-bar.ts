// ProgressBar: how far a task has come, or that it runs with no known end.
// The twin of packages/react/src/components/ProgressBar/ProgressBar.tsx, on
// the DOM Radix Progress renders there, so ProgressBar.css applies as is:
//
//   <div role="progressbar" aria-valuemin aria-valuemax aria-valuenow aria-valuetext
//        data-state data-value data-max data-ds="progress-bar" data-size data-tone>
//     <span data-part="label" id>       when label is set
//     <span data-part="value">          unless showValue is false
//     <span data-part="track">
//       <span data-part="indicator" data-state data-value data-max style="--_progress-bar-fraction: f">
//
//   <div dsProgressBar [value]="46" label="Uploading files"></div>
//   <div dsProgressBar [value]="60" aria-label="Import progress" [showValue]="false"></div>
//
// Behavior: hand built (Radix Progress is attributes only). The state words
// are the Radix ones: indeterminate, loading, complete.
//
// Motion (order 1.22): progress-spring is CSS (ProgressBar.css; round 3
// cuts the fill with clip-path, no DOM change); progress-celebrate pops the
// track once per completion and (round 3) sends a halo from it, as React
// plays it.
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  isDevMode,
  afterNextRender,
  afterRenderEffect,
  viewChild,
  type ElementRef,
  type TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { Celebrate } from '@the-system/motion';
import { DsThemeService } from '../../theme';
import { clampValue, formatPercent, loadingLabelFor, progressState, validMax } from './format';

export type ProgressBarSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type ProgressBarTone = Extract<Tone, 'accent' | 'success' | 'warning' | 'danger'>;
/** Visible text: a string, or a template for richer content. */
export type ProgressLabelContent = string | TemplateRef<unknown>;

let nextId = 0;

@Component({
  selector: 'div[dsProgressBar]',
  exportAs: 'dsProgressBar',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'data-ds': 'progress-bar',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'clamped()',
    '[attr.aria-valuetext]': 'text()',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.data-state]': 'state()',
    '[attr.data-value]': 'clamped()',
    '[attr.data-max]': 'max()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
  },
  template: `
    @if (hasLabel()) {
      <span data-part="label" [id]="labelId">@if (labelTemplate(); as tpl) {<ng-container [ngTemplateOutlet]="tpl" />} @else {<ng-container>{{ labelText() }}</ng-container>}</span>
    }
    @if (showValue()) {
      <span data-part="value">{{ text() }}</span>
    }
    <span data-part="track" #track>
      <span [attr.data-state]="state()" [attr.data-value]="clamped()" [attr.data-max]="max()"
        [style.--_progress-bar-fraction]="fraction()" data-part="indicator"></span>
    </span>
  `,
})
export class DsProgressBar {
  /** Progress from 0 to max. null or undefined is the indeterminate form. Out of range values are clamped. */
  readonly value = input<number | null | undefined>(undefined);
  /** The value that means done. Default 100. */
  readonly maxInput = input<number | undefined>(undefined, { alias: 'max' });
  /** Visible text above the track that names the task. It labels the progressbar. Without it, pass aria-label. */
  readonly label = input<ProgressLabelContent | null | undefined>(undefined);
  /** Shows the value text at the end of the label row. Default true. */
  readonly showValue = input(true, { transform: booleanAttribute });
  /** Builds the value text from the clamped value and max, for the visible value and aria-valuetext. Default: a whole percent. */
  readonly valueText = input<((value: number, max: number) => string) | undefined>(undefined);
  /** What the value and aria-valuetext say while indeterminate. Default "Loading", Arabic under lang ar. */
  readonly loadingLabel = input<string | undefined>(undefined);
  /** Track thickness: sm 4, md 8, lg 12 px. Default md. */
  readonly size = input<ProgressBarSize>('md');
  /** Indicator color. accent is the primary mark color of the style. Default accent. */
  readonly tone = input<ProgressBarTone>('accent');
  /** The accessible name when there is no visible label. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Points the name at other elements; wins over the label part. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  private readonly theme = inject(DsThemeService);
  private readonly motion = injectMotion();
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  protected readonly labelId = `ds-progress-bar-label-${++nextId}`;

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
    // progress-celebrate (order 1.22): the track dips and pops on the block axis once per completion, never on a first paint at max; round 3 adds the halo.
    const celebrate = new Celebrate();
    afterRenderEffect(() => {
      const value = this.clamped();
      const done = value !== null && value >= this.max();
      celebrate.update(this.track().nativeElement, done, this.motion.mode('progress-celebrate'), 'block');
    });
    consumeHostAttributes(['dsProgressBar', 'value', 'max', 'label', 'showValue', 'valueText', 'loadingLabel', 'size', 'tone', 'aria-label', 'aria-labelledby']);
    if (isDevMode()) {
      afterNextRender(() => {
        if (!this.hasLabel() && this.ariaLabel() === undefined && this.ariaLabelledby() === undefined) {
          console.warn('ProgressBar: no accessible name. Pass label, or aria-label when the bar has no visible text.');
        }
      });
    }
  }
}
