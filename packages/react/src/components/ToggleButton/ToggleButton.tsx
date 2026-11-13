'use client';
// ToggleButton: a Button that stays pressed or not (bold, mute, grid view).
// Behavior from Radix Toggle, drawn on the Button base, so the axes, the
// inert states and the look are Button's. Radix sets `aria-pressed` and
// `data-state` (`on`, `off`); the on state is a toggle-button block in
// Button.css. Source: GoBanana `.st-btn[aria-pressed='true']`, site
// `PricingToggle.tsx`.
//
// The flood (interaction toggle-pop, round 3, order 1.23, proposed): a
// state layer, an aria-hidden part under the content, pools under the
// pointer while the button is held (ToggleButton.css). When the person turns
// it on, the layer floods from that point across the button and fades while
// the on fill crosses in behind it; turning it off, the layer drains back to
// the point, faster. From the keyboard the point is the centre. Only the
// layer moves: the content and the root keep still, so a toggle in an
// attached ButtonGroup keeps its seams. The state never waits for it. The
// layer's spec and the press point are the toggle layer helper of
// @the-system/motion (helpers/toggle-layer.ts).
import { useCallback, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Toggle } from 'radix-ui';
import { play, pressShare, toggleLayerSpec } from '@the-system/motion';
import { useMotion } from '../../internal/motion';
import { ButtonRoot, renderSlotContent, setRef, type ButtonBaseProps, type ButtonSlotContent } from '../Button/ButtonBase';

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
    const layer = own.current?.querySelector(':scope > [data-part="state-layer"]');
    if (!layer || motion.mode('toggle-pop') !== 'full') return;
    // A style can keep the pool and drop the flood.
    if (typeof getComputedStyle === 'function' && getComputedStyle(layer).getPropertyValue('--_toggle-button-flood').trim() === '0') return;
    play(layer, toggleLayerSpec(next), 'toggle-pop');
  };
  // The press point, as a share of the box so it holds at any zoom. Keys flood from the centre.
  const placePoint = (event: PointerEvent<HTMLButtonElement>) => {
    const el = event.currentTarget;
    const box = el.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return;
    el.style.setProperty('--_toggle-button-x', pressShare((event.clientX - box.left) / box.width));
    el.style.setProperty('--_toggle-button-y', pressShare((event.clientY - box.top) / box.height));
  };
  const centrePoint = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.currentTarget.style.removeProperty('--_toggle-button-x');
    event.currentTarget.style.removeProperty('--_toggle-button-y');
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
        onPointerDown={(event) => {
          placePoint(event);
          rest.onPointerDown?.(event);
        }}
        onKeyDown={(event) => {
          centrePoint(event);
          rest.onKeyDown?.(event);
        }}
        ref={setOwn}
        ds="toggle-button"
        iconOnly={iconOnly}
        defaultEmphasis="soft"
        aria-label={iconOnly ? label : rest['aria-label']}
        render={() =>
          iconOnly ? (
            <>
              <span data-part="state-layer" aria-hidden="true" />
              <span data-part="icon">{renderSlotContent(icon)}</span>
            </>
          ) : (
            <>
              <span data-part="state-layer" aria-hidden="true" />
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
