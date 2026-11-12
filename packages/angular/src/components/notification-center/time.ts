// The twin of packages/react/src/components/NotificationCenter/time.ts, copied
// because it is pure TypeScript that lives in the React folder. It belongs in
// packages/shared (a change for the lead): then both import it from there.
//
// Times for NotificationCenter: a relative time through
// Intl.RelativeTimeFormat, and the day group a time falls in. Arabic uses
// Western digits (the `nu-latn` extension), per the copy rules.

export type NotificationLanguage = 'en' | 'ar';

/** The language of a tag: Arabic for any `ar` tag, English otherwise. */
export function notificationLanguage(lang: string | undefined): NotificationLanguage {
  return lang !== undefined && /^ar(-|$)/i.test(lang) ? 'ar' : 'en';
}

const locales: Record<NotificationLanguage, string> = {
  en: 'en',
  ar: 'ar-u-nu-latn',
};

/**
 * "5 minutes ago", "yesterday", "قبل 5 دقائق". Under a day it counts
 * seconds, minutes or hours; from a day on it counts calendar days, the same
 * days dayGroup uses, so the time and its group heading never disagree.
 * Times in the future read as "in 5 minutes".
 */
export function formatRelativeTime(time: Date, now: Date, lang: NotificationLanguage): string {
  const rtf = new Intl.RelativeTimeFormat(locales[lang], { numeric: 'auto' });
  const seconds = Math.round((time.getTime() - now.getTime()) / 1000);
  const days = calendarDays(time, now);
  if (days === 0 || Math.abs(seconds) < 3_600) {
    const abs = Math.abs(seconds);
    if (abs < 60) return rtf.format(seconds, 'second');
    if (abs < 3_600) return rtf.format(Math.round(seconds / 60), 'minute');
    return rtf.format(Math.round(seconds / 3_600), 'hour');
  }
  const abs = Math.abs(days);
  if (abs < 7) return rtf.format(days, 'day');
  if (abs < 30) return rtf.format(Math.round(days / 7), 'week');
  if (abs < 365) return rtf.format(Math.round(days / 30.44), 'month');
  return rtf.format(Math.round(days / 365.25), 'year');
}

export type DayGroup = 'today' | 'yesterday' | 'earlier';

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** The day group of a time, by the local calendar day. A time in the future counts as today. */
/** Calendar days from now to time: negative in the past. */
function calendarDays(time: Date, now: Date): number {
  return Math.round((startOfDay(time) - startOfDay(now)) / 86_400_000);
}

export function dayGroup(time: Date, now: Date): DayGroup {
  const days = -calendarDays(time, now);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return 'earlier';
}

export function toDate(time: Date | number | string): Date {
  return time instanceof Date ? time : new Date(time);
}
