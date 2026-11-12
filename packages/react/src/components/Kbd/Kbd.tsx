'use client';
// Kbd: a key or a shortcut drawn as keycaps.
//
// Sources: Figma-Killer-2 `Kbd/` (the sculpted keycap and `splitShortcut`).
// GoBanana `Kbd.tsx` and `shortcutKeys.ts` were not reachable in this
// session; the look follows FK2 and the kbd.* tokens, which came from
// GoBanana in wave 0.
//
// Not carried over: the FK2 hover lift and press depress. A keycap here is
// text, not a control, so it has no hover or pointer press.
//
// Motion (order 1.22, interaction kbd-press, proposed): when the person
// presses the real key a keycap names, that keycap goes down: it dips
// distance.nudge and to scale.anticipate on the snappy spring and holds
// there while the key is held; on release it springs back on the bouncy
// spring. A shortcut presses key by key, as the fingers do. A held key's
// repeats do nothing more. The listener is passive: it never prevents or
// stops the key, and the keycap stays text (no role, no focus).
import { useEffect, useRef, useSyncExternalStore, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { play } from '@the-system/motion';
import { useMotion } from '../../internal/motion';
import {
  keyboardPlatformFrom,
  shortcutKeys,
  type KeyboardPlatform,
  type ShortcutKey,
  type Size,
} from '@the-system/shared';
import { useTheme } from '../../theme/hooks';

export type KbdSize = Extract<Size, 'xs' | 'sm' | 'md'>;

export interface KbdProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /**
   * The key or the shortcut. A string is split into keycaps: `Mod+K`,
   * `Ctrl+Shift+P`, `⌘⇧P`, `Esc`. `Mod` is Command on a Mac and Control
   * elsewhere. A node draws one keycap as is; give it a `label`, or the node itself is read.
   */
  children: ReactNode;
  /** xs 16, sm 20, md 24 px tall. Default md. */
  size?: KbdSize;
  /**
   * Which convention to draw: `mac` (`⌘K`, no separators) or `other`
   * (`Ctrl+K`). By default an iOS Theme platform means mac, otherwise the
   * user agent decides after hydration; the server draws `other`.
   */
  platform?: KeyboardPlatform;
  /**
   * The text a screen reader says instead of the spoken key names, for
   * example in another language. By default the names come from
   * `spokenShortcut`: "Control Shift P".
   */
  label?: string;
  /**
   * Hides the keycaps from assistive tech, for a shortcut next to an action
   * that already names it (a menu item with `aria-keyshortcuts`). Default false.
   */
  decorative?: boolean;
  /** Drawn between keycaps. Default `+` on `other` and nothing on `mac`, as each platform prints shortcuts. */
  separator?: string;
  ref?: Ref<HTMLElement>;
}

const noopSubscribe = () => () => {};
const clientPlatform = () => keyboardPlatformFrom(typeof navigator === 'undefined' ? undefined : navigator.userAgent);
const serverPlatform = (): KeyboardPlatform => 'other';

/** The keyboard platform: the prop, an iOS Theme, else the user agent after hydration. */
export function useKeyboardPlatform(platform?: KeyboardPlatform): KeyboardPlatform {
  const theme = useTheme();
  const detected = useSyncExternalStore(noopSubscribe, clientPlatform, serverPlatform);
  if (platform) return platform;
  if (theme.platform === 'ios') return 'mac';
  return detected;
}

/**
 * A key or a shortcut as keycaps. The keycaps read left to right in every
 * language (`dir="ltr"` on the root, isolated from the sentence around it),
 * and a visually hidden copy says the key names to screen readers.
 */
