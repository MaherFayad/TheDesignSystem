'use client';
// The axes a ButtonGroup passes to its children. Not exported from the
// package barrel. A grouped component (Button, IconButton, ToggleButton,
// SplitButton) reads it with `useButtonGroup()` and lets its own prop win:
// `size = props.size ?? group?.size ?? 'md'`.
import { createContext, use } from 'react';
import type { Emphasis, Shape, Size } from '@the-system/shared';

export type ButtonGroupSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
/** No link emphasis: a row of links is not a group of actions. */
export type ButtonGroupEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost'>;
export type ButtonGroupShape = Extract<Shape, 'default' | 'pill' | 'square'>;

export interface ButtonGroupContextValue {
  size?: ButtonGroupSize;
  emphasis?: ButtonGroupEmphasis;
  shape?: ButtonGroupShape;
}

export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

/** The axes of the nearest ButtonGroup, or null outside one. */
export function useButtonGroup(): ButtonGroupContextValue | null {
  return use(ButtonGroupContext);
}
