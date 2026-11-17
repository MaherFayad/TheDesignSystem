import { CalendarDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import {
  calendarWords,
  createDateCalendar,
  dateLocale,
  dayInWeek,
  formatDay,
  formatFullDate,
  fromIsoDate,
  hasNonLatinDigits,
  isCalendarSystem,
  isIsoDate,
  monthTitle,
  todayIn,
  todayIso,
  toIsoDate,
  weekStart,
  weekdayNames,
} from './date';

describe('dateLocale', () => {
  it('sets the calendar and Western digits as extensions', () => {
    expect(dateLocale('ar-SA')).toBe('ar-SA-u-ca-gregory-nu-latn');
    expect(dateLocale('ar-SA', 'islamic-umalqura')).toBe('ar-SA-u-ca-islamic-umalqura-nu-latn');
    expect(dateLocale('en-SA', 'islamic-umalqura')).toBe('en-SA-u-ca-islamic-umalqura-nu-latn');
  });

  it('overrides a numbering system or calendar already on the tag', () => {
    expect(dateLocale('ar-SA-u-nu-arab')).toBe('ar-SA-u-ca-gregory-nu-latn');
    expect(dateLocale('ar-SA-u-ca-islamic')).toBe('ar-SA-u-ca-gregory-nu-latn');
  });

  it('falls back to en for an empty or invalid tag', () => {
    expect(dateLocale(undefined)).toBe('en-u-ca-gregory-nu-latn');
    expect(dateLocale('not a tag!')).toBe('en-u-ca-gregory-nu-latn');
  });
});

describe('calendar factory and ids', () => {
  it('makes the two calendars, and Gregorian for anything else', () => {
    expect(createDateCalendar('islamic-umalqura').identifier).toBe('islamic-umalqura');
    expect(createDateCalendar('gregory').identifier).toBe('gregory');
    expect(createDateCalendar('hebrew').identifier).toBe('gregory');
    expect(isCalendarSystem('islamic-umalqura')).toBe(true);
    expect(isCalendarSystem('islamic')).toBe(false);
  });
});

describe('ISO values', () => {
  it('checks ISO dates', () => {
    expect(isIsoDate('2026-11-17')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('17/11/2026')).toBe(false);
    expect(isIsoDate(20261117)).toBe(false);
  });

  it('round trips an ISO date through Umm al-Qura', () => {
    const hijri = fromIsoDate('2026-11-17', 'islamic-umalqura');
    expect(hijri.calendar.identifier).toBe('islamic-umalqura');
    expect([hijri.year, hijri.month, hijri.day]).toEqual([1448, 6, 7]);
    expect(toIsoDate(hijri)).toBe('2026-11-17');
    // The first of Ramadan 1447 is 18 February 2026 in Umm al-Qura.
    const ramadan = new CalendarDate(createDateCalendar('islamic-umalqura'), 1447, 9, 1);
    expect(toIsoDate(ramadan)).toBe('2026-02-18');
    expect(toIsoDate(fromIsoDate(toIsoDate(ramadan), 'islamic-umalqura'))).toBe('2026-02-18');
  });

  it('gives today in a zone and in a calendar', () => {
    expect(isIsoDate(todayIso('Asia/Riyadh'))).toBe(true);
    expect(todayIn('islamic-umalqura', 'Asia/Riyadh').calendar.identifier).toBe('islamic-umalqura');
    expect(toIsoDate(todayIn('islamic-umalqura', 'Asia/Riyadh'))).toBe(todayIso('Asia/Riyadh'));
  });
});

describe('titles and names', () => {
  it('titles a month in both calendars, in English and Arabic', () => {
    expect(monthTitle('2026-11-17', 'en-SA')).toBe('November 2026');
    expect(monthTitle('2026-11-17', 'ar-SA')).toBe('نوفمبر 2026');
    expect(monthTitle('2026-11-17', 'ar-SA', 'islamic-umalqura')).toMatch(/^جمادى الآخرة 1448/);
    expect(monthTitle('2026-11-17', 'en-SA', 'islamic-umalqura')).toMatch(/1448/);
  });

  it('names a full date and draws the day in the calendar', () => {
    expect(formatFullDate('2026-11-17', 'en-SA')).toMatch(/Tuesday/);
    expect(formatFullDate('2026-11-17', 'ar-SA')).toBe('الثلاثاء، 17 نوفمبر 2026');
    expect(formatDay('2026-11-17', 'ar-SA')).toBe('17');
    expect(formatDay('2026-11-17', 'ar-SA', 'islamic-umalqura')).toBe('7');
  });

  it('starts the week from the locale region', () => {
    expect(weekStart('ar-SA')).toBe('sun');
    expect(weekStart('en-SA')).toBe('sun');
    expect(weekStart('en-US')).toBe('sun');
    expect(weekStart('en-GB')).toBe('mon');
    expect(weekStart('ar-EG')).toBe('sat');
    expect(dayInWeek('2026-11-15', 'ar-SA')).toBe(0);
    expect(dayInWeek('2026-11-16', 'en-GB')).toBe(0);
  });

  it('lists week days from the first day, or from firstDayOfWeek', () => {
    expect(weekdayNames('en-SA', 'short')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(weekdayNames('ar-SA', 'long')[0]).toBe('الأحد');
    expect(weekdayNames('en-SA', 'short', 'mon')[0]).toBe('Mon');
  });

  it('has noun form Arabic words without diacritics', () => {
    expect(calendarWords('ar-SA')).toEqual({ previous: 'الشهر السابق', next: 'الشهر التالي' });
    expect(calendarWords('en-SA')).toEqual({ previous: 'Previous month', next: 'Next month' });
    const diacritics = /[ً-ْ]/;
    expect(diacritics.test(Object.values(calendarWords('ar')).join(''))).toBe(false);
  });
});

describe('digits stay Latin in ar-SA', () => {
  const dates = ['2026-01-01', '2026-11-17', '2027-03-30'];
  for (const calendar of ['gregory', 'islamic-umalqura'] as const) {
    it(`in every formatter, ${calendar}`, () => {
      for (const iso of dates) {
        for (const text of [monthTitle(iso, 'ar-SA', calendar), formatFullDate(iso, 'ar-SA', calendar), formatDay(iso, 'ar-SA', calendar)]) {
          expect(hasNonLatinDigits(text), text).toBe(false);
          expect(text).toMatch(/[0-9]/);
        }
      }
    });
  }

  it('the check catches Arabic Indic and Persian digits', () => {
    expect(hasNonLatinDigits('١٧ نوفمبر')).toBe(true);
    expect(hasNonLatinDigits('۱۷')).toBe(true);
    expect(hasNonLatinDigits('17 نوفمبر')).toBe(false);
    // Without -u-nu-latn ar-SA formats with Arabic Indic digits, so the check is not empty.
    expect(hasNonLatinDigits(new Intl.DateTimeFormat('ar-SA-u-nu-arab', { day: 'numeric' }).format(new Date(2026, 10, 17)))).toBe(true);
  });
});
