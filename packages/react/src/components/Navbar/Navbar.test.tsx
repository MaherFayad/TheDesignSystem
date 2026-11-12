import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { AnchorHTMLAttributes } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import { Theme } from '../../theme';
import NavbarDemo from './Navbar.demo';
import { Navbar, type NavbarItem } from './index';

const items: NavbarItem[] = [
  { label: 'Overview', href: '#overview' },
  {
    label: 'Product',
    links: [
      { label: 'Boards', href: '#boards', description: 'Plan work' },
      { label: 'Docs', href: '#docs', active: true },
    ],
  },
  { label: 'Pricing', href: '#pricing', active: false },
];

// Radix NavigationMenu measures the viewport with ResizeObserver, which jsdom lacks.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="navbar"]');
  if (!el) throw new Error('no navbar rendered');
  return el;
}

describe('Navbar', () => {
  it('renders a labelled nav with the anatomy and the default axes', () => {
    const { container } = render(<Navbar label="Main" brand={<a href="#home">Brand</a>} items={items} end={<span>End</span>} />);
    const el = root(container);
    expect(el.tagName).toBe('NAV');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBe(el);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-sticky')).toBe(false);
    // The viewport and the indicator mount only while a panel is open.
    // The mobile part, a Drawer root, mounts in a portal only while open.
    for (const part of ['brand', 'list', 'item', 'link', 'trigger', 'end', 'menu-button']) {
      expect(el.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(el.querySelector('[data-part="trigger"]')?.getAttribute('data-ds')).toBe('button');
    expect(el.querySelector('[data-part="menu-button"]')?.getAttribute('data-ds')).toBe('icon-button');
  });

  it('size and sticky set their attributes', () => {
    const { container } = render(<Navbar label="Main" items={items} size="lg" sticky />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-sticky')).toBe('');
  });

  it('marks the current link and the menu that holds it', () => {
    const { container } = render(
      <Navbar label="Main" items={[{ label: 'Pricing', href: '#pricing', active: true }, ...items.slice(1, 2)]} />,
    );
    const link = screen.getByRole('link', { name: 'Pricing' });
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.hasAttribute('data-active')).toBe(true);
    expect(container.querySelector('[data-part="trigger"]')?.hasAttribute('data-active')).toBe(true);
  });

  it('a trigger opens its panel with Enter and closes it with Escape', async () => {
    const { container } = render(<Navbar label="Main" items={items} />);
    const trigger = screen.getByRole('button', { name: 'Product' });
    expect(trigger.getAttribute('data-state')).toBe('closed');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(trigger.getAttribute('data-state')).toBe('open');
    expect(container.querySelector('[data-part="viewport"] [data-part="content"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: /Boards/ })).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(trigger.getAttribute('data-state')).toBe('closed');
  });

  it('the menu button opens the phone list as a Drawer root, and Escape closes it, back to the button', async () => {
    render(<Navbar label="Main" items={items} end={<span>Start a trial</span>} />);
    const button = screen.getByRole('button', { name: 'Menu' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('[data-part="mobile"]')).toBeNull();
    await userEvent.click(button);
    const mobile = document.querySelector<HTMLElement>('[data-part="mobile"]');
    // The mobile part is the Drawer root, from the inline start, and the button controls its dialog.
    expect(mobile?.getAttribute('data-ds')).toBe('drawer');
    expect(mobile?.getAttribute('data-side')).toBe('start');
    expect(mobile?.getAttribute('data-state')).toBe('open');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const dialog = screen.getByRole('dialog', { name: 'Site menu' });
    expect(button.getAttribute('aria-controls')).toBe(dialog.id);
    // The phone list is a Sidebar: one group per menu, every link once.
    const list = screen.getByRole('navigation', { name: 'Site menu' });
    expect(list.getAttribute('data-ds')).toBe('sidebar');
    expect(screen.getByRole('list', { name: 'Product' })).toBeTruthy();
    // The end actions are in the drawer's footer, so on phones they are never cut short (WCAG 1.4.10).
    expect(mobile?.querySelector('[data-part="footer"]')?.textContent).toContain('Start a trial');
    screen.getAllByRole('link', { name: 'Docs' }).at(-1)?.focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[data-part="mobile"]')).toBeNull());
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('following a link in the phone list closes it, and plain links share one group', async () => {
    render(
      <Navbar
        label="Main"
        items={[{ label: 'Overview', href: '#o' }, { label: 'Pricing', href: '#p' }, ...items.slice(1, 2)]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const mobile = document.querySelector<HTMLElement>('[data-part="mobile"]');
    // Two plain links in one unnamed group, then the Product menu.
    expect(mobile?.querySelectorAll('[data-ds="sidebar"] [data-part="group"]')).toHaveLength(2);
    const pricing = Array.from(mobile?.querySelectorAll<HTMLElement>('[data-part="item"]') ?? []).find((a) => a.textContent === 'Pricing');
    pricing?.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(pricing as HTMLElement);
    await waitFor(() => expect(document.querySelector('[data-part="mobile"]')).toBeNull());
  });

  it('the trigger chevron is the Button end part, not a part of the Navbar', () => {
    const { container } = render(<Navbar label="Main" items={items} />);
    expect(container.querySelector('[data-part="trigger-icon"]')).toBeNull();
    expect(container.querySelector('[data-part="trigger"] > [data-part="end"] svg')).not.toBeNull();
  });

  it('draws no menu button with no items', () => {
    const { container } = render(<Navbar label="Main" items={[]} brand={<a href="#h">Brand</a>} />);
    expect(container.querySelector('[data-part="menu-button"]')).toBeNull();
  });

  it('arrow keys follow the reading direction in RTL', async () => {
    render(
      <Theme dir="rtl" lang="ar">
        <Navbar label="التنقل الرئيسي" items={items} />
      </Theme>,
    );
    const first = screen.getByRole('link', { name: 'Overview' });
    first.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Product' }));
  });

  it('linkAs renders every link as the router component', () => {
    function RouterLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
      return <a {...props} data-router="" />;
    }
    const { container } = render(<Navbar label="Main" items={items} linkAs={RouterLink} />);
    const links = container.querySelectorAll('[data-part="list"] [data-part="link"]');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link.hasAttribute('data-router')).toBe(true));
  });

  it('uses Arabic menu button words under an Arabic Theme', () => {
    render(
      <Theme lang="ar">
        <Navbar label="التنقل الرئيسي" items={items} />
      </Theme>,
    );
    expect(screen.getByRole('button', { name: 'القائمة' })).toBeTruthy();
  });

  it('the demo sets no native title', () => {
    const { container } = render(<NavbarDemo />);
    expect(container.querySelector('[title]')).toBeNull();
  });
});
