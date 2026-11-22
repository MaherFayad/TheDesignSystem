/**
 * Wheel picker helpers (order M9.16, proposed): stepping through a column
 * with or without wrap, skipping disabled rows, the repeated copies of a
 * column that loops, typing digits to jump, and the columns of a time wheel
 * for a locale. Pure, shared by every framework.
 *
 * Every export starts with `wheel` so the shared barrel never meets a name
 * from another file (the date helpers of M9.15 live in date.ts).
 *
 * Digits are Latin in every locale. Day period words (AM and PM, ص and م)
 * come from Intl for the locale, with Arabic marks removed. The order of the
 * time columns comes from Intl too: hour, minute, then the day period in
 * English and Arabic, the day period first in Korean.
 */

/** A value one row of a column stands for. */
export type WheelValue = string | number;

/** One row of a column. */
export interface WheelOption {
  value: WheelValue;
  /** The text drawn in the row and read as the value text. Default: the value. */
  label?: string;
  /** The text typing matches, when it differs from the label. */
  textValue?: string;
  /** A row that cannot be chosen: keys skip it and the wheel never rests on it. */
  disabled?: boolean;
}

/** One column of the wheel. */
export interface WheelColumn {
  /** Unique in the wheel. */
  id: string;
  /** The accessible name of the column, never drawn: Hours. */
  label: string;
  options: readonly WheelOption[];
  /** The chosen value (controlled). */
  value?: WheelValue;
  /** The first value when uncontrolled. */
  defaultValue?: WheelValue;
  /** Wrap from the last row to the first. Overrides the wheel's own loop. */
  loop?: boolean;
}

/** Rows a looping column renders at least, so a long flick never reaches an end. */
export const WHEEL_LOOP_MIN_ROWS = 200;
/** How long typed characters build one search, in ms. */
export const WHEEL_TYPEAHEAD_MS = 1000;
/** The step of PageUp and PageDown, in rows. */
export const WHEEL_PAGE_STEP = 5;
/** The farthest a row's curve reaches, in rows from the band. */
export const WHEEL_CURVE_MAX = 3;

/** The text of an option: its label, else its value. */
export const wheelOptionText = (option: WheelOption): string => option.label ?? String(option.value);

/** `i` wrapped into 0 to count - 1. */
export function wheelWrap(i: number, count: number): number {
  if (count <= 0) return 0;
  return ((i % count) + count) % count;
}

/** The index of a value among the options, or -1. Numbers and their strings match. */
export function wheelIndexOf(options: readonly WheelOption[], value: WheelValue | undefined): number {
  if (value === undefined) return -1;
  return options.findIndex((o) => o.value === value || String(o.value) === String(value));
}

/**
 * The nearest row that can be chosen from `index`: itself, else the closest
 * enabled row, the later one first on a tie. -1 when every row is disabled.
 */
export function wheelNearestEnabled(options: readonly WheelOption[], index: number, loop = false): number {
  const n = options.length;
  if (n === 0) return -1;
  const start = loop ? wheelWrap(index, n) : Math.min(Math.max(index, 0), n - 1);
  for (let d = 0; d < n; d += 1) {
    for (const i of [start + d, start - d]) {
      const at = loop ? wheelWrap(i, n) : i;
      if (at >= 0 && at < n && !options[at]?.disabled) return at;
    }
  }
  return -1;
}

/**
 * The row `delta` steps from `index`, skipping disabled rows. Without loop
 * it stops at the first or last enabled row; with loop it wraps.
 */
export function wheelStep(options: readonly WheelOption[], index: number, delta: number, loop = false): number {
  const n = options.length;
  if (n === 0) return -1;
  if (delta === 0) return wheelNearestEnabled(options, index, loop);
  const dir = delta > 0 ? 1 : -1;
  let at = index;
  let moved = 0;
  let last = wheelNearestEnabled(options, index, loop);
  for (let guard = 0; moved < Math.abs(delta) && guard < n * Math.abs(delta) + n; guard += 1) {
    const next = at + dir;
    if (!loop && (next < 0 || next >= n)) break;
    at = loop ? wheelWrap(next, n) : next;
    if (!options[at]?.disabled) {
      moved += 1;
      last = at;
    }
  }
  return last;
}

/** The first enabled row (`end` false) or the last (`end` true). */
export function wheelEdge(options: readonly WheelOption[], end: boolean): number {
  const n = options.length;
  for (let k = 0; k < n; k += 1) {
    const i = end ? n - 1 - k : k;
    if (!options[i]?.disabled) return i;
  }
  return -1;
}

/** How many copies of its rows a looping column renders: odd, at least 3, and at least `WHEEL_LOOP_MIN_ROWS` rows. */
export function wheelLoopCopies(count: number, minRows = WHEEL_LOOP_MIN_ROWS): number {
  if (count <= 0) return 1;
  const copies = Math.max(3, Math.ceil(minRows / count));
  return copies % 2 === 0 ? copies + 1 : copies;
}

