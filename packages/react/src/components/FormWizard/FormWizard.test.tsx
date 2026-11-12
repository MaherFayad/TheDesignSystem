import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import { Field } from '../Field';
import { Input } from '../Input';
import FormWizardDemo from './FormWizard.demo';
import { FormWizard, readFormValues, type FormWizardStep } from './index';

const steps: FormWizardStep[] = [
  {
    id: 'account',
    title: 'Account',
    nextLabel: 'Save account',
    content: ({ errors }) => (
      <Field label="Email" required error={errors.email}>
        <Input name="email" type="email" />
      </Field>
    ),
  },
  {
    id: 'address',
    title: 'Address',
    nextLabel: 'Review order',
    backLabel: 'Edit account',
    validate: (values) => (values.city === 'Nowhere' ? { city: 'Pick a city we deliver to' } : undefined),
    content: ({ errors }) => (
      <Field label="City" error={errors.city}>
        <Input name="city" />
      </Field>
    ),
  },
  {
    id: 'review',
    title: 'Review',
    backLabel: 'Edit address',
    content: ({ values }) => <p data-testid="summary">{`${String(values.email)} in ${String(values.city)}`}</p>,
  },
];

/** The same steps with the email already filled in, for the tests that start on the review step. */
const filled: FormWizardStep[] = steps.map((s) =>
  s.id === 'account'
    ? {
        ...s,
        content: () => (
          <Field label="Email" required>
            <Input name="email" type="email" defaultValue="sara@example.com" />
          </Field>
        ),
      }
    : s,
);

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="form-wizard"]');
  if (!el) throw new Error('no form wizard rendered');
  return el;
}

const title = (c: HTMLElement) => c.querySelector('[data-part="panel"] > [data-part="title"]');
const status = (c: HTMLElement) => c.querySelector('[data-ds="form-wizard"] > [data-part="status"]');

async function fillAccount(email = 'sara@example.com') {
  await userEvent.type(screen.getByLabelText(/Email/), email);
  await userEvent.click(screen.getByRole('button', { name: 'Save account' }));
}

