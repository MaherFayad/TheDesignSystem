// matchShortcut: true when a keydown event is the shortcut written as a
// string (`Mod+K`, `Ctrl+Shift+P`, `⌘K`), for the open shortcut of
// CommandPalette. Built on splitShortcut from @the-system/shared, which
// draws and speaks the same strings in Kbd.
//
// A letter or a digit also matches by its physical key (event.code), so
// Ctrl+K opens the palette on an Arabic keyboard layout, where the same key
// types a different letter.
import { isModifier, splitShortcut, type KeyboardPlatform } from '@the-system/shared';

type Modifier = 'ctrl' | 'meta' | 'alt' | 'shift';

const MODIFIERS: Readonly<Record<string, Modifier | 'mod'>> = {
  mod: 'mod',
  cmd: 'meta',
  command: 'meta',
  meta: 'meta',
  super: 'meta',
  win: 'meta',
  '⌘': 'meta',
  ctrl: 'ctrl',
  control: 'ctrl',
  '⌃': 'ctrl',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  '⌥': 'alt',
  shift: 'shift',
  '⇧': 'shift',
};

/** Written key names to KeyboardEvent.key values, lower case. */
const KEY_NAMES: Readonly<Record<string, string>> = {
  esc: 'escape',
  return: 'enter',
  space: ' ',
  plus: '+',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  '↑': 'arrowup',
  '↓': 'arrowdown',
  '←': 'arrowleft',
  '→': 'arrowright',
};

/** The parts of a keyboard event this needs, so tests can pass plain objects. */
export interface ShortcutEventLike {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

/** True when `event` presses exactly the modifiers and the key of `shortcut`. */
export function matchShortcut(event: ShortcutEventLike, shortcut: string, platform: KeyboardPlatform): boolean {
  const keys = splitShortcut(shortcut);
  const want = { ctrl: false, meta: false, alt: false, shift: false };
  let main: string | null = null;
  for (const key of keys) {
    if (isModifier(key)) {
      const id = MODIFIERS[key.trim().toLowerCase()];
      if (id === 'mod') want[platform === 'mac' ? 'meta' : 'ctrl'] = true;
      else if (id) want[id] = true;
    } else {
      main = key.trim().toLowerCase();
    }
  }
  if (main === null) return false;
  if (event.ctrlKey !== want.ctrl || event.metaKey !== want.meta || event.altKey !== want.alt) return false;
  const expected = KEY_NAMES[main] ?? main;
  // Shift changes the character of a symbol key (Shift+/ types ?), so a
  // symbol is matched on what it types and Shift is not compared for it.
  const symbol = expected.length === 1 && !/[a-z0-9]/.test(expected);
  if (!symbol && event.shiftKey !== want.shift) return false;
  if (event.key.toLowerCase() === expected) return true;
  if (expected.length === 1 && event.code) {
    if (/[a-z]/.test(expected)) return event.code === `Key${expected.toUpperCase()}`;
    if (/[0-9]/.test(expected)) return event.code === `Digit${expected}`;
  }
  return false;
}
