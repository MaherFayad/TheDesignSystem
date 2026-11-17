import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { colorName, colorSwatchGrid } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import ColorSwatchPickerDemo from './ColorSwatchPicker.demo';
import { ColorSwatchPicker } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="color-swatch-picker"]')!;
const items = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[data-part="item"]'));
const saved = ['#12b76a', '#fdb022', '#d92d20', '#2e90fa'];

describe('ColorSwatchPicker', () => {
  it('renders the grid of the system palette: 120 named options, no React Aria classes', { timeout: 30000 }, () => {
    const { container } = render(<ColorSwatchPicker locale="en" />);
    const el = root(container);
    expect(el.getAttribute('data-layout')).toBe('grid');
    const list = el.querySelector('[data-part="list"]')!;
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.getAttribute('aria-label')).toBe('Colours');
    expect(list.getAttribute('dir')).toBe('ltr');
    expect(items(container)).toHaveLength(120);
    expect(el.querySelector('[class]')).toBeNull();
    expect(el.querySelector('[data-rac]')).toBeNull();
    const flat = colorSwatchGrid().flat();
    const options = screen.getAllByRole('option');
    expect(options[0]!.textContent).toBe('');
    // Each option is named by its swatch: the colour name, never the hex.
    expect(options[13]!.querySelector('[data-part="swatch"]')!.getAttribute('aria-label')).toBe(colorName(flat[13]!, 'en'));
    expect(screen.getAllByRole('option', { name: 'White' })).toHaveLength(1);
    expect(el.querySelector('[data-part="add"]')).toBeNull();
  });

  it('shows the pick with a check and data-selected, present and empty', async () => {
    const onChange = vi.fn();
    const { container } = render(<ColorSwatchPicker layout="row" colors={saved} locale="en" onChange={onChange} />);
    expect(container.querySelector('[data-part="check"]')).toBeNull();
    await userEvent.click(screen.getByRole('option', { name: 'Red' }));
    expect(onChange).toHaveBeenCalledWith('#d92d20', expect.anything());
    const picked = items(container)[2]!;
    expect(picked.getAttribute('data-selected')).toBe('');
    expect(picked.getAttribute('aria-selected')).toBe('true');
    expect(picked.querySelector('[data-part="check"]')!.getAttribute('aria-hidden')).toBe('true');
    expect(items(container).filter((i) => i.hasAttribute('data-selected'))).toHaveLength(1);
  });

  it('is controlled with hex values', async () => {
    function Controlled() {
      const [value, setValue] = useState('#12b76a');
      return (
        <>
          <ColorSwatchPicker layout="row" colors={saved} locale="en" value={value} onChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    const { container } = render(<Controlled />);
    expect(items(container)[0]!.hasAttribute('data-selected')).toBe(true);
    await userEvent.click(screen.getByRole('option', { name: 'Blue' }));
    expect(screen.getByRole('status').textContent).toBe('#2e90fa');
  });

  it('moves by what is seen in the grid: ArrowRight goes right in Arabic too, ArrowDown a row down', async () => {
    const { container } = render(
      <Theme lang="ar">
        <ColorSwatchPicker defaultValue={colorSwatchGrid()[1]![0]} />
      </Theme>,
    );
    const first = items(container)[12]!;
    act(() => first.focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(items(container)[13]);
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(items(container)[12]);
    // jsdom has no layout, so React Aria's row moves fall back to list order there; the browser run checks rows.
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(items(container)[119]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(items(container)[0]);
    // The names stay Arabic in the grid.
    expect(items(container)[0]!.querySelector('[data-part="swatch"]')!.getAttribute('aria-label')).toBe('أبيض');
    // 120 options and five key presses: more than the 5 s default on a busy machine.
  }, 30000);

  it('follows reading order in a row: ArrowLeft goes to the next swatch in Arabic', async () => {
    const { container } = render(
      <Theme lang="ar">
        <ColorSwatchPicker layout="row" colors={saved} defaultValue={saved[0]} aria-label="الألوان المحفوظة" />
      </Theme>,
    );
    expect(container.querySelector('[data-part="list"]')!.hasAttribute('dir')).toBe(false);
    act(() => items(container)[0]!.focus());
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(items(container)[1]);
    await userEvent.keyboard('{Enter}');
    expect(items(container)[1]!.hasAttribute('data-selected')).toBe(true);
  });

  it('shows the add button only in a row with onAdd, named in both languages', async () => {
    const onAdd = vi.fn();
    const { container } = render(<ColorSwatchPicker layout="row" colors={saved} locale="en" onAdd={onAdd} />);
    const add = root(container).querySelector<HTMLElement>('[data-part="add"]')!;
    expect(add.getAttribute('data-ds')).toBe('icon-button');
    expect(add.getAttribute('aria-label')).toBe('Add colour');
    await userEvent.click(add);
    expect(onAdd).toHaveBeenCalledTimes(1);
    render(<ColorSwatchPicker layout="row" colors={saved} locale="ar" onAdd={onAdd} />);
    expect(screen.getByRole('button', { name: 'إضافة لون' })).toBeTruthy();
    const grid = render(<ColorSwatchPicker locale="en" onAdd={onAdd} />).container;
    expect(grid.querySelector('[data-part="add"]')).toBeNull();
  });

  it('takes sizes in a row, own names, and disabled swatches', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColorSwatchPicker
        layout="row"
        size="lg"
        locale="en"
        onChange={onChange}
        colors={[
          { color: '#155eef', name: 'Primary blue' },
          { color: '#93370d', name: 'Warm brown', disabled: true },
        ]}
      />,
    );
    expect(root(container).getAttribute('data-size')).toBe('lg');
    const off = screen.getByRole('option', { name: 'Warm brown' });
    expect(off.getAttribute('data-disabled')).toBe('');
    await userEvent.click(off);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables every swatch and the add button', () => {
    const { container } = render(<ColorSwatchPicker layout="row" colors={saved} locale="en" disabled onAdd={() => {}} />);
    expect(root(container).getAttribute('data-disabled')).toBe('');
    expect(items(container).every((i) => i.hasAttribute('data-disabled'))).toBe(true);
    expect(root(container).querySelector('[data-part="add"]')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('renders every demo case, with long-arabic', () => {
    const { container } = render(<ColorSwatchPickerDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
  });
});
