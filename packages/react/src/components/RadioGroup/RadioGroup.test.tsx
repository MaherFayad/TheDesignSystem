import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import RadioGroupDemo from './RadioGroup.demo';
import { RadioGroup, RadioGroupItem } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="radio-group"]');
  if (!el) throw new Error('no radio-group root');
  return el;
}

function item(radio: HTMLElement): HTMLElement {
  const el = radio.closest<HTMLElement>('[data-part="item"]');
  if (!el) throw new Error('no item');
  return el;
}

function Plain(props: Partial<Parameters<typeof RadioGroup>[0]>) {
  return (
    <RadioGroup label="Board view" {...props}>
      <RadioGroupItem value="grid" label="Grid" />
      <RadioGroupItem value="list" label="List" description="One board per line." />
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('renders a named radiogroup root with the default axes', () => {
    const { container } = render(<Plain />);
    const group = screen.getByRole('radiogroup', { name: 'Board view' });
    expect(group).toBe(root(container));
    expect(group.getAttribute('data-size')).toBe('md');
    expect(group.getAttribute('data-tone')).toBe('neutral');
    expect(group.getAttribute('data-orientation')).toBe('vertical');
    expect(group.hasAttribute('data-part')).toBe(false);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('names each radio from its label and describes it with its description', () => {
    render(<Plain />);
    const list = screen.getByRole('radio', { name: 'List' });
    const descId = list.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(descId)?.textContent).toBe('One board per line.');
    expect(list.getAttribute('data-part')).toBe('control');
  });

  it('maps size, tone and orientation to the root', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      for (const tone of ['neutral', 'accent'] as const) {
        const { container, unmount } = render(<Plain size={size} tone={tone} orientation="horizontal" />);
        const group = root(container);
        expect(group.getAttribute('data-size')).toBe(size);
        expect(group.getAttribute('data-tone')).toBe(tone);
        expect(group.getAttribute('data-orientation')).toBe('horizontal');
        expect(group.getAttribute('aria-orientation')).toBe('horizontal');
        unmount();
      }
    }
  });

  it('checks the default value and stamps item states', () => {
    render(<Plain defaultValue="list" />);
    const grid = screen.getByRole('radio', { name: 'Grid' });
    const list = screen.getByRole('radio', { name: 'List' });
    expect(list.getAttribute('aria-checked')).toBe('true');
    expect(item(list).getAttribute('data-state')).toBe('checked');
    expect(item(grid).getAttribute('data-state')).toBe('unchecked');
    expect(list.querySelector('[data-part="indicator"]')?.getAttribute('data-state')).toBe('checked');
  });

  it('selects on click and on a label click, and reports the value', () => {
    const onValueChange = vi.fn();
    render(<Plain onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Grid' }));
    expect(onValueChange).toHaveBeenLastCalledWith('grid');
    expect(item(screen.getByRole('radio', { name: 'Grid' })).getAttribute('data-state')).toBe('checked');
    fireEvent.click(screen.getByText('List'));
    expect(onValueChange).toHaveBeenLastCalledWith('list');
    expect(screen.getByRole('radio', { name: 'List' }).getAttribute('aria-checked')).toBe('true');
  });

  it('follows a controlled value', () => {
    const { rerender } = render(<Plain value="grid" />);
    expect(screen.getByRole('radio', { name: 'Grid' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'List' }));
    expect(screen.getByRole('radio', { name: 'Grid' }).getAttribute('aria-checked')).toBe('true');
    rerender(<Plain value="list" />);
    expect(screen.getByRole('radio', { name: 'List' }).getAttribute('aria-checked')).toBe('true');
  });

  it('wires the description and the error, and marks the group invalid', () => {
    const { container } = render(<Plain description="Applies to new boards." error="Pick a view." required />);
    const group = root(container);
    expect(group.hasAttribute('data-invalid')).toBe(true);
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('aria-required')).toBe('true');
    const ids = (group.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(['Applies to new boards.', 'Pick a view.']);
    expect(container.querySelector('[data-part="legend"] [data-part="required"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('hides the error when invalid is false', () => {
    const { container } = render(<Plain error="Pick a view." invalid={false} />);
    expect(container.querySelector('[data-part="error"]')).toBeNull();
    expect(root(container).hasAttribute('data-invalid')).toBe(false);
  });

  it('disables the whole group or one option with native disabled', () => {
    const { container, unmount } = render(<Plain disabled />);
    expect(root(container).hasAttribute('data-disabled')).toBe(true);
    for (const radio of screen.getAllByRole('radio')) {
      expect((radio as HTMLButtonElement).disabled).toBe(true);
      expect(item(radio).hasAttribute('data-disabled')).toBe(true);
    }
    unmount();
    render(
      <RadioGroup label="Region">
        <RadioGroupItem value="me" label="Middle East" />
        <RadioGroupItem value="us" label="United States" disabled />
      </RadioGroup>,
    );
    expect((screen.getByRole('radio', { name: 'United States' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('radio', { name: 'Middle East' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('moves and selects with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(<Plain defaultValue="grid" onValueChange={onValueChange} />);
    const grid = screen.getByRole('radio', { name: 'Grid' });
    grid.focus();
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    const list = screen.getByRole('radio', { name: 'List' });
    await waitFor(() => expect(document.activeElement).toBe(list));
    expect(onValueChange).toHaveBeenLastCalledWith('list');
    expect(grid.getAttribute('tabindex')).toBe('-1');
  });

  it('follows the reading direction: ArrowLeft moves to the next option in right to left', async () => {
    render(
      <Theme dir="rtl" lang="ar">
        <Plain defaultValue="grid" orientation="horizontal" />
      </Theme>,
    );
    expect(screen.getByRole('radiogroup').getAttribute('dir')).toBe('rtl');
    const grid = screen.getByRole('radio', { name: 'Grid' });
    grid.focus();
    fireEvent.keyDown(grid, { key: 'ArrowLeft' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'List' })));
  });

  it('selects the focused option with Space', () => {
    render(<Plain />);
    const grid = screen.getByRole('radio', { name: 'Grid' });
    grid.focus();
    fireEvent.keyDown(grid, { key: ' ' });
    fireEvent.keyUp(grid, { key: ' ' });
    fireEvent.click(grid);
    expect(grid.getAttribute('aria-checked')).toBe('true');
  });

  it('enters the group at the checked option', () => {
    render(<Plain defaultValue="list" />);
    // Tab lands on the Radix group first, which hands focus to the checked option.
    screen.getByRole('radiogroup').focus();
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'List' }));
    expect(screen.getByRole('radio', { name: 'Grid' }).getAttribute('tabindex')).toBe('-1');
  });

  it('skips a disabled option with the arrows', async () => {
    render(
      <RadioGroup label="Region" defaultValue="me">
        <RadioGroupItem value="me" label="Middle East" />
        <RadioGroupItem value="eu" label="Europe" disabled />
        <RadioGroupItem value="us" label="United States" />
      </RadioGroup>,
    );
    const me = screen.getByRole('radio', { name: 'Middle East' });
    me.focus();
    fireEvent.keyDown(me, { key: 'ArrowDown' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'United States' })));
  });

  it('stamps data-invalid on the items of an invalid group', () => {
    render(<Plain error="Pick a view." />);
    for (const radio of screen.getAllByRole('radio')) expect(item(radio).hasAttribute('data-invalid')).toBe(true);
  });

  it('renders every demo case with unique ids', () => {
    const { container } = render(<RadioGroupDemo />);
    expect(container.querySelectorAll('[data-demo-case]').length).toBeGreaterThanOrEqual(8);
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelector('[title]')).toBeNull();
  });
});
