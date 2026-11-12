import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import IconButtonDemo from './IconButton.demo';
import { IconButton } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="icon-button"]');
  if (!el) throw new Error('no icon button rendered');
  return el;
}

describe('IconButton', () => {
  it('renders a native button named by its label, with a hidden icon', () => {
    const { container } = render(<IconButton icon="close" label="Close panel" />);
    const el = root(container);
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.getAttribute('aria-label')).toBe('Close panel');
    expect(el.hasAttribute('title')).toBe(false);
    expect(screen.getByRole('button', { name: 'Close panel' })).toBe(el);
    const icon = el.querySelector('[data-part="icon"] [data-ds="icon"]');
    expect(icon?.getAttribute('data-icon')).toBe('close');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-part="label"]')).toBeNull();
  });

  it('defaults to md, neutral, ghost and default shape, and takes the shared axes', () => {
    const plain = root(render(<IconButton icon="plus" label="Add page" />).container);
    expect(plain.getAttribute('data-size')).toBe('md');
    expect(plain.getAttribute('data-tone')).toBe('neutral');
    expect(plain.getAttribute('data-emphasis')).toBe('ghost');
    expect(plain.getAttribute('data-shape')).toBe('default');
    const set = root(
      render(<IconButton icon="plus" label="Add page" size="xs" tone="accent" emphasis="solid" shape="pill" />).container,
    );
    expect(set.getAttribute('data-size')).toBe('xs');
    expect(set.getAttribute('data-tone')).toBe('accent');
    expect(set.getAttribute('data-emphasis')).toBe('solid');
    expect(set.getAttribute('data-shape')).toBe('pill');
  });

  it('activates with click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon="plus" label="Add page" onClick={onClick} />);
    const el = screen.getByRole('button', { name: 'Add page' });
    await user.click(el);
    el.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('disabled and loading keep focus and block activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <>
        <IconButton icon="trash" label="Delete file" disabled onClick={onClick} />
        <IconButton icon="upload" label="Upload file" loading onClick={onClick} />
      </>,
    );
    const [disabled, loading] = Array.from(container.querySelectorAll<HTMLElement>('[data-ds="icon-button"]'));
    expect(disabled?.getAttribute('aria-disabled')).toBe('true');
    expect(disabled?.getAttribute('data-disabled')).toBe('');
    expect(loading?.getAttribute('aria-busy')).toBe('true');
    expect(loading?.getAttribute('data-loading')).toBe('');
    expect(loading?.querySelector('[data-part="spinner"]')?.getAttribute('aria-hidden')).toBe('true');
    await user.click(disabled!);
    await user.click(loading!);
    loading!.blur();
    await user.tab();
    expect(document.activeElement).toBe(disabled);
    await user.tab();
    expect(document.activeElement).toBe(loading);
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a link with asChild', () => {
    const onClick = vi.fn();
    render(
      <IconButton asChild icon="external" label="Open docs" onClick={onClick}>
        <a href="#docs" />
      </IconButton>,
    );
    const link = screen.getByRole('link', { name: 'Open docs' });
    expect(link.getAttribute('data-ds')).toBe('icon-button');
    expect(link.getAttribute('href')).toBe('#docs');
    expect(link.querySelector('[data-part="icon"]')).not.toBeNull();
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('takes ref as a prop and passes props through', () => {
    const ref = createRef<HTMLButtonElement>();
    const { container } = render(<IconButton ref={ref} icon="plus" label="Add page" className="x" data-testid="ib" />);
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.getAttribute('data-testid')).toBe('ib');
  });

  it('renders every demo case', () => {
    const { container } = render(<IconButtonDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="long-arabic"] [data-ds="theme"]')?.getAttribute('dir')).toBe('rtl');
    for (const el of Array.from(container.querySelectorAll('[data-ds="icon-button"]'))) {
      expect(el.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    }
  });
});
