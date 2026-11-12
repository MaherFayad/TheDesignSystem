// The logic of an option list, shared by ListBox and every component built on
// it (Combobox, Autocomplete, MultiSelect, TagField, CommandPalette), in
// React, Angular and React Native. No DOM.
//
//   nextEnabledIndex  the next option an arrow key lands on, skipping disabled ones
//   edgeEnabledIndex  the first or last enabled option (Home, End)
//   createTypeahead   the buffer of typed letters, cleared after a pause
//   typeaheadIndex    the option the buffer points at
//   selectValue       the selection after choosing one option, single or multiple
//   selectAllValues   every enabled value, for select all
import { normalize } from './filter';

/** single: one value, or none. multiple: any number of values. */
export type SelectionMode = 'single' | 'multiple';

/**
 * The next enabled index from `from` in steps of `step` (1 or -1). With
 * `loop`, it wraps past either end; without, it stays on `from` at the end
 * (or returns -1 when `from` is -1 and nothing is enabled). `from` -1 means
 * nothing is highlighted yet: step 1 lands on the first enabled option, step
 * -1 on the last.
 */
export function nextEnabledIndex(
  count: number,
  from: number,
  step: 1 | -1,
  isDisabled: (index: number) => boolean,
  loop = false,
): number {
  if (count <= 0) return -1;
  if (from < 0 || from >= count) return edgeEnabledIndex(count, step === 1 ? 'first' : 'last', isDisabled);
  let i = from;
  for (let n = 0; n < count; n += 1) {
    i += step;
    if (i < 0 || i >= count) {
      if (!loop) return isDisabled(from) ? edgeEnabledIndex(count, step === 1 ? 'last' : 'first', isDisabled) : from;
      i = i < 0 ? count - 1 : 0;
    }
    if (!isDisabled(i)) return i;
  }
  return isDisabled(from) ? -1 : from;
}

/** The first or the last enabled index, or -1 when every option is disabled. */
export function edgeEnabledIndex(count: number, edge: 'first' | 'last', isDisabled: (index: number) => boolean): number {
  if (edge === 'first') {
    for (let i = 0; i < count; i += 1) if (!isDisabled(i)) return i;
  } else {
    for (let i = count - 1; i >= 0; i -= 1) if (!isDisabled(i)) return i;
  }
  return -1;
}

/** A clock, so tests can move time by hand. */
export interface TypeaheadClock {
  now: () => number;
}

export interface Typeahead {
  /** Adds one typed character and returns the whole buffer. */
  push: (char: string) => string;
  /** Clears the buffer. */
  reset: () => void;
}

/**
 * The buffer of typed letters for typeahead. A pause longer than `timeout`
 * ms starts a new buffer. Default 500ms, the pause most platform lists use.
 */
export function createTypeahead(timeout = 500, clock: TypeaheadClock = { now: () => Date.now() }): Typeahead {
  let buffer = '';
  let last = -Infinity;
  return {
    push(char: string) {
      const now = clock.now();
      if (now - last > timeout) buffer = '';
      last = now;
      buffer += char;
      return buffer;
    },
    reset() {
      buffer = '';
      last = -Infinity;
    },
  };
}

/**
 * The option a typeahead buffer points at: the next enabled option after
 * `from` whose label starts with the buffer, compared in normalized form
 * (case, accents, Arabic diacritics and alef forms do not matter). A buffer
 * of one repeated letter ("bbb") cycles through the options that start with
 * that letter. Returns -1 when nothing matches.
 */
export function typeaheadIndex(
  labels: readonly string[],
  buffer: string,
  from: number,
  isDisabled: (index: number) => boolean,
): number {
  const raw = normalize(buffer);
  if (!raw || labels.length === 0) return -1;
  const chars = Array.from(raw);
  const repeated = chars.every((c) => c === chars[0]);
  const query = repeated ? (chars[0] ?? raw) : raw;
  // A longer buffer refines the current option, so the search includes it; one letter moves on.
  const start = repeated ? from + 1 : Math.max(from, 0);
  const count = labels.length;
  for (let n = 0; n < count; n += 1) {
    const i = (((start + n) % count) + count) % count;
    if (isDisabled(i)) continue;
    if (normalize(labels[i] ?? '').startsWith(query)) return i;
  }
  return -1;
}

/**
 * The selection after choosing `value`. single: that value alone; choosing
 * the selected value again keeps it, unless `allowEmpty`, which clears it.
 * multiple: toggles the value, keeping the order values were chosen in.
 */
export function selectValue(
  mode: SelectionMode,
  selected: readonly string[],
  value: string,
  allowEmpty = false,
): string[] {
  const has = selected.includes(value);
  if (mode === 'single') return has && allowEmpty ? [] : [value];
  return has ? selected.filter((v) => v !== value) : [...selected, value];
}

/**
 * Select all for a multiple list: every enabled value is added; when every
 * enabled value is already selected, they are all removed. Selected values
 * of disabled options are kept either way.
 */
export function selectAllValues(selected: readonly string[], values: readonly string[], isDisabled: (value: string) => boolean): string[] {
  const enabled = values.filter((v) => !isDisabled(v));
  const all = enabled.every((v) => selected.includes(v));
  if (all) return selected.filter((v) => !enabled.includes(v));
  return [...selected, ...enabled.filter((v) => !selected.includes(v))];
}
