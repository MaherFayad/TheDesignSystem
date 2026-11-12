// The bridge between dsForm and @angular/forms. A form with `[formGroup]`
// (reactive forms) or NgForm (template forms: FormsModule on a plain form)
// has a ControlContainer on the same element. dsForm reads the errors of its
// controls here and maps them, with the browser's checks and the custom
// validators, through collectErrors in packages/shared/src/form.ts.
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import type { FormErrors } from '@the-system/shared';

export interface AngularErrorWords {
  /** The message of the `required` and `requiredTrue` errors. */
  required: string;
  /** The message of an error that carries no text of its own. */
  invalid: string;
}

/**
 * The message for one control's errors. `required` uses the form's words;
 * an error whose value is a string, or an object with a `message` string,
 * says that text (a custom validator can return `{ workEmail: 'Use your
 * work email.' }`); any other error uses the invalid words.
 */
export function messageOf(errors: ValidationErrors, words: AngularErrorWords): string | undefined {
  const keys = Object.keys(errors);
  if (keys.length === 0) return undefined;
  if ('required' in errors || 'requiredTrue' in errors) return words.required;
  for (const key of keys) {
    const value: unknown = errors[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
    if (value && typeof value === 'object' && typeof (value as { message?: unknown }).message === 'string') {
      return (value as { message: string }).message;
    }
  }
  return words.invalid;
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

/** Errors of every enabled leaf control, by dotted path. */
export function angularErrors(root: AbstractControl | null | undefined, words: AngularErrorWords): FormErrors {
  const out: FormErrors = {};
  if (!root) return out;
  for (const [path, control] of leafControls(root)) {
    const message = control.errors ? messageOf(control.errors, words) : undefined;
    if (message !== undefined) out[path] = message;
  }
  return out;
}

/** The control at a dotted path, or null. */
export function controlAt(root: AbstractControl | null | undefined, path: string): AbstractControl | null {
  return root?.get(path) ?? null;
}
