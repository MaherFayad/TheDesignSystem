/**
 * One time codes: the pure logic behind OTPField.
 *
 * A code arrives typed, pasted from an SMS or an email, or filled by the
 * browser (`autocomplete="one-time-code"`) or a password manager. People
 * and messages write it in many forms: "123 456", "123-456", "\u0661\u0662\u0663\u0664\u0665\u0666" (Arabic
 * Indic digits from an Arabic keyboard), or a whole sentence such as "Your
 * code is 123456". `parseCode` turns each of these into the plain code.
 */

/** Which characters a code may hold. */
export type CodeCharset = 'numeric' | 'alphanumeric';

export interface ParseCodeOptions {
  /** Number of characters in a full code. Default 6. */
  length?: number;
  /** numeric: digits only. alphanumeric: Latin letters (upper cased) and digits. Default numeric. */
  charset?: CodeCharset;
}

export interface ParsedCode {
  /** The code characters found, at most `length` of them. */
  value: string;
  /** True when `value` holds exactly `length` characters. */
  complete: boolean;
  /**
   * True when the input held a character that is not part of a code and not
   * a separator (a letter in a numeric code). The caller may say so; the
   * character is dropped either way.
   */
  rejected: boolean;
}

// Arabic Indic digits (U+0660 to U+0669) and Eastern Arabic Indic digits
// (U+06F0 to U+06F9, used in Persian and Urdu keyboards).
const ARABIC_INDIC = /[\u0660-\u0669\u06F0-\u06F9]/g;

/** Turns Arabic Indic and Eastern Arabic Indic digits into Latin digits. Other characters stay. */
export function toLatinDigits(text: string): string {
  return text.replace(ARABIC_INDIC, (d) => {
    const code = d.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

// Spaces of every width, hyphens, the minus sign and the dashes people
// type between groups of a code. Written as escapes, so no dash shows here.
const SEPARATORS = /[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\-\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;

/** The pattern of one allowed character. */
function charClass(charset: CodeCharset): string {
  return charset === 'numeric' ? '0-9' : 'A-Z0-9';
}

/**
 * Reads a code out of typed, pasted or filled text.
 *
 * 1. Arabic Indic digits become Latin digits. Letters are upper cased for an
 *    alphanumeric code.
 * 2. Spaces and dashes between groups are dropped.
 * 3. When what is left holds only code characters, that is the code.
 *    Otherwise, when the text holds one run of exactly `length` code
 *    characters (an SMS: "Your code is 123456"), that run is the code.
 *    Otherwise every code character is kept, in order.
 * 4. The value is cut to `length`.
 */
export function parseCode(text: string, options: ParseCodeOptions = {}): ParsedCode {
  const length = Math.max(1, Math.floor(options.length ?? 6));
  const charset = options.charset ?? 'numeric';
  const cls = charClass(charset);

  let source = toLatinDigits(text);
  if (charset === 'alphanumeric') source = source.toUpperCase();
  const compact = source.replace(SEPARATORS, '');

  const only = new RegExp(`^[${cls}]*$`);
  if (only.test(compact)) {
    const value = compact.slice(0, length);
    return { value, complete: value.length === length, rejected: false };
  }

  // A run of exactly `length` code characters, with nothing allowed on either side.
  const run = new RegExp(`(?<![${cls}])[${cls}]{${length}}(?![${cls}])`, 'g');
  const runs = source.match(run) ?? [];
  if (runs.length === 1 && runs[0] !== undefined) {
    return { value: runs[0], complete: true, rejected: false };
  }

  const value = compact.replace(new RegExp(`[^${cls}]`, 'g'), '').slice(0, length);
  return { value, complete: value.length === length, rejected: true };
}

/** The `inputmode` and `pattern` an input needs for a charset: the numeric keypad for digits. */
export function codeInputHints(charset: CodeCharset = 'numeric'): { inputMode: 'numeric' | 'text'; pattern: string } {
  return charset === 'numeric' ? { inputMode: 'numeric', pattern: '[0-9]*' } : { inputMode: 'text', pattern: '[A-Za-z0-9]*' };
}

/**
 * Splits a code length into groups for display. `groups` is a list of group
 * sizes; when it does not add up to `length`, the code shows as one group.
 * Returns the index of the first cell of every group after the first: a
 * separator goes before each of them.
 */
export function codeSeparatorIndexes(length: number, groups?: readonly number[]): number[] {
  if (!groups || groups.length < 2) return [];
  if (groups.some((g) => !Number.isInteger(g) || g < 1)) return [];
  if (groups.reduce((a, b) => a + b, 0) !== length) return [];
  const out: number[] = [];
  let at = 0;
  for (const g of groups.slice(0, -1)) {
    at += g;
    out.push(at);
  }
  return out;
}
