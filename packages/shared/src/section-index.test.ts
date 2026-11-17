import { describe, expect, it } from 'vitest';
import { collapseIndex, groupByInitial, indexAlphabet, indexEntries, initialKey, OTHER_KEY, slotKey, type IndexSlot } from './section-index';

describe('indexAlphabet', () => {
  it('lists A to Z then # for English', () => {
    const keys = indexAlphabet('en');
    expect(keys).toHaveLength(27);
    expect(keys[0]).toBe('A');
    expect(keys[25]).toBe('Z');
    expect(keys[26]).toBe(OTHER_KEY);
  });

  it('lists the 28 Arabic letters in alphabet order then # for Arabic tags', () => {
    for (const tag of ['ar', 'ar-SA', 'ar-u-nu-latn']) {
      const keys = indexAlphabet(tag);
      expect(keys).toHaveLength(29);
      expect(keys.slice(0, 4)).toEqual(['ا', 'ب', 'ت', 'ث']);
      expect(keys.slice(25, 28)).toEqual(['ه', 'و', 'ي']);
      expect(keys[28]).toBe(OTHER_KEY);
    }
  });
});

describe('initialKey', () => {
  it('upper cases Latin and drops marks', () => {
    expect(initialKey('sara', 'en')).toBe('S');
    expect(initialKey('  Émile', 'en')).toBe('E');
    expect(initialKey('Ødegaard', 'en')).toBe(OTHER_KEY);
  });

  it('files digits, symbols and other scripts under #', () => {
    expect(initialKey('7 Eleven', 'en')).toBe(OTHER_KEY);
    expect(initialKey('@home', 'en')).toBe(OTHER_KEY);
    expect(initialKey('سارة', 'en')).toBe(OTHER_KEY);
    expect(initialKey('Sara', 'ar')).toBe(OTHER_KEY);
    expect(initialKey('', 'en')).toBe(OTHER_KEY);
  });

  it('folds hamza forms to alef and keeps other Arabic letters', () => {
    expect(initialKey('أحمد', 'ar')).toBe('ا');
    expect(initialKey('إبراهيم', 'ar')).toBe('ا');
    expect(initialKey('آمنة', 'ar')).toBe('ا');
    expect(initialKey('ءالاء', 'ar')).toBe('ا');
    expect(initialKey('ؤي', 'ar')).toBe('و');
    expect(initialKey('سارة', 'ar')).toBe('س');
    expect(initialKey('يوسف', 'ar')).toBe('ي');
  });
});

describe('groupByInitial', () => {
  it('groups in alphabet order with # last, items sorted by the collator', () => {
    const names = ['omar', 'Sara', '3D studio', 'Amal', 'Émile', 'Sami', 'Abdullah'];
    const groups = groupByInitial(names, (n) => n, 'en');
    expect(groups.map((g) => g.key)).toEqual(['A', 'E', 'O', 'S', OTHER_KEY]);
    expect(groups[0]!.items).toEqual(['Abdullah', 'Amal']);
    expect(groups[3]!.items).toEqual(['Sami', 'Sara']);
  });

  it('groups Arabic names by letter in the Arabic order', () => {
    const names = ['يوسف', 'سارة', 'أحمد', 'بدر', 'إبراهيم', 'Nora'];
    const groups = groupByInitial(names, (n) => n, 'ar');
    expect(groups.map((g) => g.key)).toEqual(['ا', 'ب', 'س', 'ي', OTHER_KEY]);
    expect(groups[0]!.items).toHaveLength(2);
  });
});

describe('indexEntries', () => {
  it('sends a key with no section to the next section, and keys after the last to the last', () => {
    const entries = indexEntries(['A', 'B', 'C', 'D', '#'], ['B', 'C']);
    expect(entries).toEqual([
      { key: 'A', target: 'B' },
      { key: 'B', target: 'B' },
      { key: 'C', target: 'C' },
      { key: 'D', target: 'C' },
      { key: '#', target: 'C' },
    ]);
  });

  it('is empty when there is no section', () => {
    expect(indexEntries(['A', 'B'], [])).toEqual([]);
  });
});

describe('collapseIndex', () => {
  const keys = (slots: IndexSlot[]) => slots.filter((s) => s.type === 'key').map((s) => (s as { index: number }).index);

  it('keeps every key when they fit at 24px each', () => {
    expect(collapseIndex(27, 27 * 24)).toHaveLength(27);
    expect(collapseIndex(27, 700).every((s) => s.type === 'key')).toBe(true);
  });

  it('keeps every key before layout (height 0)', () => {
    expect(collapseIndex(27, 0)).toHaveLength(27);
  });

  it('collapses with gap dots so that no slot is under the minimum', () => {
    for (const height of [400, 360, 240, 120]) {
      const slots = collapseIndex(27, height);
      expect(slots.length * 24).toBeLessThanOrEqual(height);
      const kept = keys(slots);
      expect(kept[0]).toBe(0);
      expect(kept[kept.length - 1]).toBe(26);
      // Every key is either kept or hidden under exactly one gap.
      const covered = slots.flatMap((s) => (s.type === 'key' ? [s.index] : s.indexes)).sort((a, b) => a - b);
      expect(covered).toEqual(Array.from({ length: 27 }, (_, i) => i));
    }
  });

  it('alternates keys and gaps', () => {
    const slots = collapseIndex(29, 300);
    slots.forEach((s, i) => expect(s.type).toBe(i % 2 === 0 ? 'key' : 'gap'));
  });

  it('honours a larger minimum', () => {
    expect(collapseIndex(27, 27 * 24, 44).length * 44).toBeLessThanOrEqual(27 * 24);
  });
});

describe('slotKey', () => {
  it('returns a key slot as is and picks a hidden key along a gap', () => {
    expect(slotKey({ type: 'key', index: 4 }, 0.9)).toBe(4);
    const gap: IndexSlot = { type: 'gap', indexes: [5, 6, 7] };
    expect(slotKey(gap, 0)).toBe(5);
    expect(slotKey(gap, 0.5)).toBe(6);
    expect(slotKey(gap, 1)).toBe(7);
    expect(slotKey(gap, -3)).toBe(5);
  });
});
