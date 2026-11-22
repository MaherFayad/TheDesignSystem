import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import SelectionMenuDemo from './SelectionMenu.demo';
import { SelectionMenu, editActions, type SelectionMenuItem, type SelectionMenuProps } from './index';

// jsdom has no ResizeObserver, which Radix Popper reads.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// jsdom ranges have no boxes.
Range.prototype.getBoundingClientRect ??= () => new DOMRect(40, 200, 60, 18);
Range.prototype.getClientRects ??= (() => [] as unknown as DOMRectList);

// jsdom has no layout, so Radix hides the menu as detached from its anchor and the names of its
// entries read empty: an entry is found by its label or its aria-label.
const byRole = (name: string): HTMLElement => {
  const found = entries().find((e) => (e.getAttribute('aria-label') ?? e.textContent) === name);
  if (!found) throw new Error(`no menuitem named ${name}`);
  return found;
};

const root = () => document.body.querySelector<HTMLElement>('[data-ds="selection-menu"]');
const entries = () => Array.from(root()?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

function actions(onSelect = vi.fn()): SelectionMenuItem[] {
  return [
    { id: 'copy', label: 'Copy', onSelect: () => onSelect('copy') },
    { id: 'look-up', label: 'Look up', icon: 'search', onSelect: () => onSelect('look-up') },
    { id: 'delete', label: 'Delete', tone: 'danger', onSelect: () => onSelect('delete') },
    { id: 'pin', label: 'Pin', disabled: true, onSelect: () => onSelect('pin') },
  ];
}

function Owned(props: Partial<SelectionMenuProps> & { dir?: 'ltr' | 'rtl'; lang?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const { dir = 'ltr', lang = 'en', ...rest } = props;
  return (
    <Theme dir={dir} lang={lang}>
      <article ref={ref} tabIndex={0} aria-label="Note">
        <p>The site visit is on Thursday.</p>
      </article>
      <input aria-label="Name" defaultValue="Sara" />
      <SelectionMenu owner={ref} open={open} onOpenChange={setOpen} items={actions()} {...rest} />
    </Theme>
  );
}

afterEach(() => {
  document.getSelection()?.removeAllRanges();
});

describe('SelectionMenu', () => {
  it('renders a horizontal menu with the anatomy and the states', async () => {
    render(
      <Theme>
        <SelectionMenu defaultOpen anchor={new DOMRect(100, 300, 50, 20)} items={actions()} />
      </Theme>,
    );
    await waitFor(() => expect(root()).not.toBeNull());
    const menu = root()!;
    expect(menu.getAttribute('role')).toBe('menu');
    expect(menu.getAttribute('aria-orientation')).toBe('horizontal');
    expect(menu.getAttribute('aria-label')).toBe('Selection actions');
    expect(menu.getAttribute('data-state')).toBe('open');
    const items = menu.querySelectorAll('[data-part="item"]');
    expect(items).toHaveLength(4);
    expect(menu.querySelectorAll('[data-part="separator"][aria-hidden="true"]')).toHaveLength(3);
    expect(items[1]!.querySelector('[data-ds="icon"]')).not.toBeNull();
    expect(items[2]!.getAttribute('data-tone')).toBe('danger');
    expect(items[3]!.hasAttribute('data-disabled')).toBe(true);
    expect(items[3]!.getAttribute('aria-disabled')).toBe('true');
    // One tab stop.
    expect(entries().filter((e) => e.tabIndex === 0)).toHaveLength(1);
  });

  it('runs an action on click and closes; a disabled action does not run', async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Theme>
        <SelectionMenu defaultOpen onOpenChange={onOpenChange} items={actions(onSelect)} />
      </Theme>,
    );
    await waitFor(() => expect(root()).not.toBeNull());
    fireEvent.click(byRole('Pin'));
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(byRole('Look up'));
    expect(onSelect).toHaveBeenCalledWith('look-up');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('cancels pointerdown, so a press keeps focus and the selection', async () => {
    render(
      <Theme>
        <SelectionMenu defaultOpen items={actions()} />
      </Theme>,
    );
    await waitFor(() => expect(root()).not.toBeNull());
    const down = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
    entries()[0]!.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it('opens on Shift+F10 on the owner, moves focus in, and Escape returns focus to the owner', async () => {
    render(<Owned />);
    const owner = screen.getByRole('article', { name: 'Note' });
    act(() => owner.focus());
    fireEvent.keyDown(owner, { key: 'F10', shiftKey: true });
    await waitFor(() => expect(root()?.getAttribute('data-state')).toBe('open'));
    await waitFor(() => expect(document.activeElement).toBe(entries()[0]));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(root()).toBeNull());
    expect(document.activeElement).toBe(owner);
  });

  it('opens on the context menu key and closes on Tab back to the owner', async () => {
    render(<Owned />);
    const owner = screen.getByRole('article', { name: 'Note' });
    act(() => owner.focus());
    fireEvent.keyDown(owner, { key: 'ContextMenu' });
    await waitFor(() => expect(document.activeElement).toBe(entries()[0]));
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    await waitFor(() => expect(root()).toBeNull());
    expect(document.activeElement).toBe(owner);
  });

  it('never opens from a native text field', () => {
    render(<Owned />);
    const field = screen.getByRole('textbox', { name: 'Name' });
    fireEvent.keyDown(field, { key: 'F10', shiftKey: true });
    expect(root()).toBeNull();
  });

  it('opens after a pointer selection inside the owner without moving focus', async () => {
    render(<Owned />);
    const text = screen.getByText('The site visit is on Thursday.');
    const range = document.createRange();
    range.setStart(text.firstChild!, 4);
    range.setEnd(text.firstChild!, 8);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
    const before = document.activeElement;
    fireEvent.pointerUp(text, { button: 0 });
    await waitFor(() => expect(root()?.getAttribute('data-state')).toBe('open'));
    expect(document.activeElement).toBe(before);
  });

  it('moves with Left and Right, Home and End, mirrored in right to left', async () => {
    const { unmount } = render(
      <Theme>
        <SelectionMenu defaultOpen focusOnOpen items={actions()} />
      </Theme>,
    );
    await waitFor(() => expect(document.activeElement).toBe(entries()[0]));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(entries()[1]);
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement).toBe(entries()[3]);
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(entries()[3]);
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(entries()[0]);
    unmount();

    render(
      <Theme dir="rtl" lang="ar">
        <SelectionMenu defaultOpen focusOnOpen items={actions()} />
      </Theme>,
    );
    await waitFor(() => expect(document.activeElement).toBe(entries()[0]));
    expect(root()!.getAttribute('aria-label')).toBe('إجراءات التحديد');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(entries()[1]);
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(entries()[0]);
  });

  it('runs the focused action on Enter', async () => {
    const onSelect = vi.fn();
    render(
      <Theme>
        <SelectionMenu defaultOpen focusOnOpen items={actions(onSelect)} />
      </Theme>,
    );
    await waitFor(() => expect(document.activeElement).toBe(entries()[0]));
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('copy');
  });

  it('names the forward control "إجراءات إضافية" in Arabic by default', async () => {
    const width = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(316);
    const box = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const part = this.getAttribute('data-part');
      return new DOMRect(0, 0, part === 'item' ? 100 : 0, part === 'item' ? 44 : 0);
    });
    try {
      const items = ['واحد', 'اثنين', 'ثلاثة', 'أربعة', 'خمسة'].map((label) => ({ id: label, label, onSelect: () => undefined }));
      render(
        <Theme dir="rtl" lang="ar">
          <SelectionMenu defaultOpen focusOnOpen items={items} />
        </Theme>,
      );
      await waitFor(() => expect(root()!.querySelectorAll('[data-part="item"]')).toHaveLength(2));
      expect(byRole('إجراءات إضافية').getAttribute('data-part')).toBe('more');
    } finally {
      width.mockRestore();
      box.mockRestore();
    }
  });

  it('pages actions that do not fit behind the forward control', async () => {
    const width = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(316);
    const box = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const part = this.getAttribute('data-part');
      const w = part === 'item' ? 100 : part === 'separator' ? 0 : 0;
      return new DOMRect(0, 0, w, part === 'item' ? 44 : 0);
    });
    try {
      const items = ['One', 'Two', 'Three', 'Four', 'Five'].map((label) => ({ id: label, label, onSelect: () => undefined }));
      render(
        <Theme>
          <SelectionMenu defaultOpen focusOnOpen items={items} overflowLabel="More actions" />
        </Theme>,
      );
      // Room 300: the first page holds two actions and the forward control (2 x 100 + 44).
      await waitFor(() => expect(root()!.querySelectorAll('[data-part="item"]')).toHaveLength(2));
      const more = byRole('More actions');
      expect(more.getAttribute('data-part')).toBe('more');
      fireEvent.click(more);
      await waitFor(() => expect(() => byRole('Three')).not.toThrow());
      const back = byRole('Previous actions');
      expect(entries()[0]).toBe(back);
      fireEvent.click(back);
      await waitFor(() => expect(() => byRole('One')).not.toThrow());
    } finally {
      width.mockRestore();
      box.mockRestore();
    }
  });

  it('declares the menu family and stays inside its own CSS file', () => {
    const css = readFileSync(join(__dirname, '../../../../css/src/components/SelectionMenu.css'), 'utf8');
    expect(css).toContain("[data-ds='selection-menu'] {");
    expect(css).toContain('--_menu-bg:');
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('forced-colors: active');
  });
});

