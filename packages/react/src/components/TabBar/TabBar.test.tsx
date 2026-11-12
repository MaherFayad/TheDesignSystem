import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme/Theme';
import TabBarDemo from './TabBar.demo';
import { TabBar, TabBarItem } from './index';

function Example({ size }: { size?: 'md' | 'lg' }) {
  return (
    <TabBar aria-label="Main" size={size}>
      <TabBarItem href="#home" icon="home" label="Home" active />
      <TabBarItem href="#inbox" icon="inbox" label="Inbox" badge={3} />
      <TabBarItem href="#alerts" icon="bell" label="Alerts" badge />
      <TabBarItem href="#more" icon="user" label="Profile" badge={250} />
    </TabBar>
  );
}

describe('TabBar', () => {
  it('renders a named nav with link items and the default size', () => {
    const { container } = render(<Example />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav.getAttribute('data-ds')).toBe('tab-bar');
    expect(nav.getAttribute('data-size')).toBe('md');
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    for (const l of links) expect(l.getAttribute('data-part')).toBe('item');
    const parts = Array.from(links[0]?.children ?? []).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['item-icon', 'item-label']);
    expect(container.querySelector('[data-part="item-icon"] [data-ds="icon"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('marks the current item with aria-current and data-active', () => {
    render(<Example />);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home.getAttribute('aria-current')).toBe('page');
    expect(home.getAttribute('data-active')).toBe('');
    const inbox = screen.getByRole('link', { name: /Inbox/ });
    expect(inbox.hasAttribute('aria-current')).toBe(false);
    expect(inbox.hasAttribute('data-active')).toBe(false);
  });

  it('adds the badge to the link name; a dot says New; past 99 shows 99+', () => {
    const { container } = render(<Example size="lg" />);
    expect(screen.getByRole('link', { name: 'Inbox, 3 new' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Alerts, New' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Profile, 99+ new' })).toBeTruthy();
    const dot = container.querySelectorAll('[data-part="item-badge"]')[1];
    expect(dot?.getAttribute('data-dot')).toBe('');
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-ds="tab-bar"]')?.getAttribute('data-size')).toBe('lg');
  });

  it('shows nothing for a badge of 0 or false', () => {
    const { container } = render(
      <TabBar aria-label="Main">
        <TabBarItem href="#a" icon="inbox" label="Inbox" badge={0} />
        <TabBarItem href="#b" icon="bell" label="Alerts" badge={false} />
      </TabBar>,
    );
    expect(container.querySelector('[data-part="item-badge"]')).toBeNull();
    expect(container.querySelector('[data-part="item-status"]')).toBeNull();
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeTruthy();
  });

  it('sizes the icon with the bar', () => {
    const { container } = render(<Example size="lg" />);
    expect(container.querySelector('[data-part="item-icon"] [data-ds="icon"]')?.getAttribute('data-size')).toBe('lg');
  });

  it('speaks the badge in Arabic', () => {
    render(
      <Theme lang="ar" dir="rtl">
        <TabBar aria-label="التنقل">
          <TabBarItem href="#in" icon="inbox" label="الوارد" badge={2} />
        </TabBar>
      </Theme>,
    );
    expect(screen.getByRole('link', { name: 'الوارد، 2 جديد' })).toBeTruthy();
  });

  it('renders a router link with asChild', () => {
    render(
      <TabBar aria-label="Main">
        <TabBarItem icon="home" label="Home" active asChild>
          <a href="/home" data-router="">
            ignored
          </a>
        </TabBarItem>
      </TabBar>,
    );
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link.getAttribute('data-router')).toBe('');
    expect(link.getAttribute('data-part')).toBe('item');
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('every item is a tab stop', async () => {
    render(<Example />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Home' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Inbox, 3 new' }));
  });

  it('renders the demo with every case', () => {
    const { container } = render(<TabBarDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
