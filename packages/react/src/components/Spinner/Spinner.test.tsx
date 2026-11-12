import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SpinnerDemo from './Spinner.demo';
import { Spinner } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="spinner"]');
  if (!el) throw new Error('no spinner rendered');
  return el;
}

describe('Spinner', () => {
  it('renders a status with a hidden label and the default axes', () => {
    const { container } = render(<Spinner label="Loading files" />);
    const el = root(container);
    expect(el.tagName).toBe('SPAN');
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
    expect(el.hasAttribute('data-part')).toBe(false);
    const label = el.querySelector('[data-part="label"]');
    expect(label?.textContent).toBe('Loading files');
    expect(screen.getByRole('status').textContent).toBe('Loading files');
  });

  it('maps size and tone', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      for (const tone of ['neutral', 'accent'] as const) {
        const el = root(render(<Spinner label="Loading" size={size} tone={tone} />).container);
        expect(el.getAttribute('data-size')).toBe(size);
        expect(el.getAttribute('data-tone')).toBe(tone);
      }
    }
  });

  it('is hidden from assistive tech when decorative', () => {
    const { container } = render(<Spinner decorative />);
    const el = root(container);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.querySelector('[data-part="label"]')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('passes the ref, className, style and other props to the root', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Spinner ref={ref} label="Loading" className="x" style={{ marginInline: '1rem' }} data-testid="s" id="spin" />,
    );
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.style.marginInline).toBe('1rem');
    expect(el.getAttribute('data-testid')).toBe('s');
    expect(el.id).toBe('spin');
  });

  it('renders every demo case, with Arabic in the variants case', () => {
    const { container } = render(<SpinnerDemo />);
    for (const id of ['variants', 'one', 'many', 'long-text', 'long-arabic', 'loading']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"]')).not.toBeNull();
    const arabic = container.querySelector('[data-demo-case="long-arabic"] [data-ds="theme"]');
    expect(arabic?.getAttribute('dir')).toBe('rtl');
    const variants = container.querySelector('[data-demo-case="variants"]');
    expect(variants?.querySelectorAll('[data-ds="spinner"][data-size][data-tone]').length).toBeGreaterThanOrEqual(8);
  });
});
