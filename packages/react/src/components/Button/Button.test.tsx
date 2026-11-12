import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ButtonDemo from './Button.demo';
import { Button } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="button"]');
  if (!el) throw new Error('no button rendered');
  return el;
}

describe('Button', () => {
  it('renders a native button with the anatomy and the default axes', () => {
    const { container } = render(<Button>Save changes</Button>);
    const el = root(container);
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.getAttribute('data-shape')).toBe('default');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('data-loading')).toBe(false);
    expect(el.hasAttribute('data-disabled')).toBe(false);
    expect(el.hasAttribute('aria-disabled')).toBe(false);
    const label = el.querySelector('[data-part="label"]');
    expect(label?.textContent).toBe('Save changes');
    expect(el.querySelector('[data-part="spinner"]')).toBeNull();
  });

  it('sets the axis attributes from props', () => {
    const { container } = render(
      <Button size="lg" tone="accent" emphasis="solid" shape="pill" type="submit" fullWidth>
        Publish page
      </Button>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.getAttribute('type')).toBe('submit');
    expect(el.getAttribute('data-full-width')).toBe('');
  });

  it('renders icons as parts around the label, by name or as an element', () => {
    const { container } = render(
      <Button start="plus" end={<svg data-testid="custom" />}>
        Add file
      </Button>,
    );
    const el = root(container);
    const parts = Array.from(el.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['start', 'label', 'end']);
    const start = el.querySelector('[data-part="start"] [data-ds="icon"]');
    expect(start?.getAttribute('data-icon')).toBe('plus');
    expect(start?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-part="end"] [data-testid="custom"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Add file' })).toBe(el);
  });

  it('calls onClick and activates with Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save changes</Button>);
    const el = screen.getByRole('button', { name: 'Save changes' });
    await user.click(el);
    el.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('disabled keeps focus, sets aria-disabled and blocks activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onPointerDown = vi.fn();
    const { container } = render(
      <Button disabled onClick={onClick} onPointerDown={onPointerDown}>
        Save changes
      </Button>,
    );
    const el = root(container);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-disabled')).toBe('');
    await user.click(el);
    el.blur();
    await user.tab();
    expect(document.activeElement).toBe(el);
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
    expect(onPointerDown).not.toHaveBeenCalled();
  });

  it('does not submit its form while disabled or loading', () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Send form
        </Button>
      </form>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('loading shows the spinner, sets aria-busy and blocks clicks, without dimming', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <Button loading onClick={onClick} start="upload">
        Upload file
      </Button>,
    );
    const el = root(container);
    expect(el.getAttribute('data-loading')).toBe('');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.hasAttribute('data-disabled')).toBe(false);
    const spinner = el.querySelector('[data-part="spinner"]');
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    // The label stays in the tree, so the width holds; the hidden status says Loading once.
    const status = el.querySelector('[data-part="status"]');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.textContent).toBe('Loading');
    expect(screen.getByRole('button', { name: /^Upload file\s*Loading$/ })).toBe(el);
    await user.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the child element as the button with asChild', () => {
    const onClick = vi.fn();
    render(
      <Button asChild tone="accent" emphasis="solid" end="arrow-forward" onClick={onClick}>
        <a href="#pricing">See pricing</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'See pricing' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('#pricing');
    expect(link.getAttribute('data-ds')).toBe('button');
    expect(link.getAttribute('data-tone')).toBe('accent');
    expect(link.hasAttribute('type')).toBe(false);
    expect(link.querySelector('[data-part="label"]')?.textContent).toBe('See pricing');
    expect(link.querySelector('[data-part="end"]')).not.toBeNull();
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('a disabled asChild link loses its href and blocks click and middle click', () => {
    render(
      <Button asChild disabled>
        <a href="#pricing">See pricing</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'See pricing' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    for (const type of ['click', 'auxclick']) {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: type === 'auxclick' ? 1 : 0 });
      link.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });

  it('takes a custom loading label and the wrap prop', () => {
    const { container } = render(
      <Button loading loadingLabel="Saving changes" wrap>
        Save changes
      </Button>,
    );
    const el = root(container);
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Saving changes');
    expect(el.getAttribute('data-wrap')).toBe('');
    const plain = root(render(<Button>Save changes</Button>).container);
    expect(plain.querySelector('[data-part="status"]')).toBeNull();
    expect(plain.hasAttribute('data-wrap')).toBe(false);
  });

  it('takes ref as a prop, and passes className, style and other props through', () => {
    const ref = createRef<HTMLButtonElement>();
    const { container } = render(
      <Button ref={ref} className="x" style={{ opacity: 0.5 }} data-testid="b" aria-describedby="hint">
        Save changes
      </Button>,
    );
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.style.opacity).toBe('0.5');
    expect(el.getAttribute('data-testid')).toBe('b');
    expect(el.getAttribute('aria-describedby')).toBe('hint');
  });

  it('renders every demo case', () => {
    const { container } = render(<ButtonDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    const arabic = container.querySelector('[data-demo-case="long-arabic"] [data-ds="theme"]');
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"]')).not.toBeNull();
    expect(arabic?.getAttribute('lang')).toBe('ar');
    expect(arabic?.getAttribute('dir')).toBe('rtl');
    // Six tones by five emphases in the matrix.
    const variants = container.querySelector('[data-demo-case="variants"]');
    expect(variants?.querySelectorAll('[data-ds="button"][data-tone][data-emphasis]').length).toBeGreaterThanOrEqual(
      30,
    );
  });
});
