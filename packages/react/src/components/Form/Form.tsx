'use client';
// Form: a native <form> that checks on submit, shows an error summary with
// links to the fields, moves focus to the first invalid field and announces
// the result once.
//
// Sources: Figma-Killer-2 `FormField/` (the stacked field rhythm). GoBanana
// `TakedownForm.tsx` could not be read in the lane 4A session, so the flow
// follows WCAG 3.3.1, 3.3.3 and 4.1.3 and the FormWizard step check in this
// repo.
//
// Decisions:
// - Hand built on the native form (decision 6 in docs/plan/wave-1.md, Radix
//   Form is not used). noValidate: the browser bubble never shows, but the
//   constraint attributes (type, pattern, min, maxLength) still feed the
//   check through checkValidity().
// - Field marks a required control with aria-required, not the native
//   required attribute, so an empty control with either one counts as
//   missing.
// - Validate on submit. After a submit, a change that fixes a field removes
//   its error at once; a change never adds an error.
// - The summary is not a live region. A visually hidden status says "Fix 2
//   fields to send the form" once per submit, and focus moves to the first
//   invalid field, which reads its label and its error.
// - Server errors: onSubmit may return them in any shape mapServerErrors
//   reads. Field names go to the fields, the rest to the summary.
// - Values are never cleared on an error, and autocomplete is never touched
//   (WCAG 3.3.7, 3.3.8).
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { VisuallyHidden } from 'radix-ui';
import {
  collectErrors,
  hasErrors,
  firstInvalid,
  mapServerErrors,
  orderErrors,
  type FormErrors,
  type FormValidators,
  type FormValues,
  type Size,
} from '@the-system/shared';
import { useTheme } from '../../theme';
import { Alert } from '../Alert/Alert';
import { Button, type ButtonProps } from '../Button';
import { Field, type FieldOrientation, type FieldProps } from '../Field/Field';
import { Link } from '../Link/Link';

export type FormSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type FormState = 'idle' | 'submitting' | 'submitted';
export type FormOrientation = FieldOrientation;

export interface FormLabels {
  /** The summary title and the announcement, from the number of fields with an error. */
  summary: (count: number) => string;
  /** The summary title when only messages about the whole form came back. */
  notSent: string;
  /** The message when onSubmit throws. */
  failed: string;
  /** The error of an empty required field. */
  required: string;
  /** The error of a required checkbox or switch left off. */
  requiredChoice: string;
  /** The error of a required radio group with nothing picked. */
  requiredOption: string;
  /** A value that does not fit the input type, from the type: email or url. */
  typeMismatch: (type: string) => string;
  /**
   * A value that does not match the pattern. The pattern itself cannot be
   * read out, so give the field a validator that names the format:
   * "Enter the 5 digit postal code."
   */
  patternMismatch: string;
  /** Fewer characters than minLength. */
  tooShort: (min: number) => string;
  /** More characters than maxLength. */
  tooLong: (max: number) => string;
  /** A value under min. */
  rangeUnderflow: (min: string) => string;
  /** A value over max. */
  rangeOverflow: (max: string) => string;
  /** A value off the step. */
  stepMismatch: (step: string) => string;
  /** A value the browser cannot read for the type, from the type: number or date. */
  badInput: (type: string) => string;
  /** The error of a field the browser finds invalid for any other reason. */
  invalid: string;
  /** Announced after a submit that passes. An empty string announces nothing. */
  submitted: string;
}

