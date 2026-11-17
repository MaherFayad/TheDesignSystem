import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Pagination } from './index';

const dots = () => screen.getAllByRole('button');

describe('Pagination variant dots', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('is a nav named Pages with one dot per page and no numbers, ends or summary', () => {
    const { container } = render(<Pagination variant="dots" pageCount={5} defaultPage={3} itemCount={100} showEnds />);
    const nav = screen.getByRole('navigation', { name: 'Pages' });
    expect(nav.getAttribute('data-ds')).toBe('pagination');
    expect(nav.getAttribute('data-variant')).toBe('dots');
    expect(nav.hasAttribute('data-compact')).toBe(false);
    expect(container.querySelector('[data-part="track"]')).toBeTruthy();
    expect(dots()).toHaveLength(5);
    for (const d of dots()) expect(d.getAttribute('data-part')).toBe('dot');
    expect(container.querySelector('[data-part="page"], [data-part="first"], [data-part="next"], [data-part="summary"], [data-part="ellipsis"]')).toBeNull();
    expect(nav.textContent).toBe('');
  });

  it('names each dot Page n of m and marks the current one', () => {
    render(<Pagination variant="dots" pageCount={5} defaultPage={3} />);
    const current = screen.getByRole('button', { name: 'Page 3 of 5' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.getAttribute('data-active')).toBe('');
    const other = screen.getByRole('button', { name: 'Page 1 of 5' });
    expect(other.hasAttribute('aria-current')).toBe(false);
    expect(other.hasAttribute('data-active')).toBe(false);
  });

  it('says its words in Arabic with Western digits', () => {
    render(
      <Theme lang="ar" dir="rtl">
        <Pagination variant="dots" pageCount={12} defaultPage={10} />
      </Theme>,
    );
    expect(screen.getByRole('navigation', { name: 'الصفحات' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'صفحة 10 من 12' }).getAttribute('aria-current')).toBe('page');
  });

  it('is one tab stop: only the current dot is in the tab order', () => {
    render(<Pagination variant="dots" pageCount={4} defaultPage={2} />);
    expect(dots().map((d) => d.getAttribute('tabindex'))).toEqual(['-1', '0', '-1', '-1']);
  });

  it('moves and selects with the arrows, Home and End, without wrapping', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination variant="dots" pageCount={4} defaultPage={2} onPageChange={onPageChange} />);
    await user.tab();
    expect(document.activeElement).toBe(dots()[1]);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(dots()[2]);
    expect(dots()[2]?.getAttribute('aria-current')).toBe('page');
    expect(dots()[2]?.getAttribute('tabindex')).toBe('0');
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(dots()[3]);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(dots()[3]);
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(dots()[0]);
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(dots()[0]);
    expect(onPageChange.mock.calls.map((c) => c[0])).toEqual([3, 4, 1]);
  });

  it('mirrors the arrows in right to left', async () => {
    const user = userEvent.setup();
    render(
      <Theme dir="rtl" lang="ar">
        <Pagination variant="dots" pageCount={4} defaultPage={2} />
      </Theme>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'صفحة 3 من 4' }).getAttribute('aria-current')).toBe('page');
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('button', { name: 'صفحة 1 من 4' }).getAttribute('aria-current')).toBe('page');
  });

  it('selects a page on a press of its dot, and follows a controlled page', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Pagination variant="dots" pageCount={5} page={1} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Page 4 of 5' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole('button', { name: 'Page 1 of 5' }).getAttribute('aria-current')).toBe('page');
    rerender(<Pagination variant="dots" pageCount={5} page={4} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Page 4 of 5' }).getAttribute('aria-current')).toBe('page');
  });

  it('does not call onPageChange for the current dot, and clamps the page', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination variant="dots" pageCount={3} page={9} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Page 3 of 3' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('reads a page count under 1 or not a number as one dot', () => {
    const { rerender } = render(<Pagination variant="dots" pageCount={0} />);
    expect(dots()).toHaveLength(1);
    rerender(<Pagination variant="dots" pageCount={Number.NaN} />);
    expect(dots()).toHaveLength(1);
    expect(dots()[0]?.getAttribute('aria-label')).toBe('Page 1 of 1');
  });

  it('when disabled keeps the tab stop and the focus move, but selects nothing', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination variant="dots" pageCount={3} defaultPage={1} disabled onPageChange={onPageChange} />);
    for (const d of dots()) expect(d.getAttribute('aria-disabled')).toBe('true');
    await user.tab();
    expect(document.activeElement).toBe(dots()[0]);
    await user.keyboard('{ArrowRight}');
    await user.click(dots()[2]!);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('takes a label for the nav', () => {
    render(<Pagination variant="dots" pageCount={3} label="Onboarding screens" />);
    expect(screen.getByRole('navigation', { name: 'Onboarding screens' })).toBeTruthy();
  });

  it('renders the same on the server, never compact', () => {
    const html = renderToString(<Pagination variant="dots" pageCount={40} defaultPage={2} />);
    expect(html).toContain('data-variant="dots"');
    expect(html).not.toContain('data-compact');
    expect(html.match(/data-part="dot"/g)).toHaveLength(40);
  });

  it('leaves the numbered form as it was: no data-variant', () => {
    const { container } = render(<Pagination pageCount={5} />);
    expect(container.querySelector('[data-ds="pagination"]')?.hasAttribute('data-variant')).toBe(false);
    expect(container.querySelector('[data-part="track"]')).toBeNull();
  });

  describe('compact, when the dots do not fit', () => {
    /** Lays the dots out at 24 each in a root of the given width. */
    function layout(width: number) {
      const real = window.getComputedStyle;
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
        const style = real(el, pseudo);
        if (el.getAttribute('data-part') !== 'dot') return style;
        return new Proxy(style, {
          get: (target, key) => {
            if (key === 'flexBasis') return '24px';
            const value = Reflect.get(target, key, target) as unknown;
            return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
          },
        });
      });
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('data-ds') === 'pagination' ? width : 0;
      });
    }

    it('stays full size while the dots fit', () => {
      layout(393);
      render(<Pagination variant="dots" pageCount={12} />);
      expect(screen.getByRole('navigation').hasAttribute('data-compact')).toBe(false);
    });

    it('turns compact past the width, and back when the room grows', () => {
      let resize: () => void = () => {};
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(cb: () => void) {
            resize = cb;
          }
          observe() {}
          disconnect() {}
        },
      );
      layout(393);
      render(<Pagination variant="dots" pageCount={20} />);
      const nav = screen.getByRole('navigation');
      expect(nav.getAttribute('data-compact')).toBe('');
      vi.restoreAllMocks();
      layout(800);
      act(() => resize());
      expect(nav.hasAttribute('data-compact')).toBe(false);
    });

    it('goes back on a press on the leading half and forward on the trailing half', () => {
      layout(393);
      const onPageChange = vi.fn();
      const { container } = render(<Pagination variant="dots" pageCount={20} defaultPage={5} onPageChange={onPageChange} />);
      const track = container.querySelector<HTMLElement>('[data-part="track"]')!;
      vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 393, width: 393, top: 0, bottom: 44, height: 44, x: 0, y: 0, toJSON: () => ({}) });
      fireEvent.click(track, { clientX: 50, detail: 1 });
      expect(onPageChange).toHaveBeenLastCalledWith(4);
      fireEvent.click(track, { clientX: 350, detail: 1 });
      fireEvent.click(track, { clientX: 350, detail: 1 });
      expect(onPageChange.mock.calls.map((c) => c[0])).toEqual([4, 5, 6]);
      // A pointer press that lands on a dot (its hit layer) counts by the half too, never as that dot.
      fireEvent.click(screen.getByRole('button', { name: 'Page 20 of 20' }), { clientX: 30, detail: 1 });
      expect(onPageChange).toHaveBeenLastCalledWith(5);
    });

    it('mirrors the halves in right to left', () => {
      layout(393);
      const onPageChange = vi.fn();
      const { container } = render(
        <Theme dir="rtl" lang="ar">
          <Pagination variant="dots" pageCount={20} defaultPage={5} onPageChange={onPageChange} />
        </Theme>,
      );
      const track = container.querySelector<HTMLElement>('[data-part="track"]')!;
      vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 393, width: 393, top: 0, bottom: 44, height: 44, x: 0, y: 0, toJSON: () => ({}) });
      fireEvent.click(track, { clientX: 50, detail: 1 });
      expect(onPageChange).toHaveBeenLastCalledWith(6);
    });

    it('keeps the keys and the dots own Enter', async () => {
      layout(393);
      const onPageChange = vi.fn();
      const user = userEvent.setup();
      render(<Pagination variant="dots" pageCount={20} defaultPage={5} onPageChange={onPageChange} />);
      await user.tab();
      await user.keyboard('{ArrowRight}');
      expect(onPageChange).toHaveBeenLastCalledWith(6);
      screen.getByRole('button', { name: 'Page 9 of 20' }).focus();
      await user.keyboard('{Enter}');
      expect(onPageChange).toHaveBeenLastCalledWith(9);
    });
  });
});
