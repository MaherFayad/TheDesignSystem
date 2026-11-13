import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InputDemo from './Input.demo';
import { Input } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="input"]');
  if (!el) throw new Error('no input root');
  return el;
}

describe('Input', () => {
  it('renders a root box around a native input control', () => {
    const { container } = render(<Input aria-label="Board name" />);
    const box = root(container);
    expect(box.tagName).toBe('DIV');
    expect(box.getAttribute('data-size')).toBe('md');
    expect(box.getAttribute('data-shape')).toBe('default');
    const input = screen.getByRole('textbox', { name: 'Board name' });
    expect(input.getAttribute('data-part')).toBe('control');
    expect(input.getAttribute('type')).toBe('text');
    expect(input.parentElement).toBe(box);
    expect(input.hasAttribute('dir')).toBe(false);
  });

  it('maps size and shape to the root', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const { container } = render(<Input aria-label={size} size={size} shape="pill" />);
      expect(root(container).getAttribute('data-size')).toBe(size);
      expect(root(container).getAttribute('data-shape')).toBe('pill');
    }
  });

  it('sets the state attributes and the native states', () => {
    const { container } = render(<Input aria-label="State" invalid disabled readOnly required />);
    const box = root(container);
    expect(box.hasAttribute('data-invalid')).toBe(true);
    expect(box.hasAttribute('data-disabled')).toBe(true);
    expect(box.hasAttribute('data-readonly')).toBe(true);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
    const plain = root(render(<Input aria-label="Plain" />).container);
    for (const a of ['data-invalid', 'data-disabled', 'data-readonly']) expect(plain.hasAttribute(a)).toBe(false);
  });

  it('sends the ref and the native props to the input, className and style to the root', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Input
        ref={ref}
        aria-label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="name@example.com"
        className="box"
        style={{ maxInlineSize: '10rem' }}
        rootProps={{ 'data-testid': 'root' } as never}
      />,
    );
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Email' }));
    expect(ref.current?.getAttribute('type')).toBe('email');
    expect(ref.current?.getAttribute('name')).toBe('email');
    expect(ref.current?.getAttribute('placeholder')).toBe('name@example.com');
    const box = root(container);
    expect(box.className).toBe('box');
    expect(box.style.maxInlineSize).toBe('10rem');
    expect(box.getAttribute('data-testid')).toBe('root');
    expect(ref.current?.className).toBe('');
  });

  it('calls a callback ref with the node and with null on unmount', () => {
    const seen: (HTMLInputElement | null)[] = [];
    const { unmount } = render(<Input aria-label="Cb" ref={(n) => void seen.push(n)} />);
    expect(seen[0]).toBeInstanceOf(HTMLInputElement);
    unmount();
    expect(seen.at(-1)).toBeNull();
  });

  it('renders adornments: an icon name as an icon, a text as text, a node as is', () => {
    const { container } = render(<Input aria-label="Price" start="search" end="USD" />);
    const start = container.querySelector('[data-part="start"]');
    const end = container.querySelector('[data-part="end"]');
    expect(start?.querySelector('[data-ds="icon"][data-icon="search"]')).not.toBeNull();
    expect(start?.getAttribute('aria-hidden')).toBe('true');
    expect(end?.textContent).toBe('USD');
    expect(end?.getAttribute('aria-hidden')).toBe('true');
    const node = render(<Input aria-label="Node" end={<span data-testid="node">kg</span>} />).container;
    const slot = node.querySelector('[data-part="end"]');
    expect(slot?.getAttribute('aria-hidden')).toBeNull();
    expect(screen.getByTestId('node').textContent).toBe('kg');
    expect(render(<Input aria-label="None" />).container.querySelector('[data-part="start"]')).toBeNull();
  });

  it('focuses the input when the box is pressed outside the control', () => {
    const { container } = render(<Input aria-label="Search" start="search" />);
    const input = screen.getByRole('textbox', { name: 'Search' });
    const start = container.querySelector('[data-part="start"]') as HTMLElement;
    fireEvent.mouseDown(start);
    expect(document.activeElement).toBe(input);
  });

  it('focuses the input from the box inside an ancestor with a tabindex', () => {
    const { container } = render(
      <div tabIndex={-1} data-testid="dialog">
        <Input aria-label="Name" end="px" />
      </div>,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    fireEvent.mouseDown(container.querySelector('[data-part="end"]') as HTMLElement);
    expect(document.activeElement).toBe(input);
    (document.activeElement as HTMLElement).blur();
    fireEvent.mouseDown(root(container));
    expect(document.activeElement).toBe(input);
  });

  it('leaves the press to an interactive element inside the box', () => {
    const { container } = render(<Input aria-label="Code" end={<a href="#help">Help</a>} />);
    const link = container.querySelector('a') as HTMLElement;
    const ev = fireEvent.mouseDown(link);
    expect(ev).toBe(true);
    expect(document.activeElement).not.toBe(screen.getByRole('textbox', { name: 'Code' }));
  });

  it('does not focus a disabled input from the box', () => {
    const { container } = render(<Input aria-label="Off" disabled />);
    fireEvent.mouseDown(root(container));
    expect(document.activeElement).not.toBe(container.querySelector('input'));
  });

  it('renders the demo with every content case and no bare button', () => {
    const { container } = render(<InputDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[title]')).toBeNull();
    const arabic = container.querySelector('[data-demo-case="long-arabic"]');
    expect(arabic?.querySelector('input[type="email"]')?.closest('[lang]')?.getAttribute('lang')).toBe('ar');
  });

  it('stamps data-variant only when a variant is passed (order 1.23)', () => {
    const { container, rerender } = render(<Input aria-label="Name" />);
    const root = () => container.querySelector('[data-ds="input"]');
    expect(root()?.hasAttribute('data-variant')).toBe(false);
    rerender(<Input aria-label="Name" variant="filled" />);
    expect(root()?.getAttribute('data-variant')).toBe('filled');
  });
});