export function Kbd({ children, size = 'md', platform, label, decorative = false, separator, ...rest }: KbdProps) {
  const resolved = useKeyboardPlatform(platform);
  const keys: (ShortcutKey | { label: ReactNode; spoken: string; modifier: false })[] =
    typeof children === 'string' ? shortcutKeys(children, resolved) : [{ label: children, spoken: label ?? '', modifier: false }];
  const sep = separator ?? (resolved === 'mac' ? '' : '+');
  const spoken = label ?? keys.map((k) => k.spoken).join(' ');
  const pressRef = useKeyPress(keys.map((k) => [typeof k.label === 'string' ? k.label : '', k.spoken]));
  // An empty string would draw an empty kbd with no keycap and nothing to say.
  if (children === '') return null;

  return (
    <kbd
      {...rest}
      ref={(node: HTMLElement | null) => {
        pressRef.current = node;
        const r = rest.ref;
        if (typeof r === 'function') return r(node);
        if (r) r.current = node;
      }}
      data-ds="kbd" data-size={size} dir="ltr" aria-hidden={decorative ? true : rest['aria-hidden']}>
      {keys.map((k, i) => (
        <KbdKey key={i} index={i} keyItem={k} separator={sep} exposed={!decorative && !spoken} />
      ))}
      {!decorative && spoken && (
        // The default names are English words: say them with an English voice on an Arabic page.
        <span data-part="spoken" lang={label === undefined ? 'en' : undefined}>
          {spoken}
        </span>
      )}
    </kbd>
  );
}

function KbdKey({
  index,
  keyItem,
  separator,
  exposed,
}: {
  index: number;
  keyItem: { label: ReactNode };
  separator: string;
  /** A node keycap with no label stays readable, since nothing else names it. */
  exposed: boolean;
}) {
  return (
    <>
      {index > 0 && separator && (
        <span data-part="separator" aria-hidden="true">
          {separator}
        </span>
      )}
      <kbd data-part="key" aria-hidden={exposed ? undefined : 'true'}>
        {keyItem.label}
      </kbd>
    </>
  );
}

/** The names a KeyboardEvent key goes by on a keycap: its label or its spoken name. */
function namesOf(key: string): string[] {
  const k = key.length === 1 ? key.toUpperCase() : key;
  const alias: Record<string, string[]> = {
    Meta: ['Command', 'Cmd', '⌘', 'Meta', 'Win'],
    Control: ['Control', 'Ctrl', '⌃'],
    Alt: ['Alt', 'Option', '⌥'],
    Shift: ['Shift', '⇧'],
    Escape: ['Escape', 'Esc'],
    Enter: ['Enter', 'Return', '↵'],
    ' ': ['Space'],
  };
  return alias[key] ?? [k];
}

/** kbd-press: presses a keycap while its real key is held. Returns the ref for the kbd root. */
function useKeyPress(keys: string[][]) {
  const ref = useRef<HTMLElement | null>(null);
  const motion = useMotion();
  const signature = keys.map((k) => k.join('/')).join('|');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const caps = () => [...(ref.current?.querySelectorAll<HTMLElement>(':scope > [data-part="key"]') ?? [])];
    const match = (event: KeyboardEvent) => {
      const names = namesOf(event.key).map((n) => n.toLowerCase());
      return caps().filter((_, i) => (keys[i] ?? []).some((n) => n && names.includes(n.toLowerCase())));
    };
    const down = (event: KeyboardEvent) => {
      if (event.repeat || motion.mode('kbd-press') !== 'full') return;
      for (const cap of match(event)) {
        play(cap, { keyframes: [{ transform: 'none' }, { transform: 'translateY(var(--ds-distance-nudge)) scale(var(--ds-scale-anticipate))' }], duration: 'duration.spring-snappy', easing: 'ease.spring-snappy', fill: 'forwards', origin: '50% 100%' }, 'kbd-press');
      }
    };
    const up = (event: KeyboardEvent) => {
      for (const cap of match(event)) {
        if (!cap.getAnimations?.().some((a) => String(a.id) === 'ds-motion:kbd-press')) continue;
        play(cap, { keyframes: [{ transform: 'translateY(var(--ds-distance-nudge)) scale(var(--ds-scale-anticipate))' }, { transform: 'none' }], duration: 'duration.spring-bouncy', easing: 'ease.spring-bouncy', fill: 'none', origin: '50% 100%' }, 'kbd-press');
      }
    };
    // A lost window focus would leave a keycap down: let every keycap go.
    const blur = () => {
      for (const cap of caps()) for (const a of cap.getAnimations?.() ?? []) if (String(a.id) === 'ds-motion:kbd-press') a.cancel();
    };
    window.addEventListener('keydown', down, { passive: true });
    window.addEventListener('keyup', up, { passive: true });
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
    // keys is rebuilt each render; the signature is what changes.
  }, [signature, motion]);
  return ref;
}
