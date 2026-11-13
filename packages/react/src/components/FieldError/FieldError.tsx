'use client';
import { useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { Icon } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';
import { useMotion } from '../../internal/motion';
import { useField } from '../Field/context';
import { emerge, landPop, playBeat } from '@the-system/motion';

/** The interaction id of the error entrance in the registry. */
export const FIELD_ERROR_ENTER = 'field-error-enter';

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
 *
 * Motion (interaction field-error-enter, order 1.23, proposed): an error
 * that shows after the first paint slides down a full line from behind its
 * own top edge (a clip-path holds the edge still), so it comes out from
 * under the control, and fades in on the soft spring; one stagger
 * step later its icon lands from scale.morph past full size on the bouncy
 * spring. The control shakes at the same time (error-shake). The message is
 * in the DOM and read at once; the content under the field moves down at
 * once, since height may not animate.
 */
export function FieldError({ size = 'md', children, ref, ...rest }: FieldErrorProps) {
  const field = useField();
  const shown = children !== undefined && children !== null && children !== false && children !== '' && field?.invalidProp !== false;
  const register = field?.register;
  useLayoutEffect(() => (shown ? register?.('error') : undefined), [shown, register]);
  const motion = useMotion();
  const el = useRef<HTMLParagraphElement | null>(null);
  // Alone, an error enters when it turns on after this component's first render.
  const alone = useRef(false);
  const settled = field?.settled;
  useLayoutEffect(() => {
    const ready = settled ? settled.current : alone.current;
    alone.current = true;
    const root = el.current;
    if (!shown || !ready || !root) return;
    const mode = motion.mode(FIELD_ERROR_ENTER);
    playBeat(root, emerge(), FIELD_ERROR_ENTER, mode);
    playBeat(root.querySelector(':scope > [data-part="icon"]'), landPop(undefined, { delay: 'delay.stagger' }), `${FIELD_ERROR_ENTER}-icon`, mode, null);
  }, [shown, settled, motion]);
  if (!shown) return null;
  return (
    <p
      {...rest}
      ref={(node: HTMLParagraphElement | null) => {
        el.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref && typeof ref === 'object') (ref as { current: HTMLParagraphElement | null }).current = node;
      }}
      id={field ? field.errorId : rest.id}
      data-ds="field-error"
      data-part={field ? 'error' : undefined}
      data-size={size}
    >
      <Icon name="danger" size={size === 'sm' ? 'sm' : 'md'} data-part="icon" />
      <span data-part="message">{children}</span>
    </p>
  );
}
