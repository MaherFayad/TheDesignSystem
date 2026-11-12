import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox } from '../Checkbox/Checkbox';
import { Field } from '../Field/Field';
import { Form, FormSubmit } from '../Form/Form';
import { Input } from '../Input/Input';
import FieldsetDemo from './Fieldset.demo';
import { Fieldset } from './index';

function root(container: HTMLElement): HTMLFieldSetElement {
  const el = container.querySelector<HTMLFieldSetElement>('[data-ds="fieldset"]');
  if (!el) throw new Error('no fieldset rendered');
  return el;
}

function describedBy(el: HTMLElement): string[] {
  return (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
}

describe('Fieldset', () => {
  it('is a native fieldset named by its legend, with the default axes', () => {
    const { container } = render(
      <Fieldset legend="Delivery address">
        <Field label="City">
          <Input />
        </Field>
      </Fieldset>,
    );
    const el = root(container);
    expect(el.tagName).toBe('FIELDSET');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-invalid')).toBe(false);
    expect(el.hasAttribute('data-disabled')).toBe(false);
    expect(el.disabled).toBe(false);
    expect(screen.getByRole('group', { name: 'Delivery address' })).toBe(el);
    const legend = el.querySelector('[data-part="legend"]');
    expect(legend?.tagName).toBe('LEGEND');
    expect(el.querySelector('[data-part="body"]')?.contains(screen.getByRole('textbox', { name: 'City' }))).toBe(true);
    expect(el.getAttribute('aria-describedby')).toBeNull();
    expect(el.querySelector('[data-part="description"]')).toBeNull();
    expect(el.querySelector('[data-part="error"]')).toBeNull();
  });

  it('the first field sits in the group the legend names', () => {
    render(
      <Fieldset legend="Delivery address">
        <Field label="City">
          <Input />
        </Field>
      </Fieldset>,
    );
    const city = screen.getByRole('textbox', { name: 'City' });
    expect(city.closest('fieldset')).toBe(screen.getByRole('group', { name: 'Delivery address' }));
    expect(city.closest('fieldset')?.firstElementChild?.tagName).toBe('LEGEND');
  });

  it('sets the size', () => {
    const { container } = render(
      <Fieldset legend="Contact" size="lg">
        <Checkbox label="Email" />
      </Fieldset>,
    );
    expect(root(container).getAttribute('data-size')).toBe('lg');
  });

  it('wires the description and the error into aria-describedby, then its own', () => {
    const { container } = render(
      <Fieldset legend="Updates" description="Pick what lands in your inbox." error="Pick at least one." aria-describedby="extra">
        <Checkbox label="Email" />
      </Fieldset>,
    );
    const el = root(container);
    const ids = describedBy(el);
    expect(ids).toHaveLength(3);
    expect(document.getElementById(ids[0] ?? '')?.textContent).toBe('Pick what lands in your inbox.');
    expect(document.getElementById(ids[1] ?? '')?.textContent).toBe('Pick at least one.');
    expect(ids[2]).toBe('extra');
    expect(screen.getByRole('group', { name: 'Updates' })).toBe(el);
  });

  it('renders the error as a FieldError root with the error part, above the body, and never as an alert', () => {
    const { container } = render(
      <Fieldset legend="Reach me by" error="Pick at least one way to reach you.">
        <Checkbox label="Email" />
      </Fieldset>,
    );
    const el = root(container);
    const error = el.querySelector('[data-part="error"]');
    expect(error?.getAttribute('data-ds')).toBe('field-error');
    expect(error?.parentElement).toBe(el);
    expect(error?.nextElementSibling?.getAttribute('data-part')).toBe('body');
    expect(el.hasAttribute('data-invalid')).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(error?.getAttribute('aria-live')).toBeNull();
  });

  it('the error context does not reach the fields in the body', () => {
    render(
      <Fieldset legend="Contact" error="Fill one of the two fields.">
        <Input aria-label="Phone" />
      </Fieldset>,
    );
    const input = screen.getByRole('textbox', { name: 'Phone' });
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });

  it('invalid false hides the error; invalid alone marks the group', () => {
    const { container, rerender } = render(
      <Fieldset legend="Contact" error="Fill one of the two fields." invalid={false}>
        <Input aria-label="Phone" />
      </Fieldset>,
    );
    expect(root(container).querySelector('[data-part="error"]')).toBeNull();
    expect(root(container).hasAttribute('data-invalid')).toBe(false);
    rerender(
      <Fieldset legend="Contact" invalid>
        <Input aria-label="Phone" />
      </Fieldset>,
    );
    expect(root(container).hasAttribute('data-invalid')).toBe(true);
    expect(root(container).querySelector('[data-part="error"]')).toBeNull();
  });

  it('native disabled disables every control inside', () => {
    const { container } = render(
      <Fieldset legend="Billing" disabled>
        <Field label="City">
          <Input />
        </Field>
        <Checkbox label="Use for shipping" />
      </Fieldset>,
    );
    const el = root(container);
    expect(el.disabled).toBe(true);
    expect(el.hasAttribute('data-disabled')).toBe(true);
    expect(screen.getByRole('textbox', { name: 'City' }).matches(':disabled')).toBe(true);
    expect(screen.getByRole('checkbox', { name: 'Use for shipping' }).matches(':disabled')).toBe(true);
  });

  it('with name, inside a Form: shows the Form error for that name in the error part', async () => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    const { container } = render(
      <Form validators={{ reach: (v) => (v === undefined ? 'Pick at least one way to reach you.' : undefined) }} actions={<FormSubmit>Save contact</FormSubmit>}>
        <Fieldset legend="How should we reach you" name="reach" error="Unused while the Form has an error.">
          <Checkbox name="reach" value="email" label="Email" />
          <Checkbox name="reach" value="call" label="Phone call" />
        </Fieldset>
      </Form>,
    );
    const el = root(container);
    expect(el.getAttribute('data-name')).toBe('reach');
    expect(el.hasAttribute('name')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Save contact' }));
    const error = el.querySelector('[data-part="error"]');
    expect(error?.textContent).toBe('Pick at least one way to reach you.');
    expect(describedBy(el)).toContain(error?.id);
    expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Email' }));
  });

  it('renders every demo case', () => {
    const { container } = render(<FieldsetDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((n) => n.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });
});
