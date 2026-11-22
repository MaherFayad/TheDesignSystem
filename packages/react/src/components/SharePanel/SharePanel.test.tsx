// Order M9.12: SharePanel and the trigger's share() flow.
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastStore } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import SharePanelDemo from './SharePanel.demo';
import { SharePanel, type SharePanelProps } from './index';
import { scrollRowToStart } from './SharePanel';

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

const item = { title: 'Weekend in AlUla', url: 'https://example.com/trips/alula' };
const people = [
  { id: 'sara', name: 'Sara Alqahtani' },
  { id: 'omar', name: 'Omar Haddad' },
  { id: 'lina', name: 'Lina Saleh' },
];
const targets = [
  { id: 'board', label: 'Trip board', icon: 'grid' as const },
  { id: 'mail', label: 'Email', icon: 'mail' as const },
];

function domError(name: string): Error {
  const e = new Error(name);
  e.name = name;
  return e;
}

function Subject(props: Partial<SharePanelProps> & { platform?: 'web' | 'ios' | 'android'; lang?: 'en' | 'ar' }) {
  const { platform = 'web', lang = 'en', ...rest } = props;
  return (
    <Theme platform={platform} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <SharePanel item={item} people={people} targets={targets} {...rest}>
        <Button>Share trip</Button>
      </SharePanel>
    </Theme>
  );
}

const panel = () => document.querySelector<HTMLElement>('[data-ds="share-panel"]');
const trigger = () => screen.getByRole('button', { name: 'Share trip' });

let realNavigator: PropertyDescriptor | undefined;
let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  realNavigator = Object.getOwnPropertyDescriptor(navigator, 'share');
  // jsdom has no clipboard: Copy link is feature tested, so give it one.
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => {
  // jsdom has no navigator.share or canShare; remove what a test stubbed.
  const nav = navigator as unknown as Record<string, unknown>;
  if (!realNavigator) {
    delete nav.share;
    delete nav.canShare;
  }
  delete nav.clipboard;
  act(() => toastStore.dismiss());
  vi.restoreAllMocks();
});

function stubShare(impl: () => Promise<void>) {
  const fn = vi.fn(impl);
  Object.defineProperty(navigator, 'share', { value: fn, configurable: true, writable: true });
  return fn;
}

