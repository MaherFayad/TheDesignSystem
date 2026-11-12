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

function wrapperPadding(el: HTMLElement): string {
  return (el.parentElement as HTMLElement).style.paddingBottom;
}

describe('AspectRatio', () => {
  it('defaults to 16 by 9 and fit cover', () => {
    const el = root(render(<AspectRatio />).container);
    expect(el.getAttribute('data-fit')).toBe('cover');
    expect(Number.parseFloat(wrapperPadding(el))).toBeCloseTo(56.25, 2);
    expect(el.style.position).toBe('absolute');
  });

  it('takes a ratio and a fit', () => {
    const el = root(render(<AspectRatio ratio={1} fit="contain" />).container);
    expect(el.getAttribute('data-fit')).toBe('contain');
    expect(wrapperPadding(el)).toBe('100%');
  });

  it('falls back to 16 by 9 for a ratio that is not a positive number', () => {
    for (const ratio of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const el = root(render(<AspectRatio ratio={ratio} />).container);
      expect(Number.parseFloat(wrapperPadding(el))).toBeCloseTo(56.25, 2);
    }
  });

  it('passes ref, className and style to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const el = root(render(<AspectRatio ref={ref} className="x" style={{ opacity: 0.5 }} />).container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.style.opacity).toBe('0.5');
  });

  it('renders every demo case that applies', () => {
    const { container } = render(<AspectRatioDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"] [data-ds="aspect-ratio"]`)).not.toBeNull();
    }
  });
});
