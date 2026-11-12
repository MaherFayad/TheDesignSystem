'use client';
import type { Ref } from 'react';
import { SliderBase, type SliderBaseProps } from '../Slider/Slider';

export type RangeSliderValue = [number, number];

export interface RangeSliderProps extends Omit<SliderBaseProps, 'aria-label' | 'aria-labelledby'> {
  /** Controlled low and high values. */
  value?: RangeSliderValue;
  /** Uncontrolled starting values. Default [min, max]. */
  defaultValue?: RangeSliderValue;
  /** Called on every change, while dragging too. */
  onValueChange?: (value: RangeSliderValue) => void;
  /** Called once when a drag ends or a key changes a value. Save here. */
  onValueCommit?: (value: RangeSliderValue) => void;
  /**
   * The accessible name of each thumb, start then end: ["Minimum price",
   * "Maximum price"]. Required: two thumbs with one name cannot be told apart.
   */
  thumbLabels: [string, string];
  /** Steps that must stay between the thumbs, so they never cross. Default 1. */
  minStepsBetweenThumbs?: number;
  /** Goes to the start thumb. */
  ref?: Ref<HTMLSpanElement>;
}

function pair(v: number[], min: number, max: number): RangeSliderValue {
  return [v[0] ?? min, v[1] ?? max];
}

/**
 * A low and a high value on one track, such as a price range. Behavior from
 * Radix Slider with two thumbs. Each thumb is its own tab stop with its own
 * name and the Slider keys; the thumbs cannot cross, by key or by drag.
 * Home and End move the focused thumb as far as the other allows. With a
 * label, the root is a group named by it.
 */
export function RangeSlider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  thumbLabels,
  minStepsBetweenThumbs = 1,
  min = 0,
  max = 100,
  ref,
  ...rest
}: RangeSliderProps) {
  return (
    <SliderBase
      {...rest}
      kind="range-slider"
      min={min}
      max={max}
      minStepsBetweenThumbs={minStepsBetweenThumbs}
      preserveThumbOrder
      value={value}
      defaultValue={defaultValue ?? [min, max]}
      onValueChange={onValueChange ? (v) => onValueChange(pair(v, min, max)) : undefined}
      onValueCommit={onValueCommit ? (v) => onValueCommit(pair(v, min, max)) : undefined}
      thumbLabels={thumbLabels}
      thumbIds={['start', 'end']}
      thumbRef={ref}
    />
  );
}
