// Form: a native form that checks on submit, shows an error summary with
// links to the fields, moves focus to the first invalid field and announces
// the result once. The twin of packages/react/src/components/Form/Form.tsx.
//
//   <form dsForm [validators]="validators" [onSubmit]="send" [actions]="actions">
//     <div dsFormField name="email" label="Work email" required>
//       <div dsInput name="email" type="email"></div>
//     </div>
//     <ng-template #actions><button dsFormSubmit>Send request</button></ng-template>
//   </form>
//
// The host is the form itself: noValidate, data-ds form, and the parts in
// the React order: the hidden status, the summary (the system Alert), the
// body, the actions.
//
// Angular forms. With `[formGroup]` (reactive forms) or NgForm (template
// forms, FormsModule on the form) the same element has a ControlContainer.
// On submit dsForm marks every control touched, reads the errors of its
// enabled controls and maps them to messages (`required` says the form's
// required words; an error whose value is a string, or has a `message`,
// says that text), then merges them with the browser's checks and the
// custom validators through collectErrors in packages/shared/src/form.ts.
// The summary links to each control by its `name`, or by its
// `formControlName` when it has no name. onSubmit gets the FormData values
// merged with the group's raw value.
//
// Names that differ from React:
// - `onSubmit` is a function input, not an output: it returns server
//   errors or a promise the form waits on, and an output cannot. A
//   `submit` output would also clash with the native submit event.
// - `onErrors` is the `errors` output.
// - `actions` takes a TemplateRef. Declare it inside the form, or anywhere:
//   it renders with the form's injector, so a dsFormSubmit in it finds the
//   form.
// - `onChange` and `onReset` are the native change and reset events of the
//   host, which bubble as in the DOM.
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
  type TemplateRef,
} from '@angular/core';
import { ControlContainer } from '@angular/forms';
import {
  collectErrors,
  firstInvalid,
  hasErrors,
  mapServerErrors,
  orderErrors,
  type FormErrors,
  type FormValidators,
  type FormValues,
} from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { VISUALLY_HIDDEN } from '../../internal/visually-hidden';
import { DsThemeService } from '../../theme/theme';
import { DsAlert } from '../alert/alert';
import { DsLink } from '../link/link';
import { angularErrors } from './angular-forms';
import { DsFormContext, type FormOrientation, type FormSize, type FormState } from './form-context';

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
  /** A value that does not match the pattern. Give the field a validator that names the format. */
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
  /** The error of a field the browser finds invalid for any other reason. Never the browser's own message, which is in the browser's language. */
  invalid: string;
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
  },
};

/** The default labels for a language. */
export function formLabels(lang: string | undefined): FormLabels {
  return lang === 'ar' ? labelsByLang.ar : labelsByLang.en;
}

/** What onSubmit may return: nothing, or server errors in a shape mapServerErrors reads. */
export type FormSubmitResult = void | undefined | null | unknown;
export type FormSubmitHandler = (values: FormValues, form: HTMLFormElement) => FormSubmitResult | Promise<FormSubmitResult>;

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

