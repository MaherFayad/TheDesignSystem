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

const steps: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.345],
  ['month', 12],
  ['year', Infinity],
];

/** "5 minutes ago", "yesterday", "قبل 5 دقائق". Times in the future read as "in 5 minutes". */
export function formatRelativeTime(time: Date, now: Date, lang: NotificationLanguage): string {
  const rtf = new Intl.RelativeTimeFormat(locales[lang], { numeric: 'auto' });
  let value = (time.getTime() - now.getTime()) / 1000;
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit);
    value /= size;
  }
  return rtf.format(Math.round(value), 'year');
}

export type DayGroup = 'today' | 'yesterday' | 'earlier';

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** The day group of a time, by the local calendar day. A time in the future counts as today. */
export function dayGroup(time: Date, now: Date): DayGroup {
  const days = Math.round((startOfDay(now) - startOfDay(time)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return 'earlier';
}

export function toDate(time: Date | number | string): Date {
  return time instanceof Date ? time : new Date(time);
}
