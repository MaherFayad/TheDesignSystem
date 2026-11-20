// Order C5 (item 8): Pager, pages a person swipes between.
import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import PagerDemo from './Pager.demo';
import { Pager, PagerPage } from './index';

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function Three({ onPageChange, defaultPage, lang }: { onPageChange?: (p: number) => void; defaultPage?: number; lang?: 'ar' }) {
  const ar = lang === 'ar';
  return (
    <Theme lang={lang} dir={ar ? 'rtl' : undefined}>
      <Pager label={ar ? 'المقدمة' : 'Introduction'} dotsLabel={ar ? 'صفحات المقدمة' : 'Introduction pages'} defaultPage={defaultPage} onPageChange={onPageChange}>
        <PagerPage>
          <p>{ar ? 'الأولى' : 'First'}</p>
          <a href="#one">{ar ? 'رابط' : 'Read more'}</a>
        </PagerPage>
        <PagerPage>
          <p>{ar ? 'الثانية' : 'Second'}</p>
        </PagerPage>
        <PagerPage>
          <p>{ar ? 'الثالثة' : 'Third'}</p>
          <input aria-label={ar ? 'الاسم' : 'Name'} />
        </PagerPage>
      </Pager>
    </Theme>
  );
}

const viewport = () => document.querySelector<HTMLElement>('[data-ds="pager"] > [data-part="viewport"]')!;
const pageEls = () => Array.from(document.querySelectorAll<HTMLElement>('[data-ds="pager"] [data-part="page"]'));

/** Gives the viewport a layout jsdom lacks: each page 300 wide, the scroll in px from the start. */
function layout(el: HTMLElement, width = 300) {
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => width });
  el.scrollBy = vi.fn() as unknown as typeof el.scrollBy;
}

afterEach(() => {
  delete (window as unknown as { onscrollend?: unknown }).onscrollend;
});

