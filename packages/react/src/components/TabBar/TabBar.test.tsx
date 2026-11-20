import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme/Theme';
import { PageShell } from '../PageShell';
import TabBarDemo from './TabBar.demo';
import { TabBar, TabBarItem } from './index';
import type { TabBarPlacement } from './TabBar';

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
    expect(screen.getByRole('link', { name: 'الوارد، الجديد 2' })).toBeTruthy();
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

// Order DU1 (docs/plan/reset-duo.md): placement, its inheritance from
// PageShell, and the keys along the bar. WCAG 2.2 covered here: 2.1.1
// Keyboard (arrow keys, Home, End, Tab in every placement), 2.4.3 Focus
// order (the DOM order and the tab order do not change with placement),
// 1.3.4 Orientation (no placement removes or locks anything: the same
// links, names and tab stops in every value), 4.1.2 Name, role, value (the
// visible label stays the link name in the column). 2.5.8 Target size and
// 2.4.11 Focus not obscured are layout, drawn by the CSS of order DU2 and
// proven by the contract runs, not in this DOM test.
function Placed({ placement, dir }: { placement?: TabBarPlacement; dir?: 'ltr' | 'rtl' }) {
  return (
    <div dir={dir}>
      <TabBar aria-label="Main" size="lg" placement={placement}>
        <TabBarItem href="#home" icon="home" label="Home" active />
        <TabBarItem href="#inbox" icon="inbox" label="Inbox" />
        <TabBarItem href="#alerts" icon="bell" label="Alerts" />
        <TabBarItem href="#profile" icon="user" label="Profile" />
      </TabBar>
    </div>
  );
}

const bar = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="tab-bar"]')!;
const link = (name: string) => screen.getByRole('link', { name });

describe('TabBar placement', () => {
  it('stamps no data-placement for auto, the default', () => {
    const { container } = render(<Placed />);
    expect(bar(container).hasAttribute('data-placement')).toBe(false);
    const { container: explicit } = render(<Placed placement="auto" />);
    expect(bar(explicit).hasAttribute('data-placement')).toBe(false);
  });

  it('the server render has no data-placement for auto', () => {
    const html = renderToString(<Placed />);
    expect(html).toContain('data-ds="tab-bar"');
    expect(html).not.toContain('data-placement');
    const inShell = renderToString(
      <PageShell embedded>
        <Placed />
      </PageShell>,
    );
    expect(inShell).not.toContain('data-placement');
  });

  it.each(['bottom', 'side'] as const)('stamps data-placement="%s"', (placement) => {
    const { container } = render(<Placed placement={placement} />);
    expect(bar(container).getAttribute('data-placement')).toBe(placement);
    expect(renderToString(<Placed placement={placement} />)).toContain(`data-placement="${placement}"`);
  });

  it.each(['bottom', 'side'] as const)('takes "%s" from the nearest PageShell', (placement) => {
    const { container } = render(
      <PageShell embedded placement={placement} footer={<Placed />}>
        <p>Content</p>
      </PageShell>,
    );
    expect(bar(container).getAttribute('data-placement')).toBe(placement);
  });

  it('its own placement wins over the PageShell, auto included', () => {
    const { container } = render(
      <PageShell embedded placement="side" footer={<Placed placement="auto" />}>
        <Placed placement="bottom" />
      </PageShell>,
    );
    const [inMain, inFooter] = Array.from(container.querySelectorAll('[data-ds="tab-bar"]'));
    expect(inMain?.getAttribute('data-placement')).toBe('bottom');
    expect(inFooter?.hasAttribute('data-placement')).toBe(false);
  });

  it('keeps the same links, names and tab stops in every placement', async () => {
    const names = ['Home', 'Inbox', 'Alerts', 'Profile'];
    for (const placement of ['auto', 'bottom', 'side'] as const) {
      const { container, unmount } = render(<Placed placement={placement} />);
      expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(names);
      expect(bar(container).querySelectorAll('[data-part="item-label"]')).toHaveLength(4);
      expect(bar(container).hasAttribute('aria-orientation')).toBe(false);
      for (const name of names) {
        await userEvent.tab();
        expect(document.activeElement).toBe(link(name));
      }
      unmount();
    }
  });
});

describe('TabBar keys', () => {
  it('side: ArrowDown and ArrowUp move along the column and wrap; Left and Right do nothing', async () => {
    const user = userEvent.setup();
    render(<Placed placement="side" />);
    link('Home').focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(link('Inbox'));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(link('Inbox'));
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(document.activeElement).toBe(link('Profile'));
  });

  it('bottom: ArrowRight and ArrowLeft move along the row; Up and Down do nothing', async () => {
    const user = userEvent.setup();
    render(<Placed placement="bottom" />);
    link('Home').focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(document.activeElement).toBe(link('Alerts'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(link('Alerts'));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(link('Inbox'));
  });

  it('bottom in right to left: ArrowLeft moves to the next item', async () => {
    const user = userEvent.setup();
    render(<Placed placement="bottom" dir="rtl" />);
    link('Home').focus();
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(link('Inbox'));
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(document.activeElement).toBe(link('Profile'));
  });

  it('side in right to left: Up and Down do not flip', async () => {
    const user = userEvent.setup();
    render(<Placed placement="side" dir="rtl" />);
    link('Home').focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(link('Inbox'));
  });

  it('Home and End go to the first and last item', async () => {
    const user = userEvent.setup();
    render(<Placed placement="side" />);
    link('Inbox').focus();
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(link('Profile'));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(link('Home'));
  });

  it('auto follows the layout at the key press: a row, or a column when the items stand one under the other', async () => {
    const user = userEvent.setup();
    const { container } = render(<Placed />);
    link('Home').focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(link('Inbox'));
    // The CSS put the bar in a column: each item sits under the one before.
    const items = Array.from(bar(container).querySelectorAll<HTMLElement>('[data-part="item"]'));
    items.forEach((item, i) => {
      item.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: i * 48, width: 48, height: 48 });
    });
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(link('Inbox'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(link('Alerts'));
  });

  it('leaves modified keys and a handled event alone', async () => {
    const user = userEvent.setup();
    render(
      <TabBar aria-label="Main" placement="bottom" onKeyDown={(e) => e.key === 'End' && e.preventDefault()}>
        <TabBarItem href="#a" icon="home" label="Home" />
        <TabBarItem href="#b" icon="inbox" label="Inbox" />
        <TabBarItem href="#c" icon="bell" label="Alerts" />
      </TabBar>,
    );
    link('Home').focus();
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(link('Home'));
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(document.activeElement).toBe(link('Home'));
  });
});

