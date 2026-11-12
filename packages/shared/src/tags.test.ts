import { describe, expect, it } from 'vitest';
import { addTags, hasTag, hasTagSeparator, splitTags, tagKey } from './tags';

describe('splitTags', () => {
  it('splits on comma, Arabic comma and new line, trims and drops empty parts', () => {
    expect(splitTags(' design, research ،بحث\ncopy\r\n,, ')).toEqual(['design', 'research', 'بحث', 'copy']);
  });

  it('keeps inner spaces as one space', () => {
    expect(splitTags('legal   review')).toEqual(['legal review']);
  });

  it('knows when text holds a separator', () => {
    expect(hasTagSeparator('a')).toBe(false);
    expect(hasTagSeparator('a,')).toBe(true);
    expect(hasTagSeparator('أ،')).toBe(true);
    expect(hasTagSeparator('a\nb')).toBe(true);
  });
});

describe('addTags', () => {
  it('adds new tags in order and drops duplicates, case insensitive', () => {
    const r = addTags(['Design'], ['design', 'Research', 'research', 'Copy']);
    expect(r.tags).toEqual(['Design', 'Research', 'Copy']);
    expect(r.added).toEqual(['Research', 'Copy']);
    expect(r.duplicates).toEqual(['design', 'research']);
  });

  it('is diacritic and alef form insensitive in Arabic', () => {
    expect(tagKey('تَصْمِيم')).toBe(tagKey('تصميم'));
    const r = addTags(['أبها'], ['ابها', 'إبها', 'تصميـم', 'تصميم']);
    expect(r.tags).toEqual(['أبها', 'تصميـم']);
    expect(hasTag(['Café'], 'cafe')).toBe(true);
  });

  it('stops at max and reports the overflow', () => {
    const r = addTags(['a'], ['b', 'c', 'd'], 2);
    expect(r.tags).toEqual(['a', 'b']);
    expect(r.overflow).toEqual(['c', 'd']);
  });

  it('ignores blank incoming tags', () => {
    expect(addTags([], ['  ', '', 'x']).tags).toEqual(['x']);
  });
});