/** The rendered row of option `index` in the middle copy. */
export function wheelMiddleRow(index: number, count: number, copies: number): number {
  return Math.floor(copies / 2) * count + index;
}

/**
 * The rendered row of option `index` nearest to the rendered row `from`, so
 * a step of one scrolls one row, never across copies.
 */
export function wheelNearestRow(from: number, index: number, count: number, copies: number): number {
  if (count <= 0) return 0;
  const copy = Math.floor(from / count);
  let best = copy * count + index;
  for (const c of [copy - 1, copy + 1]) {
    const row = c * count + index;
    if (row >= 0 && row < count * copies && Math.abs(row - from) < Math.abs(best - from)) best = row;
  }
  return Math.min(Math.max(best, 0), count * copies - 1);
}

/** The rendered row under the band for a scroll offset, clamped to the rows there are. */
export function wheelRowAt(scrollTop: number, rowHeight: number, rows: number): number {
  if (rowHeight <= 0 || rows <= 0) return 0;
  return Math.min(Math.max(Math.round(scrollTop / rowHeight), 0), rows - 1);
}

/** A row's distance from the band in rows (negative above), clamped to `WHEEL_CURVE_MAX`. */
export function wheelDistance(row: number, scrollTop: number, rowHeight: number): number {
  if (rowHeight <= 0) return 0;
  const d = row - scrollTop / rowHeight;
  return Math.min(Math.max(d, -WHEEL_CURVE_MAX), WHEEL_CURVE_MAX);
}

const DIGIT_BASES = [0x0660, 0x06f0, 0x0966];

/** Arabic Indic, Eastern Arabic Indic and Devanagari digits as Latin digits. */
export function wheelLatinDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹०-९]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = DIGIT_BASES.find((b) => code >= b && code <= b + 9) ?? code;
    return String(code - base);
  });
}

/** Arabic marks (harakat, tanween, shadda, sukun, superscript alef) removed. */
export function wheelStripMarks(text: string): string {
  return text.replace(/[ً-ٰٟۖ-ۭ]/g, '');
}

const fold = (text: string) => wheelStripMarks(wheelLatinDigits(text)).toLocaleLowerCase().trim();

/**
 * The row typed text jumps to: the first enabled row, from `from` on and
 * wrapping, whose text starts with `typed`. Leading zeros do not count, so
 * 7 finds 07. -1 when nothing matches.
 */
export function wheelTypeahead(options: readonly WheelOption[], typed: string, from = 0): number {
  const q = fold(typed);
  if (!q) return -1;
  const n = options.length;
  const bare = q.replace(/^0+(?=\d)/, '');
  for (let k = 0; k < n; k += 1) {
    const i = wheelWrap(from + k, n);
    const o = options[i];
    if (!o || o.disabled) continue;
    const t = fold(o.textValue ?? wheelOptionText(o));
    if (t.startsWith(q) || (bare !== q && t.startsWith(bare)) || t.replace(/^0+(?=\d)/, '').startsWith(bare)) return i;
  }
  return -1;
}

/** A locale tag with the Latin digit extension: ar-SA becomes ar-SA-u-nu-latn. */
export function wheelLocale(locale: string): string {
  if (!/-u-/i.test(locale)) return `${locale}-u-nu-latn`;
  return /-nu-[a-z0-9]+/i.test(locale) ? locale.replace(/-nu-[a-z0-9]+/i, '-nu-latn') : `${locale}-nu-latn`;
}

/** 12 or 24: the hour cycle the locale writes times in. */
export function wheelHourCycle(locale: string): 12 | 24 {
  try {
    const cycle = new Intl.DateTimeFormat(wheelLocale(locale), { hour: 'numeric' }).resolvedOptions().hourCycle;
    return cycle === 'h11' || cycle === 'h12' ? 12 : 24;
  } catch {
    return 24;
  }
}

/** The part a time column shows. */
export type WheelTimePart = 'hour' | 'minute' | 'dayPeriod';

/** The order of the time columns in the locale's own writing order (logical, not visual). */
export function wheelTimeOrder(locale: string, hourCycle: 12 | 24): WheelTimePart[] {
  try {
    const parts = new Intl.DateTimeFormat(wheelLocale(locale), { hour: 'numeric', minute: '2-digit', hour12: hourCycle === 12 }).formatToParts(new Date(2026, 0, 1, 9, 41));
    const order = parts.map((p) => p.type).filter((t): t is WheelTimePart => t === 'hour' || t === 'minute' || t === 'dayPeriod');
    const out = order.filter((t, i) => order.indexOf(t) === i);
    if (hourCycle === 12 && !out.includes('dayPeriod')) out.push('dayPeriod');
    if (hourCycle === 24) return out.filter((t) => t !== 'dayPeriod');
    return out.length >= 2 ? out : hourCycle === 12 ? ['hour', 'minute', 'dayPeriod'] : ['hour', 'minute'];
  } catch {
    return hourCycle === 12 ? ['hour', 'minute', 'dayPeriod'] : ['hour', 'minute'];
  }
}

