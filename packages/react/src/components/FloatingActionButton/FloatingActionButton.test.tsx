import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import FloatingActionButtonDemo from './FloatingActionButton.demo';
import { FloatingActionButton } from './index';

describe('FloatingActionButton', () => {
  it('renders a solid accent icon button, lg and fixed by default', () => {
    render(<FloatingActionButton icon="plus" label="Create board" />);
    const el = screen.getByRole('button', { name: 'Create board' });
    expect(el.getAttribute('data-ds')).toBe('floating-action-button');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(el.getAttribute('data-position')).toBe('fixed');
    expect(el.hasAttribute('data-extended')).toBe(false);
    expect(el.querySelector('[data-part="label"]')).toBeNull();
    expect(el.getAttribute('aria-label')).toBe('Create board');
  });

  it('extended shows the label as text, without aria-label', () => {
    render(<FloatingActionButton icon="plus" label="Create board" extended size="md" tone="neutral" shape="pill" />);
    const el = screen.getByRole('button', { name: 'Create board' });
    expect(el.getAttribute('data-extended')).toBe('');
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Create board');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-shape')).toBe('pill');
  });

  it('activates with click and Enter, and blocks while loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<FloatingActionButton icon="plus" label="Create board" onClick={onClick} />);
    const el = screen.getByRole('button');
    await user.click(el);
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(2);
    rerender(<FloatingActionButton icon="plus" label="Create board" onClick={onClick} loading />);
    expect(el.getAttribute('data-loading')).toBe('');
    expect(el.getAttribute('aria-busy')).toBe('true');
    await user.click(el);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('takes ref as a prop', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<FloatingActionButton ref={ref} icon="plus" label="Create board" />);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('renders every demo case', () => {
    const { container } = render(<FloatingActionButtonDemo />);
    for (const id of ['variants', 'one', 'long-text', 'long-arabic', 'loading', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
  });
});
