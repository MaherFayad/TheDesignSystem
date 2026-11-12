// The logic of a scrub input: the arithmetic a person may type into a
// number field (`12*2`, `(80+20)/2`, `100px + 8`), the step ladder of the
// arrow keys and the drag (one step, Shift ten steps, Alt a tenth), and the
// value a drag of some pixels gives.
//
// Ported from Figma-Killer-2 `ScrubInput/numericExpression.ts` and
// `ScrubInput/scrubMath.ts`. Values here are numbers, not CSS strings: the
// unit is shown by the field, not stored in the value. Typed digits may be
// Arabic Indic; they are read as Western digits (number.ts).
//
// Pure logic with no React, shared by React and Angular.
import { ARABIC_DECIMAL_MARK, clamp, decimalPlaces, roundTo } from './number';
import { toLatinDigits } from './otp';

export interface NumericExpression {
  /** The evaluated number. Always finite. */
  magnitude: number;
  /** The single unit seen in the expression (`px`, `%`, `deg`), or `''` when it had none. */
  unit: string;
}

type Token =
  | { kind: 'number'; value: number; unit: string }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' }
  | { kind: 'paren'; value: '(' | ')' };

/** `12`, `.5`, `1.25rem`, `50%`: a magnitude and at most one unit. */
const NUMBER_RE = /^(\d*\.?\d+)([a-z%°]*)/i;
/** The multiplication and division signs people type besides `*` and `/`. */
const TIMES = /[×✕✖]/g;
const DIVIDE = /[÷∕]/g;
/** The minus sign. */
const MINUS = /−/g;

function tokenize(raw: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < raw.length) {
    const char = raw[i]!;
    if (/\s/.test(char)) {
      i += 1;
      continue;
    }
    if (char === '(' || char === ')') {
      tokens.push({ kind: 'paren', value: char });
      i += 1;
      continue;
    }
    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ kind: 'op', value: char });
      i += 1;
      continue;
    }
    const match = NUMBER_RE.exec(raw.slice(i));
    if (!match) return null;
    const value = Number.parseFloat(match[1]!);
    if (!Number.isFinite(value)) return null;
    tokens.push({ kind: 'number', value, unit: match[2] ?? '' });
    i += match[0].length;
  }
  return tokens;
}

interface ParserState {
  tokens: Token[];
  index: number;
  units: Set<string>;
  failed: boolean;
}

function peek(state: ParserState): Token | undefined {
  return state.tokens[state.index];
}

function parseExpression(state: ParserState): number {
  let left = parseTerm(state);
  for (;;) {
    const token = peek(state);
    if (!token || token.kind !== 'op' || (token.value !== '+' && token.value !== '-')) break;
    state.index += 1;
    const right = parseTerm(state);
    left = token.value === '+' ? left + right : left - right;
  }
  return left;
}

function parseTerm(state: ParserState): number {
  let left = parseUnary(state);
  for (;;) {
    const token = peek(state);
    if (!token || token.kind !== 'op' || (token.value !== '*' && token.value !== '/')) break;
    state.index += 1;
    const right = parseUnary(state);
    if (token.value === '*') left *= right;
    else {
      // Division by zero is refused, never written.
      if (right === 0) state.failed = true;
      left /= right;
    }
  }
  return left;
}

function parseUnary(state: ParserState): number {
  const token = peek(state);
  if (token && token.kind === 'op' && (token.value === '+' || token.value === '-')) {
    state.index += 1;
    const operand = parseUnary(state);
    return token.value === '-' ? -operand : operand;
  }
  return parsePrimary(state);
}

function parsePrimary(state: ParserState): number {
  const token = peek(state);
  if (!token) {
    state.failed = true;
    return 0;
  }
  if (token.kind === 'number') {
    state.index += 1;
    if (token.unit !== '') state.units.add(token.unit.toLowerCase());
    return token.value;
  }
  if (token.kind === 'paren' && token.value === '(') {
    state.index += 1;
    const inner = parseExpression(state);
    const close = peek(state);
    if (!close || close.kind !== 'paren' || close.value !== ')') {
      state.failed = true;
      return inner;
    }
    state.index += 1;
    return inner;
  }
  state.failed = true;
  return 0;
}

