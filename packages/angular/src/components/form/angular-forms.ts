// The bridge between dsForm and @angular/forms. A form with `[formGroup]`
// (reactive forms) or NgForm (template forms: FormsModule on a plain form)
// has a ControlContainer on the same element. dsForm reads the errors of its
// controls here and maps them, with the browser's checks and the custom
// validators, through collectErrors in packages/shared/src/form.ts.
//
// The built in Angular validators map to the same Form copy as the
// browser's constraint flags in React's Form: `min` says rangeUnderflow,
// `minlength` says tooShort, `pattern` says patternMismatch, `email` says
// typeMismatch for email, and so on. An error whose value is a string, or
// an object with a `message` string, is a custom validator: it says that
// text and wins over a built in message, as a Form validator does in React.
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import type { FormErrors } from '@the-system/shared';

export interface AngularErrorWords {
  /** The message of the `required` and `requiredTrue` errors. */
  required: string;
  /** The message of an error that carries no text of its own and has no copy below. */
  invalid: string;
  /** `email`. Called with "email". */
  typeMismatch?: (type: string) => string;
  /** `pattern`. */
  patternMismatch?: string;
  /** `minlength`, from requiredLength. */
  tooShort?: (min: number) => string;
  /** `maxlength`, from requiredLength. */
  tooLong?: (max: number) => string;
  /** `min`. */
  rangeUnderflow?: (min: string) => string;
  /** `max`. */
  rangeOverflow?: (max: string) => string;
}

/** Which bucket an error goes to: required wins over the custom validators, which win over the built in constraints. */
export type AngularErrorKind = 'required' | 'custom' | 'constraint';

function textOf(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (value && typeof value === 'object' && typeof (value as { message?: unknown }).message === 'string') {
    return (value as { message: string }).message;
  }
  return undefined;
}

function field(value: unknown, key: string): string {
  const v = value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
  return v === undefined || v === null ? '' : String(v);
}

/** The copy for one built in Angular error key, or undefined for a key with no copy. */
function builtIn(key: string, value: unknown, words: AngularErrorWords): string | undefined {
  switch (key) {
    case 'email':
      return words.typeMismatch?.('email');
    case 'pattern':
      return words.patternMismatch;
    case 'minlength':
      return words.tooShort?.(Number(field(value, 'requiredLength')));
    case 'maxlength':
      return words.tooLong?.(Number(field(value, 'requiredLength')));
    case 'min':
      return words.rangeUnderflow?.(field(value, 'min'));
    case 'max':
      return words.rangeOverflow?.(field(value, 'max'));
    default:
      return undefined;
  }
}

/**
 * The message and its kind for one control's errors. `required` and
 * `requiredTrue` say `requiredMessage`, or the form's required words; a
 * custom error with text says that text; a built in key says its copy; any
 * other error says the invalid words.
 */
export function describeErrors(
  errors: ValidationErrors,
  words: AngularErrorWords,
  requiredMessage?: string,
): { message: string; kind: AngularErrorKind } | undefined {
  const keys = Object.keys(errors);
  if (keys.length === 0) return undefined;
  if ('required' in errors || 'requiredTrue' in errors) return { message: requiredMessage ?? words.required, kind: 'required' };
  for (const key of keys) {
    const text = textOf(errors[key]);
    if (text !== undefined) return { message: text, kind: 'custom' };
  }
  for (const key of keys) {
    const text = builtIn(key, errors[key], words);
    if (text !== undefined) return { message: text, kind: 'constraint' };
  }
  return { message: words.invalid, kind: 'constraint' };
}

/** The message for one control's errors. See describeErrors. */
export function messageOf(errors: ValidationErrors, words: AngularErrorWords, requiredMessage?: string): string | undefined {
  return describeErrors(errors, words, requiredMessage)?.message;
}

/** The leaf controls of a group or array, by dotted path. A disabled control is skipped, as the browser skips one. */
export function leafControls(control: AbstractControl, prefix = ''): [string, AbstractControl][] {
  const children = (control as { controls?: Record<string, AbstractControl> | AbstractControl[] }).controls;
  if (children === undefined) return prefix === '' ? [] : [[prefix, control]];
  const out: [string, AbstractControl][] = [];
  for (const [key, child] of Object.entries(children)) {
    if (child.disabled) continue;
    const path = prefix === '' ? key : `${prefix}.${key}`;
    out.push(...leafControls(child, path));
  }
  return out;
}

/**
 * Errors of every enabled leaf control, by dotted path and kind.
 * `requiredFor` gives the required message of a path: a box to tick, an
 * option to pick, or a message a ConsentField set.
 */
export function angularErrorsByKind(
  root: AbstractControl | null | undefined,
  words: AngularErrorWords,
  requiredFor?: (path: string) => string | undefined,
): Record<AngularErrorKind, FormErrors> {
  const out: Record<AngularErrorKind, FormErrors> = { required: {}, custom: {}, constraint: {} };
  if (!root) return out;
  for (const [path, control] of leafControls(root)) {
    if (!control.errors) continue;
    const found = describeErrors(control.errors, words, requiredFor?.(path));
    if (found !== undefined) out[found.kind][path] = found.message;
  }
  return out;
}

/** Errors of every enabled leaf control, by dotted path. */
export function angularErrors(
  root: AbstractControl | null | undefined,
  words: AngularErrorWords,
  requiredFor?: (path: string) => string | undefined,
): FormErrors {
  const { required, custom, constraint } = angularErrorsByKind(root, words, requiredFor);
  return { ...constraint, ...custom, ...required };
}

/** The control at a dotted path, or null. */
export function controlAt(root: AbstractControl | null | undefined, path: string): AbstractControl | null {
  return root?.get(path) ?? null;
}
