import { describe, expect, it } from 'vitest';
import { clampPage, isEllipsis, itemRange, pageCount, pageRange } from './pagination';

describe('pageRange', () => {
  it('shows every page when they fit', () => {
    expect(pageRange(1, 1)).toEqual([1]);
    expect(pageRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('is empty for no pages', () => {
    expect(pageRange(1, 0)).toEqual([]);
    expect(pageRange(1, Number.NaN)).toEqual([]);
  });

  it('puts an ellipsis on the far side near the start', () => {
    expect(pageRange(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20]);
    expect(pageRange(4, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20]);
  });

  it('puts ellipses on both sides in the middle', () => {
    expect(pageRange(10, 20)).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20]);
  });

  it('puts an ellipsis on the near side at the end', () => {
    expect(pageRange(20, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20]);
    expect(pageRange(17, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20]);
  });

  it('keeps the same length as the current page moves', () => {
    const lengths = new Set(Array.from({ length: 20 }, (_, i) => pageRange(i + 1, 20).length));
    expect([...lengths]).toEqual([7]);
  });

  it('shows the one page in a gap of one instead of an ellipsis', () => {
    expect(pageRange(5, 20)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 20]);
    expect(pageRange(3, 8)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 8]);
  });

  it('takes siblings and boundaries', () => {
    expect(pageRange(10, 20, 2, 2)).toEqual([1, 2, 'ellipsis-start', 8, 9, 10, 11, 12, 'ellipsis-end', 19, 20]);
    expect(pageRange(10, 20, 0, 0)).toEqual(['ellipsis-start', 10, 'ellipsis-end']);
  });

  it('clamps the current page', () => {
    expect(pageRange(99, 20)).toEqual(pageRange(20, 20));
    expect(pageRange(-3, 20)).toEqual(pageRange(1, 20));
  });

  it('marks ellipses', () => {
    expect(pageRange(10, 20).filter(isEllipsis)).toEqual(['ellipsis-start', 'ellipsis-end']);
  });
});

describe('itemRange', () => {
  it('gives the first and last item of a page', () => {
    expect(itemRange(2, 20, 312)).toEqual({ start: 21, end: 40, total: 312 });
    expect(itemRange(16, 20, 312)).toEqual({ start: 301, end: 312, total: 312 });
  });

  it('handles an empty list and clamps the page', () => {
    expect(itemRange(1, 20, 0)).toEqual({ start: 0, end: 0, total: 0 });
    expect(itemRange(99, 20, 45)).toEqual({ start: 41, end: 45, total: 45 });
  });
});

describe('pageCount and clampPage', () => {
  it('counts pages', () => {
    expect(pageCount(312, 20)).toBe(16);
    expect(pageCount(0, 20)).toBe(1);
  });

  it('clamps', () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
    expect(clampPage(3, 0)).toBe(1);
  });
});
