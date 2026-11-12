import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '../Field/Field';
import CheckboxDemo from './Checkbox.demo';
import { Checkbox, checkboxState } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="checkbox"]');
  if (!el) throw new Error('no checkbox root');
  return el;
}

describe('Checkbox', () => {
  it('renders a root, a control with role checkbox, an indicator and a bound label', () => {
    const { container } = render(<Checkbox label="Show rulers" description="Along the top and the start edge." />);
    const box = root(container);
    expect(box.getAttribute('data-size')).toBe('md');
    expect(box.getAttribute('data-tone')).toBe('neutral');
    expect(box.getAttribute('data-state')).toBe('unchecked');
    const control = screen.getByRole('checkbox', { name: 'Show rulers' });
    expect(control.getAttribute('data-part')).toBe('control');
    expect(control.querySelector('[data-part="indicator"]')).not.toBeNull();
    const description = container.querySelector('[data-part="description"]');
    expect(control.getAttribute('aria-describedby')).toBe(description?.id);
    expect(container.querySelector('label[data-part="label"]')?.getAttribute('for')).toBe(control.id);
  });

  it('maps size and tone to the root', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      for (const tone of ['neutral', 'accent', 'danger'] as const) {
        const box = root(render(<Checkbox aria-label="x" size={size} tone={tone} />).container);
        expect(box.getAttribute('data-size')).toBe(size);
        expect(box.getAttribute('data-tone')).toBe(tone);
      }
    }
  });

  it('toggles on click and on Space, not on Enter, and shows a glyph when checked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Checkbox label="Snap" onCheckedChange={onChange} />);
    const control = screen.getByRole('checkbox', { name: 'Snap' });
    // The hidden mark waits in the box, drawn as a check before any (check-draw).
    expect(container.querySelector('[data-part="indicator"] > [data-part="mark"]')?.getAttribute('data-glyph')).toBe('check');
    await user.click(control);
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(root(container).getAttribute('data-state')).toBe('checked');
    expect(container.querySelector('[data-part="indicator"] > [data-part="mark"]')?.getAttribute('data-glyph')).toBe('check');
    await user.keyboard('{Enter}');
    expect(control.getAttribute('aria-checked')).toBe('true');
    await user.keyboard(' ');
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('clicking the label toggles the box', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Snap" />);
    await user.click(screen.getByText('Snap'));
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
  });

  it('shows indeterminate as mixed with a minus glyph', () => {
    const { container } = render(<Checkbox aria-label="All" defaultChecked="indeterminate" />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('mixed');
    expect(root(container).getAttribute('data-state')).toBe('indeterminate');
    expect(container.querySelector('[data-part="indicator"] > [data-part="mark"]')?.getAttribute('data-glyph')).toBe('minus');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
    expect(checkboxState(true)).toBe('checked');
    expect(checkboxState(false)).toBe('unchecked');
  });

  it('follows a controlled value', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Checkbox aria-label="c" checked={false} onCheckedChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('false');
    rerender(<Checkbox aria-label="c" checked onCheckedChange={onChange} />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
  });

  it('read only keeps focus and value but ignores clicks', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Checkbox label="Fixed" readOnly defaultChecked onCheckedChange={onChange} />);
    const control = screen.getByRole('checkbox');
    await user.click(control);
    await user.keyboard(' ');
    await user.click(screen.getByText('Fixed'));
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(control.getAttribute('aria-readonly')).toBe('true');
    expect(document.activeElement).toBe(control);
    expect(onChange).not.toHaveBeenCalled();
    expect(root(container).hasAttribute('data-readonly')).toBe(true);
  });

  it('sets disabled and invalid states', () => {
    const { container } = render(<Checkbox label="Off" disabled invalid required />);
    const box = root(container);
    expect(box.hasAttribute('data-disabled')).toBe(true);
    expect(box.hasAttribute('data-invalid')).toBe(true);
    const control = screen.getByRole('checkbox') as HTMLButtonElement;
    expect(control.disabled).toBe(true);
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(control.getAttribute('aria-required')).toBe('true');
    const plain = root(render(<Checkbox aria-label="p" />).container);
    for (const a of ['data-invalid', 'data-disabled', 'data-readonly']) expect(plain.hasAttribute(a)).toBe(false);
  });

  it('reads disabled, invalid and the description from a Field', () => {
    render(
      <Field disabled error="Agree to continue." description="Read the terms first.">
        <Checkbox label="Agree" />
      </Field>,
    );
    const control = screen.getByRole('checkbox', { name: 'Agree' }) as HTMLButtonElement;
    expect(control.disabled).toBe(true);
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(control.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
  });

  it('sends the ref to the control, className and style to the root', () => {
    const ref = createRef<HTMLButtonElement>();
    const { container } = render(
      <Checkbox ref={ref} aria-label="r" className="box" style={{ marginBlock: 0 }} rootProps={{ id: 'root' }} />,
    );
    expect(ref.current).toBe(screen.getByRole('checkbox'));
    const box = root(container);
    expect(box.className).toBe('box');
    expect(box.id).toBe('root');
  });

  it('draws the mark as two strokes and keeps the last glyph, so an uncheck retracts it (check-draw, check-mixed)', () => {
    const { container } = render(<Checkbox aria-label="All" defaultChecked="indeterminate" />);
    const fill = container.querySelector('[data-part="indicator"] > span');
    expect(fill?.getAttribute('aria-hidden')).toBe('true');
    expect(fill?.hasAttribute('data-part')).toBe(false);
    const mark = container.querySelector('[data-part="indicator"] > [data-part="mark"]');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(mark?.querySelectorAll('path')).toHaveLength(2);
    for (const path of mark?.querySelectorAll('path') ?? []) expect(path.getAttribute('pathLength')).toBe('1');
    expect(mark?.getAttribute('data-glyph')).toBe('minus');
    // Indeterminate to checked, then to unchecked: the check stays, retracted by CSS.
    fireEvent.click(screen.getByRole('checkbox'));
    expect(mark?.getAttribute('data-glyph')).toBe('check');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(root(container).getAttribute('data-state')).toBe('unchecked');
    expect(mark?.getAttribute('data-glyph')).toBe('check');
  });

  it('draws the mark with a CSS transition only: no animation is started from code', () => {
    const { container } = render(<Checkbox aria-label="x" defaultChecked />);
    expect(root(container).getAttribute('data-state')).toBe('checked');
    const mark = container.querySelector<SVGElement>('[data-part="indicator"] > [data-part="mark"]');
    expect(mark).not.toBeNull();
    expect(mark?.getAttribute('style')).toBeNull();
  });

  it('renders the demo with every case', () => {
    const { container } = render(<CheckboxDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });
});
