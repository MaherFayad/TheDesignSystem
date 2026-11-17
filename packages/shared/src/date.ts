// Date math for the date family (order M9.15, proposed). Pure TypeScript on
// @internationalized/date, shared by React (on React Aria) and Angular.
//
// Rules:
// - Values cross the API as ISO Gregorian dates ("2026-11-17"). The
//   calendar a person reads (Gregorian or Umm al-Qura) is a display choice
//   only, so a value always round trips to the same ISO date.
// - Digits stay Western in every language: every locale this file builds
//   carries `-u-nu-latn`, and every formatter here uses such a locale.
// - The calendar is set on the locale with `-u-ca-`, never left to the
//   locale's default: `ar-SA` resolves to Gregorian in one engine and to
//   Umm al-Qura in another.
// - The first day of the week comes from the locale's region (Sunday for
//   `ar-SA` and `en-SA`), never from a constant.
import {
  CalendarDate,
  DateFormatter,
  GregorianCalendar,
  IslamicUmalquraCalendar,
  getDayOfWeek,
  getLocalTimeZone,
  parseDate,
  startOfWeek,
  toCalendar,
  today,
  type Calendar,
  type DateValue,
} from '@internationalized/date';

/** The calendars the system draws: Gregorian, and Umm al-Qura, the Hijri calendar used in Saudi Arabia. */
export type CalendarSystem = 'gregory' | 'islamic-umalqura';

export const CALENDAR_SYSTEMS: readonly CalendarSystem[] = ['gregory', 'islamic-umalqura'];

/** A day of the week as React Aria names it, for `firstDayOfWeek`. */
export type WeekDay = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

const WEEK_DAYS: readonly WeekDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** True for the calendar ids the system draws. */
export function isCalendarSystem(value: unknown): value is CalendarSystem {
  return value === 'gregory' || value === 'islamic-umalqura';
}

/**
 * The locale for every date formatter: the given tag with the calendar and
 * Western digits set as Unicode extensions. `ar-SA` with Umm al-Qura gives
 * `ar-SA-u-ca-islamic-umalqura-nu-latn`. Other extensions on the tag stay.
 * An invalid tag falls back to `en`.
 */
export function dateLocale(locale: string | undefined, calendar: CalendarSystem = 'gregory'): string {
  try {
    return new Intl.Locale(locale || 'en', { calendar, numberingSystem: 'latn' }).toString();
  } catch {
    return new Intl.Locale('en', { calendar, numberingSystem: 'latn' }).toString();
  }
}

/**
 * The calendar factory: a Calendar object for one of the system's ids.
 * Pass it to React Aria's `createCalendar`, so only these two calendars are
 * used. Any other id gives Gregorian.
 */
export function createDateCalendar(id: string): Calendar {
  return id === 'islamic-umalqura' ? new IslamicUmalquraCalendar() : new GregorianCalendar();
}

