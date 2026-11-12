// RangeSlider: a low and a high value on one track, such as a price range.
// The twin of packages/react/src/components/RangeSlider/RangeSlider.tsx,
// built on the DsSlider body (../slider/slider-base.ts) with two thumbs. The
// host is the root (`div[dsRangeSlider]`).
//
//   <div dsRangeSlider label="Price" unit="SAR" [max]="1000" [thumbLabels]="['Minimum price', 'Maximum price']" [(value)]="price"></div>
//
// Each thumb is its own tab stop with its own name and the Slider keys; the
// thumbs cannot cross, by key or by drag. Home and End move the focused
// thumb as far as the other allows. With a label, the root is a group named
// by it.
//
// The thumb that last had focus or a press carries `data-active` and its
// wrapper gets `z-index: 1` in the inline position style, so when the two
// thumbs overlap at a narrow width the one drawn on top is the one a press
// reaches (WCAG 2.5.8). This is the review fix of batch 3 and 4; React does
// not stamp it yet.
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`; `onValueCommit` is the `valueCommit` output. `thumbLabels`
// and `defaultValue` also take a plain array, because an array literal in a
// template is typed as an array, not a pair.
// `aria-describedby` is an input, because React sends it to the thumbs.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { consumeHostAttributes } from '../../internal/host';
import { DsOrderedStyle } from '../../internal/ordered-style';
import { DsSliderBase, sliderHostInputs, sliderTemplate } from '../slider/slider-base';

export type RangeSliderValue = [number, number];

@Component({
  selector: 'div[dsRangeSlider]',
  exportAs: 'dsRangeSlider',
  imports: [DsOrderedStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsRangeSlider), multi: true }],
  host: {
    'data-ds': 'range-slider',
    '[attr.role]': 'isGroup() ? "group" : null',
    '[attr.aria-labelledby]': 'isGroup() ? labelId : null',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-dragging]': 'dragging() ? "" : null',
  },
  template: sliderTemplate,
})
export class DsRangeSlider extends DsSliderBase implements ControlValueAccessor {
  /** The low and high values. Two way: `[(value)]`. Left out, the slider starts at defaultValue. */
  readonly value = model<RangeSliderValue | undefined>(undefined);
  /** Uncontrolled starting values, low then high. Default [min, max]. */
  readonly defaultValue = input<RangeSliderValue | readonly number[] | undefined>(undefined);
  /** The accessible name of each thumb, start then end. Required: two thumbs with one name cannot be told apart. */
  readonly thumbLabels = input.required<readonly [string, string] | readonly string[]>();
  /** Steps that must stay between the thumbs, so they never cross. Default 1. */
  readonly minStepsBetweenThumbs = input(1);
  /** Called once when a drag ends or a key changes a value. Save here. */
  readonly valueCommit = output<RangeSliderValue>();

  protected readonly kind = 'range-slider';
  protected readonly preserveThumbOrder = true;
  protected override readonly thumbIds = ['start', 'end'] as const;
  protected override readonly raiseActiveThumb = true;
  protected readonly minSteps = this.minStepsBetweenThumbs;
  protected readonly own = linkedSignal<number[]>(() => [...(this.value() ?? this.defaultValue() ?? [this.min(), this.max()])]);

  private onChange: (value: RangeSliderValue) => void = () => {};

  constructor() {
    super();
    consumeHostAttributes(['dsRangeSlider', ...sliderHostInputs, 'thumbLabels']);
    this.setUp(inject(DestroyRef));
  }

  protected override thumbOwnLabel(index: number): string | undefined {
    return this.thumbLabels()[index];
  }

  private pair(next: number[]): RangeSliderValue {
    return [next[0] ?? this.min(), next[1] ?? this.max()];
  }

  protected emitValue(next: number[]): void {
    const v = this.pair(next);
    this.value.set(v);
    this.onChange(v);
  }

  protected emitCommit(next: number[]): void {
    this.valueCommit.emit(this.pair(next));
  }

  writeValue(value: RangeSliderValue | null | undefined): void {
    this.own.set([...(value ?? [this.min(), this.max()])]);
  }

  registerOnChange(fn: (value: RangeSliderValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
