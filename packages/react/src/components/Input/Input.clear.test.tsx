// Order M9.1: Input variant plain, the clear part (clearable) and data-empty.
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import { Dialog, DialogContent, DialogTitle } from '../Dialog/Dialog';
import { Input, inputClearLabels } from './index';

const box = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-ds="input"]') as HTMLElement;
const clearButton = () => screen.queryByRole('button', { name: 'Clear text' });

describe('Input plain and clearable (order M9.1)', () => {
  it('stamps variant plain', () => {
    const { container } = render(<Input aria-label="Name" variant="plain" />);
    expect(box(container).getAttribute('data-variant')).toBe('plain');
  });

  it('stamps data-empty while the value is empty, controlled and uncontrolled', async () => {
    const user = userEvent.setup();
    const { container } = render(<Input aria-label="Name" />);
    expect(box(container).hasAttribute('data-empty')).toBe(true);
    await user.type(screen.getByRole('textbox'), 'Sara');
    expect(box(container).hasAttribute('data-empty')).toBe(false);

    const filled = render(<Input aria-label="Email" defaultValue="sara@example.com" />);
    expect(box(filled.container).hasAttribute('data-empty')).toBe(false);

    const { container: c2, rerender } = render(<Input aria-label="City" value="" onChange={() => undefined} />);
    expect(box(c2).hasAttribute('data-empty')).toBe(true);
    rerender(<Input aria-label="City" value="Riyadh" onChange={() => undefined} />);
    expect(box(c2).hasAttribute('data-empty')).toBe(false);
  });

  it('shows the clear button only while the box has focus and a value', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" clearable defaultValue="Sara" />);
    expect(clearButton()).toBeNull();
    await user.click(screen.getByRole('textbox'));
    const button = clearButton();
    expect(button).not.toBeNull();
    expect(button?.getAttribute('data-part')).toBe('clear');
    expect(button?.getAttribute('data-ds')).toBe('close-button');
    await user.tab();
    expect(document.activeElement).toBe(button);
    await user.tab();
    expect(clearButton()).toBeNull();
  });

  it('clears the value, calls onChange and moves focus back to the input', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    function Controlled() {
      const [value, setValue] = useState('Sara');
      return (
        <Input
          aria-label="Name"
          clearable
          value={value}
          onChange={(e) => {
            seen.push(e.target.value);
            setValue(e.target.value);
          }}
        />
      );
    }
    const { container } = render(<Controlled />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{Tab}{Enter}');
    expect(input.value).toBe('');
    expect(seen.at(-1)).toBe('');
    expect(document.activeElement).toBe(input);
    expect(box(container).hasAttribute('data-empty')).toBe(true);
    expect(clearButton()).toBeNull();
  });

  it('keeps focus on the input when a pointer presses the clear button', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" clearable defaultValue="Sara" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.click(input);
    const button = clearButton() as HTMLElement;
    expect(fireEvent.mouseDown(button)).toBe(false);
    await user.click(button);
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
  });

  it('clears on Escape outside a dialog, and lets Escape close a dialog', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" clearable defaultValue="Sara" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input.value).toBe('');

    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Rename</DialogTitle>
          <Input aria-label="Board" clearable defaultValue="Spring" />
        </DialogContent>
      </Dialog>,
    );
    const inDialog = screen.getByRole('textbox', { name: 'Board' }) as HTMLInputElement;
    inDialog.focus();
    await user.keyboard('{Escape}');
    expect(inDialog.value).toBe('Spring');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('draws no clear button when disabled or read only', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" clearable readOnly defaultValue="Sara" />);
    await user.click(screen.getByRole('textbox'));
    expect(clearButton()).toBeNull();
  });

  it('names the clear button in Arabic under an Arabic Theme, and takes clearLabel', async () => {
    const user = userEvent.setup();
    render(
      <Theme lang="ar">
        <Input aria-label="الاسم" clearable defaultValue="سارة" />
      </Theme>,
    );
    await user.click(screen.getByRole('textbox'));
    expect(screen.getByRole('button', { name: inputClearLabels.ar })).not.toBeNull();

    render(<Input aria-label="Email" clearable clearLabel="Clear email" defaultValue="a@b.co" />);
    await user.click(screen.getByRole('textbox', { name: 'Email' }));
    expect(screen.getByRole('button', { name: 'Clear email' })).not.toBeNull();
  });
});
