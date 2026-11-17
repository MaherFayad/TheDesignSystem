// Time values of the date family (order M9.17, proposed): a time of day
// crosses the API as a 24 hour "HH:mm" string ("09:41", "21:05"), whatever
// hour cycle is drawn. These helpers turn it into the Time object React Aria
// reads, and back, and write it for a chip in the locale's own words with
// Western digits.
//
// They sit in the React folder because packages/shared is not part of this
// order; they are pure and can move to packages/shared/src/date.ts as they
// are (a request in the order's report).
import { Time } from '@internationalized/date';
import { dateLocale, wheelStripMarks, type WheelTime } from '@the-system/shared';

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** True when the text is a 24 hour time "HH:mm", such as "09:41". */
export function isTimeText(text: unknown): text is string {
  return typeof text === 'string' && HH_MM.test(text);
}

/** The hour and minute of "HH:mm", or null for text that is not one. */
export function parseTimeText(text: string | null | undefined): WheelTime | null {
  if (!isTimeText(text)) return null;
  const [h, m] = text.split(':');
  return { hour: Number(h), minute: Number(m) };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "HH:mm" for an hour and minute. */
export function timeText(time: WheelTime): string {
  return `${pad(time.hour)}:${pad(time.minute)}`;
}

/** React Aria's Time for "HH:mm"; undefined for undefined, null for null or text that is not a time. */
export function toAriaTime(text: string | null | undefined): Time | null | undefined {
  if (text === undefined) return undefined;
  const time = parseTimeText(text);
  return time ? new Time(time.hour, time.minute) : null;
}

/** "HH:mm" for any React Aria time value (Time, CalendarDateTime or ZonedDateTime). */
export function fromAriaTime(value: { hour: number; minute: number } | null | undefined): string | null {
  return value ? timeText({ hour: value.hour, minute: value.minute }) : null;
}

/**
 * A time in the locale's words with Western digits and no Arabic marks:
 * "9:41 AM", "21:41", "9:41 م". The hour cycle is the one the field draws.
 */
export function formatTime(time: WheelTime, locale: string | undefined, hourCycle: 12 | 24): string {
  const text = new Intl.DateTimeFormat(dateLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: hourCycle === 12 ? 'h12' : 'h23',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2026, 0, 1, time.hour, time.minute)));
  return wheelStripMarks(text);
}
