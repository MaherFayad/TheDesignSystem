import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from '../Checkbox/Checkbox';
import CheckboxGroupDemo from './CheckboxGroup.demo';
import { CheckboxGroup } from './index';

function group(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="checkbox-group"]');
  if (!el) throw new Error('no checkbox group root');
  return el;
}

const items = (
  <>
    <Checkbox value="email" label="Email" />
    <Checkbox value="push" label="Push" />
    <Checkbox value="sms" label="Text" />
  </>
);

describe('CheckboxGroup', () => {
  it('renders a fieldset named by its legend, with the parts in order', () => {
    const { container } = render(
      <CheckboxGroup legend="Channels" description="Pick one or more." error="Pick at least one.">
        {items}
      </CheckboxGroup>,
    );
    const root = group(container);
    expect(root.tagName).toBe('FIELDSET');
    expect(screen.getByRole('group', { name: 'Channels' })).toBe(root);
    const parts = [...root.children].map((el) => el.getAttribute('data-part'));
    expect(parts).toEqual(['legend', 'description', 'items', 'error']);
    expect(root.getAttribute('data-size')).toBe('md');
    expect(root.getAttribute('data-orientation')).toBe('vertical');
    expect(root.hasAttribute('data-invalid')).toBe(true);
    const ids = (root.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(['Pick one or more.', 'Pick at least one.']);
    for (const box of screen.getAllByRole('checkbox')) expect(box.getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps one value array and calls onValueChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup legend="Channels" defaultValue={['push']} onValueChange={onChange} name="channels">
        {items}
      </CheckboxGroup>,
    );
    expect(screen.getByRole('checkbox', { name: 'Push' }).getAttribute('aria-checked')).toBe('true');
    screen.getByRole('checkbox', { name: 'Email' }).focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(['push', 'email']);
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(['push']);
    await user.click(screen.getByRole('checkbox', { name: 'Email' }));
    expect(onChange).toHaveBeenLastCalledWith(['push', 'email']);
    await user.click(screen.getByRole('checkbox', { name: 'Push' }));
    expect(onChange).toHaveBeenLastCalledWith(['email']);
  });

  it('follows a controlled value', () => {
    const { rerender } = render(
      <CheckboxGroup legend="Channels" value={[]}>
        {items}
      </CheckboxGroup>,
    );
    expect(screen.getByRole('checkbox', { name: 'Text' }).getAttribute('aria-checked')).toBe('false');
    rerender(
      <CheckboxGroup legend="Channels" value={['sms']}>
        {items}
      </CheckboxGroup>,
    );
    expect(screen.getByRole('checkbox', { name: 'Text' }).getAttribute('aria-checked')).toBe('true');
  });

  it('select all is indeterminate when some are checked, and checks or clears all', async () => {
    const user = userEvent.setup();
    render(
      <CheckboxGroup legend="Channels" selectAll="All channels" defaultValue={['email']}>
        {items}
      </CheckboxGroup>,
    );
    const all = screen.getByRole('checkbox', { name: 'All channels' });
    expect(all.getAttribute('aria-checked')).toBe('mixed');
    expect(all.closest('[data-ds="checkbox"]')?.getAttribute('data-part')).toBe('select-all');
    await user.click(all);
    expect(all.getAttribute('aria-checked')).toBe('true');
    for (const name of ['Email', 'Push', 'Text']) {
      expect(screen.getByRole('checkbox', { name }).getAttribute('aria-checked')).toBe('true');
    }
    await user.click(all);
    expect(all.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('checkbox', { name: 'Email' }).getAttribute('aria-checked')).toBe('false');
  });

  it('passes size, disabled and read only to the items', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CheckboxGroup legend="Channels" size="lg" disabled orientation="horizontal">
        {items}
      </CheckboxGroup>,
    );
    expect(group(container).hasAttribute('data-disabled')).toBe(true);
    expect(group(container).getAttribute('data-orientation')).toBe('horizontal');
    for (const root of container.querySelectorAll('[data-ds="checkbox"]')) {
      expect(root.getAttribute('data-size')).toBe('lg');
      expect(root.hasAttribute('data-disabled')).toBe(true);
    }
    const ro = render(
      <CheckboxGroup legend="Fixed" readOnly defaultValue={['email']}>
        <Checkbox value="email" label="Fixed email" />
      </CheckboxGroup>,
    );
    const box = screen.getByRole('checkbox', { name: 'Fixed email' });
    await user.click(box);
    expect(box.getAttribute('aria-checked')).toBe('true');
    expect(ro.container.querySelector('[data-ds="checkbox-group"]')?.hasAttribute('data-readonly')).toBe(true);
  });

  it('hides the error when invalid is false', () => {
    const { container } = render(
      <CheckboxGroup legend="Channels" error="Pick one." invalid={false}>
        {items}
      </CheckboxGroup>,
    );
    expect(container.querySelector('[data-part="error"]')).toBeNull();
    expect(group(container).hasAttribute('data-invalid')).toBe(false);
  });

  it('renders the demo with every case', () => {
    const { container } = render(<CheckboxGroupDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });
});
