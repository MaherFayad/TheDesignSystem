// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { clipboardAccess, isMenuKey, isTextEntry, pageActions, pageOf, rangeRect, selectionBox, selectionSide, type RangeLike } from './selection';

function fakeRange(box: { x: number; y: number; width: number; height: number }, rects: { x: number; y: number; width: number; height: number }[] = [], node: Node = document.body): RangeLike {
  return { collapsed: box.width === 0, startContainer: node, getBoundingClientRect: () => box, getClientRects: () => rects };
}

describe('rangeRect', () => {
  it('returns the box around every line of the range', () => {
    expect(rangeRect(fakeRange({ x: 10, y: 20, width: 100, height: 40 }))).toEqual(selectionBox(10, 20, 100, 40));
  });

  it('uses the first line rect of a caret with no box', () => {
    expect(rangeRect(fakeRange({ x: 0, y: 0, width: 0, height: 0 }, [{ x: 30, y: 50, width: 0, height: 18 }]))).toEqual(selectionBox(30, 50, 0, 18));
  });

  it('falls back to the element that holds the caret', () => {
    const el = document.createElement('p');
    el.getBoundingClientRect = () => ({ x: 5, y: 6, width: 70, height: 20, top: 6, left: 5, right: 75, bottom: 26, toJSON: () => ({}) }) as DOMRect;
    const text = document.createTextNode('x');
    el.append(text);
    expect(rangeRect(fakeRange({ x: 0, y: 0, width: 0, height: 0 }, [], text))).toEqual(selectionBox(5, 6, 70, 20));
  });
});

describe('selectionSide', () => {
  const base = { menuHeight: 44, viewportBottom: 800, gap: 8, padding: 8 };

  it('opens above when there is room above', () => {
    expect(selectionSide({ ...base, anchor: { top: 200, bottom: 220 } })).toBe('top');
  });

  it('flips below when there is no room above', () => {
    expect(selectionSide({ ...base, anchor: { top: 40, bottom: 60 } })).toBe('bottom');
  });

  it('takes the side with more room when neither fits', () => {
    expect(selectionSide({ ...base, viewportBottom: 100, anchor: { top: 50, bottom: 80 } })).toBe('top');
    expect(selectionSide({ ...base, viewportBottom: 100, anchor: { top: 10, bottom: 40 } })).toBe('bottom');
  });

  it('counts a viewport that does not start at 0 (a keyboard or a toolbar above)', () => {
    expect(selectionSide({ ...base, viewportTop: 180, anchor: { top: 200, bottom: 220 } })).toBe('bottom');
  });
});

describe('pageActions', () => {
  it('keeps one page when everything fits', () => {
    expect(pageActions([50, 60, 70], 300, 44)).toEqual([[0, 1, 2]]);
  });

  it('splits into pages, leaving room for the forward and back controls', () => {
    // Room 200, more 40: the first page has 160, the middle pages 120, the last 160.
    expect(pageActions([60, 60, 60, 60, 60, 60], 200, 40)).toEqual([[0, 1], [2, 3], [4, 5]]);
  });

  it('puts the rest on the last page when it fits without a forward control', () => {
    expect(pageActions([90, 60, 90], 200, 40)).toEqual([[0, 1], [2]]);
    expect(pageActions([100, 70, 70, 20], 200, 40)).toEqual([[0], [1, 2, 3]]);
  });

  it('always puts one action on a page, even one wider than the room', () => {
    expect(pageActions([500, 20], 200, 40)).toEqual([[0], [1]]);
  });

  it('returns no page for no actions', () => {
    expect(pageActions([], 200, 40)).toEqual([]);
  });

  it('finds the page of an action', () => {
    const pages = [[0, 1], [2, 3]];
    expect(pageOf(pages, 3)).toBe(1);
    expect(pageOf(pages, 9)).toBe(0);
  });
});

describe('clipboardAccess', () => {
  it('reads write and read on their own', () => {
    expect(clipboardAccess({ isSecureContext: true, navigator: { clipboard: { writeText: () => undefined, readText: () => undefined } } })).toEqual({ write: true, read: true });
    expect(clipboardAccess({ isSecureContext: true, navigator: { clipboard: { writeText: () => undefined } } })).toEqual({ write: true, read: false });
  });

  it('allows nothing without a clipboard or outside a secure context', () => {
    expect(clipboardAccess({ isSecureContext: true, navigator: {} })).toEqual({ write: false, read: false });
    expect(clipboardAccess({ isSecureContext: false, navigator: { clipboard: { writeText: () => undefined, readText: () => undefined } } })).toEqual({ write: false, read: false });
    expect(clipboardAccess(undefined)).toEqual({ write: false, read: false });
  });
});

describe('isTextEntry', () => {
  it('is true inside a text input, a textarea and an editable region', () => {
    const input = document.createElement('input');
    const area = document.createElement('textarea');
    const edit = document.createElement('div');
    edit.setAttribute('contenteditable', 'true');
    const inner = document.createElement('span');
    edit.append(inner);
    expect(isTextEntry(input)).toBe(true);
    expect(isTextEntry(area)).toBe(true);
    expect(isTextEntry(inner)).toBe(true);
  });

  it('is false for read only text and a checkbox', () => {
    const p = document.createElement('p');
    p.append(document.createTextNode('hello'));
    const box = document.createElement('input');
    box.type = 'checkbox';
    expect(isTextEntry(p.firstChild)).toBe(false);
    expect(isTextEntry(box)).toBe(false);
    expect(isTextEntry(null)).toBe(false);
  });
});

describe('isMenuKey', () => {
  it('takes the context menu key and Shift+F10 only', () => {
    expect(isMenuKey({ key: 'ContextMenu', shiftKey: false })).toBe(true);
    expect(isMenuKey({ key: 'F10', shiftKey: true })).toBe(true);
    expect(isMenuKey({ key: 'F10', shiftKey: false })).toBe(false);
    expect(isMenuKey({ key: 'F10', shiftKey: true, ctrlKey: true })).toBe(false);
  });
});
