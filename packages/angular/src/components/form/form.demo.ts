// The Form demo: the same cases, ids and copy as
// packages/react/src/components/Form/Form.demo.tsx. React's ContactForm is
// an ng-template here, so no extra element sits around the form.
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { FormValidators } from '@the-system/shared';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsCheckbox } from '../checkbox/checkbox';
import { DS_DIALOG } from '../dialog/dialog';
import { DsFieldset } from '../fieldset/fieldset';
import { DsInput } from '../input/input';
import { DsForm } from './form';
import { DsFormField } from './form-field';
import { DsFormSubmit } from './form-submit';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const workEmail: FormValidators = {
  email: (v) => (typeof v === 'string' && /@(gmail|hotmail|yahoo)\./i.test(v) ? 'Use your work email, not a personal one.' : undefined),
};

const addressChecks: FormValidators = {
  postal: (v) => (typeof v === 'string' && v !== '' && !/^[0-9]{5}$/.test(v) ? 'Enter the 5 digit postal code.' : undefined),
  reach: (v) => (v === undefined ? 'Pick at least one way to reach you.' : undefined),
};

const longFields: [string, string, string][] = [
  ['first', 'First name', 'given-name'],
  ['last', 'Last name', 'family-name'],
  ['title', 'Job title', 'organization-title'],
  ['company', 'Company', 'organization'],
  ['email', 'Work email', 'email'],
  ['phone', 'Work phone', 'tel'],
  ['street', 'Street address', 'address-line1'],
  ['city', 'City', 'address-level2'],
  ['postal', 'Postal code', 'postal-code'],
  ['country', 'Country', 'country-name'],
  ['website', 'Website', 'url'],
  ['vat', 'VAT number', 'off'],
];

