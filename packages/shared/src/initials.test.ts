import { describe, expect, it } from 'vitest';
import { avatarToneCount, initials, stripDiacritics, toneIndex } from './initials';

const ZWNJ = '‌';

describe('initials', () => {
  it('takes the first letters of the first and last Latin words, upper case', () => {
    expect(initials('Maher Fayad')).toBe('MF');
    expect(initials('ada lovelace byron king')).toBe('AK');
    expect(initials('  Ada  ')).toBe('A');
  });

  it('skips words without letters and leading punctuation', () => {
    expect(initials('Sara 2nd')).toBe('SN');
    expect(initials('(Omar) 42')).toBe('O');
    expect(initials('123 !!')).toBe('');
    expect(initials('')).toBe('');
  });

  it('splits on dots, dashes, underscores and the at sign', () => {
    expect(initials('jean-luc')).toBe('JL');
    expect(initials('design_team')).toBe('DT');
  });

  it('takes Arabic initials without diacritics, separated by a non joiner', () => {
    expect(initials('مَاهِر فَيَّاض')).toBe(`م${ZWNJ}ف`);
    expect(initials('سارة')).toBe('س');
  });

  it('skips the article al at the start of an Arabic last name', () => {
    expect(initials('عبدالله الحربي')).toBe(`ع${ZWNJ}ح`);
    // A short word that starts with al is kept as is.
    expect(initials('نورة الم')).toBe(`ن${ZWNJ}ا`);
  });

  it('skips the article on a single word, and keeps abd with the word after it', () => {
    expect(initials('الحربي')).toBe('ح');
    expect(initials('عبد الله')).toBe('ع');
    expect(initials('محمد عبد الله')).toBe(`م${ZWNJ}ع`);
  });

  it('upper cases a Latin letter in a mixed name', () => {
    expect(initials('maher فياض')).toBe(`M${ZWNJ}ف`);
  });

  it('removes the tatweel', () => {
    expect(stripDiacritics('مـــحمد')).toBe('محمد');
  });
});

describe('toneIndex', () => {
  it('is stable and in range', () => {
    const a = toneIndex('Maher Fayad');
    expect(toneIndex('Maher Fayad')).toBe(a);
    expect(a).toBeGreaterThanOrEqual(1);
    expect(a).toBeLessThanOrEqual(avatarToneCount);
  });

  it('ignores case, spacing and diacritics', () => {
    expect(toneIndex('maher   FAYAD')).toBe(toneIndex('Maher Fayad'));
    expect(toneIndex('مَاهِر')).toBe(toneIndex('ماهر'));
    expect(toneIndex('أحمد')).toBe(toneIndex('احمد'));
  });

  it('spreads names over the hues', () => {
    const names = ['Ada', 'Grace', 'Linus', 'Omar', 'Sara', 'Noura', 'Fahad', 'Lina', 'Yousef', 'Reem', 'Huda', 'Tariq'];
    const seen = new Set(names.map((name) => toneIndex(name)));
    expect(seen.size).toBeGreaterThan(4);
  });

  it('takes a custom count', () => {
    for (const name of ['a', 'b', 'c', 'd']) {
      expect(toneIndex(name, 3)).toBeLessThanOrEqual(3);
    }
    expect(toneIndex('a', 0)).toBe(1);
  });
});
