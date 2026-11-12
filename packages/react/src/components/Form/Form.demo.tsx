import { useId, useState } from 'react';
import type { FormValidators } from '@the-system/shared';
import { Theme } from '../../theme';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Button } from '../Button';
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '../Dialog';
import { Fieldset } from '../Fieldset/Fieldset';
import { Input } from '../Input/Input';
import { Form, FormField, FormSubmit, type FormSize } from './index';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const workEmail: FormValidators = {
  email: (v) => (typeof v === 'string' && /@(gmail|hotmail|yahoo)\./i.test(v) ? 'Use your work email, not a personal one.' : undefined),
};

function ContactForm({ size, orientation }: { size?: FormSize; orientation?: 'vertical' | 'horizontal' }) {
  return (
    <Form size={size} orientation={orientation} validators={workEmail} onSubmit={() => wait(600)} actions={<FormSubmit size={size}>Send request</FormSubmit>}>
      <FormField name="name" label="Full name" required>
        <Input name="name" autoComplete="name" size={size} />
      </FormField>
      <FormField name="email" label="Work email" required description="We reply within one working day.">
        <Input name="email" type="email" autoComplete="email" size={size} />
      </FormField>
    </Form>
  );
}

function DialogForm() {
  const formId = useId();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen} size="sm">
      <DialogTrigger>
        <Button data-demo-trigger="dialog">Invite a teammate</Button>
      </DialogTrigger>
      <DialogContent title="Invite a teammate" description="They get an email with a link to this workspace.">
        <DialogBody>
          <Form id={formId} onSubmit={() => setOpen(false)}>
            <FormField name="invite-email" label="Email" required>
              <Input name="invite-email" type="email" autoComplete="off" />
            </FormField>
          </Form>
        </DialogBody>
        <DialogFooter>
          <DialogClose>
            <Button>Cancel invite</Button>
          </DialogClose>
          <Button type="submit" form={formId} tone="accent" emphasis="solid">
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