let nextId = 0;

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, NgTemplateOutlet, DsTheme, DsButton, DsCheckbox, DS_DIALOG, DsFieldset, DsInput, DsForm, DsFormField, DsFormSubmit],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #contact let-size="size" let-orientation="orientation">
      <form dsForm [size]="size ?? 'md'" [orientation]="orientation ?? 'vertical'" [validators]="workEmail" [onSubmit]="wait600" [actions]="contactActions">
        <div dsFormField name="name" label="Full name" required>
          <div dsInput name="name" autoComplete="name" [size]="size"></div>
        </div>
        <div dsFormField name="email" label="Work email" required description="We reply within one working day.">
          <div dsInput name="email" type="email" autoComplete="email" [size]="size"></div>
        </div>
        <ng-template #contactActions><button dsFormSubmit [size]="size">Send request</button></ng-template>
      </form>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Sizes, horizontal labels, and an Arabic row">
      <div dsTheme [lang]="'en'" data-demo="content">
        <p data-demo="label">Fields marked * are required.</p>
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));">
          <ng-container *ngTemplateOutlet="contact; context: { size: 'sm' }" />
          <ng-container *ngTemplateOutlet="contact; context: { size: 'md' }" />
          <ng-container *ngTemplateOutlet="contact; context: { size: 'lg' }" />
        </div>
        <ng-container *ngTemplateOutlet="contact; context: { orientation: 'horizontal' }" />
        <div dsTheme [lang]="'ar'">
          <form dsForm [actions]="arActions" [onSubmit]="wait600">
            <div dsFormField name="name" label="الاسم الكامل" required>
              <div dsInput name="name" autoComplete="name"></div>
            </div>
            <div dsFormField name="email" label="البريد الإلكتروني للعمل" required>
              <div dsInput name="email" type="email" autoComplete="email"></div>
            </div>
            <ng-template #arActions><button dsFormSubmit>إرسال الطلب</button></ng-template>
          </form>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="One empty field">
      <div dsTheme [lang]="'en'" data-demo="content">
        <form dsForm [actions]="emptyActions">
          <div dsFormField name="email" label="Email" required>
            <div dsInput name="email" type="email" autoComplete="email"></div>
          </div>
          <ng-template #emptyActions><button dsFormSubmit>Join waitlist</button></ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One field, filled">
      <div dsTheme [lang]="'en'" data-demo="content">
        <form dsForm [actions]="oneActions" [onSubmit]="wait600">
          <div dsFormField name="workspace" label="Workspace name">
            <div dsInput name="workspace" value="Design team"></div>
          </div>
          <ng-template #oneActions><button dsFormSubmit>Rename workspace</button></ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Sections in fieldsets">
      <div dsTheme [lang]="'en'" data-demo="content">
        <form dsForm [actions]="manyActions" [validators]="addressChecks" [onSubmit]="wait600">
          <fieldset dsFieldset legend="Contact">
            <div dsFormField name="name" label="Full name" required>
              <div dsInput name="name" autoComplete="name"></div>
            </div>
            <div dsFormField name="tel" label="Mobile number" description="For the courier only.">
              <div dsInput name="tel" type="tel" autoComplete="tel"></div>
            </div>
          </fieldset>
          <fieldset dsFieldset legend="Delivery address">
            <div dsFormField name="city" label="City" required>
              <div dsInput name="city" autoComplete="address-level2"></div>
            </div>
            <div dsFormField name="postal" label="Postal code" description="5 digits, such as 12211.">
              <div dsInput name="postal" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}"></div>
            </div>
          </fieldset>
          <fieldset dsFieldset legend="How should we reach you" name="reach">
            <div dsCheckbox name="reach" value="email" label="Email"></div>
            <div dsCheckbox name="reach" value="text" label="Text message"></div>
            <div dsCheckbox name="reach" value="call" label="Phone call"></div>
          </fieldset>
          <ng-template #manyActions>
            <button dsFormSubmit>Save address</button>
            <button dsButton type="reset">Clear form</button>
          </ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="A long form with many errors">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <form dsForm size="sm" [serverErrors]="longErrors" [actions]="longActions">
            @for (f of longFields; track f[0]) {
              <div dsFormField [name]="f[0]" [label]="f[1]" required>
                <div dsInput [name]="f[0]" size="sm" [autoComplete]="f[2]"></div>
              </div>
            }
            <ng-template #longActions><button dsFormSubmit size="sm">Save billing details</button></ng-template>
          </form>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long labels and errors">
      <div dsTheme [lang]="'en'" data-demo="content">
        <form dsForm [serverErrors]="longTextErrors" [actions]="longTextActions">
          <div dsFormField name="board" label="The name people see on the board card, in shared links and in every email we send" required>
            <div dsInput name="board" [value]="sample.en.word + ' ' + sample.en.long"></div>
          </div>
          <ng-template #longTextActions><button dsFormSubmit>Save board name and description</button></ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <form dsForm [serverErrors]="arabicErrors" [actions]="arabicActions">
          <div dsFormField name="name" label="الاسم مثل ما يظهر في الفواتير وفي كل رسالة نرسلها لفريقك" required>
            <div dsInput name="name" autoComplete="name" value="سارة أحمد"></div>
          </div>
          <div dsFormField name="email" label="البريد الإلكتروني" required>
            <div dsInput name="email" type="email" autoComplete="email" value="sara@example.com"></div>
          </div>
          <ng-template #arabicActions><button dsFormSubmit>حفظ بيانات التواصل</button></ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Submitting">
      <div dsTheme [lang]="'en'" data-demo="content">
        <form dsForm [actions]="loadingActions" [onSubmit]="wait4000">
          <div dsFormField name="topic" label="Topic">
            <div dsInput name="topic" value="Invoice for October"></div>
          </div>
          <ng-template #loadingActions><button dsFormSubmit>Send request</button></ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Errors from the server">
      <div dsTheme [lang]="'en'" data-demo="content">
        <form dsForm [serverErrors]="serverList" [actions]="errorActions">
          <div dsFormField name="email" label="Email" required>
            <div dsInput name="email" type="email" autoComplete="email" value="sara@example.com"></div>
          </div>
          <div dsFormField name="code" label="Sign up code" required>
            <div dsInput name="code" autoComplete="one-time-code" inputMode="numeric"></div>
          </div>
          <ng-template #errorActions><button dsFormSubmit>Create account</button></ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled section">
      <div dsTheme [lang]="'en'" data-demo="content">
        <form dsForm [actions]="disabledActions">
          <div dsFormField name="name" label="Display name">
            <div dsInput name="name" value="Sara Ahmed"></div>
          </div>
          <fieldset dsFieldset legend="Billing" description="Only owners can change billing details." disabled>
            <div dsFormField name="company" label="Company">
              <div dsInput name="company" value="Northwind"></div>
            </div>
          </fieldset>
          <ng-template #disabledActions><button dsFormSubmit>Save profile</button></ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only fields">
      <div dsTheme [lang]="'en'" data-demo="content">
        <form dsForm [actions]="readonlyActions">
          <div dsFormField name="workspace-id" label="Workspace ID" readOnly>
            <div dsInput name="workspace-id" value="ws_4f9a21"></div>
          </div>
          <div dsFormField name="region" label="Region">
            <div dsInput name="region" value="Middle East (Riyadh)"></div>
          </div>
          <ng-template #readonlyActions><button dsFormSubmit>Save region</button></ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="dialog" heading="A form in a dialog">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDialog [(open)]="dialogOpen" size="sm">
            <button dsButton dsDialogTrigger data-demo-trigger="dialog">Invite a teammate</button>
            <ng-template dsDialogContent title="Invite a teammate" description="They get an email with a link to this workspace.">
              <div dsDialogBody>
                <form dsForm [attr.id]="formId" [onSubmit]="closeDialog">
                  <div dsFormField name="invite-email" label="Email" required>
                    <div dsInput name="invite-email" type="email" autoComplete="off"></div>
                  </div>
                </form>
              </div>
              <div dsDialogFooter>
                <button dsButton dsDialogClose>Cancel invite</button>
                <button dsButton type="submit" [attr.form]="formId" tone="accent" emphasis="solid">Send invite</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>
  `,
})
export default class FormDemo {
  protected readonly sample = sample;
  protected readonly workEmail = workEmail;
  protected readonly addressChecks = addressChecks;
  protected readonly longFields = longFields;
  protected readonly wait600 = () => wait(600);
  protected readonly wait4000 = () => wait(4000);
  protected readonly longErrors = Object.fromEntries(longFields.map(([name, label]) => [name, `Add your ${label.toLowerCase()}.`]));
  protected readonly longTextErrors = {
    form: sample.en.long,
    board: 'Use 60 characters or fewer, so the name fits on the board card and in every shared link.',
  };
  protected readonly arabicErrors = { form: sample.ar.long, email: 'البريد مستخدم من قبل. سجل دخول أو استخدم بريد ثاني.' };
  protected readonly serverList = [
    { field: 'email', message: 'This email already has an account. Sign in, or use another email.' },
    { field: 'code', message: 'Enter the 6 digit code from the email we sent.' },
  ];
  protected readonly formId = `form-demo-${++nextId}`;
  protected readonly dialogOpen = signal(false);
  protected readonly closeDialog = () => this.dialogOpen.set(false);
}
