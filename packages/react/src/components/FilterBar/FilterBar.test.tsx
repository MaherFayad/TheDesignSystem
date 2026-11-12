import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import FilterBarDemo from './FilterBar.demo';
import { FilterBar, type FilterBarFilter } from './index';

// jsdom has no ResizeObserver, which the edge fades and Radix Popper read.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const kinds: FilterBarFilter[] = [
  { value: 'boards', label: 'Boards' },
  { value: 'images', label: 'Images' },
];
const more: FilterBarFilter[] = [{ value: 'starred', label: 'Starred' }];

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="filter-bar"]');
  if (!el) throw new Error('no filter bar rendered');
  return el;
}

afterEach(() => vi.useRealTimers());

describe('FilterBar', () => {
  it('renders the parts with nested system roots and the default axes', () => {
    const { container } = render(
      <FilterBar search={{ 'aria-label': 'Search files' }} filters={kinds} more={more} end={<span>end</span>} resultCount={4} />,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-active')).toBe(false);
    expect(el.querySelector(':scope > [data-part="search"]')?.getAttribute('data-ds')).toBe('search-field');
    expect(screen.getByRole('group', { name: 'Filters' }).getAttribute('data-part')).toBe('filters');
    expect(el.querySelector(':scope > [data-part="more"]')?.getAttribute('data-ds')).toBe('button');
    expect(el.querySelector(':scope > [data-part="count"]')?.textContent).toBe('4 results');
    expect(el.querySelector(':scope > [data-part="clear"]')).toBeNull();
    expect(el.querySelector(':scope > [data-part="end"]')?.textContent).toBe('end');
  });

  it('chips toggle with aria-pressed and one value array; count and clear show while active', async () => {
    const onValueChange = vi.fn();
    const { container } = render(<FilterBar filters={kinds} onValueChange={onValueChange} />);
    const boards = screen.getByRole('button', { name: 'Boards' });
    expect(boards.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(boards);
    expect(boards.getAttribute('aria-pressed')).toBe('true');
    expect(onValueChange).toHaveBeenLastCalledWith(['boards']);
    const el = root(container);
    expect(el.hasAttribute('data-active')).toBe(true);
    expect(el.querySelector(':scope > [data-part="count"]')?.textContent).toBe('1 filter on');
    expect(el.querySelector(':scope > [data-part="clear"]')?.getAttribute('data-ds')).toBe('button');
  });

  it('Space on a focused chip toggles it, and Tab moves between parts', async () => {
    render(<FilterBar search={{ 'aria-label': 'Search files' }} filters={kinds} />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Search files' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Boards' }));
    await userEvent.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Boards' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('a search query counts as active; clear all empties both and moves focus to the search box', async () => {
    const onClear = vi.fn();
    const { container } = render(<FilterBar search={{ 'aria-label': 'Search files', defaultValue: 'tour' }} filters={kinds} defaultValue={['images']} onClear={onClear} />);
    expect(root(container).querySelector(':scope > [data-part="count"]')?.textContent).toBe('2 filters on');
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalled();
    const box = screen.getByRole('searchbox', { name: 'Search files' }) as HTMLInputElement;
    expect(box.value).toBe('');
    expect(screen.getByRole('button', { name: 'Images' }).getAttribute('aria-pressed')).toBe('false');
    expect(document.activeElement).toBe(box);
    expect(root(container).hasAttribute('data-active')).toBe(false);
  });

  it('more filters are menu checkbox items in the same value array', async () => {
    const onValueChange = vi.fn();
    render(<FilterBar filters={kinds} more={more} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'More filters' }));
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Starred' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['starred']);
    expect(screen.getByRole('menuitemcheckbox', { name: 'Starred' }).getAttribute('aria-checked')).toBe('true');
  });

  it('announces the result count politely once, after the last change', () => {
    vi.useFakeTimers();
    const { rerender } = render(<FilterBar filters={kinds} value={[]} resultCount={6} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    rerender(<FilterBar filters={kinds} value={['boards']} resultCount={3} />);
    rerender(<FilterBar filters={kinds} value={['boards', 'images']} resultCount={1} />);
    act(() => vi.advanceTimersByTime(700));
    expect(status.textContent?.trim()).toBe('1 result');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('does not announce again for a new array with the same content, and reads a slow count once', () => {
    vi.useFakeTimers();
    const { rerender } = render(<FilterBar filters={kinds} value={[]} resultCount={6} />);
    const status = screen.getByRole('status');
    rerender(<FilterBar filters={kinds} value={[...[]]} resultCount={6} />);
    act(() => vi.advanceTimersByTime(700));
    expect(status.textContent).toBe('');
    rerender(<FilterBar filters={kinds} value={['boards']} resultCount={6} />);
    act(() => vi.advanceTimersByTime(1500));
    expect(status.textContent).toBe('');
    rerender(<FilterBar filters={kinds} value={['boards']} resultCount={2} />);
    act(() => vi.advanceTimersByTime(700));
    expect(status.textContent?.trim()).toBe('2 results');
    rerender(<FilterBar filters={kinds} value={['boards']} resultCount={3} />);
    act(() => vi.advanceTimersByTime(700));
    expect(status.textContent?.trim()).toBe('2 results');
  });

  it('Arabic copy and size', () => {
    const { container } = render(
      <Theme lang="ar">
        <FilterBar size="sm" filters={kinds} defaultValue={['boards', 'images']} resultCount={2} />
      </Theme>,
    );
    expect(root(container).getAttribute('data-size')).toBe('sm');
    expect(root(container).querySelector(':scope > [data-part="count"]')?.textContent).toBe('فلترين مفعلين، نتيجتين');
    expect(screen.getByRole('button', { name: 'مسح الفلاتر' })).toBeTruthy();
  });

  it('renders every demo case', () => {
    const { container } = render(<FilterBarDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((n) => n.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'disabled']);
  });
});
