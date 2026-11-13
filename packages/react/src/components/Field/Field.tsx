'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { useMotion } from '../../internal/motion';
import { FollowGlide, placeFloatingLabel, playBeat, slideIn } from '@the-system/motion';
import { FieldError } from '../FieldError/FieldError';
import { Label, type LabelProps } from '../Label/Label';
import { FieldContext, useField, type FieldContextValue } from './context';

export { useField };
export { FieldError };
export type { FieldErrorProps } from '../FieldError/FieldError';

export type FieldOrientation = 'vertical' | 'horizontal';

export interface FieldProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Marks the control invalid. When it is not passed, the field is invalid
   * while it shows an error message. `false` hides the error message.
   */
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Shows the required mark on the label and sets aria-required on the control. */
  required?: boolean;
  /** vertical: label above the control. horizontal: label at the start, control at the end. Default vertical. */
  orientation?: FieldOrientation;
  /** One line API: renders a FieldLabel with this text before the children. */
  label?: ReactNode;
  /** One line API: renders a FieldDescription with this text after the children. */
  description?: ReactNode;
  /** One line API: renders a FieldError with this text after the children. */
  error?: ReactNode;
  /**
   * A floating label (order 1.23): the `label` rests inside the control's box
   * while the control is empty and has no focus, and rises to its place
   * above the box on focus or once there is a value. The label renders after
   * the control in the DOM (its paint order) and is drawn first; the
   * root carries `data-floating`, and `data-filled` while the control has a
   * value. Use it with the `label` prop and one single line control.
   */
  floating?: boolean;
}

/**
 * Wires one label, one description and one error message to one control.
 * The control reads the wiring with `useFieldControl()`, so Input, and later
 * Select and Textarea, need no extra prop.
 *
 * Order in the DOM: label, control, description, error. The description and
 * the error join the control's aria-describedby only while they render.
 */
export function Field({
  invalid,
  disabled = false,
  readOnly = false,
  required = false,
  orientation = 'vertical',
  label,
  description,
  error,
  floating = false,
  children,
  onInput,
  ...rest
}: FieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [filled, setFilled] = useState(false);
  // A floating label rests in the box only while the control is empty: read the value after every render
  // (a controlled value changes without an input event) and on every input.
  useLayoutEffect(() => {
    if (!floating) return;
    const control = rootRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea, select');
    const next = Boolean(control?.value);
    setFilled((f) => (f === next ? f : next));
    // The resting label sits in the control's box: read its height and text inset (review B6).
    placeFloatingLabel(rootRef.current);
  });
  // A style, a platform or a density that resizes the box after the first paint moves the label with it.
  useEffect(() => {
    const root = rootRef.current;
    if (!floating || !root || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => placeFloatingLabel(root));
    for (const child of Array.from(root.children)) ro.observe(child);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--_field-float-box');
      root.style.removeProperty('--_field-float-inset');
    };
  }, [floating]);
  // A message that enters or leaves resizes the field: what follows it glides to its new place, no jump (review N12).
  useEffect(() => {
    const root = rootRef.current;
    // A Field in a Form: the Form glides all of its rows at once.
    if (!root || root.parentElement?.closest('[data-ds="form"]')) return undefined;
    return new FollowGlide().watch(root);
  }, []);
  const base = useId();
  const [ownControlId, setOwnControlId] = useState<string | undefined>(undefined);
  const [counts, setCounts] = useState({ description: 0, error: 0 });
  // A description or an error that renders after the first paint slides in (order 1.22).
  const settled = useRef(false);
  useEffect(() => {
    settled.current = true;
  }, []);

  const register = useCallback((part: 'description' | 'error') => {
    setCounts((c) => ({ ...c, [part]: c[part] + 1 }));
    return () => setCounts((c) => ({ ...c, [part]: c[part] - 1 }));
  }, []);

  const hasError = counts.error > 0;
  const value = useMemo<FieldContextValue>(
    () => ({
      controlId: ownControlId ?? `${base}control`,
      labelId: `${base}label`,
      descriptionId: `${base}description`,
      errorId: `${base}error`,
      invalid: invalid ?? hasError,
      invalidProp: invalid,
      disabled,
      readOnly,
      required,
      hasDescription: counts.description > 0,
      hasError,
      register,
      setControlId: setOwnControlId,
      settled,
    }),
    [base, ownControlId, invalid, hasError, disabled, readOnly, required, counts.description, register],
  );

  return (
    <FieldContext value={value}>
      <div
        {...rest}
        ref={(node: HTMLDivElement | null) => {
          rootRef.current = node;
          const r = (rest as { ref?: unknown }).ref;
          if (typeof r === 'function') r(node);
          else if (r && typeof r === 'object') (r as { current: HTMLDivElement | null }).current = node;
        }}
        onInput={(event) => {
          onInput?.(event);
          if (floating) setFilled(Boolean((event.target as HTMLInputElement).value));
        }}
        data-ds="field"
        data-orientation={orientation}
        data-floating={floating ? '' : undefined}
        data-filled={floating && filled ? '' : undefined}
        data-invalid={value.invalid ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
      >
        {!floating && label !== undefined && label !== null && <FieldLabel>{label}</FieldLabel>}
        {children}
        {floating && label !== undefined && label !== null && <FieldLabel>{label}</FieldLabel>}
        {description !== undefined && description !== null && <FieldDescription>{description}</FieldDescription>}
        {error !== undefined && error !== null && <FieldError>{error}</FieldError>}
      </div>
    </FieldContext>
  );
}

