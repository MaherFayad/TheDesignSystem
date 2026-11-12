/**
 * Keyboard shortcuts as data: split a shortcut string into keys, map `Mod`
 * to Command on a Mac and to Control elsewhere, and give each key a name a
 * screen reader can speak. Used by Kbd, and by Tooltip and DropdownMenu when
 * they show a shortcut.
 *
 * Ported from Figma-Killer-2 `Kbd/splitShortcut.ts`, widened: `+` separators,
 * the Mac symbols, a `Mod` key, a literal plus key and spoken names.
 *
 * Pure. The platform is passed in: nothing here reads `navigator`. Call
 * `keyboardPlatformFrom(navigator.userAgent)` in an effect or a store when
 * the platform is not known.
 *
 *   splitShortcut('Mod+Shift+P')            ['Mod', 'Shift', 'P']
 *   splitShortcut('⌘⇧P')                    ['⌘', '⇧', 'P']
 *   shortcutKeys('Mod+K', 'mac')            [{ label: '⌘', spoken: 'Command', ... }, { label: 'K', ... }]
 *   spokenShortcut('Mod+K', 'other')        'Control K'
 */

/** Which keyboard convention to draw: Mac symbols (`⌘K`) or names joined by plus (`Ctrl+K`). */
export type KeyboardPlatform = 'mac' | 'other';

/** One key of a shortcut, ready to draw and to speak. */
export interface ShortcutKey {
  /** What the keycap shows: `⌘`, `Ctrl`, `K`, `Enter`. */
  label: string;
  /** What a screen reader says: `Command`, `Control`, `K`, `Enter`. */
  spoken: string;
  /** True for Command, Control, Option or Alt, and Shift. */
  modifier: boolean;
}

/** The Mac modifier symbols. A string of them splits without a separator: `⌘⇧P`. */
const MAC_SYMBOLS = '⌘⌥⌃⇧';

type ModifierId = 'mod' | 'meta' | 'ctrl' | 'alt' | 'shift';

