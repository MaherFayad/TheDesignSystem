'use client';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { isIconName, type IconName } from '@the-system/icons';
import { Icon } from '@the-system/icons/react';
import type { Shape, Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { CloseButton } from '../CloseButton/CloseButton';
import { useFieldControl } from '../Field/Field';
import type { ShakeBox } from '@the-system/motion';
import { useErrorShake } from './useErrorShake';

export type InputSize = Size;
export type InputShape = Extract<Shape, 'default' | 'pill'>;
/** Text types only. A checkbox, a date or a file is its own component. */
/**
 * The box: outlined (a border), filled (a tint) or plain (no box: a row of a
 * grouped card draws the edge). Unset, the active style and platform choose.
 */
export type InputVariant = 'outlined' | 'filled' | 'plain';

/** The default names of the clear button by language. Arabic: a noun form. */
export const inputClearLabels = { en: 'Clear text', ar: 'مسح النص' } as const;

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
   * outlined: a border all round. filled: a tinted box. plain: no box, no
   * border, no fill, for a row of an inset Fieldset. Stamped as
   * data-variant only when passed, so a platform (Android draws filled
   * fields) can follow it. Default unset.
   */
  variant?: InputVariant;
  /**
   * Adds the clear part: a CloseButton that shows while the field has a
   * value and focus, clears it and moves focus back to the input. Escape
   * also clears it, except inside a dialog. Default false.
   */
  clearable?: boolean;
  /** The accessible name of the clear button. Default "Clear text", or "مسح النص" under an Arabic Theme. */
  clearLabel?: string;
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

const INTERACTIVE_DIALOG = '[role="dialog"], [role="alertdialog"], dialog';

/** Sets the value as typing would, so a controlled owner hears onChange with the new value. */
function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
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
 *
 * The root carries `data-empty` while the value is empty. With `clearable`,
 * the clear part shows while the box holds focus and a value; it is in the
 * tab order after the input only while it shows.
 */
export function Input({
  size = 'md',
  shape = 'default',
  variant,
  clearable = false,
  clearLabel,
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
  onChange,
  onKeyDown,
  ...rest
}: InputProps) {
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });
  const inner = useRef<HTMLInputElement | null>(null);
  const { lang } = useTheme();
  const [empty, setEmpty] = useState(() => String(rest.value ?? rest.defaultValue ?? '') === '');
  const [focused, setFocused] = useState(false);
  // The value can change without an input event (a controlled value, a form reset, autofill): read it after every render.
  useLayoutEffect(() => {
    const input = inner.current;
    if (!input) return;
    const next = input.value === '';
    setEmpty((e) => (e === next ? e : next));
  });
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

  const canClear = clearable && !control.disabled && !control.readOnly;
  const showClear = canClear && focused && !empty;

  const clear = () => {
    const input = inner.current;
    if (!input) return;
    // Focus first (convention 15): the clear button goes away once the value is empty.
    input.focus();
    setNativeValue(input, '');
    setEmpty(true);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    setEmpty(event.target.value === '');
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Escape' || !canClear) return;
    // A key that ends an IME composition is not a command. Inside a dialog, Escape closes the dialog.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.currentTarget.value === '' || event.currentTarget.closest(INTERACTIVE_DIALOG)) return;
    event.preventDefault();
    clear();
  };

  const onRootFocus = (event: FocusEvent<HTMLDivElement>) => {
    rootProps?.onFocus?.(event);
    setFocused(true);
  };

  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    rootProps?.onBlur?.(event);
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setFocused(false);
  };

  const name = clearLabel ?? (lang.startsWith('ar') ? inputClearLabels.ar : inputClearLabels.en);

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      onMouseDown={onRootMouseDown}
      onFocus={clearable ? onRootFocus : rootProps?.onFocus}
      onBlur={clearable ? onRootBlur : rootProps?.onBlur}
      data-ds="input"
      data-size={size}
      data-shape={shape}
      data-variant={variant}
      data-empty={empty ? '' : undefined}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      data-readonly={control.readOnly ? '' : undefined}
    >
      <Adornment part="start" value={start} />
      <input
        {...rest}
        {...control}
        ref={setRef}
        type={type}
        onChange={onInputChange}
        onKeyDown={onInputKeyDown}
        data-part="control"
      />
      {showClear && (
        <CloseButton
          data-part="clear"
          label={name}
          size={size === 'lg' ? 'sm' : 'xs'}
          shape="pill"
          // Keep focus on the input while a pointer presses the button, so the button does not hide before the click.
          onMouseDown={(event) => event.preventDefault()}
          onClick={clear}
        />
      )}
      <Adornment part="end" value={end} />
    </div>
  );
}
