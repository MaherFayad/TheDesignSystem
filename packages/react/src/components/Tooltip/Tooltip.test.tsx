import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import TooltipDemo from './Tooltip.demo';
import { Tooltip, TooltipProvider, type TooltipProps } from './index';

// jsdom has no ResizeObserver, which Radix Popper reads for the arrow size.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="tooltip"]');

function Basic(props: Partial<TooltipProps>) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip content="Copy link" {...props}>
        <IconButton icon="link" label="Copy link" />
      </Tooltip>
    </TooltipProvider>
  );
}

describe('Tooltip', () => {
  it('renders nothing until the trigger is hovered or focused', () => {
    render(<Basic />);
    expect(rootEl()).toBeNull();
  });

  it('does not describe the trigger with a hint that repeats its name', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.tab();
    await waitFor(() => expect(rootEl()).not.toBeNull());
    expect(screen.getByRole('button', { name: 'Copy link' }).hasAttribute('aria-describedby')).toBe(false);
  });

  it('keeps focus on the trigger when disabled turns on', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Basic />);
    await user.tab();
    const trigger = screen.getByRole('button', { name: 'Copy link' });
    await waitFor(() => expect(rootEl()).not.toBeNull());
    rerender(<Basic disabled />);
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(trigger);
    rerender(<Basic />);
    expect(rootEl()).toBeNull();
  });

  it('shows on keyboard focus, describes the trigger and keeps its name', async () => {
    const user = userEvent.setup();
    render(<Basic content="Copies the link to this layer" shortcut="Ctrl+L" />);
    await user.tab();
    const trigger = screen.getByRole('button', { name: 'Copy link' });
    expect(document.activeElement).toBe(trigger);
    await waitFor(() => expect(rootEl()).not.toBeNull());
    const root = rootEl();
    expect(root?.getAttribute('role')).toBe('tooltip');
    expect(trigger.getAttribute('aria-describedby')).toBe(root?.id);
    expect(trigger.getAttribute('aria-label')).toBe('Copy link');
    expect(root?.getAttribute('data-state')).toMatch(/open$/);
    expect(root?.getAttribute('data-side')).toBe('top');
    expect(root?.hasAttribute('data-part')).toBe(false);
    const shortcut = root?.querySelector('[data-part="shortcut"]');
    expect(shortcut?.textContent).toBe('Ctrl+L');
    expect(shortcut?.querySelector('bdi')?.getAttribute('dir')).toBe('ltr');
    expect(root?.querySelector('[data-part="arrow"]')).not.toBeNull();
  });

  it('hides on Escape without moving focus', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.tab();
    await waitFor(() => expect(rootEl()).not.toBeNull());
    const trigger = screen.getByRole('button', { name: 'Copy link' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('shows on hover after the delay and hides on pointer down', async () => {
    vi.useFakeTimers();
    try {
      render(
        <TooltipProvider delayDuration={500}>
          <Tooltip content="Copy link">
            <IconButton icon="link" label="Copy link" />
          </Tooltip>
        </TooltipProvider>,
      );
      const trigger = screen.getByRole('button', { name: 'Copy link' });
      fireEvent.pointerMove(trigger, { pointerType: 'mouse' });
      expect(rootEl()).toBeNull();
      act(() => vi.advanceTimersByTime(500));
      expect(rootEl()?.getAttribute('data-state')).toBe('delayed-open');
      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      act(() => vi.advanceTimersByTime(10));
      expect(rootEl()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('is controlled through open and onOpenChange', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Basic open={false} onOpenChange={onOpenChange} />);
    expect(rootEl()).toBeNull();
    rerender(<Basic open onOpenChange={onOpenChange} />);
    expect(rootEl()).not.toBeNull();
    const user = userEvent.setup();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(rootEl()).not.toBeNull();
  });

  it('maps the logical side and renders in the portal Theme', () => {
    render(
      <Theme style="desk" dir="rtl" lang="ar">
        <Basic open side="start" />
      </Theme>,
    );
    const layer = rootEl()?.closest('[data-tooltip-layer]');
    expect(layer?.getAttribute('data-ds')).toBe('theme');
    expect(layer?.getAttribute('data-style')).toBe('desk');
    expect(layer?.getAttribute('dir')).toBe('rtl');
    expect(rootEl()?.getAttribute('data-side')).toBe('right');
  });

  it('works without a TooltipProvider', () => {
    render(
      <Tooltip content="Copy link" open>
        <IconButton icon="link" label="Copy link" />
      </Tooltip>,
    );
    expect(rootEl()).not.toBeNull();
  });

  it('renders the trigger alone when disabled, and hides the arrow on request', () => {
    const { rerender } = render(<Basic open disabled />);
    expect(rootEl()).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy link' }).hasAttribute('aria-describedby')).toBe(false);
    rerender(<Basic open arrow={false} />);
    expect(rootEl()?.querySelector('[data-part="arrow"]')).toBeNull();
  });

  it('shows on focus of a disabled action, which stays focusable', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip content="Select a layer to delete it">
          <Button disabled>Delete layer</Button>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.tab();
    expect(document.activeElement?.textContent).toContain('Delete layer');
    await waitFor(() => expect(rootEl()?.textContent).toContain('Select a layer to delete it'));
  });

  it('warns in development when the trigger has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Tooltip content="Copy link">
        <IconButton icon="link" label={undefined as unknown as string} />
      </Tooltip>,
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('renders the demo cases', () => {
    const { container } = render(<TooltipDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
  });
});
