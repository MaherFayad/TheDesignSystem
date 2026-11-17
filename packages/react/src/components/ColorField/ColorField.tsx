'use client';
// ColorField: type a colour as hex, or one channel as a number (order M9.18,
// proposed). Behavior from React Aria `ColorField` (react-aria-components):
// parsing while typing, commit on blur and Enter, the arrow keys and
// PageUp and PageDown to step, Home and End for the ends of a channel, the
// hidden form input, and the announcement of a committed value.
//
// It is the typed path beside a ColorSlider, ColorSwatchPicker or the
// colour area of order M9.20: nothing in it needs a drag (WCAG 2.2 2.5.7).
//
// Every element is ours: React Aria's `render` props hand us its DOM props,
// and we render the system root (the field box, as NumberField draws it),
// a preview swatch at the start and the native input. React Aria's class
// names and data attributes are dropped; the system stamps its own.
//
// Inside a Field it reads the label, ids, invalid, disabled, read only and
// required, as NumberField does. Without a Field and without a name, it is
// named "Hex" ("رمز اللون") or the channel's name.
//
// Digits stay Western in every language (`-u-nu-latn`). The value runs left
// to right in right to left pages: a hex code and a number are not words.
//
// DOM:
//   div [data-ds=color-field]
//     span [data-part=start] > div [data-ds=color-swatch][data-part=preview] aria-hidden
//     input [data-part=control]
import { use, useRef, type ComponentProps, type MouseEvent, type Ref } from 'react';
import {
  ColorField as AriaColorField,
  ColorFieldStateContext,
  I18nProvider,
  Input as AriaInput,
  type Color,
  type ColorSpace,
} from 'react-aria-components';
import { colorLocale, colorWords, type ColorChannelName, type Shape, type Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { ColorSwatch } from '../ColorSwatch/ColorSwatch';
import { flag, mergeRefs, racOwnProps } from '../ColorSwatch/racProps';
import { useField, useFieldControl } from '../Field/Field';

export type ColorFieldSize = Size;
export type ColorFieldShape = Extract<Shape, 'default' | 'pill'>;
export type ColorFieldChannel = ColorChannelName;

export interface ColorFieldProps
  extends Omit<ComponentProps<'input'>, 'size' | 'value' | 'defaultValue' | 'onChange' | 'ref' | 'className' | 'style' | 'type' | 'title' | 'color'> {
  /** The colour, controlled: a hex, rgb() or hsl() string, a React Aria Color, or null for empty. */
  value?: string | Color | null;
  /** The first colour, uncontrolled. */
  defaultValue?: string | Color | null;
  /** Called with the committed colour as hex (#rrggbb, or #rrggbbaa when see through) and as a Color, or null when emptied. */
  onChange?: (value: string | null, color: Color | null) => void;
  /** Edit one channel as a number instead of the hex code. */
  channel?: ColorFieldChannel;
  /** The colour space of the channel. Default: the space of the value. */
  colorSpace?: ColorSpace;
  /** Height from size.control. Default md. */
  size?: ColorFieldSize;
  /** default: the radius of the active style. pill: fully round. */
  shape?: ColorFieldShape;
  /** Shows the colour as a small swatch at the start. Default true for hex, false for a channel. */
  preview?: boolean;
  /** Marks the value invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** The locale of the default name and the number format. Default the language of the nearest Theme. Digits stay Western. */
  locale?: string;
  className?: string;
  style?: ComponentProps<'div'>['style'];
  /** Props for the root box. */
  rootProps?: Omit<ComponentProps<'div'>, 'ref'>;
  /** The native input. */
  ref?: Ref<HTMLInputElement>;
}

const INTERACTIVE = 'button, a[href], input, select, textarea, [tabindex]';
const outOf = (color: Color | null) =>
  color === null ? null : (color.getChannelValue('alpha') < 1 ? color.toString('hexa') : color.toString('hex')).toLowerCase();

function Preview({ lang }: { lang: string }) {
  const state = use(ColorFieldStateContext);
  const color = state?.colorValue ?? '#0000';
  return (
    <span data-part="start">
      <ColorSwatch data-part="preview" aria-hidden="true" color={color} locale={lang} size="xs" shape="default" />
    </span>
  );
}

export function ColorField({
  value,
  defaultValue,
  onChange,
  channel,
  colorSpace,
  size = 'md',
  shape = 'default',
  preview,
  invalid,
  disabled,
  readOnly,
  required,
  locale,
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
}: ColorFieldProps) {
  const theme = useTheme();
  const lang = locale ?? theme.lang;
  const words = colorWords(lang);
  const field = useField();
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });
  const inner = useRef<HTMLInputElement | null>(null);
  const labelledBy = ariaLabelledBy ?? (ariaLabel === undefined ? field?.labelId : undefined);
  const named = ariaLabel ?? (labelledBy ? undefined : channel ? words.channels[channel] : words.hex);
  const showPreview = preview ?? !channel;

  const onRootMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    rootProps?.onMouseDown?.(event);
    const input = inner.current;
    if (event.defaultPrevented || !input || input.disabled) return;
    const target = event.target as Element;
    if (target === input) return;
    const match = target.closest(INTERACTIVE);
    if (match && match !== event.currentTarget && event.currentTarget.contains(match)) return;
    event.preventDefault();
    input.focus();
  };

  return (
    <I18nProvider locale={colorLocale(lang)}>
      <AriaColorField
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (color) => onChange(outOf(color), color) : undefined}
        channel={channel}
        colorSpace={colorSpace}
        id={control.id}
        name={name}
        form={form}
        autoFocus={autoFocus}
        isInvalid={control['aria-invalid'] ?? false}
        isDisabled={control.disabled ?? false}
        isReadOnly={control.readOnly ?? false}
        isRequired={control['aria-required'] ?? false}
        validationBehavior="aria"
        aria-label={named}
        aria-labelledby={labelledBy}
        aria-describedby={control['aria-describedby']}
        render={(domProps) => {
          const { ref: rootRef, ...own } = racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'div'>;
          return (
            <div
              {...own}
              {...rootProps}
              ref={rootRef}
              className={className}
              style={style}
              onMouseDown={onRootMouseDown}
              data-ds="color-field"
              data-size={size}
              data-shape={shape}
              data-channel={channel}
              data-invalid={flag(control['aria-invalid'])}
              data-disabled={flag(control.disabled)}
              data-readonly={flag(control.readOnly)}
            />
          );
        }}
      >
        {showPreview && <Preview lang={lang} />}
        <AriaInput
          {...(rest as Omit<ComponentProps<typeof AriaInput>, 'ref'>)}
          placeholder={placeholder}
          render={(domProps) => {
            const { ref: ariaRef, ...own } = racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'input'>;
            return <input {...own} ref={mergeRefs(ariaRef, inner, ref)} data-part="control" spellCheck={false} autoComplete="off" />;
          }}
        />
      </AriaColorField>
    </I18nProvider>
  );
}
