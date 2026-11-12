import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ButtonGroup } from '../ButtonGroup';
import { DropdownMenuItem } from '../DropdownMenu';
import SplitButtonDemo from './SplitButton.demo';
import { SplitButton, type SplitButtonProps } from './index';

// jsdom has no layout: Radix Popper measures with ResizeObserver and calls pointer capture.
beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => undefined;
  proto.releasePointerCapture ??= () => undefined;
  proto.scrollIntoView ??= () => undefined;
});

type BasicProps = Omit<SplitButtonProps, 'label' | 'menuLabel' | 'children'> & { onSchedule?: () => void };

function Basic({ onSchedule, ...props }: BasicProps) {
  return (
    <SplitButton label="Publish page" menuLabel="More publish options" {...props}>
      <DropdownMenuItem onSelect={onSchedule}>Schedule publish</DropdownMenuItem>
      <DropdownMenuItem>Publish to staging</DropdownMenuItem>
      <DropdownMenuItem>Save as draft</DropdownMenuItem>
    </SplitButton>
  );
}

const root = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-ds="split-button"]')!;
const action = () => document.body.querySelector<HTMLElement>('[data-part="action"]')!;
const trigger = () => screen.getByRole('button', { name: 'More publish options' });
const menu = () => document.body.querySelector<HTMLElement>('[data-ds="dropdown-menu"]');
const items = () => Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'));

