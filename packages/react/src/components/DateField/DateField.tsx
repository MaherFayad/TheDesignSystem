'use client';
// DateField: a date typed in parts, day, month and year, each its own
// segment (order M9.17, proposed). Behavior from React Aria `DateField`
// (react-aria-components): the segments, typing, the arrow keys, the
// placeholders, min and max, validation and the hidden form input.
//
// Every element is ours: React Aria's `render` prop hands us its DOM props
// and we render the system root and the segments (segments.tsx). React Aria
// stamps boolean data attributes as "true"; we drop them and stamp our own,
// present and empty when true (anatomy.md).
//
// Values are ISO Gregorian dates ("2026-11-17") in and out, whatever
// calendar is drawn. `calendar` (gregory or islamic-umalqura) is a display
// choice set on the locale with -u-ca-, never left to the locale's default,
// and the locale always carries -u-nu-latn (dateLocale from
// @the-system/shared), so the segments, the placeholders, the names React
// Aria reads and the values it announces keep Western digits in Arabic.
// The order of the segments and the separators between them come from Intl.
//
// DOM:
//   div [data-ds=date-field] data-size data-invalid? data-disabled? data-readonly?   React Aria's root, the box
//     div [data-part=input] role=group aria-labelledby                               React Aria's DateInput
//       span [data-part=segment][data-type=day|month|year] role=spinbutton data-placeholder?
//       span [data-part=literal] aria-hidden                                         a separator from Intl
//
// Inside a Field the field's label names the group and its description and
// error join aria-describedby, as with Input.
//
// Motion: none of its own. The box border swaps colors on focus and
// invalid on duration.base, as Input's does (DateField.css).
import { useCallback, useMemo, type ComponentProps, type MouseEvent, type Ref } from 'react';
import { DateField as AriaDateField, I18nProvider } from 'react-aria-components';
import type { CalendarDate, DateValue } from '@internationalized/date';
import { dateLocale, fromIsoDate, isIsoDate, toIsoDate, type CalendarSystem, type Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useField, useFieldControl } from '../Field/Field';
import { isArabicLocale, ownProps, SegmentRow, type Props } from './segments';

export type DateFieldSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface DateFieldProps
  extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref' | 'children' | 'title' | 'placeholder'> {
  /** The date, controlled: an ISO Gregorian date such as "2026-11-17", or null for none. */
  value?: string | null;
  /** The first date, uncontrolled. */
  defaultValue?: string | null;
  /** Called with the ISO Gregorian date once every segment is filled, and with null when one is cleared. */
  onChange?: (value: string | null) => void;
  /** The earliest date, ISO. An earlier date marks the field invalid. */
  minValue?: string;
  /** The latest date, ISO. A later date marks the field invalid. */
  maxValue?: string;
  /** Marks dates that cannot be chosen; such a date marks the field invalid. Gets the ISO date and the drawn date. */
  isDateUnavailable?: (value: string, date: CalendarDate) => boolean;
  /** The date the segments step from while they are empty, ISO. Default today. */
  placeholderValue?: string;
  /** The calendar the segments are drawn in: gregory (default) or islamic-umalqura. Values stay ISO Gregorian. */
  calendar?: CalendarSystem;
  /** The locale of the segment order and the separators, such as ar-SA. Default the language of the nearest Theme. Digits stay Western. */
  locale?: string;
  /** The height of the box: size.control.sm, md (default) or lg. */
  size?: DateFieldSize;
  /** Marks the field invalid. Inside a Field the field decides when this is not passed. */
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** The name of the hidden form input that carries the ISO date. */
  name?: string;
  /** Focuses the first segment on mount. */
  autoFocus?: boolean;
  ref?: Ref<HTMLDivElement>;
}

const parse = (iso: string | null | undefined): DateValue | null | undefined => {
  if (iso === undefined) return undefined;
  if (iso === null || !isIsoDate(iso)) return null;
  return fromIsoDate(iso);
};

/** A press on the box, not on a segment, focuses the first empty segment, else the last one. */
export function focusSegment(event: MouseEvent<HTMLDivElement>) {
  if (event.defaultPrevented) return;
  const root = event.currentTarget;
  const target = event.target as Element;
  if (target.closest('[data-part="segment"]')) return;
  const segments = Array.from(root.querySelectorAll<HTMLElement>('[data-part="segment"]'));
  const next = segments.find((s) => s.hasAttribute('data-placeholder')) ?? segments.at(-1);
  if (!next || next.getAttribute('aria-disabled') === 'true') return;
  event.preventDefault();
  next.focus();
}

export function DateField({
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  isDateUnavailable,
  placeholderValue,
  calendar = 'gregory',
  locale,
  size = 'md',
  invalid,
  disabled,
  readOnly,
  required,
  name,
  autoFocus,
  id,
  ref,
  className,
  style,
  onMouseDown,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': describedBy,
  ...rest
}: DateFieldProps) {
  const theme = useTheme();
  const field = useField();
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });
  const tag = dateLocale(locale ?? theme.lang, calendar);
  const labelledBy = ariaLabelledBy ?? (ariaLabel === undefined ? field?.labelId : undefined);

  const dates = useMemo(
    () => ({
      value: parse(value),
      defaultValue: parse(defaultValue),
      minValue: parse(minValue) ?? undefined,
      maxValue: parse(maxValue) ?? undefined,
      placeholderValue: parse(placeholderValue) ?? undefined,
    }),
    [value, defaultValue, minValue, maxValue, placeholderValue],
  );
  const handleChange = useCallback(
    (date: DateValue | null) => {
      onChange?.(date ? toIsoDate(date) : null);
    },
    [onChange],
  );
  const unavailable = useCallback(
    (date: DateValue) => (isDateUnavailable ? isDateUnavailable(toIsoDate(date), fromIsoDate(toIsoDate(date), calendar)) : false),
    [isDateUnavailable, calendar],
  );

  return (
    <I18nProvider locale={tag}>
      <AriaDateField
        ref={ref}
        id={control.id}
        value={dates.value}
        defaultValue={dates.defaultValue}
        minValue={dates.minValue}
        maxValue={dates.maxValue}
        placeholderValue={dates.placeholderValue}
        isDateUnavailable={isDateUnavailable ? unavailable : undefined}
        onChange={handleChange}
        granularity="day"
        isInvalid={control['aria-invalid'] ?? undefined}
        isDisabled={control.disabled ?? false}
        isReadOnly={control.readOnly ?? false}
        isRequired={control['aria-required'] ?? false}
        validationBehavior="aria"
        name={name}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={control['aria-describedby']}
        render={(domProps, state) => (
          <div
            {...(rest as ComponentProps<'div'>)}
            {...(ownProps(domProps as Props) as ComponentProps<'div'>)}
            className={className}
            style={style}
            onMouseDown={(event) => {
              onMouseDown?.(event);
              focusSegment(event);
            }}
            data-ds="date-field"
            data-size={size}
            data-invalid={state.isInvalid ? '' : undefined}
            data-disabled={state.isDisabled ? '' : undefined}
            data-readonly={state.isReadOnly ? '' : undefined}
          />
        )}
      >
        <SegmentRow arabic={isArabicLocale(tag)} />
      </AriaDateField>
    </I18nProvider>
  );
}
