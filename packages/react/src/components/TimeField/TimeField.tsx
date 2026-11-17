'use client';
// TimeField: a time of day typed in parts, hour, minute and, in a 12 hour
// locale, the day period (order M9.17, proposed). Behavior from React Aria
// `TimeField` (react-aria-components): the segments, typing, the arrow keys,
// the placeholders, min and max, validation and the hidden form input.
// Built on DateField's segment row (DateField/segments.tsx) and styled in
// DateField.css with it; TimeField.css holds only what differs.
//
// Values are 24 hour "HH:mm" strings ("09:41", "21:05") in and out, whatever
// hour cycle is drawn. The hour cycle comes from the locale (wheelHourCycle
// from @the-system/shared, the one the WheelPicker uses), so the field and
// the wheel always agree, and `hourCycle` overrides it. The segment order,
// the separator and the day period words come from Intl for the locale;
// the locale carries -u-nu-latn (dateLocale), so digits stay Western.
//
// DOM:
//   div [data-ds=time-field] data-size data-invalid? data-disabled? data-readonly?
//     div [data-part=input] role=group
//       span [data-part=segment][data-type=hour|minute|day-period] role=spinbutton data-placeholder?
//       span [data-part=literal] aria-hidden
//
// Motion: none of its own, as DateField.
import { useCallback, useMemo, type ComponentProps, type Ref } from 'react';
import { I18nProvider, TimeField as AriaTimeField } from 'react-aria-components';
import { dateLocale, wheelHourCycle } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useField, useFieldControl } from '../Field/Field';
import { focusSegment, type DateFieldSize } from '../DateField/DateField';
import { isArabicLocale, ownProps, SegmentRow, type Props } from '../DateField/segments';
import { fromAriaTime, toAriaTime } from './time';

export type TimeFieldSize = DateFieldSize;

export interface TimeFieldProps
  extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref' | 'children' | 'title' | 'placeholder'> {
  /** The time, controlled: a 24 hour "HH:mm" such as "21:05", or null for none. */
  value?: string | null;
  /** The first time, uncontrolled. */
  defaultValue?: string | null;
  /** Called with "HH:mm" once every segment is filled, and with null when one is cleared. */
  onChange?: (value: string | null) => void;
  /** The earliest time, "HH:mm". An earlier time marks the field invalid. */
  minValue?: string;
  /** The latest time, "HH:mm". A later time marks the field invalid. */
  maxValue?: string;
  /** The time the segments step from while they are empty, "HH:mm". Default midnight. */
  placeholderValue?: string;
  /** 12 or 24. Default the locale's own cycle (12 in ar-SA and en-US, 24 in en-GB). */
  hourCycle?: 12 | 24;
  /** The locale of the segment order, the separator and the day period words. Default the language of the nearest Theme. Digits stay Western. */
  locale?: string;
  /** The height of the box: size.control.sm, md (default) or lg. */
  size?: TimeFieldSize;
  /** Marks the field invalid. Inside a Field the field decides when this is not passed. */
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** The name of the hidden form input that carries the "HH:mm" time. */
  name?: string;
  /** Focuses the first segment on mount. */
  autoFocus?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function TimeField({
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  placeholderValue,
  hourCycle,
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
}: TimeFieldProps) {
  const theme = useTheme();
  const field = useField();
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });
  const base = locale ?? theme.lang;
  const tag = dateLocale(base);
  const cycle = hourCycle ?? wheelHourCycle(base);
  const labelledBy = ariaLabelledBy ?? (ariaLabel === undefined ? field?.labelId : undefined);

  const times = useMemo(
    () => ({
      value: toAriaTime(value),
      defaultValue: toAriaTime(defaultValue),
      minValue: toAriaTime(minValue) ?? undefined,
      maxValue: toAriaTime(maxValue) ?? undefined,
      placeholderValue: toAriaTime(placeholderValue) ?? undefined,
    }),
    [value, defaultValue, minValue, maxValue, placeholderValue],
  );
  const handleChange = useCallback((time: { hour: number; minute: number } | null) => onChange?.(fromAriaTime(time)), [onChange]);

  return (
    <I18nProvider locale={tag}>
      <AriaTimeField
        ref={ref}
        id={control.id}
        value={times.value}
        defaultValue={times.defaultValue}
        minValue={times.minValue}
        maxValue={times.maxValue}
        placeholderValue={times.placeholderValue}
        onChange={handleChange}
        hourCycle={cycle}
        granularity="minute"
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
            data-ds="time-field"
            data-size={size}
            data-invalid={state.isInvalid ? '' : undefined}
            data-disabled={state.isDisabled ? '' : undefined}
            data-readonly={state.isReadOnly ? '' : undefined}
          />
        )}
      >
        <SegmentRow arabic={isArabicLocale(tag)} />
      </AriaTimeField>
    </I18nProvider>
  );
}
