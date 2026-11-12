import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog, DialogContent, DialogTitle } from '../Dialog/Dialog';
import InlineEditDemo from './InlineEdit.demo';
import { InlineEdit } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="inline-edit"]');
  if (!el) throw new Error('no inline edit root');
  return el;
}

const required = (v: string) => (v.trim() === '' ? 'Add a name.' : undefined);

function startEditing() {
  fireEvent.click(screen.getByRole('button', { name: /Edit board name/ }));
  return screen.getByRole('textbox', { name: 'Board name' }) as HTMLInputElement;
}

describe('InlineEdit', () => {
  it('shows the value in a display button', () => {
    const { container } = render(<InlineEdit label="Board name" defaultValue="Spring launch" />);
    const box = root(container);
    expect(box.getAttribute('data-state')).toBe('viewing');
    expect(box.getAttribute('data-size')).toBe('md');
    const display = screen.getByRole('button', { name: 'Spring launch, Edit board name' });
    expect(display.getAttribute('data-part')).toBe('display');
    expect(display.getAttribute('data-emphasis')).toBe('ghost');
    expect(display.textContent).toContain('Spring launch');
  });

  it('starts editing with the text selected, and saves on Enter with focus back on the display', () => {
    const onValueChange = vi.fn();
    const { container } = render(<InlineEdit label="Board name" defaultValue="Spring launch" onValueChange={onValueChange} />);
    const input = startEditing();
    expect(root(container).getAttribute('data-state')).toBe('editing');
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('Spring launch'.length);
    expect(input.closest('[data-ds="input"]')?.getAttribute('data-part')).toBe('control');
    fireEvent.change(input, { target: { value: 'Autumn launch' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('Autumn launch');
    expect(root(container).getAttribute('data-state')).toBe('viewing');
    const display = screen.getByRole('button', { name: 'Autumn launch, Edit board name' });
    expect(document.activeElement).toBe(display);
    expect(screen.getByRole('status').textContent).toBe('Saved');
  });

  it('cancels on Escape without bubbling, and returns focus', () => {
    const outer = vi.fn();
    render(
      <div onKeyDown={(e) => outer(e.key)}>
        <InlineEdit label="Board name" defaultValue="Spring launch" />
      </div>,
    );
    const input = startEditing();
    fireEvent.change(input, { target: { value: 'Other' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(outer).not.toHaveBeenCalled();
    const display = screen.getByRole('button', { name: 'Spring launch, Edit board name' });
    expect(document.activeElement).toBe(display);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('save and cancel buttons', () => {
    const onValueChange = vi.fn();
    render(<InlineEdit label="Board name" defaultValue="A" onValueChange={onValueChange} />);
    let input = startEditing();
    fireEvent.change(input, { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onValueChange).toHaveBeenCalledWith('B');
    input = startEditing();
    fireEvent.change(input, { target: { value: 'C' } });
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'B, Edit board name' })).toBeTruthy();
  });

  it('never saves an invalid value, on Enter or on blur, and shows the message', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <>
        <InlineEdit label="Board name" defaultValue="A" validate={required} onValueChange={onValueChange} />
        <a href="#next">Next</a>
      </>,
    );
    const input = startEditing();
    fireEvent.change(input, { target: { value: ' ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(root(container).getAttribute('data-state')).toBe('editing');
    expect(root(container).hasAttribute('data-invalid')).toBe(true);
    const message = container.querySelector('[data-part="error"]');
    expect(message?.textContent).toBe('Add a name.');
    expect(input.getAttribute('aria-describedby')).toBe(message?.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    fireEvent.blur(input, { relatedTarget: screen.getByText('Next') });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(root(container).getAttribute('data-state')).toBe('editing');
    fireEvent.change(input, { target: { value: 'Fixed' } });
    expect(container.querySelector('[data-part="error"]')).toBeNull();
    fireEvent.blur(input, { relatedTarget: screen.getByText('Next') });
    expect(onValueChange).toHaveBeenCalledWith('Fixed');
    expect(root(container).getAttribute('data-state')).toBe('viewing');
  });

  it('does not treat a move to its own buttons as leaving', () => {
    const onValueChange = vi.fn();
    const { container } = render(<InlineEdit label="Board name" defaultValue="A" onValueChange={onValueChange} />);
    const input = startEditing();
    fireEvent.change(input, { target: { value: 'B' } });
    fireEvent.blur(input, { relatedTarget: screen.getByRole('button', { name: 'Discard changes' }) });
    expect(root(container).getAttribute('data-state')).toBe('editing');
  });

  it('works controlled', () => {
    const { rerender } = render(<InlineEdit label="Board name" value="A" />);
    const input = startEditing();
    fireEvent.change(input, { target: { value: 'B' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('button', { name: 'A, Edit board name' })).toBeTruthy();
    rerender(<InlineEdit label="Board name" value="B" />);
    expect(screen.getByRole('button', { name: 'B, Edit board name' })).toBeTruthy();
  });

  it('shows the placeholder when empty, and does not start while disabled', () => {
    const { container } = render(<InlineEdit label="Board name" placeholder="Add a board name" disabled />);
    expect(root(container).hasAttribute('data-empty')).toBe(true);
    expect(root(container).hasAttribute('data-disabled')).toBe(true);
    const display = screen.getByRole('button', { name: 'Add a board name, Edit board name' });
    expect(display.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(display);
    expect(root(container).getAttribute('data-state')).toBe('viewing');
  });

  it('opens in the editor with defaultEditing, without taking focus', () => {
    const { container } = render(<InlineEdit label="Board name" defaultValue="A" defaultEditing />);
    expect(root(container).getAttribute('data-state')).toBe('editing');
    expect(document.activeElement).toBe(document.body);
  });

  it('cancels inside a Dialog without closing it', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Rename</DialogTitle>
          <InlineEdit label="Board name" defaultValue="Spring launch" />
        </DialogContent>
      </Dialog>,
    );
    const input = startEditing();
    fireEvent.change(input, { target: { value: 'Other' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Spring launch, Edit board name' })).toBeTruthy();
  });

  it('shows a message from outside in both states, linked to the display and the input', () => {
    const { container } = render(<InlineEdit label="Board name" defaultValue="A" error="Pick another name." />);
    expect(root(container).hasAttribute('data-invalid')).toBe(true);
    const message = container.querySelector('[data-part="error"]');
    expect(message?.textContent).toBe('Pick another name.');
    const display = screen.getByRole('button', { name: 'A, Edit board name' });
    expect(display.getAttribute('aria-describedby')).toBe(message?.id);
    const input = startEditing();
    expect(input.getAttribute('aria-describedby')).toBe(container.querySelector('[data-part="error"]')?.id);
  });

  it('closes on blur when nothing changed, even if the value is invalid', () => {
    const { container } = render(
      <>
        <InlineEdit label="Board name" validate={required} />
        <a href="#next">Next</a>
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Edit board name/ }));
    const input = screen.getByRole('textbox', { name: 'Board name' });
    fireEvent.blur(input, { relatedTarget: screen.getByText('Next') });
    expect(root(container).getAttribute('data-state')).toBe('viewing');
  });

  it('says Saved again on a second save', () => {
    render(<InlineEdit label="Board name" defaultValue="A" />);
    let input = startEditing();
    fireEvent.change(input, { target: { value: 'B' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('status').textContent).toBe('Saved');
    input = startEditing();
    expect(screen.getByRole('status').textContent).toBe('');
    fireEvent.change(input, { target: { value: 'C' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('status').textContent).toBe('Saved');
  });

  it('ignores an Enter that ends an IME composition', () => {
    const onValueChange = vi.fn();
    render(<InlineEdit label="Board name" defaultValue="A" onValueChange={onValueChange} />);
    const input = startEditing();
    fireEvent.change(input, { target: { value: 'B' } });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('renders the demo cases', () => {
    const { container } = render(<InlineEditDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'long-text', 'long-arabic', 'error', 'disabled']);
  });
});