/** The user's time zone, from the browser or the server. */
export function localTimeZone(): string {
  return getLocalTimeZone();
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True when the text is a valid ISO Gregorian date such as "2026-11-17". */
export function isIsoDate(text: unknown): text is string {
  if (typeof text !== 'string' || !ISO_DATE.test(text)) return false;
  try {
    return parseDate(text).toString() === text;
  } catch {
    return false;
  }
}

/** The ISO Gregorian date of any date value, whatever calendar it is in. */
export function toIsoDate(date: DateValue): string {
  return toCalendar(date, new GregorianCalendar()).toString().slice(0, 10);
}

/**
 * The date of an ISO Gregorian date in a calendar. Throws on text that is
 * not an ISO date; check with `isIsoDate` first when the text comes from a
 * person.
 */
export function fromIsoDate(iso: string, calendar: CalendarSystem = 'gregory'): CalendarDate {
  const date = parseDate(iso);
  return calendar === 'gregory' ? date : toCalendar(date, createDateCalendar(calendar));
}

/** Today as an ISO Gregorian date, in the user's time zone unless one is given. */
export function todayIso(timeZone: string = localTimeZone()): string {
  return today(timeZone).toString();
}

/** Today in a calendar, in the user's time zone unless one is given. */
export function todayIn(calendar: CalendarSystem = 'gregory', timeZone: string = localTimeZone()): CalendarDate {
  const date = today(timeZone);
  return calendar === 'gregory' ? date : toCalendar(date, createDateCalendar(calendar));
}

function toDate(date: DateValue | string): Date {
  const value = typeof date === 'string' ? parseDate(date) : date;
  // Midnight UTC, read by formatters set to UTC, keeps the day as given.
  return toCalendar(value, new GregorianCalendar()).toDate('UTC');
}

function formatter(locale: string | undefined, calendar: CalendarSystem, options: Intl.DateTimeFormatOptions): DateFormatter {
  return new DateFormatter(dateLocale(locale, calendar), { ...options, calendar, timeZone: 'UTC' });
}

/**
 * The month and year of a date in a calendar: "November 2026",
 * "نوفمبر 2026", "جمادى الآخرة 1448 هـ". Western digits.
 */
export function monthTitle(date: DateValue | string, locale: string | undefined, calendar: CalendarSystem = 'gregory'): string {
  return formatter(locale, calendar, { month: 'long', year: 'numeric' }).format(toDate(date));
}

/**
 * The full date, as a day cell is named: "Tuesday, 17 November 2026",
 * "الثلاثاء، 17 نوفمبر 2026". Western digits.
 */
export function formatFullDate(date: DateValue | string, locale: string | undefined, calendar: CalendarSystem = 'gregory'): string {
  return formatter(locale, calendar, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(toDate(date));
}

/** The day of the month as drawn in a cell, in the calendar, with Western digits. */
export function formatDay(date: DateValue | string, locale: string | undefined, calendar: CalendarSystem = 'gregory'): string {
  const parts = formatter(locale, calendar, { day: 'numeric' }).formatToParts(toDate(date));
  return parts.find((p) => p.type === 'day')?.value ?? '';
}

/** A fixed Sunday, 2023-01-01, to read week days from. */
const A_SUNDAY = new CalendarDate(2023, 1, 1);

/**
 * The first day of the week for a locale, from its region: Sunday for
 * `ar-SA`, `en-SA` and `en-US`, Monday for `en-GB`, Saturday for `ar-EG`.
 * A tag without a region takes the likely region of its language, so pass
 * `ar-SA` rather than `ar` for the Saudi week.
 */
export function weekStart(locale: string | undefined): WeekDay {
  const tag = dateLocale(locale);
  // The start of the week holding a Wednesday is the locale's first day.
  const first = startOfWeek(A_SUNDAY.add({ days: 3 }), tag);
  return WEEK_DAYS[toDate(first).getUTCDay()] ?? 'sun';
}

/** The index (0 is Sunday) of a week day. */
export function weekDayIndex(day: WeekDay): number {
  return WEEK_DAYS.indexOf(day);
}

/**
 * The names of the week days in the order a locale's week runs, starting
 * on `firstDayOfWeek` when given: narrow, short or long, from Intl.
 */
export function weekdayNames(
  locale: string | undefined,
  style: 'narrow' | 'short' | 'long' = 'short',
  firstDayOfWeek?: WeekDay,
): string[] {
  const start = weekDayIndex(firstDayOfWeek ?? weekStart(locale));
  const f = formatter(locale, 'gregory', { weekday: style });
  return Array.from({ length: 7 }, (_, i) => f.format(toDate(A_SUNDAY.add({ days: (start + i) % 7 }))));
}

/** The index of a date in its locale's week, 0 for the first day. */
export function dayInWeek(date: DateValue | string, locale: string | undefined, firstDayOfWeek?: WeekDay): number {
  const value = typeof date === 'string' ? parseDate(date) : date;
  return getDayOfWeek(value, dateLocale(locale), firstDayOfWeek);
}

/** Any decimal digit that is not 0 to 9: Arabic Indic, Persian and the rest. */
const NON_LATIN_DIGIT = /(?![0-9])\p{Nd}/u;

/** True when the text holds a digit outside 0 to 9. The digits check of the date family. */
export function hasNonLatinDigits(text: string): boolean {
  return NON_LATIN_DIGIT.test(text);
}

export interface CalendarWords {
  /** The name of the button that shows the month before. */
  previous: string;
  /** The name of the button that shows the month after. */
  next: string;
}

/** Built in words of the calendar, by the language of the locale. Noun form in Arabic, no diacritics. */
export function calendarWords(locale: string | undefined): CalendarWords {
  let language = 'en';
  try {
    language = new Intl.Locale(locale || 'en').language;
  } catch {
    language = 'en';
  }
  return language === 'ar' ? { previous: 'الشهر السابق', next: 'الشهر التالي' } : { previous: 'Previous month', next: 'Next month' };
}
