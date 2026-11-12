// The shared body of DsSlider and DsRangeSlider: the twin of SliderBase in
// packages/react/src/components/Slider/Slider.tsx. A label row (label and
// value), the Radix slider as the control (track, range, thumbs) and
// optional marks.
//
// React gets the behavior from Radix Slider. Here the keys and the pointer
// are hand built (no CDK slider, it renders another DOM), with the Radix DOM
// copied exactly: the control span with `dir`, `aria-disabled` and the
// `--radix-slider-thumb-transform` style, the thumb wrapper span with its
// inline position style, the role slider thumbs, and a hidden input per
// thumb inside a form. The arithmetic (snap to step, keep the thumbs in
// bounds, the closest thumb to a press) is the Radix arithmetic. Arrow keys
// follow the reading direction of the CDK Directionality, which the nearest
// dsTheme provides. Angular Aria has no slider pattern today; this stays
// hand built. The thumb carries `data-radix-collection-item` and an empty
// `style` attribute, as the Radix thumb does, so the DOM is the same.
import {
  Directive,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChildren,
  type DestroyRef,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import type { Size, Tone } from '@the-system/shared';
import { optionalBoolean } from '../../internal/optional-boolean';
import type { OrderedStyle } from '../../internal/ordered-style';
import { DsThemeService } from '../../theme/theme';
import { DsField } from '../field/field';
import { formatSliderValue } from './format';

export type SliderSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type SliderTone = Extract<Tone, 'accent'>;
export type SliderOrientation = 'horizontal' | 'vertical';

/** A tick under the track at a value, with optional text. */
export interface SliderMark {
  value: number;
  label?: string;
}

const PAGE_KEYS = ['PageUp', 'PageDown'];
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const BACK_KEYS: Record<string, string[]> = {
  'from-left': ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'],
  'from-right': ['Home', 'PageDown', 'ArrowDown', 'ArrowRight'],
  'from-bottom': ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'],
  'from-top': ['Home', 'PageDown', 'ArrowUp', 'ArrowLeft'],
};

/** The template both components render. The host is the root. */
export const sliderTemplate = `@if (hasLabel()) {<span [id]="labelId" data-part="label">{{ label() }}</span>}@if (valueShown()) {<output data-part="value" aria-hidden="true">@for (v of values(); track $index) {@if ($index > 0) {<ng-container>{{ ' - ' }}</ng-container>}<bdi>{{ format()(v) }}</bdi>}</output>}<span #control
      data-part="control"
      [attr.aria-disabled]="isDisabled() ? 'true' : 'false'"
      [attr.data-disabled]="isDisabled() ? '' : null"
      [attr.dir]="dir()"
      [attr.data-orientation]="orientation()"
      [dsOrderedStyle]="controlStyle()"
      (keydown)="onKeydown($event)"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (lostpointercapture)="dragging.set(false)"><span data-part="track" [attr.data-disabled]="isDisabled() ? '' : null" [attr.data-orientation]="orientation()"><span data-part="range" [attr.data-orientation]="orientation()" [attr.data-disabled]="isDisabled() ? '' : null" [dsOrderedStyle]="rangeStyle()"></span></span>@for (v of values(); track $index; let i = $index) {<span [dsOrderedStyle]="thumbWrapStyles()[i]"><span #thumb
      role="slider"
      [attr.aria-label]="thumbAriaLabels()[i] ?? null"
      [attr.aria-valuemin]="min()"
      [attr.aria-valuenow]="v"
      [attr.aria-valuemax]="max()"
      [attr.aria-orientation]="orientation()"
      [attr.data-orientation]="orientation()"
      [attr.data-disabled]="isDisabled() ? '' : null"
      [attr.tabindex]="isDisabled() ? null : 0"
      [attr.id]="i === 0 ? (controlId() ?? null) : null"
      data-part="thumb"
      data-radix-collection-item=""
      [attr.style]="''"
      [attr.data-thumb]="thumbId(i)"
      [attr.data-active]="activeThumb() === i ? '' : null"
      [attr.aria-labelledby]="thumbLabelledBy()[i] ?? null"
      [attr.aria-valuetext]="format()(v)"
      [attr.aria-describedby]="describedBy() ?? null"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      (focus)="onThumbFocus(i)"
      (blur)="onTouched()"></span></span>@if (isFormControl()) {<input [dsOrderedStyle]="hiddenStyle" [attr.name]="inputName() ?? null" [attr.value]="v" [value]="v" />}}</span>@if (showMarks()) {<div data-part="marks" aria-hidden="true">@for (mark of markList(); track mark.value; let m = $index) {<span data-mark="" [dsOrderedStyle]="markStyles()[m]">{{ mark.label }}</span>}</div>}`;

/** The input names both components consume from the host. */
export const sliderHostInputs = [
  'size', 'tone', 'label', 'showValue', 'unit', 'formatOptions', 'formatValue', 'marks', 'invalid', 'disabled',
  'min', 'max', 'step', 'orientation', 'id', 'name', 'aria-describedby', 'minStepsBetweenThumbs', 'value', 'defaultValue',
] as const;

function getDecimalCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const str = value.toString();
  if (str.includes('e')) {
    const [coefficient = '', exponent = '0'] = str.split('e');
    return Math.max(0, (coefficient.split('.')[1] || '').length - Number(exponent));
  }
  return str.split('.')[1]?.length ?? 0;
}

