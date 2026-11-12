'use client';
// The internals Button and IconButton share: the variant axes, the inert
// states (disabled and loading), `asChild` through Radix Slot, and the one
// bare <button> the system renders. Not exported from the package barrel:
// IconButton imports it from '../Button/ButtonBase'.
import {
  cloneElement,
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
import type { Emphasis, Shape, Size, Tone } from '@the-system/shared';
import { useButtonGroup } from '../ButtonGroup/ButtonGroupContext';

/** The shared axes, all of them: Button takes every value. */
export type ButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type ButtonTone = Extract<Tone, 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>;
export type ButtonEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost' | 'link'>;
export type ButtonShape = Extract<Shape, 'default' | 'pill' | 'square'>;
/** Leading or trailing content: a system icon name, or a node (for example `<Icon name="plus" size="sm" />`). */
export type ButtonSlotContent = IconName | ReactElement;

/** The props Button and IconButton share. No `title`: hints come from Tooltip, never the native title attribute. */
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
   * An action is in flight: shows the spinner, adds a visually hidden status
   * (`loadingLabel`), sets `aria-busy` and `data-loading`, keeps the width
   * and focus, and blocks activation.
   */
  loading?: boolean;
  /** The words the hidden status says while loading. Default "Loading". Arabic: "جار التحميل". */
  loadingLabel?: string;
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

/** Renders leading or trailing content: a name becomes a 16px system Icon, a node is used as is. */
export function renderSlotContent(content: ButtonSlotContent): ReactNode {
  return typeof content === 'string' ? <Icon name={content} size="md" /> : content;
}

/** The spinner and the hidden status, shown while loading. The spinner is hidden from assistive tech. */
export function ButtonLoading({ label }: { label: string }) {
  return (
    <>
      <span data-part="spinner" aria-hidden="true" />
      <span data-part="status" role="status">
        {label}
      </span>
    </>
  );
}

/** The components built on ButtonRoot. */
export type ButtonDs = 'button' | 'icon-button' | 'toggle-button' | 'close-button' | 'copy-button' | 'floating-action-button';

interface ButtonRootProps extends ButtonBaseProps {
  /** The root `data-ds` value. */
  ds: ButtonDs;
  /** An icon only control (IconButton, CloseButton, a FAB without a label): it never takes link from a group. */
  iconOnly?: boolean;
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
  iconOnly = ds === 'icon-button',
  defaultEmphasis,
  render,
  size,
  tone = 'neutral',
  emphasis,
  shape,
  loading = false,
  loadingLabel: _loadingLabel,
  disabled = false,
  asChild = false,
  type = 'button',
  children,
  onClick,
  onAuxClick,
  onPointerDown,
  onKeyDown,
  ref,
  ...rest
}: ButtonRootProps) {
  const inert = disabled || loading;
  // A ButtonGroup passes size, emphasis and shape through context, so they
  // reach a child through any wrapper. The child's own prop always wins. An
  // icon only control never takes link from a group.
  const group = useButtonGroup();
  const s = size ?? group?.size ?? 'md';
  const sh = shape ?? group?.shape ?? 'default';
  const groupEmphasis = group?.emphasis && !(iconOnly && (group.emphasis as string) === 'link') ? group.emphasis : undefined;
  const em = emphasis ?? groupEmphasis ?? defaultEmphasis;
  const attrs = {
    ...rest,
    ref,
    'data-ds': ds,
    'data-size': s,
    'data-tone': tone,
    'data-emphasis': em,
    'data-shape': sh,
    'data-loading': loading ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    'aria-disabled': inert ? true : rest['aria-disabled'],
    'aria-busy': loading ? true : rest['aria-busy'],
    // While inert, the handlers of the caller (and of a Radix trigger that
    // wraps this button with asChild) do not run, and a click, middle click
    // included, does not submit a form or follow a link.
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    onAuxClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onAuxClick?.(event);
    },
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (!inert) onPointerDown?.(event);
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!inert) onKeyDown?.(event);
    },
  };

  if (asChild) {
    if (!isValidElement<{ href?: string; role?: string }>(children)) {
      throw new Error(`${ds} with asChild needs one element as its child.`);
    }
    // An inert link loses its href, so no click, middle click, context menu
    // or drag can open it. role="link" keeps it announced as a link.
    const child =
      inert && children.props.href !== undefined
        ? cloneElement(children, {
            href: undefined,
            role: children.props.role ?? 'link',
          })
        : children;
    return (
      <Slot.Root {...attrs}>
        <Slot.Slottable child={child}>{(content: ReactNode) => render(content)}</Slot.Slottable>
      </Slot.Root>
    );
  }

  return (
    <button type={type} {...attrs}>
      {render(children)}
    </button>
  );
}
