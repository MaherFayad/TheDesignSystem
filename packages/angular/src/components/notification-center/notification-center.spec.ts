import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import NotificationCenterDemo from './notification-center.demo';
import { DsNotificationCenter, type NotificationItem } from './notification-center';
import { dayGroup, formatRelativeTime } from './time';

const now = new Date(2026, 10, 12, 15, 0, 0);
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

@Component({
  imports: [DsNotificationCenter, DsTheme],
  template: `
    <section id="nc" dsNotificationCenter [items]="items()" [now]="now" [onMarkAllRead]="markAll"></section>
    <section id="empty" dsNotificationCenter [items]="[]" [now]="now"></section>
    <section id="groups" dsNotificationCenter lang="ar" [items]="grouped" [now]="now" [headingLevel]="3"></section>
    <div dsTheme [lang]="'ar'"><section id="theme" dsNotificationCenter [items]="items()" [now]="now"></section></div>
  `,
})
class Host {
  readonly now = now;
  readonly marked = signal(0);
  readonly acted = signal(0);
  readonly items = signal<NotificationItem[]>([
    { id: 'n1', title: 'Sara mentioned you', body: 'Check the copy.', time: ago(4), unread: true, tone: 'accent', icon: 'user', actions: [{ label: 'Open comment', onAction: () => this.acted.update((n) => n + 1) }] },
    { id: 'n2', title: 'Export finished', time: ago(60 * 20), tone: 'success' },
    { id: 'n3', title: 'Could not sync', time: ago(60 * 24 * 3), tone: 'danger' },
  ]);
  readonly grouped: NotificationItem[] = [
    { id: 'g1', title: 'One', time: ago(5), group: 'Team mentions' },
    { id: 'g2', title: 'Two', time: ago(10), group: 'System' },
    { id: 'g3', title: 'Three', time: ago(15), group: 'Team mentions' },
  ];
  readonly markAll = () => {
    this.marked.update((n) => n + 1);
    this.items.update((all) => all.map((x) => ({ ...x, unread: false })));
  };
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsNotificationCenter', () => {
  afterEach(() => document.body.replaceChildren());

  it('renders the header, the count and day groups with headings', async () => {
    const { q } = await setup();
    const el = q('nc');
    expect(el.getAttribute('data-ds')).toBe('notification-center');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-empty')).toBe(false);
    const title = el.querySelector('[data-part="title"]') as HTMLElement;
    expect(title.tagName).toBe('H2');
    expect(title.textContent).toBe('Notifications');
    expect(el.getAttribute('aria-labelledby')).toBe(title.id);
    expect(el.querySelector('[data-part="count"]')?.textContent).toBe('1 unread');
    const labels = [...el.querySelectorAll('[data-part="group-label"]')].map((h) => [h.tagName, h.textContent]);
    expect(labels).toEqual([['H3', 'Today'], ['H3', 'Yesterday'], ['H3', 'Earlier']]);
    el.querySelectorAll('[data-part="group"]').forEach((g) => {
      expect(g.getAttribute('role')).toBe('group');
      expect(el.querySelector(`[id="${g.getAttribute('aria-labelledby')}"]`)?.getAttribute('data-part')).toBe('group-label');
    });
  });

  it('marks unread with a part, a hidden word and data-unread, and writes a time element', async () => {
    const { q } = await setup();
    const item = q('nc').querySelector('[data-part="item"]') as HTMLElement;
    expect(item.getAttribute('data-unread')).toBe('');
    expect(item.getAttribute('tabindex')).toBe('0');
    expect(item.getAttribute('data-tone')).toBe('accent');
    expect(item.querySelector('[data-part="item-title"]')?.textContent).toBe('Unread: Sara mentioned you');
    expect(q('nc').querySelector(`[id="${item.getAttribute('aria-labelledby')}"]`)?.getAttribute('data-part')).toBe('item-title');
    const time = item.querySelector('time');
    expect(time?.getAttribute('datetime')).toBe(ago(4).toISOString());
    expect(time?.textContent).toBe(formatRelativeTime(ago(4), now, 'en'));
  });

  it('calls item actions, and mark all read moves focus to the title and hides the count', async () => {
    const { q, host, fixture } = await setup();
    const el = q('nc');
    el.querySelector<HTMLElement>('[data-part="item-actions"] button')?.click();
    expect(host.acted()).toBe(1);
    el.querySelector<HTMLElement>('[data-part="mark-all"]')?.click();
    expect(host.marked()).toBe(1);
    expect(document.activeElement).toBe(el.querySelector('[data-part="title"]'));
    await fixture.whenStable();
    expect(el.querySelector('[data-part="count"]')).toBeNull();
    expect(el.querySelector('[data-part="mark-all"]')).toBeNull();
  });

  it('renders the empty part and data-empty with no items', async () => {
    const { q } = await setup();
    const el = q('empty');
    expect(el.getAttribute('data-empty')).toBe('');
    expect(el.querySelector('[data-part="empty"] [data-empty-title]')?.textContent).toBe('No notifications');
    expect(el.querySelector('[data-part="group"]')).toBeNull();
  });

  it('uses consumer groups in first seen order and Arabic words under lang ar', async () => {
    const { q } = await setup();
    const el = q('groups');
    expect(el.getAttribute('lang')).toBe('ar');
    expect(el.getAttribute('dir')).toBe('rtl');
    expect(el.querySelector('[data-part="title"]')?.tagName).toBe('H3');
    const labels = [...el.querySelectorAll('[data-part="group-label"]')].map((h) => [h.tagName, h.textContent]);
    expect(labels).toEqual([['H4', 'Team mentions'], ['H4', 'System']]);
    expect(el.querySelectorAll('[data-part="group"]')[0]?.querySelectorAll('[data-part="item"]').length).toBe(2);
  });

  it('takes its words from the theme language and sets no lang or dir of its own', async () => {
    const { q } = await setup();
    const el = q('theme');
    expect(el.hasAttribute('lang')).toBe(false);
    expect(el.hasAttribute('dir')).toBe(false);
    expect(el.querySelector('[data-part="title"]')?.textContent).toBe('التنبيهات');
    expect(el.querySelector('[data-part="group-label"]')?.textContent).toBe('اليوم');
  });

  it('groups by calendar day', () => {
    expect(dayGroup(ago(4), now)).toBe('today');
    expect(dayGroup(ago(60 * 20), now)).toBe('yesterday');
  });

  it('demo renders its cases in order', async () => {
    const fixture = TestBed.createComponent(NotificationCenterDemo);
    await fixture.whenStable();
    const ids = [...(fixture.nativeElement as HTMLElement).querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