function roundValue(value: number, decimalCount: number): number {
  const rounder = Math.pow(10, decimalCount);
  return Math.round(value * rounder) / rounder;
}

function clampTo(value: number, [lo, hi]: [number, number]): number {
  return Math.min(hi, Math.max(lo, value));
}

function linearScale(input: [number, number], output: [number, number]): (value: number) => number {
  return (value) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
}

/** Where a value sits on the track, 0 to 100. */
export function valueToPercent(value: number, min: number, max: number): number {
  return clampTo((100 / (max - min)) * (value - min), [0, 100]);
}

/** Radix keeps a thumb inside the track at the ends: half its size, scaled down toward the middle. */
export function thumbInBoundsOffset(size: number, percent: number, direction: number): number {
  const half = size / 2;
  const offset = linearScale([0, 50], [0, half]);
  return (half - offset(percent) * direction) * direction;
}

/** The step a key moves a value to, as Radix computes it. */
export function nextStepValue(value: number, min: number, step: number, direction: number, multiplier: number): number {
  const decimalCount = getDecimalCount(step);
  const stepsFromMin = (value - min) / step;
  const nearestSteps = Math.round(stepsFromMin);
  const isAligned = roundValue(nearestSteps * step + min, decimalCount) === roundValue(value, decimalCount);
  let nextSteps: number;
  if (isAligned) nextSteps = nearestSteps + multiplier * direction;
  else if (direction > 0) nextSteps = Math.ceil(stepsFromMin);
  else nextSteps = Math.floor(stepsFromMin);
  return roundValue(nextSteps * step + min, decimalCount);
}

function closestValueIndex(values: readonly number[], next: number): number {
  if (values.length === 1) return 0;
  const distances = values.map((v) => Math.abs(v - next));
  return distances.indexOf(Math.min(...distances));
}

function hasMinStepsBetween(values: readonly number[], distance: number): boolean {
  if (distance <= 0) return true;
  const steps = values.slice(0, -1).map((v, i) => (values[i + 1] ?? v) - v);
  return Math.min(...steps) >= distance;
}

function toMark(mark: number | SliderMark): SliderMark {
  return typeof mark === 'number' ? { value: mark } : mark;
}

let nextId = 0;

@Directive()
export abstract class DsSliderBase {
  /** Track thickness and thumb size. The thumb is always at least a 24px target. Default md. */
  readonly size = input<SliderSize>('md');
  /** The range fill and the thumb. Only accent. */
  readonly tone = input<SliderTone>('accent');
  /** Visible name above the track. Names the thumb through aria-labelledby. */
  readonly label = input<string | null | undefined>(undefined);
  /** Shows the formatted value at the inline end of the label row. Default true when there is a label. */
  readonly showValue = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** A unit after the number, in the value text and aria-valuetext: %, px, SAR. */
  readonly unit = input<string | undefined>(undefined);
  /** Intl.NumberFormat options for the value text. Digits are always Western. */
  readonly formatOptions = input<Intl.NumberFormatOptions | undefined>(undefined);
  /** Full control of the value text, aria-valuetext included. */
  readonly formatValue = input<((value: number) => string) | undefined>(undefined);
  /** Ticks under the track. Numbers, or objects with a label. Horizontal only. */
  readonly marks = input<readonly (number | SliderMark)[] | undefined>(undefined);
  /** Inside a Field it follows the Field. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly orientation = input<SliderOrientation>('horizontal');
  /** The id of the first thumb. Inside a Field it defaults to the Field's control id. */
  readonly id = input<string | undefined>(undefined);
  /** The form name. With two thumbs each hidden input submits under `name[]`. */
  readonly name = input<string | undefined>(undefined);
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  protected abstract readonly kind: 'slider' | 'range-slider';
  /** The values the thumbs show, low to high. */
  protected abstract readonly own: WritableSignal<number[]>;
  /** Steps that must stay between thumbs. */
  protected abstract readonly minSteps: Signal<number>;
  /** RangeSlider keeps each thumb on its side; Slider sorts. */
  protected abstract readonly preserveThumbOrder: boolean;
  /** data-thumb on each thumb, for RangeSlider. */
  protected readonly thumbIds: readonly string[] | undefined = undefined;
  protected thumbId(index: number): string | null {
    return this.thumbIds?.[index] ?? null;
  }
  /** RangeSlider stamps data-active on the last thumb pressed or focused, and draws it on top. */
  protected readonly raiseActiveThumb: boolean = false;
  /** Writes the model and calls the form. */
  protected abstract emitValue(next: number[]): void;
  protected abstract emitCommit(next: number[]): void;
  /** The thumb's own name (thumbLabels), aria-labelledby and aria-label, per subclass. */
  protected thumbOwnLabel(_index: number): string | undefined {
    return undefined;
  }
  protected ariaLabelledbyInput(): string | undefined {
    return undefined;
  }
  protected ariaLabelInput(): string | undefined {
    return undefined;
  }

