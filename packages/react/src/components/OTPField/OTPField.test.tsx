import { createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '../Field/Field';
import OTPFieldDemo from './OTPField.demo';
import { OTPField } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="otp-field"]');
  if (!el) throw new Error('no otp field root');
  return el;
}

function cells(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-part="cell"]')).map((c) => c.textContent ?? '');
}

function active(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll('[data-part="cell"]'))
    .map((c, i) => (c.hasAttribute('data-active') ? i : -1))
    .filter((i) => i >= 0);
}

describe('OTPField', () => {
  it('renders one native input and aria-hidden cells in a left to right root', () => {
    const { container } = render(<OTPField aria-label="Verification code" />);
    const box = root(container);
    expect(box.getAttribute('dir')).toBe('ltr');
    expect(box.getAttribute('data-size')).toBe('md');
    expect(box.getAttribute('data-shape')).toBe('default');
    const inputs = container.querySelectorAll('input');
    expect(inputs).toHaveLength(1);
    const input = screen.getByRole('textbox', { name: 'Verification code' });
    expect(input.getAttribute('data-part')).toBe('control');
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('pattern')).toBe('[0-9]*');
    expect(input.hasAttribute('maxlength')).toBe(false);
    const cellEls = container.querySelectorAll('[data-part="cell"]');
    expect(cellEls).toHaveLength(6);
    for (const c of cellEls) expect(c.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-part="separator"]')).toBeNull();
  });

  it('maps size and shape, and draws separators between groups', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const { container } = render(<OTPField aria-label={size} size={size} shape="pill" />);
      expect(root(container).getAttribute('data-size')).toBe(size);
      expect(root(container).getAttribute('data-shape')).toBe('pill');
    }
    const { container } = render(<OTPField aria-label="Grouped" length={8} groups={[2, 3, 3]} />);
    const seps = container.querySelectorAll('[data-part="separator"]');
    expect(seps).toHaveLength(2);
    for (const s of seps) expect(s.getAttribute('aria-hidden')).toBe('true');
    const order = Array.from(root(container).children).map((c) => c.getAttribute('data-part'));
    expect(order.slice(1).join(' ')).toBe('cell cell separator cell cell cell separator cell cell cell');
  });

  it('sets the state attributes and the native states', () => {
    const { container } = render(<OTPField aria-label="State" invalid disabled readOnly required />);
    const box = root(container);
    for (const a of ['data-invalid', 'data-disabled', 'data-readonly']) expect(box.getAttribute(a)).toBe('');
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
    const plain = root(render(<OTPField aria-label="Plain" />).container);
    for (const a of ['data-invalid', 'data-disabled', 'data-readonly', 'data-complete']) expect(plain.hasAttribute(a)).toBe(false);
  });

  it('marks a full code complete', () => {
    const { container } = render(<OTPField aria-label="Full" defaultValue="482913" />);
    expect(root(container).getAttribute('data-complete')).toBe('');
    expect(cells(container)).toEqual(['4', '8', '2', '9', '1', '3']);
  });

  it('reads its label, description and states from a Field', () => {
    render(
      <Field label="Verification code" description="Sent by text message." invalid required>
        <OTPField />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Verification code' });
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('types into the next cell and calls onValueChange and onComplete', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onComplete = vi.fn();
    const { container } = render(<OTPField aria-label="Code" length={4} onValueChange={onValueChange} onComplete={onComplete} />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    await user.click(input);
    expect(active(container)).toEqual([0]);
    await user.keyboard('12');
    expect(cells(container)).toEqual(['1', '2', '', '']);
    expect(active(container)).toEqual([2]);
    await user.keyboard('34');
    expect(input.value).toBe('1234');
    expect(onValueChange).toHaveBeenLastCalledWith('1234');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
    expect(root(container).hasAttribute('data-complete')).toBe(true);
  });

  it('refuses a letter in a numeric code', async () => {
    const user = userEvent.setup();
    const { container } = render(<OTPField aria-label="Code" length={4} />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    await user.click(input);
    await user.keyboard('1a2');
    expect(input.value).toBe('12');
    expect(cells(container)).toEqual(['1', '2', '', '']);
  });

  it('reads Arabic Indic digits as Latin digits', async () => {
    const user = userEvent.setup();
    render(<OTPField aria-label="Code" length={4} />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    await user.click(input);
    await user.keyboard('\u0661\u0662');
    expect(input.value).toBe('12');
  });

  it('fills every cell from a paste, with spaces and dashes', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const { container } = render(<OTPField aria-label="Code" onComplete={onComplete} defaultValue="9" />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    await user.click(input);
    await user.paste('482-913');
    expect(input.value).toBe('482913');
    expect(cells(container)).toEqual(['4', '8', '2', '9', '1', '3']);
    expect(onComplete).toHaveBeenCalledWith('482913');
  });

  it('takes a whole code from autofill in one change', () => {
    const onComplete = vi.fn();
    render(<OTPField aria-label="Code" onComplete={onComplete} />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '271828' } });
    expect(input.value).toBe('271828');
    expect(onComplete).toHaveBeenCalledWith('271828');
  });

  it('moves with the arrow keys, Home and End, and Backspace clears and moves back', async () => {
    const user = userEvent.setup();
    const { container } = render(<OTPField aria-label="Code" length={4} defaultValue="1234" />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    act(() => input.focus());
    expect(active(container)).toEqual([3]);
    await user.keyboard('{ArrowLeft}');
    expect(active(container)).toEqual([2]);
    await user.keyboard('{Home}');
    expect(active(container)).toEqual([0]);
    await user.keyboard('{ArrowLeft}');
    expect(active(container)).toEqual([0]);
    await user.keyboard('{ArrowRight}');
    expect(active(container)).toEqual([1]);
    await user.keyboard('{End}');
    expect(active(container)).toEqual([3]);
    await user.keyboard('{Backspace}');
    expect(input.value).toBe('123');
    expect(active(container)).toEqual([2]);
    await user.keyboard('{Backspace}');
    expect(input.value).toBe('12');
    expect(active(container)).toEqual([1]);
    await user.keyboard('9');
    expect(input.value).toBe('19');
  });

  it('replaces the character in the active cell when typing', async () => {
    const user = userEvent.setup();
    render(<OTPField aria-label="Code" length={4} defaultValue="1234" />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    act(() => input.focus());
    await user.keyboard('{Home}7');
    expect(input.value).toBe('7234');
  });

  it('reads the code out of a pasted SMS sentence', async () => {
    const user = userEvent.setup();
    render(<OTPField aria-label="Code" />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    await user.click(input);
    await user.paste('Your code is 135 790.');
    expect(input.value).toBe('135790');
  });

  it('calls onComplete again when one cell of a full code changes', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OTPField aria-label="Code" length={4} defaultValue="1234" onComplete={onComplete} />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    act(() => input.focus());
    await user.keyboard('{Home}9');
    expect(input.value).toBe('9234');
    expect(onComplete).toHaveBeenCalledWith('9234');
  });

  it('refuses a letter typed over a filled cell and keeps the cell', async () => {
    const user = userEvent.setup();
    const { container } = render(<OTPField aria-label="Code" length={4} defaultValue="1234" />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    act(() => input.focus());
    await user.keyboard('{Home}{ArrowRight}a');
    expect(input.value).toBe('1234');
    expect(active(container)).toEqual([1]);
  });

  it('moves on when the same digit is typed again', async () => {
    const user = userEvent.setup();
    const { container } = render(<OTPField aria-label="Code" length={4} defaultValue="1234" />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    act(() => input.focus());
    await user.keyboard('{Home}1');
    expect(input.value).toBe('1234');
    expect(active(container)).toEqual([1]);
  });

  it('clears a middle cell with Backspace and moves back one cell', async () => {
    const user = userEvent.setup();
    const { container } = render(<OTPField aria-label="Code" length={4} defaultValue="1234" />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    act(() => input.focus());
    await user.keyboard('{Home}{ArrowRight}{ArrowRight}{Backspace}');
    expect(input.value).toBe('124');
    expect(active(container)).toEqual([1]);
  });

  it('keeps working when a controlled parent refuses a change', async () => {
    const user = userEvent.setup();
    const { container } = render(<OTPField aria-label="Code" length={4} value="12" onValueChange={() => {}} />);
    const input = screen.getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    await user.click(input);
    await user.keyboard('3');
    expect(input.value).toBe('12');
    await user.keyboard('{Home}');
    expect(active(container)).toEqual([0]);
  });

  it('follows a controlled value', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [code, setCode] = useState('');
      return (
        <>
          <OTPField aria-label="Code" length={4} value={code} onValueChange={setCode} />
          <output data-testid="out">{code}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('textbox', { name: 'Code' }));
    await user.keyboard('56');
    expect(screen.getByTestId('out').textContent).toBe('56');
  });

  it('upper cases an alphanumeric code', async () => {
    const user = userEvent.setup();
    render(<OTPField aria-label="Backup" length={4} charset="alphanumeric" />);
    const input = screen.getByRole('textbox', { name: 'Backup' }) as HTMLInputElement;
    expect(input.getAttribute('inputmode')).toBe('text');
    await user.click(input);
    await user.keyboard('k7q');
    expect(input.value).toBe('K7Q');
  });

  it('sends the ref and native props to the input, className and style to the root', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <OTPField ref={ref} aria-label="Code" name="code" className="box" style={{ marginBlock: '1px' }} rootProps={{ 'data-testid': 'root' } as never} />,
    );
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Code' }));
    expect(ref.current?.getAttribute('name')).toBe('code');
    const box = root(container);
    expect(box.className).toBe('box');
    expect(box.getAttribute('data-testid')).toBe('root');
  });

  it('renders the demo with every content case and no bare button', () => {
    const { container } = render(<OTPFieldDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[title]')).toBeNull();
  });
});
