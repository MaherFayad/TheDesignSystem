import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wheelTimeColumns, type WheelColumn } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import WheelPickerDemo from './WheelPicker.demo';
import { WheelPicker } from './index';

/** An uncontrolled time wheel at 9:41 AM: the built value moves to defaultValue. */
const columns = (): WheelColumn[] =>
  wheelTimeColumns({ locale: 'en-US', value: { hour: 9, minute: 41 } }).map(({ value, ...c }) => ({ ...c, defaultValue: value }));

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="wheel-picker"]')!;
const spins = () => screen.getAllByRole('spinbutton');

afterEach(() => vi.restoreAllMocks());

describe('WheelPicker', () => {
  it('renders a named group with a band and one spinbutton per column', () => {
    const { container } = render(<WheelPicker columns={columns()} label="Alarm time" />);
    const group = screen.getByRole('group', { name: 'Alarm time' });
    expect(group).toBe(root(container));
    expect(group.querySelector(':scope > [data-part="band"]')!.getAttribute('aria-hidden')).toBe('true');
    expect(spins().map((s) => s.getAttribute('aria-label'))).toEqual(['Hours', 'Minutes', 'AM or PM']);
    expect(spins().map((s) => s.getAttribute('aria-valuetext'))).toEqual(['9', '41', 'AM']);
    expect(spins().map((s) => s.tabIndex)).toEqual([0, 0, 0]);
    expect(spins()[0]!.getAttribute('aria-valuenow')).toBe('9');
    expect(spins()[0]!.getAttribute('aria-valuemin')).toBe('1');
    expect(spins()[0]!.getAttribute('aria-valuemax')).toBe('12');
    // Words: the row number.
    expect(spins()[2]!.getAttribute('aria-valuenow')).toBe('1');
    expect(spins()[2]!.getAttribute('aria-valuemax')).toBe('2');
    expect(group.hasAttribute('data-disabled')).toBe(false);
  });

  it('draws rows hidden from readers, repeated in a looping column, and marks the chosen one', () => {
    render(<WheelPicker columns={columns()} label="Alarm time" />);
    const [hours, minutes, period] = spins();
    const rows = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>(':scope > [data-part="option"]'));
    expect(rows(hours!).length).toBe(12 * 17);
    expect(rows(minutes!).length).toBe(60 * 5);
    expect(rows(period!).map((r) => r.textContent)).toEqual(['AM', 'PM']);
    expect(rows(period!).every((r) => r.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(rows(period!)[0]!.hasAttribute('data-selected')).toBe(true);
    expect(rows(period!)[1]!.hasAttribute('data-selected')).toBe(false);
  });

  it('steps with Up and Down, wraps a loop, and stops at the ends of a list', async () => {
    const onChange = vi.fn();
    render(<WheelPicker columns={columns()} label="Alarm time" onChange={onChange} />);
    const [hours, , period] = spins();
    hours!.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('hour', 10);
    expect(hours!.getAttribute('aria-valuetext')).toBe('10');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(hours!.getAttribute('aria-valuetext')).toBe('1');
    await userEvent.keyboard('{ArrowDown}');
    expect(hours!.getAttribute('aria-valuetext')).toBe('12');
    period!.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(period!.getAttribute('aria-valuetext')).toBe('AM');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(period!.getAttribute('aria-valuetext')).toBe('PM');
  });

  it('steps five with PageUp and PageDown and goes to the ends with Home and End', async () => {
    render(<WheelPicker columns={columns()} label="Alarm time" />);
    const minutes = spins()[1]!;
    minutes.focus();
    await userEvent.keyboard('{PageUp}');
    expect(minutes.getAttribute('aria-valuetext')).toBe('46');
    await userEvent.keyboard('{PageDown}{PageDown}');
    expect(minutes.getAttribute('aria-valuetext')).toBe('36');
    await userEvent.keyboard('{Home}');
    expect(minutes.getAttribute('aria-valuetext')).toBe('00');
    await userEvent.keyboard('{End}');
    expect(minutes.getAttribute('aria-valuetext')).toBe('59');
  });

  it('jumps to typed digits and letters, Arabic Indic digits too', async () => {
    render(<WheelPicker columns={columns()} label="Alarm time" />);
    const [, minutes, period] = spins();
    minutes!.focus();
    await userEvent.keyboard('07');
    expect(minutes!.getAttribute('aria-valuetext')).toBe('07');
    fireEvent.keyDown(minutes!, { key: '٢' });
    fireEvent.keyDown(minutes!, { key: '٥' });
    expect(minutes!.getAttribute('aria-valuetext')).toBe('25');
    period!.focus();
    await userEvent.keyboard('p');
    expect(period!.getAttribute('aria-valuetext')).toBe('PM');
  });

  it('moves between columns with Left and Right, mirrored in right to left', async () => {
    const { rerender } = render(<WheelPicker columns={columns()} label="Alarm time" />);
    spins()[0]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(spins()[1]);
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(document.activeElement).toBe(spins()[2]);
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(spins()[1]);
    rerender(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <WheelPicker columns={columns()} label="Alarm time" />
      </div>,
    );
    spins()[0]!.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(spins()[1]);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(spins()[0]);
  });

  it('chooses a row on a tap, the path that needs no drag', () => {
    const onChange = vi.fn();
    render(<WheelPicker columns={columns()} label="Alarm time" onChange={onChange} />);
    const period = spins()[2]!;
    fireEvent.click(period.querySelectorAll('[data-part="option"]')[1]!);
    expect(onChange).toHaveBeenCalledWith('dayPeriod', 'pm');
    expect(period.getAttribute('aria-valuetext')).toBe('PM');
    expect(document.activeElement).toBe(period);
  });

  it('skips rows that cannot be chosen', async () => {
    const column: WheelColumn = {
      id: 'slot',
      label: 'Table time',
      options: ['18:00', '18:30', '19:00', '19:30', '20:00'].map((t, i) => ({ value: t, disabled: i === 2 || i === 3 })),
      defaultValue: '18:30',
    };
    render(<WheelPicker columns={[column]} label="Table" />);
    const spin = spins()[0]!;
    spin.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(spin.getAttribute('aria-valuetext')).toBe('20:00');
    const rows = spin.querySelectorAll('[data-part="option"]');
    expect(rows[2]!.hasAttribute('data-disabled')).toBe(true);
    fireEvent.click(rows[3]!);
    expect(spin.getAttribute('aria-valuetext')).toBe('20:00');
  });

  it('follows a controlled value and leaves it to the owner', async () => {
    const onChange = vi.fn();
    const col = (value: number): WheelColumn => ({ id: 'n', label: 'Count', options: [1, 2, 3].map((v) => ({ value: v })), value });
    const { rerender } = render(<WheelPicker columns={[col(1)]} label="Count" onChange={onChange} />);
    spins()[0]!.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenCalledWith('n', 2);
    expect(spins()[0]!.getAttribute('aria-valuetext')).toBe('1');
    rerender(<WheelPicker columns={[col(3)]} label="Count" onChange={onChange} />);
    expect(spins()[0]!.getAttribute('aria-valuetext')).toBe('3');
  });

  it('when disabled, stays focusable, says so and does not change', async () => {
    const onChange = vi.fn();
    const { container } = render(<WheelPicker columns={columns()} label="Alarm time" disabled onChange={onChange} />);
    expect(root(container).hasAttribute('data-disabled')).toBe(true);
    const hours = spins()[0]!;
    expect(hours.getAttribute('aria-disabled')).toBe('true');
    hours.focus();
    expect(document.activeElement).toBe(hours);
    await userEvent.keyboard('{ArrowUp}');
    fireEvent.click(hours.querySelectorAll('[data-part="option"]')[0]!);
    expect(onChange).not.toHaveBeenCalled();
    expect(hours.getAttribute('aria-valuetext')).toBe('9');
  });

  it('builds an Arabic time with Latin digits and the Intl day period, hours first in the DOM', () => {
    render(
      <Theme lang="ar">
        <WheelPicker columns={wheelTimeColumns({ locale: 'ar-SA', value: { hour: 21, minute: 5 } })} label="وقت المنبه" />
      </Theme>,
    );
    expect(spins().map((s) => s.getAttribute('aria-label'))).toEqual(['الساعة', 'الدقائق', 'الفترة']);
    expect(spins().map((s) => s.getAttribute('aria-valuetext'))).toEqual(['9', '05', 'م']);
  });

  it('passes props to the root and the ref to it', () => {
    let node: HTMLDivElement | null = null;
    render(<WheelPicker columns={columns()} label="Alarm time" className="x" data-testid="w" ref={(n) => {
          node = n;
        }}
      />);
    expect(screen.getByTestId('w').className).toBe('x');
    expect(node).toBe(screen.getByTestId('w'));
  });

  it('renders every demo case', () => {
    const { container } = render(<WheelPickerDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    act(() => undefined);
  });
});
