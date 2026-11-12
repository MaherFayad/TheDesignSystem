import { describe, expect, it } from 'vitest';
import { filterItems, fold, matchRank, matchRanges, normalize } from './filter';

describe('normalize', () => {
  it('lower cases and drops Latin accents', () => {
    expect(normalize('Café Crème')).toBe('cafe creme');
    expect(normalize('ÅNGSTRÖM')).toBe('angstrom');
  });

  it('drops Arabic diacritics and the tatweel', () => {
    expect(normalize('مُحَمَّد')).toBe('محمد');
    expect(normalize('جـــدة')).toBe('جده');
  });

  it('unifies alef forms, alef maqsura, ta marbuta and the hamza seats', () => {
    expect(normalize('أحمد')).toBe(normalize('احمد'));
    expect(normalize('إسلام')).toBe('اسلام');
    expect(normalize('آمنة')).toBe('امنه');
    expect(normalize('مستشفى')).toBe('مستشفي');
    expect(normalize('مؤتمر')).toBe('موتمر');
    expect(normalize('رئيس')).toBe('رييس');
  });

  it('turns Arabic Indic and Persian digits into Western digits', () => {
    expect(normalize('٢٠٢٦')).toBe('2026');
    expect(normalize('۱۲')).toBe('12');
  });

  it('collapses white space and trims', () => {
    expect(normalize('  all   mail ')).toBe('all mail');
  });
});

describe('fold', () => {
  it('maps every folded code unit back to its source character', () => {
    const f = fold('مُدير');
    expect(f.text).toBe('مدير');
    expect(f.from).toEqual([0, 2, 3, 4]);
    expect(f.to).toEqual([1, 3, 4, 5]);
  });
});

describe('matchRanges', () => {
  it('returns the source range of a match', () => {
    expect(matchRanges('All mail', 'mail')).toEqual([{ start: 4, end: 8 }]);
  });

  it('spans the diacritics of the source when the query has none', () => {
    const source = 'مُحَمَّد';
    const [r] = matchRanges(source, 'محمد');
    expect(r).toEqual({ start: 0, end: source.length });
  });

  it('keeps the marks after the last matched letter inside the range', () => {
    const word = 'كِتَابٌ';
    expect(matchRanges(word, 'كتاب')).toEqual([{ start: 0, end: word.length }]);
    expect(matchRanges('مُحَمَّد', 'مح')).toEqual([{ start: 0, end: 4 }]);
    expect(matchRanges('cafe\u0301 bar', 'cafe')).toEqual([{ start: 0, end: 5 }]);
  });

  it('matches across alef forms', () => {
    expect(matchRanges('الإمارات', 'الامارات')).toEqual([{ start: 0, end: 8 }]);
  });

  it('prefers a match at a word start over an earlier one inside a word', () => {
    expect(matchRanges('Pinned inbox', 'in')).toEqual([{ start: 7, end: 9 }]);
  });

  it('is empty for an empty or unmatched query', () => {
    expect(matchRanges('Inbox', '')).toEqual([]);
    expect(matchRanges('Inbox', 'zz')).toEqual([]);
  });
});

describe('matchRank', () => {
  it('ranks prefix, word start, anywhere and none', () => {
    expect(matchRank('inbox', 'in')).toBe(0);
    expect(matchRank('all mail', 'ma')).toBe(1);
    expect(matchRank('drafts', 'af')).toBe(2);
    expect(matchRank('drafts', 'zz')).toBe(-1);
  });
});

describe('filterItems', () => {
  const items = ['Spam', 'Sent', 'Inbox', 'Pinned inbox', 'Scheduled', 'Snoozed'];
  const text = (s: string) => s;

  it('returns every item in order for an empty query', () => {
    expect(filterItems(items, '  ', text)).toEqual(items);
  });

  it('ranks prefix matches first, then word starts, then the rest, keeping order inside a rank', () => {
    expect(filterItems(['Pinned inbox', 'Spinner', 'Inbox'], 'in', text)).toEqual(['Inbox', 'Pinned inbox', 'Spinner']);
    expect(filterItems(items, 's', text)).toEqual(['Spam', 'Sent', 'Scheduled', 'Snoozed']);
  });

  it('searches keywords after the label', () => {
    const rows = [
      { label: 'Riyadh', keywords: ['RUH'] },
      { label: 'Ruhr valley', keywords: [] },
    ];
    const out = filterItems(rows, 'ruh', (r) => [r.label, ...r.keywords]);
    expect(out.map((r) => r.label)).toEqual(['Ruhr valley', 'Riyadh']);
  });

  it('matches Arabic without diacritics and across alef forms', () => {
    const cities = ['الرياض', 'أبها', 'جدة', 'الأحساء'];
    expect(filterItems(cities, 'ابها', text)).toEqual(['أبها']);
    expect(filterItems(cities, 'الاحساء', text)).toEqual(['الأحساء']);
    expect(filterItems(cities, 'جده', text)).toEqual(['جدة']);
  });

  it('filters 1000 options in under 16ms', () => {
    const many = Array.from({ length: 1000 }, (_, i) => ({ label: `Option ${i} ${i % 7 === 0 ? 'الرياض' : 'Jeddah'}` }));
    const get = (o: { label: string }) => o.label;
    filterItems(many, 'warm', get);
    // The best of five runs, so a busy machine does not fail the budget.
    let ms = Infinity;
    let out: { label: string }[] = [];
    for (let run = 0; run < 5; run += 1) {
      const t0 = performance.now();
      out = filterItems(many, 'رياض', get);
      ms = Math.min(ms, performance.now() - t0);
    }
    expect(out.length).toBe(143);
    expect(ms).toBeLessThan(16);
  });
});
