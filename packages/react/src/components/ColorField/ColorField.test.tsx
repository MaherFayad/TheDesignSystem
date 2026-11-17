import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import ColorFieldDemo from './ColorField.demo';
import { ColorField } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="color-field"]')!;
const ARABIC_INDIC = /[٠-٩۰-۹]/;

describe('ColorField', () => {
  it('renders the box, the preview and the input, with no React Aria classes', () => {
    const { container } = render(<ColorField defaultValue="#1e6fd9" locale="en" />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('default');
    const preview = el.querySelector<HTMLElement>('[data-part="start"] > [data-part="preview"]')!;
    expect(preview.getAttribute('data-ds')).toBe('color-swatch');
    expect(preview.getAttribute('aria-hidden')).toBe('true');
    const input = el.querySelector<HTMLInputElement>('input[data-part="control"]')!;
    expect(input.value).toBe('#1E6FD9');
    expect(input.getAttribute('aria-label')).toBe('Hex');
    expect(el.querySelector('[class]')).toBeNull();
    expect(el.querySelector('[data-rac]')).toBeNull();
  });

  it('commits on Enter and on blur, giving lower case hex, and updates the preview', async () => {
    const onChange = vi.fn();
    const { container } = render(<ColorField defaultValue="#1e6fd9" locale="en" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'e03a3a{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('#e03a3a', expect.anything());
    expect((input as HTMLInputElement).value).toBe('#E03A3A');
    expect(root(container).querySelector('[data-part="preview"]')!.getAttribute('aria-label')).toBe('Red');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(null, null);
  });

  it('steps with the arrow keys, no drag needed', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('#000010');
      return (
        <>
          <ColorField value={value} onChange={(v) => setValue(v)} locale="en" />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    act(() => screen.getByRole('textbox').focus());
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('status').textContent).toBe('#000011');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('status').textContent).toBe('#00000f');
  });

  it('takes its name and state from a Field', () => {
    render(
      <Field label="Brand colour" invalid required>
        <ColorField defaultValue="#1e6fd9" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: /Brand colour/ });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-label')).toBeNull();
    const el = input.closest<HTMLElement>('[data-ds="color-field"]')!;
    expect(el.getAttribute('data-invalid')).toBe('');
  });

  it('edits one channel as a number with Western digits in Arabic, no preview by default', async () => {
    const { container } = render(
      <Theme lang="ar">
        <ColorField channel="alpha" defaultValue="#1e6fd9cc" />
      </Theme>,
    );
    const el = root(container);
    expect(el.getAttribute('data-channel')).toBe('alpha');
    expect(el.querySelector('[data-part="preview"]')).toBeNull();
    const input = screen.getByRole('textbox', { name: 'العتامة' }) as HTMLInputElement;
    expect(ARABIC_INDIC.test(input.value)).toBe(false);
    expect(input.value.replace(/[‎؜]/g, '')).toMatch(/^80\s?[%٪]$/);
  });

  it('stamps disabled and read only from the props or a Field', () => {
    const { container } = render(<ColorField defaultValue="#1e6fd9" disabled locale="en" />);
    expect(root(container).getAttribute('data-disabled')).toBe('');
    expect((root(container).querySelector('input') as HTMLInputElement).disabled).toBe(true);
    const ro = render(
      <Field label="Brand colour" readOnly>
        <ColorField defaultValue="#1e6fd9" />
      </Field>,
    ).container;
    expect(root(ro).getAttribute('data-readonly')).toBe('');
    expect((root(ro).querySelector('input') as HTMLInputElement).readOnly).toBe(true);
  });

  it('renders every demo case, with long-arabic', () => {
    const { container } = render(<ColorFieldDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });
});