describe('FormWizard', () => {
  it('renders the anatomy with the default attributes', () => {
    const { container } = render(<FormWizard steps={steps} />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-state')).toBe('editing');
    const stepper = el.querySelector('[data-ds="stepper"]');
    expect(stepper?.getAttribute('data-part')).toBe('steps');
    const panel = el.querySelector('[data-part="panel"]');
    expect(panel?.tagName).toBe('FORM');
    expect(panel?.hasAttribute('novalidate')).toBe(true);
    expect(screen.getByRole('form', { name: 'Account' })).toBe(panel);
    expect(title(container)?.tagName).toBe('H2');
    expect(status(container)?.getAttribute('role')).toBe('status');
    expect(status(container)?.textContent).toBe('');
  });

  it('keeps every step in the DOM and hides the ones that are not current', () => {
    const { container } = render(<FormWizard steps={steps} />);
    const bodies = Array.from(container.querySelectorAll('[data-part="body"]'));
    expect(bodies.map((b) => b.hasAttribute('hidden'))).toEqual([false, true, true]);
  });

  it('has no back button on the first step, and next is the submit button', () => {
    const { container } = render(<FormWizard steps={steps} />);
    expect(container.querySelector('[data-part="back"]')).toBeNull();
    const next = screen.getByRole('button', { name: 'Save account' });
    expect(next.getAttribute('type')).toBe('submit');
    expect(next.getAttribute('data-part')).toBe('next');
  });

  it('checks a step before next: a required empty field stops it and takes focus', async () => {
    const { container } = render(<FormWizard steps={steps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save account' }));
    const input = screen.getByLabelText(/Email/);
    expect(document.activeElement).toBe(input);
    expect(screen.getByText('Fill in this field')).toBeTruthy();
    expect(title(container)?.textContent).toBe('Account');
    expect(container.querySelector('[data-part="step"]')?.getAttribute('data-invalid')).toBe('');
  });

  it('uses the browser message for a type mismatch', async () => {
    render(<FormWizard steps={steps} />);
    await fillAccount('not an email');
    expect(screen.getByLabelText(/Email/).getAttribute('aria-invalid')).toBe('true');
  });

  it('moves on, focuses the title and says the position once', async () => {
    const onStepChange = vi.fn();
    const { container } = render(<FormWizard steps={steps} onStepChange={onStepChange} />);
    await fillAccount();
    expect(title(container)?.textContent).toBe('Address');
    expect(document.activeElement).toBe(title(container));
    expect(status(container)?.textContent).toBe('Step 2 of 3, Address');
    expect(onStepChange).toHaveBeenCalledWith(1);
    const states = Array.from(container.querySelectorAll('[data-part="step"]')).map((s) => s.getAttribute('data-state'));
    expect(states).toEqual(['complete', 'current', 'upcoming']);
  });

  it('runs the step validate function', async () => {
    render(<FormWizard steps={steps} />);
    await fillAccount();
    await userEvent.type(screen.getByLabelText('City'), 'Nowhere');
    await userEvent.click(screen.getByRole('button', { name: 'Review order' }));
    expect(screen.getByText('Pick a city we deliver to')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('City'));
  });

  it('Enter in a field moves to the next step', async () => {
    const { container } = render(<FormWizard steps={steps} />);
    await userEvent.type(screen.getByLabelText(/Email/), 'sara@example.com{Enter}');
    expect(title(container)?.textContent).toBe('Address');
  });

  it('keeps what was typed when going back (WCAG 3.3.7)', async () => {
    const { container } = render(<FormWizard steps={steps} />);
    await fillAccount();
    await userEvent.click(screen.getByRole('button', { name: 'Edit account' }));
    expect(title(container)?.textContent).toBe('Account');
    expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe('sara@example.com');
  });

  it('goes back through the Stepper, and forward again to a complete step', async () => {
    const { container } = render(<FormWizard steps={steps} />);
    await fillAccount();
    await userEvent.click(screen.getByRole('button', { name: 'Account, complete' }));
    expect(title(container)?.textContent).toBe('Account');
    await userEvent.click(screen.getByRole('button', { name: /^Address/ }));
    expect(title(container)?.textContent).toBe('Address');
  });

  it('shows the values on the review step and sends them all', async () => {
    const onSubmit = vi.fn();
    const { container } = render(<FormWizard steps={steps} submitLabel="Place order" onSubmit={onSubmit} doneTitle="Order placed" done={<p>Receipt sent</p>} />);
    await fillAccount();
    await userEvent.type(screen.getByLabelText('City'), 'Riyadh');
    await userEvent.click(screen.getByRole('button', { name: 'Review order' }));
    expect(screen.getByTestId('summary').textContent).toBe('sara@example.com in Riyadh');
    const submit = screen.getByRole('button', { name: 'Place order' });
    expect(submit.getAttribute('data-part')).toBe('submit');
    await userEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith({ email: 'sara@example.com', city: 'Riyadh' }, expect.any(HTMLFormElement));
    await waitFor(() => expect(root(container).getAttribute('data-state')).toBe('done'));
    expect(title(container)?.textContent).toBe('Order placed');
    expect(screen.getByText('Receipt sent')).toBeTruthy();
    expect(container.querySelector('[data-part="actions"]')).toBeNull();
    expect(status(container)?.textContent).toBe('Order placed');
  });

  it('is submitting while the promise runs, and returns to editing when it fails', async () => {
    let fail: (e: Error) => void = () => undefined;
    const onSubmit = () => new Promise<void>((_, reject) => (fail = reject));
    const { container } = render(<FormWizard steps={steps} defaultStep={0} onSubmit={onSubmit} />);
    await fillAccount();
    await userEvent.click(screen.getByRole('button', { name: 'Review order' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send form' }));
    expect(root(container).getAttribute('data-state')).toBe('submitting');
    expect(screen.getByRole('button', { name: /Send form/ }).getAttribute('data-loading')).toBe('');
    fail(new Error('server down'));
    await waitFor(() => expect(root(container).getAttribute('data-state')).toBe('editing'));
  });

  it('on submit, sends the user to the first step that fails', async () => {
    const strict = steps.map((s) =>
      s.id === 'address'
        ? {
            ...s,
            content: () => (
              <Field label="City" required>
                <Input name="city" />
              </Field>
            ),
          }
        : s,
    );
    const { container } = render(<FormWizard steps={strict} mode="free" />);
    await userEvent.type(screen.getByLabelText(/Email/), 'sara@example.com');
    await userEvent.click(screen.getByRole('button', { name: /^Review/ }));
    expect(title(container)?.textContent).toBe('Review');
    await userEvent.click(screen.getByRole('button', { name: 'Send form' }));
    expect(title(container)?.textContent).toBe('Address');
    expect(status(container)?.textContent).toBe('Step 2 of 3, Address');
  });

  it('links the error to the field before it takes focus', async () => {
    render(<FormWizard steps={steps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save account' }));
    const input = screen.getByLabelText(/Email/);
    expect(document.activeElement).toBe(input);
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids.map((i) => document.getElementById(i)?.textContent).join(' ')).toContain('Fill in this field');
  });

  it('runs one check at a time and drops a check the user left with Back', async () => {
    let resolve: (e: Record<string, string> | void) => void = () => undefined;
    const validate = vi.fn(() => new Promise<Record<string, string> | void>((r) => (resolve = r)));
    const slow = steps.map((s) => (s.id === 'address' ? { ...s, validate } : s));
    const { container } = render(<FormWizard steps={slow} />);
    await fillAccount();
    await userEvent.type(screen.getByLabelText('City'), 'Riyadh');
    const next = screen.getByRole('button', { name: /Review order/ });
    await userEvent.click(next);
    await userEvent.click(next);
    expect(validate).toHaveBeenCalledTimes(1);
    const back = screen.getByRole('button', { name: 'Edit account' });
    expect(back.getAttribute('aria-disabled')).toBe('true');
    resolve(undefined);
    await waitFor(() => expect(title(container)?.textContent).toBe('Review'));
  });

  it('sends once when Enter is pressed twice', async () => {
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn(() => new Promise<void>((r) => (finish = r)));
    render(<FormWizard steps={filled} defaultStep={2} onSubmit={onSubmit} />);
    const form = document.querySelector('form') as HTMLFormElement;
    form.requestSubmit();
    form.requestSubmit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    form.requestSubmit();
    finish();
    await waitFor(() => expect(document.querySelector('[data-ds="form-wizard"]')?.getAttribute('data-state')).toBe('done'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('says so when the submit fails, and lets the user send again', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    const { container } = render(<FormWizard steps={filled} defaultStep={2} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Send form' }));
    const message = 'The form was not sent. Check your connection and send it again.';
    await waitFor(() => expect(status(container)?.textContent).toBe(message));
    expect(container.querySelector('[data-part="panel"] > [data-part="error"]')?.textContent).toBe(message);
    expect(root(container).getAttribute('data-state')).toBe('editing');
    await userEvent.click(screen.getByRole('button', { name: 'Send form' }));
    await waitFor(() => expect(root(container).getAttribute('data-state')).toBe('done'));
    expect(container.querySelector('[data-part="error"]')).toBeNull();
  });

  it('shows errors passed in defaultErrors', () => {
    const { container } = render(<FormWizard steps={steps} defaultStep={1} defaultErrors={{ 1: { city: 'We do not deliver there' } }} />);
    expect(screen.getByText('We do not deliver there')).toBeTruthy();
    expect(container.querySelectorAll('[data-part="step"]')[1]?.getAttribute('data-invalid')).toBe('');
  });

  it('sets size and the Stepper orientation, and passes form props', () => {
    const { container } = render(<FormWizard steps={steps} size="sm" orientation="vertical" formProps={{ name: 'checkout' }} />);
    expect(root(container).getAttribute('data-size')).toBe('sm');
    expect(container.querySelector('[data-ds="stepper"]')?.getAttribute('data-orientation')).toBe('vertical');
    expect(container.querySelector('[data-ds="stepper"]')?.getAttribute('data-size')).toBe('sm');
    expect(container.querySelector('form')?.getAttribute('name')).toBe('checkout');
  });

  it('uses Arabic words under an Arabic Theme', async () => {
    const { container } = render(
      <Theme lang="ar">
        <FormWizard steps={steps} />
      </Theme>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save account' }));
    expect(screen.getByText('هذا الحقل مطلوب')).toBeTruthy();
    await userEvent.type(screen.getByLabelText(/Email/), 'sara@example.com{Enter}');
    expect(status(container)?.textContent).toBe('الخطوة 2 من 3، Address');
  });

  it('reads repeated names as a list', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="a" value="1"><input name="a" value="2"><input name="b" value="3">';
    expect(readFormValues(form)).toEqual({ a: ['1', '2'], b: '3' });
  });

  it('renders the demo with the cases that apply', () => {
    const { container } = render(<FormWizardDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'many', 'long-text', 'long-arabic', 'error']);
  });

  it('names the step list Steps when no stepsLabel is passed', () => {
    const { container } = render(<FormWizard steps={steps} />);
    expect(container.querySelector('[data-part="steps"]')?.getAttribute('aria-label')).toBe('Steps');
  });
});
