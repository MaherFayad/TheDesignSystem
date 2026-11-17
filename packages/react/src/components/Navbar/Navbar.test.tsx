import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { AnchorHTMLAttributes } from 'react';
import { renderToString } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { Theme } from '../../theme';
import { ButtonGroup } from '../ButtonGroup';
import { IconButton } from '../IconButton';
import { PageShell } from '../PageShell';
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

// Order DU1 (docs/plan/reset-duo.md). WCAG 2.2 covered here: 2.4.3 Focus
// order (the same DOM and tab order in every placement: brand, links, end
// actions, then the menu button, the column's top to bottom after the top
// row), 2.1.1 Keyboard (the links keep their row keys), 1.3.4 Orientation
// (no placement removes a part). Target size (2.5.8) and focus not obscured
// (2.4.11) are drawn by the CSS of order DU2.
describe('Navbar placement', () => {
  const placed = (placement?: 'auto' | 'bottom' | 'side') => (
    <Navbar label="Main" brand={<a href="#home">Brand</a>} items={items} end={<a href="#account">Account</a>} placement={placement} />
  );

  it('stamps no data-placement for auto, in the client and the server render', () => {
    const { container } = render(placed());
    expect(root(container).hasAttribute('data-placement')).toBe(false);
    expect(renderToString(placed('auto'))).not.toContain('data-placement');
  });

  it.each(['bottom', 'side'] as const)('stamps data-placement="%s", and inherits it from PageShell', (placement) => {
    const { container, unmount } = render(placed(placement));
    expect(root(container).getAttribute('data-placement')).toBe(placement);
    unmount();
    const shell = render(
      <PageShell embedded placement={placement} header={placed()}>
        <p>Content</p>
      </PageShell>,
    );
    expect(root(shell.container).getAttribute('data-placement')).toBe(placement);
  });

  it('its own placement wins over the PageShell', () => {
    const { container } = render(
      <PageShell embedded placement="side" header={placed('auto')}>
        <p>Content</p>
      </PageShell>,
    );
    expect(root(container).hasAttribute('data-placement')).toBe(false);
  });

  it('keeps the parts and the tab order in every placement; the links stay a horizontal row', () => {
    const order = (el: HTMLElement) =>
      Array.from(el.querySelectorAll<HTMLElement>('a[href], button')).map((n) => n.textContent?.trim() || n.getAttribute('aria-label'));
    const { container, unmount } = render(placed('auto'));
    const auto = order(root(container));
    const parts = Array.from(root(container).children).map((c) => c.getAttribute('data-part'));
    unmount();
    const side = render(placed('side'));
    expect(order(root(side.container))).toEqual(auto);
    expect(Array.from(root(side.container).children).map((c) => c.getAttribute('data-part'))).toEqual(parts);
    expect(root(side.container).getAttribute('data-orientation')).toBe('horizontal');
    expect(auto.indexOf('Account')).toBeGreaterThan(auto.indexOf('Pricing'));
  });
});


