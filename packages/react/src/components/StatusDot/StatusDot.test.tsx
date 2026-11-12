import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import StatusDotDemo from './StatusDot.demo';
import { StatusDot } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="status-dot"]');
  if (!el) throw new Error('no status dot rendered');
  return el;
}

describe('StatusDot', () => {
  it('renders the anatomy and the default axes', () => {
    const { container } = render(<StatusDot label="Online" />);
    const el = root(container);
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-pulse')).toBe(false);
    expect(el.hasAttribute('data-hide-label')).toBe(false);
    const dot = el.querySelector('[data-part="dot"]');
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Online');
    expect(el.textContent).toBe('Online');
  });

  it('sets tone, size, pulse and hidden label', () => {
    const { container } = render(<StatusDot label="Syncing" tone="info" size="sm" pulse hideLabel />);
    const el = root(container);
    expect(el.getAttribute('data-tone')).toBe('info');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-pulse')).toBe('');
    expect(el.getAttribute('data-hide-label')).toBe('');
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Syncing');
  });

  it('spreads props onto the root and takes a ref', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(<StatusDot label="Online" ref={ref} id="s1" role="status" />);
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.id).toBe('s1');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('demo renders its cases with a label on every dot', () => {
    const { container } = render(<StatusDotDemo />);
    const roots = container.querySelectorAll('[data-ds="status-dot"]');
    expect(roots.length).toBeGreaterThan(10);
    roots.forEach((r) => expect(r.querySelector('[data-part="label"]')?.textContent?.length).toBeGreaterThan(0));
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error']);
  });
});