export interface FieldLabelProps extends LabelProps {
  children?: ReactNode;
}

/**
 * The visible name of the control: the system Label, bound with htmlFor and
 * carrying `data-part="label"`. When the field is required the Label adds a
 * mark that is a glyph, not a color, and is hidden from the accessible name.
 * The control carries aria-required.
 */
export function FieldLabel({ children, htmlFor, ...rest }: FieldLabelProps) {
  const field = useField();
  return (
    <Label {...rest} id={rest.id ?? field?.labelId} htmlFor={htmlFor ?? field?.controlId} data-part="label">
      {children}
    </Label>
  );
}

export interface FieldDescriptionProps extends Omit<ComponentProps<'p'>, 'title'> {
  children?: ReactNode;
}

/** The interaction id of the description and error entrances in the registry. */
export const FIELD_MESSAGE_ENTER = 'field-message-enter';

/**
 * A hint that helps fill the control. Joins aria-describedby. One that
 * renders after the Field's first paint slides in from distance.shift above
 * and fades in on the soft spring (interaction field-message-enter).
 */
export function FieldDescription({ children, ref, ...rest }: FieldDescriptionProps) {
  const field = useField();
  const register = field?.register;
  const motion = useMotion();
  const el = useRef<HTMLParagraphElement | null>(null);
  useLayoutEffect(() => register?.('description'), [register]);
  const settled = field?.settled;
  useLayoutEffect(() => {
    if (settled?.current) playBeat(el.current, slideIn(), FIELD_MESSAGE_ENTER, motion.mode(FIELD_MESSAGE_ENTER));
    // Once, when the description mounts.
  }, []);
  return (
    <p
      {...rest}
      ref={(node: HTMLParagraphElement | null) => {
        el.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref && typeof ref === 'object') (ref as { current: HTMLParagraphElement | null }).current = node;
      }}
      id={rest.id ?? field?.descriptionId}
      data-part="description"
    >
      {children}
    </p>
  );
}

export interface FieldControlOptions {
  id?: string;
  'aria-describedby'?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

export interface FieldControlProps {
  id: string | undefined;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  'aria-required': true | undefined;
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
}

/**
 * The props a control spreads on its native element to join the nearest
 * Field: id (the label points at it), aria-describedby (description, then
 * error, then the control's own), aria-invalid, aria-required, disabled and
 * readOnly. A value the control passes itself wins over the Field.
 *
 * Required becomes aria-required, not the native required attribute, so the
 * browser does not show its own validation bubble. Outside a Field it
 * returns the control's own values.
 */
export function useFieldControl(own: FieldControlOptions = {}): FieldControlProps {
  const field = useField();
  const setControlId = field?.setControlId;
  useLayoutEffect(() => {
    if (!setControlId || own.id === undefined) return undefined;
    setControlId(own.id);
    return () => setControlId(undefined);
  }, [setControlId, own.id]);

  const invalid = own.invalid ?? field?.invalid ?? false;
  const disabled = own.disabled ?? field?.disabled ?? false;
  const readOnly = own.readOnly ?? field?.readOnly ?? false;
  const required = own.required ?? field?.required ?? false;
  const describedBy = [field?.hasDescription ? field.descriptionId : undefined, field?.hasError ? field.errorId : undefined, own['aria-describedby']]
    .filter(Boolean)
    .join(' ');

  return {
    id: own.id ?? field?.controlId,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': invalid ? true : undefined,
    'aria-required': required ? true : undefined,
    disabled: disabled || undefined,
    readOnly: readOnly || undefined,
  };
}
