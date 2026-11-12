'use client';
// ToggleButton: a Button that stays pressed or not (bold, mute, grid view).
// Behavior from Radix Toggle, drawn on the Button base, so the axes, the
// inert states and the look are Button's. Radix sets `aria-pressed` and
// `data-state` (`on`, `off`); the on state is a toggle-button block in
// Button.css. Source: GoBanana `.st-btn[aria-pressed='true']`, site
// `PricingToggle.tsx`.
//
// The pressed pop (interaction toggle-pop, order 1.22, proposed): when the
// person turns it on, the content (icon, start, label, end) pops to
// scale.pop and settles over duration.celebrate, one stagger step apart,
// while the on fill and ring show at once; turning it off lets the content
// sink to scale.anticipate and settle back on the soft spring. Only the
// parts move, so a toggle in an attached ButtonGroup keeps its seams. The
// state never waits for it.
import { useCallback, useRef, type ReactNode } from 'react';
import { Toggle } from 'radix-ui';
import { cssToken, play, scaleValue, type MotionSpec } from '@the-system/motion';
import { useMotion } from '../../internal/motion';
import { ButtonRoot, renderSlotContent, setRef, type ButtonBaseProps, type ButtonSlotContent } from '../Button/ButtonBase';

/** The parts that pop, in the order they land. */
const POP_PARTS = ':scope > :is([data-part="icon"], [data-part="start"], [data-part="label"], [data-part="end"])';

/** The way the content lands: a pop past rest when on, a small sink when off. */
export function toggleLandSpec(on: boolean, step: number): MotionSpec {
  const delay = step > 0 ? { delay: 'delay.stagger' as const, delaySteps: Math.min(step, 6) } : {};
  if (on) {
    return {
      keyframes: [{ transform: 'none' }, { transform: `scale(${cssToken('scale.pop', scaleValue['scale.pop'])})`, offset: 0.4 }, { transform: 'none' }],
      duration: 'duration.celebrate',
      easing: 'ease.out',
      fill: 'backwards',
      origin: '50% 50%',
      ...delay,
    };
  }
  return {
    keyframes: [{ transform: `scale(${cssToken('scale.anticipate', scaleValue['scale.anticipate'])})` }, { transform: 'none' }],
    duration: 'duration.spring-soft',
    easing: 'ease.spring-soft',
    fill: 'backwards',
    origin: '50% 50%',
    ...delay,
  };
}

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
  ref,
  ...rest
}: ToggleButtonProps) {
  const iconOnly = icon !== undefined;
  if (process.env.NODE_ENV !== 'production' && !iconOnly && label !== undefined) {
    console.warn('ToggleButton: label names only the icon only form and is dropped without icon. Pass the visible text as children, or add icon.');
  }
  const motion = useMotion();
  const own = useRef<HTMLButtonElement | null>(null);
  const setOwn = useCallback(
    (node: HTMLButtonElement | null) => {
      own.current = node;
      setRef(ref, node);
    },
    [ref],
  );
  const changePressed = (next: boolean) => {
    onPressedChange?.(next);
    const el = own.current;
    if (!el || motion.mode('toggle-pop') !== 'full') return;
    el.querySelectorAll(POP_PARTS).forEach((part, i) => play(part, toggleLandSpec(next, i), 'toggle-pop'));
  };
  return (
    <Toggle.Root
      asChild
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={changePressed}
      onClick={onClick}
    >
      <ButtonRoot
        {...rest}
        ref={setOwn}
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
