'use client';
// FormWizard: a long form split into steps, with a Stepper, back and next,
// and a review step at the end.
//
// No source: designed from the dials table in PLAN.md 3.7 and the nearest
// components (Stepper for the steps, Field for the errors, Button for the
// actions). The step state is `packages/shared/src/stepper.ts`.
//
// Decisions:
// - One native <form> holds every step. Steps that are not current stay in
//   the DOM with `hidden`, so what the user typed is kept when they go back
//   (WCAG 3.3.7), and the final FormData has every field.
// - The panel part is that <form>, with noValidate: the wizard checks one
//   step at a time, so the browser bubble never shows for a hidden step.
// - Where Form plugs in later: Form (1.4.1, another lane) will render the
//   panel, `<Form data-part="panel">`, and bring the error summary and
//   server errors. The step check then calls `collectErrors` from
//   `packages/shared/src/form.ts` instead of `stepErrors` below. Until then
//   the panel is a plain <form>, and every control in it works with Field.
// - Next is the submit button, so Enter in a single line field moves to the
//   next step. Back is type button.
// - On a step change focus moves to the new step's title, and a polite
//   status says "Step 2 of 4, Address" once (WCAG 4.1.3).
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
  type Ref,
} from 'react';
import {
  back as stepBack,
  createStepperState,
  formatStepPosition,
  goTo as stepGoTo,
  isFirstStep,
  isLastStep,
  setStepComplete,
  type Size,
  type StepperMode,
  type StepperState,
} from '@the-system/shared';
import { Icon } from '@the-system/icons/react';
import { useTheme } from '../../theme';
import { Button } from '../Button';
import { Stepper, type StepperOrientation } from '../Stepper';

export type FormWizardSize = Extract<Size, 'sm' | 'md'>;
export type FormWizardState = 'editing' | 'submitting' | 'done';
/** Every named field of the form: one string (or File) per name, a list when a name repeats. */
export type FormWizardValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>;
/** Field name to the message that says what is wrong and how to fix it. */
export type FormWizardErrors = Record<string, string>;

export interface FormWizardStepContext {
  /** The values of every step, as they were at the last step change. */
  values: FormWizardValues;
  /** The errors of this step, by field name. Pass each to its Field `error`. */
  errors: FormWizardErrors;
}

export interface FormWizardStep {
  /** A stable key. */
  id: string;
  /** A short noun. Shown in the Stepper and as the heading of the step. */
  title: string;
  /** One line under the title in the Stepper. */
  description?: ReactNode;
  /** The fields of the step. Use the function form to show errors and, on the review step, the values. */
  content: ReactNode | ((context: FormWizardStepContext) => ReactNode);
  /**
   * Checks the step before the wizard moves past it. Gets every value and
   * returns errors by field name; nothing or an empty object means valid.
   * Runs after the browser's constraint validation of the step's controls.
   */
  validate?: (values: FormWizardValues) => FormWizardErrors | void | Promise<FormWizardErrors | void>;
  /** The next button on this step: a verb plus a noun, "Review order". */
  nextLabel?: string;
  /** The back button on this step: a verb plus a noun, "Edit address". */
  backLabel?: string;
}

export interface FormWizardLabels {
  next: string;
  back: string;
  submit: string;
  /** The error of an empty required field. */
  required: string;
  /** The heading after a successful submit. */
  done: string;
  /** Shown and said when onSubmit rejects. */
  submitError: string;
  /** The hidden status of the next button while a step is checked. */
  checking: string;
  /** The hidden status of the submit button while the form is sent. */
  sending: string;
  /** The word between the position and the title in the status: "Step 2 of 4, Address". */
  separator: string;
}

const defaultLabels: Record<'en' | 'ar', FormWizardLabels> = {
  en: {
    next: 'Go to next step',
    back: 'Go to previous step',
    submit: 'Send form',
    required: 'Fill in this field',
    done: 'Form sent',
    submitError: 'The form was not sent. Check your connection and send it again.',
    checking: 'Checking',
    sending: 'Sending',
    separator: ', ',
  },
  ar: {
    next: 'الانتقال للخطوة التالية',
    back: 'الرجوع للخطوة السابقة',
    submit: 'إرسال النموذج',
    required: 'هذا الحقل مطلوب',
    done: 'تم الإرسال',
    submitError: 'ما انرسل النموذج. تأكد من الاتصال وأرسله مرة ثانية.',
    checking: 'جار التحقق',
    sending: 'جار الإرسال',
    separator: '، ',
  },
};

