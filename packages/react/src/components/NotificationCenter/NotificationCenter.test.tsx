import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import NotificationCenterDemo from './NotificationCenter.demo';
import { NotificationCenter, type NotificationItem } from './index';

const now = new Date(2026, 10, 12, 15, 0, 0);
const items: NotificationItem[] = [
  {
    id: '1',
    title: 'Sara mentioned you',
    time: new Date(2026, 10, 12, 14, 55),
    unread: true,
    actions: [{ label: 'Open comment', onAction: vi.fn() }],
  },
  {
    id: '2',
    title: 'Export finished',
    body: 'report.pdf is ready.',
    time: new Date(2026, 10, 11, 9, 0),
    tone: 'success',
  },
  {
    id: '3',
    title: 'Sync failed',
    time: new Date(2026, 10, 2),
    tone: 'danger',
  },
];

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="notification-center"]');
  if (!el) throw new Error('no notification center rendered');
  return el;
}

describe('NotificationCenter', () => {
  it('renders the header, the count and day groups with headings', () => {
    const { container } = render(<NotificationCenter items={items} now={now} onMarkAllRead={() => undefined} />);
    const el = root(container);
    expect(el.tagName).toBe('SECTION');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-empty')).toBe(false);
    expect(el.getAttribute('role')).toBeNull();
    const title = el.querySelector('[data-part="title"]');
    expect(title?.tagName).toBe('H2');
    expect(el.getAttribute('aria-labelledby')).toBe(title?.id);
    expect(el.querySelector('[data-part="count"]')?.textContent).toBe('1 unread');
    const labels = [...el.querySelectorAll('[data-part="group-label"]')].map((g) => [g.tagName, g.textContent]);
    expect(labels).toEqual([
      ['H3', 'Today'],
      ['H3', 'Yesterday'],
      ['H3', 'Earlier'],
    ]);
    expect(el.querySelectorAll('[data-part="group"] li > [data-part="item"]').length).toBe(3);
  });

  it('marks unread with a part, a hidden word and data-unread, never color alone', () => {
    const { container } = render(<NotificationCenter items={items} now={now} />);
    const [first, second] = [...root(container).querySelectorAll('[data-part="item"]')];
    expect(first?.tagName).toBe('ARTICLE');
    expect(first?.getAttribute('data-unread')).toBe('');
    expect(first?.querySelector('[data-part="unread"]')?.textContent).toContain('Unread');
    expect(first?.getAttribute('tabindex')).toBe('0');
    expect(second?.hasAttribute('data-unread')).toBe(false);
    expect(second?.querySelector('[data-part="unread"]')).toBeNull();
  });

  it('writes a time element with a relative time', () => {
    const { container } = render(<NotificationCenter items={items} now={now} />);
    const time = root(container).querySelector('[data-part="item-time"]');
    expect(time?.tagName).toBe('TIME');
    expect(time?.getAttribute('datetime')).toBe(new Date(2026, 10, 12, 14, 55).toISOString());
    expect(time?.textContent).toBe('5 minutes ago');
  });

  it('calls item actions and mark all read', () => {
    const onMarkAllRead = vi.fn();
    render(<NotificationCenter items={items} now={now} onMarkAllRead={onMarkAllRead} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open comment' }));
    expect(items[0]?.actions?.[0]?.onAction).toHaveBeenCalledTimes(1);
    const markAll = screen.getByRole('button', { name: 'Mark all as read' });
    expect(markAll.getAttribute('data-part')).toBe('mark-all');
    expect(markAll.getAttribute('data-ds')).toBe('button');
    fireEvent.click(markAll);
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('hides the count and mark all when nothing is unread', () => {
    const read = items.map((i) => ({ ...i, unread: false }));
    const { container } = render(<NotificationCenter items={read} now={now} onMarkAllRead={() => undefined} />);
    expect(root(container).querySelector('[data-part="count"]')).toBeNull();
    expect(root(container).querySelector('[data-part="mark-all"]')).toBeNull();
  });

  it('renders the empty part and data-empty with no items', () => {
    const { container } = render(<NotificationCenter items={[]} now={now} />);
    const el = root(container);
    expect(el.getAttribute('data-empty')).toBe('');
    expect(el.querySelector('[data-part="empty"]')?.textContent).toContain('No notifications');
    expect(el.querySelector('[data-part="group"]')).toBeNull();
  });

  it('uses consumer groups in first seen order, Arabic words and Western digits under lang ar', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <NotificationCenter
        ref={ref}
        lang="ar"
        size="sm"
        now={now}
        items={[
          {
            id: 'a',
            title: 'أ',
            time: new Date(2026, 10, 12, 14, 55),
            unread: true,
            group: 'الإشارات',
          },
          { id: 'b', title: 'ب', time: now, group: 'النظام' },
        ]}
      />,
    );
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect([...el.querySelectorAll('[data-part="group-label"]')].map((g) => g.textContent)).toEqual(['الإشارات', 'النظام']);
    expect(el.querySelector('[data-part="title"]')?.textContent).toBe('التنبيهات');
    expect(el.querySelector('[data-part="count"]')?.textContent).toBe('1 غير مقروءة');
    expect(el.querySelector('[data-part="item-time"]')?.textContent).toMatch(/5/);
  });

  it('demo renders its cases in order', () => {
    const { container } = render(<NotificationCenterDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
