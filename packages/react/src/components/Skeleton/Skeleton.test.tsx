import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import SkeletonDemo from './Skeleton.demo';
import { SHIMMER_ITERATIONS } from '@the-system/motion';
import { Skeleton } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="skeleton"]');
  if (!el) throw new Error('no skeleton rendered');
  return el;
}

describe('Skeleton', () => {
  it('renders a hidden text line with the default size', () => {
    const { container } = render(<Skeleton />);
    const el = root(container);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('data-variant')).toBe('text');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-shape')).toBe(false);
    expect(el.children.length).toBe(0);
  });

  it('drops data-size for circle and rect', () => {
    const { container } = render(
      <>
        <Skeleton variant="circle" size="lg" />
        <Skeleton variant="rect" />
      </>,
    );
    const all = container.querySelectorAll('[data-ds="skeleton"]');
    expect(all[0]?.getAttribute('data-variant')).toBe('circle');
    expect(all[0]?.hasAttribute('data-size')).toBe(false);
    expect(all[1]?.getAttribute('data-variant')).toBe('rect');
    expect(all[1]?.hasAttribute('data-size')).toBe(false);
  });

  it('turns width and height into private properties, numbers as px', () => {
    const { container } = render(<Skeleton variant="rect" width={120} height="4rem" />);
    const el = root(container);
    expect(el.style.getPropertyValue('--_skeleton-width')).toBe('120px');
    expect(el.style.getPropertyValue('--_skeleton-height')).toBe('4rem');
  });

  it('ignores height on a text line and keeps a caller style', () => {
    const { container } = render(<Skeleton height={40} style={{ marginBlockStart: 4 }} />);
    const el = root(container);
    expect(el.style.getPropertyValue('--_skeleton-height')).toBe('');
    expect(el.style.marginBlockStart).toBe('4px');
  });

  it('stays hidden even when a caller passes aria-hidden false, and takes a ref', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(<Skeleton aria-hidden={false} ref={ref} />);
    expect(root(container).getAttribute('aria-hidden')).toBe('true');
    expect(ref.current).toBe(root(container));
  });

  it('demo wraps its skeletons in busy containers', () => {
    const { container } = render(<SkeletonDemo />);
    const all = container.querySelectorAll('[data-ds="skeleton"]');
    expect(all.length).toBeGreaterThan(20);
    all.forEach((el) => expect(el.closest('[aria-busy="true"]')).not.toBeNull());
  });
});

describe('Skeleton shimmer and loading announcement', () => {
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Skeleton.css'), 'utf8');

  // WCAG 2.2.2: the skeleton-shimmer pattern loops SHIMMER_ITERATIONS times
  // (4.2s) so it stops before five seconds. The CSS must match it.
  it('plays the shimmer three times, linear, never infinite', () => {
    const decl = /animation: ds-skeleton-shimmer ([^;]+);/.exec(css)?.[1] ?? '';
    expect(decl).not.toContain('infinite');
    expect(decl).toBe('var(--_skeleton-duration) linear var(--_skeleton-loops)');
    expect(css).toMatch(/--_skeleton-duration: var\(--ds-duration-shimmer\);/);
    expect(/--_skeleton-loops: (\d+);/.exec(css)?.[1]).toBe(String(SHIMMER_ITERATIONS));
  });

  it('every busy region in the demo has a status line outside it that says what loads', () => {
    const { container } = render(<SkeletonDemo />);
    const busy = [...container.querySelectorAll('[aria-busy="true"]')];
    expect(busy.length).toBeGreaterThan(0);
    for (const region of busy) {
      const status = region.parentElement?.querySelector(':scope > [role="status"]');
      expect(status, region.getAttribute('aria-label') ?? '').not.toBeNull();
      expect(region.contains(status!)).toBe(false);
      expect(status!.textContent?.trim()).not.toBe('');
    }
  });
});
