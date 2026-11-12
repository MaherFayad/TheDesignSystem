'use client';
// NumberField: a number with step buttons, locale formatting, units and
// bounds. Behavior from React Aria `NumberField` (react-aria-components):
// parsing while typing, the spin keys, commit on blur and Enter, the
// announcement of a committed value, the hidden form input.
//
// Every element is ours: React Aria's `render` prop hands us its DOM props
// and we render the system root, the native input and two system
// IconButtons. React Aria stamps boolean state attributes as "true"; we
// drop its data attributes and stamp our own, present and empty when true
// (anatomy.md).
//
// Additions to React Aria:
// - Digits stay Western in every language (`ar-u-nu-latn`). Arabic Indic
//   digits and the Arabic decimal and thousands marks are turned into
//   Western ones as they are typed, so the value never jumps on blur.
// - PageUp and PageDown step by ten steps (React Aria steps by one).
// - Inside a Field it reads ids, invalid, disabled, read only and required.
import {
  use,
  useEffect,
  useRef,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button as AriaButton,
  I18nProvider,
  Input as AriaInput,
  NumberField as AriaNumberField,
  NumberFieldStateContext,
} from 'react-aria-components';
import { isIconName, type IconName } from '@the-system/icons';
import { Icon } from '@the-system/icons/react';
import {
  ARABIC_COMMA,
  ARABIC_DECIMAL_MARK,
  ARABIC_GROUP_MARK,
  clamp,
  latinLocale,
  numberSeparators,
  parseNumber,
  snapToStep,
  toLatinDigits,
  type Shape,
  type Size,
} from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useField, useFieldControl } from '../Field/Field';
import { IconButton, type IconButtonProps } from '../IconButton/IconButton';

export type NumberFieldSize = Size;
export type NumberFieldShape = Extract<Shape, 'default' | 'pill'>;
/** An icon name, a short text such as "kg" or "SAR", or any node. */
export type NumberFieldAdornment = IconName | (string & {}) | ReactNode;

export interface NumberFieldProps
  extends Omit<
    ComponentProps<'input'>,
    | 'size'
    | 'type'
    | 'prefix'
    | 'title'
    | 'ref'
    | 'className'
    | 'style'
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'min'
    | 'max'
    | 'step'
    | 'children'
  > {
  /** The value, controlled. `null` is an empty field. */
  value?: number | null;
  /** The first value, uncontrolled. Default empty. */
  defaultValue?: number | null;
  /** Called with the committed value: after a step, on blur and on Enter. `null` when emptied. */
  onChange?: (value: number | null) => void;
  /** The lowest value. Home goes to it. */
  min?: number;
  /** The highest value. End goes to it. */
  max?: number;
  /** One step of the arrow keys and the step buttons. PageUp and PageDown move ten steps. Default 1. */
  step?: number;
  /**
   * Intl number format options: decimals, a percent, a currency or a unit
   * (`{ style: 'unit', unit: 'kilogram' }`). The value is formatted with
   * them on commit. Digits stay Western unless `numberingSystem` is set.
   */
  formatOptions?: Intl.NumberFormatOptions;
  /** The locale of the format. Default the language of the nearest Theme. */
  locale?: string;
  /** Height from size.control. Default md. */
  size?: NumberFieldSize;
  /** default takes radius.control from the style. pill is always fully round. */
  shape?: NumberFieldShape;
  /** Marks the value invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Shows the step buttons. They hide while read only. Default true. */
  steppers?: boolean;
  /** The accessible name of the increment button. Default "Increase" and the field name, in the locale. */
  incrementLabel?: string;
  /** The accessible name of the decrement button. Default "Decrease" and the field name, in the locale. */
  decrementLabel?: string;
  /** Adornment at the start: an icon name, a short text or a node. */
  start?: NumberFieldAdornment;
  /** Adornment at the end, such as a unit: an icon name, a short text or a node. */
  end?: NumberFieldAdornment;
  /** Class name of the root, the bordered box. */
  className?: string;
  /** Inline style of the root, the bordered box. */
  style?: ComponentProps<'div'>['style'];
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the native input. */
  ref?: Ref<HTMLInputElement>;
}

/**
 * React Aria's own attributes we never pass on: its class, slot and data
 * states (`data-rac`, and every boolean one, which it writes as "true").
 */
function ownProps<T extends Record<string, unknown>>(props: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className' || key === 'style' || key === 'slot' || key === 'data-rac') continue;
    if (key.startsWith('data-') && typeof value === 'boolean') continue;
    out[key] = value;
  }
  return out as T;
}

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';
/** Arabic marks a person may type, mapped to the field locale as they are typed. */
const ARABIC_MARKS = new RegExp(`[${ARABIC_DECIMAL_MARK}${ARABIC_GROUP_MARK}${ARABIC_COMMA}]`, 'g');

