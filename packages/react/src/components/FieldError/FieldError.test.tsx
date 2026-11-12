import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../Input/Input';
import FieldErrorDemo from './FieldError.demo';
import { FieldError } from './index';

function root(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('[data-ds="field-error"]');
}

describe('FieldError', () => {
  it('renders the anatomy with the default size and no part of a parent when alone', () => {
    const { container } = render(<FieldError id="e">Add a name.</FieldError>);
    const el = root(container);
    expect(el?.tagName).toBe('P');
    expect(el?.id).toBe('e');
    expect(el?.getAttribute('data-size')).toBe('md');
    expect(el?.hasAttribute('data-part')).toBe(false);
    const icon = el?.querySelector('[data-part="icon"]');
    expect(icon?.getAttribute('data-icon')).toBe('danger');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.getAttribute('data-size')).toBe('md');
    expect(el?.querySelector('[data-part="message"]')?.textContent).toBe('Add a name.');
  });

  it('size sm takes the small icon', () => {
    const { container } = render(<FieldError size="sm">Use 1 px or more.</FieldError>);
    expect(root(container)?.getAttribute('data-size')).toBe('sm');
    expect(root(container)?.querySelector('[data-part="icon"]')?.getAttribute('data-size')).toBe('sm');
  });

  it('renders nothing without a message', () => {
    for (const empty of [undefined, null, false, '']) {
      const { container } = render(<FieldError>{empty}</FieldError>);
      expect(root(container)).toBeNull();
    }
  });

  it('is never a live region or an alert', () => {
    const { container } = render(<FieldError>Add a name.</FieldError>);
    expect(root(container)?.getAttribute('role')).toBeNull();
    expect(root(container)?.getAttribute('aria-live')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('alone, describes the control it is pointed at', () => {
    render(
      <>
        <Input aria-label="Board name" invalid aria-describedby="err" />
        <FieldError id="err">Add a name, so people can find the board.</FieldError>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Board name' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Add a name, so people can find the board.');
  });

  it('renders the demo with every case that applies', () => {
    const { container } = render(<FieldErrorDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [lang="ar"] [data-ds="field-error"]')).not.toBeNull();
    expect(container.querySelector('[data-demo-case="empty"] [data-ds="field-error"]')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[title]')).toBeNull();
  });
});
