import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import ContextMenuDemo from './ContextMenu.demo';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  type ContextMenuProps,
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

const roots = () => Array.from(document.body.querySelectorAll<HTMLElement>('[data-ds="context-menu"]'));
const rootEl = () => roots()[0] ?? null;

function Basic({
  onSelect,
  disabled,
  ...props
}: ContextMenuProps & { onSelect?: (event: Event) => void; disabled?: boolean }) {
  return (
    <ContextMenu {...props}>
      <ContextMenuTrigger disabled={disabled}>
        <div tabIndex={0} role="group" aria-label="Q3 roadmap">
          Q3 roadmap
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Board</ContextMenuLabel>
        <ContextMenuItem start="edit" shortcut="F2" onSelect={onSelect}>
          Rename board
        </ContextMenuItem>
        <ContextMenuItem start="copy">Duplicate board</ContextMenuItem>
        <ContextMenuItem disabled>Download board</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger start="link">Share board</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Copy link</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem tone="danger" start="trash">
          Delete board
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const target = () => screen.getByRole('group', { name: 'Q3 roadmap' });

describe('ContextMenu', () => {
  it('renders nothing until a right click, then a context-menu root in a Theme layer in body', async () => {
    const { container } = render(
      <Theme>
        <Basic />
      </Theme>,
    );
    expect(rootEl()).toBeNull();
    expect(target().getAttribute('data-state')).toBe('closed');
    fireEvent.contextMenu(target(), { clientX: 40, clientY: 40 });
    const menu = await screen.findByRole('menu');
    expect(menu).toBe(rootEl());
    expect(container.contains(menu)).toBe(false);
    expect(menu.getAttribute('data-size')).toBe('md');
    expect(menu.getAttribute('data-state')).toBe('open');
    expect(menu.hasAttribute('data-part')).toBe(false);
    expect(target().getAttribute('data-state')).toBe('open');
    const layer = menu.closest('[data-menu-layer]');
    expect(layer?.getAttribute('data-ds')).toBe('theme');
    expect(layer?.parentElement).toBe(document.body);
    expect(document.body.querySelector('[title]')).toBeNull();
  });

  it('stamps the DropdownMenu parts: label, item, start, text, shortcut, separator, sub-trigger, danger tone', async () => {
    render(<Basic size="sm" />);
    fireEvent.contextMenu(target());
    const menu = await screen.findByRole('menu');
    expect(menu.getAttribute('data-size')).toBe('sm');
    expect(Array.from(menu.children).map((c) => c.getAttribute('data-part'))).toEqual([
      'label',
      'item',
      'item',
      'item',
      'sub-trigger',
      'separator',
      'item',
      'highlight',
    ]);
    const rename = screen.getByRole('menuitem', { name: /Rename board/ });
    expect(Array.from(rename.children).map((c) => c.getAttribute('data-part'))).toEqual(['start', 'text', 'shortcut']);
    expect(rename.querySelector('[data-part="shortcut"]')?.getAttribute('dir')).toBe('ltr');
    expect(screen.getByRole('menuitem', { name: /Delete board/ }).getAttribute('data-tone')).toBe('danger');
    expect(rename.hasAttribute('data-tone')).toBe(false);
    expect(screen.getByRole('menuitem', { name: /Download board/ }).getAttribute('aria-disabled')).toBe('true');
  });

  it('Shift+F10 on the focused item opens the menu with focus on the first item', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    act(() => target().focus());
    await user.keyboard('{Shift>}{F10}{/Shift}');
    await screen.findByRole('menu');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: /Rename board/ })));
  });

  it('the Menu key opens it too, and Escape closes it and returns focus to the item', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    act(() => target().focus());
    await user.keyboard('{ContextMenu}');
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(target());
  });

  it('the key path sends a contextmenu event at the inline start and block end of the focused element', () => {
    render(<Basic />);
    const el = target();
    el.getBoundingClientRect = () => DOMRect.fromRect({ x: 10, y: 20, width: 100, height: 30 });
    const seen: MouseEvent[] = [];
    el.addEventListener('contextmenu', (e) => seen.push(e));
    fireEvent.keyDown(el, { key: 'F10', shiftKey: true });
    expect(seen).toHaveLength(1);
    expect(seen[0]?.clientX).toBe(10);
    expect(seen[0]?.clientY).toBe(50);
  });

  it('other F10 chords do nothing', () => {
    render(<Basic />);
    fireEvent.keyDown(target(), { key: 'F10' });
    fireEvent.keyDown(target(), { key: 'F10', shiftKey: true, ctrlKey: true });
    expect(rootEl()).toBeNull();
  });

  it('a disabled trigger opens nothing, by pointer or key', () => {
    render(<Basic disabled />);
    fireEvent.contextMenu(target());
    fireEvent.keyDown(target(), { key: 'F10', shiftKey: true });
    expect(rootEl()).toBeNull();
    expect(target().hasAttribute('data-disabled')).toBe(true);
  });

  it('selecting an item runs onSelect and closes the menu; onOpenChange reports both', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<Basic onSelect={onSelect} onOpenChange={onOpenChange} />);
    act(() => target().focus());
    await user.keyboard('{Shift>}{F10}{/Shift}');
    await screen.findByRole('menu');
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(onOpenChange.mock.calls.map((c) => c[0])).toEqual([true, false]);
  });

  it('opens toward the inline end: right of the pointer in LTR, left in RTL', async () => {
    const { unmount } = render(
      <Theme dir="ltr">
        <Basic />
      </Theme>,
    );
    fireEvent.contextMenu(target());
    await waitFor(() => expect(rootEl()?.getAttribute('data-side')).toBe('right'));
    unmount();
    render(
      <Theme dir="rtl" lang="ar">
        <Basic />
      </Theme>,
    );
    fireEvent.contextMenu(target());
    await waitFor(() => expect(rootEl()?.getAttribute('data-side')).toBe('left'));
    expect(rootEl()?.closest('[data-menu-layer]')?.getAttribute('dir')).toBe('rtl');
  });

  it('a submenu is a context-menu root with the part sub-content, in its own layer', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    act(() => target().focus());
    await user.keyboard('{Shift>}{F10}{/Shift}');
    await screen.findByRole('menu');
    act(() => screen.getByRole('menuitem', { name: /Share board/ }).focus());
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(roots()).toHaveLength(2));
    const sub = roots()[1];
    expect(sub?.getAttribute('data-part')).toBe('sub-content');
    expect(sub?.getAttribute('data-size')).toBe('md');
    expect(sub?.closest('[data-menu-layer]')).not.toBe(roots()[0]?.closest('[data-menu-layer]'));
  });

  it('checkbox items toggle with the check icon', async () => {
    const user = userEvent.setup();
    function Check() {
      const [on, setOn] = useState(false);
      return (
        <ContextMenu>
          <ContextMenuTrigger>
            <div tabIndex={0} role="group" aria-label="Q3 roadmap" />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={on} onCheckedChange={setOn} onSelect={(e) => e.preventDefault()}>
              Add to starred
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
    render(<Check />);
    fireEvent.contextMenu(target());
    const item = await screen.findByRole('menuitemcheckbox');
    expect(item.getAttribute('data-part')).toBe('checkbox-item');
    expect(item.getAttribute('aria-checked')).toBe('false');
    await user.click(item);
    expect(item.getAttribute('aria-checked')).toBe('true');
    expect(item.querySelector('[data-part="indicator"] svg')).not.toBeNull();
  });

  it('the demo renders every case; each tile has a DropdownMenu with the same actions, in the same order', async () => {
    const user = userEvent.setup();
    render(<ContextMenuDemo />);
    const cases = Array.from(document.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    expect(document.querySelectorAll('[data-demo-case="variants"] [data-demo-trigger]')).toHaveLength(3);
    const labels = (root: Element) =>
      Array.from(root.querySelectorAll('[data-part="text"], [data-part="label"]')).map((el) => el.textContent);
    for (const id of ['variants', 'many']) {
      const tile = document.querySelector<HTMLElement>(`[data-demo-case="${id}"] [role="group"][tabindex="0"]`)!;
      fireEvent.contextMenu(tile);
      await waitFor(() => expect(rootEl()).not.toBeNull());
      const fromContext = labels(rootEl()!);
      await user.keyboard('{Escape}');
      await waitFor(() => expect(rootEl()).toBeNull());
      await user.click(tile.querySelector<HTMLElement>('[aria-haspopup="menu"]')!);
      const dropdown = await waitFor(() => {
        const el = document.querySelector('[data-ds="dropdown-menu"]');
        expect(el).not.toBeNull();
        return el!;
      });
      expect(labels(dropdown)).toEqual(fromContext);
      await user.keyboard('{Escape}');
      await waitFor(() => expect(document.querySelector('[data-ds="dropdown-menu"]')).toBeNull());
    }
  });

  it('keys and right clicks inside an open DropdownMenu on the item do not open the context menu', async () => {
    const user = userEvent.setup();
    render(<ContextMenuDemo />);
    const tile = document.querySelector<HTMLElement>('[data-demo-case="one"] [role="group"][tabindex="0"]')!;
    await user.click(tile.querySelector<HTMLElement>('[aria-haspopup="menu"]')!);
    const item = await screen.findByRole('menuitem', { name: /Download image/ });
    fireEvent.contextMenu(item);
    fireEvent.keyDown(item, { key: 'F10', shiftKey: true });
    expect(rootEl()).toBeNull();
  });

  it('a demo Show menu button opens the menu of its tile', async () => {
    const user = userEvent.setup();
    render(<ContextMenuDemo />);
    await user.click(document.querySelector<HTMLElement>('[data-demo-trigger="md"]')!);
    await waitFor(() => expect(rootEl()).not.toBeNull());
  });
});
