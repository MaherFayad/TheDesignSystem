import { describe, expect, it } from 'vitest';
import {
  wheelDayPeriods,
  wheelDistance,
  wheelEdge,
  wheelHourCycle,
  wheelIndexOf,
  wheelLatinDigits,
  wheelLocale,
  wheelLoopCopies,
  wheelMiddleRow,
  wheelNearestEnabled,
  wheelNearestRow,
  wheelRowAt,
  wheelStep,
  wheelStripMarks,
  wheelTimeColumns,
  wheelTimeFromValues,
  wheelTimeOrder,
  wheelTimeValues,
  wheelTypeahead,
  wheelWrap,
  type WheelOption,
} from './wheel';

const opts = (n: number, disabled: number[] = []): WheelOption[] => Array.from({ length: n }, (_, i) => ({ value: i, label: String(i).padStart(2, '0'), disabled: disabled.includes(i) }));

describe('wheel stepping', () => {
  it('wraps indexes', () => {
    expect(wheelWrap(-1, 12)).toBe(11);
    expect(wheelWrap(13, 12)).toBe(1);
    expect(wheelWrap(3, 0)).toBe(0);
  });

  it('finds values, numbers and their strings alike', () => {
    expect(wheelIndexOf(opts(5), 3)).toBe(3);
    expect(wheelIndexOf(opts(5), '3')).toBe(3);
    expect(wheelIndexOf(opts(5), 9)).toBe(-1);
    expect(wheelIndexOf(opts(5), undefined)).toBe(-1);
  });

  it('steps, stops at the ends without loop and wraps with it', () => {
    const o = opts(10);
    expect(wheelStep(o, 4, 1)).toBe(5);
    expect(wheelStep(o, 9, 1)).toBe(9);
    expect(wheelStep(o, 9, 1, true)).toBe(0);
    expect(wheelStep(o, 0, -1, true)).toBe(9);
    expect(wheelStep(o, 7, 5)).toBe(9);
    expect(wheelStep(o, 7, 5, true)).toBe(2);
  });

  it('skips disabled rows and never rests on one', () => {
    const o = opts(6, [2, 3, 5]);
    expect(wheelStep(o, 1, 1)).toBe(4);
    expect(wheelStep(o, 4, 1)).toBe(4);
    expect(wheelStep(o, 4, 1, true)).toBe(0);
    expect(wheelNearestEnabled(o, 3)).toBe(4);
    expect(wheelNearestEnabled(o, 5)).toBe(4);
    expect(wheelNearestEnabled(opts(2, [0, 1]), 0)).toBe(-1);
    expect(wheelEdge(o, false)).toBe(0);
    expect(wheelEdge(o, true)).toBe(4);
  });
});

describe('wheel loop rows', () => {
  it('renders an odd number of copies with enough rows', () => {
    expect(wheelLoopCopies(60)).toBe(5);
    expect(wheelLoopCopies(12)).toBe(17);
    expect(wheelLoopCopies(500)).toBe(3);
    expect(wheelLoopCopies(12) * 12).toBeGreaterThanOrEqual(200);
  });

  it('keeps steps on the nearest copy', () => {
    expect(wheelMiddleRow(3, 12, 17)).toBe(8 * 12 + 3);
    // From row 107 (copy 8, index 11), index 0 is the next row, in copy 9.
    expect(wheelNearestRow(107, 0, 12, 17)).toBe(108);
    // From row 96 (copy 8, index 0), index 11 is the row before.
    expect(wheelNearestRow(96, 11, 12, 17)).toBe(95);
  });

  it('reads the row under the band and the distance of a row', () => {
    expect(wheelRowAt(0, 44, 10)).toBe(0);
    expect(wheelRowAt(44 * 3 + 20, 44, 10)).toBe(3);
    expect(wheelRowAt(44 * 3 + 23, 44, 10)).toBe(4);
    expect(wheelRowAt(9999, 44, 10)).toBe(9);
    expect(wheelDistance(5, 44 * 3, 44)).toBe(2);
    expect(wheelDistance(0, 44 * 10, 44)).toBe(-3);
    expect(wheelRowAt(100, 0, 10)).toBe(0);
  });
});

