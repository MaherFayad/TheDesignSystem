import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import AspectRatioDemo from './AspectRatio.demo';
import { AspectRatio } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="aspect-ratio"]');
  if (!el) throw new Error('no aspect ratio rendered');
  return el;
}

function ratioOf(el: HTMLElement): number {
  return Number.parseFloat(el.style.getPropertyValue('--_aspect-ratio-ratio'));
}

describe('AspectRatio', () => {
  it('defaults to 16 by 9 and fit cover', () => {
    const el = root(render(<AspectRatio />).container);
    expect(el.getAttribute('data-fit')).toBe('cover');
    expect(ratioOf(el)).toBeCloseTo(16 / 9, 5);
  });

  it('takes a ratio and a fit', () => {
    const el = root(render(<AspectRatio ratio={1} fit="contain" />).container);
    expect(el.getAttribute('data-fit')).toBe('contain');
    expect(ratioOf(el)).toBe(1);
  });

  it('falls back to 16 by 9 for a ratio that is not a positive number', () => {
    for (const ratio of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const el = root(render(<AspectRatio ratio={ratio} />).container);
      expect(ratioOf(el)).toBeCloseTo(16 / 9, 5);
    }
  });

  it('is one element: no wrapper sits between the root and its parent', () => {
    const { container } = render(<AspectRatio ratio={1} />);
    expect(container.firstElementChild?.getAttribute('data-ds')).toBe('aspect-ratio');
  });

  it('keeps ref, className and a consumer width on the ratio element', () => {
    const ref = createRef<HTMLDivElement>();
    const el = root(
      render(<AspectRatio ref={ref} ratio={2} className="x" style={{ inlineSize: 240, opacity: 0.5 }} />).container,
    );
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.style.opacity).toBe('0.5');
    expect(el.style.inlineSize).toBe('240px');
    // The ratio is carried by the same element that takes the width.
    expect(ratioOf(el)).toBe(2);
    expect(el.style.position).toBe('');
  });

  it('renders the child as the root with asChild', () => {
    const el = root(
      render(
        <AspectRatio asChild ratio={1}>
          <figure />
        </AspectRatio>,
      ).container,
    );
    expect(el.tagName).toBe('FIGURE');
    expect(ratioOf(el)).toBe(1);
  });

  it('renders every demo case that applies', () => {
    const { container } = render(<AspectRatioDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"] [data-ds="aspect-ratio"]`)).not.toBeNull();
    }
  });
});