/** Turns Arabic Indic digits and the Arabic marks into Western digits and the marks of the locale, one for one. */
function westernize(text: string, locale: string): string {
  const { decimal, group } = numberSeparators(locale);
  return toLatinDigits(text).replace(ARABIC_MARKS, (mark) => (mark === ARABIC_DECIMAL_MARK ? decimal : group));
}

/**
 * React Aria checks each keystroke in a native beforeinput listener on the
 * input and refuses Arabic Indic digits under a Western numbering locale.
 * This listener runs first, in the capture phase on the root, and inserts
 * the Western text instead, which React Aria then accepts. Paste the same.
 */
function useWesternInput(root: { current: HTMLDivElement | null }, locale: string) {
  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const insert = (event: Event, text: string | null | undefined) => {
      if (!text || !(event.target instanceof HTMLInputElement)) return;
      const latin = westernize(text, locale);
      if (latin === text) return;
      event.preventDefault();
      event.stopPropagation();
      // insertText keeps undo and fires a fresh beforeinput with the Western text.
      if (!document.execCommand('insertText', false, latin)) {
        const input = event.target;
        input.setRangeText(latin, input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length, 'end');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    const onBeforeInput = (event: Event) => {
      const e = event as InputEvent;
      if (e.inputType === 'insertText' || e.inputType === 'insertReplacementText') insert(e, e.data);
    };
    const onPaste = (event: ClipboardEvent) => insert(event, event.clipboardData?.getData('text/plain'));
    el.addEventListener('beforeinput', onBeforeInput, true);
    el.addEventListener('paste', onPaste, true);
    return () => {
      el.removeEventListener('beforeinput', onBeforeInput, true);
      el.removeEventListener('paste', onPaste, true);
    };
  }, [root, locale]);
}

function Adornment({ part, value }: { part: 'start' | 'end'; value: NumberFieldAdornment }) {
  if (value === undefined || value === null || value === false) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    // Icons and units are decoration: the label names the field and the format carries the unit.
    return (
      <span data-part={part} aria-hidden="true">
        {typeof value === 'string' && isIconName(value) ? <Icon name={value} /> : value}
      </span>
    );
  }
  return <span data-part={part}>{value}</span>;
}

interface StepperProps {
  slot: 'increment' | 'decrement';
  size: IconButtonProps['size'];
  shape: NumberFieldShape;
  label: string | undefined;
  /** The id of the field's visible label: the button is named "Increase" plus that label. */
  labelledBy: string | undefined;
}

/** A React Aria step button rendered as the system IconButton. */
function Stepper({ slot, size, shape, label, labelledBy }: StepperProps) {
  return (
    <AriaButton
      slot={slot}
      aria-label={label}
      render={(domProps, renderProps) => {
        // React Aria sets native disabled at a bound; the system keeps the
        // button focusable with aria-disabled. type is always button.
        const { disabled: _disabled, type: _type, ...rest } = ownProps(domProps as Record<string, unknown>);
        // With a visible label and no name of its own, the button reads its
        // own word and then the label: "Increase Guests".
        const named = label === undefined && labelledBy !== undefined && rest['aria-labelledby'] == null;
        return (
          <IconButton
            {...(rest as Omit<IconButtonProps, 'icon' | 'label'>)}
            aria-labelledby={named ? `${String(rest.id)} ${labelledBy}` : (rest['aria-labelledby'] as string | undefined)}
            data-part={slot}
            icon={slot === 'increment' ? 'plus' : 'minus'}
            label={String(rest['aria-label'] ?? '')}
            size={size}
            shape={shape === 'pill' ? 'pill' : 'default'}
            disabled={renderProps.isDisabled}
          />
        );
      }}
    />
  );
}

interface ControlProps {
  locale: string;
  step: number;
  min: number | undefined;
  max: number | undefined;
  ref: Ref<HTMLInputElement> | undefined;
  inner: { current: HTMLInputElement | null };
  /** Native input props React Aria leaves alone: placeholder, autoComplete, data and aria attributes. */
  native: ComponentProps<'input'>;
}

