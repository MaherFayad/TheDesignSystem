import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme';
import { Input } from '../Input/Input';
import LabelDemo from './Label.demo';
import { Label } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="label"]');
  if (!el) throw new Error('no label rendered');
  return el;
}

describe('Label', () => {
  it('renders a native label with the default axes and no state', () => {
    const { container } = render(<Label htmlFor="name">Board name</Label>);
    const el = root(container);
    expect(el.tagName).toBe('LABEL');
    expect(el.getAttribute('for')).toBe('name');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('data-disabled')).toBe(false);
    expect(el.hasAttribute('data-invalid')).toBe(false);
    expect(el.querySelector('[data-part]')).toBeNull();
  });

  it('sets size, disabled and invalid from props', () => {
    const { container } = render(
      <Label size="sm" disabled invalid>
        Width
      </Label>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-disabled')).toBe('');
    expect(el.getAttribute('data-invalid')).toBe('');
  });

  it('names the control and a click on it focuses the control', async () => {
    render(
      <>
        <Label htmlFor="board">Board name</Label>
        <Input id="board" />
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Board name' });
    await userEvent.click(screen.getByText('Board name'));
    expect(document.activeElement).toBe(input);
  });

  it('outside a Field, required adds an aria-hidden mark and the word required to the name', () => {
    const { container } = render(
      <>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input id="email" />
      </>,
    );
    const mark = root(container).querySelector('[data-part="required"]');
    expect(mark?.querySelector('[aria-hidden="true"]')?.textContent).toBe('*');
    expect(screen.getByRole('textbox', { name: /^Email ?required$/ })).toBeTruthy();
  });

  it('the required word follows Arabic and can be replaced', () => {
    render(
      <Theme lang="ar">
        <Label htmlFor="a" required>
          البريد
        </Label>
        <Input id="a" />
        <Label htmlFor="b" required requiredText="must be filled">
          Name
        </Label>
        <Input id="b" />
      </Theme>,
    );
    expect(screen.getByRole('textbox', { name: /^البريد ?مطلوب$/ })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /^Name ?must be filled$/ })).toBeTruthy();
  });

  it('shows the optional text, and never together with required', () => {
    const { container } = render(<Label optional="Optional">Company</Label>);
    expect(root(container).querySelector('[data-part="optional"]')?.textContent).toBe('Optional');
    const both = render(
      <Label optional="Optional" required>
        Company
      </Label>,
    );
    expect(root(both.container).querySelector('[data-part="optional"]')).toBeNull();
  });

  it('names a control it wraps, with no htmlFor', async () => {
    render(
      <Label>
        Board name
        <Input />
      </Label>,
    );
    const input = screen.getByRole('textbox', { name: 'Board name' });
    await userEvent.click(screen.getByText('Board name'));
    expect(document.activeElement).toBe(input);
  });

  it('renders the demo with every case that applies', () => {
    const { container } = render(<LabelDemo />);
    for (const id of ['variants', 'one', 'many', 'long-text', 'long-arabic', 'error', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [lang="ar"] [data-ds="label"]')).not.toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[title]')).toBeNull();
  });

  it('says required in Arabic under a regional Arabic tag', () => {
    render(
      <Theme lang="ar-SA">
        <Label htmlFor="mail" required>
          البريد
        </Label>
        <input id="mail" />
      </Theme>,
    );
    expect(document.body.textContent).toContain('مطلوب');
  });
});
