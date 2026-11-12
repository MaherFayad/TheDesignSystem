import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../Input/Input';
import { Label } from '../Label/Label';
import FieldDemo from './Field.demo';
import { Field, FieldDescription, FieldError, FieldLabel, useFieldControl } from './index';

function describedBy(el: HTMLElement): string[] {
  return (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
}

function textOf(ids: string[]): string[] {
  return ids.map((id) => document.getElementById(id)?.textContent ?? '');
}

describe('Field', () => {
  it('binds the label to the control by role and name', () => {
    render(
      <Field label="Board name">
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Board name' });
    const label = document.querySelector('[data-part="label"]');
    expect(label?.tagName).toBe('LABEL');
    expect(label?.getAttribute('for')).toBe(input.id);
  });

  it('stamps the root attributes', () => {
    const { container } = render(
      <Field label="Name" orientation="horizontal" invalid disabled readOnly>
        <Input />
      </Field>,
    );
    const root = container.querySelector('[data-ds="field"]');
    expect(root?.getAttribute('data-orientation')).toBe('horizontal');
    expect(root?.hasAttribute('data-invalid')).toBe(true);
    expect(root?.hasAttribute('data-disabled')).toBe(true);
    expect(root?.hasAttribute('data-readonly')).toBe(true);
    const plain = render(
      <Field label="Other">
        <Input />
      </Field>,
    ).container.querySelector('[data-ds="field"]');
    expect(plain?.getAttribute('data-orientation')).toBe('vertical');
    expect(plain?.hasAttribute('data-invalid')).toBe(false);
  });

  it('wires the description and the error into aria-describedby, in that order', () => {
    render(
      <Field label="Email" description="Sign in links go here." error="Add the part after the @.">
        <Input aria-describedby="extra" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    const ids = describedBy(input);
    expect(ids).toHaveLength(3);
    expect(textOf(ids.slice(0, 2))).toEqual(['Sign in links go here.', 'Add the part after the @.']);
    expect(ids[2]).toBe('extra');
  });

  it('marks the control invalid while an error shows, and the error is not an alert', () => {
    const { container } = render(
      <Field label="Email" error="Add the part after the @.">
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const error = container.querySelector('[data-part="error"]');
    expect(error?.getAttribute('role')).toBeNull();
    expect(error?.getAttribute('aria-live')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container.querySelector('[data-ds="input"]')?.hasAttribute('data-invalid')).toBe(true);
  });

  it('hides the error when invalid is false, and renders no empty error', () => {
    const { container } = render(
      <Field label="Email" invalid={false} error="Add the part after the @.">
        <Input />
      </Field>,
    );
    expect(container.querySelector('[data-part="error"]')).toBeNull();
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBeNull();
    const empty = render(
      <Field invalid>
        <FieldLabel>Name</FieldLabel>
        <Input />
        <FieldError />
      </Field>,
    );
    expect(empty.container.querySelector('[data-part="error"]')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Name' }).getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('textbox', { name: 'Name' }).getAttribute('aria-describedby')).toBeNull();
  });

  it('passes disabled and read only to the control', () => {
    render(
      <>
        <Field label="Off" disabled>
          <Input />
        </Field>
        <Field label="Fixed" readOnly>
          <Input defaultValue="ws_1" />
        </Field>
      </>,
    );
    const off = screen.getByRole('textbox', { name: 'Off' }) as HTMLInputElement;
    expect(off.disabled).toBe(true);
    const fixed = screen.getByRole('textbox', { name: 'Fixed' }) as HTMLInputElement;
    expect(fixed.readOnly).toBe(true);
    expect(fixed.disabled).toBe(false);
  });

  it('shows a required mark that is hidden from the name, and sets aria-required', () => {
    const { container } = render(
      <Field label="Email" required>
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.hasAttribute('required')).toBe(false);
    const mark = container.querySelector('[data-part="required"]');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(mark?.textContent).toBe('*');
  });

  it('works with the compound parts and a control id of its own', () => {
    render(
      <Field>
        <FieldLabel>Board size</FieldLabel>
        <Input id="size" />
        <FieldDescription>The width of the first frame.</FieldDescription>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Board size' });
    expect(input.id).toBe('size');
    expect(textOf(describedBy(input))).toEqual(['The width of the first frame.']);
  });

  it('useFieldControl returns the wiring for any control, and own values win', () => {
    function Probe() {
      const props = useFieldControl({ disabled: false });
      return <textarea {...props} />;
    }
    render(
      <Field label="Notes" description="Kept private." disabled invalid required>
        <Probe />
      </Field>,
    );
    const area = screen.getByRole('textbox', { name: 'Notes' }) as HTMLTextAreaElement;
    expect(area.disabled).toBe(false);
    expect(area.getAttribute('aria-invalid')).toBe('true');
    expect(area.getAttribute('aria-required')).toBe('true');
    expect(textOf(describedBy(area))).toEqual(['Kept private.']);
  });

  it('outside a Field the hook returns the own values only', () => {
    function Probe() {
      return <input aria-label="Alone" {...useFieldControl({ invalid: true })} />;
    }
    render(<Probe />);
    const input = screen.getByRole('textbox', { name: 'Alone' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(input.id).toBe('');
  });

  describe('bring up: Label and FieldError as parts', () => {
    it('inside a Field the mark alone is aria-hidden and the control carries aria-required', () => {
      const { container } = render(
        <Field label="Email" required>
          <Input />
        </Field>,
      );
      const input = screen.getByRole('textbox', { name: 'Email' });
      expect(input.getAttribute('aria-required')).toBe('true');
      const mark = container.querySelector('[data-ds="label"] > [data-part="required"]');
      expect(mark?.getAttribute('aria-hidden')).toBe('true');
      expect(mark?.textContent).toBe('*');
    });

    it('follows the Field state, and own values win', () => {
      const { container } = render(
        <Field label="Name" disabled invalid>
          <Input />
        </Field>,
      );
      const el = container.querySelector('[data-ds="label"]') as HTMLElement;
      expect(el.getAttribute('data-part')).toBe('label');
      expect(el.hasAttribute('data-disabled')).toBe(true);
      expect(el.hasAttribute('data-invalid')).toBe(true);
      const own = render(
        <Field disabled>
          <Label disabled={false}>Other</Label>
          <Input />
        </Field>,
      );
      expect((own.container.querySelector('[data-ds="label"]') as HTMLElement).hasAttribute('data-disabled')).toBe(false);
    });

    it('the required mark inside a Field that is not required keeps the word, so it is never a lone asterisk', () => {
      render(
        <Field>
          <Label htmlFor="em" required>
            Email
          </Label>
          <Input id="em" />
        </Field>,
      );
      expect(screen.getByRole('textbox', { name: /^Email ?required$/ })).toBeTruthy();
    });

    it('renders FieldError as the error part, with its own anatomy', () => {
      const { container } = render(
        <Field label="Email" error="Add the part after the @.">
          <Input />
        </Field>,
      );
      const error = container.querySelector('[data-part="error"]');
      expect(error?.getAttribute('data-ds')).toBe('field-error');
      expect(error?.querySelector('[data-part="icon"]')).not.toBeNull();
      expect(error?.querySelector('[data-part="message"]')?.textContent).toBe('Add the part after the @.');
      expect(container.querySelector('[data-part="label"]')?.getAttribute('data-ds')).toBe('label');
    });
  });

  it('renders the demo with every content case', () => {
    const { container } = render(<FieldDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[title]')).toBeNull();
  });
});
