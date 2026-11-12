import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import CommandPaletteDemo from './CommandPalette.demo';
import { CommandPalette, CommandPaletteTrigger, matchShortcut, type CommandPaletteItem, type CommandPaletteProps } from './index';

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="command-palette"]');
const part = (name: string) =>
  rootEl()?.querySelector<HTMLElement>(`[data-part="panel"] > [data-part="${name}"], [data-part="${name}"]`) ?? null;
const own = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="panel"] > [data-part="${name}"]`) ?? null;
const items = () => Array.from(rootEl()?.querySelectorAll<HTMLElement>('[data-part="item"]') ?? []);
const lit = () => rootEl()?.querySelector<HTMLElement>('[data-part="item"][data-highlighted]') ?? null;

const commands: CommandPaletteItem[] = [
  {
    label: 'Boards',
    commands: [
      { value: 'create', label: 'Create board', start: 'plus', shortcut: 'Mod+Shift+N' },
      { value: 'delete', label: 'Delete board', disabled: true },
      { value: 'export', label: 'Export as PDF', keywords: ['download'] },
    ],
  },
  { label: 'Account', commands: [{ value: 'settings', label: 'Open settings', description: 'Name, email and password' }] },
];

function Basic(props: Partial<CommandPaletteProps>) {
  return (
    <Theme>
      <Button>Page action</Button>
      <CommandPalette items={commands} {...props}>
        <CommandPaletteTrigger>
          <Button>Search commands</Button>
        </CommandPaletteTrigger>
      </CommandPalette>
    </Theme>
  );
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Search commands' }));
  return screen.findByRole('dialog');
}

describe('CommandPalette', () => {
  it('renders the parts in a themed portal, named, with focus in the search combobox', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    expect(rootEl()).toBeNull();
    const panel = await open(user);
    const root = rootEl();
    expect(root?.parentElement?.getAttribute('data-ds')).toBe('theme');
    expect(root?.getAttribute('data-size')).toBe('md');
    expect(root?.getAttribute('data-state')).toBe('open');
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'search', 'close', 'list', 'status', 'footer']);
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBe(panel);
    const input = screen.getByRole('combobox');
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-controls')).toBe(part('list')?.id);
    expect(screen.getByRole('listbox')).toBe(part('list'));
    expect(screen.getByRole('group', { name: 'Boards' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Account' })).toBeTruthy();
    expect(input.getAttribute('aria-label')).toBe('Search commands');
    expect(items()).toHaveLength(4);
    expect(document.body.querySelector('[title]')).toBeNull();
  });

  it('highlights the first enabled command, moves with the arrows past disabled ones and wraps', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    const input = screen.getByRole('combobox');
    expect(lit()?.textContent).toContain('Create board');
    expect(input.getAttribute('aria-activedescendant')).toBe(lit()?.id);
    expect(lit()?.getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{ArrowDown}');
    expect(lit()?.textContent).toContain('Export as PDF');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(lit()?.textContent).toContain('Create board');
    await user.keyboard('{ArrowUp}');
    expect(lit()?.textContent).toContain('Open settings');
    expect(input.getAttribute('aria-activedescendant')).toBe(lit()?.id);
  });

  it('filters by label and keywords, marks the match and shows the empty part', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    await user.keyboard('downl');
    expect(items().map((i) => i.querySelector('[data-part="item-label"]')?.textContent)).toEqual(['Export as PDF']);
    await user.clear(screen.getByRole('combobox'));
    await user.keyboard('sett');
    expect(part('item-label')?.querySelector('mark')?.textContent).toBe('sett');
    await user.keyboard('zzz');
    expect(part('list')).toBeNull();
    expect(part('empty')?.textContent).toBe('No commands match. Try another word.');
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false');
  });

  it('runs the highlighted command on Enter after closing, and focus returns to the trigger', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    const own = vi.fn();
    const withRun: CommandPaletteItem[] = [{ value: 'a', label: 'Archive board', onRun: own }, { value: 'b', label: 'Share board' }];
    render(<Basic items={withRun} onRun={onRun} />);
    await open(user);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(rootEl()).toBeNull());
    await waitFor(() => expect(onRun).toHaveBeenCalledWith('a', expect.objectContaining({ label: 'Archive board' })));
    expect(own).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Search commands' }));
  });

  it('runs a clicked command and never a disabled one', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Basic onRun={onRun} />);
    await open(user);
    await user.click(screen.getByRole('option', { name: 'Delete board' }));
    expect(rootEl()).not.toBeNull();
    expect(onRun).not.toHaveBeenCalled();
    await user.click(screen.getByRole('option', { name: 'Open settings' }));
    await waitFor(() => expect(onRun).toHaveBeenCalledWith('settings', expect.anything()));
  });

  it('keeps the palette open after a run with closeOnRun false', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Basic onRun={onRun} closeOnRun={false} />);
    await open(user);
    await user.keyboard('{Enter}');
    expect(onRun).toHaveBeenCalledWith('create', expect.anything());
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
  });

  it('clears the query on the first Escape and closes on the second', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    await user.keyboard('board');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('combobox')).toHaveProperty('value', '');
    expect(rootEl()).not.toBeNull();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('opens and closes with Mod+K from anywhere, matches by physical key, and the trigger says the shortcut', async () => {
    render(<Basic />);
    expect(screen.getByRole('button', { name: 'Search commands' }).getAttribute('aria-keyshortcuts')).toBe('Control+K');
    act(() => {
      fireEvent.keyDown(document.body, { key: 'k', code: 'KeyK', ctrlKey: true });
    });
    expect(await screen.findByRole('dialog')).toBeTruthy();
    act(() => {
      fireEvent.keyDown(document.activeElement ?? document.body, { key: 'ن', code: 'KeyK', ctrlKey: true });
    });
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('never opens on a shortcut with no Ctrl, Meta or Alt while the person types in a field', async () => {
    render(
      <>
        <input aria-label="Search the page" />
        <textarea aria-label="Note" />
        <select aria-label="Sort">
          <option>Name</option>
        </select>
        <div contentEditable suppressContentEditableWarning aria-label="Draft">
          <span>Text</span>
        </div>
        <Basic shortcut="/" />
      </>,
    );
    for (const target of [
      screen.getByRole('textbox', { name: 'Search the page' }),
      screen.getByRole('textbox', { name: 'Note' }),
      screen.getByRole('combobox', { name: 'Sort' }),
      screen.getByText('Text'),
    ]) {
      const event = new KeyboardEvent('keydown', { key: '/', code: 'Slash', bubbles: true, cancelable: true });
      act(() => {
        target.dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(false);
      expect(rootEl()).toBeNull();
    }
    // Outside a field the same key opens it.
    act(() => {
      fireEvent.keyDown(screen.getByRole('button', { name: 'Page action' }), { key: '/', code: 'Slash' });
    });
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('still opens on Mod+K from inside a field', async () => {
    render(
      <>
        <input aria-label="Search the page" />
        <Basic />
      </>,
    );
    act(() => {
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Search the page' }), { key: 'k', code: 'KeyK', ctrlKey: true });
    });
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('turns the shortcut off with null', () => {
    render(<Basic shortcut={null} />);
    fireEvent.keyDown(document.body, { key: 'k', code: 'KeyK', ctrlKey: true });
    expect(rootEl()).toBeNull();
  });

  it('shows the recent group first while the query is empty, then hides it', async () => {
    const user = userEvent.setup();
    render(<Basic recent={['settings', 'missing']} />);
    await open(user);
    const labels = Array.from(rootEl()?.querySelectorAll('[data-part="group-label"]') ?? []).map((g) => g.textContent);
    expect(labels).toEqual(['Recent', 'Boards', 'Account']);
    expect(lit()?.textContent).toContain('Open settings');
    expect(new Set(items().map((i) => i.id)).size).toBe(items().length);
    await user.keyboard('o');
    expect(Array.from(rootEl()?.querySelectorAll('[data-part="group-label"]') ?? []).map((g) => g.textContent)).not.toContain('Recent');
  });

  it('marks a row shortcut with aria-keyshortcuts and decorative keycaps, the size and the loading state', async () => {
    const user = userEvent.setup();
    render(<Basic size="lg" loading />);
    await open(user);
    const row = screen.getByRole('option', { name: 'Create board' });
    expect(row.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+N');
    expect(row.querySelector('[data-part="shortcut"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(rootEl()?.getAttribute('data-size')).toBe('lg');
    expect(rootEl()?.hasAttribute('data-loading')).toBe(true);
    expect(rootEl()?.getAttribute('data-loading')).toBe('');
    expect(screen.getByRole('combobox').getAttribute('aria-busy')).toBe('true');
  });

  it('announces the result count once typing pauses, in Arabic too', async () => {
    render(
      <Theme lang="ar" dir="rtl">
        <CommandPalette items={commands} defaultOpen shortcut={null} />
      </Theme>,
    );
    await screen.findByRole('dialog', { name: 'لوحة الأوامر' });
    expect(own('status')?.textContent).toBe('');
    await waitFor(() => expect(own('status')?.textContent).toBe('4 نتائج'));
    expect(part('footer')?.textContent).toContain('تشغيل');
  });

  it('names groups whose labels hold spaces, and finds Arabic words without hamza', async () => {
    const user = userEvent.setup();
    const ar: CommandPaletteItem[] = [
      { label: 'إعدادات الحساب', commands: [{ value: 'create', label: 'إنشاء لوحة' }, { value: 'out', label: 'تسجيل الخروج' }] },
    ];
    render(<Basic items={ar} />);
    await open(user);
    expect(screen.getByRole('group', { name: 'إعدادات الحساب' })).toBeTruthy();
    await user.keyboard('انشاء');
    expect(items().map((i) => i.querySelector('[data-part="item-label"]')?.textContent)).toEqual(['إنشاء لوحة']);
  });

  it('returns focus to what had it when the shortcut opened the palette, even with a trigger on the page', async () => {
    render(<Basic />);
    const page = screen.getByRole('button', { name: 'Page action' });
    page.focus();
    act(() => {
      fireEvent.keyDown(page, { key: 'k', code: 'KeyK', ctrlKey: true });
    });
    await screen.findByRole('dialog');
    act(() => {
      fireEvent.keyDown(document.activeElement ?? document.body, { key: 'k', code: 'KeyK', ctrlKey: true });
    });
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(page);
  });

  it('announces the count once per query, not on every keystroke', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    const status = () => own('status')?.textContent;
    await waitFor(() => expect(status()).toBe('4 results'));
    await user.keyboard('b');
    expect(status()).toBe('');
    await user.keyboard('o');
    expect(status()).toBe('');
    await waitFor(() => expect(status()).toBe('2 results'));
  });

  it('renders every demo case', () => {
    render(
      <Theme>
        <CommandPaletteDemo />
      </Theme>,
    );
    const cases = Array.from(document.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled']);
  });
});

describe('matchShortcut', () => {
  const ev = (key: string, mods: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }> = {}, code?: string) => ({
    key,
    code,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...mods,
  });

  it('resolves Mod per platform and compares every modifier', () => {
    expect(matchShortcut(ev('k', { metaKey: true }), 'Mod+K', 'mac')).toBe(true);
    expect(matchShortcut(ev('k', { ctrlKey: true }), 'Mod+K', 'mac')).toBe(false);
    expect(matchShortcut(ev('k', { ctrlKey: true }), 'Mod+K', 'other')).toBe(true);
    expect(matchShortcut(ev('K', { ctrlKey: true, shiftKey: true }), 'Mod+K', 'other')).toBe(false);
    expect(matchShortcut(ev('P', { ctrlKey: true, shiftKey: true }), 'Ctrl+Shift+P', 'other')).toBe(true);
    expect(matchShortcut(ev('k', { metaKey: true }), '⌘K', 'mac')).toBe(true);
  });

  it('matches letters and digits by physical key, symbols by what they type, named keys by name', () => {
    expect(matchShortcut(ev('ن', { ctrlKey: true }, 'KeyK'), 'Mod+K', 'other')).toBe(true);
    expect(matchShortcut(ev('١', { ctrlKey: true }, 'Digit1'), 'Ctrl+1', 'other')).toBe(true);
    expect(matchShortcut(ev('?', { shiftKey: true }), '?', 'other')).toBe(true);
    expect(matchShortcut(ev('Escape'), 'Esc', 'other')).toBe(true);
    expect(matchShortcut(ev('k'), 'Mod', 'other')).toBe(false);
  });

  it('uses the physical key only when the key typed is not a Latin letter or digit', () => {
    // AZERTY: the key labelled A sits where Q is on QWERTY. Ctrl+A is select all, not Mod+Q.
    expect(matchShortcut(ev('a', { ctrlKey: true }, 'KeyQ'), 'Mod+Q', 'other')).toBe(false);
    expect(matchShortcut(ev('a', { ctrlKey: true }, 'KeyQ'), 'Mod+A', 'other')).toBe(true);
    // Colemak: the key that types e sits where K is on QWERTY.
    expect(matchShortcut(ev('e', { ctrlKey: true }, 'KeyK'), 'Mod+K', 'other')).toBe(false);
    // AZERTY digits type symbols without Shift, so the physical key still counts.
    expect(matchShortcut(ev('&', { ctrlKey: true }, 'Digit1'), 'Ctrl+1', 'other')).toBe(true);
    // Option+K on a Mac types a symbol: the physical key counts.
    expect(matchShortcut(ev('˚', { altKey: true }, 'KeyK'), 'Alt+K', 'mac')).toBe(true);
  });

  it('counts recent commands once in the result count', async () => {
    render(
      <Theme>
        <CommandPalette items={commands} recent={['settings', 'create']} defaultOpen shortcut={null} />
      </Theme>,
    );
    await screen.findByRole('dialog');
    await waitFor(() => expect(own('status')?.textContent).toBe('4 results'));
  });
});

// ------------------------------------------------------------------ motion, order 1.22

/** Records every Web Animation started, with its element, keyframes and options. */
function spyAnimate() {
  const calls: { el: Element; frames: Keyframe[]; options: KeyframeAnimationOptions }[] = [];
  const original = Element.prototype.animate;
  Element.prototype.animate = function (this: Element, frames: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) {
    calls.push({ el: this, frames: frames as Keyframe[], options: (options ?? {}) as KeyframeAnimationOptions });
    return { cancel() {}, finished: Promise.resolve(), id: '', playState: 'finished' } as unknown as Animation;
  };
  return { calls, restore: () => (Element.prototype.animate = original) };
}

describe('motion (order 1.22)', () => {
  it('command-palette-results: rows arrive in order on open, the lit row is there at once, and typing still filters at once', async () => {
    const spy = spyAnimate();
    try {
      const user = userEvent.setup();
      render(<Basic />);
      await open(user);
      const staggered = () => spy.calls.filter((c) => c.options.id === 'ds-motion:stagger').map((c) => c.el);
      await waitFor(() => expect(staggered().length).toBeGreaterThan(0));
      expect(staggered()).not.toContain(lit());
      expect(staggered().every((el) => el.getAttribute('data-part') === 'item')).toBe(true);
      spy.calls.length = 0;
      await user.keyboard('export');
      expect(items().map((el) => el.textContent)).toEqual([expect.stringContaining('Export as PDF')]);
    } finally {
      spy.restore();
    }
  });

  it('command-palette-row-slide: the arrow keys move the highlight at once, and the fill slides on the row ::after', async () => {
    const spy = spyAnimate();
    try {
      const user = userEvent.setup();
      render(<Basic />);
      await open(user);
      const before = lit();
      await user.keyboard('{ArrowDown}');
      expect(lit()).not.toBe(before);
      // jsdom has no layout: every row measures 0 by 0, so the slide has nothing to travel and does not play.
      expect(spy.calls.filter((c) => c.options.id === 'ds-motion:menu-row-slide')).toHaveLength(0);
    } finally {
      spy.restore();
    }
  });

  describe('CommandPalette.css', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/CommandPalette.css'), 'utf8');
    it('review N5: the panel is at full opacity within the first third, and the exit is faster', () => {
      expect(css).toMatch(/@keyframes ds-command-palette-in \{[^@]*33% \{\s*opacity: 1;/);
      expect(css).toContain('--_command-palette-duration-out: var(--ds-duration-quick);');
    });
    it('review B2: the reduced form applies under data-motion="reduce" too', () => {
      expect(css).toContain(":root[data-motion='reduce'] [data-ds='command-palette'] > :is([data-part='panel'], [data-part='backdrop'])[data-state],");
    });
  });
});
