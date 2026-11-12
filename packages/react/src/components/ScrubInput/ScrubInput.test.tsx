// Covers the behavior of Figma-Killer-2 `ScrubInput/__tests__/scrubInput.test.tsx`
// that applies here: drag the label to scrub, a click focuses, typing and
// arithmetic commit on Enter and blur, Escape reverts, arrows nudge with
// Shift and Alt, mixed has no baseline.
import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import ScrubInputDemo from './ScrubInput.demo';
import { ScrubInput } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="scrub-input"]');
  if (!el) throw new Error('no scrub input root');
  return el;
}

function handle(container: HTMLElement): HTMLElement {
  return root(container).querySelector<HTMLElement>('[data-part="label"]')!;
}

function drag(el: HTMLElement, from: number, to: number, init: { shiftKey?: boolean; altKey?: boolean } = {}) {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: from });
  fireEvent.pointerMove(el, { pointerId: 1, clientX: to, ...init });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: to });
}

describe('ScrubInput', () => {
  it('renders the root, the label handle, the control and the unit', () => {
    const { container } = render(<ScrubInput label="W" aria-label="Width" defaultValue={320} unit="px" />);
    const box = root(container);
    expect(box.getAttribute('data-size')).toBe('md');
    const input = screen.getByRole('textbox', { name: 'Width' }) as HTMLInputElement;
    expect(input.getAttribute('data-part')).toBe('control');
    expect(input.value).toBe('320');
    expect(handle(container).getAttribute('aria-hidden')).toBe('true');
    expect(handle(container).textContent).toBe('W');
    const unit = box.querySelector('[data-part="unit"]')!;
    expect(unit.textContent).toBe('px');
    expect(input.getAttribute('aria-describedby')).toContain(unit.id);
  });

  it('maps the three sizes', () => {
    for (const size of ['xs', 'sm', 'md'] as const) {
      const { container } = render(<ScrubInput label="W" aria-label={size} size={size} />);
      expect(root(container).getAttribute('data-size')).toBe(size);
    }
  });

  it('stamps empty state attributes', () => {
    const { container } = render(<ScrubInput label="W" aria-label="Width" invalid disabled mixed />);
    const box = root(container);
    expect(box.getAttribute('data-invalid')).toBe('');
    expect(box.getAttribute('data-disabled')).toBe('');
    expect(box.getAttribute('data-mixed')).toBe('');
    expect(box.hasAttribute('data-dragging')).toBe(false);
  });

  it('scrubs one step per pixel while dragging the label, and marks dragging', () => {
    const onChange = vi.fn();
    const { container } = render(<ScrubInput label="W" aria-label="Width" defaultValue={100} onChange={onChange} />);
    const el = handle(container);
    fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 50 });
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 74 });
    expect(root(container).getAttribute('data-dragging')).toBe('');
    expect(onChange).toHaveBeenLastCalledWith(124);
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 74 });
    expect(root(container).hasAttribute('data-dragging')).toBe(false);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('124');
  });

  it('scrubs ten steps with Shift and a tenth with Alt', () => {
    const onChange = vi.fn();
    const { container } = render(<ScrubInput label="W" aria-label="Width" defaultValue={100} onChange={onChange} />);
    drag(handle(container), 0, 5, { shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(150);
    drag(handle(container), 0, 3, { altKey: true });
    expect(onChange).toHaveBeenLastCalledWith(150.3);
  });

  it('flips the drag direction in rtl', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Theme dir="rtl" lang="ar">
        <ScrubInput label="ع" aria-label="العرض" defaultValue={100} onChange={onChange} />
      </Theme>,
    );
    drag(handle(container), 100, 90);
    expect(onChange).toHaveBeenLastCalledWith(110);
  });

  it('clamps a drag to min and max', () => {
    const onChange = vi.fn();
    const { container } = render(<ScrubInput label="W" aria-label="Width" defaultValue={5} min={0} max={10} onChange={onChange} />);
    drag(handle(container), 0, -100);
    expect(onChange).toHaveBeenLastCalledWith(0);
    drag(handle(container), 0, 100);
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it('focuses and selects the input on a press with no move', () => {
    const onChange = vi.fn();
    const { container } = render(<ScrubInput label="W" aria-label="Width" defaultValue={100} onChange={onChange} />);
    drag(handle(container), 10, 11);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(3);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not scrub while disabled, read only or mixed', () => {
    for (const props of [{ disabled: true }, { readOnly: true }, { mixed: true }]) {
      const onChange = vi.fn();
      const { container, unmount } = render(<ScrubInput label="W" aria-label="Width" defaultValue={100} onChange={onChange} {...props} />);
      drag(handle(container), 0, 30);
      expect(onChange).not.toHaveBeenCalled();
      unmount();
    }
  });

  it('nudges with the arrow keys: one step, Shift ten, Alt a tenth', () => {
    const onChange = vi.fn();
    render(<ScrubInput label="W" aria-label="Width" defaultValue={10} step={1} onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('11');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('10');
    fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });
    expect(input.value).toBe('20');
    fireEvent.keyDown(input, { key: 'ArrowDown', altKey: true });
    expect(input.value).toBe('19.9');
    expect(onChange).toHaveBeenLastCalledWith(19.9);
  });

  it('commits a typed expression on Enter and keeps focus', () => {
    const onChange = vi.fn();
    render(<ScrubInput label="W" aria-label="Width" defaultValue={10} unit="px" onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '12*2' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(24);
    expect(input.value).toBe('24');
    expect(document.activeElement).toBe(input);
  });

  it('commits on blur, reads Arabic Indic digits and the field unit', () => {
    const onChange = vi.fn();
    render(<ScrubInput label="W" aria-label="Width" defaultValue={10} unit="px" onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '١٢٠px' } });
    act(() => input.blur());
    expect(onChange).toHaveBeenLastCalledWith(120);
    expect(input.value).toBe('120');
  });

  it('reverts what it cannot read, and Escape reverts the typed text', () => {
    const onChange = vi.fn();
    render(<ScrubInput label="W" aria-label="Width" defaultValue={10} unit="px" onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    act(() => input.focus());
    fireEvent.change(input, { target: { value: '5em' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.value).toBe('10');
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('10');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets Escape go on when nothing is typed', () => {
    const onParentKey = vi.fn();
    render(
      <div onKeyDown={(e) => onParentKey(e.key)}>
        <ScrubInput label="W" aria-label="Width" defaultValue={10} />
      </div>,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onParentKey).toHaveBeenCalledWith('Escape');
  });

  it('shows the mixed word and takes a typed value over every item', () => {
    const onChange = vi.fn();
    render(<ScrubInput label="H" aria-label="Height" mixed onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('Mixed');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '40' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(40);
  });

  it('is controlled', () => {
    const { rerender } = render(<ScrubInput label="W" aria-label="Width" value={4} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('4');
    rerender(<ScrubInput label="W" aria-label="Width" value={9} />);
    expect(input.value).toBe('9');
  });

  it('reads the Field wiring and takes its name from the Field label', () => {
    const { container } = render(
      <Field label="Gap" description="Space between items." invalid required>
        <ScrubInput label="G" defaultValue={8} />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Gap' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(root(container).getAttribute('data-invalid')).toBe('');
  });

  it('is named by a text label when alone with no aria-label', () => {
    render(<ScrubInput label="Width" defaultValue={8} />);
    expect(screen.getByRole('textbox', { name: 'Width' })).toBeTruthy();
  });

  it('passes the ref and root props', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(<ScrubInput label="W" aria-label="Width" ref={ref} className="mine" rootProps={{ id: 'box' }} />);
    expect(ref.current).toBe(screen.getByRole('textbox'));
    expect(root(container).className).toBe('mine');
    expect(root(container).id).toBe('box');
  });

  it('renders the demo', () => {
    const { container } = render(<ScrubInputDemo />);
    expect(container.querySelectorAll('[data-ds="scrub-input"]').length).toBeGreaterThan(10);
  });
});
