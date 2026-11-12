import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../Button/Button';
import { Field } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { Input } from '../Input/Input';
import { SearchField } from '../SearchField/SearchField';
import InputGroupDemo from './InputGroup.demo';
import { InputGroup, InputGroupAddon } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="input-group"]');
  if (!el) throw new Error('no input group root');
  return el;
}

describe('InputGroup', () => {
  it('renders a group root with the default axes', () => {
    const { container } = render(
      <InputGroup aria-label="Price">
        <InputGroupAddon>SAR</InputGroupAddon>
        <Input aria-label="Price" />
      </InputGroup>,
    );
    const group = root(container);
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('data-size')).toBe('md');
    expect(group.getAttribute('data-shape')).toBe('default');
    expect(group.hasAttribute('data-invalid')).toBe(false);
    expect(group.hasAttribute('data-disabled')).toBe(false);
  });

  it('stamps the control, addon and action parts', () => {
    const { container } = render(
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <Input aria-label="Address" />
        <Button>Copy link</Button>
        <IconButton icon="external" label="Open link" />
      </InputGroup>,
    );
    const group = root(container);
    const parts = Array.from(group.children).map((el) => el.getAttribute('data-part'));
    expect(parts).toEqual(['addon', 'control', 'action', 'action']);
    expect(group.children[1]?.getAttribute('data-ds')).toBe('input');
  });

  it('passes size and shape to children that leave them unset', () => {
    const { container } = render(
      <InputGroup size="lg" shape="pill">
        <Input aria-label="Address" />
        <Button size="sm">Copy link</Button>
      </InputGroup>,
    );
    const [control, action] = Array.from(root(container).children);
    expect(control?.getAttribute('data-size')).toBe('lg');
    expect(control?.getAttribute('data-shape')).toBe('pill');
    expect(action?.getAttribute('data-size')).toBe('sm');
    expect(action?.getAttribute('data-shape')).toBe('pill');
  });

  it('links add on text as a description of the control, not its name', () => {
    render(
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <Input aria-label="Address" aria-describedby="hint" />
        <InputGroupAddon id="tld">.example.com</InputGroupAddon>
      </InputGroup>,
    );
    const input = screen.getByRole('textbox', { name: 'Address' });
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(3);
    expect(ids).toContain('tld');
    expect(ids.at(-1)).toBe('hint');
    expect(document.getElementById(ids[0] ?? '')?.textContent).toBe('https://');
  });

  it('marks invalid and disabled, and passes them on', () => {
    const { container } = render(
      <InputGroup invalid disabled>
        <Input aria-label="Address" />
        <Button>Check address</Button>
      </InputGroup>,
    );
    const group = root(container);
    expect(group.hasAttribute('data-invalid')).toBe(true);
    expect(group.hasAttribute('data-disabled')).toBe(true);
    const input = screen.getByRole('textbox', { name: 'Address' }) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('button', { name: 'Check address' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('follows the Field', () => {
    const { container } = render(
      <Field label="Workspace" error="Use only letters." disabled>
        <InputGroup>
          <Input />
          <Button>Check address</Button>
        </InputGroup>
      </Field>,
    );
    const group = root(container);
    expect(group.hasAttribute('data-invalid')).toBe(true);
    expect(group.hasAttribute('data-disabled')).toBe(true);
    const input = screen.getByRole('textbox', { name: 'Workspace' });
    expect(input.getAttribute('aria-describedby')).toContain(screen.getByText('Use only letters.').closest('[data-part="error"]')?.id);
    expect(screen.getByRole('button', { name: 'Check address' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('mirrors read only from the Field', () => {
    const { container } = render(
      <Field label="Board link" readOnly>
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <Input />
        </InputGroup>
      </Field>,
    );
    expect(root(container).hasAttribute('data-readonly')).toBe(true);
    expect((screen.getByRole('textbox', { name: 'Board link' }) as HTMLInputElement).readOnly).toBe(true);
  });

  it('takes a SearchField as the control', () => {
    const { container } = render(
      <InputGroup size="sm">
        <SearchField aria-label="Search boards" />
        <Button>Search</Button>
      </InputGroup>,
    );
    const control = root(container).children[0];
    expect(control?.getAttribute('data-ds')).toBe('search-field');
    expect(control?.getAttribute('data-part')).toBe('control');
    expect(control?.getAttribute('data-size')).toBe('sm');
  });

  it('renders the demo with every case', () => {
    const { container } = render(<InputGroupDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']);
  });
});