describe('SharePanel trigger', () => {
  it('with navigator.share present under prefer: calls it and never opens the panel', async () => {
    const shareFn = stubShare(() => Promise.resolve());
    const onResult = vi.fn();
    render(<Subject onResult={onResult} />);
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(trigger());
    await waitFor(() => expect(onResult).toHaveBeenCalledWith('system'));
    expect(shareFn).toHaveBeenCalledWith({ title: item.title, url: item.url });
    expect(panel()).toBeNull();
  });

  it('with navigator.share absent: opens the panel, a dialog named by the item title', async () => {
    const onResult = vi.fn();
    render(<Subject onResult={onResult} />);
    await userEvent.click(trigger());
    await waitFor(() => expect(panel()).not.toBeNull());
    expect(onResult).toHaveBeenCalledWith('fallback');
    expect(screen.getByRole('dialog', { name: item.title })).toBeTruthy();
    expect(panel()!.getAttribute('data-state')).toBe('open');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    // web: a Popover from the trigger.
    expect(panel()!.closest('[data-ds="popover"]')).not.toBeNull();
  });

  it('a cancelled system share (AbortError) opens nothing', async () => {
    stubShare(() => Promise.reject(domError('AbortError')));
    const onResult = vi.fn();
    render(<Subject onResult={onResult} />);
    await userEvent.click(trigger());
    await waitFor(() => expect(onResult).toHaveBeenCalledWith('cancelled'));
    expect(panel()).toBeNull();
  });

  it('a rejected system share (NotAllowedError) falls back to the panel', async () => {
    stubShare(() => Promise.reject(domError('NotAllowedError')));
    const onResult = vi.fn();
    render(<Subject onResult={onResult} />);
    await userEvent.click(trigger());
    await waitFor(() => expect(panel()).not.toBeNull());
    expect(onResult).toHaveBeenCalledWith('fallback');
  });

  it('system never skips the system sheet and opens the panel', async () => {
    const shareFn = stubShare(() => Promise.resolve());
    render(<Subject system="never" />);
    await userEvent.click(trigger());
    await waitFor(() => expect(panel()).not.toBeNull());
    expect(shareFn).not.toHaveBeenCalled();
  });

  it('is a Sheet on ios and android', async () => {
    for (const platform of ['ios', 'android'] as const) {
      const { unmount } = render(<Subject platform={platform} />);
      await userEvent.click(trigger());
      await waitFor(() => expect(panel()).not.toBeNull());
      expect(panel()!.closest('[data-ds="sheet"]')).not.toBeNull();
      expect(screen.getByRole('dialog', { name: item.title })).toBeTruthy();
      unmount();
    }
  });

  it('Escape closes and focus returns to the trigger', async () => {
    render(<Subject />);
    await userEvent.click(trigger());
    await waitFor(() => expect(panel()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel()).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });
});

describe('SharePanel rows', () => {
  it('names each row, opens focus on the first person, and has one Tab stop per row', async () => {
    render(<Subject open />);
    const groups = screen.getAllByRole('group');
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['People', 'Share to', 'Actions']);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Sara Alqahtani' })));
    const tabStops = (g: HTMLElement) => Array.from(g.querySelectorAll('[data-part]')).filter((b) => b.getAttribute('tabindex') === '0');
    for (const g of groups) expect(tabStops(g)).toHaveLength(1);
  });

  it('Left, Right, Home and End move along a row', async () => {
    render(<Subject open />);
    await waitFor(() => expect(document.activeElement?.textContent).toContain('Sara'));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement?.textContent).toContain('Omar');
    await userEvent.keyboard('{End}');
    expect(document.activeElement?.textContent).toContain('Lina');
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement?.textContent).toContain('Lina');
    await userEvent.keyboard('{Home}');
    expect(document.activeElement?.textContent).toContain('Sara');
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement?.textContent).toContain('Sara');
  });

  it('mirrors Left and Right in right to left, with Arabic group names', async () => {
    render(<Subject open lang="ar" />);
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-label'))).toEqual(['الأشخاص', 'المشاركة عبر', 'الإجراءات']);
    await waitFor(() => expect(document.activeElement?.textContent).toContain('Sara'));
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement?.textContent).toContain('Omar');
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement?.textContent).toContain('Sara');
  });

  it('a person or a target calls onShare with its kind and closes the panel', async () => {
    const onShare = vi.fn();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Subject defaultOpen onShare={onShare} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Omar Haddad' }));
    expect(onShare).toHaveBeenCalledWith('omar', 'person');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    rerender(<Subject open onShare={onShare} />);
    await userEvent.click(screen.getByRole('button', { name: 'Email' }));
    expect(onShare).toHaveBeenLastCalledWith('mail', 'target');
  });

  it('marks avatars and icons decorative: the label is the name', async () => {
    render(<Subject open />);
    const person = screen.getByRole('button', { name: 'Sara Alqahtani' });
    expect(person.getAttribute('data-part')).toBe('person');
    expect(person.querySelector('[data-ds="avatar"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the preview link without the scheme, left to right', () => {
    render(<Subject open />);
    const link = panel()!.querySelector('[data-part="preview"] > [data-part="link"]');
    expect(link?.textContent).toBe('example.com/trips/alula');
    expect(link?.querySelector('bdi')?.getAttribute('dir')).toBe('ltr');
  });

  it('skips empty rows, and drops Copy link where the clipboard is missing', () => {
    const { unmount } = render(<Subject open people={[]} targets={[]} />);
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-label'))).toEqual(['Actions']);
    unmount();
    delete (navigator as unknown as Record<string, unknown>).clipboard;
    render(<Subject open people={[]} targets={[]} />);
    expect(screen.queryAllByRole('group')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Copy link' })).toBeNull();
  });
});

describe('SharePanel actions', () => {
  it('Copy link writes the url and shows the toast Link copied', async () => {
    const onOpenChange = vi.fn();
    render(<Subject defaultOpen onOpenChange={onOpenChange} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith(item.url);
    await waitFor(() => expect(toastStore.getSnapshot().visible.some((t) => t.title === 'Link copied')).toBe(true));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('Copy link in Arabic shows the toast "الرابط منسوخ"', async () => {
    render(<Subject defaultOpen lang="ar" />);
    await userEvent.click(await screen.findByRole('button', { name: 'نسخ الرابط' }));
    await waitFor(() => expect(toastStore.getSnapshot().visible.some((t) => t.title === 'الرابط منسوخ')).toBe(true));
  });

  it('More options shows only where the system sheet exists, and calls it', async () => {
    const { unmount } = render(<Subject open />);
    expect(screen.queryByRole('button', { name: 'More options' })).toBeNull();
    unmount();
    const shareFn = stubShare(() => Promise.resolve());
    render(<Subject open system="never" />);
    await userEvent.click(await screen.findByRole('button', { name: 'More options' }));
    expect(shareFn).toHaveBeenCalledOnce();
  });

  it('runs an action and closes; a disabled action is aria-disabled and does nothing', async () => {
    const run = vi.fn();
    const stay = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Subject
        defaultOpen
        onOpenChange={onOpenChange}
        actions={[
          { id: 'list', label: 'Add to list', icon: 'list', onSelect: run },
          { id: 'img', label: 'Save image', icon: 'download', onSelect: stay, disabled: true },
        ]}
      />,
    );
    const off = screen.getByRole('button', { name: 'Save image' });
    expect(off.getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(off);
    expect(stay).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Add to list' }));
    expect(run).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

describe('SharePanel demo', () => {
  it('renders every case with a trigger', () => {
    const { container } = render(<SharePanelDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    expect(container.querySelectorAll('[data-demo-trigger]')).toHaveLength(9);
  });
});

describe('a row opens at its start (order C6, item 4)', () => {
  // jsdom lays nothing out: a row 300 wide whose first item starts 50 past its start edge until it scrolls.
  const scrolled = new WeakMap<Element, number>();
  let restore: (() => void) | undefined;
  function fakeLayout(rtl: boolean) {
    const rect = Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')!;
    const left = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft')!;
    Object.defineProperty(Element.prototype, 'scrollLeft', {
      configurable: true,
      get(this: Element) {
        return scrolled.get(this) ?? 0;
      },
      set(this: Element, value: number) {
        scrolled.set(this, value);
      },
    });
    Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
      configurable: true,
      value(this: Element) {
        const part = this.getAttribute('data-part');
        if (part === 'people' || part === 'targets' || part === 'actions') return DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 100 });
        const row = this.parentElement;
        if (row && row.firstElementChild === this && part !== null) {
          // Content moves against the scroll: scrolling right by s moves every item left by s.
          const s = scrolled.get(row) ?? 0;
          return DOMRect.fromRect({ x: (rtl ? 260 : -50) - s, y: 0, width: 90, height: 100 });
        }
        return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
      },
    });
    restore = () => {
      Object.defineProperty(Element.prototype, 'getBoundingClientRect', rect);
      Object.defineProperty(Element.prototype, 'scrollLeft', left);
    };
  }
  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  it('moves a cut off row back to its start in either direction, and leaves a row at its start alone', () => {
    fakeLayout(true);
    const row = document.createElement('div');
    row.setAttribute('data-part', 'people');
    const first = document.createElement('span');
    first.setAttribute('data-part', 'person');
    row.append(first);
    document.body.append(row);
    scrollRowToStart(row, true);
    expect(row.scrollLeft).toBe(50);
    scrollRowToStart(row, true);
    expect(row.scrollLeft).toBe(50);
    restore?.();

    fakeLayout(false);
    scrolled.set(row, 0);
    scrollRowToStart(row, false);
    expect(row.scrollLeft).toBe(-50);
    scrollRowToStart(row, false);
    expect(row.scrollLeft).toBe(-50);
    row.remove();
  });

  it('opens the Arabic people row with the first person in view', async () => {
    fakeLayout(true);
    render(<Subject platform="ios" lang="ar" defaultOpen />);
    const row = await waitFor(() => {
      const el = panel()?.querySelector<HTMLElement>('[data-part="people"]');
      expect(el).toBeTruthy();
      return el!;
    });
    await waitFor(() => expect(row.scrollLeft).toBe(50));
    const first = row.querySelector<HTMLElement>('[data-part="person"]')!;
    const box = row.getBoundingClientRect();
    expect(first.getBoundingClientRect().right).toBeLessThanOrEqual(box.right);
  });
});
