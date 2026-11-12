import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import AutocompleteDemo from './Autocomplete.demo';
import { Autocomplete, type AutocompleteProps } from './index';

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => undefined;
  proto.releasePointerCapture ??= () => undefined;
  proto.scrollIntoView ??= () => undefined;
});

const tags = ['Design', 'Design review', 'Research', 'Roadmap'].map((label) => ({ value: label, label }));

function Tag(props: Partial<AutocompleteProps>) {
  return (
    <Field label="Tag">
      <Autocomplete items={tags} {...props} />
    </Field>
  );
}

const input = () => screen.getByRole('combobox', { name: 'Tag' }) as HTMLInputElement;
const root = () => input().closest('[data-ds="autocomplete"]') as HTMLElement;
const popup = () => document.querySelector<HTMLElement>('[data-ds="autocomplete"][data-part="popup"]');
const shown = () => Array.from(popup()?.querySelectorAll('[role="option"]') ?? []).map((o) => o.textContent);

describe('Autocomplete', () => {
  it('renders a field with no trigger and no clear button', () => {
    render(<Tag defaultValue="Roadmap" />);
    expect(root().getAttribute('data-size')).toBe('md');
    expect(root().hasAttribute('data-state')).toBe(false);
    expect(input().value).toBe('Roadmap');
    expect(root().querySelector('[data-part="trigger"], [data-part="clear"]')).toBeNull();
  });

  it('suggests as you type with nothing highlighted, so Enter keeps the typed text', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onValueChange = vi.fn();
    render(<Tag onCommit={onCommit} onValueChange={onValueChange} />);
    await user.type(input(), 'des');
    expect(shown()).toEqual(['Design', 'Design review']);
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('des');
    expect(onValueChange).toHaveBeenLastCalledWith('des');
    expect(input().getAttribute('aria-expanded')).toBe('false');
  });

  it('ArrowDown highlights a suggestion and Enter puts it in the field', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tag onValueChange={onValueChange} />);
    await user.type(input(), 'des');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const id = input().getAttribute('aria-activedescendant');
    expect(id && document.getElementById(id)?.textContent).toBe('Design review');
    await user.keyboard('{Enter}');
    expect(input().value).toBe('Design review');
    expect(onValueChange).toHaveBeenLastCalledWith('Design review');
  });

  it('closes when nothing matches, and keeps any text', async () => {
    const user = userEvent.setup();
    render(<Tag />);
    await user.type(input(), 'A new tag');
    expect(popup()).toBeNull();
    expect(input().getAttribute('aria-expanded')).toBe('false');
    await user.tab();
    expect(input().value).toBe('A new tag');
  });

  it('shows empty when asked, when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Tag empty="No tag like that yet. Press Enter to add it." />);
    await user.type(input(), 'zzz');
    expect(popup()?.querySelector('[data-part="empty"]')?.textContent).toBe('No tag like that yet. Press Enter to add it.');
  });

  it('Escape closes, a second Escape clears the text', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState('');
      return <Tag value={v} onValueChange={setV} />;
    }
    render(<Controlled />);
    await user.type(input(), 're');
    expect(input().getAttribute('aria-expanded')).toBe('true');
    await user.keyboard('{Escape}');
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(input().value).toBe('re');
    await user.keyboard('{Escape}');
    expect(input().value).toBe('');
  });

  it('matches Arabic across alef forms', async () => {
    const user = userEvent.setup();
    render(
      <Theme lang="ar" dir="rtl">
        <Field label="الوسم">
          <Autocomplete items={[{ value: 'access', label: 'إمكانية الوصول' }, { value: 'bug', label: 'خلل' }]} />
        </Field>
      </Theme>,
    );
    await user.type(screen.getByRole('combobox', { name: 'الوسم' }), 'امكانية');
    expect(shown()).toEqual(['إمكانية الوصول']);
  });

  it('submits the text with name on the input itself', () => {
    render(<Tag name="tag" defaultValue="Bug" />);
    expect(input().name).toBe('tag');
    expect(document.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('follows the Field: disabled never opens', async () => {
    const user = userEvent.setup();
    render(
      <Field label="Tag" disabled>
        <Autocomplete items={tags} />
      </Field>,
    );
    expect(root().hasAttribute('data-disabled')).toBe(true);
    await user.click(input());
    expect(popup()).toBeNull();
  });

  it('renders the demo', () => {
    render(<AutocompleteDemo />);
    expect(document.querySelectorAll('[data-ds="autocomplete"]').length).toBeGreaterThan(8);
  });
});
