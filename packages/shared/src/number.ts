// Number formatting and parsing for number fields, with Intl only.
//
// Digits stay Western (latn) in every language, Arabic included, unless a
// caller asks for another numbering system. Input is wider than output:
// parseNumber reads Western digits, Arabic Indic digits (U+0660 to U+0669),
// Eastern Arabic Indic digits (U+06F0 to U+06F9), the Arabic decimal mark
// (U+066B), the Arabic thousands mark (U+066C) and the Arabic comma
// (U+060C, read as a group mark).
//
// Pure logic with no React, shared by React and Angular.

import { toLatinDigits } from './otp';

/** The Arabic decimal mark. */
export const ARABIC_DECIMAL_MARK = '\u066B';
/** The Arabic thousands mark. */
export const ARABIC_GROUP_MARK = '\u066C';
/** The Arabic comma, read as a group mark in a number. */
export const ARABIC_COMMA = '\u060C';

/** Bidi controls and marks a copied number may carry. */
const BIDI_MARKS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/**
 * The locale with the Western numbering system, for Intl and for a number
 * field's locale: `ar` becomes `ar-u-nu-latn`. An invalid tag falls back to
 * `en-u-nu-latn`.
 */
export function latinLocale(locale: string | undefined): string {
  try {
    return new Intl.Locale(locale || 'en', { numberingSystem: 'latn' }).toString();
  } catch {
    return 'en-u-nu-latn';
  }
}

export interface NumberSeparators {
  /** The decimal mark of the locale, with Western digits. */
  decimal: string;
  /** The group mark of the locale, with Western digits. */
  group: string;
}

/** The decimal and group marks a locale formats with. */
export function numberSeparators(locale?: string): NumberSeparators {
  const parts = new Intl.NumberFormat(latinLocale(locale), { useGrouping: true }).formatToParts(12345.6);
  return {
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
  };
}

export type FormatNumberOptions = Intl.NumberFormatOptions;

/**
 * Formats a number for a locale with Intl. Western digits unless
 * `options.numberingSystem` asks for another system. NaN and infinities
 * give an empty string.
 */
export function formatNumber(value: number, locale?: string, options: FormatNumberOptions = {}): string {
  if (!Number.isFinite(value)) return '';
  const { numberingSystem, ...rest } = options;
  const tag = numberingSystem ? new Intl.Locale(locale || 'en', { numberingSystem }).toString() : latinLocale(locale);
  return new Intl.NumberFormat(tag, rest).format(value);
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Reads a typed number in a locale. Returns NaN when the text is not one
 * plain number. Accepts the locale's own group and decimal marks, Western
 * and Arabic Indic digits, the Arabic marks, a leading plus or minus (the
 * minus sign U+2212 too) and bidi marks around it. Percent signs, currency
 * symbols and units are not read: a field shows those outside the value.
 */
export function parseNumber(text: string, locale?: string): number {
  const { decimal, group } = numberSeparators(locale);
  let s = toLatinDigits(text).replace(BIDI_MARKS, '').trim();
  if (s === '') return NaN;
  s = s.replace(/\u2212/g, '-').replaceAll(ARABIC_DECIMAL_MARK, '\u0000');
  s = s.replaceAll(ARABIC_GROUP_MARK, '').replaceAll(ARABIC_COMMA, '');
  // A space like group mark (fr, ru): any space between digits is a group mark.
  if (/\s/.test(group)) s = s.replace(/(\d)\s+(?=\d)/g, '$1');
  else s = s.replace(new RegExp(`(\\d)${escape(group)}(?=\\d)`, 'g'), '$1');
  s = s.replaceAll(decimal, '\u0000').replaceAll('\u0000', '.');
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}

/** Keeps a value within min and max. An undefined or NaN bound is open. */
export function clamp(value: number, min?: number, max?: number): number {
  let out = value;
  if (min !== undefined && !Number.isNaN(min)) out = Math.max(min, out);
  if (max !== undefined && !Number.isNaN(max)) out = Math.min(max, out);
  return out;
}

/** The number of digits after the decimal mark of a step, so 0.1 + 0.2 snaps to 0.3. */
export function decimalPlaces(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const text = String(value);
  const exp = /e-(\d+)$/.exec(text);
  if (exp) return Number(exp[1]) + (text.split('e')[0]!.split('.')[1]?.length ?? 0);
  return text.split('.')[1]?.length ?? 0;
}

/** Rounds away floating point dust to a number of decimals. */
export function roundTo(value: number, places: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(Math.min(20, Math.max(0, places))));
}

/**
 * Snaps a value to the nearest step counted from `base` (min, else 0), then
 * keeps it within min and max. A step of zero, below zero or NaN leaves the
 * value as it is (only clamped).
 */
export function snapToStep(value: number, step: number, min?: number, max?: number): number {
  if (!Number.isFinite(value)) return value;
  if (!(step > 0)) return clamp(value, min, max);
  const base = min !== undefined && Number.isFinite(min) ? min : 0;
  const places = Math.max(decimalPlaces(step), decimalPlaces(base));
  let snapped = roundTo(base + Math.round(roundTo((value - base) / step, 10)) * step, places);
  // When clamping would land between steps, use the last step inside the range.
  if (max !== undefined && Number.isFinite(max) && snapped > max) snapped = roundTo(base + Math.floor(roundTo((max - base) / step, 10)) * step, places);
  if (min !== undefined && Number.isFinite(min) && snapped < min) snapped = min;
  return snapped;
}
