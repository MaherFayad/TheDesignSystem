// Tag text for TagField: split typed or pasted text into tags, trim them,
// and drop the ones already present. No DOM, no framework: React, Angular
// and React Native share it.
//
// Separators: the comma, the Arabic comma (U+060C) and a new line. Two tags
// are the same when their normalize() forms match (filter.ts): case, Latin
// accents, Arabic diacritics and the tatweel are ignored and the alef forms
// are unified, so "Design" and "design", or "أبها" and "ابها", are one tag.
import { normalize } from './filter';

/** The characters that end a tag: comma, Arabic comma, new line. */
export const TAG_SEPARATORS = [',', '،', '\n'] as const;

const SPLIT = /[,،\r\n]/;

/** True when the text holds a separator, so it should be split into tags. */
export function hasTagSeparator(text: string): boolean {
  return SPLIT.test(text);
}

/** The text split on the separators, each part trimmed, empty parts dropped. */
export function splitTags(text: string): string[] {
  return text
    .split(SPLIT)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 0);
}

/** The form two tags are compared in. */
export function tagKey(tag: string): string {
  return normalize(tag).trim();
}

export interface AddTagsResult {
  /** The tags after adding, in order: the existing ones, then the new ones. */
  tags: string[];
  /** The tags that were added. */
  added: string[];
  /** The incoming tags dropped as duplicates (of an existing tag or of each other). */
  duplicates: string[];
  /** The incoming tags dropped because max was reached. */
  overflow: string[];
}

/**
 * Adds the incoming tags (already split) to the existing ones: duplicates
 * (case and diacritic insensitive) are dropped, the first spelling wins, and
 * nothing is added past `max`.
 */
export function addTags(existing: readonly string[], incoming: readonly string[], max = Infinity): AddTagsResult {
  const seen = new Set(existing.map(tagKey));
  const tags = [...existing];
  const added: string[] = [];
  const duplicates: string[] = [];
  const overflow: string[] = [];
  for (const raw of incoming) {
    const tag = raw.replace(/\s+/g, ' ').trim();
    if (!tag) continue;
    const key = tagKey(tag);
    if (seen.has(key)) {
      duplicates.push(tag);
      continue;
    }
    if (tags.length >= max) {
      overflow.push(tag);
      continue;
    }
    seen.add(key);
    tags.push(tag);
    added.push(tag);
  }
  return { tags, added, duplicates, overflow };
}

/** True when `tag` is already in `tags`, case and diacritic insensitive. */
export function hasTag(tags: readonly string[], tag: string): boolean {
  const key = tagKey(tag);
  return tags.some((t) => tagKey(t) === key);
}
