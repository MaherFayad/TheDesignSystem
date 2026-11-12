'use client';
// PasswordField: a password input with a show and hide toggle, built on
// Input. Hand built: the Radix password toggle field is exported as
// unstable_, so it is not used.
//
// No source: designed from the dials table (PLAN.md 3.7) and the nearest
// component, Input with an end IconButton.
//
// The root is the bordered box. The nested Input is the control part and
// keeps the native input, the Field wiring and the ref; this component's
// CSS clears its own box through its private --_input-* properties. The
// toggle is an IconButton with aria-pressed; its name also says what a
// press does, as the order asks.
//
// Motion (order 1.21): a press on the toggle swaps its glyph and fades the
// text back in (password-reveal); the type changes at once, the motion only
// decorates it. The box shakes when the field turns invalid (error-shake).
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type MouseEvent, type Ref } from 'react';
import type { Shape, Size } from '@the-system/shared';
import { useField } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { Input, type InputProps } from '../Input/Input';
import { useErrorShake, type ShakeBox } from '../Input/useErrorShake';
import { useMotion } from '../../internal/motion';

export type PasswordFieldSize = Size;
export type PasswordFieldShape = Extract<Shape, 'default' | 'pill'>;

export interface PasswordFieldProps extends Omit<InputProps, 'type' | 'start' | 'end' | 'size' | 'shape' | 'ref'> {
  /** Height from size.control. Default md. */
  size?: PasswordFieldSize;
  /** default takes radius.control from the style (a pill in Studio and Desk). pill is always fully round. */
  shape?: PasswordFieldShape;
  /** The value shows as plain text, controlled. Pair it with onVisibleChange. */
  visible?: boolean;
  /** The value shows as plain text at first, uncontrolled. Default false. */
  defaultVisible?: boolean;
  /** Called when the toggle shows or hides the value, and with false when the form submits. */
  onVisibleChange?: (visible: boolean) => void;
  /** The toggle's name while the value is hidden. Default "Show password". Arabic: "إظهار كلمة المرور". */
  showLabel?: string;
  /** The toggle's name while the value shows. Default "Hide password". Arabic: "إخفاء كلمة المرور". */
  hideLabel?: string;
  /**
   * current-password to sign in, new-password to set one, so password
   * managers fill and suggest (WCAG 3.3.8). Default current-password.
   */
  autoComplete?: 'current-password' | 'new-password' | 'off' | (string & {});
  /** Goes to the native input. */
  ref?: Ref<HTMLInputElement>;
}

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

/** The bordered box: the root, around the nested Input. */
const fieldBox: ShakeBox = (input) => input.closest("[data-ds='password-field']");

/**
 * A password input. The toggle shows or hides the value; focus stays on
 * the toggle. Paste is never blocked. The value hides again when the form
 * around it submits, so it is not left on screen.
 */
export function PasswordField({
  size = 'md',
  shape = 'default',
  visible,
  defaultVisible = false,
  onVisibleChange,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  autoComplete = 'current-password',
  invalid,
  disabled,
  readOnly,
  className,
  style,
  rootProps,
  id,
  ref,
  ...rest
}: PasswordFieldProps) {
  const field = useField();
  const generated = useId();
  const inner = useRef<HTMLInputElement | null>(null);
  const [own, setOwn] = useState(defaultVisible);
  const shown = visible ?? own;

  const isInvalid = invalid ?? field?.invalid ?? false;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const isReadOnly = readOnly ?? field?.readOnly ?? false;
  // Inside a Field the Field gives the id; alone, the toggle needs one to point at.
  const inputId = id ?? (field ? undefined : generated);
  const controls = inputId ?? field?.controlId;
  const motion = useMotion();
  // Set by a press on the toggle, read once the new type is drawn.
  const toggled = useRef(false);
  useErrorShake(inner, isInvalid, fieldBox);

  // password-reveal: after the type changed, the new glyph rolls in and the text fades back in.
  useLayoutEffect(() => {
    if (!toggled.current) return;
    toggled.current = false;
    const input = inner.current;
    const glyph = input?.closest("[data-ds='password-field']")?.querySelector(":scope > [data-part='toggle'] > [data-part='icon']");
    motion.play(glyph, 'swap', 'password-reveal', { phase: 'enter', direction: shown ? 'up' : 'down' });
    motion.play(input, 'fade', 'password-reveal');
  }, [shown, motion]);

  const setShown = useCallback(
    (next: boolean) => {
      if (visible === undefined) setOwn(next);
      onVisibleChange?.(next);
    },
    [visible, onVisibleChange],
  );

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

  // Hide the value again when the form submits.
  useEffect(() => {
    const form = inner.current?.form;
    if (!form || !shown) return undefined;
    // flushSync: the input is type password again before the browser reads the form.
    const hide = () => flushSync(() => setShown(false));
    form.addEventListener('submit', hide);
    return () => form.removeEventListener('submit', hide);
  }, [shown, setShown]);

  const onRootMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    rootProps?.onMouseDown?.(event);
    const input = inner.current;
    if (event.defaultPrevented || !input || input.disabled) return;
    const target = event.target as Element;
    if (target === input) return;
    const root = event.currentTarget;
    const match = target.closest(INTERACTIVE);
    if (match && match !== root && root.contains(match)) return;
    event.preventDefault();
    input.focus();
  };

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      onMouseDown={onRootMouseDown}
      data-ds="password-field"
      data-size={size}
      data-shape={shape}
      data-visible={shown ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      data-readonly={isReadOnly ? '' : undefined}
    >
      <Input
        {...rest}
        id={inputId}
        ref={setRef}
        type={shown ? 'text' : 'password'}
        size={size}
        shape={shape}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        invalid={invalid}
        disabled={disabled}
        readOnly={readOnly}
        rootProps={{ 'data-part': 'control' } as ComponentProps<'div'>}
      />
      <IconButton
        data-part="toggle"
        icon={shown ? 'eye-off' : 'eye'}
        label={shown ? hideLabel : showLabel}
        aria-pressed={shown}
        aria-controls={controls}
        size={size === 'lg' ? 'sm' : 'xs'}
        shape="pill"
        disabled={isDisabled}
        onClick={() => {
          toggled.current = true;
          setShown(!shown);
        }}
      />
    </div>
  );
}
