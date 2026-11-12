import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import DropdownMenuDemo from './DropdownMenu.demo';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuProps,
} from './index';

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

const roots = () => Array.from(document.body.querySelectorAll<HTMLElement>('[data-ds="dropdown-menu"]'));
const rootEl = () => roots()[0] ?? null;

function Basic({
  onSelect,
  children,
  ...props
}: DropdownMenuProps & { onSelect?: (event: Event) => void; children?: ReactNode }) {
  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger>
        <Button>Board actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {children ?? (
          <>
            <DropdownMenuLabel>Board</DropdownMenuLabel>
            <DropdownMenuItem start="edit" shortcut="F2" onSelect={onSelect}>
              Rename board
            </DropdownMenuItem>
            <DropdownMenuItem start="copy">Duplicate board</DropdownMenuItem>
            <DropdownMenuItem disabled>Download board</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem tone="danger" start="trash">
              Delete board
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function openWithKeyboard(user: ReturnType<typeof userEvent.setup>, key = '{Enter}') {
  const trigger = screen.getByRole('button', { name: 'Board actions' });
  act(() => trigger.focus());
  await user.keyboard(key);
  return screen.findByRole('menu');
}

describe('DropdownMenu', () => {
  it('renders nothing until it opens, then a Theme layer in body with the root inside', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Theme>
        <Basic />
      </Theme>,
    );
    expect(rootEl()).toBeNull();
    expect(document.body.querySelector('[data-menu-layer]')).toBeNull();
    const trigger = screen.getByRole('button', { name: 'Board actions' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('data-ds')).toBe('button');

    await user.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(menu).toBe(rootEl());
    expect(container.contains(menu)).toBe(false);
    expect(menu.getAttribute('data-size')).toBe('md');
    expect(menu.getAttribute('data-state')).toBe('open');
    expect(menu.hasAttribute('data-part')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    // Named by the trigger.
    expect(screen.getByRole('menu', { name: 'Board actions' })).toBe(menu);
    const layer = menu.closest('[data-menu-layer]');
    expect(layer?.getAttribute('data-ds')).toBe('theme');
    expect(layer?.parentElement).toBe(document.body);
    expect(document.body.querySelector('[title]')).toBeNull();
  });

  it('stamps the parts: label, item, start, text, shortcut, separator, danger tone', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const menu = await openWithKeyboard(user);
    const parts = Array.from(menu.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['label', 'item', 'item', 'item', 'separator', 'item']);
    const rename = screen.getByRole('menuitem', { name: /Rename board/ });
    expect(Array.from(rename.children).map((c) => c.getAttribute('data-part'))).toEqual(['start', 'text', 'shortcut']);
    expect(rename.querySelector('[data-part="shortcut"]')?.textContent).toBe('F2');
    expect(rename.querySelector('[data-part="shortcut"]')?.getAttribute('dir')).toBe('ltr');
    expect(rename.querySelector('[data-part="start"] [data-ds="icon"]')?.getAttribute('data-icon')).toBe('edit');
    expect(rename.hasAttribute('data-tone')).toBe(false);
    expect(screen.getByRole('menuitem', { name: 'Delete board' }).getAttribute('data-tone')).toBe('danger');
    expect(menu.querySelector('[data-part="separator"]')?.getAttribute('role')).toBe('separator');
  });

  it('size sm stamps data-size on the root', async () => {
    const user = userEvent.setup();
    render(<Basic size="sm" />);
    const menu = await openWithKeyboard(user);
    expect(menu.getAttribute('data-size')).toBe('sm');
  });

  it('opens with Enter on the first item, ArrowDown moves, Home and End jump, skipping the disabled item', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await openWithKeyboard(user);
    await waitFor(() => expect(document.activeElement?.textContent).toContain('Rename board'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Duplicate board');
    await user.keyboard('{ArrowDown}');
    // Download board is disabled: skipped.
    expect(document.activeElement?.textContent).toBe('Delete board');
    await user.keyboard('{Home}');
    expect(document.activeElement?.textContent).toContain('Rename board');
    await user.keyboard('{End}');
    expect(document.activeElement?.textContent).toBe('Delete board');
  });

  it('ArrowUp on the trigger opens with focus on the last item', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await openWithKeyboard(user, '{ArrowUp}');
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Delete board'));
  });

  it('typeahead moves to the item that starts with the typed letters', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await openWithKeyboard(user);
    await user.keyboard('del');
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Delete board'));
  });

  it('selecting an item runs onSelect, closes the menu and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<Basic onSelect={onSelect} onOpenChange={onOpenChange} />);
    await openWithKeyboard(user);
    await waitFor(() => expect(document.activeElement?.textContent).toContain('Rename board'));
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.body.querySelector('[data-menu-layer]')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Board actions' }));
  });

  it('Escape closes and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await openWithKeyboard(user);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Board actions' }));
  });

  it('a disabled item is aria-disabled, stays in the menu and does not run onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Basic>
        <DropdownMenuItem>Rename board</DropdownMenuItem>
        <DropdownMenuItem disabled onSelect={onSelect}>
          Download board
        </DropdownMenuItem>
      </Basic>,
    );
    await openWithKeyboard(user);
    const item = screen.getByRole('menuitem', { name: 'Download board' });
    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect(item.getAttribute('data-disabled')).toBe('');
    await user.click(item);
    expect(onSelect).not.toHaveBeenCalled();
    expect(rootEl()).not.toBeNull();
  });

  it('checkbox items toggle and show the check icon, radio items pick one value', async () => {
    const user = userEvent.setup();
    function Options() {
      const [grid, setGrid] = useState(true);
      const [sort, setSort] = useState('name');
      return (
        <Basic>
          <DropdownMenuGroup>
            <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
              Show grid
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuRadioGroup value={sort} onValueChange={setSort} aria-label="Sort by">
            <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="owner">Owner</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </Basic>
      );
    }
    render(<Options />);
    await openWithKeyboard(user);
    const grid = screen.getByRole('menuitemcheckbox', { name: 'Show grid' });
    expect(grid.getAttribute('aria-checked')).toBe('true');
    expect(grid.getAttribute('data-state')).toBe('checked');
    expect(grid.firstElementChild?.getAttribute('data-part')).toBe('indicator');
    expect(grid.querySelector('[data-part="indicator"] [data-ds="icon"]')?.getAttribute('data-icon')).toBe('check');
    expect(grid.closest('[data-part="group"]')?.getAttribute('role')).toBe('group');

    await user.click(grid);
    await waitFor(() => expect(rootEl()).toBeNull());
    await openWithKeyboard(user);
    const gridAgain = screen.getByRole('menuitemcheckbox', { name: 'Show grid' });
    expect(gridAgain.getAttribute('aria-checked')).toBe('false');
    expect(gridAgain.querySelector('[data-ds="icon"]')).toBeNull();

    const owner = screen.getByRole('menuitemradio', { name: 'Owner' });
    expect(owner.getAttribute('data-part')).toBe('radio-item');
    expect(owner.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('menuitemradio', { name: 'Name' }).getAttribute('aria-checked')).toBe('true');
    await user.click(owner);
    await waitFor(() => expect(rootEl()).toBeNull());
    await openWithKeyboard(user);
    expect(screen.getByRole('menuitemradio', { name: 'Owner' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('menuitemradio', { name: 'Owner' }).querySelector('[data-icon="check"]')).not.toBeNull();
    expect(screen.getByRole('group', { name: 'Sort by' }).getAttribute('data-part')).toBe('group');
  });

  it('an indeterminate checkbox item shows a minus', async () => {
    const user = userEvent.setup();
    render(
      <Basic>
        <DropdownMenuCheckboxItem checked="indeterminate">Show layers</DropdownMenuCheckboxItem>
      </Basic>,
    );
    await openWithKeyboard(user);
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show layers' });
    expect(item.getAttribute('aria-checked')).toBe('mixed');
    expect(item.querySelector('[data-icon="minus"]')).not.toBeNull();
  });

  function WithSub() {
    return (
      <Basic>
        <DropdownMenuItem>Rename board</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger start="link">Share board</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Invite people</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </Basic>
    );
  }

  it('a submenu opens with ArrowRight in its own Theme layer as a sub-content root, ArrowLeft closes it', async () => {
    const user = userEvent.setup();
    render(
      <Theme>
        <WithSub />
      </Theme>,
    );
    await openWithKeyboard(user);
    await user.keyboard('{ArrowDown}');
    const subTrigger = screen.getByRole('menuitem', { name: 'Share board' });
    expect(document.activeElement).toBe(subTrigger);
    expect(subTrigger.getAttribute('data-part')).toBe('sub-trigger');
    expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(subTrigger.querySelector('[data-part="end"] [data-icon="chevron-forward"]')?.hasAttribute('data-mirror')).toBe(true);

    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(roots()).toHaveLength(2));
    const sub = roots()[1];
    expect(sub?.getAttribute('data-part')).toBe('sub-content');
    expect(sub?.getAttribute('data-size')).toBe('md');
    expect(sub?.getAttribute('role')).toBe('menu');
    expect(sub?.closest('[data-menu-layer]')?.parentElement).toBe(document.body);
    expect(subTrigger.getAttribute('data-state')).toBe('open');
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Copy link'));

    await user.keyboard('{ArrowLeft}');
    await waitFor(() => expect(roots()).toHaveLength(1));
    expect(document.activeElement).toBe(subTrigger);
  });

  it('in RTL the submenu opens with ArrowLeft and closes with ArrowRight', async () => {
    const user = userEvent.setup();
    render(
      <Theme dir="rtl" lang="ar">
        <WithSub />
      </Theme>,
    );
    await openWithKeyboard(user);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    expect(roots()).toHaveLength(1);
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => expect(roots()).toHaveLength(2));
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Copy link'));
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(roots()).toHaveLength(1));
  });

  it('copies every axis of its Theme into the portal layer, nested themes and Arabic included', async () => {
    render(
      <Theme style="studio" scheme="dark">
        <Theme style="desk" scheme="light" density="compact" contrast="more" dir="rtl" lang="ar">
          <Basic defaultOpen />
        </Theme>
      </Theme>,
    );
    const menu = await screen.findByRole('menu');
    const layer = menu.closest<HTMLElement>('[data-menu-layer]');
    expect(layer?.getAttribute('data-style')).toBe('desk');
    expect(layer?.getAttribute('data-scheme')).toBe('light');
    expect(layer?.getAttribute('data-density')).toBe('compact');
    expect(layer?.getAttribute('data-contrast')).toBe('more');
    expect(layer?.getAttribute('dir')).toBe('rtl');
    expect(layer?.getAttribute('lang')).toBe('ar');
  });

  it('is not modal by default: the page stays in the accessibility tree; modal hides it', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Basic />);
    await openWithKeyboard(user);
    expect(document.querySelector('[aria-hidden="true"] [data-ds="button"]')).toBeNull();
    unmount();
    render(<Basic modal />);
    await openWithKeyboard(user);
    await waitFor(() => expect(document.querySelector('[aria-hidden="true"] [data-ds="button"]')).not.toBeNull());
  });

  it('is controllable', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open from outside</Button>
          <Basic open={open} onOpenChange={setOpen} />
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Open from outside' }));
    expect(await screen.findByRole('menu')).not.toBeNull();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('the demo renders every case, and its triggers carry data-demo-trigger', () => {
    render(
      <Theme>
        <DropdownMenuDemo />
      </Theme>,
    );
    const cases = Array.from(document.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    expect(document.querySelectorAll('[data-demo-case="variants"] [data-demo-trigger]').length).toBeGreaterThanOrEqual(3);
    expect(document.querySelectorAll('button:not([data-ds])')).toHaveLength(0);
  });
});
