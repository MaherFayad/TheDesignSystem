'use client';
// DatePicker: one date, or a date and a time, picked from a calendar and a
// time control (order M9.17, proposed). Two forms, set by `variant`:
//
// - compact (default): a chip that shows the date and, when `granularity`
//   is minute, a second chip for the time. The date chip opens a Calendar
//   in a popover (ios, web, macos) or in a dialog (android). The time chip
//   opens the WheelPicker in a popover on ios and a TimeField in a dialog on
//   android (no clock dial: a dial is a drag, WCAG 2.2 2.5.7). On web and
//   macos the time is a TimeField in place of a chip, typed in segments.
// - inline: the Calendar itself, with a time row under it when
//   `granularity` is minute (the time label, then the same time control as
//   the compact form).
//
// Behavior: the calendar from React Aria (Calendar, order M9.15), the wheel
// from WheelPicker (order M9.16), the segments from React Aria (TimeField),
// the popover and the dialog from Radix (Popover and Dialog). Escape or a
// press outside closes the popover and focus goes back to its chip; a pick
// in the calendar closes it too.
//
// Values:
// - granularity day: an ISO Gregorian date, "2026-11-17".
// - granularity minute: an ISO local date and time without seconds or a
//   zone, "2026-11-17T09:41", with a 24 hour time whatever cycle is drawn.
// `calendar` (gregory or islamic-umalqura) is a display choice only. The
// value holds both halves: a pick of one half while the value is empty
// takes the other from today and from `placeholderTime`. The chip keeps the
// chosen value (WCAG 2.2 3.3.7): nothing is asked twice.
//
// Every word a chip shows comes from Intl through dateLocale (calendar and
// -u-nu-latn on the locale), so digits stay Western in Arabic in both
// calendars. Chip names read the word, then the value: "Date, 17 Nov 2026",
// "التاريخ، 17 نوفمبر 2026" (the Arabic comma in Arabic).
//
// DOM, compact:
//   div [data-ds=date-picker][data-variant=compact] role=group aria-labelledby
//     span [data-part=label]                                the visible label, when given
//     button [data-ds=button][data-part=date] aria-haspopup=dialog aria-expanded
//     button [data-ds=button][data-part=time]               ios, android
//     div [data-ds=time-field][data-part=time]              web, macos
//     input type=hidden                                     with `name`
// DOM, inline:
//   div [data-ds=date-picker][data-variant=inline] role=group
//     span [data-part=label]
//     div [data-ds=calendar][data-part=calendar]
//     div [data-part=time-row]                              granularity minute
//       span [data-part=time-label]
//       button [data-ds=button][data-part=time] | div [data-ds=time-field][data-part=time]
//
// Right to left: the chips sit in reading order, so in Arabic the date chip
// is at the right and the time chip at its left; no rule is needed.
//
// Motion: none of its own. The popover and the dialog bring their own
// enter and exit (menu-scale, the dialog's), the Calendar its month fade,
// and the chip its press; all collapse under reduced motion.
import { useCallback, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode, type Ref } from 'react';
import type { CalendarDate } from '@internationalized/date';
import {
  dateLocale,
  isIsoDate,
  todayIso,
  wheelHourCycle,
  wheelTimeColumns,
  wheelTimeFromValues,
  wheelTimeValues,
  type CalendarSystem,
  type WheelValue,
  type WeekDay,
} from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { Button } from '../Button/Button';
import type { ButtonSize } from '../Button/ButtonBase';
import { Calendar } from '../Calendar/Calendar';
import { Dialog, DialogBody, DialogContent, DialogTrigger } from '../Dialog/Dialog';
import { useField } from '../Field/Field';
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from '../Popover/Popover';
import { TimeField } from '../TimeField/TimeField';
import { formatTime, isTimeText, parseTimeText, timeText } from '../TimeField/time';
import { WheelPicker } from '../WheelPicker/WheelPicker';
import { isArabicLocale } from '../DateField/segments';

export type DatePickerVariant = 'compact' | 'inline';
export type DatePickerGranularity = 'day' | 'minute';
export type DatePickerSize = Extract<ButtonSize, 'sm' | 'md' | 'lg'>;

export interface DatePickerLabels {
  /** The word before the date in the date chip's name. Default "Date", "التاريخ". */
  date: string;
  /** The word before the time in the time chip's name, and the time row's label. Default "Time", "الوقت". */
  time: string;
  /** The date chip while no date is picked. Default "Add date", "إضافة تاريخ". */
  addDate: string;
  /** The time chip while no time is picked. Default "Add time", "إضافة وقت". */
  addTime: string;
}

