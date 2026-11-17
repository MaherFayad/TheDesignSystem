// Order M9.6: SheetConfirm, the confirm part in the header.
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import SheetDemo from './Sheet.demo';
import { Sheet, SheetBody, SheetConfirm, SheetContent, SheetTitle, SheetTrigger } from './index';

const proto = Element.prototype as unknown as Record<string, unknown>;
proto.setPointerCapture ??= () => undefined;
proto.releasePointerCapture ??= () => undefined;
proto.hasPointerCapture ??= () => false;
// jsdom has no ResizeObserver, which Radix Popper reads for the Tooltip arrow.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
const tooltip = () => document.body.querySelector<HTMLElement>('[data-ds="tooltip"]');

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="sheet"]');

function ListSheet({
  onConfirm,
  disabled = false,
  platform,
  icon,
}: {
  onConfirm?: (event: MouseEvent) => void;
  disabled?: boolean;
  platform?: 'web' | 'ios';
  icon?: 'plus';
}) {
  return (
    <Theme platform={platform}>
      <Sheet>
        <SheetTrigger>
          <Button>New list</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>New list</SheetTitle>
          <SheetConfirm label="Save list" disabled={disabled} onClick={onConfirm} icon={icon} />
          <SheetBody>Body</SheetBody>
        </SheetContent>
      </Sheet>
    </Theme>
  );
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'New list' }));
  return screen.findByRole('dialog');
}

describe('SheetConfirm (order M9.6)', () => {
  it('moves into the header after the close control, as the confirm part with the check icon and the label', async () => {
    const user = userEvent.setup();
    render(<ListSheet />);
    const panel = await open(user);
    const header = panel.querySelector(':scope > [data-part="header"]') as HTMLElement;
    expect(Array.from(header.children).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'close', 'confirm']);
    const confirm = screen.getByRole('button', { name: 'Save list' });
    expect(confirm.getAttribute('data-ds')).toBe('button');
    expect(confirm.getAttribute('data-part')).toBe('confirm');
    expect(confirm.getAttribute('data-emphasis')).toBe('solid');
    expect(confirm.getAttribute('data-tone')).toBe('accent');
    expect(confirm.querySelector('[data-ds="icon"]')).not.toBeNull();
    // Not in the body.
    expect(panel.querySelector('[data-part="body"] [data-part="confirm"]')).toBeNull();
  });

  it('runs onClick and closes the sheet; preventDefault keeps it open', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const { unmount } = render(<ListSheet onConfirm={onConfirm} />);
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    unmount();
    render(<ListSheet onConfirm={(event) => event.preventDefault()} />);
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
  });

  it('is aria-disabled while disabled, stays in the tab order, and a press does nothing', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ListSheet onConfirm={onConfirm} disabled />);
    await open(user);
    const confirm = screen.getByRole('button', { name: 'Save list' });
    expect(confirm.getAttribute('aria-disabled')).toBe('true');
    expect(confirm.hasAttribute('disabled')).toBe(false);
    await user.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
    // Close, then confirm, in the tab order.
    const close = screen.getByRole('button', { name: 'Close sheet' });
    close.focus();
    await user.tab();
    expect(document.activeElement).toBe(confirm);
  });

  it('takes another icon', async () => {
    const user = userEvent.setup();
    render(<ListSheet icon="plus" />);
    await open(user);
    expect(screen.getByRole('button', { name: 'Save list' }).querySelector('[data-ds="icon"]')).not.toBeNull();
  });

  it('shows a Tooltip with the label on ios, where the platform draws the icon only', async () => {
    const user = userEvent.setup();
    render(<ListSheet platform="ios" />);
    await open(user);
    screen.getByRole('button', { name: 'Close sheet' }).focus();
    await user.tab();
    await waitFor(() => expect(tooltip()).not.toBeNull());
    expect(tooltip()?.textContent).toContain('Save list');
  });

  it('renders no Tooltip on the web, where the label shows', async () => {
    const user = userEvent.setup();
    render(<ListSheet platform="web" />);
    await open(user);
    screen.getByRole('button', { name: 'Close sheet' }).focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save list' }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(tooltip()).toBeNull();
  });

  it('demo: the confirm case opens in English and Arabic', () => {
    const { container } = render(<SheetDemo />);
    const triggers = Array.from(container.querySelectorAll('[data-demo-case="confirm"] [data-demo-trigger]')).map((t) =>
      t.getAttribute('data-demo-trigger'),
    );
    expect(triggers).toEqual(['confirm', 'confirm-arabic']);
  });
});
