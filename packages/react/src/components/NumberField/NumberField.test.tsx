import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import NumberFieldDemo from './NumberField.demo';
import { NumberField } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="number-field"]');
  if (!el) throw new Error('no number field root');
  return el;
}

function part(container: HTMLElement, name: string): HTMLElement | null {
  return root(container).querySelector<HTMLElement>(`[data-part="${name}"]`);
}

function type(input: HTMLElement, text: string) {
  fireEvent.change(input, { target: { value: text } });
}

describe('NumberField', () => {
  it('renders the root, the control and two IconButton steppers', () => {
    const { container } = render(<NumberField aria-label="Quantity" defaultValue={3} />);
    const box = root(container);
    expect(box.tagName).toBe('DIV');
    expect(box.getAttribute('data-size')).toBe('md');
    expect(box.getAttribute('data-shape')).toBe('default');
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    expect(input.getAttribute('data-part')).toBe('control');
    expect((input as HTMLInputElement).value).toBe('3');
    const dec = part(container, 'decrement')!;
    const inc = part(container, 'increment')!;
    expect(dec.getAttribute('data-ds')).toBe('icon-button');
    expect(inc.getAttribute('data-ds')).toBe('icon-button');
    expect(inc.getAttribute('aria-label')).toMatch(/Increase/);
    expect(dec.getAttribute('aria-label')).toMatch(/Decrease/);
    // The steppers stay out of the tab order: the input is the one tab stop.
    expect(inc.getAttribute('tabindex')).toBe('-1');
    // React Aria's own "true" attributes and class do not reach the DOM.
    expect(box.hasAttribute('data-rac')).toBe(false);
    expect(box.hasAttribute('class')).toBe(false);
    expect(input.hasAttribute('class')).toBe(false);
  });

  it('maps size and shape, with 24px steppers below lg', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const { container } = render(<NumberField aria-label={size} size={size} shape="pill" />);
      expect(root(container).getAttribute('data-size')).toBe(size);
      expect(root(container).getAttribute('data-shape')).toBe('pill');
      expect(part(container, 'increment')!.getAttribute('data-size')).toBe(size === 'lg' ? 'md' : 'xs');
      expect(part(container, 'increment')!.getAttribute('data-shape')).toBe('pill');
    }
  });

  it('stamps empty state attributes', () => {
    const { container } = render(<NumberField aria-label="State" invalid disabled required />);
    const box = root(container);
    expect(box.getAttribute('data-invalid')).toBe('');
    expect(box.getAttribute('data-disabled')).toBe('');
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.hasAttribute('required')).toBe(false);
    expect((input as HTMLInputElement).disabled).toBe(true);
  });

  it('hides the steppers while read only', () => {
    const { container } = render(<NumberField aria-label="Read only" readOnly defaultValue={4} />);
    expect(root(container).getAttribute('data-readonly')).toBe('');
    expect(part(container, 'increment')).toBeNull();
    expect((screen.getByRole('textbox') as HTMLInputElement).readOnly).toBe(true);
  });

  it('steps with the arrow keys, ten steps with PageUp and PageDown, and Home and End go to the bounds', () => {
    const onChange = vi.fn();
    render(<NumberField aria-label="Seats" defaultValue={10} min={0} max={50} step={2} onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('12');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('10');
    fireEvent.keyDown(input, { key: 'PageUp' });
    expect(input.value).toBe('30');
    fireEvent.keyDown(input, { key: 'PageDown' });
    expect(input.value).toBe('10');
    fireEvent.keyDown(input, { key: 'End' });
    expect(input.value).toBe('50');
    fireEvent.keyDown(input, { key: 'PageUp' });
    expect(input.value).toBe('50');
    fireEvent.keyDown(input, { key: 'Home' });
    expect(input.value).toBe('0');
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('moves ten percent steps with PageUp on a percent field', () => {
    render(<NumberField aria-label="Discount" defaultValue={0.15} min={0} max={1} formatOptions={{ style: 'percent' }} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'PageUp' });
    expect(input.value).toBe('25%');
    fireEvent.keyDown(input, { key: 'PageDown' });
    expect(input.value).toBe('15%');
  });

  it('keeps a controlled value the parent does not change', () => {
    const onChange = vi.fn();
    render(<NumberField aria-label="Count" value={2} onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'PageUp' });
    expect(onChange).toHaveBeenCalledWith(3);
    expect(onChange).toHaveBeenCalledWith(12);
    expect(input.value).toBe('2');
  });

  it('steps with the buttons and disables the one at a bound', () => {
    const onChange = vi.fn();
    const { container } = render(<NumberField aria-label="Seats" defaultValue={1} min={0} max={2} onChange={onChange} />);
    const inc = part(container, 'increment')!;
    const dec = part(container, 'decrement')!;
    fireEvent.pointerDown(inc, { pointerType: 'mouse', button: 0, pointerId: 1 });
    fireEvent.pointerUp(inc, { pointerType: 'mouse', button: 0, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(inc.getAttribute('aria-disabled')).toBe('true');
    expect(inc.hasAttribute('disabled')).toBe(false);
    expect(dec.hasAttribute('aria-disabled')).toBe(false);
  });

  it('accepts Arabic Indic digits and shows Western digits', () => {
    const onChange = vi.fn();
    render(
      <Theme lang="ar">
        <NumberField aria-label="العدد" onChange={onChange} />
      </Theme>,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => input.focus());
    type(input, '١٢٫٥');
    expect(input.value).toBe('12.5');
    act(() => input.blur());
    expect(input.value).toBe('12.5');
    expect(onChange).toHaveBeenLastCalledWith(12.5);
  });

  it('keeps Western digits when formatting for Arabic', () => {
    render(
      <Theme lang="ar">
        <NumberField aria-label="المبلغ" defaultValue={1234.5} />
      </Theme>,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).not.toMatch(/[٠-٩]/);
    expect(input.value).toMatch(/1.?234.5/);
  });

  it('does not change the value on blur', () => {
    const onChange = vi.fn();
    render(<NumberField aria-label="Width" onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => input.focus());
    type(input, '12');
    act(() => input.blur());
    expect(input.value).toBe('12');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(12);
  });

  it('empties to null', () => {
    const onChange = vi.fn();
    render(<NumberField aria-label="Width" defaultValue={4} onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => input.focus());
    type(input, '');
    act(() => input.blur());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('formats with the format options', () => {
    render(<NumberField aria-label="Share" defaultValue={0.25} formatOptions={{ style: 'percent' }} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('25%');
  });

  it('is controlled', () => {
    const { rerender } = render(<NumberField aria-label="Count" value={2} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('2');
    rerender(<NumberField aria-label="Count" value={7} />);
    expect(input.value).toBe('7');
    rerender(<NumberField aria-label="Count" value={null} />);
    expect(input.value).toBe('');
  });

  it('reads the Field wiring', () => {
    render(
      <Field label="Guests" description="Up to 8." invalid disabled={false} required>
        <NumberField defaultValue={2} />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Guests' });
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    const inc = screen.getByRole('button', { name: /Increase/ });
    expect(inc.getAttribute('aria-labelledby') ?? '').toContain(document.querySelector('[data-part="label"]')!.id);
  });

  it('passes the ref, the placeholder and root props', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <NumberField aria-label="Width" ref={ref} placeholder="0" className="mine" rootProps={{ id: 'box' }} data-testid="control" />,
    );
    expect(ref.current).toBe(screen.getByTestId('control'));
    expect(ref.current?.placeholder).toBe('0');
    expect(root(container).className).toBe('mine');
    expect(root(container).id).toBe('box');
  });

  it('takes custom step button names', () => {
    render(<NumberField aria-label="Width" incrementLabel="Add one" decrementLabel="Remove one" />);
    expect(screen.getByRole('button', { name: 'Add one' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove one' })).toBeTruthy();
  });

  it('renders the demo', () => {
    const { container } = render(<NumberFieldDemo />);
    expect(container.querySelectorAll('[data-ds="number-field"]').length).toBeGreaterThan(5);
  });

  it('names the steppers in the language of locale, so English copy in an Arabic page is not half Arabic (note N24)', () => {
    render(
      <Theme lang="ar">
        <NumberField locale="en" aria-label="Quantity" defaultValue={4} />
      </Theme>,
    );
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? '');
    for (const n of names) expect(n).not.toMatch(/[\u0600-\u06FF]/);
  });
});
