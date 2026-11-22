// Order P1 E3: on a screen folded like a book the panes follow the viewport
// segments, so the divide sits in the band. Without the API nothing changes.
import { act, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { SplitView } from './index';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

// The inner screen of the foldable in landscape: the fold at 455 with a 40 band.
const book = [
  { x: 0, y: 0, width: 455, height: 669 },
  { x: 495, y: 0, width: 456, height: 669 },
];

function setSegments(segments: object[] | undefined) {
  if (segments === undefined) delete (window as unknown as { viewport?: unknown }).viewport;
  else Object.defineProperty(window, 'viewport', { configurable: true, value: { segments } });
}

/** The root measures from `left` to `right` in the viewport; other boxes keep jsdom's zero. */
function placeRoot(left: number, right: number) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.getAttribute('data-ds') !== 'split-view') return original.call(this);
    return { x: left, y: 0, left, right, top: 0, bottom: 400, width: right - left, height: 400, toJSON: () => ({}) } as DOMRect;
  });
}

const size = (el: Element | null) => Number((el as HTMLElement | null)?.style.getPropertyValue('--_resizable-panels-size'));

function renderReader(dir: 'ltr' | 'rtl' = 'ltr', onLayout = vi.fn()) {
  const view = render(
    <Theme dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'}>
      <SplitView layout="split" onLayout={onLayout} primary={<p>List</p>} secondary={<p>Detail</p>} />
    </Theme>,
  );
  const root = view.container.querySelector('[data-ds="split-view"]');
  return {
    ...view,
    onLayout,
    primary: () => root?.querySelector(':scope > [data-part="primary"]') ?? null,
    secondary: () => root?.querySelector(':scope > [data-part="secondary"]') ?? null,
  };
}

afterEach(() => {
  setSegments(undefined);
  vi.restoreAllMocks();
});

describe('SplitView on a folded screen', () => {
  it('keeps the given sizes without the viewport segments API', () => {
    placeRoot(16, 851);
    const r = renderReader();
    expect(size(r.primary())).toBe(35);
    expect(size(r.secondary())).toBe(65);
  });

  it('splits at the band when the root is not centred on it, and leaves onLayout alone', () => {
    setSegments(book);
    placeRoot(16, 851);
    const r = renderReader();
    // 439 px of the left segment and 356 of the right one: the list is wider than the limit of 50.
    expect(size(r.primary())).toBeCloseTo((439 / 795) * 100, 1);
    expect(size(r.primary()) + size(r.secondary())).toBeCloseTo(100, 5);
    expect(r.onLayout).not.toHaveBeenCalled();
  });

  it('puts the list in the right segment in rtl', () => {
    setSegments(book);
    placeRoot(16, 851);
    const r = renderReader('rtl');
    expect(size(r.primary())).toBeCloseTo((356 / 795) * 100, 1);
  });

  it('puts the sizes from before the fold back when it goes', () => {
    setSegments(book);
    placeRoot(16, 851);
    const r = renderReader();
    expect(size(r.primary())).not.toBe(35);
    setSegments(undefined);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(size(r.primary())).toBe(35);
    expect(size(r.secondary())).toBe(65);
  });

  it('leaves the split as it is when the band is outside the root', () => {
    setSegments(book);
    placeRoot(500, 940);
    const r = renderReader();
    expect(size(r.primary())).toBe(35);
  });
});
