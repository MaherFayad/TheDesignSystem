import { act, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import ScrollAreaDemo from './ScrollArea.demo';
import { ScrollArea, hasFocusableChild, readOverflow } from './index';

// jsdom has no ResizeObserver; Radix ScrollArea needs one.
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="scroll-area"]');
  if (!el) throw new Error('no scroll area rendered');
  return el;
}

function viewport(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-part="viewport"]');
  if (!el) throw new Error('no viewport rendered');
  return el;
}

/** Gives an element a scroll geometry jsdom does not compute. */
function geometry(el: HTMLElement, g: Partial<Record<'scrollTop' | 'scrollLeft' | 'scrollHeight' | 'clientHeight' | 'scrollWidth' | 'clientWidth', number>>) {
  for (const [key, value] of Object.entries(g)) {
    Object.defineProperty(el, key, { configurable: true, writable: true, value });
  }
}

describe('ScrollArea', () => {
  it('renders the anatomy with the default axes', () => {
    const { container } = render(<ScrollArea>Text</ScrollArea>);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('data-overflow-start')).toBe(false);
    expect(el.hasAttribute('data-overflow-end')).toBe(false);
    expect(el.querySelector('[data-part="fade-start"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-part="fade-end"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(viewport(container).textContent).toBe('Text');
  });

  it('sets size and orientation, and drops the fades on request', () => {
    const { container } = render(
      <ScrollArea size="sm" orientation="horizontal" fades={false}>
        Text
      </ScrollArea>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.querySelector('[data-part="fade-start"]')).toBeNull();
  });

  it('makes a viewport with no focusable child a named, focusable region', () => {
    const { container } = render(<ScrollArea label="Release notes">Text</ScrollArea>);
    const v = viewport(container);
    expect(v.getAttribute('tabindex')).toBe('0');
    expect(v.getAttribute('role')).toBe('region');
    expect(v.getAttribute('aria-label')).toBe('Release notes');
  });

  it('names the viewport in Arabic under lang ar', () => {
    const { container } = render(
      <Theme lang="ar">
        <ScrollArea>نص</ScrollArea>
      </Theme>,
    );
    expect(viewport(container).getAttribute('aria-label')).toBe('محتوى قابل للتمرير');
    expect(root(container).getAttribute('dir')).toBe('rtl');
  });

  it('keeps the viewport out of the tab order when a child can take focus', () => {
    const { container } = render(
      <ScrollArea>
        <a href="#one">One</a>
      </ScrollArea>,
    );
    const v = viewport(container);
    expect(v.hasAttribute('tabindex')).toBe(false);
    expect(v.hasAttribute('role')).toBe(false);
  });

  it('follows focusable true and false', () => {
    const forced = render(
      <ScrollArea focusable>
        <a href="#one">One</a>
      </ScrollArea>,
    );
    expect(viewport(forced.container).getAttribute('tabindex')).toBe('0');
    const off = render(<ScrollArea focusable={false}>Text</ScrollArea>);
    expect(viewport(off.container).hasAttribute('tabindex')).toBe(false);
  });

  it('stamps the overflow states from the scroll position', () => {
    const onScroll = vi.fn();
    const { container } = render(<ScrollArea onScroll={onScroll}>Text</ScrollArea>);
    const el = root(container);
    const v = viewport(container);
    geometry(v, { scrollTop: 0, scrollHeight: 400, clientHeight: 100 });
    fireEvent.scroll(v);
    expect(el.hasAttribute('data-overflow-start')).toBe(false);
    expect(el.getAttribute('data-overflow-end')).toBe('');
    geometry(v, { scrollTop: 150 });
    fireEvent.scroll(v);
    expect(el.getAttribute('data-overflow-start')).toBe('');
    expect(el.getAttribute('data-overflow-end')).toBe('');
    geometry(v, { scrollTop: 300 });
    fireEvent.scroll(v);
    expect(el.getAttribute('data-overflow-start')).toBe('');
    expect(el.hasAttribute('data-overflow-end')).toBe(false);
    expect(onScroll).toHaveBeenCalledTimes(3);
  });

  it('passes the viewport ref and spreads props onto the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <ScrollArea viewportRef={ref} className="x" id="area">
        Text
      </ScrollArea>,
    );
    expect(ref.current).toBe(viewport(container));
    expect(root(container).id).toBe('area');
    expect(root(container).className).toBe('x');
  });

  it('renders the demo', () => {
    const { container } = render(<ScrollAreaDemo />);
    act(() => undefined);
    expect(container.querySelectorAll('[data-ds="scroll-area"]').length).toBeGreaterThan(5);
    expect(container.querySelector('[data-demo-case="long-arabic"]')).not.toBeNull();
  });
});

describe('readOverflow', () => {
  const el = (g: Record<string, number>) => {
    const d = document.createElement('div');
    geometry(d, g);
    return d;
  };

  it('reads the inline axis, negative scrollLeft in RTL included', () => {
    expect(readOverflow(el({ scrollLeft: 0, scrollWidth: 500, clientWidth: 100 }), 'inline')).toEqual({ start: false, end: true });
    expect(readOverflow(el({ scrollLeft: -400, scrollWidth: 500, clientWidth: 100 }), 'inline')).toEqual({ start: true, end: false });
  });

  it('reports no overflow when content fits', () => {
    expect(readOverflow(el({ scrollTop: 0, scrollHeight: 100, clientHeight: 100 }), 'block')).toEqual({ start: false, end: false });
  });
});

describe('hasFocusableChild', () => {
  it('skips disabled controls and tabindex -1', () => {
    const d = document.createElement('div');
    d.innerHTML = '<button disabled>A</button><span tabindex="-1">B</span>';
    expect(hasFocusableChild(d)).toBe(false);
    d.innerHTML += '<input />';
    expect(hasFocusableChild(d)).toBe(true);
  });
});