/** The locale's words for before and after noon, from Intl, Arabic marks removed: AM and PM, ص and م. */
export function wheelDayPeriods(locale: string): { am: string; pm: string } {
  const word = (hour: number, fallback: string) => {
    try {
      const part = new Intl.DateTimeFormat(wheelLocale(locale), { hour: 'numeric', hour12: true }).formatToParts(new Date(2026, 0, 1, hour)).find((p) => p.type === 'dayPeriod');
      return part ? wheelStripMarks(part.value).trim() : fallback;
    } catch {
      return fallback;
    }
  };
  return { am: word(9, 'AM'), pm: word(21, 'PM') };
}

/** A time of day: hour 0 to 23 and minute 0 to 59. */
export interface WheelTime {
  hour: number;
  minute: number;
}

/** The values of the time columns for a time: hour (1 to 12 or 0 to 23), minute and, for 12 hours, am or pm. */
export function wheelTimeValues(time: WheelTime, hourCycle: 12 | 24): Record<WheelTimePart, WheelValue> {
  const pm = time.hour >= 12;
  const hour = hourCycle === 12 ? ((time.hour + 11) % 12) + 1 : time.hour;
  return { hour, minute: time.minute, dayPeriod: pm ? 'pm' : 'am' };
}

/** The time the column values stand for. Missing values read as 0 and am. */
export function wheelTimeFromValues(values: Partial<Record<string, WheelValue>>, hourCycle: 12 | 24): WheelTime {
  const minute = Number(values.minute ?? 0);
  const hour = Number(values.hour ?? 0);
  if (hourCycle === 24) return { hour: wheelWrap(hour, 24), minute };
  const pm = values.dayPeriod === 'pm';
  return { hour: (hour % 12) + (pm ? 12 : 0), minute };
}

/** Built in column names for a time wheel (convention 14). */
const TIME_LABELS: Record<'en' | 'ar', Record<WheelTimePart, string>> = {
  en: { hour: 'Hours', minute: 'Minutes', dayPeriod: 'AM or PM' },
  ar: { hour: 'الساعة', minute: 'الدقيقة', dayPeriod: 'الفترة' },
};

export interface WheelTimeOptions {
  /** A BCP 47 tag: en, en-GB, ar-SA. Digits stay Latin whatever it says. */
  locale: string;
  /** 12 or 24. Default: the locale's own cycle. */
  hourCycle?: 12 | 24;
  /** The time the wheel shows. */
  value?: WheelTime;
  /** Minutes between rows: 1, 5, 15. Default 1. */
  minuteStep?: number;
  /** Column names in place of the built in ones. */
  labels?: Partial<Record<WheelTimePart, string>>;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The columns of a time wheel in the locale's order, ids `hour`, `minute`
 * and `dayPeriod`. Hours and minutes loop; the day period does not. Hours
 * read 1 to 12 or 00 to 23, minutes 00 to 59, in Latin digits. In a right
 * to left root the first column sits at the right, so Arabic shows the hour
 * at the right and the day period at the left.
 */
export function wheelTimeColumns({ locale, hourCycle, value, minuteStep = 1, labels }: WheelTimeOptions): WheelColumn[] {
  const cycle = hourCycle ?? wheelHourCycle(locale);
  const words = { ...TIME_LABELS[/^ar(?:-|$)/i.test(locale) ? 'ar' : 'en'], ...labels };
  const values = value ? wheelTimeValues(value, cycle) : undefined;
  const step = Math.max(1, Math.floor(minuteStep));
  const periods = wheelDayPeriods(locale);
  const hours: WheelOption[] =
    cycle === 12
      ? Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))
      : Array.from({ length: 24 }, (_, i) => ({ value: i, label: pad(i) }));
  const minutes: WheelOption[] = Array.from({ length: Math.ceil(60 / step) }, (_, i) => ({ value: i * step, label: pad(i * step) }));
  // A minute not on the step snaps down to the row before it.
  const minuteValue = values ? Math.floor(Number(values.minute) / step) * step : undefined;
  const make: Record<WheelTimePart, () => WheelColumn> = {
    hour: () => ({ id: 'hour', label: words.hour, options: hours, value: values?.hour, loop: true }),
    minute: () => ({ id: 'minute', label: words.minute, options: minutes, value: minuteValue, loop: true }),
    dayPeriod: () => ({
      id: 'dayPeriod',
      label: words.dayPeriod,
      options: [
        { value: 'am', label: periods.am },
        { value: 'pm', label: periods.pm },
      ],
      value: values?.dayPeriod,
      loop: false,
    }),
  };
  return wheelTimeOrder(locale, cycle).map((part) => make[part]());
}
