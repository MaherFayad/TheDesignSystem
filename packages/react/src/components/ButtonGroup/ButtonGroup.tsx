'use client';
// ButtonGroup: a row or a column of related actions, spaced or attached.
//
// Sources: Figma-Killer-2 `SplitButton/SplitButton.module.css` (the seam: inner
// corners square, a 1px divider), GoBanana `.st-btn` (the children).
//
// Behavior is hand built: role group with a name, no roving focus. Every
// child stays in the tab order, so Tab moves from one to the next and the
// group adds no key of its own.
//
// The axes reach the children through ButtonGroupContext, through any
// wrapper (a Tooltip, a fragment, an element). Every component on ButtonBase
// (Button, IconButton, ToggleButton, CloseButton, CopyButton) reads it with
// `useButtonGroup()`, and a child's own prop always wins. A new grouped
// component reads the same context; the group never clones its children.
import { useMemo, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import {
  ButtonGroupContext,
  type ButtonGroupContextValue,
  type ButtonGroupEmphasis,
  type ButtonGroupShape,
  type ButtonGroupSize,
} from './ButtonGroupContext';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

interface ButtonGroupOwnProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  /** Buttons, IconButtons, ToggleButtons or SplitButtons. Two to five. */
  children?: ReactNode;
  /** Passed to every child that does not set its own. Default md. */
  size?: ButtonGroupSize;
  /** Passed to every child that does not set its own. Default none: each child keeps its own default. */
  emphasis?: ButtonGroupEmphasis;
  /** Passed to every child that does not set its own. Default none. */
  shape?: ButtonGroupShape;
  /** A row (horizontal) or a column (vertical). Default horizontal. Sets data-orientation. */
  orientation?: ButtonGroupOrientation;
  /**
   * Joins the children into one control: no gap, inner corners square, a 1px
   * divider between them. Default false: the children sit apart with a gap
   * and a row wraps. Sets data-attached.
   */
  attached?: boolean;
  /** Fills the width of its container; Buttons share the row equally. Default false. Sets data-full-width. */
  fullWidth?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** A group needs a name: `aria-label`, or `aria-labelledby` pointing at a visible heading. */
export type ButtonGroupProps = ButtonGroupOwnProps &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

/**
 * A labelled group of related actions. Spaced by default; `attached` joins
 * them into one seamed control whose inner corners are square on the
 * logical sides, so the seam flips with the reading direction.
 */
export function ButtonGroup({
  size = 'md',
  emphasis,
  shape,
  orientation = 'horizontal',
  attached = false,
  fullWidth = false,
  children,
  ref,
  ...rest
}: ButtonGroupProps) {
  const axes = useMemo<ButtonGroupContextValue>(() => ({ size, emphasis, shape }), [size, emphasis, shape]);
  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      data-ds="button-group"
      data-size={size}
      data-emphasis={emphasis}
      data-shape={shape}
      data-orientation={orientation}
      data-attached={attached ? '' : undefined}
      data-full-width={fullWidth ? '' : undefined}
    >
      <ButtonGroupContext value={axes}>{children}</ButtonGroupContext>
    </div>
  );
}
