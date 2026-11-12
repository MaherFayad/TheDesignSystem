// Text filtering for the list family: ListBox, Combobox, Autocomplete,
// MultiSelect, TagField and CommandPalette. No DOM, no framework: React,
// Angular and React Native share it.
//
// normalize() folds a string to the form two strings are compared in:
//   - lower case, and Latin accents dropped (é to e), by NFD then dropping
//     combining marks;
//   - Arabic diacritics (harakat, tanween, shadda, sukun, the superscript
//     alef and the Quranic marks) and the tatweel dropped;
//   - every alef form (آ أ إ ٱ) to the bare alef ا, alef maqsura ى to ya ي,
//     ta marbuta ة to ha ه, and the hamza seats ؤ ئ to و ي, so a person who
//     types without the hamza still finds the word;
//   - Arabic Indic and Persian digits to Western digits;
//   - runs of white space to one space.
//
// Each character of the source maps to zero or more characters of the
// folded form, so a match in the folded form maps back to a range in the
// source (matchRanges), and the matched part of an option can be marked even
// when the source carries diacritics the query does not.

/** A matched range in the source text: [start, end) in UTF-16 code units. */
export interface MatchRange {
  start: number;
  end: number;
}

/** A folded string and, for each of its code units, the source range it came from. */
export interface Folded {
  text: string;
  /** For folded code unit i: the start of its source character. */
  from: number[];
  /** For folded code unit i: the end of its source character. */
  to: number[];
}

/** Arabic diacritics, Quranic marks and the tatweel: dropped. */
const ARABIC_DROP = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/;
/** Combining marks left by NFD on Latin, Greek and Cyrillic letters: dropped. */
const COMBINING = /\p{M}/u;
const WHITE = /\s/;

const ARABIC_MAP: Readonly<Record<string, string>> = {
  'آ': 'ا',
  'أ': 'ا',
  'إ': 'ا',
  'ٱ': 'ا',
  'ى': 'ي',
  'ة': 'ه',
  'ؤ': 'و',
  'ئ': 'ي',
};

/** One source character (a full code point) folded. May be empty. */
function foldChar(ch: string): string {
  if (ARABIC_DROP.test(ch)) return '';
  const mapped = ARABIC_MAP[ch];
  if (mapped !== undefined) return mapped;
  const code = ch.codePointAt(0) ?? 0;
  // Arabic Indic digits U+0660 to U+0669, Persian digits U+06F0 to U+06F9.
  if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
  if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
  if (code < 0x80) return ch.toLowerCase();
  let out = '';
  for (const part of ch.normalize('NFD')) if (!COMBINING.test(part)) out += part;
  return out.toLowerCase();
}

/** Folds `source` and keeps, for each folded code unit, where it came from. */
export function fold(source: string): Folded {
  let text = '';
  const from: number[] = [];
  const to: number[] = [];
  let i = 0;
  let lastWasSpace = true;
  for (const ch of source) {
    const start = i;
    i += ch.length;
    if (WHITE.test(ch)) {
      if (!lastWasSpace) {
        text += ' ';
        from.push(start);
        to.push(i);
        lastWasSpace = true;
      }
      continue;
    }
    const f = foldChar(ch);
    for (let k = 0; k < f.length; k += 1) {
      from.push(start);
      to.push(i);
    }
    text += f;
    if (f.length > 0) lastWasSpace = false;
  }
  // No trailing space: a query of "inbox " still matches "Inbox".
  if (text.endsWith(' ')) {
    text = text.slice(0, -1);
    from.pop();
    to.pop();
  }
  return { text, from, to };
}

/**
 * The form two strings are compared in: lower case, no Latin accents, no
 * Arabic diacritics or tatweel, one alef, Western digits, single spaces,
 * trimmed.
 */
export function normalize(source: string): string {
  return fold(source).text;
}

/** True when the folded character before `index` is a word boundary (or there is none). */
function atWordStart(text: string, index: number): boolean {
  if (index === 0) return true;
  const before = text[index - 1] ?? ' ';
  return !/[\p{L}\p{N}]/u.test(before);
}

/**
 * The ranges of `source` that match `query`, for marking the matched part of
 * an option. The first match at a word start wins, else the first match
 * anywhere. Empty when the query is empty or does not match.
 */
export function matchRanges(source: string, query: string): MatchRange[] {
  const q = normalize(query);
  if (!q) return [];
  const f = fold(source);
  let at = -1;
  for (let i = f.text.indexOf(q); i !== -1; i = f.text.indexOf(q, i + 1)) {
    if (atWordStart(f.text, i)) {
      at = i;
      break;
    }
    if (at === -1) at = i;
  }
  if (at === -1) return [];
  const start = f.from[at] ?? 0;
  let end = f.to[at + q.length - 1] ?? source.length;
  // Marks after the last matched letter fold to nothing: keep them inside the range, so a mark never splits a letter from its harakat.
  for (const ch of source.slice(end)) {
    if (WHITE.test(ch) || foldChar(ch) !== '') break;
    end += ch.length;
  }
  return [{ start, end }];
}

/** How well a folded text matches a folded query: 0 prefix, 1 word start, 2 anywhere, -1 none. */
export function matchRank(text: string, query: string): number {
  if (!query) return 0;
  const first = text.indexOf(query);
  if (first === -1) return -1;
  if (first === 0) return 0;
  for (let i = first; i !== -1; i = text.indexOf(query, i + 1)) if (atWordStart(text, i)) return 1;
  return 2;
}

/** Texts an item is searched by: its label first, then any keywords. */
export type FilterText<T> = (item: T) => string | readonly string[];

/**
 * The items that match `query`, best first: a match at the start of the
 * text, then at the start of a word, then anywhere. Items of the same rank
 * keep their order. A label match ranks before a keyword match of the same
 * kind. An empty query returns every item in order.
 *
 * Linear in the number of items; 1000 options take well under a frame.
 */
export function filterItems<T>(items: readonly T[], query: string, text: FilterText<T>): T[] {
  const q = normalize(query);
  if (!q) return items.slice();
  const buckets: T[][] = [[], [], [], [], [], []];
  for (const item of items) {
    const t = text(item);
    const texts = typeof t === 'string' ? [t] : t;
    let best = -1;
    for (let k = 0; k < texts.length; k += 1) {
      const rank = matchRank(normalize(texts[k] ?? ''), q);
      if (rank === -1) continue;
      // Keywords rank after the label at the same kind of match.
      const score = rank * 2 + (k === 0 ? 0 : 1);
      if (best === -1 || score < best) best = score;
    }
    if (best !== -1) buckets[best]?.push(item);
  }
  return buckets.flat();
}
