import { describe, expect, it } from 'vitest';
import { foldFrom, foldPadding, overlaySegment, paddingOf, readFold, sameFold, segmentAt } from './fold';

// The inner screen in landscape, the fold at 455 with a 40 band (reset-duo.md 7).
const book = [
  { x: 0, y: 0, width: 455, height: 669 },
  { x: 495, y: 0, width: 456, height: 669 },
];
// The inner screen in portrait, the fold across.
const laptop = [
  { x: 0, y: 0, width: 669, height: 455 },
  { x: 0, y: 495, width: 669, height: 456 },
];

describe('foldFrom', () => {
  it('has no fold without segments, with one, or with three', () => {
    expect(foldFrom(undefined)).toBeNull();
    expect(foldFrom(null)).toBeNull();
    expect(foldFrom([book[0]])).toBeNull();
    expect(foldFrom([...book, book[0]])).toBeNull();
  });

  it('reads two segments side by side, in any order, and the band between them', () => {
    const fold = foldFrom([book[1], book[0]])!;
    expect(fold.layout).toBe('columns');
    expect(fold.segments[0].x).toBe(0);
    expect(fold.band).toEqual({ x: 455, y: 0, width: 40, height: 669 });
  });

  it('reads two segments one above the other', () => {
    const fold = foldFrom(laptop)!;
    expect(fold.layout).toBe('rows');
    expect(fold.band).toEqual({ x: 0, y: 455, width: 669, height: 40 });
  });

  it('takes DOMRect like objects with left and top, and refuses overlaps and empty rectangles', () => {
    expect(foldFrom([{ left: 0, top: 0, width: 10, height: 10 }, { left: 10, top: 0, width: 10, height: 10 }])?.band.width).toBe(0);
    expect(foldFrom([{ x: 0, y: 0, width: 20, height: 20 }, { x: 10, y: 10, width: 20, height: 20 }])).toBeNull();
    expect(foldFrom([{ x: 0, y: 0, width: 0, height: 20 }, book[1]])).toBeNull();
    expect(foldFrom(['a', 'b'])).toBeNull();
  });
});

describe('readFold', () => {
  it('reads window.viewport.segments, and nothing when the API is absent or throws', () => {
    expect(readFold(undefined)).toBeNull();
    expect(readFold({} as Window)).toBeNull();
    expect(readFold({ viewport: { segments: [book[0]] } } as unknown as Window)).toBeNull();
    expect(readFold({ viewport: { segments: book } } as unknown as Window)?.layout).toBe('columns');
    const throwing = { get viewport() { throw new Error('flag off'); } } as unknown as Window;
    expect(readFold(throwing)).toBeNull();
  });
});

describe('segments by name', () => {
  it('puts a modal overlay in the inline start segment side by side, in the bottom one stacked', () => {
    expect(overlaySegment(null)).toBeNull();
    expect(overlaySegment(foldFrom(book))).toBe('start');
    expect(overlaySegment(foldFrom(laptop))).toBe('bottom');
  });

  it('names the segment of a point, start and end following the reading direction', () => {
    const fold = foldFrom(book);
    expect(segmentAt(fold, { x: 100, y: 10 })).toBe('start');
    expect(segmentAt(fold, { x: 800, y: 10 })).toBe('end');
    expect(segmentAt(fold, { x: 100, y: 10 }, 'rtl')).toBe('end');
    expect(segmentAt(foldFrom(laptop), { x: 10, y: 600 })).toBe('bottom');
    expect(segmentAt(null, { x: 1, y: 1 })).toBeNull();
  });

  it('compares folds by value', () => {
    expect(sameFold(foldFrom(book), foldFrom([...book]))).toBe(true);
    expect(sameFold(foldFrom(book), foldFrom(laptop))).toBe(false);
    expect(sameFold(null, null)).toBe(true);
  });
});

describe('foldPadding', () => {
  const viewport = { width: 951, height: 669 };
  const base = paddingOf(8);

  it('is the base, with the edges, without a fold', () => {
    expect(foldPadding(null, { x: 10, y: 10 }, viewport, base)).toEqual(base);
    expect(foldPadding(null, { x: 10, y: 10 }, viewport, base, { right: 84 })).toEqual({ top: 8, right: 84, bottom: 8, left: 8 });
  });

  it('keeps an overlay from the start segment out of the band and the other segment', () => {
    const p = foldPadding(foldFrom(book), { x: 200, y: 100 }, viewport, base);
    expect(p.right).toBe(951 - 455 + 8);
    expect(p.left).toBe(8);
  });

  it('keeps an overlay from the end segment past the band', () => {
    const p = foldPadding(foldFrom(book), { x: 700, y: 100 }, viewport, base);
    expect(p.left).toBe(495 + 8);
    expect(p.right).toBe(8);
  });

  it('keeps an overlay in its row when the fold runs across', () => {
    const tall = { width: 669, height: 951 };
    expect(foldPadding(foldFrom(laptop), { x: 10, y: 100 }, tall, base).bottom).toBe(951 - 455 + 8);
    expect(foldPadding(foldFrom(laptop), { x: 10, y: 800 }, tall, base).top).toBe(495 + 8);
  });

  it('reads padding from a number or a partial object', () => {
    expect(paddingOf(undefined)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    expect(paddingOf({ top: 4 })).toEqual({ top: 4, right: 0, bottom: 0, left: 0 });
  });
});
