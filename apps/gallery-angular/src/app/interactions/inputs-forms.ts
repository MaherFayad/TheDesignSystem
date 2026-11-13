// Stages of the Angular /interactions page for the inputs family, form parts (orders
// 1.21 and 1.22), the twin of apps/gallery-react/src/interactions/inputs.tsx (Field,
// FieldError, Fieldset, Form, FormWizard, ConsentField, Rating).
// One standalone component per interaction id. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Same copy as React. Each host is display contents, so
// the controls sit in the stage's flex row as React's fragments do.
//
// field-label-focus is staged in ./inputs.ts with the other Input stages.
import { ChangeDetectionStrategy, Component, computed, signal, viewChild, type TemplateRef, type Type } from '@angular/core';
import {
  DsButton,
  DsConsentField,
  DsField,
  DsFieldDescription,
  DsForm,
  DsFormField,
  DsFormSubmit,
  DsFormWizard,
  DsInput,
  DsRating,
  type FormWizardStep,
  type FormWizardTemplateContext,
} from '@the-system/angular';

const host = { style: 'display: contents' };

/** The stage around a trigger. */
const stageOf = (el: EventTarget | null): HTMLElement | null => (el instanceof Element ? el.closest('[data-interaction-stage]') : null);

const click = (stage: HTMLElement, selector: string) => stage.querySelector<HTMLElement>(selector)?.click();

/** Runs `act` on the stage of the pressed control. */
function play(event: Event, act: (stage: HTMLElement) => void): void {
  const stage = stageOf(event.currentTarget);
  if (stage) act(stage);
}

