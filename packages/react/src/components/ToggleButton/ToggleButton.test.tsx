import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ButtonGroup } from '../ButtonGroup';
import ToggleButtonDemo from './ToggleButton.demo';
import { ToggleButton } from './index';

describe('ToggleButton', () => {
  it('renders a native button with the anatomy, off by default', () => {
    render(<ToggleButton start="grid">Grid view</ToggleButton>);
    const el = screen.getByRole('button', { name: 'Grid view' });
    expect(el.getAttribute('data-ds')).toBe('toggle-button');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.getAttribute('aria-pressed')).toBe('false');
    expect(el.getAttribute('data-state')).toBe('off');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['start', 'label']);
  });

  it('toggles with click, Enter and Space, uncontrolled', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<ToggleButton onPressedChange={onPressedChange}>Bold</ToggleButton>);
    const el = screen.getByRole('button', { name: 'Bold' });
    await user.click(el);
    expect(el.getAttribute('aria-pressed')).toBe('true');
    expect(el.getAttribute('data-state')).toBe('on');
    await user.keyboard('{Enter}');
    expect(el.getAttribute('data-state')).toBe('off');
    await user.keyboard(' ');
    expect(el.getAttribute('data-state')).toBe('on');
    expect(onPressedChange.mock.calls.map((c) => c[0])).toEqual([true, false, true]);
  });

  it('follows the pressed prop when controlled', () => {
    const { rerender } = render(<ToggleButton pressed={false}>Bold</ToggleButton>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
    rerender(<ToggleButton pressed>Bold</ToggleButton>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('disabled keeps focus and does not toggle', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <ToggleButton disabled onPressedChange={onPressedChange}>
        Bold
      </ToggleButton>,
    );
    const el = screen.getByRole('button');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-disabled')).toBe('');
    await user.click(el);
    el.blur();
    await user.tab();
    expect(document.activeElement).toBe(el);
    await user.keyboard('{Enter}');
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(el.getAttribute('data-state')).toBe('off');
  });

  it('has an icon only form named by label', () => {
    render(<ToggleButton icon="eye" label="Show guides" defaultPressed />);
    const el = screen.getByRole('button', { name: 'Show guides' });
    expect(el.querySelector('[data-part="icon"] [data-ds="icon"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-part="label"]')).toBeNull();
    expect(el.getAttribute('data-state')).toBe('on');
  });

  it('takes size, emphasis and shape from a ButtonGroup, its own prop wins', () => {
    render(
      <ButtonGroup size="sm" emphasis="outline" shape="pill" aria-label="Formatting">
        <ToggleButton>Bold</ToggleButton>
        <ToggleButton emphasis="ghost">Italic</ToggleButton>
      </ButtonGroup>,
    );
    const [bold, italic] = screen.getAllByRole('button');
    expect(bold?.getAttribute('data-size')).toBe('sm');
    expect(bold?.getAttribute('data-emphasis')).toBe('outline');
    expect(bold?.getAttribute('data-shape')).toBe('pill');
    expect(italic?.getAttribute('data-emphasis')).toBe('ghost');
  });

  it('takes ref as a prop and passes props through', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ToggleButton ref={ref} className="x" data-testid="t">
        Bold
      </ToggleButton>,
    );
    expect(ref.current).toBe(screen.getByTestId('t'));
    expect(ref.current?.className).toBe('x');
  });

  it('renders every demo case', () => {
    const { container } = render(<ToggleButtonDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"]')).not.toBeNull();
  });
});