/** Form in every content case that applies, and the form in a dialog pattern. */
export default function FormDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, horizontal labels, and an Arabic row" lang="en">
        <p data-demo="label">Fields marked * are required.</p>
        <DemoGrid min="18rem">
          <ContactForm size="sm" />
          <ContactForm size="md" />
          <ContactForm size="lg" />
        </DemoGrid>
        <ContactForm orientation="horizontal" />
        <Theme lang="ar">
          <Form actions={<FormSubmit>إرسال الطلب</FormSubmit>} onSubmit={() => wait(600)}>
            <FormField name="name" label="الاسم الكامل" required>
              <Input name="name" autoComplete="name" />
            </FormField>
            <FormField name="email" label="البريد الإلكتروني للعمل" required>
              <Input name="email" type="email" autoComplete="email" />
            </FormField>
          </Form>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="One empty field" lang="en">
        <Form actions={<FormSubmit>Join waitlist</FormSubmit>}>
          <FormField name="email" label="Email" required>
            <Input name="email" type="email" autoComplete="email" />
          </FormField>
        </Form>
      </DemoCase>

      <DemoCase id="one" title="One field, filled" lang="en">
        <Form actions={<FormSubmit>Rename workspace</FormSubmit>} onSubmit={() => wait(600)}>
          <FormField name="workspace" label="Workspace name">
            <Input name="workspace" defaultValue="Design team" />
          </FormField>
        </Form>
      </DemoCase>

      <DemoCase id="many" title="Sections in fieldsets" lang="en">
        <Form
          actions={
            <>
              <FormSubmit>Save address</FormSubmit>
              <Button type="reset">Clear form</Button>
            </>
          }
          onSubmit={() => wait(600)}
        >
          <Fieldset legend="Contact">
            <FormField name="name" label="Full name" required>
              <Input name="name" autoComplete="name" />
            </FormField>
            <FormField name="tel" label="Mobile number" description="For the courier only.">
              <Input name="tel" type="tel" autoComplete="tel" />
            </FormField>
          </Fieldset>
          <Fieldset legend="Delivery address">
            <FormField name="city" label="City" required>
              <Input name="city" autoComplete="address-level2" />
            </FormField>
            <FormField name="postal" label="Postal code">
              <Input name="postal" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}" />
            </FormField>
          </Fieldset>
        </Form>
      </DemoCase>

      <DemoCase id="too-many" title="A long form with many errors" lang="en">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Form
            size="sm"
            serverErrors={Object.fromEntries(longFields.map(([name, label]) => [name, `Add your ${label.toLowerCase()}.`]))}
            actions={<FormSubmit size="sm">Save billing details</FormSubmit>}
          >
            {longFields.map(([name, label, auto]) => (
              <FormField key={name} name={name} label={label} required>
                <Input name={name} size="sm" autoComplete={auto} />
              </FormField>
            ))}
          </Form>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long labels and errors" lang="en">
        <Form
          serverErrors={{ form: sample.en.long, board: 'Use 60 characters or fewer, so the name fits on the board card and in every shared link.' }}
          actions={<FormSubmit>Save board name and description</FormSubmit>}
        >
          <FormField name="board" label="The name people see on the board card, in shared links and in every email we send" required>
            <Input name="board" defaultValue={`${sample.en.word} ${sample.en.long}`} />
          </FormField>
        </Form>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <Form
          serverErrors={{ form: sample.ar.long, email: 'البريد مستخدم من قبل. سجل دخول أو استخدم بريد ثاني.' }}
          actions={<FormSubmit>حفظ بيانات التواصل</FormSubmit>}
        >
          <FormField name="name" label="الاسم مثل ما يظهر في الفواتير وفي كل رسالة نرسلها لفريقك" required>
            <Input name="name" autoComplete="name" defaultValue="سارة أحمد" />
          </FormField>
          <FormField name="email" label="البريد الإلكتروني" required>
            <Input name="email" type="email" autoComplete="email" defaultValue="sara@example.com" />
          </FormField>
        </Form>
      </DemoCase>

      <DemoCase id="loading" title="Submitting" lang="en">
        <Form actions={<FormSubmit>Send request</FormSubmit>} onSubmit={() => wait(4000)}>
          <FormField name="topic" label="Topic">
            <Input name="topic" defaultValue="Invoice for October" />
          </FormField>
        </Form>
      </DemoCase>

      <DemoCase id="error" title="Errors from the server" lang="en">
        <Form
          serverErrors={[
            { field: 'email', message: 'This email already has an account. Sign in, or use another email.' },
            { field: 'code', message: 'Enter the 6 digit code from the email we sent.' },
          ]}
          actions={<FormSubmit>Create account</FormSubmit>}
        >
          <FormField name="email" label="Email" required>
            <Input name="email" type="email" autoComplete="email" defaultValue="sara@example.com" />
          </FormField>
          <FormField name="code" label="Sign up code" required>
            <Input name="code" autoComplete="one-time-code" inputMode="numeric" />
          </FormField>
        </Form>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled section" lang="en">
        <Form actions={<FormSubmit>Save profile</FormSubmit>}>
          <FormField name="name" label="Display name">
            <Input name="name" defaultValue="Sara Ahmed" />
          </FormField>
          <Fieldset legend="Billing" description="Only owners can change billing details." disabled>
            <FormField name="company" label="Company">
              <Input name="company" defaultValue="Northwind" />
            </FormField>
          </Fieldset>
        </Form>
      </DemoCase>

      <DemoCase id="readonly" title="Read only fields" lang="en">
        <Form actions={<FormSubmit>Save region</FormSubmit>}>
          <FormField name="workspace-id" label="Workspace ID" readOnly>
            <Input name="workspace-id" defaultValue="ws_4f9a21" />
          </FormField>
          <FormField name="region" label="Region">
            <Input name="region" defaultValue="Middle East (Riyadh)" />
          </FormField>
        </Form>
      </DemoCase>

      <DemoCase id="dialog" title="A form in a dialog" lang="en">
        <DemoRow>
          <DialogForm />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
