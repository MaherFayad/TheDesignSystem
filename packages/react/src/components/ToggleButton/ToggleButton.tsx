'use client';
// ToggleButton: a Button that stays pressed or not (bold, mute, grid view).
// Behavior from Radix Toggle, drawn on the Button base, so the axes, the
// inert states and the look are Button's. Radix sets `aria-pressed` and
// `data-state` (`on`, `off`); the on state is a toggle-button block in
// Button.css. Source: GoBanana `.st-btn[aria-pressed='true']`, site
// `PricingToggle.tsx`.
import type { ReactNode } from 'react';
import { Toggle } from 'radix-ui';
import { ButtonRoot, renderSlotContent, type ButtonBaseProps, type ButtonSlotContent } from '../Button/ButtonBase';

export interface ToggleButtonProps extends Omit<ButtonBaseProps, 'loading' | 'loadingLabel' | 'asChild' | 'type'> {
  /** Pressed, controlled. Pair with `onPressedChange`. */
  pressed?: boolean;
  /** Pressed at first, uncontrolled. Default false. */
  defaultPressed?: boolean;
  /** Called with the new pressed value. */
  onPressedChange?: (pressed: boolean) => void;
  /** The visible label. English: a noun or a short verb phrase that names the setting ("Grid view"). */
  children?: ReactNode;
  /** Leading content before the label: an icon name or a node. */
  start?: ButtonSlotContent;
  /** Trailing content after the label: an icon name or a node. */
  end?: ButtonSlotContent;
  /** The icon only form: the icon, with `label` as the accessible name. Children are ignored. */
  icon?: ButtonSlotContent;
  /** The accessible name of the icon only form (set as `aria-label`). Required with `icon`. */
  label?: string;
  /** Default soft, as Button. */
  emphasis?: ButtonBaseProps['emphasis'];
}

/**
 * A two state button. `aria-pressed` and `data-state` follow the pressed
 * value; Space and Enter toggle it. Disabled keeps focus, as every Button.
 */
export function ToggleButton({
  pressed,
  defaultPressed,
  onPressedChange,
  onClick,
  start,
  end,
  icon,
  label,
  children,
  ...rest
}: ToggleButtonProps) {
  const iconOnly = icon !== undefined;
  return (
    <Toggle.Root
      asChild
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      onClick={onClick}
    >
      <ButtonRoot
        {...rest}
        ds="toggle-button"
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
    </Toggle.Root>
  );
}