/** A Checkbox or Switch keeps a hidden input for the form next to its button: focus goes to the button. */
function visibleTarget(c: HTMLElement): HTMLElement {
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
  const copy = label.cloneNode(true) as HTMLElement;
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

function nativeErrors(controls: Control[], labels: FormLabels, messages: ReadonlyMap<string, string> = new Map()): FormErrors {
  const out: FormErrors = {};
  for (const c of controls) {
    if (out[c.name] !== undefined) continue;
    // Read only and hidden controls are not checked: the person cannot fix them.
    if ((c as HTMLInputElement).readOnly || (c instanceof HTMLInputElement && c.type === 'hidden')) continue;
    const required = c.required || c.getAttribute('aria-required') === 'true' || visibleTarget(c).getAttribute('aria-required') === 'true';
    if (required && isEmpty(c)) out[c.name] = messages.get(c.name) ?? requiredMessage(c, labels);
    else if (!required && isEmpty(c)) continue;
    else if (!c.checkValidity()) out[c.name] = constraintMessage(c, labels);
  }
  return out;
}

/** The dotted Angular path of a formControlName host: the formGroupName ancestors inside the form, then the name. */
function pathOf(host: Element, form: HTMLFormElement): string {
  const parts = [host.getAttribute('formcontrolname') ?? ''];
  for (let el = host.parentElement; el && el !== form; el = el.parentElement) {
    const group = el.getAttribute('formgroupname') ?? el.getAttribute('formarrayname');
    if (group) parts.unshift(group);
  }
  return parts.join('.');
}

/** The element focus goes to for a formControlName host: its first focusable control, or itself. */
function focusTargetIn(host: HTMLElement): HTMLElement {
  const inner = host.matches('input, select, textarea, button') ? host : host.querySelector<HTMLElement>('input, select, textarea, button, [tabindex]');
  return inner ? visibleTarget(inner) : host;
}

/** Field names in DOM order with the element a person sees for each: named controls, then formControlName hosts without a name. */
function targetsOf(form: HTMLFormElement): { name: string; target: HTMLElement }[] {
  const out: { name: string; target: HTMLElement }[] = [];
  const seen = new Set<string>();
  const named = new Set<Element>(controlsOf(form));
  for (const el of form.querySelectorAll<HTMLElement>('input, select, textarea, [formcontrolname]')) {
    let name: string | undefined;
    let target: HTMLElement | undefined;
    if (named.has(el)) {
      name = (el as Control).name;
      target = visibleTarget(el);
    } else if (el.hasAttribute('formcontrolname')) {
      // A host whose inner control carries a name is listed through that control.
      const inner = el.querySelector('input, select, textarea');
      if (inner && named.has(inner)) continue;
      name = pathOf(el, form);
      target = focusTargetIn(el);
    }
    if (name === undefined || target === undefined || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, target });
  }
  return out;
}

let nextId = 0;

/**
 * A form that checks on submit, lists the errors in a summary with links to
 * the fields, moves focus to the first invalid field and announces the
 * count once.
 */
@Component({
  selector: 'form[dsForm]',
  exportAs: 'dsForm',
  imports: [NgTemplateOutlet, DsAlert, DsLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: DsFormContext, useExisting: forwardRef(() => DsForm) }],
  host: {
    'data-ds': 'form',
    novalidate: '',
    '[attr.aria-busy]': 'state() === "submitting" ? "true" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-state]': 'state()',
    '[attr.data-invalid]': 'invalid() ? "" : null',
    '(submit)': 'handleSubmit($event)',
    '(input)': 'handleChange($event)',
    '(change)': 'handleChange($event)',
    '(click)': 'handleClick($event)',
    '(reset)': 'handleReset()',
  },
  template: `
    <span role="status" aria-live="polite" aria-atomic="true" [attr.style]="visuallyHidden">{{ announcement() }}</span>
    @if (invalid()) {
      <div dsAlert [attr.id]="summaryId" tabindex="-1" tone="danger" [size]="size() === 'sm' ? 'sm' : 'md'" [title]="summaryTitle()" data-part="summary">
        <ul>
          @for (message of formErrors(); track message) {
            <li>{{ message }}</li>
          }
          @for (item of listed(); track item.name) {
            <li>
              @if (targets()[item.name]?.id; as id) {
                <a dsLink standalone [href]="'#' + id" (click)="jump($event, item.name)">{{ linkText(item.name, item.message) }}</a>
              } @else {
                {{ item.message }}
              }
            </li>
          }
        </ul>
      </div>
    }
    <div data-part="body"><ng-content /></div>
    @if (actions(); as a) {
      <div data-part="actions"><ng-container [ngTemplateOutlet]="a" [ngTemplateOutletInjector]="injector" /></div>
    }
  `,
})
export class DsForm extends DsFormContext {
  /** Spacing between the fields, and the size the form tells its fields. Default md. */
  readonly size = input<FormSize>('md');
  /** The default orientation of every FormField. Default vertical. */
  readonly orientation = input<FormOrientation>('vertical');
  /** Custom checks by field name, run after the browser's and the Angular controls' checks. */
  readonly validators = input<FormValidators | undefined>(undefined);
  /**
   * Called with the values when every check passes. Return server errors to
   * show them; the form stays submitting while a returned promise runs. When
   * it throws, the summary says the form could not be sent.
   */
  readonly onSubmit = input<FormSubmitHandler | undefined>(undefined);
  /**
   * Errors from outside the form, in any shape mapServerErrors reads. Shown
   * without moving focus, and announced when they change after the first
   * render. Compared by content.
   */
  readonly serverErrors = input<unknown>(undefined);
  /** The buttons, in the actions part. A dsFormSubmit is the usual first one. */
  readonly actions = input<TemplateRef<unknown> | undefined>(undefined);
  /** Copy for the summary and the built in errors. Default from the nearest theme language. */
  readonly labels = input<Partial<FormLabels> | undefined>(undefined);
  /** Emits the errors each time a submit finds some. React's onErrors. */
  readonly errorsFound = output<FormErrors>({ alias: 'errors' });

