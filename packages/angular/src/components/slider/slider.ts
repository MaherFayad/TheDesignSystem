// Slider: one value on a range. The twin of Slider in
// packages/react/src/components/Slider/Slider.tsx. The host is the root
// (`div[dsSlider]`); the template (slider-base.ts) renders the parts in the
// React order: the label, the value, the control (track, range, thumb) and
// the marks.
//
//   <div dsSlider label="Opacity" unit="%" [(value)]="opacity" (valueCommit)="save($event)"></div>
//   <div dsSlider label="Volume" [formControl]="volume"></div>
//
// Arrows move by one step (in the reading direction in right to left text),
// PageUp and PageDown and Shift with an arrow by ten steps, Home and End to
// the ends. Every drag has this key path (WCAG 2.5.7). Keys and pointer are
// hand built with the Radix DOM and arithmetic (see slider-base.ts).
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`; `onValueCommit` is the `valueCommit` output. `aria-label`,
// `aria-labelledby` and `aria-describedby` are inputs, because React sends
// them to the thumb. `label` and mark labels take text. `rootProps`,
// `className` and `style` have no form: the host is the root.
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
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { consumeHostAttributes } from '../../internal/host';
import { DsOrderedStyle } from '../../internal/ordered-style';
import { DsSliderBase, sliderHostInputs, sliderTemplate } from './slider-base';

@Component({
  selector: 'div[dsSlider]',
  exportAs: 'dsSlider',
  imports: [DsOrderedStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsSlider), multi: true }],
  host: {
    'data-ds': 'slider',
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
export class DsSlider extends DsSliderBase implements ControlValueAccessor {
  /** The value. Two way: `[(value)]`. Left out, the slider starts at defaultValue. */
  readonly value = model<number | undefined>(undefined);
  /** Uncontrolled starting value. Default min. */
  readonly defaultValue = input<number | undefined>(undefined);
  /** The accessible name when there is no visible label. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  /** Called once when a drag ends or a key changes the value. Save here. */
  readonly valueCommit = output<number>();

  protected readonly kind = 'slider';
  protected readonly preserveThumbOrder = false;
  protected readonly minSteps = signal(0);
  protected readonly own = linkedSignal<number[]>(() => [this.value() ?? this.defaultValue() ?? this.min()]);

  private onChange: (value: number) => void = () => {};

  constructor() {
    super();
    consumeHostAttributes(['dsSlider', ...sliderHostInputs, 'aria-label', 'aria-labelledby']);
    this.setUp(inject(DestroyRef));
  }

  protected override ariaLabelInput(): string | undefined {
    return this.ariaLabel();
  }

  protected override ariaLabelledbyInput(): string | undefined {
    return this.ariaLabelledby();
  }

  protected emitValue(next: number[]): void {
    const v = next[0] ?? this.min();
    this.value.set(v);
    this.onChange(v);
  }

  protected emitCommit(next: number[]): void {
    this.valueCommit.emit(next[0] ?? this.min());
  }

  writeValue(value: number | null | undefined): void {
    this.own.set([value ?? this.min()]);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