const WORDS: Record<'en' | 'ar', DatePickerLabels> = {
  en: { date: 'Date', time: 'Time', addDate: 'Add date', addTime: 'Add time' },
  ar: { date: 'التاريخ', time: 'الوقت', addDate: 'إضافة تاريخ', addTime: 'إضافة وقت' },
};

export interface DatePickerProps
  extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref' | 'children' | 'title'> {
  /** compact: chips that open the calendar and the time control (default). inline: the calendar with a time row. */
  variant?: DatePickerVariant;
  /** day: a date (default). minute: a date and a time of day. */
  granularity?: DatePickerGranularity;
  /** The value, controlled: "2026-11-17" for day, "2026-11-17T09:41" for minute, or null for none. */
  value?: string | null;
  /** The first value, uncontrolled. */
  defaultValue?: string | null;
  /** Called with the new value, in the form of `granularity`. */
  onChange?: (value: string | null) => void;
  /** The visible label of the picker: Starts, Delivery date. It names the group. Without it pass aria-label or wrap it in a Field. */
  label?: ReactNode;
  /** The earliest date, ISO. Days before it cannot be picked. */
  minValue?: string;
  /** The latest date, ISO. Days after it cannot be picked. */
  maxValue?: string;
  /** Days that stay readable but cannot be picked. Gets the ISO date and the drawn date. */
  isDateUnavailable?: (value: string, date: CalendarDate) => boolean;
  /** The calendar drawn: gregory (default) or islamic-umalqura. The value stays ISO Gregorian. */
  calendar?: CalendarSystem;
  /** The first column of the week. Default from the locale's region. */
  firstDayOfWeek?: WeekDay;
  /** 12 or 24. Default the locale's own cycle. The value is 24 hour either way. */
  hourCycle?: 12 | 24;
  /** Minutes between the rows of the time wheel (ios): 1, 5, 15. Default 1. */
  minuteStep?: number;
  /** The time a date takes when it is picked before any time, "HH:mm". Default "09:00". */
  placeholderTime?: string;
  /** The locale of every word and of the week, such as ar-SA. Default the language of the nearest Theme. Digits stay Western. */
  locale?: string;
  /** The chip height and the time field height: sm, md (default) or lg. */
  size?: DatePickerSize;
  /** Words of the chips, in place of the built in ones. */
  labels?: Partial<DatePickerLabels>;
  disabled?: boolean;
  /** The chips show the value and open nothing; the time field and the calendar take focus but change nothing. */
  readOnly?: boolean;
  /** Marks the picker invalid. Inside a Field the field decides when this is not passed. */
  invalid?: boolean;
  /** The name of a hidden form input that carries the value. */
  name?: string;
  ref?: Ref<HTMLDivElement>;
}

const VALUE = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?)?$/;

/** The two halves of a value: the ISO date and the "HH:mm" time, each null when missing. */
export function splitDateTime(value: string | null | undefined): { date: string | null; time: string | null } {
  const match = typeof value === 'string' ? VALUE.exec(value) : null;
  if (!match) return { date: null, time: null };
  const date = match[1] && isIsoDate(match[1]) ? match[1] : null;
  const time = match[2] && isTimeText(match[2]) ? match[2] : null;
  return { date, time };
}

/** The ISO date part of a bound, which may carry a time. */
const datePart = (iso: string | undefined) => (iso ? (splitDateTime(iso).date ?? undefined) : undefined);

/** The date a chip shows: "17 Nov 2026", "17 نوفمبر 2026", "7 جمادى الآخرة 1448 هـ". Western digits. */
export function formatChipDate(iso: string, locale: string | undefined, calendar: CalendarSystem): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(dateLocale(locale, calendar), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)),
  );
}

/** Focus on open: the focused day of a calendar, else the first spinbutton or segment, inside `root`. */
function focusInside(root: HTMLElement | null, event: Event) {
  if (!root) return;
  const target =
    root.querySelector<HTMLElement>('[data-part="day"][tabindex="0"]') ??
    root.querySelector<HTMLElement>('[role="spinbutton"][tabindex="0"]');
  if (!target) return;
  event.preventDefault();
  target.focus();
}

type Mode = 'popover' | 'dialog' | 'segments' | 'wheel';

interface ChipProps {
  part: 'date' | 'time';
  name: string;
  text: string;
  empty: boolean;
  size: DatePickerSize;
  disabled: boolean;
  invalid: boolean;
}

