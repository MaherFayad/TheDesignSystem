// Order C5 (item 4): a List row as the trigger of an ActionSheet, a menu or a dialog.
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { ActionSheet, ActionSheetAction, ActionSheetContent, ActionSheetTrigger } from '../ActionSheet';
import { Dialog, DialogContent, DialogTrigger } from '../Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../DropdownMenu';
import { List, ListItem } from './index';

const proto = Element.prototype as unknown as Record<string, unknown>;
proto.setPointerCapture ??= () => undefined;
proto.releasePointerCapture ??= () => undefined;
proto.hasPointerCapture ??= () => false;
proto.scrollIntoView ??= () => undefined;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function RemoveRow({ onRemove, disabled = false, lang }: { onRemove?: () => void; disabled?: boolean; lang?: 'ar' }) {
  const ar = lang === 'ar';
  return (
    <Theme platform="web" lang={lang} dir={ar ? 'rtl' : undefined}>
      <List variant="inset" aria-label={ar ? 'إزالة البطاقة' : 'Remove pass'}>
        <ActionSheet>
          <ActionSheetTrigger>
            <ListItem tone="danger" title={ar ? 'إزالة البطاقة' : 'Remove pass'} disabled={disabled} />
          </ActionSheetTrigger>
          <ActionSheetContent title={ar ? 'ليلة العود' : 'Oud night'}>
            <ActionSheetAction tone="danger" onClick={onRemove}>
              {ar ? 'إزالة البطاقة' : 'Remove pass'}
            </ActionSheetAction>
          </ActionSheetContent>
        </ActionSheet>
      </List>
    </Theme>
  );
}

const row = () => document.querySelector<HTMLElement>('[data-ds="list"] > [data-part="item"]')!;

describe('ListItem as a trigger (order C5)', () => {
  it('puts the trigger props on the action, not on the li: the row is an action row with tone danger', () => {
    render(<RemoveRow />);
    const li = row();
    const title = screen.getByRole('button', { name: 'Remove pass' });
    expect(li.tagName).toBe('LI');
    expect(li.hasAttribute('data-action')).toBe(true);
    expect(li.getAttribute('data-tone')).toBe('danger');
    expect(li.hasAttribute('aria-haspopup')).toBe(false);
    expect(li.hasAttribute('data-state')).toBe(false);
    expect(li.hasAttribute('type')).toBe(false);
    expect(title.getAttribute('data-part')).toBe('title');
    expect(title.getAttribute('aria-haspopup')).toBe('dialog');
    expect(title.getAttribute('aria-expanded')).toBe('false');
    expect(title.getAttribute('data-state')).toBe('closed');
    expect(title.tabIndex).toBe(0);
  });

  it('opens the ActionSheet on a press and returns focus to the row on close', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<RemoveRow onRemove={onRemove} />);
    const title = screen.getByRole('button', { name: 'Remove pass' });
    await user.click(title);
    const sheet = await screen.findByRole('alertdialog');
    expect(title.getAttribute('aria-expanded')).toBe('true');
    expect(title.getAttribute('aria-controls')).toBe(sheet.id);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(title));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('opens on Enter and on Space, as a native button', async () => {
    const user = userEvent.setup();
    render(<RemoveRow />);
    const title = screen.getByRole('button', { name: 'Remove pass' });
    title.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('alertdialog')).toBeTruthy();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(title));
    await user.keyboard(' ');
    expect(await screen.findByRole('alertdialog')).toBeTruthy();
  });

  it('runs the action from the sheet', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<RemoveRow onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: 'Remove pass' }));
    const sheet = await screen.findByRole('alertdialog');
    await user.click(Array.from(sheet.querySelectorAll('button')).find((b) => b.textContent === 'Remove pass')!);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('a disabled trigger row stays focusable and opens nothing', async () => {
    const user = userEvent.setup();
    render(<RemoveRow disabled />);
    const title = screen.getByRole('button', { name: 'Remove pass' });
    expect(title.getAttribute('aria-disabled')).toBe('true');
    await user.click(title);
    title.focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(document.activeElement).toBe(title);
  });

  it('opens a menu with the keyboard and returns focus to the row', async () => {
    const user = userEvent.setup();
    render(
      <Theme>
        <List aria-label="Sort">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <ListItem title="Sort by" end="Date added" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Title</DropdownMenuItem>
              <DropdownMenuItem>Date added</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </List>
      </Theme>,
    );
    const title = screen.getByRole('button', { name: 'Sort by' });
    expect(title.getAttribute('aria-haspopup')).toBe('menu');
    title.focus();
    await user.keyboard('{Enter}');
    const menu = await screen.findByRole('menu');
    expect(menu.getAttribute('aria-labelledby')).toBe(title.id);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(title));
  });

  it('opens a dialog and keeps the caller onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Theme>
        <List aria-label="Account">
          <Dialog>
            <DialogTrigger>
              <ListItem title="Change name" onSelect={onSelect} />
            </DialogTrigger>
            <DialogContent title="Change name" />
          </Dialog>
        </List>
      </Theme>,
    );
    await user.click(screen.getByRole('button', { name: 'Change name' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('names the row in Arabic and keeps the same parts', async () => {
    const user = userEvent.setup();
    render(<RemoveRow lang="ar" />);
    const title = screen.getByRole('button', { name: 'إزالة البطاقة' });
    expect(row().getAttribute('data-tone')).toBe('danger');
    await user.click(title);
    expect(await screen.findByRole('alertdialog')).toBeTruthy();
  });

  it('a plain row and a linked row are never triggers', () => {
    render(
      <List aria-label="Rows">
        <ListItem title="Plain" />
        <ListItem title="Linked" href="#x" />
      </List>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(document.querySelectorAll('[aria-haspopup]').length).toBe(0);
  });
});
