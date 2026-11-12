import { describe, expect, it } from 'vitest';
import {
  ariaKeyShortcuts,
  formatShortcut,
  isModifier,
  keyboardPlatformFrom,
  resolveKey,
  shortcutKeys,
  splitShortcut,
  spokenShortcut,
} from './shortcut';

describe('splitShortcut', () => {
  it('splits on plus, with or without spaces', () => {
    expect(splitShortcut('Ctrl+K')).toEqual(['Ctrl', 'K']);
    expect(splitShortcut('Mod + Shift + P')).toEqual(['Mod', 'Shift', 'P']);
  });

  it('splits after each Mac symbol', () => {
    expect(splitShortcut('⌘K')).toEqual(['⌘', 'K']);
    expect(splitShortcut('⌘⇧P')).toEqual(['⌘', '⇧', 'P']);
    expect(splitShortcut('⌘+K')).toEqual(['⌘', 'K']);
  });

  it('keeps multi letter key names whole', () => {
    expect(splitShortcut('PageUp')).toEqual(['PageUp']);
    expect(splitShortcut('Shift+Enter')).toEqual(['Shift', 'Enter']);
  });

  it('reads the plus key', () => {
    expect(splitShortcut('+')).toEqual(['+']);
    expect(splitShortcut('Ctrl++')).toEqual(['Ctrl', '+']);
    expect(splitShortcut('Ctrl+Plus')).toEqual(['Ctrl', 'Plus']);
  });

  it('gives nothing for an empty string', () => {
    expect(splitShortcut('  ')).toEqual([]);
  });
});

describe('resolveKey', () => {
  it('maps Mod by platform', () => {
    expect(resolveKey('Mod', 'mac')).toEqual({ label: '⌘', spoken: 'Command', modifier: true });
    expect(resolveKey('mod', 'other')).toEqual({ label: 'Ctrl', spoken: 'Control', modifier: true });
  });

  it('draws modifiers in each convention', () => {
    expect(resolveKey('Alt', 'mac').label).toBe('⌥');
    expect(resolveKey('⌥', 'other').label).toBe('Alt');
    expect(resolveKey('Shift', 'mac').label).toBe('⇧');
    expect(resolveKey('Cmd', 'other')).toEqual({ label: 'Win', spoken: 'Windows', modifier: true });
  });

  it('names special keys and capitalises single letters', () => {
    expect(resolveKey('esc', 'other')).toEqual({ label: 'Esc', spoken: 'Escape', modifier: false });
    expect(resolveKey('ArrowUp', 'mac')).toEqual({ label: '↑', spoken: 'Up arrow', modifier: false });
    expect(resolveKey('k', 'mac')).toEqual({ label: 'K', spoken: 'K', modifier: false });
    expect(resolveKey('F12', 'mac').label).toBe('F12');
  });

  it('knows which strings are modifiers', () => {
    expect(isModifier('Mod')).toBe(true);
    expect(isModifier('⇧')).toBe(true);
    expect(isModifier('K')).toBe(false);
  });
});

describe('whole shortcuts', () => {
  it('resolves every key', () => {
    expect(shortcutKeys('Mod+Shift+P', 'mac').map((k) => k.label)).toEqual(['⌘', '⇧', 'P']);
  });

  it('speaks the names', () => {
    expect(spokenShortcut('Mod+K', 'mac')).toBe('Command K');
    expect(spokenShortcut('Mod+K', 'other')).toBe('Control K');
    expect(spokenShortcut('Shift+?', 'other')).toBe('Shift Question mark');
  });

  it('formats one line of text in the platform convention', () => {
    expect(formatShortcut('Mod+Shift+P', 'mac')).toBe('⌘⇧P');
    expect(formatShortcut('Mod+Shift+P', 'other')).toBe('Ctrl+Shift+P');
  });

  it('gives an aria-keyshortcuts value', () => {
    expect(ariaKeyShortcuts('Mod+Shift+P', 'mac')).toBe('Meta+Shift+P');
    expect(ariaKeyShortcuts('Mod+K', 'other')).toBe('Control+K');
    expect(ariaKeyShortcuts('Alt+ArrowUp', 'other')).toBe('Alt+ArrowUp');
    expect(ariaKeyShortcuts('Ctrl++', 'other')).toBe('Control+Plus');
    expect(ariaKeyShortcuts('Esc', 'other')).toBe('Escape');
  });
});

describe('keyboardPlatformFrom', () => {
  it('reads Mac and iOS user agents as mac', () => {
    expect(keyboardPlatformFrom('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBe('mac');
    expect(keyboardPlatformFrom('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('mac');
  });

  it('reads everything else as other', () => {
    expect(keyboardPlatformFrom('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('other');
    expect(keyboardPlatformFrom(undefined)).toBe('other');
  });
});
