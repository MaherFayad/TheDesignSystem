import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import { ButtonGroup } from '../ButtonGroup';
import CloseButtonDemo from './CloseButton.demo';
import { CloseButton } from './index';

describe('CloseButton', () => {
  it('renders a ghost square button named Close with the close icon', () => {
    render(<CloseButton />);
    const el = screen.getByRole('button', { name: 'Close' });
    expect(el.getAttribute('data-ds')).toBe('close-button');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('title')).toBe(false);
    const icon = el.querySelector('[data-part="icon"] [data-ds="icon"]');
    expect(icon?.getAttribute('data-icon')).toBe('close');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('switches the default name under an Arabic Theme, and a label wins', () => {
    render(
      <Theme lang="ar">
        <CloseButton />
        <CloseButton label="إغلاق اللوحة" />
      </Theme>,
    );
    expect(screen.getByRole('button', { name: 'إغلاق' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'إغلاق اللوحة' })).not.toBeNull();
  });

  it('activates with click, Enter and Space, and not while disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<CloseButton onClick={onClick} />);
    const el = screen.getByRole('button');
    await user.click(el);
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
    rerender(<CloseButton onClick={onClick} disabled />);
    await user.click(el);
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(el.getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps ghost inside a group, takes the group size', () => {
    render(
      <ButtonGroup size="lg" emphasis="solid" aria-label="Panel">
        <CloseButton />
      </ButtonGroup>,
    );
    const el = screen.getByRole('button');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    expect(el.getAttribute('data-size')).toBe('lg');
  });

  it('takes ref as a prop', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<CloseButton ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('renders every demo case', () => {
    const { container } = render(<CloseButtonDemo />);
    for (const id of ['variants', 'one', 'many', 'long-text', 'long-arabic', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
  });
});
