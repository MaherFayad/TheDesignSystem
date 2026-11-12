import { describe, expect, it } from 'vitest';
import { activeHeading, buildTree, flattenTree, type TocHeading } from './toc';

const h = (id: string, level: number): TocHeading => ({ id, label: id, level });

describe('buildTree', () => {
  it('nests by level', () => {
    const tree = buildTree([h('a', 2), h('a1', 3), h('a2', 3), h('b', 2), h('b1', 3)]);
    expect(tree.map((n) => n.id)).toEqual(['a', 'b']);
    expect(tree[0]!.children.map((n) => n.id)).toEqual(['a1', 'a2']);
    expect(tree[1]!.children.map((n) => n.id)).toEqual(['b1']);
    expect(tree[0]!.level).toBe(1);
    expect(tree[0]!.children[0]!.level).toBe(2);
  });

  it('nests a skipped level one step down', () => {
    const tree = buildTree([h('a', 2), h('deep', 4), h('b', 3)]);
    expect(tree[0]!.children.map((n) => [n.id, n.level])).toEqual([
      ['deep', 2],
      ['b', 2],
    ]);
  });

  it('starts at the top level whatever the first heading is', () => {
    const tree = buildTree([h('x', 3), h('y', 2)]);
    expect(tree.map((n) => [n.id, n.level])).toEqual([
      ['x', 1],
      ['y', 1],
    ]);
  });

  it('handles no headings', () => {
    expect(buildTree([])).toEqual([]);
  });

  it('flattens back in document order with depth levels', () => {
    const flat = flattenTree(buildTree([h('a', 2), h('a1', 3), h('a1x', 4), h('b', 2)]));
    expect(flat.map((x) => [x.id, x.level])).toEqual([
      ['a', 1],
      ['a1', 2],
      ['a1x', 3],
      ['b', 1],
    ]);
  });
});

describe('activeHeading', () => {
  const rects = [
    { id: 'a', top: -400 },
    { id: 'b', top: -20 },
    { id: 'c', top: 300 },
  ];

  it('picks the last heading above the offset', () => {
    expect(activeHeading(rects)).toBe('b');
  });

  it('counts the offset of a sticky header', () => {
    expect(activeHeading(rects, 320)).toBe('c');
    expect(activeHeading([{ id: 'a', top: 64 }, { id: 'b', top: 500 }], 64)).toBe('a');
  });

  it('is the first heading before any has passed', () => {
    expect(activeHeading([{ id: 'a', top: 200 }, { id: 'b', top: 600 }])).toBe('a');
  });

  it('is the last heading at the end of the page', () => {
    expect(activeHeading(rects, 0, true)).toBe('c');
  });

  it('is null without headings', () => {
    expect(activeHeading([])).toBeNull();
  });
});
