// Form validation logic for Form (React), its Angular port and React Native.
// No DOM, no framework: plain records in, plain records out.
//
// - collectErrors runs the custom validators over the values and merges
//   them with errors found elsewhere (the browser's constraint validation on
//   the web). One message per field: the first that fails wins.
// - firstInvalid picks the field focus moves to on submit: the first name in
//   form order that has an error.
// - mapServerErrors reads the common shapes a server sends back and splits
//   them into field errors (by name) and form errors (for the summary only).

/** Every named value of a form: one value per name, a list when a name repeats. */
export type FormValues = Record<string, unknown>;

/** Field name to the message that says what is wrong and how to fix it. */
export type FormErrors = Record<string, string>;

/** Returns a message when the value is wrong, nothing when it is right. */
export type FormValidator<V extends FormValues = FormValues> = (value: unknown, values: V) => string | null | undefined | false;

/** Field name to one validator or a list, run in order. */
export type FormValidators<V extends FormValues = FormValues> = Partial<Record<string, FormValidator<V> | readonly FormValidator<V>[]>>;

function hasMessage(m: unknown): m is string {
  return typeof m === 'string' && m.trim() !== '';
}

/**
 * Runs the validators and merges the result with `base` (errors already
 * known, such as the browser's). A name in `base` keeps its message: the
 * custom validators of that name do not run.
 */
export function collectErrors<V extends FormValues>(values: V, validators: FormValidators<V> = {}, base: FormErrors = {}): FormErrors {
  const out: FormErrors = {};
  for (const [name, message] of Object.entries(base)) if (hasMessage(message)) out[name] = message;
  for (const [name, entry] of Object.entries(validators)) {
    if (!entry || out[name] !== undefined) continue;
    const list = (Array.isArray(entry) ? entry : [entry]) as readonly FormValidator<V>[];
    for (const validate of list) {
      const message = validate(values[name], values);
      if (hasMessage(message)) {
        out[name] = message;
        break;
      }
    }
  }
  return out;
}

/** True when there is at least one error. */
export function hasErrors(errors: FormErrors | null | undefined): boolean {
  return !!errors && Object.values(errors).some(hasMessage);
}

/**
 * The first field with an error, in form order. Names in `errors` that are
 * not in `order` come after, in the order of `errors`.
 */
export function firstInvalid(order: readonly string[], errors: FormErrors): string | undefined {
  for (const name of order) if (hasMessage(errors[name])) return name;
  return Object.keys(errors).find((name) => hasMessage(errors[name]));
}

/** The errors in form order, for the summary. */
export function orderErrors(order: readonly string[], errors: FormErrors): { name: string; message: string }[] {
  const seen = new Set<string>();
  const out: { name: string; message: string }[] = [];
  for (const name of [...order, ...Object.keys(errors)]) {
    const message = errors[name];
    if (seen.has(name) || !hasMessage(message)) continue;
    seen.add(name);
    out.push({ name, message });
  }
  return out;
}

/** Field errors by name, and messages about the whole form. */
export interface MappedServerErrors {
  fields: FormErrors;
  form: string[];
}

export interface MapServerErrorsOptions {
  /** The field names the form has. A name not in the list goes to `form`. Default: every name is a field. */
  names?: readonly string[];
  /** Server name to form name, for a server that says `user.email` where the form says `email`. */
  rename?: Record<string, string>;
  /** Keys that mean the whole form. Default `form`, `_form`, `non_field_errors`, `__all__`, `""`. */
  formKeys?: readonly string[];
}

const FORM_KEYS = ['form', '_form', 'non_field_errors', '__all__', ''];

function firstMessage(value: unknown): string | undefined {
  if (hasMessage(value)) return value;
  if (Array.isArray(value)) return value.map(firstMessage).find(hasMessage);
  if (value && typeof value === 'object' && 'message' in value) return firstMessage((value as { message: unknown }).message);
  return undefined;
}

/**
 * Reads server errors in the common shapes:
 *
 * - a record of name to a message or a list of messages:
 *   `{ email: 'Taken' }`, `{ email: ['Taken'] }`;
 * - a list of entries with `field`, `name` or `path` and `message`:
 *   `[{ field: 'email', message: 'Taken' }]`, where `path` may be a list
 *   (`['user', 'email']` reads as `user.email`);
 * - either of those under an `errors` key.
 *
 * One message per field: the first. Unknown names and form keys go to
 * `form`, so no message is lost.
 */
export function mapServerErrors(input: unknown, options: MapServerErrorsOptions = {}): MappedServerErrors {
  const { names, rename = {}, formKeys = FORM_KEYS } = options;
  const out: MappedServerErrors = { fields: {}, form: [] };
  const add = (rawName: string, message: string | undefined) => {
    if (!hasMessage(message)) return;
    const name = rename[rawName] ?? rawName;
    if (formKeys.includes(name) || (names && !names.includes(name))) {
      if (!out.form.includes(message)) out.form.push(message);
      return;
    }
    if (out.fields[name] === undefined) out.fields[name] = message;
  };

  let source = input;
  if (source && typeof source === 'object' && !Array.isArray(source) && 'errors' in source) source = (source as { errors: unknown }).errors;

  if (hasMessage(source)) {
    add('', source);
  } else if (Array.isArray(source)) {
    for (const entry of source) {
      if (hasMessage(entry)) {
        add('', entry);
        continue;
      }
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as { field?: unknown; name?: unknown; path?: unknown; message?: unknown };
      const key = e.field ?? e.name ?? e.path;
      const name = Array.isArray(key) ? key.join('.') : typeof key === 'string' ? key : '';
      add(name, firstMessage(e.message));
    }
  } else if (source && typeof source === 'object') {
    for (const [name, value] of Object.entries(source)) add(name, firstMessage(value));
  }
  return out;
}
