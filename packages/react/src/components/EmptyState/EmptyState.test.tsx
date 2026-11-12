import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyStateDemo from './EmptyState.demo';
import { EmptyState } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="empty-state"]');
  if (!el) throw new Error('no empty state rendered');
  return el;
}

describe('EmptyState', () => {
  it('renders the title as a heading and only the parts it is given', () => {
    const { container } = render(<EmptyState title="No boards yet" />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(screen.getByRole('heading', { level: 3, name: 'No boards yet' }).getAttribute('data-part')).toBe('title');
    expect(el.querySelector('[data-part="icon"]')).toBeNull();
    expect(el.querySelector('[data-part="body"]')).toBeNull();
    expect(el.querySelector('[data-part="actions"]')).toBeNull();
  });

  it('renders every part in order, the icon hidden from assistive tech', () => {
    const { container } = render(
      <EmptyState size="lg" icon="grid" title="No boards yet" headingLevel={2} actions={<span>action</span>}>
        Create a board.
      </EmptyState>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'title', 'body', 'actions']);
    const icon = el.querySelector('[data-part="icon"]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.querySelector('[data-icon="grid"]')?.getAttribute('data-size')).toBe('lg');
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
  });

  it('draws a smaller icon at size sm and takes a node as the icon', () => {
    const { container, rerender } = render(<EmptyState size="sm" icon="grid" title="Empty" />);
    expect(root(container).querySelector('[data-icon="grid"]')?.getAttribute('data-size')).toBe('md');
    rerender(<EmptyState icon={<svg data-testid="own" />} title="Empty" />);
    expect(screen.getByTestId('own')).toBeTruthy();
  });

  it('renders no empty wrappers for null or false body and actions', () => {
    const { container } = render(
      <EmptyState title="Empty" actions={false}>
        {null}
      </EmptyState>,
    );
    expect(root(container).querySelector('[data-part="body"]')).toBeNull();
    expect(root(container).querySelector('[data-part="actions"]')).toBeNull();
  });

  it('is a status when live', () => {
    render(<EmptyState live title="No results" />);
    expect(screen.getByRole('status').getAttribute('data-ds')).toBe('empty-state');
  });

  it('renders the demo with a verb plus noun first action', () => {
    const { container } = render(<EmptyStateDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'long-text', 'long-arabic']);
    const first = container.querySelector('[data-demo-case="many"] [data-part="actions"] > [data-ds="button"]');
    expect(first?.textContent).toBe('Create board');
  });
});