describe('editActions', () => {
  const env = (clipboard: object) => ({ isSecureContext: true, navigator: { clipboard } as unknown as Navigator });

  it('offers copy when text can be written, cut only with onCut, paste only when text can be read and onPaste is given', () => {
    const writeOnly = env({ writeText: vi.fn(() => Promise.resolve()) });
    expect(editActions({ env: writeOnly }).map((a) => a.id)).toEqual(['copy']);
    expect(editActions({ env: writeOnly, onCut: () => undefined, onPaste: () => undefined }).map((a) => a.id)).toEqual(['cut', 'copy']);
    const both = env({ writeText: vi.fn(() => Promise.resolve()), readText: vi.fn(() => Promise.resolve('x')) });
    expect(editActions({ env: both, onCut: () => undefined, onPaste: () => undefined }).map((a) => a.id)).toEqual(['cut', 'copy', 'paste']);
    expect(editActions({ env: { isSecureContext: false, navigator: both.navigator } })).toEqual([]);
  });

  it('writes the text on copy and passes the clipboard text on paste, with Arabic labels', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    const readText = vi.fn(() => Promise.resolve('pasted'));
    const onPaste = vi.fn();
    const onCopied = vi.fn();
    const list = editActions({ lang: 'ar', env: env({ writeText, readText }), getText: () => 'hello', onPaste, onCopied });
    expect(list.map((a) => a.label)).toEqual(['نسخ', 'لصق']);
    list[0]!.onSelect();
    list[1]!.onSelect();
    await waitFor(() => expect(onPaste).toHaveBeenCalledWith('pasted'));
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(onCopied).toHaveBeenCalledWith('hello');
  });
});

describe('SelectionMenu demo', () => {
  it('renders every case with a trigger and a target', () => {
    const { container } = render(<SelectionMenuDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'long-text', 'long-arabic', 'disabled']);
    expect(container.querySelector('[data-demo-case="variants"] [data-demo-trigger]')).not.toBeNull();
    expect(container.querySelector('[data-demo-case="variants"] [data-demo-target]')).not.toBeNull();
  });
});
