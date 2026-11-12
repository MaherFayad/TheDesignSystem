import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '../Field/Field';
import PasswordFieldDemo from './PasswordField.demo';
import { PasswordField } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="password-field"]');
  if (!el) throw new Error('no password field root');
  return el;
}

function input(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input') as HTMLInputElement;
}

describe('PasswordField', () => {
  it('renders a hidden password with a toggle', () => {
    const { container } = render(<PasswordField aria-label="Password" />);
    const box = root(container);
    expect(box.getAttribute('data-size')).toBe('md');
    expect(box.getAttribute('data-shape')).toBe('default');
    expect(box.hasAttribute('data-visible')).toBe(false);
    const field = input(container);
    expect(field.type).toBe('password');
    expect(field.getAttribute('autocomplete')).toBe('current-password');
    expect(field.closest('[data-ds="input"]')?.getAttribute('data-part')).toBe('control');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle.getAttribute('data-part')).toBe('toggle');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe(field.id);
  });

  it('shows and hides the value; the name and aria-pressed change and focus stays on the toggle', () => {
    const onVisibleChange = vi.fn();
    const { container } = render(<PasswordField aria-label="Password" defaultValue="abc" onVisibleChange={onVisibleChange} />);
    const toggle = screen.getByRole('button', { name: 'Show password' });
    toggle.focus();
    fireEvent.click(toggle);
    expect(input(container).type).toBe('text');
    expect(root(container).hasAttribute('data-visible')).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');
    expect(document.activeElement).toBe(toggle);
    expect(onVisibleChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(toggle);
    expect(input(container).type).toBe('password');
  });

  it('passes autocomplete through and never blocks paste', () => {
    const { container } = render(<PasswordField aria-label="New password" autoComplete="new-password" />);
    expect(input(container).getAttribute('autocomplete')).toBe('new-password');
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    input(container).dispatchEvent(paste);
    expect(paste.defaultPrevented).toBe(false);
  });

  it('hides the value again when the form submits', () => {
    const { container } = render(
      <form onSubmit={(e) => e.preventDefault()}>
        <PasswordField aria-label="Password" defaultVisible />
      </form>,
    );
    expect(input(container).type).toBe('text');
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(input(container).type).toBe('password');
  });

  it('works controlled', () => {
    const { container, rerender } = render(<PasswordField aria-label="Password" visible={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input(container).type).toBe('password');
    rerender(<PasswordField aria-label="Password" visible />);
    expect(input(container).type).toBe('text');
  });

  it('follows the Field: id, invalid and disabled', () => {
    const { container } = render(
      <Field label="New password" error="Use at least 12 characters." disabled>
        <PasswordField />
      </Field>,
    );
    const box = root(container);
    expect(box.hasAttribute('data-invalid')).toBe(true);
    expect(box.hasAttribute('data-disabled')).toBe(true);
    const field = screen.getByLabelText('New password') as HTMLInputElement;
    expect(field.disabled).toBe(true);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle.getAttribute('aria-controls')).toBe(field.id);
    expect(toggle.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(toggle);
    expect(field.type).toBe('password');
  });

  it('still toggles while read only', () => {
    const { container } = render(<PasswordField aria-label="API key" readOnly defaultValue="k" />);
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input(container).type).toBe('text');
  });

  it('points aria-controls at a custom id outside a Field', () => {
    render(<PasswordField aria-label="Password" id="pw" />);
    expect(screen.getByRole('button', { name: 'Show password' }).getAttribute('aria-controls')).toBe('pw');
  });

  it('calls onVisibleChange(false) on submit when controlled', () => {
    const onVisibleChange = vi.fn();
    const { container } = render(
      <form onSubmit={(e) => e.preventDefault()}>
        <PasswordField aria-label="Password" visible onVisibleChange={onVisibleChange} />
      </form>,
    );
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(onVisibleChange).toHaveBeenCalledWith(false);
  });

  it('sends the ref to the input and className to the root', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(<PasswordField ref={ref} aria-label="Password" name="pw" className="box" />);
    expect(ref.current?.name).toBe('pw');
    expect(root(container).className).toBe('box');
  });

  it('renders the demo cases', () => {
    const { container } = render(<PasswordFieldDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });
});
