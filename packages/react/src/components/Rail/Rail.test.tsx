import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RailDemo from './Rail.demo';
import { Rail, RailItem } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="rail"]');
  if (!el) throw new Error('no rail rendered');
  return el;
}

describe('Rail', () => {
  it('renders a labelled nav with a list of items and the default axes', () => {
    const { container } = render(
      <Rail label="Main" start={<strong>N</strong>} end={<RailItem href="#s" icon="settings" label="Settings" />}>
        <RailItem href="#home" icon="home" label="Home" active />
        <RailItem href="#inbox" icon="inbox" label="Inbox" badge={3} />
      </Rail>,
    );
    const el = root(container);
    expect(el.tagName).toBe('NAV');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBe(el);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-hide-labels')).toBe(false);
    const parts = Array.from(el.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['start', 'list', 'end']);
    // The end is a second list, so its items are list items too.
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(el.querySelector('[data-part="end"] > li > a[data-part="item"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Inbox 3' }).hasAttribute('aria-current')).toBe(false);
  });

  it('marks the active item and reads the badge in the name', () => {
    render(
      <Rail label="Main">
        <RailItem href="#home" icon="home" label="Home" active />
        <RailItem href="#inbox" icon="inbox" label="Inbox" badge={3} />
        <RailItem href="#files" icon="folder" label="Files" badge={250} />
        <RailItem href="#boards" icon="grid" label="Boards" badge badgeLabel="New activity" />
      </Rail>,
    );
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home.getAttribute('aria-current')).toBe('page');
    expect(home.hasAttribute('data-active')).toBe(true);
    expect(screen.getByRole('link', { name: 'Inbox 3' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Files 99+' })).toBeTruthy();
    const boards = screen.getByRole('link', { name: 'Boards New activity' });
    expect(boards.querySelector('[data-part="item-badge"]')?.hasAttribute('data-dot')).toBe(true);
  });

  it('size and hideLabels set their attributes; hidden labels stay the accessible name', () => {
    const { container } = render(
      <Rail label="Main" size="sm" hideLabels>
        <RailItem href="#home" icon="home" label="Home" />
      </Rail>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-hide-labels')).toBe('');
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
  });

  it('a disabled item drops its href, stays focusable and ignores clicks', async () => {
    const onClick = vi.fn();
    render(
      <Rail label="Main">
        <RailItem href="#admin" icon="lock" label="Admin" disabled onClick={onClick} />
      </Rail>,
    );
    const item = screen.getByRole('link', { name: 'Admin' });
    expect(item.hasAttribute('href')).toBe(false);
    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect(item.hasAttribute('data-disabled')).toBe(true);
    expect(item.tabIndex).toBe(0);
    await userEvent.click(item);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild renders a router link as the item', () => {
    render(
      <Rail label="Main">
        <RailItem asChild icon="home" label="Home">
          <a href="#router" />
        </RailItem>
      </Rail>,
    );
    const item = screen.getByRole('link', { name: 'Home' });
    expect(item.getAttribute('href')).toBe('#router');
    expect(item.getAttribute('data-part')).toBe('item');
  });

  it('a badge of 0 or false draws nothing; the label has dir auto', () => {
    const { container } = render(
      <Rail label="Main">
        <RailItem href="#a" icon="home" label="Home" badge={0} />
        <RailItem href="#b" icon="inbox" label="Inbox" badge={false} />
      </Rail>,
    );
    expect(container.querySelector('[data-part="item-badge"]')).toBeNull();
    expect(container.querySelector('[data-part="item-label"]')?.getAttribute('dir')).toBe('auto');
  });

  it('a disabled asChild item never runs the router child click', async () => {
    const childClick = vi.fn();
    render(
      <Rail label="Main">
        <RailItem asChild disabled icon="home" label="Home">
          <a href="#router" onClick={childClick} />
        </RailItem>
      </Rail>,
    );
    const item = screen.getByRole('link', { name: 'Home' });
    expect(item.hasAttribute('href')).toBe(false);
    await userEvent.click(item);
    expect(childClick).not.toHaveBeenCalled();
  });

  it('the demo sets no native title', () => {
    const { container } = render(<RailDemo />);
    expect(container.querySelector('[title]')).toBeNull();
  });
});