describe('wheel typing', () => {
  it('jumps by digits, Latin or Arabic Indic, with or without the leading zero', () => {
    const minutes = opts(60);
    expect(wheelTypeahead(minutes, '4')).toBe(4);
    expect(wheelTypeahead(minutes, '41')).toBe(41);
    expect(wheelTypeahead(minutes, '07')).toBe(7);
    expect(wheelTypeahead(minutes, '٤١')).toBe(41);
    expect(wheelTypeahead(minutes, 'x')).toBe(-1);
    expect(wheelTypeahead(opts(60, [41]), '41')).toBe(-1);
  });

  it('matches words without case or Arabic marks', () => {
    const periods: WheelOption[] = [
      { value: 'am', label: 'AM' },
      { value: 'pm', label: 'PM' },
    ];
    expect(wheelTypeahead(periods, 'p')).toBe(1);
    expect(wheelTypeahead([{ value: 'a', label: 'صَباحاً' }], 'صباحا')).toBe(0);
  });

  it('normalises digits and marks', () => {
    expect(wheelLatinDigits('٠١٢٣٤٥٦٧٨٩ ۰۹')).toBe('0123456789 09');
    expect(wheelStripMarks('مَسَاءً')).toBe('مساء');
  });
});

describe('wheel time', () => {
  it('adds the Latin digit extension to a locale tag', () => {
    expect(wheelLocale('ar-SA')).toBe('ar-SA-u-nu-latn');
    expect(wheelLocale('ar-u-ca-islamic')).toBe('ar-u-ca-islamic-nu-latn');
    expect(wheelLocale('ar-u-nu-arab')).toBe('ar-u-nu-latn');
  });

  it('reads the hour cycle and the column order of a locale', () => {
    expect(wheelHourCycle('en-US')).toBe(12);
    expect(wheelHourCycle('en-GB')).toBe(24);
    expect(wheelHourCycle('ar-SA')).toBe(12);
    expect(wheelTimeOrder('en-US', 12)).toEqual(['hour', 'minute', 'dayPeriod']);
    expect(wheelTimeOrder('ar-SA', 12)).toEqual(['hour', 'minute', 'dayPeriod']);
    expect(wheelTimeOrder('ko', 12)).toEqual(['dayPeriod', 'hour', 'minute']);
    expect(wheelTimeOrder('en-GB', 24)).toEqual(['hour', 'minute']);
  });

  it('takes the day period words from Intl, without Arabic marks', () => {
    expect(wheelDayPeriods('en-US')).toEqual({ am: 'AM', pm: 'PM' });
    const ar = wheelDayPeriods('ar-SA');
    expect(ar.am).toBe('ص');
    expect(ar.pm).toBe('م');
    expect(/[ً-ٟ]/.test(ar.am + ar.pm)).toBe(false);
  });

  it('converts between a time and column values', () => {
    expect(wheelTimeValues({ hour: 0, minute: 5 }, 12)).toEqual({ hour: 12, minute: 5, dayPeriod: 'am' });
    expect(wheelTimeValues({ hour: 21, minute: 41 }, 12)).toEqual({ hour: 9, minute: 41, dayPeriod: 'pm' });
    expect(wheelTimeFromValues({ hour: 12, minute: 0, dayPeriod: 'am' }, 12)).toEqual({ hour: 0, minute: 0 });
    expect(wheelTimeFromValues({ hour: 12, minute: 30, dayPeriod: 'pm' }, 12)).toEqual({ hour: 12, minute: 30 });
    expect(wheelTimeFromValues({ hour: 9, minute: 41, dayPeriod: 'pm' }, 12)).toEqual({ hour: 21, minute: 41 });
    expect(wheelTimeFromValues({ hour: 23, minute: 59 }, 24)).toEqual({ hour: 23, minute: 59 });
  });

  it('builds the columns with Latin digits in every locale', () => {
    const ar = wheelTimeColumns({ locale: 'ar-SA', value: { hour: 21, minute: 41 } });
    expect(ar.map((c) => c.id)).toEqual(['hour', 'minute', 'dayPeriod']);
    expect(ar.map((c) => c.label)).toEqual(['الساعة', 'الدقيقة', 'ص أو م']);
    expect(ar[0]!.options.map((o) => o.label).join(' ')).toBe('1 2 3 4 5 6 7 8 9 10 11 12');
    expect(ar[1]!.options[5]!.label).toBe('05');
    expect(ar.map((c) => c.value)).toEqual([9, 41, 'pm']);
    expect(ar.map((c) => c.loop)).toEqual([true, true, false]);
    const gb = wheelTimeColumns({ locale: 'en-GB', minuteStep: 15, value: { hour: 7, minute: 50 } });
    expect(gb.map((c) => c.id)).toEqual(['hour', 'minute']);
    expect(gb[0]!.options[7]!.label).toBe('07');
    expect(gb[1]!.options.map((o) => o.label)).toEqual(['00', '15', '30', '45']);
    expect(gb[1]!.value).toBe(45);
    expect(wheelTimeColumns({ locale: 'en', hourCycle: 24, labels: { hour: 'Hour' } })[0]!.label).toBe('Hour');
  });
});