const labelsByLang: Record<'en' | 'ar', FormLabels> = {
  en: {
    summary: (n) => (n === 1 ? 'Fix 1 field to send the form' : `Fix ${n} fields to send the form`),
    notSent: 'The form was not sent',
    failed: 'Could not send the form. Check your connection and send it again.',
    required: 'Fill in this field.',
    requiredChoice: 'Tick this box to go on.',
    requiredOption: 'Pick one option to go on.',
    typeMismatch: (type) => {
      if (type === 'email') return 'Enter an email address, like name@example.com.';
      if (type === 'url') return 'Enter a web address that starts with https://.';
      return 'Check the value in this field.';
    },
    patternMismatch: 'Check the format of the value in this field.',
    tooShort: (min) => `Use at least ${min} characters.`,
    tooLong: (max) => `Use ${max} characters or fewer.`,
    rangeUnderflow: (min) => `Enter ${min} or more.`,
    rangeOverflow: (max) => `Enter ${max} or less.`,
    stepMismatch: (step) => `Enter a value in steps of ${step}.`,
    badInput: (type) => (type === 'number' ? 'Enter a number, using digits only.' : 'Enter a full date.'),
    invalid: 'Check the value in this field.',
    submitted: 'The form was sent.',
  },
  ar: {
    summary: (n) => {
      if (n === 1) return 'حقل واحد يحتاج تصحيح قبل الإرسال';
      if (n === 2) return 'حقلين يحتاجون تصحيح قبل الإرسال';
      if (n <= 10) return `${n} حقول تحتاج تصحيح قبل الإرسال`;
      return `${n} حقل يحتاج تصحيح قبل الإرسال`;
    },
    notSent: 'ما تم إرسال النموذج',
    failed: 'ما قدرنا نرسل النموذج. تأكد من الاتصال وأرسله مرة ثانية.',
    required: 'الحقل هذا مطلوب، عبه قبل الإرسال.',
    requiredChoice: 'حدد المربع هذا عشان تكمل.',
    requiredOption: 'اختر خيار واحد عشان تكمل.',
    typeMismatch: (type) => {
      if (type === 'email') return 'اكتب بريد إلكتروني صحيح، مثل name@example.com.';
      if (type === 'url') return 'اكتب رابط يبدأ بـ https://.';
      return 'راجع القيمة في الحقل هذا.';
    },
    patternMismatch: 'راجع صيغة القيمة في الحقل هذا.',
    tooShort: (min) => `اكتب ${min} حرف على الأقل.`,
    tooLong: (max) => `اكتب ${max} حرف أو أقل.`,
    rangeUnderflow: (min) => `اكتب ${min} أو أكثر.`,
    rangeOverflow: (max) => `اكتب ${max} أو أقل.`,
    stepMismatch: (step) => `اكتب قيمة من مضاعفات ${step}.`,
    badInput: (type) => (type === 'number' ? 'اكتب رقم بالأرقام فقط.' : 'اكتب التاريخ كامل.'),
    invalid: 'راجع القيمة في الحقل هذا.',
    submitted: 'تم إرسال النموذج.',
  },
};

/** The default labels for a language. */
export function formLabels(lang: string | undefined): FormLabels {
  return lang === 'ar' ? labelsByLang.ar : labelsByLang.en;
}