export interface FormWizardProps extends Omit<ComponentProps<'div'>, 'title' | 'onSubmit' | 'ref'> {
  steps: readonly FormWizardStep[];
  /** The first step. Default 0. */
  defaultStep?: number;
  /** linear: a later step opens only when the ones before it are valid. free: any step. Default linear. */
  mode?: StepperMode;
  /** Called with the full values when the last step is sent. A promise keeps the wizard submitting until it settles. */
  onSubmit?: (values: FormWizardValues, form: HTMLFormElement) => void | Promise<void>;
  /** Called after every step change. */
  onStepChange?: (index: number) => void;
  /** The label of the submit button on the last step: "Place order". */
  submitLabel?: string;
  /** Shown in the panel after a successful submit, under the done heading. */
  done?: ReactNode;
  /** The heading after a successful submit. */
  doneTitle?: string;
  /** The Stepper layout. Default horizontal; vertical puts the steps at the start side. */
  orientation?: StepperOrientation;
  /** The Stepper and the action buttons. Default md. */
  size?: FormWizardSize;
  /** The name of the steps list, read with the Stepper. */
  stepsLabel?: string;
  /** Default words of the buttons and the status. Defaults follow the Theme language. */
  labels?: Partial<FormWizardLabels>;
  /**
   * Errors to show before the user checks a step, by step index then field
   * name: errors a server sent back, or a saved draft. A step's own check
   * replaces its entry.
   */
  defaultErrors?: Record<number, FormWizardErrors>;
  /** Props of the panel <form>: name, action, autoComplete and so on. */
  formProps?: Omit<ComponentProps<'form'>, 'onSubmit' | 'children' | 'ref'>;
  /** Goes to the panel <form>. */
  formRef?: Ref<HTMLFormElement>;
  ref?: Ref<HTMLDivElement>;
}

/** Reads every named field of the form. */
export function readFormValues(form: HTMLFormElement): FormWizardValues {
  const out: FormWizardValues = {};
  for (const [name, value] of new FormData(form).entries()) {
    const prev = out[name];
    if (prev === undefined) out[name] = value;
    else out[name] = Array.isArray(prev) ? [...prev, value] : [prev, value];
  }
  return out;
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function controlsIn(el: Element | null | undefined): Control[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll<Control>('input, select, textarea')).filter((c) => c.willValidate);
}

/**
 * The built in check of one step's controls, by field name: an empty
 * control marked aria-required (Field required sets that, not the native
 * attribute) gets the `required` words, then the browser's constraint
 * validation (type, pattern, min, max) gives its own message.
 */
function stepErrors(body: Element | null | undefined, required: string): FormWizardErrors {
  const out: FormWizardErrors = {};
  for (const c of controlsIn(body)) {
    if (!c.name || out[c.name] !== undefined) continue;
    const empty = c instanceof HTMLInputElement && (c.type === 'checkbox' || c.type === 'radio') ? !c.checked : c.value.trim() === '';
    if (empty && (c.required || c.getAttribute('aria-required') === 'true')) out[c.name] = required;
    else if (!c.checkValidity()) out[c.name] = c.validationMessage;
  }
  return out;
}

