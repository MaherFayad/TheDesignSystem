import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import PaginationDemo from './Pagination.demo';
import { Pagination } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="pagination"]');
  if (!el) throw new Error('no pagination rendered');
  return el;
}

const parts = (el: HTMLElement) => Array.from(el.children).map((c) => c.getAttribute('data-part'));
const pages = (el: HTMLElement) =>
  Array.from(el.querySelectorAll(':scope > [data-part="page"], :scope > [data-part="ellipsis"]')).map((c) =>
    c.getAttribute('data-part') === 'ellipsis' ? '...' : c.textContent,
  );

describe('Pagination', () => {
  it('renders a labelled nav with the parts in order and the default axes', () => {
    const { container } = render(<Pagination defaultPage={5} pageCount={16} />);
    const el = root(container);
    expect(el.tagName).toBe('NAV');
    expect(el.getAttribute('aria-label')).toBe('Pagination');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('default');
    expect(parts(el)).toEqual(['first', 'previous', 'page', 'ellipsis', 'page', 'page', 'page', 'ellipsis', 'ellipsis', 'page', 'next', 'last']);
    expect(pages(el)).toEqual(['1', '...', '4', '5', '6', '...', '...', '16']);
    // The second ellipsis before the last page is the compact one, drawn only on phones.
    const compact = el.querySelectorAll('[data-part="ellipsis"][data-compact]');
    expect(compact).toHaveLength(1);
    expect(compact[0]?.nextElementSibling?.textContent).toBe('16');
  });

  it('marks the current page with aria-current, data-active and a page label', () => {
    render(<Pagination defaultPage={5} pageCount={16} />);
    const current = screen.getByRole('button', { name: 'Page 5' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.hasAttribute('data-active')).toBe(true);
    expect(current.getAttribute('data-emphasis')).toBe('soft');
    const other = screen.getByRole('button', { name: 'Page 4' });
    expect(other.hasAttribute('aria-current')).toBe(false);
    expect(other.hasAttribute('data-active')).toBe(false);
    expect(other.getAttribute('data-emphasis')).toBe('ghost');
  });

  it('uses mirrored icons on the ends and hides the ellipsis', () => {
    const { container } = render(<Pagination defaultPage={5} pageCount={16} />);
    const icon = (part: string) => container.querySelector(`[data-part="${part}"] [data-ds="icon"]`);
    expect(icon('first')?.getAttribute('data-icon')).toBe('chevrons-back');
    expect(icon('previous')?.getAttribute('data-icon')).toBe('chevron-back');
    expect(icon('next')?.getAttribute('data-icon')).toBe('chevron-forward');
    expect(icon('last')?.getAttribute('data-icon')).toBe('chevrons-forward');
    for (const part of ['first', 'previous', 'next', 'last']) expect(icon(part)?.hasAttribute('data-mirror')).toBe(true);
    expect(container.querySelector('[data-part="ellipsis"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('disables the ends that go nowhere, and keeps them focusable', () => {
    render(<Pagination defaultPage={1} pageCount={4} />);
    for (const name of ['First page', 'Previous page']) {
      const el = screen.getByRole('button', { name });
      expect(el.getAttribute('aria-disabled')).toBe('true');
      expect(el.hasAttribute('data-disabled')).toBe(true);
      expect(el.hasAttribute('disabled')).toBe(false);
    }
    expect(screen.getByRole('button', { name: 'Next page' }).hasAttribute('aria-disabled')).toBe(false);
  });

  it('moves between pages and keeps focus on the pressed control', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination defaultPage={1} pageCount={20} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBe('page');
    const page4 = screen.getByRole('button', { name: 'Page 4' });
    page4.focus();
    await user.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Page 4' }));
    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(20);
    await user.click(screen.getByRole('button', { name: 'First page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('is controlled with page and onPageChange', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [page, setPage] = useState(3);
      return <Pagination page={page} onPageChange={setPage} pageCount={5} />;
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBe('page');
  });

  it('does not call onPageChange for the current page', () => {
    const onPageChange = vi.fn();
    render(<Pagination defaultPage={2} pageCount={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('shows the summary from itemCount and pageSize, with Western digits in Arabic', () => {
    const { container, rerender } = render(<Pagination defaultPage={2} itemCount={312} pageSize={20} />);
    expect(container.querySelector('[data-part="summary"]')?.textContent).toBe('21 to 40 of 312');
    expect(screen.getByRole('button', { name: 'Page 16' })).not.toBeNull();
    rerender(
      <Theme lang="ar">
        <Pagination defaultPage={2} itemCount={12480} pageSize={20} />
      </Theme>,
    );
    expect(container.querySelector('[data-part="summary"]')?.textContent).toBe('21 إلى 40 من 12,480');
    expect(screen.getByRole('navigation', { name: 'التنقل بين الصفحات' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'الصفحة التالية' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'صفحة 624' })).not.toBeNull();
  });

  it('treats a page count of 0 or NaN as one page with inert ends', () => {
    const onPageChange = vi.fn();
    for (const count of [0, Number.NaN]) {
      const { unmount } = render(<Pagination pageCount={count} onPageChange={onPageChange} />);
      expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
      for (const name of ['First page', 'Previous page', 'Next page', 'Last page']) {
        const el = screen.getByRole('button', { name });
        expect(el.getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(el);
      }
      unmount();
    }
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('in link mode leaves a modifier click and a middle click to the browser', () => {
    const onPageChange = vi.fn();
    render(<Pagination defaultPage={1} pageCount={3} getHref={(p) => `?page=${p}`} onPageChange={onPageChange} />);
    const link = screen.getByRole('link', { name: 'Page 2' });
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { metaKey: true });
    fireEvent.click(link, { button: 1 });
    expect(onPageChange).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
  });

  it('says No items for an empty list', () => {
    const { container } = render(<Pagination itemCount={0} />);
    expect(container.querySelector('[data-part="summary"]')?.textContent).toBe('No items');
    expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
  });

  it('takes a custom summary and label', () => {
    const { container } = render(
      <Pagination itemCount={45} pageSize={20} label="Results pages" formatSummary={(s, e, t) => `Showing ${s} to ${e} of ${t} results`} />,
    );
    expect(container.querySelector('[data-part="summary"]')?.textContent).toBe('Showing 1 to 20 of 45 results');
    expect(screen.getByRole('navigation', { name: 'Results pages' })).not.toBeNull();
  });

  it('renders links with getHref, and drops the href of an inert end', () => {
    render(<Pagination defaultPage={1} pageCount={3} getHref={(p) => `?page=${p}`} />);
    const page2 = screen.getByRole('link', { name: 'Page 2' });
    expect(page2.getAttribute('href')).toBe('?page=2');
    expect(page2.getAttribute('data-ds')).toBe('button');
    expect(screen.getByRole('link', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
    const previous = screen.getByRole('link', { name: 'Previous page' });
    expect(previous.hasAttribute('href')).toBe(false);
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('link', { name: 'Next page' }).getAttribute('href')).toBe('?page=2');
  });

  it('size, shape, showEnds and disabled reach the controls', () => {
    const { container } = render(<Pagination size="lg" shape="pill" showEnds={false} disabled pageCount={3} />);
    const el = root(container);
    expect(parts(el)).toEqual(['previous', 'page', 'page', 'ellipsis', 'page', 'next']);
    for (const child of Array.from(el.children).filter((c) => c.getAttribute('data-part') !== 'ellipsis')) {
      expect(child.getAttribute('data-size')).toBe('lg');
      expect(child.getAttribute('data-shape')).toBe('pill');
      expect(child.getAttribute('aria-disabled')).toBe('true');
    }
  });

  it('clamps a page past the end', () => {
    render(<Pagination page={40} pageCount={5} />);
    expect(screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current')).toBe('page');
  });

  it('takes ref as a prop and passes props through', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<Pagination ref={ref} className="x" pageCount={2} />);
    expect(ref.current).toBe(root(container));
    expect(root(container).className).toBe('x');
  });

  it('renders every demo case', () => {
    const { container } = render(<PaginationDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    const variants = container.querySelector('[data-demo-case="variants"]');
    for (const size of ['sm', 'md', 'lg']) expect(variants?.querySelector(`[data-ds="pagination"][data-size="${size}"]`)).not.toBeNull();
    for (const shape of ['default', 'pill', 'square']) expect(variants?.querySelector(`[data-ds="pagination"][data-shape="${shape}"]`)).not.toBeNull();
    expect(variants?.querySelector('[data-ds="theme"][lang="ar"] [data-ds="pagination"]')).not.toBeNull();
  });
});