  private readonly field = inject(DsField, { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly directionality = inject(Directionality, { optional: true });
  private readonly control = viewChildren<ElementRef<HTMLElement>>('control');
  private readonly thumbs = viewChildren<ElementRef<HTMLElement>>('thumb');

  protected readonly labelId = `ds-slider-${++nextId}-label`;
  readonly dragging = signal(false);
  protected readonly isFormControl = signal(false);
  protected readonly activeThumb = signal<number | undefined>(undefined);
  private readonly thumbSizes = signal<readonly { width: number; height: number }[]>([]);
  protected readonly hiddenStyle: OrderedStyle = [['display', 'none']];

  private valueIndexToChange = 0;
  private keyboardInteraction = false;
  private valuesBeforeSlideStart: number[] = [];
  private rect: DOMRect | undefined;

  readonly values = computed(() => this.own());
  protected readonly dir = computed(() => this.directionality?.valueSignal() ?? 'ltr');
  protected readonly hasLabel = computed(() => {
    const l = this.label();
    return l !== undefined && l !== null;
  });
  protected readonly valueShown = computed(() => this.showValue() ?? this.hasLabel());
  readonly isInvalid = computed(() => this.invalid() ?? this.field?.isInvalid() ?? false);
  readonly isDisabled = computed(() => this.disabled() ?? this.formDisabled() ?? this.field?.disabled() ?? false);
  protected readonly formDisabled = signal<boolean | undefined>(undefined);
  protected readonly controlId = computed(() => this.id() ?? this.field?.controlId);
  protected readonly describedBy = computed(
    () => [this.field?.describedBy(), this.ariaDescribedby()].filter(Boolean).join(' ') || undefined,
  );
  protected readonly isGroup = computed(() => this.values().length > 1 && this.hasLabel());
  protected readonly format = computed(() => {
    const custom = this.formatValue();
    const lang = this.theme.value().lang;
    const unit = this.unit();
    const options = this.formatOptions();
    return (v: number) => custom?.(v) ?? formatSliderValue(v, lang, { unit, options });
  });
  protected readonly inputName = computed(() => {
    const name = this.name();
    return name ? name + (this.values().length > 1 ? '[]' : '') : undefined;
  });

  /** horizontal: from the left in ltr, from the right in rtl. vertical: from the bottom. */
  private readonly edges = computed(() => {
    if (this.orientation() === 'vertical') return { start: 'bottom', end: 'top', size: 'height' as const, direction: 1 };
    const fromLeft = this.dir() === 'ltr';
    return { start: fromLeft ? 'left' : 'right', end: fromLeft ? 'right' : 'left', size: 'width' as const, direction: fromLeft ? 1 : -1 };
  });
  protected readonly controlStyle = computed<OrderedStyle>(() => [
    ['--radix-slider-thumb-transform', this.orientation() === 'vertical' ? 'translateY(50%)' : 'translateX(-50%)'],
  ]);
  protected readonly rangeStyle = computed<OrderedStyle>(() => {
    const values = this.values();
    const percents = values.map((v) => valueToPercent(v, this.min(), this.max()));
    const offsetStart = values.length > 1 ? Math.min(...percents) : 0;
    const offsetEnd = 100 - Math.max(...percents);
    const { start, end } = this.edges();
    return [
      [start, offsetStart + '%'],
      [end, offsetEnd + '%'],
    ];
  });
  protected readonly thumbWrapStyles = computed<OrderedStyle[]>(() => {
    const { start, size, direction } = this.edges();
    const sizes = this.thumbSizes();
    const active = this.raiseActiveThumb ? this.activeThumb() : undefined;
    return this.values().map((v, i) => {
      const percent = valueToPercent(v, this.min(), this.max());
      const measured = sizes[i]?.[size];
      const offset = measured ? thumbInBoundsOffset(measured, percent, direction) : 0;
      const style: [string, string][] = [
        ['transform', 'var(--radix-slider-thumb-transform)'],
        ['position', 'absolute'],
        [start, `calc(${percent}% + ${offset}px)`],
      ];
      if (active === i) style.push(['z-index', '1']);
      return style;
    });
  });
  protected readonly thumbLabelledBy = computed(() => {
    const ariaLabel = this.ariaLabelInput();
    const fieldLabel = !ariaLabel ? this.field?.labelId : undefined;
    return this.values().map((_, i) =>
      this.thumbOwnLabel(i) ? undefined : (this.ariaLabelledbyInput() ?? (this.hasLabel() ? this.labelId : fieldLabel)),
    );
  });
  protected readonly thumbAriaLabels = computed(() => {
    const labelledBy = this.thumbLabelledBy();
    const count = this.values().length;
    return this.values().map((_, i) => {
      const own = this.thumbOwnLabel(i) ?? (labelledBy[i] ? undefined : this.ariaLabelInput());
      // Radix falls back to its own words for two or more thumbs.
      if (own) return own;
      if (count > 2) return `Value ${i + 1} of ${count}`;
      if (count === 2) return ['Minimum', 'Maximum'][i];
      return undefined;
    });
  });
  protected readonly showMarks = computed(() => (this.marks()?.length ?? 0) > 0 && this.orientation() === 'horizontal');
  protected readonly markList = computed(() => (this.marks() ?? []).map(toMark));
  protected readonly markStyles = computed<OrderedStyle[]>(() => {
    const min = this.min();
    const span = this.max() - min || 1;
    return this.markList().map((mark) => [['--_slider-mark-at', `${((mark.value - min) / span) * 100}%`]]);
  });

  protected onTouched: () => void = () => {};

  /** Wires measuring, forms and reset. Subclasses call it from their constructor. */
  protected setUp(destroyRef: DestroyRef): void {
    afterNextRender(() => {
      const thumbs = this.thumbs().map((t) => t.nativeElement);
      const measure = () => this.thumbSizes.set(thumbs.map((t) => ({ width: t.offsetWidth, height: t.offsetHeight })));
      measure();
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(measure);
        for (const t of thumbs) observer.observe(t, { box: 'border-box' });
        destroyRef.onDestroy(() => observer.disconnect());
      }
      const form = this.control()[0]?.nativeElement.closest('form');
      if (!form) return;
      this.isFormControl.set(true);
      const initial = this.own();
      const reset = () => this.change(initial);
      form.addEventListener('reset', reset);
      destroyRef.onDestroy(() => form.removeEventListener('reset', reset));
    });
  }

  /** The thumb elements, start first. */
  get nativeThumbs(): HTMLElement[] {
    return this.thumbs().map((t) => t.nativeElement);
  }

  focus(): void {
    this.nativeThumbs[0]?.focus();
  }

  private change(next: number[]): void {
    this.own.set(next);
    this.emitValue(next);
  }

  private commit(next: number[]): void {
    this.dragging.set(false);
    this.emitCommit(next);
  }

  /** Radix updateValues: snap, clamp, keep the gap, then focus the thumb that moved. */
  private updateValues(raw: number, atIndex: number, commit: boolean): void {
    const min = this.min();
    const max = this.max();
    const step = this.step();
    const snapped = roundValue(Math.round((raw - min) / step) * step + min, getDecimalCount(step));
    const nextValue = clampTo(snapped, [min, max]);
    const distance = this.minSteps() * step;
    const prev = this.values();
    const constrained = this.preserveThumbOrder
      ? clampTo(nextValue, [
          prev[atIndex - 1] === undefined ? min : (prev[atIndex - 1] as number) + distance,
          prev[atIndex + 1] === undefined ? max : (prev[atIndex + 1] as number) - distance,
        ])
      : nextValue;
    const next = [...prev];
    next[atIndex] = constrained;
    next.sort((a, b) => a - b);
    if (!hasMinStepsBetween(next, distance)) return;
    this.valueIndexToChange = this.preserveThumbOrder ? atIndex : next.indexOf(constrained);
    if (String(next) === String(prev)) return;
    const thumb = this.nativeThumbs[this.valueIndexToChange];
    thumb?.focus({ preventScroll: true, focusVisible: this.keyboardInteraction } as FocusOptions);
    this.keyboardInteraction = false;
    this.change(next);
    if (commit) this.commit(next);
  }

  protected onThumbFocus(index: number): void {
    this.valueIndexToChange = index;
    if (this.raiseActiveThumb) this.activeThumb.set(index);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const values = this.values();
    const min = this.min();
    const max = this.max();
    const step = this.step();
    // React SliderBase: with two thumbs, Home and End move the focused thumb as far as the other allows.
    if (values.length >= 2 && (event.key === 'Home' || event.key === 'End')) {
      const index = (event.target as HTMLElement).getAttribute('data-thumb') === 'end' ? 1 : 0;
      const gap = this.minSteps() * step;
      const next = [...values];
      if (index === 0) next[0] = event.key === 'Home' ? min : (values[1] ?? max) - gap;
      else next[1] = event.key === 'Home' ? (values[0] ?? min) + gap : max;
      event.preventDefault();
      if (next[index] === values[index]) return;
      this.change(next);
      this.emitCommit(next);
      return;
    }
    const disabled = this.isDisabled();
    if (event.key === 'Home') {
      if (!disabled) {
        this.keyboardInteraction = true;
        this.updateValues(min, 0, true);
      }
      event.preventDefault();
    } else if (event.key === 'End') {
      if (!disabled) {
        this.keyboardInteraction = true;
        this.updateValues(max, values.length - 1, true);
      }
      event.preventDefault();
    } else if (PAGE_KEYS.includes(event.key) || ARROW_KEYS.includes(event.key)) {
      if (!disabled) {
        this.keyboardInteraction = true;
        const edges = this.edges();
        const slideDirection =
          this.orientation() === 'vertical' ? 'from-bottom' : edges.direction === 1 ? 'from-left' : 'from-right';
        const back = BACK_KEYS[slideDirection]?.includes(event.key) ?? false;
        const skip = PAGE_KEYS.includes(event.key) || (event.shiftKey && ARROW_KEYS.includes(event.key));
        const atIndex = this.valueIndexToChange;
        const value = values[atIndex] ?? min;
        this.updateValues(nextStepValue(value, min, step, back ? -1 : 1, skip ? 10 : 1), atIndex, true);
      }
      event.preventDefault();
    }
  }

  private valueFromPointer(event: PointerEvent): number {
    const el = this.control()[0]?.nativeElement;
    const rect = this.rect ?? el?.getBoundingClientRect();
    if (!rect) return this.min();
    this.rect = rect;
    const min = this.min();
    const max = this.max();
    if (this.orientation() === 'vertical') return linearScale([0, rect.height], [max, min])(event.clientY - rect.top);
    const fromLeft = this.dir() === 'ltr';
    return linearScale([0, rect.width], fromLeft ? [min, max] : [max, min])(event.clientX - rect.left);
  }

  protected onPointerDown(event: PointerEvent): void {
    const disabled = this.isDisabled();
    if (!disabled) {
      this.dragging.set(true);
      this.valuesBeforeSlideStart = this.values();
      this.keyboardInteraction = false;
    }
    const target = event.target as HTMLElement;
    target.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    const thumbIndex = this.nativeThumbs.indexOf(target);
    if (thumbIndex >= 0) {
      target.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
      if (!disabled && this.raiseActiveThumb) this.activeThumb.set(thumbIndex);
    } else if (!disabled) {
      const value = this.valueFromPointer(event);
      const index = closestValueIndex(this.values(), value);
      if (this.raiseActiveThumb) this.activeThumb.set(index);
      this.updateValues(value, index, false);
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (this.isDisabled() || !target.hasPointerCapture?.(event.pointerId)) return;
    this.updateValues(this.valueFromPointer(event), this.valueIndexToChange, false);
  }

  protected onPointerUp(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (!target.hasPointerCapture?.(event.pointerId)) return;
    target.releasePointerCapture(event.pointerId);
    if (this.isDisabled()) return;
    this.rect = undefined;
    const values = this.values();
    if (String(values) !== String(this.valuesBeforeSlideStart)) this.commit(values);
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled || undefined);
  }
}
