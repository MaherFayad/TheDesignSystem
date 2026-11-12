import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import SidebarDemo from './Sidebar.demo';
import { Sidebar, SidebarFooter, SidebarGroup, SidebarHeader, SidebarItem } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="sidebar"]');
  if (!el) throw new Error('no sidebar rendered');
  return el;
}

function Basic(props: Partial<Parameters<typeof Sidebar>[0]>) {
  return (
    <Sidebar label="Main" {...props}>
      <SidebarHeader>
        <strong>Brand</strong>
      </SidebarHeader>
      <SidebarGroup label="Workspace">
        <SidebarItem href="#home" start="home" active>
          Home
        </SidebarItem>
        <SidebarItem href="#inbox" start="inbox" count={12} countLabel="12 unread">
          Inbox
        </SidebarItem>
      </SidebarGroup>
      <SidebarFooter>
        <SidebarItem href="#help" start="help">
          Help
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  );
}

describe('Sidebar', () => {
  it('renders a labelled nav with the anatomy and the default axes', () => {
    const { container } = render(<Basic />);
    const el = root(container);
    expect(el.tagName).toBe('NAV');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBe(el);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-state')).toBe('expanded');
    expect(el.hasAttribute('data-part')).toBe(false);
    const parts = new Set(Array.from(el.querySelectorAll('[data-part]')).map((p) => p.getAttribute('data-part')));
    for (const part of ['header', 'toggle', 'group', 'group-label', 'list', 'item', 'item-icon', 'item-label', 'item-count', 'footer']) {
      expect(parts.has(part)).toBe(true);
    }
    expect(screen.getByRole('list', { name: 'Workspace' })).toBeTruthy();
  });

  it('marks the active item with aria-current and data-active', () => {
    render(<Basic />);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home.getAttribute('aria-current')).toBe('page');
    expect(home.hasAttribute('data-active')).toBe(true);
    const inbox = screen.getByRole('link', { name: /Inbox/ });
    expect(inbox.hasAttribute('aria-current')).toBe(false);
    expect(inbox.hasAttribute('data-active')).toBe(false);
  });

  it('reads the count label instead of the bare number and caps the count at 99+', () => {
    render(
      <Sidebar label="Mail" collapsible={false}>
        <SidebarGroup>
          <SidebarItem href="#a" count={12} countLabel="12 unread">
            Inbox
          </SidebarItem>
          <SidebarItem href="#b" count={1500}>
            Archive
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(screen.getByRole('link', { name: 'Inbox 12 unread' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Archive 99+' })).toBeTruthy();
  });

  it('size sets data-size', () => {
    const { container } = render(<Basic size="sm" />);
    expect(root(container).getAttribute('data-size')).toBe('sm');
  });

  it('the toggle collapses and expands, and names the next action', async () => {
    const onCollapsedChange = vi.fn();
    const { container } = render(<Basic onCollapsedChange={onCollapsedChange} />);
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle.getAttribute('data-ds')).toBe('icon-button');
    expect(toggle.getAttribute('data-part')).toBe('toggle');
    expect(toggle.hasAttribute('aria-expanded')).toBe(false);
    await userEvent.click(toggle);
    expect(root(container).getAttribute('data-state')).toBe('collapsed');
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    const expand = screen.getByRole('button', { name: 'Expand sidebar' });
    // The labels stay in the DOM as the accessible names.
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
    await userEvent.click(expand);
    expect(root(container).getAttribute('data-state')).toBe('expanded');
  });

  it('is controlled through collapsed', () => {
    const { container } = render(<Basic collapsed />);
    expect(root(container).getAttribute('data-state')).toBe('collapsed');
  });

  it('renders a header with the toggle when none is given, and no toggle when not collapsible', () => {
    const { container, rerender } = render(
      <Sidebar label="Main">
        <SidebarGroup>
          <SidebarItem href="#a">A</SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(container.querySelector('[data-part="header"] [data-part="toggle"]')).not.toBeNull();
    rerender(
      <Sidebar label="Main" collapsible={false}>
        <SidebarGroup>
          <SidebarItem href="#a">A</SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(container.querySelector('[data-part="toggle"]')).toBeNull();
    expect(container.querySelector('[data-part="header"]')).toBeNull();
  });

  it('uses Arabic toggle words under an Arabic Theme', () => {
    render(
      <Theme lang="ar">
        <Basic />
      </Theme>,
    );
    expect(screen.getByRole('button', { name: 'طي القائمة الجانبية' })).toBeTruthy();
  });

  it('a collapsible group opens and closes from its trigger', async () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Sidebar label="Main">
        <SidebarGroup label="Projects" collapsible onOpenChange={onOpenChange}>
          <SidebarItem href="#p">Brand refresh</SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    const group = container.querySelector('[data-part="group"]');
    const trigger = screen.getByRole('button', { name: 'Projects' });
    expect(trigger.getAttribute('data-ds')).toBe('button');
    expect(trigger.getAttribute('data-part')).toBe('group-trigger');
    expect(group?.getAttribute('data-state')).toBe('open');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    trigger.focus();
    await userEvent.keyboard(' ');
    expect(group?.getAttribute('data-state')).toBe('closed');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('link', { name: 'Brand refresh' })).toBeNull();
    await userEvent.keyboard('{Enter}');
    expect(group?.getAttribute('data-state')).toBe('open');
  });

  it('a plain group stamps no data-state; a collapsed sidebar holds a closed group open', () => {
    const { container } = render(
      <Sidebar label="Main" defaultCollapsed>
        <SidebarGroup label="Workspace">
          <SidebarItem href="#h">Home</SidebarItem>
        </SidebarGroup>
        <SidebarGroup label="Projects" collapsible defaultOpen={false}>
          <SidebarItem href="#p">Brand refresh</SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    const [plain, folding] = Array.from(container.querySelectorAll('[data-part="group"]'));
    expect(plain?.hasAttribute('data-state')).toBe(false);
    expect(folding?.getAttribute('data-state')).toBe('open');
    expect(screen.getByRole('link', { name: 'Brand refresh' })).toBeTruthy();
  });

  it('keeps focus inside a group when the sidebar collapses', () => {
    const view = (collapsed: boolean) => (
      <Sidebar label="Main" collapsed={collapsed}>
        <SidebarGroup label="Projects" collapsible>
          <SidebarItem href="#p" start="file">
            Brand refresh
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>
    );
    const { rerender } = render(view(false));
    const item = screen.getByRole('link', { name: 'Brand refresh' });
    item.focus();
    rerender(view(true));
    expect(document.activeElement).toBe(item);
  });

  it('a SidebarHeader nested in another component still replaces the default header', () => {
    function AppHeader() {
      return (
        <SidebarHeader>
          <strong>Brand</strong>
        </SidebarHeader>
      );
    }
    const { container } = render(
      <Sidebar label="Main">
        <AppHeader />
        <SidebarGroup>
          <SidebarItem href="#a">A</SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(container.querySelectorAll('[data-part="header"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-part="toggle"]')).toHaveLength(1);
  });

  it('a count of 0 draws nothing', () => {
    const { container } = render(
      <Sidebar label="Main">
        <SidebarGroup>
          <SidebarItem href="#a" count={0}>
            Inbox
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(container.querySelector('[data-part="item-count"]')).toBeNull();
  });

  it('a disabled item drops its href, stays focusable and ignores clicks', async () => {
    const onClick = vi.fn();
    render(
      <Sidebar label="Main">
        <SidebarGroup>
          <SidebarItem href="#x" disabled onClick={onClick}>
            Invoices
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    const item = screen.getByRole('link', { name: 'Invoices' });
    expect(item.hasAttribute('href')).toBe(false);
    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect(item.hasAttribute('data-disabled')).toBe(true);
    expect(item.tabIndex).toBe(0);
    await userEvent.click(item);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild renders a router link as the item', () => {
    render(
      <Sidebar label="Main">
        <SidebarGroup>
          <SidebarItem asChild start="home" active>
            <a href="#router">Home</a>
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    const item = screen.getByRole('link', { name: 'Home' });
    expect(item.getAttribute('href')).toBe('#router');
    expect(item.getAttribute('data-part')).toBe('item');
    expect(item.querySelector('[data-part="item-icon"]')).not.toBeNull();
  });

  it('never sets a native title', () => {
    const { container } = render(<SidebarDemo />);
    expect(container.querySelector('[title]')).toBeNull();
    expect(container.querySelectorAll('[data-ds="sidebar"]').length).toBeGreaterThan(5);
  });
});
