/**
 * Section index helpers (order M9.2): the keys of an index column for a
 * locale, the key a name files under, grouping items by that key, the
 * section each key jumps to, and collapsing the keys to fit a height.
 * Pure, shared by every framework.
 */

/** The key for names that start with no letter of the alphabet: digits, symbols, other scripts. */
export const OTHER_KEY = '#';

/** The least height of one key in CSS px (WCAG 2.2 2.5.8). */
export const INDEX_KEY_MIN = 24;

const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** The 28 letters of the Arabic alphabet in their dictionary order. */
const ARABIC = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];

/** Letters that file under another letter once their marks are gone: hamza forms, alef maqsura, ta marbuta. */
const ARABIC_FOLD: Record<string, string> = { 'ء': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه' };

/** True for an Arabic locale tag (ar, ar-SA, ar-u-nu-latn). */
const isArabic = (locale: string) => /^ar(?:-|$)/i.test(locale);

/** The keys of the index for a locale, in alphabet order: A to Z then #, or the 28 Arabic letters then #. */
export function indexAlphabet(locale: string): string[] {
  return [...(isArabic(locale) ? ARABIC : LATIN), OTHER_KEY];
}

/**
 * The key a name files under: its first letter with marks removed (é is E,
 * أ is ا), upper case for Latin. A name that starts with anything outside
 * the locale's alphabet files under #.
 */
export function initialKey(text: string, locale: string): string {
  const first = Array.from(text.trim().normalize('NFD').replace(/\p{M}/gu, ''))[0] ?? '';
  if (isArabic(locale)) {
    const letter = ARABIC_FOLD[first] ?? first;
    return ARABIC.includes(letter) ? letter : OTHER_KEY;
  }
  const letter = first.toLocaleUpperCase('en');
  return LATIN.includes(letter) ? letter : OTHER_KEY;
}

/** Items that share a key, sorted by the locale's collation. */
export interface IndexGroup<T> {
  key: string;
  items: T[];
}

/**
 * Groups items by their initial key. Groups come in alphabet order (# last)
 * and only keys that have items appear. Items in a group are sorted with
 * Intl.Collator for the locale.
 */
export function groupByInitial<T>(items: readonly T[], text: (item: T) => string, locale: string): IndexGroup<T>[] {
  const alphabet = indexAlphabet(locale);
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = initialKey(text(item), locale);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return alphabet
    .filter((key) => groups.has(key))
    .map((key) => ({ key, items: groups.get(key)!.slice().sort((a, b) => collator.compare(text(a), text(b))) }));
}

/** One key of the column and the section key it jumps to. */
export interface IndexEntry {
  key: string;
  /** The key of the section a press on this key goes to. Equal to `key` when that section exists. */
  target: string;
}

/**
 * Every key of the alphabet with the section it jumps to: its own section
 * when there is one, else the next section after it, else the last section.
 * Empty when there are no sections.
 */
export function indexEntries(alphabet: readonly string[], present: readonly string[]): IndexEntry[] {
  const have = new Set(present);
  const order = alphabet.filter((key) => have.has(key));
  if (order.length === 0) return [];
  return alphabet.map((key, i) => {
    if (have.has(key)) return { key, target: key };
    const next = alphabet.slice(i + 1).find((k) => have.has(k));
    return { key, target: next ?? order[order.length - 1]! };
  });
}

/** One slot of a collapsed column: a key, or a gap dot that stands for the keys it hides. */
export type IndexSlot = { type: 'key'; index: number } | { type: 'gap'; indexes: number[] };

/**
 * Fits `count` keys into a column `height` px tall where each slot is at
 * least `min` px. When every key fits, each gets a slot. When not, keys are
 * kept evenly from first to last with a gap dot between two kept keys that
 * hide others, so no key shrinks under the minimum. Slots are indexes into
 * the key list. A height of zero or less (not laid out yet) keeps every key.
 */
export function collapseIndex(count: number, height: number, min = INDEX_KEY_MIN): IndexSlot[] {
  const all = (): IndexSlot[] => Array.from({ length: count }, (_, index) => ({ type: 'key', index }));
  if (count <= 0) return [];
  const fit = Math.floor(height / Math.max(1, min));
  if (height <= 0 || fit >= count) return all();
  // Kept keys and the gaps between them alternate, so an odd slot count holds (fit + 1) / 2 keys.
  const kept = Math.max(2, Math.min(count, Math.floor((Math.max(fit, 3) + 1) / 2)));
  const picks = Array.from({ length: kept }, (_, i) => Math.round((i * (count - 1)) / (kept - 1)));
  const slots: IndexSlot[] = [];
  picks.forEach((index, i) => {
    if (i > 0) {
      const before = picks[i - 1]!;
      const hidden = Array.from({ length: index - before - 1 }, (_, k) => before + 1 + k);
      if (hidden.length > 0) slots.push({ type: 'gap', indexes: hidden });
    }
    slots.push({ type: 'key', index });
  });
  return slots;
}

/**
 * The key index under a pointer along a collapsed column. `slot` is the
 * slot the pointer is over and `fraction` how far along it (0 at its block
 * start, 1 at its end): over a gap dot, the hidden key at that point.
 */
export function slotKey(slot: IndexSlot, fraction: number): number {
  if (slot.type === 'key') return slot.index;
  const f = Math.min(Math.max(fraction, 0), 0.999);
  return slot.indexes[Math.floor(f * slot.indexes.length)]!;
}
