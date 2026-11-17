// Order C2 (docs/plan/reset-mobile.md): the accessory slot and the compact
// form of TabBar. WCAG 2.2 covered here: 2.4.3 Focus order (the accessory
// comes first, above the items, as drawn; in the compact bar it comes
// between the current item and the search item, as drawn), 4.1.2 Name,
// role, value (the accessory content keeps its own name and the items keep
// theirs), 2.1.1 Keyboard (the bar's arrow keys move among the items that
// are drawn and leave the accessory alone).
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageShell } from '../PageShell';
import { Toolbar, ToolbarButton } from '../Toolbar';
import { TabBar, TabBarItem, TabBarSearch } from './index';

function Player() {
  return (
    <Toolbar aria-label="Now playing" emphasis="ghost">
      <ToolbarButton start="music">Rain on the dunes</ToolbarButton>
      <ToolbarButton icon="pause" label="Pause" />
    </Toolbar>
  );
}

function Bar({ compact = false, accessory = true, search = true }: { compact?: boolean; accessory?: boolean; search?: boolean }) {
  return (
    <TabBar aria-label="Main" size="lg" compact={compact} accessory={accessory ? <Player /> : undefined}>
      <TabBarItem href="#home" icon="home" label="Home" />
      <TabBarItem href="#radio" icon="radio" label="Radio" />
      <TabBarItem href="#library" icon="library" label="Library" active />
      {search && <TabBarSearch href="#search" label="Search" />}
    </TabBar>
  );
}

function nav(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="tab-bar"]');
  if (!el) throw new Error('no tab bar');
  return el;
}

function parts(el: HTMLElement): string[] {
  return Array.from(el.children).map((c) => c.getAttribute('data-part') ?? '');
}

describe('TabBar accessory (order C2)', () => {
  it('draws no accessory part without the prop, and stamps no data-compact by default', () => {
    const { container } = render(<Bar accessory={false} />);
    expect(nav(container).querySelector('[data-part="accessory"]')).toBeNull();
    expect(nav(container).hasAttribute('data-compact')).toBe(false);
  });

  it('puts the accessory first, before the items, with its content named on its own', () => {
    const { container } = render(<Bar />);
    expect(parts(nav(container))).toEqual(['accessory', 'item', 'item', 'item', 'search']);
    const accessory = nav(container).querySelector('[data-part="accessory"]')!;
    expect(accessory.getAttribute('role')).toBeNull();
    expect(screen.getByRole('toolbar', { name: 'Now playing' }).parentElement).toBe(accessory);
    // The landmark keeps its name; the items keep theirs.
    expect(screen.getByRole('navigation', { name: 'Main' })).toBe(nav(container));
    expect(screen.getByRole('link', { name: 'Library' }).getAttribute('aria-current')).toBe('page');
  });

  it('Tab reaches the accessory first, then the items, in the drawn order', async () => {
    render(<Bar />);
    const user = userEvent.setup();
    await user.tab();
    expect(document.activeElement?.textContent).toBe('Rain on the dunes');
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Home' }));
  });

  it("the bar's arrow keys skip the accessory, and leave keys pressed in it alone", async () => {
    render(<Bar />);
    const user = userEvent.setup();
    screen.getByRole('link', { name: 'Search' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Home' }));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Search' }));
    // In the toolbar its own roving keys work; the bar does not take focus away.
    screen.getByRole('button', { name: 'Rain on the dunes' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('toolbar').contains(document.activeElement)).toBe(true);
  });

  it('the server render puts the accessory first', () => {
    const html = renderToString(<Bar />);
    expect(html.indexOf('data-part="accessory"')).toBeLessThan(html.indexOf('data-part="item"'));
  });

  it('keeps the accessory with the bar in every placement', () => {
    for (const placement of ['bottom', 'side'] as const) {
      const { container, unmount } = render(
        <PageShell placement={placement}>
          <Bar />
        </PageShell>,
      );
      expect(parts(nav(container))[0]).toBe('accessory');
      unmount();
    }
  });
});

describe('TabBar compact (order C2)', () => {
  it('stamps data-compact and moves the accessory to just before the search item', () => {
    const { container } = render(<Bar compact />);
    expect(nav(container).getAttribute('data-compact')).toBe('');
    expect(parts(nav(container))).toEqual(['item', 'item', 'item', 'accessory', 'search']);
  });

  it('with no search item the accessory goes last', () => {
    const { container } = render(<Bar compact search={false} />);
    expect(parts(nav(container))).toEqual(['item', 'item', 'item', 'accessory']);
  });

  it('keeps the accessory mounted when compact changes', () => {
    const { container, rerender } = render(<Bar />);
    const before = nav(container).querySelector('[data-part="accessory"]');
    rerender(<Bar compact />);
    expect(nav(container).querySelector('[data-part="accessory"]')).toBe(before);
  });

  it('the arrow keys move among the current item and the search item only', async () => {
    render(<Bar compact />);
    const user = userEvent.setup();
    screen.getByRole('link', { name: 'Library' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Search' }));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Library' }));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Library' }));
  });
});
