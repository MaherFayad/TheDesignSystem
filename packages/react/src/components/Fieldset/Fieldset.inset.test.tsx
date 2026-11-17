// Order M9.1: Fieldset variant inset, the grouped card of field rows.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field, FieldLabel } from '../Field/Field';
import { Input } from '../Input/Input';
import FieldsetDemo from './Fieldset.demo';
import { Fieldset } from './index';

describe('Fieldset inset (order M9.1)', () => {
  it('stamps data-variant only when passed', () => {
    const { container, rerender } = render(
      <Fieldset legend="Contact details">
        <Field label="Name">
          <Input />
        </Field>
      </Fieldset>,
    );
    const root = () => container.querySelector('[data-ds="fieldset"]') as HTMLElement;
    expect(root().hasAttribute('data-variant')).toBe(false);
    rerender(
      <Fieldset legend="Contact details" variant="inset">
        <Field label="Name">
          <Input variant="plain" />
        </Field>
      </Fieldset>,
    );
    expect(root().getAttribute('data-variant')).toBe('inset');
  });

  it('keeps the DOM order and the group wiring: legend, description, error, body', () => {
    const { container } = render(
      <Fieldset variant="inset" legend="Contact details" description="We use these only to reach you." error="Add a way to reach you.">
        <Field label="Email">
          <Input variant="plain" type="email" />
        </Field>
      </Fieldset>,
    );
    const root = container.querySelector('[data-ds="fieldset"]') as HTMLElement;
    const parts = Array.from(root.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['legend', 'description', 'error', 'body']);
    const group = screen.getByRole('group', { name: 'Contact details' });
    const ids = (group.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(2);
  });

  it('keeps a visually hidden label as the name of a row', () => {
    render(
      <Fieldset variant="inset" legend="Board">
        <Field>
          <FieldLabel data-visually-hidden="">Board name</FieldLabel>
          <Input variant="plain" placeholder="For example, spring launch" />
        </Field>
      </Fieldset>,
    );
    const input = screen.getByRole('textbox', { name: 'Board name' });
    expect(input.closest('[data-ds="input"]')?.getAttribute('data-variant')).toBe('plain');
  });

  it('renders the inset demo with three rows, one empty, in English and Arabic', () => {
    const { container } = render(<FieldsetDemo />);
    const inset = container.querySelector('[data-demo-case="inset"] [data-ds="fieldset"][data-variant="inset"]') as HTMLElement;
    const rows = inset.querySelectorAll(':scope > [data-part="body"] > [data-ds="field"]');
    expect(rows).toHaveLength(3);
    const empty = inset.querySelectorAll('[data-ds="input"][data-empty]');
    expect(empty).toHaveLength(1);
    const arabic = container.querySelector('[data-demo-case="long-arabic"] [data-ds="fieldset"][data-variant="inset"]');
    expect(arabic?.closest('[lang]')?.getAttribute('lang')).toBe('ar');
    // The clear buttons show only while a row has focus.
    expect(container.querySelector('[data-part="clear"]')).toBeNull();
  });
});
