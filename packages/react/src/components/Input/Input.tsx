'use client';
import { useCallback, useRef, type ComponentProps, type MouseEvent, type ReactNode, type Ref } from 'react';
import { isIconName, type IconName } from '@the-system/icons';
import { Icon } from '@the-system/icons/react';
import type { Shape, Size } from '@the-system/shared';
import { useFieldControl } from '../Field/Field';
import type { ShakeBox } from '@the-system/motion';
import { useErrorShake } from './useErrorShake';

export type InputSize = Size;
export type InputShape = Extract<Shape, 'default' | 'pill'>;
/** Text types only. A checkbox, a date or a file is its own component. */
/** The box: outlined (a border) or filled (a tint). Unset, the active style and platform choose. */
export type InputVariant = 'outlined' | 'filled';

export type InputType = 'text' | 'email' | 'url' | 'tel' | 'number' | 'password' | 'search';
/** An icon name, a short text such as "px" or "$", or any node. */
export type InputAdornment = IconName | (string & {}) | ReactNode;

export interface InputProps
  extends Omit<ComponentProps<'input'>, 'size' | 'type' | 'prefix' | 'title' | 'ref' | 'className' | 'style'> {
  /** Height from size.control. Default md. */
  size?: InputSize;
  /**
   * default: the radius of the active style (radius.control, a pill in
   * Studio and Desk). pill: always fully round.
   */
  shape?: InputShape;
  /**
   * outlined: a border all round. filled: a tinted box. Stamped as
   * data-variant only when passed, so a platform (Android draws filled
   * fields) can follow it. Default unset.
   */
  variant?: InputVariant;
  /** Marks the value invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Text types only. Default text. */
  type?: InputType;
  /** Adornment at the start: an icon name, a short text or a node. */
  start?: InputAdornment;
  /** Adornment at the end: an icon name, a short text or a node. */
  end?: InputAdornment;
  /** Class name of the root, the bordered box. */
  className?: string;
  /** Inline style of the root, the bordered box. */
  style?: ComponentProps<'div'>['style'];
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the native input. */
  ref?: Ref<HTMLInputElement>;
}

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

/** The box that shakes: the root, unless it is the control part of another field, which shakes its own box. */
const ownBox: ShakeBox = (input) => {
  const root = input.parentElement;
  return root?.hasAttribute('data-part') ? null : root;
};

function Adornment({ part, value }: { part: 'start' | 'end'; value: InputAdornment }) {
  if (value === undefined || value === null || value === false) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    // Icons and short texts are decoration: the label names the field.
    return (
      <span data-part={part} aria-hidden="true">
        {typeof value === 'string' && isIconName(value) ? <Icon name={value} /> : value}
      </span>
    );
  }
  return <span data-part={part}>{value}</span>;
}

/**
 * A native single line text input in a bordered box that holds start and end
 * adornments. The box is the root (`data-ds="input"`); the `<input>` is the
 * control part and gets the ref and every native prop. Clicking anywhere in
 * the box that is not interactive focuses the input.
 *
 * Inside a Field it reads its id, aria-describedby, invalid, disabled, read
 * only and required state from the Field through `useFieldControl()`.
 *
 * It does not set dir="auto": the value follows the page direction, so a
 * field does not jump sides while someone types a Latin word into Arabic.
 * Email, url, tel and number values are Latin by nature: the CSS runs them
 * left to right and keeps them on the reading side of the form.
 */
export function Input({
  size = 'md',
  shape = 'default',
  variant,
  invalid,
  disabled,
  readOnly,
  required,
  type = 'text',
  start,
  end,
  className,
  style,
  rootProps,
  id,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: InputProps) {
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });
  const inner = useRef<HTMLInputElement | null>(null);
  useErrorShake(inner, Boolean(control['aria-invalid']), ownBox);

  const setRef = useCallback(
    (node: HTMLInputElement | null): (() => void) | undefined => {
      inner.current = node;
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        return () => {
          if (typeof cleanup === 'function') cleanup();
          else ref(null);
        };
      }
      if (ref) {
        ref.current = node;
        return () => {
          ref.current = null;
        };
      }
      return undefined;
    },
    [ref],
  );

  const onRootMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    rootProps?.onMouseDown?.(event);
    const input = inner.current;
    if (event.defaultPrevented || !input || input.disabled) return;
    const target = event.target as Element;
    if (target === input) return;
    // Only an interactive element inside the box keeps the press. An
    // ancestor with a tabindex (a dialog's content) does not count.
    const root = event.currentTarget;
    const match = target.closest(INTERACTIVE);
    if (match && match !== root && root.contains(match)) return;
    // Keep focus where it lands: on the input, not on the box.
    event.preventDefault();
    input.focus();
  };

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      onMouseDown={onRootMouseDown}
      data-ds="input"
      data-size={size}
      data-shape={shape}
      data-variant={variant}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      data-readonly={control.readOnly ? '' : undefined}
    >
      <Adornment part="start" value={start} />
      <input {...rest} {...control} ref={setRef} type={type} data-part="control" />
      <Adornment part="end" value={end} />
    </div>
  );
}