/** A long form in steps: a Stepper, one panel per step, back and next, and a submit on the last step. */
export function FormWizard({
  steps,
  defaultStep = 0,
  mode = 'linear',
  onSubmit,
  onStepChange,
  submitLabel,
  done,
  doneTitle,
  orientation = 'horizontal',
  size = 'md',
  stepsLabel,
  labels: labelsProp,
  defaultErrors,
  formProps,
  formRef,
  ref,
  ...rest
}: FormWizardProps) {
  const { lang } = useTheme();
  const ar = lang === 'ar';
  const labels = { ...defaultLabels[ar ? 'ar' : 'en'], ...labelsProp };
  const id = useId();
  const form = useRef<HTMLFormElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  // Where focus goes after the next commit: the title, or the first field with an error.
  // Focusing after the commit means the error is already linked through aria-describedby.
  const pendingFocus = useRef<{ kind: 'title' } | { kind: 'field'; index: number; names: string[] } | null>(null);
  // True while a check or a submit runs. A ref, so a second Enter in the same tick sees it.
  const busy = useRef(false);
  // Bumped by every move, so a check that resolves after the user moved away is dropped.
  const run = useRef(0);

  // mode and the number of steps are read once, at mount.
  const [stepper, setStepper] = useState<StepperState>(() =>
    // Steps before the first one read as complete; submit checks every step again.
    createStepperState({
      count: steps.length,
      current: defaultStep,
      completed: Array.from({ length: Math.max(0, defaultStep) }, (_, i) => i),
      mode,
    }),
  );
  const [errors, setErrors] = useState<Record<number, FormWizardErrors>>(() => defaultErrors ?? {});
  const [values, setValues] = useState<FormWizardValues>({});
  const [state, setState] = useState<FormWizardState>('editing');
  const [checking, setChecking] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [announce, setAnnounce] = useState('');

  const current = stepper.current;
  const step = steps[current];
  const last = isLastStep(stepper);

  const bodyOf = (index: number) => form.current?.querySelector(`[data-part='body'][data-step='${index}']`);

  // The values the fields start with, so a review step shown first has them.
  useLayoutEffect(() => {
    if (form.current) setValues(readFormValues(form.current));
  }, []);

  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target.kind === 'title') {
      titleRef.current?.focus();
      return;
    }
    const field = controlsIn(bodyOf(target.index)).find((c) => target.names.includes(c.name));
    (field ?? titleRef.current)?.focus();
  });

  const setForm = useCallback(
    (el: HTMLFormElement | null) => {
      form.current = el;
      if (typeof formRef === 'function') formRef(el);
      else if (formRef) formRef.current = el;
    },
    [formRef],
  );

  /** Checks one step and shows its errors. Returns the errors, empty when the step is valid. */
  const check = async (index: number, all: FormWizardValues): Promise<FormWizardErrors> => {
    const found = { ...stepErrors(bodyOf(index), labels.required), ...((await steps[index]?.validate?.(all)) ?? {}) };
    setErrors((e) => ({ ...e, [index]: found }));
    return found;
  };

  const isValid = (found: FormWizardErrors) => Object.keys(found).length === 0;

  const moveTo = (nextState: StepperState) => {
    run.current += 1;
    setSubmitFailed(false);
    if (nextState.current === stepper.current) {
      setStepper(nextState);
      return;
    }
    pendingFocus.current = { kind: 'title' };
    setStepper(nextState);
    const title = steps[nextState.current]?.title ?? '';
    setAnnounce(`${formatStepPosition(nextState.current, nextState.count, ar ? 'ar' : 'en')}${labels.separator}${title}`);
    onStepChange?.(nextState.current);
  };

  /** Runs one async task at a time. A call while another runs does nothing. */
  const exclusive = async (task: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await task();
    } finally {
      busy.current = false;
      setChecking(false);
    }
  };

  /**
   * Back: moves at once. Forward: checks the current step first; when it
   * fails, the step stays, is marked not complete, and focus moves to the
   * first field to fix.
   */
  const go = (index: number) =>
    exclusive(async () => {
      if (!form.current || state !== 'editing') return;
      const all = readFormValues(form.current);
      setValues(all);
      if (index < current) {
        moveTo(stepGoTo(stepper, index));
        return;
      }
      const token = run.current;
      setChecking(true);
      const found = await check(current, all);
      if (token !== run.current) return;
      if (!isValid(found)) {
        setStepper((s) => setStepComplete(s, current, false));
        pendingFocus.current = { kind: 'field', index: current, names: Object.keys(found) };
        return;
      }
      moveTo(stepGoTo(setStepComplete(stepper, current, true), index));
    });

  const submit = () =>
    exclusive(async () => {
      const el = form.current;
      if (!el || state !== 'editing') return;
      const all = readFormValues(el);
      setValues(all);
      setSubmitFailed(false);
      setChecking(true);
      // Every step again, so a step reached in free mode or changed later cannot slip through.
      let firstBad: { index: number; found: FormWizardErrors } | undefined;
      let next = stepper;
      for (let i = 0; i < steps.length; i += 1) {
        const found = await check(i, all);
        next = setStepComplete(next, i, isValid(found));
        if (!isValid(found) && firstBad === undefined) firstBad = { index: i, found };
      }
      setChecking(false);
      if (firstBad !== undefined) {
        if (firstBad.index === current) {
          setStepper(next);
          pendingFocus.current = { kind: 'field', index: current, names: Object.keys(firstBad.found) };
        } else {
          moveTo({ ...next, current: firstBad.index });
        }
        return;
      }
      setStepper(next);
      setState('submitting');
      try {
        await onSubmit?.(all, el);
        pendingFocus.current = { kind: 'title' };
        setState('done');
        setAnnounce(doneTitle ?? labels.done);
      } catch {
        // Back to editing, with a message in the panel that the status says once (WCAG 3.3.1, 4.1.3).
        setState('editing');
        setSubmitFailed(true);
        setAnnounce(labels.submitError);
      }
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state !== 'editing' || busy.current) return;
    void (last ? submit() : go(current + 1));
  };

  const titleId = `${id}title`;
  const errorId = `${id}error`;
  const stepperSteps = steps.map((s, i) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    invalid: Object.keys(errors[i] ?? {}).length > 0,
  }));
  const idle = state === 'editing' && !checking;

  return (
    <div {...rest} ref={ref} data-ds="form-wizard" data-size={size} data-state={state}>
      <Stepper
        data-part="steps"
        steps={stepperSteps}
        current={current}
        completed={stepper.completed}
        mode={mode}
        size={size}
        orientation={orientation}
        {...(stepsLabel === undefined ? {} : { 'aria-label': stepsLabel })}
        onStepSelect={idle ? (i) => void go(i) : undefined}
      />
      <form
        {...formProps}
        ref={setForm}
        data-part="panel"
        noValidate
        aria-labelledby={titleId}
        aria-describedby={submitFailed ? errorId : undefined}
        aria-busy={state === 'submitting' || checking ? true : undefined}
        onSubmit={handleSubmit}
      >
        <h2 ref={titleRef} id={titleId} data-part="title" tabIndex={-1}>
          {state === 'done' ? (doneTitle ?? labels.done) : step?.title}
        </h2>
        {steps.map((s, i) => (
          <div key={s.id} data-part="body" data-step={i} hidden={state === 'done' || i !== current}>
            {typeof s.content === 'function' ? s.content({ values, errors: errors[i] ?? {} }) : s.content}
          </div>
        ))}
        {state === 'done' && done !== undefined && <div data-part="body">{done}</div>}
        {submitFailed && state === 'editing' && (
          <p id={errorId} data-part="error">
            <Icon name="danger" size="md" />
            <span>{labels.submitError}</span>
          </p>
        )}
        {state !== 'done' && (
          <div data-part="actions">
            {!isFirstStep(stepper) && (
              <Button
                data-part="back"
                size={size}
                emphasis="ghost"
                start="chevron-back"
                disabled={!idle}
                onClick={() => {
                  if (!form.current || !idle) return;
                  setValues(readFormValues(form.current));
                  moveTo(stepBack(stepper));
                }}
              >
                {step?.backLabel ?? labels.back}
              </Button>
            )}
            <Button
              data-part={last ? 'submit' : 'next'}
              type="submit"
              size={size}
              tone="accent"
              emphasis="solid"
              loading={state === 'submitting' || checking}
              loadingLabel={state === 'submitting' ? labels.sending : labels.checking}
            >
              {last ? (submitLabel ?? step?.nextLabel ?? labels.submit) : (step?.nextLabel ?? labels.next)}
            </Button>
          </div>
        )}
      </form>
      <div data-part="status" role="status">
        {announce}
      </div>
    </div>
  );
}
