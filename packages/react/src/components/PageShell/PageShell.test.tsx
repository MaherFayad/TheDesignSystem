import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Sidebar, SidebarGroup, SidebarItem } from '../Sidebar';
import PageShellDemo from './PageShell.demo';
import { PageShell, usePageShell, type PageShellProps } from './index';

const rootEl = () => document.querySelector<HTMLElement>('[data-ds="page-shell"]');
const childParts = () => Array.from(rootEl()?.children ?? []).map((c) => c.getAttribute('data-part'));

function Nav() {
  const { sidebar, setSidebar } = usePageShell();
  return (
    <Sidebar
      label="Main"
      collapsed={sidebar === 'collapsed'}
      onCollapsedChange={(c) => setSidebar(c ? 'collapsed' : 'expanded')}
    >
      <SidebarGroup label="Workspace">
        <SidebarItem href="#home" start="home">
          Home
        </SidebarItem>
      </SidebarGroup>
    </Sidebar>
  );
}

function Basic(props: Partial<PageShellProps>) {
  return (
    <Theme>
      <PageShell
        header={<span>Northwind</span>}
        nav={<Nav />}
        aside={<p>Details</p>}
        asideLabel="Board details"
        footer="2026"
        {...props}
      >
        <Button>Create board</Button>
      </PageShell>
    </Theme>
  );
}

/** Makes matchMedia report a narrow (true) or wide (false) window. */
function mockNarrow(matches: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  );
  return {
    set(next: boolean) {
      query.matches = next;
      listeners.forEach((fn) => fn());
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PageShell', () => {
  it('renders the parts in order with their landmarks, one main with id main, and the skip link first', () => {
    render(<Basic />);
    expect(childParts()).toEqual(['skip', 'header', 'nav', 'main', 'aside', 'footer']);
    expect(rootEl()?.getAttribute('data-sidebar')).toBe('expanded');
    expect(screen.getByRole('banner').getAttribute('data-part')).toBe('header');
    expect(screen.getByRole('main').id).toBe('main');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('complementary', { name: 'Board details' })).toBeTruthy();
    expect(screen.getByRole('contentinfo').textContent).toBe('2026');
    expect(screen.getByRole('navigation', { name: 'Main' }).closest('[data-part="nav"]')).toBeTruthy();
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip.getAttribute('href')).toBe('#main');
    expect(skip.getAttribute('data-ds')).toBe('skip-link');
    expect(document.querySelector('[title]')).toBeNull();
  });

  it('reaches the skip link with the first Tab, and Enter moves focus to main', async () => {
    const user = userEvent.setup();
    render(<Basic mainId="content" skipLabel="Skip to the board list" />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Skip to the board list' }));
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(screen.getByRole('main').id).toBe('content');
  });

  it('follows the Sidebar toggle through usePageShell and calls onSidebarChange', async () => {
    const user = userEvent.setup();
    const onSidebarChange = vi.fn();
    render(<Basic onSidebarChange={onSidebarChange} />);
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(rootEl()?.getAttribute('data-sidebar')).toBe('collapsed');
    expect(onSidebarChange).toHaveBeenCalledWith('collapsed');
  });

  it('hidden on a wide screen: no column, and the menu button opens the navigation in a Drawer', async () => {
    const user = userEvent.setup();
    render(<Basic defaultSidebar="hidden" />);
    expect(rootEl()?.getAttribute('data-sidebar')).toBe('hidden');
    const nav = rootEl()?.querySelector<HTMLElement>('[data-part="nav"]');
    expect(nav?.hidden).toBe(true);
    expect(nav?.children).toHaveLength(0);
    const menu = screen.getByRole('button', { name: 'Open navigation' });
    expect(menu.getAttribute('data-part')).toBe('menu');
    await user.click(menu);
    const drawer = await screen.findByRole('dialog', { name: 'Navigation' });
    expect(drawer.querySelector('[data-ds="sidebar"]')).toBeTruthy();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(menu);
  });

  it('under breakpoint.tablet says hidden, and closes the Drawer when the window grows', async () => {
    const media = mockNarrow(true);
    const user = userEvent.setup();
    render(<Basic />);
    await waitFor(() => expect(rootEl()?.getAttribute('data-sidebar')).toBe('hidden'));
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    await screen.findByRole('dialog');
    expect(rootEl()?.querySelector('[data-part="nav"]')?.children).toHaveLength(0);
    expect(screen.getAllByRole('link', { name: 'Home' })).toHaveLength(1);
    await user.click(screen.getByRole('link', { name: 'Home' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    await screen.findByRole('dialog');
    act(() => media.set(false));
    expect(rootEl()?.getAttribute('data-sidebar')).toBe('expanded');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('with no nav: no menu button and no nav part, the root says hidden', () => {
    render(<Basic nav={undefined} aside={undefined} footer={undefined} header={undefined} />);
    expect(childParts()).toEqual(['skip', 'main']);
    expect(rootEl()?.getAttribute('data-sidebar')).toBe('hidden');
    expect(screen.queryByRole('button', { name: 'Open navigation' })).toBeNull();
  });

  it('embedded draws no landmarks; main is a named region', () => {
    render(<Basic embedded mainId="preview" />);
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('main')).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
    expect(screen.getByRole('region', { name: 'Main content' }).id).toBe('preview');
  });

  it('uses Arabic labels under lang ar', async () => {
    const user = userEvent.setup();
    render(
      <Theme lang="ar" dir="rtl">
        <PageShell nav={<Nav />} defaultSidebar="hidden">
          <p>المحتوى</p>
        </PageShell>
      </Theme>,
    );
    expect(screen.getByRole('link', { name: 'الانتقال للمحتوى الرئيسي' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'فتح التنقل' }));
    expect(await screen.findByRole('dialog', { name: 'التنقل' })).toBeTruthy();
  });

  it('renders no banner for a nav alone while the column shows', () => {
    render(<Basic header={undefined} />);
    expect(screen.queryByRole('banner')).toBeNull();
    expect(childParts()).toEqual(['skip', 'nav', 'main', 'aside', 'footer']);
  });

  it('renders every demo case', () => {
    render(
      <Theme>
        <PageShellDemo />
      </Theme>,
    );
    const cases = Array.from(document.querySelectorAll('[data-demo-case]')).map((c) =>
      c.getAttribute('data-demo-case'),
    );
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
    expect(new Set(Array.from(document.querySelectorAll('[data-part="main"]')).map((m) => m.id)).size).toBe(
      document.querySelectorAll('[data-part="main"]').length,
    );
  });
});