// Order C2 (docs/plan/reset-mobile.md): the pushed screen form and the bar
// group. WCAG 2.2 covered here: 1.3.1 Info and relationships and 2.4.6
// Headings and labels (the heading is the page's h1, named by its text),
// 4.1.2 Name, role, value (the back button and every button of a group has
// its own name; the group is a named group), 2.4.3 Focus order (back, start
// actions, end actions, then the heading row, as drawn). Target size (2.5.8)
// in the group: each IconButton stays its own target, never under
// size.target-min (a 44 floor on ios is drawn by the platform CSS).
describe('Navbar pushed screen form (order C2)', () => {
  it('draws the heading as the h1, last in the bar, and no heading without the prop', () => {
    const { container, rerender } = render(<Navbar label="Songs" items={[]} heading="Songs" />);
    const el = root(container);
    const h1 = screen.getByRole('heading', { level: 1, name: 'Songs' });
    expect(h1.getAttribute('data-part')).toBe('heading');
    expect(h1.parentElement).toBe(el);
    expect(el.lastElementChild).toBe(h1);
    rerender(<Navbar label="Songs" items={[]} />);
    expect(root(container).querySelector('[data-part="heading"]')).toBeNull();
    expect(root(container).querySelector('[data-part="start"]')).toBeNull();
  });

  it('back is a named IconButton in start: a link with href, a button that calls onClick without', async () => {
    const { container, rerender } = render(<Navbar label="Songs" items={[]} back={{ label: 'Library', href: '#library' }} heading="Songs" />);
    const start = root(container).querySelector('[data-part="start"]');
    const back = screen.getByRole('link', { name: 'Library' });
    expect(back.getAttribute('data-part')).toBe('back');
    expect(back.getAttribute('data-ds')).toBe('icon-button');
    expect(back.getAttribute('href')).toBe('#library');
    expect(back.parentElement).toBe(start);
    expect(start?.firstElementChild).toBe(back);
    // The glyph is decorative: the name comes from the label only.
    expect(back.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');

    let pressed = 0;
    rerender(<Navbar label="Songs" items={[]} back={{ label: 'Library', onClick: () => (pressed += 1) }} />);
    const button = screen.getByRole('button', { name: 'Library' });
    expect(button.getAttribute('data-part')).toBe('back');
    await userEvent.click(button);
    expect(pressed).toBe(1);
  });

  it('the back glyph mirrors in right to left', () => {
    const { container } = render(
      <Theme lang="ar" dir="rtl">
        <Navbar label="الأغاني" items={[]} back={{ label: 'المكتبة', href: '#library' }} heading="الأغاني" />
      </Theme>,
    );
    const glyph = container.querySelector('[data-part="back"] [data-ds="icon"]');
    expect(glyph?.hasAttribute('data-mirror')).toBe(true);
  });

  it('a bar group is a named group of buttons, each with its own name, in start and in end', () => {
    render(
      <Navbar
        label="Songs"
        items={[]}
        back={{ label: 'Library', href: '#library' }}
        start={
          <ButtonGroup attached aria-label="Playlist tools">
            <IconButton icon="shuffle" label="Shuffle playlist" />
            <IconButton icon="share" label="Share playlist" />
          </ButtonGroup>
        }
        end={
          <ButtonGroup attached aria-label="Song actions">
            <IconButton icon="sort" label="Sort songs" />
            <IconButton icon="more" label="More options" />
          </ButtonGroup>
        }
        heading="Songs"
      />,
    );
    for (const [group, names, part] of [
      ['Playlist tools', ['Shuffle playlist', 'Share playlist'], 'start'],
      ['Song actions', ['Sort songs', 'More options'], 'end'],
    ] as const) {
      const el = screen.getByRole('group', { name: group });
      expect(el.parentElement?.getAttribute('data-part')).toBe(part);
      expect(el.hasAttribute('data-attached')).toBe(true);
      const buttons = Array.from(el.querySelectorAll('[data-ds="icon-button"]'));
      expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(names);
      // Each one its own button and its own tab stop.
      buttons.forEach((b) => {
        expect(b.tagName).toBe('BUTTON');
        expect(b.getAttribute('tabindex')).not.toBe('-1');
      });
    }
  });

  it('focus goes back, start actions, end actions; the heading is not a stop and reads last', async () => {
    const { container } = render(
      <Navbar
        label="Songs"
        items={[]}
        back={{ label: 'Library', href: '#library' }}
        start={<IconButton icon="shuffle" label="Shuffle songs" />}
        end={
          <ButtonGroup attached aria-label="Song actions">
            <IconButton icon="sort" label="Sort songs" />
            <IconButton icon="more" label="More options" />
          </ButtonGroup>
        }
        heading="Songs"
      />,
    );
    const user = userEvent.setup();
    const order: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      await user.tab();
      order.push((document.activeElement as HTMLElement).getAttribute('aria-label') ?? '');
    }
    expect(order).toEqual(['Library', 'Shuffle songs', 'Sort songs', 'More options']);
    const text = root(container).textContent ?? '';
    expect(text.endsWith('Songs')).toBe(true);
  });

  it('the server render matches the parts', () => {
    const html = renderToString(<Navbar label="Songs" items={[]} back={{ label: 'Library', href: '#library' }} heading="Songs" />);
    expect(html).toContain('data-part="start"');
    expect(html).toContain('data-part="back"');
    expect(html).toContain('<h1 data-part="heading">Songs</h1>');
  });
});
