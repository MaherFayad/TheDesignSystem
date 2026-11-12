import { describe, expect, it } from 'vitest';
import {
  createTypeahead,
  edgeEnabledIndex,
  nextEnabledIndex,
  selectAllValues,
  selectValue,
  typeaheadIndex,
} from './listbox';

const disabledAt =
  (...indexes: number[]) =>
  (i: number) =>
    indexes.includes(i);

describe('nextEnabledIndex', () => {
  it('moves by one and skips disabled options', () => {
    expect(nextEnabledIndex(5, 0, 1, disabledAt(1))).toBe(2);
    expect(nextEnabledIndex(5, 3, -1, disabledAt(2, 1))).toBe(0);
  });

  it('stays at the end without loop and wraps with loop', () => {
    expect(nextEnabledIndex(3, 2, 1, disabledAt())).toBe(2);
    expect(nextEnabledIndex(3, 2, 1, disabledAt(), true)).toBe(0);
    expect(nextEnabledIndex(3, 0, -1, disabledAt(2), true)).toBe(1);
  });

  it('starts at an edge when nothing is highlighted', () => {
    expect(nextEnabledIndex(4, -1, 1, disabledAt(0))).toBe(1);
    expect(nextEnabledIndex(4, -1, -1, disabledAt(3))).toBe(2);
  });

  it('returns -1 for an empty or fully disabled list', () => {
    expect(nextEnabledIndex(0, -1, 1, disabledAt())).toBe(-1);
    expect(nextEnabledIndex(2, -1, 1, disabledAt(0, 1))).toBe(-1);
  });
});

describe('edgeEnabledIndex', () => {
  it('finds the first and the last enabled option', () => {
    expect(edgeEnabledIndex(4, 'first', disabledAt(0))).toBe(1);
    expect(edgeEnabledIndex(4, 'last', disabledAt(3, 2))).toBe(1);
    expect(edgeEnabledIndex(2, 'last', disabledAt(0, 1))).toBe(-1);
  });
});

describe('createTypeahead', () => {
  it('builds a buffer and clears it after a pause', () => {
    let now = 0;
    const t = createTypeahead(500, { now: () => now });
    expect(t.push('i')).toBe('i');
    now = 200;
    expect(t.push('n')).toBe('in');
    now = 800;
    expect(t.push('s')).toBe('s');
    t.reset();
    expect(t.push('a')).toBe('a');
  });
});

describe('typeaheadIndex', () => {
  const labels = ['Inbox', 'Drafts', 'Sent', 'Spam', 'Starred', 'Snoozed'];
  const none = disabledAt();

  it('finds the next label that starts with the buffer', () => {
    expect(typeaheadIndex(labels, 'sp', 0, none)).toBe(3);
    expect(typeaheadIndex(labels, 'st', -1, none)).toBe(4);
  });

  it('cycles through labels with one repeated letter', () => {
    expect(typeaheadIndex(labels, 's', 2, none)).toBe(3);
    expect(typeaheadIndex(labels, 'ss', 3, none)).toBe(4);
    expect(typeaheadIndex(labels, 's', 5, none)).toBe(2);
  });

  it('keeps the current option while the buffer still matches it', () => {
    expect(typeaheadIndex(labels, 'sta', 4, none)).toBe(4);
  });

  it('skips disabled options and matches Arabic without the hamza', () => {
    expect(typeaheadIndex(labels, 'sp', 0, disabledAt(3))).toBe(-1);
    expect(typeaheadIndex(['الرياض', 'أبها'], 'ا', -1, none)).toBe(0);
    expect(typeaheadIndex(['الرياض', 'أبها'], 'اب', -1, none)).toBe(1);
  });
});

describe('selectValue', () => {
  it('replaces the value in single mode', () => {
    expect(selectValue('single', ['a'], 'b')).toEqual(['b']);
    expect(selectValue('single', ['a'], 'a')).toEqual(['a']);
    expect(selectValue('single', ['a'], 'a', true)).toEqual([]);
  });

  it('toggles in multiple mode, keeping the order of choice', () => {
    expect(selectValue('multiple', ['c', 'a'], 'b')).toEqual(['c', 'a', 'b']);
    expect(selectValue('multiple', ['c', 'a'], 'c')).toEqual(['a']);
  });
});

describe('selectAllValues', () => {
  const values = ['a', 'b', 'c', 'd'];
  const off = (v: string) => v === 'd';

  it('adds every enabled value', () => {
    expect(selectAllValues(['b'], values, off)).toEqual(['b', 'a', 'c']);
  });

  it('removes them when all are selected, keeping disabled ones', () => {
    expect(selectAllValues(['a', 'b', 'c', 'd'], values, off)).toEqual(['d']);
  });
});
