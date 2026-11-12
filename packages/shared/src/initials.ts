/**
 * Initials and a stable tone for a person or a workspace name, for the
 * Avatar fallback. Pure, no DOM, shared by every framework.
 *
 * Latin names: the first letter of the first word and of the last word, in
 * upper case ("Maher Fayad" gives "MF", "Ada" gives "A").
 *
 * Arabic names: the same rule, with diacritics and the tatweel removed, and
 * the definite article "ال" skipped at the start of the last word, so
 * "عبدالله الحربي" gives "عح", not "عا". The two letters are joined with a zero
 * width non joiner, so they render as two separate letters and not as one
 * joined word.
 *
 * Words with no letter in them (digits, emoji, punctuation) are skipped. A
 * name with no letters gives an empty string; the Avatar then shows its icon.
 */

/** Arabic diacritics (harakat, shadda, sukun, superscript alef) and the tatweel. */
const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const ARABIC_LETTER = /[ء-يٮ-ۓۺ-ۿ]/;
const LETTER = /\p{L}/u;
/** Zero width non joiner: keeps two Arabic initials from joining. */
const ZWNJ = '‌';

/** Removes Arabic diacritics and the tatweel, and trims. */
export function stripDiacritics(name: string): string {
  return name.replace(ARABIC_MARKS, '').normalize('NFC').trim();
}

/** The words of a name that hold at least one letter. "عبد" joins the word after it: "عبد الله" is one name. */
function letterWords(name: string): string[] {
  const words = stripDiacritics(name)
    .split(/[\s_.\-@]+/u)
    .filter((word) => LETTER.test(word));
  const joined: string[] = [];
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i]!;
    const next = words[i + 1];
    if (word === 'عبد' && next !== undefined) {
      joined.push(`${word}${next}`);
      i += 1;
    } else {
      joined.push(word);
    }
  }
  return joined;
}

/** The first letter of a word, skipping leading digits and punctuation. */
function firstLetter(word: string): string {
  for (const char of Array.from(word)) {
    if (LETTER.test(char)) return char;
  }
  return '';
}

/** The first letter of a family name: an Arabic article "ال" is skipped when a stem of two or more letters follows. */
function familyLetter(word: string): string {
  if (word.startsWith('ال') && Array.from(word).length > 3) {
    return firstLetter(word.slice(2));
  }
  return firstLetter(word);
}

/**
 * One or two initials for a name. Latin letters are upper case. Arabic
 * initials are separated by a zero width non joiner.
 */
export function initials(name: string): string {
  const words = letterWords(name);
  if (words.length === 0) return '';
  const first = firstLetter(words[0]!);
  // A single word that starts with the article is a family name: "الحربي" gives "ح".
  if (words.length === 1) return familyLetter(words[0]!).toLocaleUpperCase('en');
  const last = familyLetter(words[words.length - 1]!);
  const arabic = ARABIC_LETTER.test(first) || ARABIC_LETTER.test(last);
  const pair = `${first}${last}`.toLocaleUpperCase('en');
  return arabic ? `${first.toLocaleUpperCase('en')}${ZWNJ}${last.toLocaleUpperCase('en')}` : pair;
}

/** How many accent hues the tone index chooses from: color.accent.1 to color.accent.10. */
export const avatarToneCount = 10;

/**
 * A stable index from 1 to `count` for a name, so one person always gets the
 * same fallback color. Case, spacing, diacritics and the hamza on alef do
 * not change it.
 */
export function toneIndex(name: string, count: number = avatarToneCount): number {
  // Hamza forms of alef fold to the bare alef: "أحمد" and "احمد" are one name.
  const key = stripDiacritics(name)
    .replace(/[أإآ]/g, 'ا')
    .toLocaleLowerCase('en')
    .replace(/\s+/g, ' ');
  // FNV-1a, 32 bit.
  let hash = 0x811c9dc5;
  for (const char of key) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash % Math.max(1, Math.floor(count))) + 1;
}
