import { act, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

/** Makes the viewport overflow and lets the area measure it again. */
function overflowing(container: HTMLElement): HTMLElement {
  const v = viewport(container);
  geometry(v, { scrollTop: 0, scrollHeight: 400, clientHeight: 100 });
  fireEvent.scroll(v);
  return v;
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

  it('keeps a viewport that does not overflow out of the tab order', () => {
    const { container } = render(<ScrollArea label="Release notes">Text</ScrollArea>);
    const v = viewport(container);
    expect(v.hasAttribute('tabindex')).toBe(false);
    expect(v.hasAttribute('aria-label')).toBe(false);
  });

  it('makes an overflowing viewport with no focusable child a named, focusable region', () => {
    const { container } = render(<ScrollArea label="Release notes">Text</ScrollArea>);
    const v = overflowing(container);
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
    overflowing(container);
    expect(viewport(container).getAttribute('aria-label')).toBe('محتوى قابل للتمرير');
    expect(root(container).getAttribute('dir')).toBe('rtl');
  });

  it('keeps the viewport out of the tab order and unnamed when a child can take focus', () => {
    const { container } = render(
      <ScrollArea label="Links">
        <a href="#one">One</a>
      </ScrollArea>,
    );
    const v = overflowing(container);
    expect(v.hasAttribute('tabindex')).toBe(false);
    expect(v.hasAttribute('role')).toBe(false);
    expect(v.hasAttribute('aria-label')).toBe(false);
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
    d.innerHTML = '<button disabled>A</button><span tabindex="-1">B</span><div inert><a href="#c">C</a></div>';
    expect(hasFocusableChild(d)).toBe(false);
    d.innerHTML += '<input />';
    expect(hasFocusableChild(d)).toBe(true);
  });
});

describe('ScrollArea thumb contrast (WCAG 1.4.11)', () => {
  // Vitest runs from the repo root; the token build runs before the tests in npm run check.
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/ScrollArea.css'), 'utf8');
  const tokens = readFileSync(join(process.cwd(), 'packages/tokens/dist/css/tokens.css'), 'utf8');

  const parse = (value: string): { rgb: number[]; a: number } => {
    const v = value.trim();
    if (v.startsWith('#')) return { rgb: [1, 3, 5].map((i) => Number.parseInt(v.slice(i, i + 2), 16)), a: 1 };
    const m = /rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)/.exec(v);
    if (!m) throw new Error(`cannot parse ${v}`);
    return { rgb: [Number(m[1]), Number(m[2]), Number(m[3])], a: m[4] ? Number(m[4]) : 1 };
  };
  const lum = (rgb: number[]) => {
    const [r, g, b] = rgb.map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const ratio = (fg: string, bg: string) => {
    const f = parse(fg);
    const b = parse(bg).rgb;
    const mixed = f.rgb.map((c, i) => Math.round(f.a * c + (1 - f.a) * b[i]!));
    const [hi, lo] = [lum(mixed), lum(b)].sort((x, y) => y - x);
    return (hi! + 0.05) / (lo! + 0.05);
  };

  // A token may alias another (var(--ds-color-text-subtle)); follow the chain inside the same block.
  const resolve = (t: Record<string, string>, name: string): string => {
    let v = t[name]!;
    for (let m = /^var\(--ds-([\w-]+)\)$/.exec(v); m; m = /^var\(--ds-([\w-]+)\)$/.exec(v)) v = t[m[1]!]!;
    return v;
  };

  it('draws the thumb at 3:1 or more on body and surface 1 to 4 in every style and scheme', () => {
    const thumbToken = /--_scroll-area-thumb:\s*var\(--ds-([\w-]+)\)/.exec(css)?.[1];
    expect(thumbToken).toBeDefined();
    const blocks = tokens.split(/\n\s*(\[data-style='\w+'\]\[data-scheme='\w+'\]) \{/);
    let modes = 0;
    for (let i = 1; i < blocks.length; i += 2) {
      const body = blocks[i + 1]!.split('\n  }')[0]!;
      const t = Object.fromEntries([...body.matchAll(/--ds-([\w-]+): ([^;]+);/g)].map((m) => [m[1], m[2]]));
      for (const bg of ['bg-body', 'bg-surface', 'bg-surface-2', 'bg-surface-3', 'bg-surface-4']) {
        expect(ratio(resolve(t, thumbToken!), resolve(t, `color-${bg}`)), `${blocks[i]} on ${bg}`).toBeGreaterThanOrEqual(3);
      }
      modes += 1;
    }
    expect(modes).toBe(6);
  });

  it('gives no demo ScrollArea a fixed inline size that could overflow a 320px screen', () => {
    const { container } = render(<ScrollAreaDemo />);
    const roots = Array.from(container.querySelectorAll<HTMLElement>('[data-ds="scroll-area"]'));
    expect(roots.length).toBeGreaterThan(0);
    for (const el of roots) expect(el.style.inlineSize, el.outerHTML.slice(0, 80)).not.toMatch(/rem|px/);
  });
});
