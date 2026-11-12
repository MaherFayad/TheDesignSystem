import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import TableOfContentsDemo from './TableOfContents.demo';
import { fragmentId, TableOfContents } from './TableOfContents';
import type { TocHeading } from './index';

const items: TocHeading[] = [
  { id: 'a', label: 'Get started', level: 2 },
  { id: 'a1', label: 'Install', level: 3 },
  { id: 'b', label: 'Theming', level: 2 },
];

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="table-of-contents"]');
  if (!el) throw new Error('no table of contents rendered');
  return el;
}

function Page(props: Partial<Parameters<typeof TableOfContents>[0]>) {
  return (
    <>
      <TableOfContents items={items} {...props} />
      <h2 id="a">Get started</h2>
      <h3 id="a1">Install</h3>
      <h2 id="b">Theming</h2>
    </>
  );
}

afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});

describe('TableOfContents', () => {
  it('renders a nav named by its title, with nested lists and levels', () => {
    const { container } = render(<Page />);
    const el = root(container);
    expect(el.tagName).toBe('NAV');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-sticky')).toBe(false);
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBe(el);
    const title = el.querySelector('[data-part="title"]');
    expect(title?.tagName).toBe('P');
    const top = el.querySelector(':scope > [data-part="list"]');
    expect(top?.tagName).toBe('OL');
    const levels = Array.from(el.querySelectorAll('[data-part="item"]')).map((i) => i.getAttribute('data-level'));
    expect(levels).toEqual(['1', '2', '1']);
    expect(el.querySelector('[data-part="item"] > [data-part="list"] [data-part="link"]')?.textContent).toBe('Install');
    expect(el.querySelector('[data-part="indicator"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('marks the first section active at first, with aria-current location', () => {
    render(<Page />);
    const link = screen.getByRole('link', { name: 'Get started' });
    expect(link.getAttribute('aria-current')).toBe('location');
    expect(link.parentElement?.hasAttribute('data-active')).toBe(true);
    expect(screen.getByRole('link', { name: 'Theming' }).hasAttribute('aria-current')).toBe(false);
  });

  it('takes a controlled active id', () => {
    render(<Page active="b" />);
    expect(screen.getByRole('link', { name: 'Theming' }).getAttribute('aria-current')).toBe('location');
    expect(screen.getByRole('link', { name: 'Get started' }).hasAttribute('aria-current')).toBe(false);
  });

  it('Enter scrolls to the heading, moves focus to it with tabindex -1 and sets the fragment', async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<Page onActiveChange={onActiveChange} />);
    const link = screen.getByRole('link', { name: 'Theming' });
    link.focus();
    await user.keyboard('{Enter}');
    const heading = document.getElementById('b');
    expect(document.activeElement).toBe(heading);
    expect(heading?.getAttribute('tabindex')).toBe('-1');
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(window.location.hash).toBe('#b');
    expect(onActiveChange).toHaveBeenCalledWith('b');
    expect(link.getAttribute('aria-current')).toBe('location');
  });

  it('jumps without smooth scroll under reduced motion', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    render(<Page />);
    fireEvent.click(screen.getByRole('link', { name: 'Install' }));
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('leaves a modifier click to the browser', () => {
    render(<Page />);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    screen.getByRole('link', { name: 'Install' }).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('tracks the section in view through an IntersectionObserver', () => {
    let callback: (() => void) | undefined;
    const observe = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: () => void) {
          callback = cb;
        }
        observe = observe;
        disconnect() {}
      },
    );
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    const onActiveChange = vi.fn();
    render(<Page offset={64} onActiveChange={onActiveChange} />);
    expect(observe).toHaveBeenCalledTimes(3);
    const tops: Record<string, number> = { a: -500, a1: -200, b: 40 };
    for (const id of Object.keys(tops)) {
      document.getElementById(id)!.getBoundingClientRect = () => ({ top: tops[id] }) as DOMRect;
    }
    act(() => callback?.());
    // b sits 40px from the top, above the 64px offset line: it is reached.
    expect(onActiveChange).toHaveBeenLastCalledWith('b');
    expect(screen.getByRole('link', { name: 'Theming' }).getAttribute('aria-current')).toBe('location');
  });

  it('holds the clicked section while the scroll plays, until scrollend', () => {
    let callback: (() => void) | undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: () => void) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    Element.prototype.scrollIntoView = vi.fn();
    const onActiveChange = vi.fn();
    render(<Page onActiveChange={onActiveChange} />);
    const tops: Record<string, number> = { a: -100, a1: 10, b: 400 };
    for (const id of Object.keys(tops)) {
      document.getElementById(id)!.getBoundingClientRect = () => ({ top: tops[id] }) as DOMRect;
    }
    fireEvent.click(screen.getByRole('link', { name: 'Theming' }));
    expect(onActiveChange).toHaveBeenLastCalledWith('b');
    // On the way down, a1 crosses the line: the mark stays on b.
    act(() => callback?.());
    expect(onActiveChange).toHaveBeenLastCalledWith('b');
    // The scroll ends with b at the top.
    tops.a1 = -300;
    tops.b = 0;
    act(() => {
      window.dispatchEvent(new Event('scrollend'));
    });
    expect(onActiveChange).toHaveBeenLastCalledWith('b');
    expect(onActiveChange).not.toHaveBeenCalledWith('a1');
  });

  it('marks the section the URL fragment names on load, and disconnects on unmount', () => {
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect = disconnect;
      },
    );
    window.history.replaceState(null, '', '#a1');
    const { unmount } = render(<Page />);
    expect(screen.getByRole('link', { name: 'Install' }).getAttribute('aria-current')).toBe('location');
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('sets the sticky top from offset', () => {
    const { container } = render(<Page sticky offset={56} />);
    expect(root(container).style.getPropertyValue('--_toc-sticky-offset')).toBe('calc(56px + var(--ds-space-l))');
  });

  it('sets size, sticky, a custom title, and the Arabic default title', () => {
    const { container, rerender } = render(<Page size="sm" sticky title="In this guide" />);
    expect(root(container).getAttribute('data-size')).toBe('sm');
    expect(root(container).hasAttribute('data-sticky')).toBe(true);
    expect(screen.getByRole('navigation', { name: 'In this guide' })).not.toBeNull();
    rerender(
      <Theme lang="ar">
        <Page />
      </Theme>,
    );
    expect(screen.getByRole('navigation', { name: 'محتوى الصفحة' })).not.toBeNull();
  });

  it('hides the title with title false and takes an aria-label', () => {
    const { container } = render(<Page title={false} aria-label="Sections" />);
    expect(container.querySelector('[data-part="title"]')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Sections' })).not.toBeNull();
  });

  it('renders nothing when there are no headings, so no landmark holds only its title', () => {
    const { container } = render(<TableOfContents items={[]} />);
    expect(container.querySelector('[data-ds="table-of-contents"]')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('renders with a malformed fragment in the URL, such as #50%', () => {
    for (const hash of ['#50%', '#%E0%A4%A']) {
      window.history.replaceState(null, '', hash);
      const { container, unmount } = render(<Page />);
      expect(root(container)).not.toBeNull();
      expect(screen.getByRole('link', { name: 'Get started' }).getAttribute('aria-current')).toBe('location');
      unmount();
    }
    expect(fragmentId('#50%')).toBe('50%');
    expect(fragmentId('#caf%C3%A9')).toBe('café');
  });

  it('keeps the section the fragment names when the first measure runs, until the reader scrolls', () => {
    let callback: (() => void) | undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: () => void) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      // 0, as a frame that already ran: the next schedule asks again.
      return 0;
    });
    window.history.replaceState(null, '', '#b');
    render(<Page />);
    const tops: Record<string, number> = { a: 10, a1: 200, b: 400 };
    for (const id of Object.keys(tops)) {
      document.getElementById(id)!.getBoundingClientRect = () => ({ top: tops[id] }) as DOMRect;
    }
    // The observer fires once on observe: the mark stays on the fragment.
    act(() => callback?.());
    expect(screen.getByRole('link', { name: 'Theming' }).getAttribute('aria-current')).toBe('location');
    // The reader scrolls: tracking takes over.
    act(() => {
      window.dispatchEvent(new Event('scrollend'));
    });
    expect(screen.getByRole('link', { name: 'Get started' }).getAttribute('aria-current')).toBe('location');
  });

  it('applies offset to the jump: a heading with no scroll margin gets one', () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(<Page offset={56} />);
    fireEvent.click(screen.getByRole('link', { name: 'Theming' }));
    expect(document.getElementById('b')!.style.scrollMarginBlockStart).toBe('56px');
  });

  it('keeps a scroll margin the heading already has', () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(<Page offset={56} />);
    document.getElementById('b')!.style.scrollMarginBlockStart = '80px';
    fireEvent.click(screen.getByRole('link', { name: 'Theming' }));
    expect(document.getElementById('b')!.style.scrollMarginBlockStart).toBe('80px');
  });

  it('takes ref as a prop and passes props through', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<TableOfContents ref={ref} items={items} className="x" />);
    expect(ref.current).toBe(root(container));
    expect(root(container).className).toBe('x');
  });

  it('renders every demo case', () => {
    const { container } = render(<TableOfContentsDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    const variants = container.querySelector('[data-demo-case="variants"]');
    for (const size of ['sm', 'md']) expect(variants?.querySelector(`[data-ds="table-of-contents"][data-size="${size}"]`)).not.toBeNull();
    expect(variants?.querySelector('[data-ds="theme"][lang="ar"] [data-ds="table-of-contents"]')).not.toBeNull();
    for (const link of variants?.querySelectorAll('[data-part="link"]') ?? []) {
      expect(container.querySelector(link.getAttribute('href') ?? '')).not.toBeNull();
    }
  });
});