/** Names and symbols that mean a modifier, lower case. */
const MODIFIER_ALIASES: Readonly<Record<string, ModifierId>> = {
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

/** How each modifier is drawn and spoken on each platform. */
const MODIFIERS: Readonly<Record<Exclude<ModifierId, 'mod'>, Record<KeyboardPlatform, { label: string; spoken: string }>>> = {
  meta: { mac: { label: '⌘', spoken: 'Command' }, other: { label: 'Win', spoken: 'Windows' } },
  ctrl: { mac: { label: '⌃', spoken: 'Control' }, other: { label: 'Ctrl', spoken: 'Control' } },
  alt: { mac: { label: '⌥', spoken: 'Option' }, other: { label: 'Alt', spoken: 'Alt' } },
  shift: { mac: { label: '⇧', spoken: 'Shift' }, other: { label: 'Shift', spoken: 'Shift' } },
};

/** Other keys whose label and spoken name differ, keyed by lower case input. */
const NAMED_KEYS: Readonly<Record<string, { label: string; spoken: string }>> = {
  enter: { label: 'Enter', spoken: 'Enter' },
  return: { label: 'Enter', spoken: 'Enter' },
  '⏎': { label: 'Enter', spoken: 'Enter' },
  '↵': { label: 'Enter', spoken: 'Enter' },
  esc: { label: 'Esc', spoken: 'Escape' },
  escape: { label: 'Esc', spoken: 'Escape' },
  '⎋': { label: 'Esc', spoken: 'Escape' },
  tab: { label: 'Tab', spoken: 'Tab' },
  '⇥': { label: 'Tab', spoken: 'Tab' },
  space: { label: 'Space', spoken: 'Space' },
  backspace: { label: 'Backspace', spoken: 'Backspace' },
  '⌫': { label: 'Backspace', spoken: 'Backspace' },
  delete: { label: 'Delete', spoken: 'Delete' },
  del: { label: 'Delete', spoken: 'Delete' },
  '⌦': { label: 'Delete', spoken: 'Delete' },
  up: { label: '↑', spoken: 'Up arrow' },
  arrowup: { label: '↑', spoken: 'Up arrow' },
  '↑': { label: '↑', spoken: 'Up arrow' },
  down: { label: '↓', spoken: 'Down arrow' },
  arrowdown: { label: '↓', spoken: 'Down arrow' },
  '↓': { label: '↓', spoken: 'Down arrow' },
  left: { label: '←', spoken: 'Left arrow' },
  arrowleft: { label: '←', spoken: 'Left arrow' },
  '←': { label: '←', spoken: 'Left arrow' },
  right: { label: '→', spoken: 'Right arrow' },
  arrowright: { label: '→', spoken: 'Right arrow' },
  '→': { label: '→', spoken: 'Right arrow' },
  pageup: { label: 'PgUp', spoken: 'Page up' },
  pagedown: { label: 'PgDn', spoken: 'Page down' },
  home: { label: 'Home', spoken: 'Home' },
  end: { label: 'End', spoken: 'End' },
  '+': { label: '+', spoken: 'Plus' },
  plus: { label: '+', spoken: 'Plus' },
  '-': { label: '-', spoken: 'Minus' },
  '/': { label: '/', spoken: 'Slash' },
  '?': { label: '?', spoken: 'Question mark' },
  ',': { label: ',', spoken: 'Comma' },
  '.': { label: '.', spoken: 'Period' },
};

/**
 * Splits a shortcut string into its keys, as written. Separators are `+`
 * (with or without spaces) and the boundary after a Mac symbol. A plus key is
 * written `Ctrl++` or `Ctrl+Plus`. A single key comes back as one item.
 */
export function splitShortcut(shortcut: string): string[] {
  const out: string[] = [];
  const text = shortcut.trim();
  let current = '';
  // True right after a key ended without a separator (a Mac symbol), so a
  // plus that follows is the separator ("⌘+K"), not the plus key.
  let afterKey = false;
  // True when the last plus was read as a separator and no key came after
  // it yet: a shortcut that ends there ends with the plus key ("⌘+", "Ctrl+").
  let pendingSeparator = false;
  const push = () => {
    const key = current.trim();
    if (key) out.push(key);
    current = '';
  };
  for (const ch of text) {
    if (MAC_SYMBOLS.includes(ch)) {
      push();
      out.push(ch);
      afterKey = true;
      pendingSeparator = false;
      continue;
    }
    if (ch === '+') {
      if (current.trim() !== '') {
        push();
        afterKey = false;
        pendingSeparator = true;
      } else if (afterKey) {
        afterKey = false;
        pendingSeparator = true;
      } else {
        // A plus with no key before it is the plus key: "Ctrl++" and "+".
        out.push('+');
        current = '';
        afterKey = true;
        pendingSeparator = false;
      }
      continue;
    }
    current += ch;
    if (ch.trim()) {
      afterKey = false;
      pendingSeparator = false;
    }
  }
  push();
  if (pendingSeparator && current === '' && out.length > 0 && text.endsWith('+')) out.push('+');
  return out;
}

/** True when the string names a modifier: `Mod`, `Ctrl`, `⌘` and the rest. */
export function isModifier(key: string): boolean {
  return MODIFIER_ALIASES[key.trim().toLowerCase()] !== undefined;
}

/** One key, resolved for a platform. `Mod` becomes Command on a Mac, Control elsewhere. */
export function resolveKey(key: string, platform: KeyboardPlatform): ShortcutKey {
  const lower = key.trim().toLowerCase();
  const alias = MODIFIER_ALIASES[lower];
  if (alias) {
    const id = alias === 'mod' ? (platform === 'mac' ? 'meta' : 'ctrl') : alias;
    return { ...MODIFIERS[id][platform], modifier: true };
  }
  const named = NAMED_KEYS[lower];
  if (named) return { ...named, modifier: false };
  const trimmed = key.trim();
  // A single letter shows in upper case, as keycaps print it.
  const label = trimmed.length === 1 ? trimmed.toUpperCase() : trimmed;
  return { label, spoken: label, modifier: false };
}

/** Apple's order for modifiers: Control, Option, Shift, Command. */
const MAC_ORDER = ['⌃', '⌥', '⇧', '⌘'];

/**
 * Every key of a shortcut, resolved for a platform. On a Mac the modifiers
 * come first in Apple's order (⌃⌥⇧⌘), as the menus print them.
 */
export function shortcutKeys(shortcut: string, platform: KeyboardPlatform): ShortcutKey[] {
  const keys = splitShortcut(shortcut).map((key) => resolveKey(key, platform));
  if (platform !== 'mac') return keys;
  const mods = keys.filter((k) => k.modifier).sort((a, b) => MAC_ORDER.indexOf(a.label) - MAC_ORDER.indexOf(b.label));
  return [...mods, ...keys.filter((k) => !k.modifier)];
}

/** The shortcut as a screen reader should say it: `Control Shift P`. */
export function spokenShortcut(shortcut: string, platform: KeyboardPlatform): string {
  return shortcutKeys(shortcut, platform)
    .map((k) => k.spoken)
    .join(' ');
}

/**
 * The shortcut as one line of text in the platform's convention: `⌘⇧P` on a
 * Mac, `Ctrl+Shift+P` elsewhere. For places that draw plain text.
 */
export function formatShortcut(shortcut: string, platform: KeyboardPlatform): string {
  const keys = shortcutKeys(shortcut, platform);
  return platform === 'mac' ? keys.map((k) => k.label).join('') : keys.map((k) => k.label).join('+');
}

/**
 * The value for `aria-keyshortcuts` (WAI-ARIA 1.2): modifier names from the
 * spec (`Meta`, `Control`, `Alt`, `Shift`) joined by plus.
 */
export function ariaKeyShortcuts(shortcut: string, platform: KeyboardPlatform): string {
  const aria: Record<Exclude<ModifierId, 'mod'>, string> = { meta: 'Meta', ctrl: 'Control', alt: 'Alt', shift: 'Shift' };
  return splitShortcut(shortcut)
    .map((key) => {
      const alias = MODIFIER_ALIASES[key.trim().toLowerCase()];
      if (alias) return aria[alias === 'mod' ? (platform === 'mac' ? 'meta' : 'ctrl') : alias];
      const named = NAMED_KEYS[key.trim().toLowerCase()];
      if (named?.spoken.endsWith(' arrow')) return `Arrow${named.spoken.split(' ')[0]}`;
      if (named?.label === '+') return 'Plus';
      if (named?.label === 'Esc') return 'Escape';
      if (named?.label === 'PgUp') return 'PageUp';
      if (named?.label === 'PgDn') return 'PageDown';
      if (named) return named.label;
      const t = key.trim();
      return t.length === 1 ? t.toUpperCase() : t;
    })
    .join('+');
}

/**
 * The keyboard platform from a user agent string (pass `navigator.userAgent`).
 * Mac, iPhone and iPad keyboards use Command; everything else uses Control.
 */
export function keyboardPlatformFrom(userAgent: string | undefined | null): KeyboardPlatform {
  return userAgent && /Mac|iPhone|iPad|iPod/i.test(userAgent) ? 'mac' : 'other';
}
