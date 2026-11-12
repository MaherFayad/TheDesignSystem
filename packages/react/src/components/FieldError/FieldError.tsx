'use client';
import { useLayoutEffect, type ComponentProps, type ReactNode } from 'react';
import { Icon } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useField } from '../Field/context';

export type FieldErrorSize = Extract<Size, 'sm' | 'md'>;

export interface FieldErrorProps extends Omit<ComponentProps<'p'>, 'title'> {
  /** Text size. md matches a Field; sm sits under a small control. Default md. */
  size?: FieldErrorSize;
  children?: ReactNode;
}

/**
 * What is wrong and how to fix it: a danger icon and a message, so the
 * error never relies on color alone. It renders only when it has content.
 *
 * Inside a Field it is the `error` part: it takes the Field's error id,
 * joins the control's aria-describedby and makes the Field invalid while it
 * renders. `invalid={false}` on the Field hides it. There the Field's id
 * wins over an id passed in, so aria-describedby always finds it. Alone, give it an id and
 * point the control's aria-describedby at it, and set aria-invalid on the
 * control.
 *
 * It is not a live region and never role="alert": an error that is on the
 * page when it loads must not interrupt. A screen reader reads it with the
 * control, through aria-describedby, when focus lands there. A form that
 * checks on submit moves focus to the first invalid control.
 */
export function FieldError({ size = 'md', children, ...rest }: FieldErrorProps) {
  const field = useField();
  const shown = children !== undefined && children !== null && children !== false && children !== '' && field?.invalidProp !== false;
  const register = field?.register;
  useLayoutEffect(() => (shown ? register?.('error') : undefined), [shown, register]);
  if (!shown) return null;
  return (
    <p {...rest} id={field ? field.errorId : rest.id} data-ds="field-error" data-part={field ? 'error' : undefined} data-size={size}>
      <Icon name="danger" size={size === 'sm' ? 'sm' : 'md'} data-part="icon" />
      <span data-part="message">{children}</span>
    </p>
  );
}
