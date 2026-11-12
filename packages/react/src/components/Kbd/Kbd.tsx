'use client';
// Kbd: a key or a shortcut drawn as keycaps.
//
// Sources: Figma-Killer-2 `Kbd/` (the sculpted keycap and `splitShortcut`).
// GoBanana `Kbd.tsx` and `shortcutKeys.ts` were not reachable in this
// session; the look follows FK2 and the kbd.* tokens, which came from
// GoBanana in wave 0.
//
// Not carried over: the FK2 hover lift and press depress. A keycap here is
// text, not a control, so it has no hover or press.
import { useSyncExternalStore, type HTMLAttributes, type ReactNode, type Ref } from 'react';
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
   * elsewhere. A node draws one keycap as is (give it a `label`).
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

  return (
    <kbd {...rest} data-ds="kbd" data-size={size} dir="ltr" aria-hidden={decorative ? true : rest['aria-hidden']}>
      {keys.map((k, i) => (
        <KbdKey key={i} index={i} keyItem={k} separator={sep} />
      ))}
      {!decorative && spoken && <span data-part="spoken">{spoken}</span>}
    </kbd>
  );
}

function KbdKey({
  index,
  keyItem,
  separator,
}: {
  index: number;
  keyItem: { label: ReactNode };
  separator: string;
}) {
  return (
    <>
      {index > 0 && separator && (
        <span data-part="separator" aria-hidden="true">
          {separator}
        </span>
      )}
      <kbd data-part="key" aria-hidden="true">
        {keyItem.label}
      </kbd>
    </>
  );
}
