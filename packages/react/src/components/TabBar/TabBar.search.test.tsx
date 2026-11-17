import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { SearchField } from '../SearchField';
import { TabBar, TabBarItem, TabBarSearch } from './index';
import type { TabBarPlacement } from './TabBar';

function Bar({ active = false, field = false, placement }: { active?: boolean; field?: boolean; placement?: TabBarPlacement }) {
  return (
    <TabBar aria-label="Main" size="lg" placement={placement}>
      <TabBarItem href="#home" icon="home" label="Home" active={!active} />
      <TabBarItem href="#new" icon="inbox" label="New" />
      <TabBarItem href="#library" icon="folder" label="Library" />
      <TabBarSearch href="#search" label="Search" active={active} field={field ? <SearchField placeholder="Songs and artists" /> : undefined} />
    </TabBar>
  );
}

describe('TabBarSearch', () => {
  it('is a link with the search part, the icon and the label', () => {
    render(<Bar />);
    const search = screen.getByRole('link', { name: 'Search' });
    expect(search.getAttribute('data-part')).toBe('search');
    expect(search.getAttribute('href')).toBe('#search');
    expect(Array.from(search.children).map((c) => c.getAttribute('data-part'))).toEqual(['item-icon', 'item-label']);
    expect(search.querySelector('[data-ds="icon"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(search.hasAttribute('aria-current')).toBe(false);
    expect(search.hasAttribute('data-expanded')).toBe(false);
  });

  it('marks the current page with aria-current and data-active', () => {
    render(<Bar active />);
    const search = screen.getByRole('link', { name: 'Search' });
    expect(search.getAttribute('aria-current')).toBe('page');
    expect(search.getAttribute('data-active')).toBe('');
  });

  it('turns into its field while active, named by the label, and stamps data-expanded', () => {
    const { container } = render(<Bar active field />);
    expect(screen.queryByRole('link', { name: 'Search' })).toBeNull();
    const box = container.querySelector('[data-ds="tab-bar"] > [data-part="search"]');
    expect(box?.getAttribute('data-expanded')).toBe('');
    expect(box?.querySelector('[data-ds="search-field"]')).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeTruthy();
  });

  it('keeps the field own aria-label when it has one', () => {
    render(
      <TabBar aria-label="Main">
        <TabBarItem href="#a" icon="home" label="Home" />
        <TabBarItem href="#b" icon="inbox" label="Inbox" />
        <TabBarSearch href="#s" label="Search" active field={<SearchField aria-label="Search the library" />} />
      </TabBar>,
    );
    expect(screen.getByRole('searchbox', { name: 'Search the library' })).toBeTruthy();
  });

  it('stays a link when not active, even with a field', () => {
    render(<Bar field />);
    expect(screen.getByRole('link', { name: 'Search' })).toBeTruthy();
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('moves focus into the field when the pressed item expands, and back when it collapses', async () => {
    function App() {
      const [on, setOn] = useState(false);
      return (
          <TabBar aria-label="Main">
            <TabBarItem href="#home" icon="home" label="Home" />
            <TabBarItem href="#new" icon="inbox" label="New" />
            <TabBarSearch label="Search" active={on} onSelect={() => setOn(true)} field={<SearchField />} />
          </TabBar>
      );
    }
    const user = userEvent.setup();
    render(<App />);
    const search = screen.getByRole('link', { name: 'Search' });
    search.focus();
    await user.keyboard('{Enter}');
    const field = screen.getByRole('searchbox', { name: 'Search' });
    expect(document.activeElement).toBe(field);
  });

  it('moves focus from the field back to the link when the field goes', () => {
    const { rerender } = render(<Bar active field />);
    const field = screen.getByRole('searchbox', { name: 'Search' });
    act(() => {
      field.focus();
    });
    rerender(<Bar field />);
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Search' }));
  });

  it('leaves focus alone when the item was neither focused nor pressed', () => {
    const { rerender } = render(<Bar field />);
    const home = screen.getByRole('link', { name: 'Home' });
    home.focus();
    rerender(<Bar field active />);
    expect(document.activeElement).toBe(home);
  });

  it('without href it is a focusable link that calls onSelect on a press and on Enter', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <TabBar aria-label="Main">
        <TabBarItem href="#a" icon="home" label="Home" />
        <TabBarItem href="#b" icon="inbox" label="Inbox" />
        <TabBarSearch label="Search" onSelect={onSelect} />
      </TabBar>,
    );
    const search = screen.getByRole('link', { name: 'Search' });
    expect(search.getAttribute('tabindex')).toBe('0');
    await user.click(search);
    search.focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('calls onSelect before a link with href is followed, and lets it cancel', async () => {
    const onSelect = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    const user = userEvent.setup();
    render(
      <TabBar aria-label="Main">
        <TabBarItem href="#a" icon="home" label="Home" />
        <TabBarItem href="#b" icon="inbox" label="Inbox" />
        <TabBarSearch href="#s" label="Search" onSelect={onSelect} />
      </TabBar>,
    );
    await user.click(screen.getByRole('link', { name: 'Search' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toHaveProperty('defaultPrevented', true);
  });

  it('is part of the arrow key path of the bar, in a row and in a column, and is left out while a field', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Bar placement="bottom" />);
    const library = screen.getByRole('link', { name: 'Library' });
    library.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Search' }));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Home' }));
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Search' }));

    rerender(<Bar placement="side" />);
    screen.getByRole('link', { name: 'Search' }).focus();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Library' }));

    rerender(<Bar placement="bottom" active field />);
    screen.getByRole('link', { name: 'Library' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Home' }));
  });

  it('does not take the arrow keys of its field', async () => {
    const user = userEvent.setup();
    render(<Bar active field placement="bottom" />);
    const field = screen.getByRole('searchbox');
    field.focus();
    await user.keyboard('ab{ArrowLeft}{Home}');
    expect(document.activeElement).toBe(field);
  });

  it('flips the arrows in right to left and keeps its place last in the DOM', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Theme dir="rtl" lang="ar">
        <TabBar aria-label="التنقل الرئيسي" placement="bottom">
          <TabBarItem href="#home" icon="home" label="الرئيسية" />
          <TabBarItem href="#new" icon="inbox" label="الجديد" />
          <TabBarSearch href="#search" label="بحث" />
        </TabBar>
      </Theme>,
    );
    const parts = Array.from(container.querySelectorAll('[data-ds="tab-bar"] > *')).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['item', 'item', 'search']);
    screen.getByRole('link', { name: 'الجديد' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'بحث' }));
  });

  it('renders the same on the server, with no focus work', () => {
    const html = renderToString(<Bar active field />);
    expect(html).toContain('data-part="search"');
    expect(html).toContain('data-expanded=""');
    expect(renderToString(<Bar />)).toContain('aria-label="Main"');
  });

  it('renders a router link with asChild', () => {
    render(
      <TabBar aria-label="Main">
        <TabBarItem href="#a" icon="home" label="Home" />
        <TabBarItem href="#b" icon="inbox" label="Inbox" />
        <TabBarSearch label="Search" asChild active>
          <a href="/search">ignored</a>
        </TabBarSearch>
      </TabBar>,
    );
    const link = screen.getByRole('link', { name: 'Search' });
    expect(link.getAttribute('href')).toBe('/search');
    expect(link.getAttribute('data-part')).toBe('search');
    expect(link.getAttribute('aria-current')).toBe('page');
  });
});