export interface FormContextValue {
  size: FormSize;
  orientation: FormOrientation;
  state: FormState;
  /** Field errors shown now, by name. */
  errors: FormErrors;
  /**
   * Sets the message the Form gives a required control of this name left
   * empty, in the field and in the summary. Returns a cleanup. Used by
   * ConsentField `requiredError`.
   */
  setRequiredMessage: (name: string, message: string) => () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

/** The nearest Form: size, orientation, state and the shown errors. Null outside a Form. */
export function useFormContext(): FormContextValue | null {
  return use(FormContext);
}

/** The error the nearest Form shows for a field name, if any. */
export function useFormFieldError(name: string | undefined): string | undefined {
  const form = use(FormContext);
  return name === undefined ? undefined : form?.errors[name];
}

/**
 * Gives the nearest Form the message for a required control of this name
 * left empty, so the field and the summary say the same. Does nothing
 * outside a Form or without a name or a message.
 */
export function useFormRequiredMessage(name: string | undefined, message: string | undefined): void {
  const form = use(FormContext);
  const register = form?.setRequiredMessage;
  useEffect(() => {
    if (!register || name === undefined || !message) return;
    return register(name, message);
  }, [register, name, message]);
}

/** What onSubmit may return: nothing, or server errors in a shape mapServerErrors reads. */
export type FormSubmitResult = void | undefined | null | unknown;

export interface FormProps extends Omit<ComponentProps<'form'>, 'title' | 'onSubmit' | 'onInvalid' | 'noValidate' | 'ref' | 'action'> {
  /** Spacing between the fields, and the size Form tells its fields through context. Default md. */
  size?: FormSize;
  /** The default orientation of every FormField. Default vertical. */
  orientation?: FormOrientation;
  /** Custom checks by field name, run after the browser's constraint check. */
  validators?: FormValidators;
  /**
   * Called with the values when every check passes. Return server errors
   * (a record of name to message, or a list of entries) to show them; the
   * form stays in `submitting` while a returned promise runs. When it
   * throws, the summary says the form could not be sent. Call a server
   * action from here: the `action` prop is not taken, because the form
   * checks before it sends.
   */
  onSubmit?: (values: FormValues, form: HTMLFormElement) => FormSubmitResult | Promise<FormSubmitResult>;
  /**
   * Errors from outside the form, in any shape mapServerErrors reads: the
   * result of a server action rendered with the page. Shown in the fields
   * and the summary without moving focus, and announced when they change
   * after the first render. A value with new content replaces the shown
   * errors (compared by content, so an inline object is fine); the next
   * submit checks again.
   */
  serverErrors?: unknown;
  /** Called with the errors each time a submit finds some. */
  onErrors?: (errors: FormErrors) => void;
  /** The buttons, in the actions part. A FormSubmit is the usual first one. */
  actions?: ReactNode;
  /** Copy for the summary and the built in errors. Default from the nearest Theme language. */
  labels?: Partial<FormLabels>;
  children?: ReactNode;
  ref?: Ref<HTMLFormElement>;
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function controlsOf(form: HTMLFormElement): Control[] {
  return [...form.elements].filter(
    (el): el is Control =>
      (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) &&
      el.name !== '' &&
      !el.matches(':disabled') &&
      !(el instanceof HTMLInputElement && ['submit', 'reset', 'button', 'image'].includes(el.type)),
  );
}

function isEmpty(c: Control): boolean {
  if (c instanceof HTMLInputElement && (c.type === 'checkbox' || c.type === 'radio')) {
    const group = c.form ? [...c.form.elements].filter((e) => e instanceof HTMLInputElement && e.name === c.name) : [c];
    return !group.some((e) => (e as HTMLInputElement).checked);
  }
  return c.value.trim() === '';
}

/**
 * The element a person sees for a control. A Radix Checkbox or Switch keeps
 * a hidden input for the form next to its button: focus goes to the button.
 */
function visibleTarget(c: Control): HTMLElement {
  if (c.getAttribute('aria-hidden') === 'true') {
    const prev = c.previousElementSibling;
    if (prev instanceof HTMLElement && prev.tabIndex >= 0) return prev;
  }
  return c;
}

/** The visible label text of a control, without aria-hidden marks such as the required asterisk. */
function labelOf(target: HTMLElement): string {
  const label = (target as HTMLInputElement).labels?.[0];
  if (!label) return target.getAttribute('aria-label') ?? '';
  return visibleText(label);
}

function visibleText(el: Element): string {
  const copy = el.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"], [data-part="required"]')) hidden.remove();
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function readValues(form: HTMLFormElement): FormValues {
  const values: FormValues = {};
  for (const [name, value] of new FormData(form)) {
    const prev = values[name];
    if (prev === undefined) values[name] = value;
    else values[name] = Array.isArray(prev) ? [...(prev as unknown[]), value] : [prev, value];
  }
  return values;
}

/** The copy for an empty required control: a box to tick, an option to pick or a field to fill in. */
function requiredMessage(c: Control, labels: FormLabels): string {
  if (c instanceof HTMLInputElement && c.type === 'radio') return labels.requiredOption;
  if (c instanceof HTMLInputElement && c.type === 'checkbox') return labels.requiredChoice;
  // A Radix RadioGroup item keeps its hidden input next to a button with role radio.
  const role = visibleTarget(c).getAttribute('role');
  if (role === 'radio') return labels.requiredOption;
  if (role === 'checkbox' || role === 'switch') return labels.requiredChoice;
  return labels.required;
}

/**
 * The copy for a constraint failure, from the ValidityState flags. Never the
 * browser's validationMessage: it is in the browser's language, not the
 * page's, and does not say how to fix the value.
 */
function constraintMessage(c: Control, labels: FormLabels): string {
  const v = c.validity;
  const type = c instanceof HTMLInputElement ? c.type : '';
  if (v.badInput) return labels.badInput(type);
  if (v.typeMismatch) return labels.typeMismatch(type);
  if (v.patternMismatch) return labels.patternMismatch;
  if (v.tooShort && !(c instanceof HTMLSelectElement)) return labels.tooShort(c.minLength);
  if (v.tooLong && !(c instanceof HTMLSelectElement)) return labels.tooLong(c.maxLength);
  if (v.rangeUnderflow) return labels.rangeUnderflow(c.getAttribute('min') ?? '');
  if (v.rangeOverflow) return labels.rangeOverflow(c.getAttribute('max') ?? '');
  if (v.stepMismatch) return labels.stepMismatch(c.getAttribute('step') ?? '');
  return labels.invalid;
}

interface NativeErrors {
  /** Empty required controls. They win over the custom validators. */
  required: FormErrors;
  /** Constraint failures. A custom validator message for the same name wins: it can name the format. */
  constraint: FormErrors;
}

function nativeErrors(controls: Control[], labels: FormLabels, messages: ReadonlyMap<string, string>): NativeErrors {
  const out: NativeErrors = { required: {}, constraint: {} };
  for (const c of controls) {
    if (out.required[c.name] !== undefined || out.constraint[c.name] !== undefined) continue;
    // Read only and hidden controls are not checked: the person cannot fix them.
    if ((c as HTMLInputElement).readOnly || (c instanceof HTMLInputElement && c.type === 'hidden')) continue;
    const required = c.required || c.getAttribute('aria-required') === 'true' || visibleTarget(c).getAttribute('aria-required') === 'true';
    if (required && isEmpty(c)) out.required[c.name] = messages.get(c.name) ?? requiredMessage(c, labels);
    else if (!required && isEmpty(c)) continue;
    else if (!c.checkValidity()) out.constraint[c.name] = constraintMessage(c, labels);
  }
  return out;
}

/** Required first, then the custom validators, then the constraint copy for what is left. */
function checkAll(values: FormValues, validators: FormValidators | undefined, native: NativeErrors): FormErrors {
  return { ...native.constraint, ...collectErrors(values, validators, native.required) };
}

/**
 * The name a summary link uses for a group of controls that share one name
 * (a checkbox or radio group): the legend of the nearest fieldset, or the
 * name of the nearest group.
 */
function groupLabelOf(target: HTMLElement): string {
  const legend = target.closest('fieldset')?.querySelector(':scope > legend');
  const group = target.closest('[role="group"], [role="radiogroup"]');
  const source = legend ?? (group?.getAttribute('aria-labelledby') ? document.getElementById(group.getAttribute('aria-labelledby') ?? '') : null);
  if (source) return visibleText(source);
  return group?.getAttribute('aria-label') ?? labelOf(target);
}

/**
 * A form that checks on submit, lists the errors in a summary with links to
 * the fields, moves focus to the first invalid field and announces the
 * count once. Put fields in FormField (or any control with a `name`) and a
 * FormSubmit in `actions`.
 */
export function Form({
  size = 'md',
  orientation = 'vertical',
  validators,
  onSubmit,
  onErrors,
  serverErrors,
  actions,
  labels: labelsProp,
  children,
  ref,
  onChange,
  onReset,
  ...rest
}: FormProps) {
  const { lang } = useTheme();
  const labels = useMemo(() => ({ ...formLabels(lang), ...labelsProp }), [lang, labelsProp]);
  const formRef = useRef<HTMLFormElement | null>(null);
  const summaryId = `${useId()}summary`;
  const [state, setState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [targets, setTargets] = useState<Record<string, { id: string; label: string }>>({});
  const [announcement, setAnnouncement] = useState('');
  const submittedOnce = useRef(false);
  const [focusSummary, setFocusSummary] = useState(false);
  const requiredMessages = useRef(new Map<string, string>());
  const setRequiredMessage = useCallback((name: string, message: string) => {
    requiredMessages.current.set(name, message);
    return () => {
      if (requiredMessages.current.get(name) === message) requiredMessages.current.delete(name);
    };
  }, []);

  const announce = useCallback((text: string) => {
    // A trailing no break space alternates, so the same text is announced again on the next submit.
    setAnnouncement((prev) => text + (prev.endsWith('\u00a0') ? '' : '\u00a0'));
  }, []);

  const setRefs = useCallback(
    (node: HTMLFormElement | null) => {
      formRef.current = node;
      const cleanup = typeof ref === 'function' ? ref(node) : undefined;
      if (ref && typeof ref !== 'function') ref.current = node;
      return () => {
        formRef.current = null;
        if (typeof cleanup === 'function') cleanup();
        else if (typeof ref === 'function') ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref],
  );

  const show = useCallback(
    (form: HTMLFormElement, fieldErrors: FormErrors, messages: string[]) => {
      const controls = controlsOf(form);
      const names = [...new Set(controls.map((c) => c.name))];
      setOrder(names);
      setErrors(fieldErrors);
      setFormErrors(messages);
      const count = orderErrors(names, fieldErrors).length;
      announce(count > 0 ? labels.summary(count) : labels.notSent);
      const first = firstInvalid(names, fieldErrors);
      const control = first === undefined ? undefined : controls.find((c) => c.name === first);
      // The summary is not on the page yet: it takes focus after the commit.
      if (control) visibleTarget(control).focus();
      else setFocusSummary(true);
    },
    [labels, announce],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === 'submitting') return;
    const form = event.currentTarget;
    submittedOnce.current = true;
    const values = readValues(form);
    const found = checkAll(values, validators, nativeErrors(controlsOf(form), labels, requiredMessages.current));
    if (hasErrors(found)) {
      setState('idle');
      show(form, found, []);
      onErrors?.(found);
      return;
    }
    setErrors({});
    setFormErrors([]);
    setAnnouncement('');
    if (!onSubmit) {
      setState('submitted');
      if (labels.submitted) announce(labels.submitted);
      return;
    }
    setState('submitting');
    let result: unknown;
    try {
      result = await onSubmit(values, form);
    } catch {
      setState('idle');
      show(form, {}, [labels.failed]);
      return;
    }
    const names = [...new Set(controlsOf(form).map((c) => c.name))];
    const server = result === undefined || result === null ? { fields: {}, form: [] } : mapServerErrors(result, { names });
    if (hasErrors(server.fields) || server.form.length > 0) {
      setState('idle');
      show(form, server.fields, server.form);
      onErrors?.({ ...server.fields });
      return;
    }
    setState('submitted');
    if (labels.submitted) announce(labels.submitted);
  };

  const handleChange = (event: ChangeEvent<HTMLFormElement>) => {
    onChange?.(event);
    if (!submittedOnce.current) return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
    const name = target.name;
    if (!name || errors[name] === undefined) return;
    const form = event.currentTarget;
    const values = readValues(form);
    const sameName = controlsOf(form).filter((c) => c.name === name);
    const still = checkAll(values, validators, nativeErrors(sameName, labels, requiredMessages.current))[name];
    // A fix that passes the client checks removes the error, a server error included; a change never adds one.
    if (still === undefined) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleReset = (event: FormEvent<HTMLFormElement>) => {
    onReset?.(event);
    submittedOnce.current = false;
    setErrors({});
    setFormErrors([]);
    setAnnouncement('');
    setState('idle');
  };

  // Errors from outside: applied when their content changes, during render, so they show on the first paint.
  const mappedServer = serverErrors === undefined || serverErrors === null ? { fields: {}, form: [] } : mapServerErrors(serverErrors);
  const serverKey = JSON.stringify(mappedServer);
  const [seenServer, setSeenServer] = useState<string | null>(null);
  if (serverKey !== seenServer) {
    const first = seenServer === null;
    setSeenServer(serverKey);
    setErrors(mappedServer.fields);
    setFormErrors(mappedServer.form);
    setOrder(Object.keys(mappedServer.fields));
    const n = Object.keys(mappedServer.fields).length;
    if (!first && (n > 0 || mappedServer.form.length > 0)) announce(n > 0 ? labels.summary(n) : labels.notSent);
  }

  useLayoutEffect(() => {
    if (!focusSummary) return;
    setFocusSummary(false);
    formRef.current?.querySelector<HTMLElement>(':scope > [data-part="summary"]')?.focus();
  }, [focusSummary]);

  // The order, ids and labels of the fields with an error, read from the DOM after each change of the errors.
  useLayoutEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const controls = controlsOf(form);
    const next: Record<string, { id: string; label: string }> = {};
    for (const c of controls) {
      if (next[c.name] !== undefined || errors[c.name] === undefined) continue;
      const target = visibleTarget(c);
      // Several boxes or radios with one name are one group: the link names the group, not its first option.
      const grouped = controls.filter((o) => o.name === c.name).length > 1 && c instanceof HTMLInputElement && (c.type === 'checkbox' || c.type === 'radio');
      next[c.name] = { id: target.id, label: grouped ? groupLabelOf(target) : labelOf(target) };
    }
    const names = [...new Set(controls.map((c) => c.name))];
    setTargets((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    setOrder((prev) => (prev.join('\n') === names.join('\n') ? prev : names));
  }, [errors]);

  const listed = orderErrors(order, errors);
  const count = listed.length;
  const invalid = count > 0 || formErrors.length > 0;

  const jump = (name: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    const form = formRef.current;
    const control = form ? controlsOf(form).find((c) => c.name === name) : undefined;
    event.preventDefault();
    if (!control) return;
    const target = visibleTarget(control);
    target.scrollIntoView?.({ block: 'center' });
    target.focus();
  };

  const context = useMemo<FormContextValue>(
    () => ({ size, orientation, state, errors, setRequiredMessage }),
    [size, orientation, state, errors, setRequiredMessage],
  );

  return (
    <FormContext value={context}>
      <form
        {...rest}
        ref={setRefs}
        noValidate
        onSubmit={(e) => void handleSubmit(e)}
        onChange={handleChange}
        onReset={handleReset}
        aria-busy={state === 'submitting' || undefined}
        data-ds="form"
        data-size={size}
        data-orientation={orientation}
        data-state={state}
        data-invalid={invalid ? '' : undefined}
      >
        <VisuallyHidden.Root role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </VisuallyHidden.Root>
        {invalid && (
          <Alert id={summaryId} tabIndex={-1} tone="danger" size={size === 'sm' ? 'sm' : 'md'} title={count > 0 ? labels.summary(count) : labels.notSent} data-part="summary">
            <ul>
              {formErrors.map((message) => (
                <li key={`form:${message}`}>{message}</li>
              ))}
              {listed.map(({ name, message }) => (
                <li key={name}>
                  {targets[name]?.id ? (
                    <Link standalone href={`#${targets[name].id}`} onClick={jump(name)}>
                      {targets[name].label ? `${targets[name].label}: ${message}` : message}
                    </Link>
                  ) : (
                    message
                  )}
                </li>
              ))}
            </ul>
          </Alert>
        )}
        <div data-part="body">{children}</div>
        {actions !== undefined && actions !== null && actions !== false && <div data-part="actions">{actions}</div>}
      </form>
    </FormContext>
  );
}

export interface FormFieldProps extends Omit<FieldProps, 'error'> {
  /** The name of the control inside. The Form shows the error of this name. Put the same name on the control. */
  name: string;
  /** An error of your own, shown when the Form has none for this name. */
  error?: ReactNode;
}

/**
 * A Field bound to a Form by name: it shows the Form's error for that name
 * and takes the Form's orientation. The control inside carries the same
 * `name`.
 */
export function FormField({ name, error, orientation, ...rest }: FormFieldProps) {
  const form = use(FormContext);
  const shown = form?.errors[name] ?? error;
  return <Field {...rest} orientation={orientation ?? form?.orientation} error={shown} data-name={name} />;
}

export interface FormSubmitProps extends Omit<ButtonProps, 'type'> {
  /** Spoken while the form is submitting. Default "Sending", or Arabic under lang ar. */
  loadingLabel?: string;
}

/** The submit Button of the nearest Form: type submit, loading while the form submits. Name the action: Send request, Save address. */
export function FormSubmit({ loadingLabel, emphasis = 'solid', tone = 'accent', ...rest }: FormSubmitProps) {
  const form = use(FormContext);
  const { lang } = useTheme();
  return (
    <Button
      {...rest}
      type="submit"
      emphasis={emphasis}
      tone={tone}
      loading={form?.state === 'submitting' || rest.loading}
      loadingLabel={loadingLabel ?? (lang === 'ar' ? 'جاري الإرسال' : 'Sending')}
    />
  );
}
