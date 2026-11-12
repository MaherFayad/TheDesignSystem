'use client';
import { Fragment, useId, useState, type ComponentProps, type CSSProperties, type ReactNode, type Ref } from 'react';
import { Slider as RadixSlider } from 'radix-ui';
import type { Size, Tone } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useField, useFieldControl } from '../Field/Field';
import { formatSliderValue } from './format';

export type SliderSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type SliderTone = Extract<Tone, 'accent'>;
export type SliderOrientation = 'horizontal' | 'vertical';

/** A tick under the track at a value, with optional text. */
export interface SliderMark {
  value: number;
  label?: ReactNode;
}

type RadixRootProps = ComponentProps<typeof RadixSlider.Root>;

/** Props Slider and RangeSlider share. */
export interface SliderBaseProps
  extends Omit<
    RadixRootProps,
    'className' | 'style' | 'children' | 'title' | 'asChild' | 'ref' | 'value' | 'defaultValue' | 'onValueChange' | 'onValueCommit' | 'dir' | 'inverted'
  > {
  /** Track thickness and thumb size. The thumb is always at least a 24px target. Default md. */
  size?: SliderSize;
  /** The range fill and the thumb. Only accent. */
  tone?: SliderTone;
  /** Visible name above the track. Names the thumb through aria-labelledby. */
  label?: ReactNode;
  /** Shows the formatted value at the inline end of the label row. Default true when there is a label. */
  showValue?: boolean;
  /** A unit after the number, in the value text and aria-valuetext: %, px, SAR. */
  unit?: string;
  /** Intl.NumberFormat options for the value text. Digits are always Western. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Full control of the value text, aria-valuetext included. */
  formatValue?: (value: number) => string;
  /** Ticks under the track. Numbers, or objects with a label. Horizontal only: a vertical slider shows none. */
  marks?: readonly (number | SliderMark)[];
  /** Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Class name of the root. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
}

interface BaseInternals {
  kind: 'slider' | 'range-slider';
  value: number[] | undefined;
  defaultValue: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  /** The accessible name of each thumb when there is no visible label, or to tell thumbs apart. */
  thumbLabels: (string | undefined)[];
  /** data-thumb on each thumb, for RangeSlider. */
  thumbIds?: string[];
  thumbRef?: Ref<HTMLSpanElement>;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

function toMark(mark: number | SliderMark): SliderMark {
  return typeof mark === 'number' ? { value: mark } : mark;
}

/**
 * The shared body of Slider and RangeSlider: a label row (label and value),
 * the Radix slider as the control (track, range, thumbs) and optional marks.
 */
export function SliderBase({
  kind,
  size = 'md',
  tone = 'accent',
  label,
  showValue,
  unit,
  formatOptions,
  formatValue,
  marks,
  invalid,
  disabled,
  min = 0,
  max = 100,
  step = 1,
  orientation = 'horizontal',
  className,
  style,
  rootProps,
  id,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  thumbLabels,
  thumbIds,
  thumbRef,
  ariaLabel,
  ariaLabelledBy,
  'aria-describedby': describedBy,
  onPointerDown,
  onLostPointerCapture,
  ...rest
}: SliderBaseProps & BaseInternals) {
  const theme = useTheme();
  const field = useField();
  const labelId = useId();
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled });
  const [own, setOwn] = useState<number[]>(defaultValue);
  const [dragging, setDragging] = useState(false);
  const values = valueProp ?? own;

  const format = (v: number) => formatValue?.(v) ?? formatSliderValue(v, theme.lang, { unit, options: formatOptions });
  const hasLabel = label !== undefined && label !== null && label !== false;
  const valueShown = showValue ?? hasLabel;
  const span = max - min || 1;

  const onChange = (next: number[]) => {
    if (valueProp === undefined) setOwn(next);
    onValueChange?.(next);
  };

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      data-ds={kind}
      data-size={size}
      data-tone={tone}
      data-orientation={orientation}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
    >
      {hasLabel && (
        <span id={labelId} data-part="label">
          {label}
        </span>
      )}
      {valueShown && (
        <output data-part="value" aria-hidden="true">
          {values.map((v, i) => (
            // Each value keeps its own direction: 200 SAR stays in order on an Arabic page.
            <Fragment key={i}>
              {i > 0 && ' - '}
              <bdi>{format(v)}</bdi>
            </Fragment>
          ))}
        </output>
      )}
      <RadixSlider.Root
        {...rest}
        data-part="control"
        dir={theme.dir}
        min={min}
        max={max}
        step={step}
        orientation={orientation}
        disabled={control.disabled}
        value={values}
        onValueChange={onChange}
        onValueCommit={(next) => {
          setDragging(false);
          onValueCommit?.(next);
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (!control.disabled) setDragging(true);
        }}
        onLostPointerCapture={(event) => {
          onLostPointerCapture?.(event);
          setDragging(false);
        }}
      >
        <RadixSlider.Track data-part="track">
          <RadixSlider.Range data-part="range" />
        </RadixSlider.Track>
        {values.map((v, i) => {
          const thumbLabel = thumbLabels[i];
          // Name order: the thumb's own label, aria-labelledby, the visible label, aria-label, then a Field label.
          const fieldLabel = !ariaLabel ? field?.labelId : undefined;
          const labelledBy = thumbLabel ? undefined : (ariaLabelledBy ?? (hasLabel ? labelId : fieldLabel));
          return (
            <RadixSlider.Thumb
              key={thumbIds?.[i] ?? i}
              ref={i === 0 ? thumbRef : undefined}
              id={i === 0 ? control.id : undefined}
              data-part="thumb"
              data-thumb={thumbIds?.[i]}
              aria-label={thumbLabel ?? (labelledBy ? undefined : ariaLabel)}
              aria-labelledby={labelledBy}
              aria-valuetext={format(v)}
              aria-describedby={control['aria-describedby']}
              aria-invalid={control['aria-invalid']}
            />
          );
        })}
      </RadixSlider.Root>
      {marks && marks.length > 0 && orientation === 'horizontal' && (
        <div data-part="marks" aria-hidden="true">
          {marks.map(toMark).map((mark) => (
            <span
              key={mark.value}
              data-mark=""
              style={{ '--_slider-mark-at': `${((mark.value - min) / span) * 100}%` } as CSSProperties}
            >
              {mark.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export interface SliderProps extends SliderBaseProps {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled starting value. Default min. */
  defaultValue?: number;
  /** Called on every change, while dragging too. */
  onValueChange?: (value: number) => void;
  /** Called once when a drag ends or a key changes the value. Save here. */
  onValueCommit?: (value: number) => void;
  /** The accessible name when there is no visible label. */
  'aria-label'?: string;
  /** Goes to the thumb, the element with role slider. */
  ref?: Ref<HTMLSpanElement>;
}

/**
 * One value on a range. Behavior from Radix Slider: the thumb has role
 * slider; arrows move by one step (in the reading direction in right to
 * left text), PageUp and PageDown by ten steps, Home and End to the ends.
 * Every drag has this key path (WCAG 2.5.7).
 *
 * aria-valuetext carries the formatted value with its unit, so a screen
 * reader says "40%", not "40".
 */
export function Slider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ref,
  ...rest
}: SliderProps) {
  return (
    <SliderBase
      {...rest}
      kind="slider"
      min={min}
      value={value === undefined ? undefined : [value]}
      defaultValue={[defaultValue ?? min]}
      onValueChange={onValueChange ? (v) => onValueChange(v[0] ?? min) : undefined}
      onValueCommit={onValueCommit ? (v) => onValueCommit(v[0] ?? min) : undefined}
      thumbLabels={[undefined]}
      thumbRef={ref}
      ariaLabel={ariaLabel}
      ariaLabelledBy={ariaLabelledBy}
    />
  );
}
