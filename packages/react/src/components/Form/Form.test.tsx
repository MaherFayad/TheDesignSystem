import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import { Checkbox } from '../Checkbox/Checkbox';
import { Fieldset } from '../Fieldset/Fieldset';
import { Input } from '../Input/Input';
import FormDemo from './Form.demo';
import { Form, FormField, FormSubmit } from './index';

// jsdom has no ResizeObserver, which the hidden form input of a Radix Checkbox reads.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function root(container: HTMLElement): HTMLFormElement {
  const el = container.querySelector<HTMLFormElement>('[data-ds="form"]');
  if (!el) throw new Error('no form rendered');
  return el;
}

function Contact(props: Partial<Parameters<typeof Form>[0]>) {
  return (
    <Form actions={<FormSubmit>Send request</FormSubmit>} {...props}>
      <FormField name="name" label="Full name" required>
        <Input name="name" autoComplete="name" />
      </FormField>
      <FormField name="email" label="Email" required>
        <Input name="email" type="email" autoComplete="email" />
      </FormField>
      <FormField name="note" label="Note">
        <Input name="note" />
      </FormField>
    </Form>
  );
}

describe('Form', () => {
  it('renders a native form with the parts and default axes', () => {
    const { container } = render(<Contact />);
    const el = root(container);
    expect(el.tagName).toBe('FORM');
    expect(el.noValidate).toBe(true);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.getAttribute('data-state')).toBe('idle');
    expect(el.hasAttribute('data-invalid')).toBe(false);
    expect(el.querySelector(':scope > [data-part="body"]')).not.toBeNull();
    expect(el.querySelector(':scope > [data-part="actions"] [type="submit"]')).not.toBeNull();
    expect(el.querySelector('[data-part="summary"]')).toBeNull();
  });

  it('keeps autocomplete values on the controls', () => {
    render(<Contact />);
    expect(screen.getByRole('textbox', { name: 'Email' }).getAttribute('autocomplete')).toBe('email');
    expect(screen.getByRole('textbox', { name: 'Full name' }).getAttribute('autocomplete')).toBe('name');
  });

  it('on submit with errors: summary with links, field errors, focus on the first invalid field, one announcement', async () => {
    const onSubmit = vi.fn();
    const onErrors = vi.fn();
    const { container } = render(<Contact onSubmit={onSubmit} onErrors={onErrors} />);
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    const el = root(container);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onErrors).toHaveBeenCalledWith({ name: 'Fill in this field.', email: 'Fill in this field.' });
    expect(el.hasAttribute('data-invalid')).toBe(true);
    const summary = el.querySelector('[data-part="summary"]');
    expect(summary?.getAttribute('data-ds')).toBe('alert');
    expect(summary?.textContent).toContain('Fix 2 fields to send the form');
    const links = summary?.querySelectorAll('a') ?? [];
    expect(links).toHaveLength(2);
    const name = screen.getByRole('textbox', { name: 'Full name' });
    expect(links[0]?.getAttribute('href')).toBe(`#${name.id}`);
    expect(links[0]?.textContent).toBe('Full name: Fill in this field.');
    expect(document.activeElement).toBe(name);
    expect(name.getAttribute('aria-invalid')).toBe('true');
    const status = screen.getByRole('status');
    expect(status.textContent?.trim()).toBe('Fix 2 fields to send the form');
    expect(summary?.getAttribute('role')).toBeNull();
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('a summary link moves focus to its field', async () => {
    render(<Contact />);
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    const link = screen.getAllByRole('link')[1];
    if (!link) throw new Error('no link');
    await userEvent.click(link);
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Email' }));
  });

  it('a fix removes the error at once, a change never adds one, and the values are kept', async () => {
    render(<Contact />);
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    const name = screen.getByRole('textbox', { name: 'Full name' });
    await userEvent.type(name, 'Sara');
    expect(name.getAttribute('aria-invalid')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    await userEvent.type(screen.getByRole('textbox', { name: 'Note' }), 'x');
    expect(screen.getByRole('textbox', { name: 'Note' }).getAttribute('aria-invalid')).toBeNull();
    expect((name as HTMLInputElement).value).toBe('Sara');
  });

  it('runs custom validators and the browser constraint check', async () => {
    const onErrors = vi.fn();
    render(
      <Contact
        onErrors={onErrors}
        validators={{ name: (v) => (v === 'x' ? 'Use your full name.' : undefined) }}
      />,
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Full name' }), 'x');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'not an email');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    const errors = onErrors.mock.calls[0]?.[0] as Record<string, string>;
    expect(errors.name).toBe('Use your full name.');
    expect(errors.email).toBeTruthy();
  });

  it('submits the values, sets submitting then submitted', async () => {
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn((_values: unknown) => new Promise<void>((r) => (finish = r)));
    const { container } = render(<Contact onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Full name' }), 'Sara');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'sara@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ name: 'Sara', email: 'sara@example.com', note: '' });
    expect(root(container).getAttribute('data-state')).toBe('submitting');
    expect(root(container).getAttribute('aria-busy')).toBe('true');
    expect(container.querySelector('[type="submit"]')?.hasAttribute('data-loading')).toBe(true);
    expect(container.querySelector('[data-part="success-mark"]')).toBeNull();
    await act(async () => finish());
    expect(root(container).getAttribute('data-state')).toBe('submitted');
    // form-submit-success (order 1.23): a decorative mark draws after the buttons.
    const mark = container.querySelector('[data-part="actions"] > [data-part="success-mark"]');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(mark?.querySelectorAll('[pathLength="1"]')).toHaveLength(2);
  });

  it('Enter in a single line field submits', async () => {
    const onSubmit = vi.fn();
    render(<Contact onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Full name' }), 'Sara');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'sara@example.com{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('maps server errors returned by onSubmit by field name; the rest go to the summary', async () => {
    const onSubmit = () => Promise.resolve({ errors: [{ field: 'email', message: 'Email taken.' }, { message: 'Try again soon.' }] });
    const { container } = render(<Contact onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Full name' }), 'Sara');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'sara@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    const summary = root(container).querySelector('[data-part="summary"]');
    expect(summary?.textContent).toContain('Try again soon.');
    expect(summary?.textContent).toContain('Fix 1 field to send the form');
    expect(summary?.querySelectorAll('a')).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Email' }));
    expect(root(container).getAttribute('data-state')).toBe('idle');
  });

  it('shows serverErrors from the page without moving focus', () => {
    const { container } = render(<Contact serverErrors={{ email: 'Email taken.' }} />);
    expect(screen.getByRole('textbox', { name: 'Email' }).getAttribute('aria-invalid')).toBe('true');
    expect(root(container).querySelector('[data-part="summary"]')?.textContent).toContain('Fix 1 field to send the form');
    expect(document.activeElement).toBe(document.body);
  });

  it('a required Checkbox counts, and focus goes to its visible control', async () => {
    const onErrors = vi.fn();
    render(
      <Form onErrors={onErrors} actions={<FormSubmit>Create account</FormSubmit>}>
        <Checkbox name="terms" label="I agree to the terms" required />
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(onErrors).toHaveBeenCalledWith({ terms: 'Tick this box to go on.' });
    expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'I agree to the terms' }));
  });

  it('skips controls in a disabled Fieldset and read only controls', async () => {
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit} actions={<FormSubmit>Save profile</FormSubmit>}>
        <Fieldset legend="Billing" disabled>
          <FormField name="company" label="Company" required>
            <Input name="company" />
          </FormField>
        </Fieldset>
        <FormField name="ref" label="Reference" required readOnly>
          <Input name="ref" />
        </FormField>
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('with only form messages, focus moves to the summary after it renders', async () => {
    const { container } = render(<Contact onSubmit={() => ({ form: 'The server is busy. Send the form again in a minute.' })} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Full name' }), 'Sara');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'sara@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    const summary = root(container).querySelector('[data-part="summary"]');
    expect(summary?.textContent).toContain('The form was not sent');
    expect(document.activeElement).toBe(summary);
  });

  it('when onSubmit throws, the summary says the form was not sent', async () => {
    const { container } = render(
      <Contact
        onSubmit={() => {
          throw new Error('offline');
        }}
      />,
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Full name' }), 'Sara');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'sara@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(root(container).querySelector('[data-part="summary"]')?.textContent).toContain('Could not send the form');
    expect(root(container).getAttribute('data-state')).toBe('idle');
  });

  it('an inline serverErrors object survives a parent render, and a fix still removes its error', async () => {
    const { rerender } = render(<Contact serverErrors={{ name: 'Use your full name.' }} />);
    const name = screen.getByRole('textbox', { name: 'Full name' });
    expect(name.getAttribute('aria-invalid')).toBe('true');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    await userEvent.type(name, 'Sara');
    expect(name.getAttribute('aria-invalid')).toBeNull();
    rerender(<Contact serverErrors={{ name: 'Use your full name.' }} />);
    expect(name.getAttribute('aria-invalid')).toBeNull();
    rerender(<Contact serverErrors={{ name: 'Name taken.' }} />);
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('status').textContent?.trim()).toBe('Fix 1 field to send the form');
  });

  it('reset clears the errors', async () => {
    const { container } = render(<Contact />);
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    fireEvent.reset(root(container));
    expect(root(container).hasAttribute('data-invalid')).toBe(false);
  });

  it('size, orientation and Arabic copy', async () => {
    const { container } = render(
      <Theme lang="ar">
        <Form size="lg" orientation="horizontal" actions={<FormSubmit>إرسال الطلب</FormSubmit>}>
          <FormField name="name" label="الاسم" required>
            <Input name="name" />
          </FormField>
        </Form>
      </Theme>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(container.querySelector('[data-ds="field"]')?.getAttribute('data-orientation')).toBe('horizontal');
    await userEvent.click(screen.getByRole('button', { name: 'إرسال الطلب' }));
    expect(el.querySelector('[data-part="summary"]')?.textContent).toContain('حقل واحد يحتاج تصحيح قبل الإرسال');
  });

  it('a constraint failure uses the Form copy in the page language, never the browser message', async () => {
    const onErrors = vi.fn();
    render(
      <Theme lang="ar">
        <Form onErrors={onErrors} actions={<FormSubmit>حفظ</FormSubmit>}>
          <FormField name="email" label="البريد">
            <Input name="email" type="email" defaultValue="sara" />
          </FormField>
          <FormField name="seats" label="المقاعد">
            <Input name="seats" type="number" min="1" defaultValue="0" />
          </FormField>
          <FormField name="postal" label="الرمز البريدي">
            <Input name="postal" pattern="[0-9]{5}" defaultValue="12" />
          </FormField>
        </Form>
      </Theme>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'حفظ' }));
    expect(onErrors).toHaveBeenCalledWith({
      email: 'اكتب بريد إلكتروني صحيح، مثل name@example.com.',
      seats: 'اكتب 1 أو أكثر.',
      postal: 'راجع صيغة القيمة في الحقل هذا.',
    });
  });

  it('a validator message wins over the generic pattern copy, so it can name the format', async () => {
    const onErrors = vi.fn();
    render(
      <Form
        onErrors={onErrors}
        validators={{ postal: (v) => (v === '12' ? 'Enter the 5 digit postal code.' : undefined) }}
        actions={<FormSubmit>Save address</FormSubmit>}
      >
        <FormField name="postal" label="Postal code">
          <Input name="postal" pattern="[0-9]{5}" defaultValue="12" />
        </FormField>
        <FormField name="site" label="Website">
          <Input name="site" type="url" defaultValue="example" />
        </FormField>
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save address' }));
    expect(onErrors).toHaveBeenCalledWith({ postal: 'Enter the 5 digit postal code.', site: 'Enter a web address that starts with https://.' });
  });

  it('a required radio group with nothing picked asks to pick an option', async () => {
    const onErrors = vi.fn();
    render(
      <Form onErrors={onErrors} actions={<FormSubmit>Book table</FormSubmit>}>
        <Fieldset legend="Seating">
          <label>
            <input type="radio" name="seat" value="in" required /> Inside
          </label>
          <label>
            <input type="radio" name="seat" value="out" /> Outside
          </label>
        </Fieldset>
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Book table' }));
    expect(onErrors).toHaveBeenCalledWith({ seat: 'Pick one option to go on.' });
  });

  it('a validator on a checkbox group names the group in the summary and shows in the Fieldset error part', async () => {
    const { container } = render(
      <Form validators={{ reach: (v) => (v === undefined ? 'Pick at least one way to reach you.' : undefined) }} actions={<FormSubmit>Save contact</FormSubmit>}>
        <Fieldset legend="How should we reach you" name="reach">
          <Checkbox name="reach" value="email" label="Email" />
          <Checkbox name="reach" value="text" label="Text message" />
        </Fieldset>
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save contact' }));
    const link = root(container).querySelector('[data-part="summary"] a');
    expect(link?.textContent).toBe('How should we reach you: Pick at least one way to reach you.');
    const group = screen.getByRole('group', { name: 'How should we reach you' });
    const error = group.querySelector('[data-part="error"]');
    expect(error?.textContent).toBe('Pick at least one way to reach you.');
    expect(group.getAttribute('aria-describedby')).toContain(error?.id ?? 'missing');
    expect(group.hasAttribute('data-invalid')).toBe(true);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Text message' }));
    expect(group.querySelector('[data-part="error"]')).toBeNull();
  });

  it('announces a submit that passes', async () => {
    render(<Contact onSubmit={() => undefined} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Full name' }), 'Sara');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'sara@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(screen.getByRole('status').textContent?.trim()).toBe('The form was sent.');
  });

  it('the demo postal code says which format it wants', async () => {
    render(<FormDemo />);
    const many = document.querySelector('[data-demo-case="many"]');
    const postal = many?.querySelector<HTMLInputElement>('input[name="postal"]');
    if (!postal) throw new Error('no postal field');
    const form = postal.closest('form');
    if (!form) throw new Error('no form');
    await userEvent.type(postal, '12');
    await userEvent.click(form.querySelector<HTMLElement>('[type="submit"]') ?? form);
    expect(form.querySelector('[data-part="summary"]')?.textContent).toContain('Postal code: Enter the 5 digit postal code.');
  });

  it('renders every demo case', () => {
    const { container } = render(<FormDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((n) => n.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly', 'dialog']);
  });
});