  private readonly theme = inject(DsThemeService);
  private readonly host = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement;
  /** NgForm or FormGroupDirective on the same form, when the app uses @angular/forms. */
  private readonly container = inject(ControlContainer, { self: true, optional: true });
  protected readonly injector = inject(Injector);
  protected readonly visuallyHidden = VISUALLY_HIDDEN;
  protected readonly summaryId = `ds-form-${++nextId}-summary`;

  private readonly words = computed<FormLabels>(() => ({ ...formLabels(this.theme.value().lang), ...this.labels() }));
  private readonly stateSignal = signal<FormState>('idle');
  readonly state = this.stateSignal.asReadonly();
  private readonly errorsSignal = signal<FormErrors>({});
  readonly errors = this.errorsSignal.asReadonly();
  protected readonly formErrors = signal<string[]>([]);
  private readonly order = signal<string[]>([]);
  protected readonly targets = signal<Record<string, { id: string; label: string }>>({});
  protected readonly announcement = signal('');
  private submittedOnce = false;
  /** Set on destroy, so work after an await does not touch a destroyed view. */
  private destroyed = false;
  private seenServer: string | null = null;
  /** Messages for required controls left empty, by name, from ConsentField requiredError. */
  private readonly requiredMessages = new Map<string, string>();

  protected readonly listed = computed(() => orderErrors(this.order(), this.errors()));
  protected readonly invalid = computed(() => this.listed().length > 0 || this.formErrors().length > 0);
  protected readonly summaryTitle = computed(() => {
    const count = this.listed().length;
    return count > 0 ? this.words().summary(count) : this.words().notSent;
  });

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
    consumeHostAttributes(['dsForm', 'size', 'orientation', 'validators', 'onSubmit', 'serverErrors', 'actions', 'labels']);

    // Errors from outside: applied when their content changes, before the view renders, so they show on the first paint.
    effect(() => {
      const raw = this.serverErrors();
      untracked(() => {
        const mapped = raw === undefined || raw === null ? { fields: {}, form: [] } : mapServerErrors(raw);
        const key = JSON.stringify(mapped);
        if (key === this.seenServer) return;
        const first = this.seenServer === null;
        this.seenServer = key;
        this.errorsSignal.set(mapped.fields);
        this.formErrors.set(mapped.form);
        this.order.set(Object.keys(mapped.fields));
        const n = Object.keys(mapped.fields).length;
        if (!first && (n > 0 || mapped.form.length > 0)) this.announce(n > 0 ? this.words().summary(n) : this.words().notSent);
      });
    });

