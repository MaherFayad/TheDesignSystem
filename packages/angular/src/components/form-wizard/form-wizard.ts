// FormWizard: a long form split into steps, with a Stepper, back and next,
// and a review step at the end. The twin of
// packages/react/src/components/FormWizard/FormWizard.tsx.
//
//   <div dsFormWizard [steps]="steps" stepsLabel="Checkout steps" submitLabel="Place order" [onSubmit]="place"></div>
//
//   steps = [{ id: 'account', title: 'Account', content: accountTemplate, validate: (values) => ... }]
//   <ng-template #accountTemplate let-errors="errors">
//     <div dsField label="Email" required [error]="errors.email"><div dsInput name="email" type="email"></div></div>
//   </ng-template>
//
// One native form holds every step. Steps that are not current stay in the
// DOM with `hidden`, so what the user typed is kept when they go back
// (WCAG 3.3.7). Next is the submit button, so Enter in a single line field
// moves on. On a step change focus moves to the new step's title, and the
// status says "Step 2 of 4, Address" once (WCAG 4.1.3). The state logic is
// packages/shared/src/stepper.ts.
//
// Names that differ from React:
// - A step's `content` is a TemplateRef. Its context has `values` and
//   `errors` (also as `$implicit`), as React's function form gets them.
// - `onSubmit` is a function input: it returns a promise the wizard waits
//   on, and a `submit` output would clash with the native event.
// - `onStepChange` is the `stepChange` output.
// - `formProps` is a record of attributes set on the panel form (name,
//   action, autocomplete). `formRef` has no input: read `formElement` through
//   `exportAs: 'dsFormWizard'`.
// - `done` takes a string or a TemplateRef.
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
  inject,
  input,
  output,
  signal,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
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
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsStepper, type StepperOrientation, type StepperStep } from '../stepper/stepper';

export type FormWizardSize = Extract<Size, 'sm' | 'md'>;
export type FormWizardState = 'editing' | 'submitting' | 'done';
/** Every named field of the form: one string (or File) per name, a list when a name repeats. */
export type FormWizardValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>;
/** Field name to the message that says what is wrong and how to fix it. */
export type FormWizardErrors = Record<string, string>;

export interface FormWizardStepContext {
  /** The values of every step, as they were at the last step change. */
  values: FormWizardValues;
  /** The errors of this step, by field name. Pass each to its Field error. */
  errors: FormWizardErrors;
}

/** What a step's template gets: the context as $implicit, and its two fields by name. */
export interface FormWizardTemplateContext extends FormWizardStepContext {
  $implicit: FormWizardStepContext;
}

export interface FormWizardStep {
  /** A stable key. */
  id: string;
  /** A short noun. Shown in the Stepper and as the heading of the step. */
  title: string;
  /** One line under the title in the Stepper. */
  description?: string | TemplateRef<unknown>;
  /** The fields of the step. */
  content: TemplateRef<FormWizardTemplateContext>;
  /** Checks the step before the wizard moves past it. Returns errors by field name; nothing or an empty object means valid. */
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
  /** The words between the position and the title in the status: "Step 2 of 4, Address". */
  separator: string;
}