/** The native input, with Western digits on input and PageUp and PageDown by ten steps. */
function Control({ locale, step, min, max, ref, inner, native }: ControlProps) {
  const state = use(NumberFieldStateContext);
  return (
    <AriaInput
      {...(native as Omit<ComponentProps<typeof AriaInput>, 'ref'>)}
      ref={ref}
      render={(domProps) => {
        const props = ownProps(domProps as Record<string, unknown>) as ComponentProps<'input'>;
        const ariaRef = props.ref;
        return (
          <input
            {...props}
            ref={(node) => {
              inner.current = node;
              if (typeof ariaRef === 'function') ariaRef(node);
              else if (ariaRef && typeof ariaRef === 'object') (ariaRef as { current: HTMLInputElement | null }).current = node;
            }}
            data-part="control"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              // A fallback for input that skips beforeinput (autofill, tests).
              const raw = event.target.value;
              const latin = westernize(raw, locale);
              if (latin !== raw) {
                // One for one, so the caret stays where it was.
                const caret = event.target.selectionStart;
                event.target.value = latin;
                if (caret !== null) event.target.setSelectionRange(caret, caret);
              }
              props.onChange?.(event);
            }}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if ((event.key === 'PageUp' || event.key === 'PageDown') && state && !props.readOnly && !props.disabled) {
                event.preventDefault();
                const up = event.key === 'PageUp';
                // The typed text first, as React Aria steps from it; from empty, start at the bound, as React Aria does.
                const typed = parseNumber(state.inputValue, locale);
                const from = Number.isNaN(typed) ? state.numberValue : typed;
                const next = Number.isNaN(from)
                  ? snapToStep((up ? min : max) ?? 0, step, min, max)
                  : snapToStep(clamp(from + (up ? 10 : -10) * step, min, max), step, min, max);
                if (next === state.numberValue) state.commit();
                else state.setNumberValue(next);
                state.commitValidation();
                // A caller's onKeyDown does not see PageUp and PageDown: React Aria's handler shares it and would step again.
                return;
              }
              props.onKeyDown?.(event);
            }}
          />
        );
      }}
    />
  );
}

/**
 * A number in a bordered box, with a decrement and an increment button at
 * the two ends. Typing allows Western and Arabic Indic digits; the value is
 * formatted with the locale on blur and on Enter, with Western digits.
 */
export function NumberField({
  value,
  defaultValue,
  onChange,
  min,
  max,
  step,
  formatOptions,
  locale,
  size = 'md',
  shape = 'default',
  invalid,
  disabled,
  readOnly,
  required,
  steppers = true,
  incrementLabel,
  decrementLabel,
  start,
  end,
  className,
  style,
  rootProps,
  id,
  ref,
  name,
  form,
  autoFocus,
  placeholder,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': describedBy,
  ...rest
}: NumberFieldProps) {
  const theme = useTheme();
  const field = useField();
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });
  const inner = useRef<HTMLInputElement | null>(null);
  const rootEl = useRef<HTMLDivElement | null>(null);
  const tag = latinLocale(locale ?? theme.lang);
  const labelledBy = ariaLabelledBy ?? (ariaLabel === undefined ? field?.labelId : undefined);
  // PageUp and PageDown step as React Aria does: 0.01 for a percent with no step, else 1.
  const pageStep = step ?? (formatOptions?.style === 'percent' ? 0.01 : 1);
  useWesternInput(rootEl, tag);
  const stepperSize: IconButtonProps['size'] = size === 'lg' ? 'md' : 'xs';
  const showSteppers = steppers && !control.readOnly;

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
    <I18nProvider locale={tag}>
      <AriaNumberField
        value={value === null ? Number.NaN : value}
        defaultValue={defaultValue === null ? Number.NaN : defaultValue}
        onChange={onChange ? (next) => onChange(Number.isNaN(next) ? null : next) : undefined}
        minValue={min}
        maxValue={max}
        step={step}
        formatOptions={formatOptions}
        id={control.id}
        name={name}
        form={form}
        autoFocus={autoFocus}
        isInvalid={control['aria-invalid'] ?? false}
        isDisabled={control.disabled ?? false}
        isReadOnly={control.readOnly ?? false}
        isRequired={control['aria-required'] ?? false}
        validationBehavior="aria"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={control['aria-describedby']}
        incrementAriaLabel={incrementLabel}
        decrementAriaLabel={decrementLabel}
        render={(domProps) => {
          const { ref: rootRef, ...own } = ownProps(domProps as Record<string, unknown>) as ComponentProps<'div'>;
          return (
            <div
              {...own}
              {...rootProps}
              ref={(node: HTMLDivElement | null) => {
                rootEl.current = node;
                if (typeof rootRef === 'function') rootRef(node);
                else if (rootRef && typeof rootRef === 'object') (rootRef as { current: HTMLDivElement | null }).current = node;
              }}
              className={className}
              style={style}
              onMouseDown={onRootMouseDown}
              data-ds="number-field"
              data-size={size}
              data-shape={shape}
              data-invalid={control['aria-invalid'] ? '' : undefined}
              data-disabled={control.disabled ? '' : undefined}
              data-readonly={control.readOnly ? '' : undefined}
            />
          );
        }}
      >
        {showSteppers && <Stepper slot="decrement" size={stepperSize} shape={shape} label={decrementLabel} labelledBy={labelledBy} />}
        <Adornment part="start" value={start} />
        <Control locale={tag} step={pageStep} min={min} max={max} ref={ref} inner={inner} native={{ ...rest, placeholder }} />
        <Adornment part="end" value={end} />
        {showSteppers && <Stepper slot="increment" size={stepperSize} shape={shape} label={incrementLabel} labelledBy={labelledBy} />}
      </AriaNumberField>
    </I18nProvider>
  );
}