describe('Pager', () => {
  it('renders the anatomy: a named region viewport, groups per page, the dots of Pagination', () => {
    render(<Three />);
    const root = document.querySelector('[data-ds="pager"]')!;
    expect(Array.from(root.children).map((c) => c.getAttribute('data-part'))).toEqual(['viewport', 'dots']);
    const vp = viewport();
    expect(vp.getAttribute('role')).toBe('region');
    expect(vp.getAttribute('aria-label')).toBe('Introduction');
    expect(vp.tabIndex).toBe(0);
    expect(vp.hasAttribute('aria-live')).toBe(false);
    const groups = pageEls();
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3']);
    expect(groups.every((g) => g.getAttribute('role') === 'group' && g.getAttribute('aria-roledescription') === 'page')).toBe(true);
    const dots = root.querySelector('[data-part="dots"]')!;
    expect(dots.getAttribute('data-ds')).toBe('pagination');
    expect(dots.getAttribute('data-variant')).toBe('dots');
    expect(dots.getAttribute('aria-label')).toBe('Introduction pages');
  });

  it('keeps only the current page in the tree and the tab order', async () => {
    const user = userEvent.setup();
    render(<Three />);
    const [one, two, three] = pageEls();
    expect(one!.hasAttribute('data-active')).toBe(true);
    expect(one!.hasAttribute('inert')).toBe(false);
    expect(two!.hasAttribute('inert')).toBe(true);
    expect(three!.hasAttribute('inert')).toBe(true);
    viewport().focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Read more' }));
  });

  it('moves with the arrow keys, Page Up and Down, Home and End, and stays at the ends', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Three onPageChange={onPageChange} />);
    layout(viewport());
    viewport().focus();
    await user.keyboard('{ArrowLeft}');
    expect(onPageChange).not.toHaveBeenCalled();
    await user.keyboard('{ArrowRight}');
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await user.keyboard('{PageDown}');
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await user.keyboard('{PageUp}');
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await user.keyboard('{Home}');
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    await user.keyboard('{End}');
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(pageEls()[2]!.hasAttribute('data-active')).toBe(true);
    // A key change scrolls the viewport to the page.
    expect(viewport().scrollBy).toBeDefined();
  });

  it('mirrors the arrows in right to left and names the pages in Arabic', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Three onPageChange={onPageChange} lang="ar" />);
    expect(pageEls().map((g) => [g.getAttribute('aria-roledescription'), g.getAttribute('aria-label')])).toEqual([
      ['صفحة', '1 من 3'],
      ['صفحة', '2 من 3'],
      ['صفحة', '3 من 3'],
    ]);
    viewport().focus();
    await user.keyboard('{ArrowLeft}');
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await user.keyboard('{ArrowRight}');
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('keeps keys from a control in a page with it, and moves focus to the viewport when that page turns inert', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const pager = (page: number) => (
      <Pager label="Introduction" page={page} onPageChange={onPageChange}>
        <PagerPage>
          <a href="#one">Read more</a>
        </PagerPage>
        <PagerPage>Second</PagerPage>
      </Pager>
    );
    const { rerender } = render(pager(1));
    const link = screen.getByRole('link', { name: 'Read more' });
    link.focus();
    await user.keyboard('{ArrowRight}');
    expect(onPageChange).not.toHaveBeenCalled();
    // The page changes (a swipe, or the app) while focus is in page 1.
    rerender(pager(2));
    expect(document.activeElement).toBe(viewport());
  });

  it('leaves the keys of a field inside a page to the field', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Three onPageChange={onPageChange} defaultPage={3} />);
    const field = screen.getByRole('textbox', { name: 'Name' });
    field.focus();
    await user.keyboard('ab{ArrowLeft}{Home}');
    expect(onPageChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(field);
  });

  it('changes the page from the dots', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Three onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Page 3 of 3' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole('button', { name: 'Page 3 of 3' }).getAttribute('aria-current')).toBe('page');
  });

  it('takes the page where a swipe settles: on scrollend, or after a pause without it', async () => {
    const onPageChange = vi.fn();
    (window as unknown as { onscrollend: null }).onscrollend = null;
    const { unmount } = render(<Three onPageChange={onPageChange} />);
    const vp = viewport();
    layout(vp);
    vp.scrollLeft = 310;
    fireEvent.scroll(vp);
    expect(onPageChange).not.toHaveBeenCalled();
    fireEvent(vp, new Event('scrollend'));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    unmount();

    delete (window as unknown as { onscrollend?: unknown }).onscrollend;
    vi.useFakeTimers();
    try {
      const onChange = vi.fn();
      render(<Three onPageChange={onChange} lang="ar" />);
      const rtl = viewport();
      layout(rtl);
      // Right to left: the browser gives a negative scroll from the start.
      rtl.scrollLeft = -600;
      fireEvent.scroll(rtl);
      expect(onChange).not.toHaveBeenCalled();
      act(() => void vi.advanceTimersByTime(200));
      expect(onChange).toHaveBeenLastCalledWith(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('scrolls at once under reduced motion, and smoothly otherwise', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [page, setPage] = useState(1);
      return (
        <Pager label="Tips" page={page} onPageChange={setPage}>
          <PagerPage>One</PagerPage>
          <PagerPage>Two</PagerPage>
        </Pager>
      );
    }
    render(<Controlled />);
    const vp = viewport();
    layout(vp);
    pageEls()[1]!.getBoundingClientRect = () => ({ left: 300, top: 0, width: 300, height: 10, right: 600, bottom: 10, x: 300, y: 0, toJSON: () => ({}) }) as DOMRect;
    vp.focus();
    await user.keyboard('{ArrowRight}');
    expect(vp.scrollBy).toHaveBeenLastCalledWith({ left: 300, behavior: 'smooth' });
    document.documentElement.setAttribute('data-motion', 'reduce');
    try {
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowRight}');
      expect(vp.scrollBy).toHaveBeenLastCalledWith({ left: 300, behavior: 'instant' });
    } finally {
      document.documentElement.removeAttribute('data-motion');
    }
  });

  it('draws no dots for one page or with dots false, and a polite region with live', () => {
    render(
      <>
        <Pager label="One">
          <PagerPage>Only</PagerPage>
        </Pager>
        <Pager label="No dots" dots={false} live>
          <PagerPage>A</PagerPage>
          <PagerPage>B</PagerPage>
        </Pager>
      </>,
    );
    expect(document.querySelectorAll('[data-part="dots"]')).toHaveLength(0);
    expect(screen.getByRole('region', { name: 'No dots' }).getAttribute('aria-live')).toBe('polite');
  });

  it('renders on the server with the page asked for and no scroll, and throws for a page outside a Pager', () => {
    const html = renderToString(
      <Pager label="Tips" defaultPage={2}>
        <PagerPage>One</PagerPage>
        <PagerPage>Two</PagerPage>
      </Pager>,
    );
    expect(html).toContain('aria-label="2 of 2" data-active=""');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<PagerPage>Lost</PagerPage>)).toThrow(/inside a Pager/);
    error.mockRestore();
  });

  it('renders the demo cases in order with no native title', () => {
    const { container } = render(<PagerDemo />);
    expect(Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'))).toEqual([
      'variants',
      'one',
      'many',
      'too-many',
      'long-text',
      'long-arabic',
    ]);
    expect(container.querySelector('[title]')).toBeNull();
  });
});