describe('SplitButton', () => {
  it('renders the root, the action and the trigger parts with the default axes', () => {
    const { container } = render(<Basic />);
    const r = root(container);
    expect(r.dataset.size).toBe('md');
    expect(r.dataset.tone).toBe('neutral');
    expect(r.dataset.emphasis).toBe('soft');
    expect(r.dataset.shape).toBe('default');
    expect(r.hasAttribute('data-part')).toBe(false);
    expect(action().getAttribute('data-part')).toBe('action');
    expect(action().getAttribute('data-ds')).toBe('button');
    expect(trigger().getAttribute('data-part')).toBe('trigger');
    expect(trigger().getAttribute('data-ds')).toBe('icon-button');
    expect(trigger().querySelector('svg')).not.toBeNull();
  });

  it('passes size, tone, emphasis and shape to both halves', () => {
    const { container } = render(<Basic size="lg" tone="accent" emphasis="solid" shape="pill" />);
    for (const el of [root(container), action(), trigger()]) {
      expect(el.dataset.size).toBe('lg');
      expect(el.dataset.tone).toBe('accent');
      expect(el.dataset.emphasis).toBe('solid');
      expect(el.dataset.shape).toBe('pill');
    }
  });

  it('takes unset axes from a ButtonGroup and lets its own props win', () => {
    render(
      <ButtonGroup attached size="sm" emphasis="outline" aria-label="Page actions">
        <SplitButton label="Publish page" menuLabel="More publish options" emphasis="ghost">
          <DropdownMenuItem>Schedule publish</DropdownMenuItem>
        </SplitButton>
      </ButtonGroup>,
    );
    expect(action().dataset.size).toBe('sm');
    expect(trigger().dataset.size).toBe('sm');
    expect(action().dataset.emphasis).toBe('ghost');
    expect(trigger().dataset.emphasis).toBe('ghost');
  });

  it('names the trigger by the menu and marks it as a menu button', () => {
    render(<Basic />);
    expect(trigger().getAttribute('aria-label')).toBe('More publish options');
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('data-state')).toBe('closed');
  });

  it('runs the action on click, Enter and Space, and does not open the menu', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Basic onClick={onClick} />);
    await user.click(action());
    action().focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(menu()).toBeNull();
  });

  it('Tab reaches the action, then the trigger', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.tab();
    expect(document.activeElement).toBe(action());
    await user.tab();
    expect(document.activeElement).toBe(trigger());
  });

  it('opens the menu from the trigger with Enter, focus on the first item', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    trigger().focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(menu()).not.toBeNull());
    expect(trigger().getAttribute('data-state')).toBe('open');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(document.activeElement).toBe(items()[0]));
  });

  it('opens with ArrowDown on the first item and with ArrowUp on the last', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Basic />);
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.activeElement).toBe(items()[0]));
    unmount();

    render(<Basic />);
    trigger().focus();
    await user.keyboard('{ArrowUp}');
    await waitFor(() => expect(document.activeElement).toBe(items().at(-1)));
  });

  it('Escape closes the menu and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    trigger().focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(document.activeElement).toBe(items()[0]));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger().getAttribute('data-state')).toBe('closed'));
    expect(document.activeElement).toBe(trigger());
    expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
  });

  it('runs a menu item and closes the menu', async () => {
    const user = userEvent.setup();
    const onSchedule = vi.fn();
    render(<Basic onSchedule={onSchedule} />);
    await user.click(trigger());
    await waitFor(() => expect(items()).toHaveLength(3));
    await user.click(items()[0]!);
    expect(onSchedule).toHaveBeenCalledOnce();
    await waitFor(() => expect(trigger().getAttribute('data-state')).toBe('closed'));
  });

  it('names the menu by the trigger and opens it toward the end, sized from the control', async () => {
    const user = userEvent.setup();
    render(<Basic size="sm" />);
    await user.click(trigger());
    await waitFor(() => expect(menu()).not.toBeNull());
    expect(menu()!.getAttribute('aria-labelledby')).toBe(trigger().id);
    expect(menu()!.dataset.size).toBe('sm');
    expect(menu()!.dataset.align).toBe('end');
  });

  it('opens controlled and reports changes', async () => {
    const onOpenChange = vi.fn();
    render(<Basic open onOpenChange={onOpenChange} />);
    await waitFor(() => expect(menu()).not.toBeNull());
    expect(trigger().getAttribute('data-state')).toBe('open');
  });

  it('loading blocks the action only and keeps the menu usable', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(<Basic loading loadingLabel="Publishing" onClick={onClick} />);
    expect(action().hasAttribute('data-loading')).toBe(true);
    expect(action().getAttribute('aria-busy')).toBe('true');
    expect(trigger().hasAttribute('data-loading')).toBe(false);
    expect(root(container).hasAttribute('data-loading')).toBe(false);
    expect(screen.getByRole('status').textContent).toBe('Publishing');
    await user.click(action());
    expect(onClick).not.toHaveBeenCalled();
    await user.click(trigger());
    await waitFor(() => expect(menu()).not.toBeNull());
  });

  it('disabled blocks both halves, which stay focusable', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(<Basic disabled onClick={onClick} />);
    expect(root(container).getAttribute('data-disabled')).toBe('');
    for (const el of [action(), trigger()]) {
      expect(el.getAttribute('aria-disabled')).toBe('true');
      expect(el.hasAttribute('data-disabled')).toBe(true);
      expect(el.hasAttribute('disabled')).toBe(false);
    }
    await user.click(action());
    await user.click(trigger());
    trigger().focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowUp}');
    expect(onClick).not.toHaveBeenCalled();
    expect(menu()).toBeNull();
  });

  it('spreads props and the ref onto the root and the actionRef onto the action', () => {
    let rootEl: HTMLDivElement | null = null;
    let actionEl: HTMLButtonElement | null = null;
    render(
      <Basic
        id="publish"
        className="extra"
        ref={(node) => {
          rootEl = node;
        }}
        actionRef={(node) => {
          actionEl = node;
        }}
      />,
    );
    expect(rootEl!.id).toBe('publish');
    expect(rootEl!.className).toBe('extra');
    expect(actionEl).toBe(action());
  });

  it('renders the demo', async () => {
    await act(async () => {
      render(<SplitButtonDemo />);
    });
    expect(document.querySelectorAll('[data-ds="split-button"]').length).toBeGreaterThan(10);
  });
});