export const formWizardLabels: Record<'en' | 'ar', FormWizardLabels> = {
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

/** The built in check of one step's controls: aria-required empty controls, then the browser's constraint validation. */
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

/** Attributes the panel sets itself: formProps never overrides them, as React's own props win over the spread. */
const RESERVED = new Set(['data-part', 'novalidate', 'aria-labelledby', 'aria-describedby', 'aria-busy']);

/** A React prop name to its attribute: acceptCharset to accept-charset, className to class, the rest lowercased. */
function attributeName(key: string): string {
  if (key === 'className') return 'class';
  if (key === 'htmlFor') return 'for';
  if (key === 'acceptCharset') return 'accept-charset';
  return key.startsWith('aria-') || key.startsWith('data-') ? key : key.toLowerCase();
}

type PendingFocus = { kind: 'title' } | { kind: 'field'; index: number; names: string[] };

let nextId = 0;

@Component({
  selector: 'div[dsFormWizard]',
  exportAs: 'dsFormWizard',
  imports: [NgTemplateOutlet, DsIcon, DsButton, DsStepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'form-wizard',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'state()',
  },
  template: `
    <ol dsStepper data-part="steps" [steps]="stepperSteps()" [current]="stepper().current" [completed]="stepper().completed" [mode]="mode()"
      [size]="size()" [orientation]="orientation()" [aria-label]="stepsLabel()" [onStepSelect]="idle() ? pick : undefined"></ol>
    <form #form data-part="panel" novalidate [attr.aria-labelledby]="titleId" [attr.aria-describedby]="submitFailed() ? errorId : null"
      [attr.aria-busy]="state() === 'submitting' || checking() ? 'true' : null" (submit)="handleSubmit($event)">
      <h2 #title [attr.id]="titleId" data-part="title" tabindex="-1">{{ state() === 'done' ? (doneTitle() ?? words().done) : step()?.title }}</h2>
      @for (s of steps(); track s.id; let i = $index) {
        <div data-part="body" [attr.data-step]="i" [attr.hidden]="state() === 'done' || i !== stepper().current ? '' : null">
          <ng-container *ngTemplateOutlet="s.content; context: contextFor(i)" />
        </div>
      }
      @if (state() === 'done' && done() !== undefined) {
        <div data-part="body">@if (isText(done())) {{{ done() }}} @else {<ng-container [ngTemplateOutlet]="$any(done())" />}</div>
      }
      @if (submitFailed() && state() === 'editing') {
        <p [attr.id]="errorId" data-part="error"><svg dsIcon name="danger" size="md"></svg><span>{{ words().submitError }}</span></p>
      }
      @if (state() !== 'done') {
        <div data-part="actions">
          @if (!first()) {
            <button dsButton data-part="back" [size]="size()" emphasis="ghost" start="chevron-back" [disabled]="!idle()" (click)="goBack()">{{ step()?.backLabel ?? words().back }}</button>
          }
          <button dsButton [attr.data-part]="last() ? 'submit' : 'next'" type="submit" [size]="size()" tone="accent" emphasis="solid"
            [loading]="state() === 'submitting' || checking()" [loadingLabel]="state() === 'submitting' ? words().sending : words().checking">{{ nextText() }}</button>
        </div>
      }
    </form>
    <div data-part="status" role="status">{{ announce() }}</div>
  `,
})
export class DsFormWizard {
  readonly steps = input.required<readonly FormWizardStep[]>();
  /** The first step. Default 0. Read once, at start. */
  readonly defaultStep = input(0);
  /** linear: a later step opens only when the ones before it are valid. free: any step. Default linear. Read once, at start. */
  readonly mode = input<StepperMode>('linear');
  /** Called with the full values when the last step is sent. A promise keeps the wizard submitting until it settles. */
  readonly onSubmit = input<((values: FormWizardValues, form: HTMLFormElement) => void | Promise<void>) | undefined>(undefined);
  /** The label of the submit button on the last step: "Place order". */
  readonly submitLabel = input<string | undefined>(undefined);
  /** Shown in the panel after a successful submit, under the done heading. */
  readonly done = input<string | TemplateRef<unknown> | undefined>(undefined);
  /** The heading after a successful submit. */
  readonly doneTitle = input<string | undefined>(undefined);
  /** The Stepper layout. Default horizontal; vertical puts the steps at the start side. */
  readonly orientation = input<StepperOrientation>('horizontal');
  /** The Stepper and the action buttons. Default md. */
  readonly size = input<FormWizardSize>('md');
  /** The name of the steps list, read with the Stepper. */
  readonly stepsLabel = input<string | undefined>(undefined);
  /** Default words of the buttons and the status. Defaults follow the theme language. */
  readonly labels = input<Partial<FormWizardLabels> | undefined>(undefined);
  /** Errors to show before the user checks a step, by step index then field name. Read once, at start. */
  readonly defaultErrors = input<Record<number, FormWizardErrors> | undefined>(undefined);
  /** Attributes of the panel form: name, action, autocomplete and so on. */
  readonly formProps = input<Record<string, string> | undefined>(undefined);
  /** Emits the index after every step change. React's onStepChange. */
  readonly stepChange = output<number>();

  private readonly theme = inject(DsThemeService);
  private readonly injector = inject(Injector);
  private readonly ar = computed(() => this.theme.value().lang === 'ar');
  protected readonly words = computed<FormWizardLabels>(() => ({ ...formWizardLabels[this.ar() ? 'ar' : 'en'], ...this.labels() }));
  private readonly formRef = viewChild.required<ElementRef<HTMLFormElement>>('form');
  private readonly titleRef = viewChild.required<ElementRef<HTMLHeadingElement>>('title');
  /** The panel form, for the caller that needs it (React's formRef). */
  get formElement(): HTMLFormElement {
    return this.formRef().nativeElement;
  }

  private readonly base = `ds-form-wizard-${++nextId}-`;
  protected readonly titleId = `${this.base}title`;
  protected readonly errorId = `${this.base}error`;

  protected readonly stepper = signal<StepperState>(createStepperState({ count: 1 }));
  protected readonly errors = signal<Record<number, FormWizardErrors>>({});
  private readonly values = signal<FormWizardValues>({});
  protected readonly state = signal<FormWizardState>('editing');
  protected readonly checking = signal(false);
  protected readonly submitFailed = signal(false);
  protected readonly announce = signal('');

  protected readonly step = computed(() => this.steps()[this.stepper().current]);
  protected readonly last = computed(() => isLastStep(this.stepper()));
  protected readonly first = computed(() => isFirstStep(this.stepper()));
  protected readonly idle = computed(() => this.state() === 'editing' && !this.checking());
  protected readonly nextText = computed(() => {
    const step = this.step();
    return this.last() ? (this.submitLabel() ?? step?.nextLabel ?? this.words().submit) : (step?.nextLabel ?? this.words().next);
  });
  protected readonly stepperSteps = computed<StepperStep[]>(() =>
    this.steps().map((s, i) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      invalid: Object.keys(this.errors()[i] ?? {}).length > 0,
    })),
  );
  /** One context object per step, rebuilt only when the values or that step's errors change. */
  private readonly contexts = computed(() => {
    const values = this.values();
    const errors = this.errors();
    return this.steps().map((_, i) => {
      const ctx: FormWizardStepContext = { values, errors: errors[i] ?? {} };
      return { $implicit: ctx, ...ctx } satisfies FormWizardTemplateContext;
    });
  });

  private pendingFocus: PendingFocus | null = null;
  /** True while a check or a submit runs, so a second Enter in the same tick sees it. */
  private busy = false;
  /** Bumped by every move, so a check that resolves after the user moved away is dropped. */
  private run = 0;
  private started = false;
  /** Set on destroy, so work after an await does not touch a destroyed view. */
  private destroyed = false;

  protected readonly pick = (index: number) => void this.go(index);
  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
    consumeHostAttributes([
      'dsFormWizard', 'steps', 'defaultStep', 'mode', 'onSubmit', 'submitLabel', 'done', 'doneTitle', 'orientation', 'size',
      'stepsLabel', 'labels', 'defaultErrors', 'formProps',
    ]);
    // mode, the number of steps, defaultStep and defaultErrors are read once, at start.
    effect(() => {
      if (this.started) return;
      this.started = true;
      const defaultStep = this.defaultStep();
      this.stepper.set(
        createStepperState({
          count: this.steps().length,
          current: defaultStep,
          completed: Array.from({ length: Math.max(0, defaultStep) }, (_, i) => i),
          mode: this.mode(),
        }),
      );
      this.errors.set(this.defaultErrors() ?? {});
    });
    // Attributes for the panel form.
    let applied: string[] = [];
    afterRenderEffect(() => {
      const form = this.formRef().nativeElement;
      const props = this.formProps() ?? {};
      const names = Object.keys(props).map(attributeName).filter((n) => !RESERVED.has(n));
      for (const name of applied) if (!names.includes(name)) form.removeAttribute(name);
      for (const [key, value] of Object.entries(props)) {
        const name = attributeName(key);
        if (!RESERVED.has(name)) form.setAttribute(name, value);
      }
      applied = names;
    });
    // The values the fields start with, so a review step shown first has them.
    afterNextRender(() => this.values.set(readFormValues(this.formElement)));
  }

  protected contextFor(index: number): FormWizardTemplateContext {
    return this.contexts()[index]!;
  }

  private bodyOf(index: number): Element | null {
    return this.formElement.querySelector(`[data-part='body'][data-step='${index}']`);
  }

  /** Focus after the next render, so an error is already linked through aria-describedby. */
  private focusAfterRender(target: PendingFocus): void {
    if (this.destroyed) return;
    this.pendingFocus = target;
    afterNextRender(
      () => {
        const pending = this.pendingFocus;
        if (!pending) return;
        this.pendingFocus = null;
        const title = this.titleRef().nativeElement;
        if (pending.kind === 'title') {
          title.focus();
          return;
        }
        const field = controlsIn(this.bodyOf(pending.index)).find((c) => pending.names.includes(c.name));
        (field ?? title).focus();
      },
      { injector: this.injector },
    );
  }

  /** Checks one step and shows its errors. Returns the errors, empty when the step is valid. */
  private async check(index: number, all: FormWizardValues): Promise<FormWizardErrors> {
    // The DOM is read before the wait, as React does.
    const builtIn = stepErrors(this.bodyOf(index), this.words().required);
    const own = await this.steps()[index]?.validate?.(all);
    if (this.destroyed) return {};
    const found = { ...builtIn, ...(own ?? {}) };
    this.errors.update((e) => ({ ...e, [index]: found }));
    return found;
  }

  private moveTo(next: StepperState): void {
    if (this.destroyed) return;
    this.run += 1;
    this.submitFailed.set(false);
    if (next.current === this.stepper().current) {
      this.stepper.set(next);
      return;
    }
    this.stepper.set(next);
    this.focusAfterRender({ kind: 'title' });
    const title = this.steps()[next.current]?.title ?? '';
    this.announce.set(`${formatStepPosition(next.current, next.count, this.ar() ? 'ar' : 'en')}${this.words().separator}${title}`);
    this.stepChange.emit(next.current);
  }

  /** Runs one async task at a time. A call while another runs does nothing. */
  private async exclusive(task: () => Promise<void>): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      await task();
    } finally {
      this.busy = false;
      this.checking.set(false);
    }
  }

  /** Back moves at once. Forward checks the current step first; when it fails, focus moves to the first field to fix. */
  private go(index: number): Promise<void> {
    return this.exclusive(async () => {
      if (this.state() !== 'editing') return;
      const all = readFormValues(this.formElement);
      this.values.set(all);
      const current = this.stepper().current;
      if (index < current) {
        this.moveTo(stepGoTo(this.stepper(), index));
        return;
      }
      const token = this.run;
      this.checking.set(true);
      const found = await this.check(current, all);
      if (token !== this.run || this.destroyed) return;
      if (Object.keys(found).length > 0) {
        this.stepper.update((s) => setStepComplete(s, current, false));
        this.focusAfterRender({ kind: 'field', index: current, names: Object.keys(found) });
        return;
      }
      this.moveTo(stepGoTo(setStepComplete(this.stepper(), current, true), index));
    });
  }

  private submit(): Promise<void> {
    return this.exclusive(async () => {
      const el = this.formElement;
      if (this.state() !== 'editing') return;
      const all = readFormValues(el);
      this.values.set(all);
      this.submitFailed.set(false);
      this.checking.set(true);
      // Every step again, so a step reached in free mode or changed later cannot slip through.
      let firstBad: { index: number; found: FormWizardErrors } | undefined;
      let next = this.stepper();
      for (let i = 0; i < this.steps().length; i += 1) {
        const found = await this.check(i, all);
        const valid = Object.keys(found).length === 0;
        next = setStepComplete(next, i, valid);
        if (!valid && firstBad === undefined) firstBad = { index: i, found };
      }
      if (this.destroyed) return;
      this.checking.set(false);
      const current = this.stepper().current;
      if (firstBad !== undefined) {
        if (firstBad.index === current) {
          this.stepper.set(next);
          this.focusAfterRender({ kind: 'field', index: current, names: Object.keys(firstBad.found) });
        } else {
          this.moveTo({ ...next, current: firstBad.index });
        }
        return;
      }
      this.stepper.set(next);
      this.state.set('submitting');
      try {
        await this.onSubmit()?.(all, el);
        if (this.destroyed) return;
        this.focusAfterRender({ kind: 'title' });
        this.state.set('done');
        this.announce.set(this.doneTitle() ?? this.words().done);
      } catch {
        if (this.destroyed) return;
        // Back to editing, with a message in the panel that the status says once (WCAG 3.3.1, 4.1.3).
        this.state.set('editing');
        this.submitFailed.set(true);
        this.announce.set(this.words().submitError);
      }
    });
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    if (this.state() !== 'editing' || this.busy) return;
    void (this.last() ? this.submit() : this.go(this.stepper().current + 1));
  }

  protected goBack(): void {
    if (!this.idle()) return;
    this.values.set(readFormValues(this.formElement));
    this.moveTo(stepBack(this.stepper()));
  }
}
