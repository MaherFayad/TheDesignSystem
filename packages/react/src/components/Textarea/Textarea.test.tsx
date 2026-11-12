import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme';
import { Field } from '../Field/Field';
import TextareaDemo from './Textarea.demo';
import { Textarea } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="textarea"]');
  if (!el) throw new Error('no textarea rendered');
  return el;
}

function shown(container: HTMLElement): string {
  return container.querySelector('[data-part="count"] > [aria-hidden="true"]')?.textContent ?? '';
}

function live(container: HTMLElement): string {
  return container.querySelector('[aria-live="polite"]')?.textContent ?? '';
}

describe('Textarea', () => {
  it('renders the anatomy with the default axes', () => {
    const { container } = render(<Textarea aria-label="Notes" />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('default');
    expect(el.hasAttribute('data-auto-height')).toBe(true);
    for (const attr of ['data-invalid', 'data-disabled', 'data-readonly', 'data-over']) expect(el.hasAttribute(attr)).toBe(false);
    const area = screen.getByRole('textbox', { name: 'Notes' }) as HTMLTextAreaElement;
    expect(area.tagName).toBe('TEXTAREA');
    expect(area.getAttribute('data-part')).toBe('control');
    expect(area.rows).toBe(3);
    expect(el.querySelector('[data-part="count"]')).toBeNull();
  });

  it('passes size, rows and maxRows; the ref goes to the textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const { container } = render(<Textarea aria-label="Notes" size="lg" rows={5} maxRows={8} autoHeight={false} ref={ref} />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.hasAttribute('data-auto-height')).toBe(false);
    expect(el.style.getPropertyValue('--_textarea-rows')).toBe('5');
    expect(el.style.getPropertyValue('--_textarea-max-rows')).toBe('8');
    expect(ref.current?.tagName).toBe('TEXTAREA');
    expect(ref.current?.rows).toBe(5);
  });

  it('reads the Field wiring', () => {
    const { container } = render(
      <Field label="Brief" description="Shown on the card." required disabled>
        <Textarea />
      </Field>,
    );
    const area = screen.getByRole('textbox', { name: 'Brief' }) as HTMLTextAreaElement;
    expect(area.disabled).toBe(true);
    expect(area.getAttribute('aria-required')).toBe('true');
    expect(document.getElementById(area.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Shown on the card.');
    expect(root(container).hasAttribute('data-disabled')).toBe(true);
  });

  it('read only and invalid stamp their states', () => {
    const { container } = render(<Textarea aria-label="Notes" readOnly invalid />);
    const el = root(container);
    expect(el.hasAttribute('data-readonly')).toBe(true);
    expect(el.hasAttribute('data-invalid')).toBe(true);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
  });

  it('counts characters, and the count joins the description', async () => {
    const { container } = render(<Textarea aria-label="Notes" limit={50} defaultValue="Hi" />);
    const count = root(container).querySelector('[data-part="count"]');
    expect(shown(container)).toBe('2/50');
    expect(count?.textContent).toContain('2 of 50 characters');
    const area = screen.getByRole('textbox');
    expect(area.getAttribute('aria-describedby')).toBe(count?.id);
    await userEvent.type(area, '!');
    expect(shown(container)).toBe('3/50');
  });

  it('past the limit marks invalid and over, and never cuts the text', () => {
    const { container } = render(<Textarea aria-label="Notes" limit={5} defaultValue="abc" />);
    const area = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: 'abcdefgh' } });
    const el = root(container);
    expect(area.value).toBe('abcdefgh');
    expect(area.maxLength).toBe(-1);
    expect(el.hasAttribute('data-over')).toBe(true);
    expect(el.hasAttribute('data-invalid')).toBe(true);
    expect(area.getAttribute('aria-invalid')).toBe('true');
    expect(shown(container)).toBe('8/5');
  });

  it('announces once when near the limit and once when past it, not on every key', () => {
    const { container } = render(<Textarea aria-label="Notes" limit={100} defaultValue="" />);
    const area = screen.getByRole('textbox');
    expect(live(container)).toBe('');
    act(() => void fireEvent.change(area, { target: { value: 'a'.repeat(50) } }));
    expect(live(container)).toBe('');
    act(() => void fireEvent.change(area, { target: { value: 'a'.repeat(91) } }));
    expect(live(container)).toBe('9 characters left');
    act(() => void fireEvent.change(area, { target: { value: 'a'.repeat(92) } }));
    expect(live(container)).toBe('9 characters left');
    act(() => void fireEvent.change(area, { target: { value: 'a'.repeat(103) } }));
    expect(live(container)).toBe('3 characters over the limit');
    act(() => void fireEvent.change(area, { target: { value: 'a'.repeat(104) } }));
    expect(live(container)).toBe('3 characters over the limit');
    act(() => void fireEvent.change(area, { target: { value: 'a' } }));
    expect(live(container)).toBe('');
  });

  it('announces in Arabic under an Arabic Theme', () => {
    const { container } = render(
      <Theme lang="ar">
        <Textarea aria-label="ملاحظات" limit={20} />
      </Theme>,
    );
    act(() => void fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a'.repeat(15) } }));
    expect(live(container)).toBe('باقي 5 حروف');
    act(() => void fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a'.repeat(22) } }));
    expect(live(container)).toBe('زاد حرفين عن الحد');
  });

  it('a controlled value drives the count', () => {
    const { container, rerender } = render(<Textarea aria-label="Notes" limit={10} value="abc" onChange={() => {}} />);
    expect(shown(container)).toBe('3/10');
    rerender(<Textarea aria-label="Notes" limit={10} value="abcdef" onChange={() => {}} />);
    expect(shown(container)).toBe('6/10');
  });

  it('follows the Field invalid state, and the description and the count both describe it', () => {
    const { container } = render(
      <Field label="Brief" description="Up to 50 characters." invalid>
        <Textarea limit={50} />
      </Field>,
    );
    const area = screen.getByRole('textbox', { name: 'Brief' });
    expect(area.getAttribute('aria-invalid')).toBe('true');
    const ids = (area.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0] ?? '')?.textContent).toBe('Up to 50 characters.');
    expect(ids[1]).toBe(root(container).querySelector('[data-part="count"]')?.id);
  });

  it('a value past the limit on the first render is invalid at once', () => {
    const { container } = render(<Textarea aria-label="Notes" limit={3} defaultValue="abcdef" />);
    expect(root(container).hasAttribute('data-over')).toBe(true);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
  });

  it('with a small limit an empty value is not near, so the near message is said', () => {
    const { container } = render(<Textarea aria-label="Code" limit={5} />);
    act(() => void fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ab' } }));
    expect(live(container)).toBe('3 characters left');
  });

  it('renders the demo with every content case', () => {
    const { container } = render(<TextareaDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [lang="ar"] [data-ds="textarea"]')).not.toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[title]')).toBeNull();
  });
});