    // The order, ids and labels of the fields with an error, read from the DOM after each change of the errors.
    afterRenderEffect(() => {
      const errors = this.errors();
      untracked(() => {
        const found = targetsOf(this.host);
        const next: Record<string, { id: string; label: string }> = {};
        for (const { name, target } of found) {
          if (next[name] !== undefined || errors[name] === undefined) continue;
          next[name] = { id: target.id, label: labelOf(target) };
        }
        const names = found.map((f) => f.name);
        if (JSON.stringify(this.targets()) !== JSON.stringify(next)) this.targets.set(next);
        if (this.order().join('\n') !== names.join('\n')) this.order.set(names);
      });
    });
  }

  setRequiredMessage(name: string, message: string): () => void {
    this.requiredMessages.set(name, message);
    return () => {
      if (this.requiredMessages.get(name) === message) this.requiredMessages.delete(name);
    };
  }

  protected linkText(name: string, message: string): string {
    const label = this.targets()[name]?.label;
    return label ? `${label}: ${message}` : message;
  }

  private announce(text: string): void {
    // A trailing no break space alternates, so the same text is announced again on the next submit.
    this.announcement.update((prev) => text + (prev.endsWith(' ') ? '' : ' '));
  }

  /** The browser's checks merged with the Angular controls' errors. The browser's message wins for a name both report. */
  private builtInErrors(controls: Control[]): FormErrors {
    const words = this.words();
    const out: FormErrors = {
      ...angularErrors(this.container?.control, words),
      ...nativeErrors(controls, words, this.requiredMessages),
    };
    // A control's own required message (ConsentField requiredError) wins over the form's words for it.
    for (const [name, message] of this.requiredMessages) {
      if (out[name] === words.required || out[name] === words.requiredChoice) out[name] = message;
    }
    return out;
  }

  private values(): FormValues {
    const fromDom = readValues(this.host);
    const group = this.container?.control;
    if (!group) return fromDom;
    // value, not getRawValue: disabled controls are left out, as the browser leaves them out of FormData.
    const raw: unknown = group.value;
    return raw && typeof raw === 'object' ? { ...fromDom, ...(raw as FormValues) } : fromDom;
  }

  private show(fieldErrors: FormErrors, messages: string[]): void {
    const found = targetsOf(this.host);
    const names = found.map((f) => f.name);
    this.order.set(names);
    this.errorsSignal.set(fieldErrors);
    this.formErrors.set(messages);
    const count = orderErrors(names, fieldErrors).length;
    this.announce(count > 0 ? this.words().summary(count) : this.words().notSent);
    const first = firstInvalid(names, fieldErrors);
    const target = first === undefined ? undefined : found.find((f) => f.name === first)?.target;
    if (target) target.focus();
    // The summary is not on the page yet: it takes focus after the render.
    else afterNextRender(() => this.host.querySelector<HTMLElement>(':scope > [data-part="summary"]')?.focus(), { injector: this.injector });
  }

  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.state() === 'submitting') return;
    this.submittedOnce = true;
    this.container?.control?.markAllAsTouched();
    const values = this.values();
    const found = collectErrors(values, this.validators(), this.builtInErrors(controlsOf(this.host)));
    if (hasErrors(found)) {
      this.stateSignal.set('idle');
      this.show(found, []);
      this.errorsFound.emit(found);
      return;
    }
    this.errorsSignal.set({});
    this.formErrors.set([]);
    this.announcement.set('');
    const submit = this.onSubmit();
    if (!submit) {
      this.stateSignal.set('submitted');
      return;
    }
    this.stateSignal.set('submitting');
    let result: unknown;
    try {
      result = await submit(values, this.host);
    } catch {
      if (this.destroyed) return;
      this.stateSignal.set('idle');
      this.show({}, [this.words().failed]);
      return;
    }
    if (this.destroyed) return;
    const names = targetsOf(this.host).map((f) => f.name);
    const server = result === undefined || result === null ? { fields: {}, form: [] } : mapServerErrors(result, { names });
    if (hasErrors(server.fields) || server.form.length > 0) {
      this.stateSignal.set('idle');
      this.show(server.fields, server.form);
      this.errorsFound.emit({ ...server.fields });
      return;
    }
    this.stateSignal.set('submitted');
  }

  /** The field name of an event target: its name, or the path of its formControlName host. */
  private nameOf(target: EventTarget | null): string | undefined {
    if (!(target instanceof HTMLElement)) return undefined;
    if ((target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) && target.name) {
      return target.name;
    }
    const host = target.closest('[formcontrolname]');
    return host && this.host.contains(host) ? pathOf(host, this.host) : undefined;
  }

  /** After a submit, a change that fixes a field removes its error at once, a server error included. A change never adds one. */
  protected handleChange(event: Event): void {
    if (!this.submittedOnce) return;
    const name = this.nameOf(event.target);
    if (!name || this.errors()[name] === undefined) return;
    const sameName = controlsOf(this.host).filter((c) => c.name === name);
    const words = this.words();
    const base: FormErrors = nativeErrors(sameName, words, this.requiredMessages);
    const fromAngular = angularErrors(this.container?.control, words)[name];
    if (base[name] === undefined && fromAngular !== undefined) base[name] = fromAngular;
    const still = collectErrors(this.values(), this.validators(), base)[name];
    if (still === undefined) {
      this.errorsSignal.update((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  /** A Checkbox or Switch tells the form of a change with a click on its hidden input, as React's change event reads it. */
  protected handleClick(event: Event): void {
    const t = event.target;
    if (t instanceof HTMLInputElement && (t.type === 'checkbox' || t.type === 'radio')) this.handleChange(event);
  }

  protected handleReset(): void {
    this.submittedOnce = false;
    this.errorsSignal.set({});
    this.formErrors.set([]);
    this.announcement.set('');
    this.stateSignal.set('idle');
  }

  protected jump(event: MouseEvent, name: string): void {
    event.preventDefault();
    const target = targetsOf(this.host).find((f) => f.name === name)?.target;
    if (!target) return;
    target.scrollIntoView?.({ block: 'center' });
    target.focus();
  }
}
