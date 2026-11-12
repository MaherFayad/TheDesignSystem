import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import BreadcrumbsDemo from './Breadcrumbs.demo';
import { Breadcrumbs, collapseItems, type BreadcrumbItem } from './index';

const items: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Brand refresh', href: '/projects/brand' },
  { label: 'Boards', href: '/projects/brand/boards' },
  { label: 'Homepage hero' },
];

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="breadcrumbs"]');
  if (!el) throw new Error('no breadcrumbs rendered');
  return el;
}

describe('collapseItems', () => {
  it('keeps every step without maxItems or under it', () => {
    expect(collapseItems(5)).toEqual([0, 1, 2, 3, 4]);
    expect(collapseItems(4, 4)).toEqual([0, 1, 2, 3]);
  });

  it('keeps the first step, the overflow and the last maxItems minus 2', () => {
    expect(collapseItems(10, 4)).toEqual([0, 'overflow', 8, 9]);
    expect(collapseItems(10, 5)).toEqual([0, 'overflow', 7, 8, 9]);
  });

  it('keeps at least the current page after the overflow', () => {
    expect(collapseItems(6, 2)).toEqual([0, 'overflow', 5]);
    expect(collapseItems(6, 1)).toEqual([0, 'overflow', 5]);
  });

  it('does not collapse a single step', () => {
    expect(collapseItems(3, 2)).toEqual([0, 1, 2]);
  });
});

describe('Breadcrumbs', () => {
  it('renders a labelled nav with an ordered list, links and the current page', () => {
    const { container } = render(<Breadcrumbs items={items} />);
    const el = root(container);
    expect(el.tagName).toBe('NAV');
    expect(el.getAttribute('aria-label')).toBe('Breadcrumbs');
    expect(el.getAttribute('data-size')).toBe('md');
    const list = el.querySelector('[data-part="list"]');
    expect(list?.tagName).toBe('OL');
    expect(list?.querySelectorAll(':scope > [data-part="item"]')).toHaveLength(5);
    const links = within(el).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Home', 'Projects', 'Brand refresh', 'Boards']);
    for (const l of links) {
      expect(l.getAttribute('data-ds')).toBe('link');
      expect(l.getAttribute('data-part')).toBe('link');
    }
    const current = el.querySelector('[data-part="current"]');
    expect(current?.tagName).toBe('SPAN');
    expect(current?.getAttribute('aria-current')).toBe('page');
    expect(current?.textContent).toBe('Homepage hero');
  });

  it('puts a hidden, mirrored separator after every step but the last', () => {
    const { container } = render(<Breadcrumbs items={items} />);
    const separators = container.querySelectorAll('[data-part="separator"]');
    expect(separators).toHaveLength(4);
    for (const s of separators) {
      expect(s.getAttribute('aria-hidden')).toBe('true');
      const icon = s.querySelector('[data-ds="icon"]');
      expect(icon?.getAttribute('data-icon')).toBe('chevron-forward');
      expect(icon?.hasAttribute('data-mirror')).toBe(true);
    }
    const lastItem = container.querySelectorAll('[data-part="item"]')[4];
    expect(lastItem?.querySelector('[data-part="separator"]')).toBeNull();
  });

  it('sets the size and the labels in Arabic', () => {
    const { container } = render(
      <Theme lang="ar">
        <Breadcrumbs size="sm" items={items} maxItems={3} />
      </Theme>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('aria-label')).toBe('مسار التنقل');
    expect(screen.getByRole('button', { name: 'الصفحات المخفية' })).not.toBeNull();
  });

  it('collapses the middle steps into a menu and navigates from it', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const { container } = render(<Breadcrumbs items={items} maxItems={3} onNavigate={onNavigate} />);
    const el = root(container);
    expect(within(el).getAllByRole('link').map((l) => l.textContent)).toEqual(['Home']);
    const trigger = screen.getByRole('button', { name: 'Show hidden pages' });
    expect(trigger.getAttribute('data-ds')).toBe('icon-button');
    expect(trigger.getAttribute('data-part')).toBe('overflow');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    await user.click(trigger);
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.map((m) => m.textContent)).toEqual(['Projects', 'Brand refresh', 'Boards']);
    await user.click(menuItems[1]!);
    expect(onNavigate).toHaveBeenCalledWith(items[2], 2);
  });

  it('falls back to the href of a router link in the overflow menu', async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, assign } });
    try {
      render(
        <Breadcrumbs
          maxItems={3}
          items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', link: <a href="/router-projects">Projects</a> },
            { label: 'Boards', href: '/boards' },
            { label: 'Hero' },
          ]}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'Show hidden pages' }));
      await user.click(screen.getByRole('menuitem', { name: 'Projects' }));
      expect(assign).toHaveBeenCalledWith('/router-projects');
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });

  it('opens the overflow menu from the keyboard and closes it with Escape', async () => {
    const user = userEvent.setup();
    render(<Breadcrumbs items={items} maxItems={3} />);
    await user.tab();
    expect(document.activeElement?.textContent).toBe('Home');
    await user.tab();
    const trigger = screen.getByRole('button', { name: 'Show hidden pages' });
    expect(document.activeElement).toBe(trigger);
    await user.keyboard('{Enter}');
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('a middle step without href is a disabled link, and aria-label passes through', () => {
    render(<Breadcrumbs aria-label="Project path" items={[{ label: 'Home' }, { label: 'Billing' }]} />);
    expect(screen.getByRole('navigation', { name: 'Project path' })).not.toBeNull();
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('dir')).toBe('auto');
  });

  it('takes custom labels', () => {
    render(<Breadcrumbs items={items} maxItems={3} label="Project path" overflowLabel="Show 3 more pages" />);
    expect(screen.getByRole('navigation', { name: 'Project path' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Show 3 more pages' })).not.toBeNull();
  });

  it('renders a router link through Link asChild', () => {
    render(<Breadcrumbs items={[{ label: 'Home', link: <a href="/router-home">Home</a> }, { label: 'Billing' }]} />);
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link.getAttribute('href')).toBe('/router-home');
    expect(link.getAttribute('data-ds')).toBe('link');
    expect(link.getAttribute('data-part')).toBe('link');
  });

  it('a single step is only the current page', () => {
    const { container } = render(<Breadcrumbs items={[{ label: 'Home' }]} />);
    expect(container.querySelector('[data-part="separator"]')).toBeNull();
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('Home');
  });

  it('Tab moves through the links and skips the current page', async () => {
    const user = userEvent.setup();
    render(<Breadcrumbs items={items} />);
    const links = screen.getAllByRole('link');
    for (const link of links) {
      await user.tab();
      expect(document.activeElement).toBe(link);
    }
    await user.tab();
    expect(document.body).toBe(document.activeElement);
  });

  it('takes ref as a prop and passes props through', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<Breadcrumbs ref={ref} items={items} className="x" data-testid="b" />);
    expect(ref.current).toBe(root(container));
    expect(root(container).className).toBe('x');
  });

  it('renders every demo case', () => {
    const { container } = render(<BreadcrumbsDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"] [data-ds="breadcrumbs"]')).not.toBeNull();
    for (const size of ['sm', 'md']) {
      expect(container.querySelector(`[data-demo-case="variants"] [data-ds="breadcrumbs"][data-size="${size}"]`)).not.toBeNull();
    }
  });
});