/**
 * Evaluates typed arithmetic: `+ - * /`, parentheses, unary signs, at most
 * one distinct unit. Returns null for anything else: an empty string, a
 * second unit (`100px + 8em`), division by zero, a non finite result, or
 * any token outside the grammar (`calc(...)`, `auto`, `10 20`). Arabic Indic
 * digits and the Arabic decimal mark are read as Western ones; the signs
 * `×` and `÷` are read as `*` and `/`. The result is rounded to
 * four decimals, so `0.1 + 0.2` is `0.3`.
 */
export function evaluateExpression(raw: string): NumericExpression | null {
  const trimmed = toLatinDigits(raw).replaceAll(ARABIC_DECIMAL_MARK, '.').replace(TIMES, '*').replace(DIVIDE, '/').replace(MINUS, '-').trim();
  if (trimmed === '') return null;
  const tokens = tokenize(trimmed);
  if (!tokens || tokens.length === 0) return null;
  const state: ParserState = { tokens, index: 0, units: new Set(), failed: false };
  const magnitude = parseExpression(state);
  if (state.failed || state.index !== tokens.length) return null;
  if (state.units.size > 1) return null;
  if (!Number.isFinite(magnitude)) return null;
  return { magnitude: Number(magnitude.toFixed(4)), unit: [...state.units][0] ?? '' };
}

/** Keyboard or pointer modifiers that pick the step. */
export interface NudgeModifiers {
  shiftKey: boolean;
  altKey: boolean;
}

/** How many steps Shift moves. */
export const SHIFT_FACTOR = 10;
/** The part of a step Alt moves. */
export const FINE_FACTOR = 0.1;

/**
 * The step for a modifier state: Alt a tenth of a step, Shift ten steps,
 * else one step. Alt wins when both are held: the finer request wins.
 */
export function nudgeStepFor({ shiftKey, altKey }: NudgeModifiers, step = 1): number {
  if (altKey) return roundTo(step * FINE_FACTOR, decimalPlaces(step) + 1);
  if (shiftKey) return roundTo(step * SHIFT_FACTOR, decimalPlaces(step));
  return step;
}

export interface ScrubOptions {
  min?: number;
  max?: number;
  /**
   * Decimals the value keeps. Default: the decimals of the move, so a step
   * of 0.1 keeps one decimal and an Alt move of a step of 1 keeps one too.
   */
  precision?: number;
}

function placesFor(amount: number, from: number, precision: number | undefined): number {
  return precision ?? Math.max(decimalPlaces(amount), decimalPlaces(from));
}

/**
 * The value after a drag: `pixels` of pointer travel, each worth `perPixel`
 * (a nudge step), from the value at the start of the drag. Kept within min
 * and max and rounded, so binary dust never shows. A drag toward the
 * inline end grows the value: the caller flips the sign of `pixels` in rtl.
 */
export function scrubValue(from: number, pixels: number, perPixel: number, options: ScrubOptions = {}): number {
  const places = placesFor(perPixel, from, options.precision);
  return roundTo(clamp(from + pixels * perPixel, options.min, options.max), places);
}

/** The value after one arrow key press: `direction` times the step the modifiers pick. */
export function nudgeValue(
  from: number,
  direction: 1 | -1,
  modifiers: NudgeModifiers,
  step = 1,
  options: ScrubOptions = {},
): number {
  const amount = nudgeStepFor(modifiers, step);
  return roundTo(clamp(from + direction * amount, options.min, options.max), placesFor(amount, from, options.precision));
}

export interface CommitOptions extends ScrubOptions {
  /** The unit of the field. A typed unit must be this one, or none. */
  unit?: string;
}

/**
 * What a typed value becomes on commit: the evaluated arithmetic, kept
 * within min and max, or null when the text is not one this field can take
 * (not arithmetic, or a unit other than the field's). Null keeps the old
 * value, so a half typed value never becomes a zero.
 */
export function resolveCommit(raw: string, options: CommitOptions = {}): number | null {
  const evaluated = evaluateExpression(raw);
  if (!evaluated) return null;
  const unit = (options.unit ?? '').toLowerCase();
  if (evaluated.unit !== '' && evaluated.unit !== unit) return null;
  const value = clamp(evaluated.magnitude, options.min, options.max);
  return options.precision === undefined ? value : roundTo(value, options.precision);
}

/**
 * The text a scrub field shows for a value: Western digits, no grouping,
 * at most `precision` decimals (default 2) with trailing zeros dropped.
 */
export function formatScrub(value: number, precision = 2): string {
  if (!Number.isFinite(value)) return '';
  return String(roundTo(value, precision));
}
