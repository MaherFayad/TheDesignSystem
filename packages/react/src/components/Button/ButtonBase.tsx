'use client';
// The internals Button and IconButton share: the variant axes, the inert
// states (disabled and loading), `asChild` through Radix Slot, and the one
// bare <button> the system renders. Not exported from the package barrel:
// IconButton imports it from '../Button/ButtonBase'.
import {
  isValidElement,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Slot } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonTone = 'neutral' | 'accent' | 'danger' | 'success' | 'warning' | 'info';
export type ButtonEmphasis = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
export type ButtonShape = 'default' | 'pill' | 'square';
/** A system icon name, or an icon element (for example `<Icon name="plus" size="sm" />`). */
export type ButtonIcon = IconName | ReactElement;

/** The props Button and IconButton share. */
/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface ButtonBaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  /** Height from the size.control tokens: xs 24, sm 28, md 32, lg 44 (default density). Default md. */
  size?: ButtonSize;
  /** The color family. accent is the primary action color of the active style. Default neutral. */
  tone?: ButtonTone;
  /** How loud the button is. tone accent with emphasis solid is the primary action. */
  emphasis?: ButtonEmphasis;
  /** default takes the style's control radius, pill is fully round, square has small corners. Default default. */
  shape?: ButtonShape;
  /**
   * An action is in flight: shows the spinner, sets `aria-busy` and
   * `data-loading`, keeps the width and focus, and blocks activation.
   */
  loading?: boolean;
  /**
   * Blocks activation. The button stays focusable and in the tab order,
   * with `aria-disabled` and `data-disabled`, so a Tooltip can say why.
   * The native `disabled` attribute is never set.
   */
  disabled?: boolean;
  /** Renders the single child element (a link, a router link) as the button. Default false. */
  asChild?: boolean;
  /** Native button type. Default "button", so a button never submits a form by accident. Ignored with asChild. */
  type?: 'button' | 'submit' | 'reset';
  ref?: Ref<HTMLButtonElement>;
}

/** Renders a ButtonIcon: a name becomes a 16px system Icon, an element is used as is. */
export function renderButtonIcon(icon: ButtonIcon): ReactNode {
  return typeof icon === 'string' ? <Icon name={icon} size="md" /> : icon;
}

/** The spinner part, shown while loading. Hidden from assistive tech: `aria-busy` carries the state. */
export function ButtonSpinner() {
  return <span data-part="spinner" aria-hidden="true" />;
}

interface ButtonRootProps extends ButtonBaseProps {
  /** The root `data-ds` value. */
  ds: 'button' | 'icon-button';
  /** Default emphasis of this component. */
  defaultEmphasis: ButtonEmphasis;
  /** Builds the parts around the content: the children, or the asChild element's children. */
  render: (content: ReactNode) => ReactNode;
}

/**
 * The root of Button and IconButton. Stamps the anatomy and variant
 * attributes, swallows activation while disabled or loading, and renders
 * either the bare <button> or, with asChild, the child element through Slot.
 */
export function ButtonRoot({
  ds,
  defaultEmphasis,
  render,
  size = 'md',
  tone = 'neutral',
  emphasis,
  shape = 'default',
  loading = false,
  disabled = false,
  asChild = false,
  type = 'button',
  children,
  onClick,
  onPointerDown,
  onKeyDown,
  ref,
  ...rest
}: ButtonRootProps) {
  const inert = disabled || loading;
  const attrs = {
    ...rest,
    ref,
    'data-ds': ds,
    'data-size': size,
    'data-tone': tone,
    'data-emphasis': emphasis ?? defaultEmphasis,
    'data-shape': shape,
    'data-loading': loading ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    'aria-disabled': inert ? true : rest['aria-disabled'],
    'aria-busy': loading ? true : rest['aria-busy'],
    // While inert, the handlers of the caller (and of a Radix trigger that
    // wraps this button with asChild) do not run, and a click does not
    // submit a form or follow a link.
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (!inert) onPointerDown?.(event);
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!inert) onKeyDown?.(event);
    },
  };

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error(`${ds === 'button' ? 'Button' : 'IconButton'} with asChild needs one element as its child.`);
    }
    return (
      <Slot.Root {...attrs}>
        <Slot.Slottable child={children}>{(content: ReactNode) => render(content)}</Slot.Slottable>
      </Slot.Root>
    );
  }

  return (
    <button type={type} {...attrs}>
      {render(children)}
    </button>
  );
}