@Component({
  selector: 'ds-stage-field-message-enter',
  imports: [DsButton, DsField, DsFieldDescription, DsInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsField label="Board name">
      <div dsInput value="Spring launch"></div>
      @if (hint()) {
        <p dsFieldDescription>Shown to everyone in the workspace.</p>
      }
    </div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="hint.set(!hint())">{{ hint() ? 'Hide the hint' : 'Show a hint' }}</button>
  `,
})
class FieldMessageEnterStage {
  protected readonly hint = signal(false);
}

@Component({
  selector: 'ds-stage-field-error-enter',
  imports: [DsButton, DsField, DsInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsField label="Email" [error]="error() ? 'Enter an email address, like name@example.com.' : undefined">
      <div dsInput value="sara@"></div>
    </div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="error.set(!error())">{{ error() ? 'Clear the error' : 'Show an error' }}</button>
  `,
})
class FieldErrorEnterStage {
  protected readonly error = signal(false);
}

@Component({
  selector: 'ds-stage-form-summary-enter',
  imports: [DsForm, DsFormField, DsFormSubmit, DsInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <form dsForm [actions]="actions">
      <div dsFormField name="name" label="Full name"><div dsInput name="name" required></div></div>
      <div dsFormField name="email" label="Email"><div dsInput name="email" type="email" required></div></div>
      <ng-template #actions><button dsFormSubmit data-interaction-trigger="">Send request</button></ng-template>
    </form>
  `,
})
class FormSummaryEnterStage {}

@Component({
  selector: 'ds-stage-form-submit-success',
  imports: [DsForm, DsFormField, DsFormSubmit, DsInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <!-- A reset mounts the form again, as React's key. -->
    @for (k of [key()]; track k) {
      <form dsForm [actions]="actions" (reset)="key.set(key() + 1)">
        <div dsFormField name="team" label="Team name"><div dsInput name="team" value="Design" required></div></div>
        <ng-template #actions><button dsFormSubmit data-interaction-trigger="">Send request</button></ng-template>
      </form>
    }
  `,
})
class FormSubmitSuccessStage {
  protected readonly key = signal(0);
}

const wizardTemplates = `
  <ng-template #account><div dsField label="Work email"><div dsInput value="sara@example.com"></div></div></ng-template>
  <ng-template #team><div dsField label="Team name"><div dsInput value="Design"></div></div></ng-template>
  <ng-template #review><p style="margin: 0">Check the details and send the form.</p></ng-template>
`;

type StepTemplate = TemplateRef<FormWizardTemplateContext>;

/** The three steps of the wizard stages, from the stage's templates once they exist. */
function wizardSteps(account: () => StepTemplate | undefined, team: () => StepTemplate | undefined, review: () => StepTemplate | undefined) {
  return computed<FormWizardStep[] | undefined>(() => {
    const [a, t, r] = [account(), team(), review()];
    if (!a || !t || !r) return undefined;
    return [
      { id: 'account', title: 'Account', content: a },
      { id: 'team', title: 'Team', content: t },
      { id: 'review', title: 'Review', content: r },
    ];
  });
}

@Component({
  selector: 'ds-stage-wizard-step',
  imports: [DsButton, DsField, DsFormWizard, DsInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    @if (steps(); as s) {
      <div dsFormWizard [steps]="s" [onSubmit]="submit"></div>
    }
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="next($event)">Go to the next step</button>
    ${wizardTemplates}
  `,
})
class WizardStepStage {
  private readonly account = viewChild<StepTemplate>('account');
  private readonly team = viewChild<StepTemplate>('team');
  private readonly review = viewChild<StepTemplate>('review');
  protected readonly steps = wizardSteps(this.account, this.team, this.review);
  protected readonly submit = () => undefined;
  protected next(event: Event): void {
    play(event, (s) => {
      if (s.querySelector('[data-part="next"]')) click(s, '[data-part="next"]');
      else click(s, '[data-part="back"]');
    });
  }
}

@Component({
  selector: 'ds-stage-wizard-done',
  imports: [DsButton, DsField, DsFormWizard, DsInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    @if (steps(); as s) {
      <div dsFormWizard [steps]="s" [defaultStep]="2" [onSubmit]="submit"></div>
    }
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="send($event)">Send the form</button>
    ${wizardTemplates}
  `,
})
class WizardDoneStage {
  private readonly account = viewChild<StepTemplate>('account');
  private readonly team = viewChild<StepTemplate>('team');
  private readonly review = viewChild<StepTemplate>('review');
  protected readonly steps = wizardSteps(this.account, this.team, this.review);
  protected readonly submit = () => undefined;
  protected send(event: Event): void {
    play(event, (s) => click(s, '[data-part="submit"]'));
  }
}

@Component({
  selector: 'ds-stage-consent-check',
  imports: [DsButton, DsConsentField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsConsentField purpose="Send me product news by email" detailsHref="#privacy"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="toggle($event)">Give or withdraw the consent</button>
  `,
})
class ConsentCheckStage {
  protected toggle(event: Event): void {
    play(event, (s) => click(s, '[role="checkbox"]'));
  }
}

@Component({
  selector: 'ds-stage-rating-fill',
  imports: [DsButton, DsRating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsRating aria-label="Rate this template" [defaultValue]="2"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="pick($event)">Pick a score</button>
  `,
})
class RatingFillStage {
  protected pick(event: Event): void {
    play(event, (s) => {
      const checked = s.querySelector('[role="radio"][aria-checked="true"]');
      const stars = [...s.querySelectorAll<HTMLElement>('[role="radio"]')];
      stars[stars.indexOf(checked as HTMLElement) === 4 ? 1 : 4]?.click();
    });
  }
}

@Component({
  selector: 'ds-stage-rating-preview',
  imports: [DsButton, DsRating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div dsRating aria-label="Rate this template" [defaultValue]="1"></div>
    <button dsButton size="sm" emphasis="soft" data-interaction-trigger="" (click)="pick($event)">Pick four stars</button>
  `,
})
class RatingPreviewStage {
  protected pick(event: Event): void {
    play(event, (s) => [...s.querySelectorAll<HTMLElement>('[role="radio"]')][3]?.click());
  }
}

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {
  'field-message-enter': FieldMessageEnterStage,
  'field-error-enter': FieldErrorEnterStage,
  'form-summary-enter': FormSummaryEnterStage,
  'form-submit-success': FormSubmitSuccessStage,
  'wizard-step': WizardStepStage,
  'wizard-done': WizardDoneStage,
  'consent-check': ConsentCheckStage,
  'rating-fill': RatingFillStage,
  'rating-preview': RatingPreviewStage,
};
