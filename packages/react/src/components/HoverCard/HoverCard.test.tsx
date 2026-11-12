import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import HoverCardDemo from './HoverCard.demo';
import { HoverCard, HoverCardContent, HoverCardTrigger, type HoverCardContentProps, type HoverCardProps } from './index';

// jsdom has no ResizeObserver, which Radix Popper reads for the arrow size.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="hover-card"]');

function Basic({ content, ...props }: HoverCardProps & { content?: Partial<HoverCardContentProps> }) {
  return (
    <HoverCard openDelay={0} closeDelay={0} {...props}>
      <HoverCardTrigger>
        <a href="#sara">Sara Ahmed</a>
      </HoverCardTrigger>
      <HoverCardContent {...content}>
        <p>Design lead.</p>
        <a href="#boards">Boards</a>
      </HoverCardContent>
    </HoverCard>
  );
}

describe('HoverCard', () => {
  it('renders nothing until the trigger is hovered or focused', () => {
    render(<Basic />);
    expect(rootEl()).toBeNull();
  });

  it('opens on keyboard focus with the anatomy, the size and the state', async () => {
    const user = userEvent.setup();
    render(<Basic size="sm" />);
    await user.tab();
    await waitFor(() => expect(rootEl()).not.toBeNull());
    const root = rootEl();
    expect(root?.getAttribute('data-size')).toBe('sm');
    expect(root?.getAttribute('data-state')).toBe('open');
    expect(root?.getAttribute('data-side')).toBe('bottom');
    expect(root?.hasAttribute('data-part')).toBe(false);
    expect(root?.querySelector(':scope > [data-part="body"]')?.textContent).toContain('Design lead.');
    expect(root?.querySelector('[data-part="arrow"]')).not.toBeNull();
    // Focus stays on the trigger; the links in the card are out of the tab order.
    expect(document.activeElement?.textContent).toBe('Sara Ahmed');
    await waitFor(() => expect(root?.querySelector('a[href="#boards"]')?.getAttribute('tabindex')).toBe('-1'));
  });

  it('opens at once on keyboard focus, without the hover delay', async () => {
    vi.useFakeTimers();
    try {
      render(
        <HoverCard openDelay={500}>
          <HoverCardTrigger>
            <a href="#sara">Sara Ahmed</a>
          </HoverCardTrigger>
          <HoverCardContent>Design lead.</HoverCardContent>
        </HoverCard>,
      );
      act(() => screen.getByText('Sara Ahmed').focus());
      expect(rootEl()).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('defaults to size md', () => {
    render(<Basic open />);
    expect(rootEl()?.getAttribute('data-size')).toBe('md');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    await user.tab();
    await waitFor(() => expect(rootEl()).not.toBeNull());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('opens on hover after the delay', () => {
    vi.useFakeTimers();
    try {
      render(
        <HoverCard openDelay={500}>
          <HoverCardTrigger>
            <a href="#sara">Sara Ahmed</a>
          </HoverCardTrigger>
          <HoverCardContent>Design lead.</HoverCardContent>
        </HoverCard>,
      );
      fireEvent.pointerEnter(screen.getByText('Sara Ahmed'), { pointerType: 'mouse' });
      expect(rootEl()).toBeNull();
      act(() => vi.advanceTimersByTime(500));
      expect(rootEl()).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders in the portal Theme and maps the logical side', () => {
    render(
      <Theme style="desk" dir="rtl" lang="ar">
        <Basic open content={{ side: 'end' }} />
      </Theme>,
    );
    const layer = rootEl()?.closest('[data-hover-card-layer]');
    expect(layer?.getAttribute('data-ds')).toBe('theme');
    expect(layer?.getAttribute('dir')).toBe('rtl');
    expect(rootEl()?.getAttribute('data-side')).toBe('left');
  });

  it('hides the arrow on request', () => {
    render(<Basic open content={{ arrow: false }} />);
    expect(rootEl()?.querySelector('[data-part="arrow"]')).toBeNull();
  });

  it('renders the demo cases', () => {
    const { container } = render(<HoverCardDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'long-text', 'long-arabic', 'loading', 'error']);
  });

  it('stays closed after an early Escape: the open delay never opens it again', () => {
    vi.useFakeTimers();
    try {
      render(
        <HoverCard openDelay={500}>
          <HoverCardTrigger>
            <a href="#sara">Sara Ahmed</a>
          </HoverCardTrigger>
          <HoverCardContent>Design lead.</HoverCardContent>
        </HoverCard>,
      );
      act(() => screen.getByText('Sara Ahmed').focus());
      expect(rootEl()).not.toBeNull();
      act(() => {
        fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
      });
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(rootEl()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