/** A chip: a soft system Button named with its word and its value. */
function Chip({ part, name, text, empty, size, disabled, invalid, ...rest }: ChipProps & Record<string, unknown>) {
  return (
    <Button
      {...rest}
      data-part={part}
      data-placeholder={empty ? '' : undefined}
      data-invalid={invalid ? '' : undefined}
      aria-label={name}
      emphasis="soft"
      size={size}
      disabled={disabled}
    >
      {text}
    </Button>
  );
}

export function DatePicker({
  variant = 'compact',
  granularity = 'day',
  value: valueProp,
  defaultValue = null,
  onChange,
  label,
  minValue,
  maxValue,
  isDateUnavailable,
  calendar = 'gregory',
  firstDayOfWeek,
  hourCycle,
  minuteStep = 1,
  placeholderTime = '09:00',
  locale,
  size = 'md',
  labels,
  disabled = false,
  readOnly = false,
  invalid: invalidProp,
  name,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: DatePickerProps) {
  const theme = useTheme();
  const field = useField();
  const base = locale ?? theme.lang;
  const arabic = isArabicLocale(base);
  const words = { ...WORDS[arabic ? 'ar' : 'en'], ...labels };
  const comma = arabic ? '، ' : ', ';
  const cycle = hourCycle ?? wheelHourCycle(base);
  const withTime = granularity === 'minute';
  const isDisabled = disabled || (field?.disabled ?? false);
  const isReadOnly = readOnly || (field?.readOnly ?? false);
  const invalid = invalidProp ?? field?.invalid ?? false;

  // The value: controlled when `value` is passed, else kept here.
  const [own, setOwn] = useState<string | null>(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : own;
  const { date, time } = splitDateTime(value);
  const commit = useCallback(
    (nextDate: string | null, nextTime: string | null) => {
      let next: string | null;
      if (!nextDate && !nextTime) next = null;
      else if (!withTime) next = nextDate;
      else next = `${nextDate ?? todayIso()}T${nextTime ?? (isTimeText(placeholderTime) ? placeholderTime : '09:00')}`;
      if (!controlled) setOwn(next);
      if (next !== value) onChange?.(next);
    },
    [withTime, placeholderTime, controlled, value, onChange],
  );
  const setDate = useCallback((iso: string) => commit(iso, time), [commit, time]);
  const setTime = useCallback((hm: string) => commit(date, hm), [commit, date]);

  const labelId = useId();
  const timeLabelId = useId();
  const groupLabelledBy = label !== undefined && label !== null ? labelId : (ariaLabelledBy ?? (ariaLabel === undefined ? field?.labelId : undefined));

  const platform = theme.platform;
  const dateMode: Mode = platform === 'android' ? 'dialog' : 'popover';
  const timeMode: Mode = platform === 'ios' ? 'wheel' : platform === 'android' ? 'dialog' : 'segments';

  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const calendarBox = useRef<HTMLDivElement | null>(null);
  const timeBox = useRef<HTMLDivElement | null>(null);

  const bounds = useMemo(() => ({ min: datePart(minValue), max: datePart(maxValue) }), [minValue, maxValue]);
  const dateText = date ? formatChipDate(date, base, calendar) : words.addDate;
  const dateName = date ? `${words.date}${comma}${dateText}` : words.addDate;
  const parsedTime = parseTimeText(time);
  const timeChipText = parsedTime ? formatTime(parsedTime, base, cycle) : words.addTime;
  const timeName = parsedTime ? `${words.time}${comma}${timeChipText}` : words.addTime;

  const calendarProps = {
    locale: base,
    calendar,
    firstDayOfWeek,
    minValue: bounds.min,
    maxValue: bounds.max,
    isDateUnavailable,
    disabled: isDisabled,
    readOnly: isReadOnly,
    defaultFocusedValue: date ?? undefined,
  };

  // ------------------------------------------------------------ the time control
  // The wheel shows the time, else the placeholder time.
  const shown = time ?? (isTimeText(placeholderTime) ? placeholderTime : '09:00');
  const wheelColumns = useMemo(
    () => wheelTimeColumns({ locale: base, hourCycle: cycle, minuteStep, value: parseTimeText(shown) ?? undefined }),
    [base, cycle, minuteStep, shown],
  );
  const onWheel = (id: string, next: WheelValue) => {
    const now = parseTimeText(shown) ?? { hour: 9, minute: 0 };
    const values: Record<string, WheelValue> = { ...wheelTimeValues(now, cycle), [id]: next };
    setTime(timeText(wheelTimeFromValues(values, cycle)));
  };

  const timeChip = (
    <Chip part="time" name={timeName} text={timeChipText} empty={!parsedTime} size={size} disabled={isDisabled} invalid={invalid} />
  );

  let timeControl: ReactNode = null;
  if (withTime) {
    if (timeMode === 'segments' || isReadOnly) {
      timeControl =
        timeMode === 'segments' ? (
          <TimeField
            data-part="time"
            aria-label={variant === 'inline' ? undefined : words.time}
            aria-labelledby={variant === 'inline' ? timeLabelId : undefined}
            locale={base}
            hourCycle={cycle}
            value={time}
            onChange={(next) => next && setTime(next)}
            size={size}
            disabled={isDisabled}
            readOnly={isReadOnly}
            invalid={invalid}
          />
        ) : (
          timeChip
        );
    } else if (timeMode === 'wheel') {
      timeControl = (
        <Popover open={timeOpen} onOpenChange={setTimeOpen} size="sm">
          <PopoverTrigger>{timeChip}</PopoverTrigger>
          <PopoverContent
            aria-label={words.time}
            side="bottom"
            align="end"
            arrow={false}
            close={false}
            onOpenAutoFocus={(event) => focusInside(timeBox.current, event)}
          >
            <PopoverBody>
              <WheelPicker ref={timeBox} label={words.time} columns={wheelColumns} onChange={onWheel} />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      );
    } else {
      timeControl = (
        <Dialog open={timeOpen} onOpenChange={setTimeOpen} size="sm">
          <DialogTrigger>{timeChip}</DialogTrigger>
          <DialogContent title={words.time} onOpenAutoFocus={(event) => focusInside(timeBox.current, event)}>
            <DialogBody>
              <TimeField
                ref={timeBox}
                aria-label={words.time}
                locale={base}
                hourCycle={cycle}
                value={shown}
                onChange={(next) => next && setTime(next)}
                size="lg"
              />
            </DialogBody>
          </DialogContent>
        </Dialog>
      );
    }
  }

  // ------------------------------------------------------------ the date control
  const dateChip = <Chip part="date" name={dateName} text={dateText} empty={!date} size={size} disabled={isDisabled} invalid={invalid} />;
  const pickDate = (iso: string) => {
    setDate(iso);
    setDateOpen(false);
  };
  const popupCalendar = (
    <Calendar ref={calendarBox} aria-label={words.date} {...calendarProps} value={date} onChange={pickDate} />
  );
  let dateControl: ReactNode;
  if (variant === 'inline') {
    dateControl = (
      <Calendar
        data-part="calendar"
        aria-label={groupLabelledBy ? undefined : (ariaLabel ?? words.date)}
        aria-labelledby={groupLabelledBy}
        {...calendarProps}
        value={date}
        onChange={setDate}
      />
    );
  } else if (isReadOnly) {
    dateControl = dateChip;
  } else if (dateMode === 'popover') {
    dateControl = (
      <Popover open={dateOpen} onOpenChange={setDateOpen} size="md">
        <PopoverTrigger>{dateChip}</PopoverTrigger>
        <PopoverContent
          aria-label={words.date}
          side="bottom"
          align="start"
          arrow={false}
          close={false}
          onOpenAutoFocus={(event) => focusInside(calendarBox.current, event)}
        >
          <PopoverBody>{popupCalendar}</PopoverBody>
        </PopoverContent>
      </Popover>
    );
  } else {
    dateControl = (
      <Dialog open={dateOpen} onOpenChange={setDateOpen} size="sm">
        <DialogTrigger>{dateChip}</DialogTrigger>
        <DialogContent title={words.date} onOpenAutoFocus={(event) => focusInside(calendarBox.current, event)}>
          <DialogBody>{popupCalendar}</DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      aria-label={groupLabelledBy ? undefined : ariaLabel}
      aria-labelledby={groupLabelledBy}
      aria-describedby={rest['aria-describedby'] ?? (field?.hasError ? field.errorId : field?.hasDescription ? field.descriptionId : undefined)}
      data-ds="date-picker"
      data-variant={variant}
      data-size={size}
      data-invalid={invalid ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      data-readonly={isReadOnly ? '' : undefined}
    >
      {label !== undefined && label !== null && (
        <span data-part="label" id={labelId}>
          {label}
        </span>
      )}
      {dateControl}
      {variant === 'compact'
        ? timeControl
        : withTime && (
            <div data-part="time-row">
              <span data-part="time-label" id={timeLabelId}>
                {words.time}
              </span>
              {timeControl}
            </div>
          )}
      {name !== undefined && <input type="hidden" name={name} value={value ?? ''} />}
    </div>
  );
}
