'use client';
// ToggleGroup: a set of ToggleButtons where one (type single) or several
// (type multiple) can be on: text alignment, filter chips, view options.
//
// Sources: Figma-Killer-2 `FilterBar/FilterBar.tsx` (a chip group, each chip
// with aria-pressed), GoBanana admin `PeriodSwitch` (an attached switch).
//
// Behavior from Radix ToggleGroup: roving focus (one tab stop, arrows move,
// Home and End jump, arrows follow the reading direction), Space and Enter
// toggle. Radix renders role radiogroup with radio items (aria-checked) for
// type single, and role toolbar with pressed buttons (aria-pressed) for type
// multiple.
//
// Each item is drawn on the Button base as a ToggleButton root
// (`data-ds="toggle-button"` with `data-part="item"`), so it looks and
// behaves like a ToggleButton. The group passes size, emphasis and shape to
// the items through ButtonGroupContext, which ButtonRoot reads; an item's
// own prop wins.
import { useMemo, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { ToggleGroup as RadixToggleGroup } from 'radix-ui';
import { ButtonGroupContext, type ButtonGroupContextValue } from '../ButtonGroup/ButtonGroupContext';
import { ButtonRoot, renderSlotContent, type ButtonBaseProps, type ButtonSlotContent } from '../Button/ButtonBase';
import { useTheme } from '../../theme';
import { GroupDisabledContext, moveFromInertItem, useGroupDisabled } from './inertItems';
import type { Emphasis, Shape, Size } from '@the-system/shared';

export type ToggleGroupSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type ToggleGroupEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost'>;
export type ToggleGroupShape = Extract<Shape, 'default' | 'pill' | 'square'>;
export type ToggleGroupOrientation = 'horizontal' | 'vertical';

interface ToggleGroupCommonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role' | 'dir' | 'defaultValue' | 'onChange' | 'children'> {
  /** ToggleGroupItems. Two to twelve. */
  children?: ReactNode;
  /** Passed to every item that does not set its own. Default md. */
  size?: ToggleGroupSize;
  /** Passed to every item that does not set its own. Default none: items are soft, as ToggleButton. */
  emphasis?: ToggleGroupEmphasis;
  /** Passed to every item that does not set its own. Default none. */
  shape?: ToggleGroupShape;
  /** Arrow keys and layout: a row (horizontal) or a column (vertical). Default horizontal. Sets data-orientation. */
  orientation?: ToggleGroupOrientation;
  /** Joins the items into one seamed control, as an attached ButtonGroup. Default false. Sets data-attached. */
  attached?: boolean;
  /** Every item is disabled. Items keep aria-disabled and stay focusable, in the arrow order. Default false. Sets data-disabled. */
  disabled?: boolean;
  /** Arrow keys wrap from the last item to the first. Default true. */
  loop?: boolean;
  ref?: Ref<HTMLDivElement>;
}

interface ToggleGroupSingleProps extends ToggleGroupCommonProps {
  /** One item at most is on. Radix renders role radiogroup. */
  type: 'single';
  /** The value of the item that is on, controlled. Empty string for none. */
  value?: string;
  /** The value on at first, uncontrolled. */
  defaultValue?: string;
  /** Called with the new value; empty string when the on item is turned off. */
  onValueChange?: (value: string) => void;
}

interface ToggleGroupMultipleProps extends ToggleGroupCommonProps {
  /** Any number of items can be on. Radix renders role toolbar. */
  type: 'multiple';
  /** The values of the items that are on, controlled. */
  value?: string[];
  /** The values on at first, uncontrolled. */
  defaultValue?: string[];
  /** Called with the new list of values. */
  onValueChange?: (value: string[]) => void;
}

/** A group needs a name: `aria-label`, or `aria-labelledby` pointing at a visible heading. */
export type ToggleGroupProps = (ToggleGroupSingleProps | ToggleGroupMultipleProps) &
  ({ 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string });

/**
 * A labelled set of toggles with one tab stop. `type="single"` keeps at most
 * one on (and lets it turn off); `type="multiple"` lets any number be on.
 */
export function ToggleGroup({
  size = 'md',
  emphasis,
  shape,
  orientation = 'horizontal',
  attached = false,
  disabled = false,
  loop = true,
  children,
  onKeyDown,
  ...rest
}: ToggleGroupProps) {
  const { dir } = useTheme();
  const axes = useMemo<ButtonGroupContextValue>(() => ({ size, emphasis, shape }), [size, emphasis, shape]);
  return (
    <RadixToggleGroup.Root
      {...(rest as RadixToggleGroup.ToggleGroupSingleProps)}
      dir={dir}
      orientation={orientation}
      loop={loop}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        moveFromInertItem(event, { orientation, dir, loop });
      }}
      data-ds="toggle-group"
      data-size={size}
      data-emphasis={emphasis}
      data-shape={shape}
      data-orientation={orientation}
      data-attached={attached ? '' : undefined}
      aria-disabled={disabled ? true : undefined}
      data-disabled={disabled ? '' : undefined}
    >
      <GroupDisabledContext value={disabled}>
        <ButtonGroupContext value={axes}>{children}</ButtonGroupContext>
      </GroupDisabledContext>
    </RadixToggleGroup.Root>
  );
}

export interface ToggleGroupItemProps
  extends Omit<ButtonBaseProps, 'loading' | 'loadingLabel' | 'asChild' | 'type' | 'tone' | 'value' | 'children'> {
  /** The value this item adds to the group value. Unique in the group. */
  value: string;
  /** The visible label. English: a short noun that names the option ("Left", "Open"). */
  children?: ReactNode;
  /** Leading content before the label: an icon name or a node. */
  start?: ButtonSlotContent;
  /** Trailing content after the label: an icon name or a node. */
  end?: ButtonSlotContent;
  /** The icon only form: the icon, with `label` as the accessible name. Children are ignored. */
  icon?: ButtonSlotContent;
  /** The accessible name of the icon only form (set as `aria-label`). Required with `icon`. */
  label?: string;
}

/**
 * One option of a ToggleGroup: a ToggleButton root with `data-part="item"`.
 * Radix sets `data-state` (`on`, `off`) and aria-checked (single) or
 * aria-pressed (multiple).
 */
export function ToggleGroupItem({ value, disabled = false, start, end, icon, label, children, ...rest }: ToggleGroupItemProps) {
  const groupDisabled = useGroupDisabled();
  const iconOnly = icon !== undefined;
  // Radix is not told about disabled: the item stays in the arrow order and
  // focusable. ButtonRoot makes it inert: aria-disabled, no click, no toggle.
  return (
    <RadixToggleGroup.Item asChild value={value}>
      <ButtonRoot
        {...rest}
        disabled={disabled || groupDisabled}
        ds="toggle-button"
        data-part="item"
        iconOnly={iconOnly}
        defaultEmphasis="soft"
        aria-label={iconOnly ? label : rest['aria-label']}
        render={() =>
          iconOnly ? (
            <span data-part="icon">{renderSlotContent(icon)}</span>
          ) : (
            <>
              {start !== undefined && <span data-part="start">{renderSlotContent(start)}</span>}
              <span data-part="label">{children}</span>
              {end !== undefined && <span data-part="end">{renderSlotContent(end)}</span>}
            </>
          )
        }
      />
    </RadixToggleGroup.Item>
  );
}
