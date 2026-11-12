import { describe, expect, it } from 'vitest';
import { dayGroup, formatRelativeTime, notificationLanguage } from './time';

const now = new Date(2026, 10, 12, 15, 0, 0);

describe('notification times', () => {
  it('formats relative times in English', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 30_000), now, 'en')).toBe('30 seconds ago');
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60_000), now, 'en')).toBe('5 minutes ago');
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 3_600_000), now, 'en')).toBe('3 hours ago');
    expect(formatRelativeTime(new Date(now.getTime() + 10 * 60_000), now, 'en')).toBe('in 10 minutes');
    expect(formatRelativeTime(new Date(now.getTime() - 59_600), now, 'en')).toBe('1 minute ago');
    expect(formatRelativeTime(new Date(2026, 10, 10, 9), now, 'en')).toBe('2 days ago');
  });

  it('agrees with the day group from a day on', () => {
    const t = new Date(now.getTime() - 50 * 3_600_000);
    expect(dayGroup(t, now)).toBe('earlier');
    expect(formatRelativeTime(t, now, 'en')).toBe('2 days ago');
    const late = new Date(now.getTime() - 26 * 3_600_000);
    expect(dayGroup(late, now)).toBe('yesterday');
    expect(formatRelativeTime(late, now, 'en')).toBe('yesterday');
    const y = new Date(2026, 10, 11, 23, 0);
    expect(dayGroup(y, now)).toBe('yesterday');
    expect(formatRelativeTime(y, now, 'en')).toBe('yesterday');
  });

  it('formats Arabic with Western digits', () => {
    const out = formatRelativeTime(new Date(now.getTime() - 5 * 60_000), now, 'ar');
    expect(out).toMatch(/5/);
    expect(out).not.toMatch(/[٠-٩]/);
  });

  it('groups by calendar day', () => {
    expect(dayGroup(new Date(2026, 10, 12, 0, 5), now)).toBe('today');
    expect(dayGroup(new Date(2026, 10, 11, 23, 59), now)).toBe('yesterday');
    expect(dayGroup(new Date(2026, 10, 9), now)).toBe('earlier');
    expect(dayGroup(new Date(2026, 10, 13), now)).toBe('today');
  });

  it('reads the language of a tag', () => {
    expect(notificationLanguage('ar-SA')).toBe('ar');
    expect(notificationLanguage('en')).toBe('en');
    expect(notificationLanguage(undefined)).toBe('en');
  });
});
