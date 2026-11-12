'use client';
// InputGroup: an Input joined with add ons and actions in one row, for a
// unit, a fixed prefix such as a URL, or a Button that acts on the value.
//
// Sources: GoBanana `.st-input` (the control box the add ons match),
// Figma-Killer-2 `SplitButton.module.css` through ButtonGroup (the seam).
//
// Behavior is hand built: role group, no key of its own. Every control and
// action stays in the tab order, so Tab moves from part to part.
//
// The group stamps the parts on its direct children: a Button or an
// IconButton gets data-part="action", InputGroupAddon is the addon part, and
// any other component (an Input, a PasswordField, a SearchField) is the
// control: it gets data-part="control" on its root through rootProps, which
// every form control takes (anatomy.md, one convention, rule 8). So a
// wrapper around a Button (a Tooltip trigger) would be read as the control:
// give such a wrapper's Button data-part="action" yourself, or wrap the
// group instead. Children inside a fragment are not stamped: list the parts
// directly.
// Size, shape, invalid and disabled are passed to every child that leaves
// them unset (the add on height follows the group's size, so set size on
// the group, not on a child), and an action with no emphasis of its own is outline, so its
// border joins the control's. Add on text joins the control's aria-describedby, so it is
// read as a description of the control, never as part of its name.
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import type { Shape, Size } from '@the-system/shared';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { useField } from '../Field/Field';

export type InputGroupSize = Size;
export type InputGroupShape = Extract<Shape, 'default' | 'pill'>;

export interface InputGroupProps extends Omit<ComponentProps<'div'>, 'title' | 'role'> {
  /** One control (an Input), with InputGroupAddon parts and Buttons or IconButtons around it. */
  children?: ReactNode;
  /** Passed to every child that does not set its own. Default md. */
  size?: InputGroupSize;
  /** Passed to every child that does not set its own. Default default. */
  shape?: InputGroupShape;
  /** Marks the control invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Disables the control and every action. Inside a Field it follows the Field. */
  disabled?: boolean;
  /** Marks the control read only; the add ons dash with it. Inside a Field it follows the Field. */
  readOnly?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export interface InputGroupAddonProps extends Omit<ComponentProps<'span'>, 'title'> {
  /** Short text: a unit (px, USD), a fixed prefix (https://) or a suffix (.example.com). */
  children?: ReactNode;
}

/**
 * Text joined to the control: a unit, a currency, a fixed prefix or suffix.
 * InputGroup links it to the control as a description.
 */
export function InputGroupAddon({ children, ...rest }: InputGroupAddonProps) {
  return (
    <span {...rest} data-part="addon">
      {children}
    </span>
  );
}

/** Buttons and IconButtons take the action part. Any other component child is the control. */
const ACTIONS = new Set<unknown>([Button, IconButton]);

type AnyElement = ReactElement<Record<string, unknown>>;

function fillUnset(props: Record<string, unknown>, fill: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fill)) {
    if (value !== undefined && props[key] === undefined) out[key] = value;
  }
  return out;
}

/**
 * One row of joined parts. Inner corners are square on the logical sides,
 * so the seams flip with the reading direction.
 */
export function InputGroup({
  size = 'md',
  shape = 'default',
  invalid,
  disabled,
  readOnly,
  children,
  ref,
  ...rest
}: InputGroupProps) {
  const field = useField();
  const base = useId();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const isReadOnly = readOnly ?? field?.readOnly ?? false;

  // First pass: give every addon an id, so the control can point at them.
  const addonIds: string[] = [];
  const withIds = Children.map(children, (child, index) => {
    if (!isValidElement<InputGroupAddonProps>(child) || child.type !== InputGroupAddon) return child;
    const id = child.props.id ?? `${base}addon-${index}`;
    addonIds.push(id);
    return child.props.id ? child : cloneElement(child, { id });
  });

  const parts = Children.map(withIds, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return child;
    const element = child as AnyElement;
    const props = element.props;
    if (typeof element.type !== 'string' && element.type !== Fragment && element.type !== InputGroupAddon && !ACTIONS.has(element.type)) {
      const own = props['aria-describedby'] as string | undefined;
      const describedBy = [...addonIds, own].filter(Boolean).join(' ') || undefined;
      const rootProps = { ...(props.rootProps as Record<string, unknown> | undefined), 'data-part': 'control' };
      return cloneElement(element, {
        ...fillUnset(props, { size, shape, invalid, disabled, readOnly }),
        'aria-describedby': describedBy,
        rootProps,
      });
    }
    if (ACTIONS.has(element.type)) {
      return cloneElement(element, {
        // Outline unless the action sets its own emphasis: its border joins the control's.
        ...fillUnset(props, { size, shape, emphasis: 'outline', disabled: isDisabled || undefined }),
        'data-part': 'action',
      });
    }
    return element;
  });

  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      data-ds="input-group"
      data-size={size}
      data-shape={shape}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      data-readonly={isReadOnly ? '' : undefined}
      aria-disabled={isDisabled ? true : undefined}
    >
      {parts}
    </div>
  );
}
