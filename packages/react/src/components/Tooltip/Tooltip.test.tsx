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

  it('opens on a touch long press, and a moving or short touch does not open it', () => {
    vi.useFakeTimers();
    try {
      render(
        <TooltipProvider>
          <Tooltip content="Copy link">
            <IconButton icon="link" label="Copy link" />
          </Tooltip>
        </TooltipProvider>,
      );
      const trigger = screen.getByRole('button', { name: 'Copy link' });
      fireEvent.pointerDown(trigger, { pointerType: 'touch', pointerId: 1, clientX: 10, clientY: 10 });
      act(() => vi.advanceTimersByTime(300));
      fireEvent.pointerUp(trigger, { pointerType: 'touch', pointerId: 1 });
      act(() => vi.advanceTimersByTime(400));
      expect(rootEl()).toBeNull();
      fireEvent.pointerDown(trigger, { pointerType: 'touch', pointerId: 2, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(trigger, { pointerType: 'touch', pointerId: 2, clientX: 40, clientY: 10 });
      act(() => vi.advanceTimersByTime(600));
      expect(rootEl()).toBeNull();
      fireEvent.pointerDown(trigger, { pointerType: 'touch', pointerId: 3, clientX: 10, clientY: 10 });
      act(() => vi.advanceTimersByTime(500));
      expect(rootEl()).not.toBeNull();
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

// ------------------------------------------------------------------ motion, order 1.22

describe('motion (order 1.22)', () => {
  it('tooltip-follow: tabbing to the next control hides the last tooltip at once and keeps the next one open', async () => {
    const calls: [Element, Keyframe[]][] = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, frames: Keyframe[] | PropertyIndexedKeyframes | null) {
      calls.push([this, frames as Keyframe[]]);
      return { cancel() {}, finished: Promise.resolve(), id: '' } as unknown as Animation;
    };
    try {
      const user = userEvent.setup();
      render(
        <TooltipProvider delayDuration={0}>
          <Tooltip content="Copy layer">
            <IconButton icon="copy" label="Copy" />
          </Tooltip>
          <Tooltip content="Edit layer">
            <IconButton icon="edit" label="Edit" />
          </Tooltip>
        </TooltipProvider>,
      );
      await user.tab();
      const tips = () => Array.from(document.body.querySelectorAll<HTMLElement>('[data-ds="tooltip"]'));
      await waitFor(() => expect(tips().some((el) => el.textContent?.includes('Copy layer'))).toBe(true));
      const first = tips()[0];
      await user.tab();
      await waitFor(() => expect(tips().some((el) => el.textContent?.includes('Edit layer'))).toBe(true));
      const next = tips().find((el) => el.textContent?.includes('Edit layer'));
      expect(next?.getAttribute('data-state')).toBe('instant-open');
      if (first?.isConnected) expect(calls.some(([el, frames]) => el === first && frames[0]?.opacity === 0)).toBe(true);
    } finally {
      Element.prototype.animate = original;
    }
  });

  describe('Tooltip.css', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Tooltip.css'), 'utf8');
    it('rises on the snappy spring and closes faster', () => {
      expect(css).toContain('--_tooltip-duration-in: var(--ds-duration-spring-snappy);');
      // Order 1.29 (review 3, N22): the exit is never slower than the entrance (Studio enters in 70ms).
      expect(css).toContain('--_tooltip-duration-out: min(var(--ds-duration-quick), var(--_tooltip-duration-in));');
    });
    it('review B2: the reduced form applies under data-motion="reduce" too', () => {
      expect(css).toContain(":root[data-motion='reduce'] [data-ds='tooltip'][data-state],");
    });
  });
});
