import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import MenubarDemo from './Menubar.demo';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarEnd,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  type MenubarProps,
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

const menus = () => Array.from(document.body.querySelectorAll<HTMLElement>('[data-menu-layer="menubar"] [data-ds="dropdown-menu"]'));

function Bar({ onSave, ...props }: MenubarProps & { onSave?: () => void }) {
  return (
    <Menubar aria-label="Application menu" {...props}>
      <MenubarMenu value="file">
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem shortcut="Ctrl+S" onSelect={onSave}>
            Save board
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Open recent</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Spring launch</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem tone="danger">Delete board</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Undo change</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="view">
        <MenubarTrigger disabled>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked>Show grid</MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarEnd>9:41</MenubarEnd>
    </Menubar>
  );
}

const trigger = (name: string) => screen.getByRole('menuitem', { name });

describe('Menubar', () => {
  it('renders the row: root, triggers with a text part, and the end slot', () => {
    render(<Bar />);
    const bar = screen.getByRole('menubar', { name: 'Application menu' });
    expect(bar.getAttribute('data-ds')).toBe('menubar');
    expect(bar.getAttribute('data-size')).toBe('md');
    expect(Array.from(bar.children).map((c) => c.getAttribute('data-part'))).toEqual(['trigger', 'trigger', 'trigger', 'end']);
    const file = trigger('File');
    expect(file.getAttribute('aria-haspopup')).toBe('menu');
    expect(file.getAttribute('aria-expanded')).toBe('false');
    expect(file.getAttribute('data-state')).toBe('closed');
    const text = file.querySelector('[data-part="text"]');
    expect(text?.getAttribute('data-text')).toBe('File');
    expect(bar.querySelector('[data-part="end"]')?.getAttribute('role')).toBe('none');
    expect(trigger('View').hasAttribute('data-disabled')).toBe(true);
    expect(menus()).toHaveLength(0);
    expect(document.body.querySelector('[title]')).toBeNull();
  });

  it('size sm stamps the row and every menu', async () => {
    const user = userEvent.setup();
    render(<Bar size="sm" />);
    expect(screen.getByRole('menubar').getAttribute('data-size')).toBe('sm');
    await user.click(trigger('File'));
    await waitFor(() => expect(menus()[0]?.getAttribute('data-size')).toBe('sm'));
  });

  it('a click opens a dropdown-menu root with the part content in a menubar layer', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Theme>
        <Bar />
      </Theme>,
    );
    await user.click(trigger('File'));
    const menu = await screen.findByRole('menu', { name: 'File' });
    expect(menu.getAttribute('data-ds')).toBe('dropdown-menu');
    expect(menu.getAttribute('data-part')).toBe('content');
    expect(menu.getAttribute('data-state')).toBe('open');
    expect(container.contains(menu)).toBe(false);
    const layer = menu.closest('[data-menu-layer]');
    expect(layer?.getAttribute('data-menu-layer')).toBe('menubar');
    expect(layer?.parentElement).toBe(document.body);
    expect(trigger('File').getAttribute('data-state')).toBe('open');
    expect(Array.from(menu.children).map((c) => c.getAttribute('data-part'))).toEqual(['item', 'sub-trigger', 'separator', 'item']);
  });

  it('ArrowRight and ArrowLeft move between titles in reading order, skipping the disabled one', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    act(() => trigger('File').focus());
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(trigger('Edit'));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(trigger('File'));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(trigger('Edit'));
  });

  it('in RTL ArrowLeft moves to the next title', async () => {
    const user = userEvent.setup();
    render(
      <Theme dir="rtl" lang="ar">
        <Bar />
      </Theme>,
    );
    act(() => trigger('File').focus());
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(trigger('Edit'));
  });

  it('ArrowDown opens with focus on the first item; Escape closes and returns focus to the title', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    act(() => trigger('File').focus());
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('menu');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: /Save board/ })));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(menus()).toHaveLength(0));
    expect(document.activeElement).toBe(trigger('File'));
  });

  it('with a menu open, ArrowRight opens the next menu', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Bar onValueChange={onValueChange} />);
    act(() => trigger('File').focus());
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('menu', { name: 'File' });
    await user.keyboard('{ArrowRight}');
    await screen.findByRole('menu', { name: 'Edit' });
    expect(trigger('Edit').getAttribute('data-state')).toBe('open');
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual(['file', 'edit']);
  });

  it('selecting an item runs onSelect and closes the menu', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Bar onSave={onSave} />);
    await user.click(trigger('File'));
    await user.click(await screen.findByRole('menuitem', { name: /Save board/ }));
    expect(onSave).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(menus()).toHaveLength(0));
  });

  it('a submenu is a dropdown-menu sub-content root in its own menubar layer', async () => {
    const user = userEvent.setup();
    render(<Bar />);
    act(() => trigger('File').focus());
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
    await waitFor(() => expect(menus()).toHaveLength(2));
    expect(menus()[1]?.getAttribute('data-part')).toBe('sub-content');
    expect(menus()[1]?.closest('[data-menu-layer]')?.getAttribute('data-menu-layer')).toBe('menubar');
  });

  it('is controllable', async () => {
    const { rerender } = render(<Bar value="edit" />);
    await screen.findByRole('menu', { name: 'Edit' });
    rerender(<Bar value="" />);
    await waitFor(() => expect(menus()).toHaveLength(0));
  });

  it('the demo renders every case, with an Arabic row and an open menu', async () => {
    render(<MenubarDemo />);
    const cases = Array.from(document.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'too-many', 'long-text', 'long-arabic', 'disabled', 'open']);
    expect(screen.getAllByRole('menubar', { name: 'قائمة التطبيق' }).length).toBeGreaterThan(0);
    await waitFor(() => expect(menus()).toHaveLength(1));
    expect(document.querySelector('[data-demo-trigger]')).toBeNull();
  });
});
