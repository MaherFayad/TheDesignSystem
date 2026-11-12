'use client';
// CopyButton: copies a value to the clipboard and confirms it. On the Button
// base. The icon swaps from copy to check (or to warning after a failure),
// a visually hidden status says the result once, and after the hold time
// the button returns to idle. Source: GoBanana site `CopyButton.tsx`,
// `CodeBlock.tsx` and `copy-text.ts` (the failure selects the visible text).
//
// The icon swap (interaction copy-swap, pattern swap): when the icon changes,
// the old icon stays for one swap in an unnamed aria-hidden span after the
// new one, inside the icon part. The old rolls out while the new rolls in,
// both at once, and the span goes when its exit settles. The clipboard
// write, the state and the status are never held back by it. With no Web
// Animations API, or a style that turns the swap off, no span is added.
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type Ref } from 'react';
import type { IconName } from '@the-system/icons';
import { settled } from '@the-system/motion';
import { useMotion } from '../../internal/motion';
import { useTheme } from '../../theme/hooks';
import { ButtonRoot, renderSlotContent, type ButtonBaseProps } from '../Button/ButtonBase';
import { copyToClipboard, readTimeToken, selectTextOf } from './copy';

export type CopyButtonState = 'idle' | 'copied' | 'failed';

/** The default words by language. Arabic: noun forms, no diacritics. */
export const copyButtonLabels = {
  en: { label: 'Copy', copied: 'Copied', failed: 'Could not copy' },
  ar: { label: 'نسخ', copied: 'تم النسخ', failed: 'تعذر النسخ' },
} as const;

/**
 * How long the result shows before the button returns to idle
 * (delay.feedback, 2s). Timing, not motion, so it is kept under reduced
 * motion.
 */
const HOLD_TOKEN = '--ds-delay-feedback';

const icons: Record<CopyButtonState, IconName> = { idle: 'copy', copied: 'check', failed: 'warning' };

export interface CopyButtonProps
  extends Omit<ButtonBaseProps, 'children' | 'aria-label' | 'loading' | 'loadingLabel' | 'asChild' | 'type'> {
  /** The text to copy. */
  value: string;
  /**
   * The name of the action. Visible text unless `iconOnly`, where it is the
   * accessible name. Default "Copy" ("نسخ" under an Arabic Theme). Name what
   * is copied when it helps: "Copy command".
   */
  label?: string;
  /** Shows only the icon; `label` becomes the accessible name. Default false. */
  iconOnly?: boolean;
  /** What the status says after a copy. Default "Copied" ("تم النسخ"). */
  copiedLabel?: string;
  /** What the status says after a failure. Default "Could not copy" ("تعذر النسخ"). */
  failedLabel?: string;
  /** The id of the element that shows the value. A failed copy selects its text, so the keyboard can copy it. */
  target?: string;
  /** Called after the value reached the clipboard. */
  onCopied?: (value: string) => void;
  /** Called after the copy failed. */
  onCopyFailed?: (value: string) => void;
  /** Default ghost: a copy control sits beside the value it copies. */
  emphasis?: ButtonBaseProps['emphasis'];
}

/** The icon that leaves during a swap. `back` is the return to idle, which rolls the other way. */
interface Leaving {
  id: number;
  icon: IconName;
  back: boolean;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref && typeof ref === 'object') (ref as { current: T | null }).current = value;
}

/** A button that copies `value`, with `data-state` idle, copied or failed. */
export function CopyButton({
  value,
  label,
  iconOnly = false,
  copiedLabel,
  failedLabel,
  target,
  onCopied,
  onCopyFailed,
  onClick,
  ref,
  ...rest
}: CopyButtonProps) {
  const { lang } = useTheme();
  const words = lang.startsWith('ar') ? copyButtonLabels.ar : copyButtonLabels.en;
  const name = label ?? words.label;
  const [state, setState] = useState<CopyButtonState>('idle');
  const [leaving, setLeaving] = useState<Leaving | null>(null);
  const el = useRef<HTMLButtonElement | null>(null);
  const iconPart = useRef<HTMLSpanElement | null>(null);
  const current = useRef<CopyButtonState>('idle');
  const swaps = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const motion = useMotion();

  useEffect(() => () => clearTimeout(timer.current), []);

  /** Sets the state at once and, when the icon changes and motion can play, keeps the old icon for the swap. */
  const change = (next: CopyButtonState) => {
    const prev = current.current;
    current.current = next;
    if (icons[prev] !== icons[next] && typeof el.current?.animate === 'function' && motion.mode('copy-swap') !== 'none') {
      swaps.current += 1;
      setLeaving({ id: swaps.current, icon: icons[prev], back: next === 'idle' });
    }
    setState(next);
  };

  // Plays the swap on the committed icons, before paint, so the old icon never
  // shows over the new one at rest. The new icon is the first child of the
  // icon part, the leaving copy the last.
  useLayoutEffect(() => {
    const part = iconPart.current;
    if (!leaving || !part) return;
    const direction = leaving.back ? 'down' : 'up';
    const incoming = part.firstElementChild;
    const outgoing = part.lastElementChild;
    if (incoming && incoming !== outgoing) motion.play(incoming, 'swap', 'copy-swap', { phase: 'enter', direction });
    const exit = outgoing && outgoing !== incoming ? motion.play(outgoing, 'swap', 'copy-swap', { phase: 'exit', direction }) : null;
    let live = true;
    void settled(exit).then(() => {
      if (live) setLeaving((l) => (l?.id === leaving.id ? null : l));
    });
    return () => {
      live = false;
    };
  }, [leaving, motion]);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const ok = await copyToClipboard(value);
    if (ok) onCopied?.(value);
    else {
      selectTextOf(target);
      onCopyFailed?.(value);
    }
    change(ok ? 'copied' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => change('idle'), readTimeToken(el.current, HOLD_TOKEN));
  };

  const status = state === 'copied' ? (copiedLabel ?? words.copied) : state === 'failed' ? (failedLabel ?? words.failed) : '';

  return (
    <ButtonRoot
      {...rest}
      ref={(node: HTMLButtonElement | null) => {
        el.current = node;
        setRef(ref, node);
      }}
      ds="copy-button"
      iconOnly={iconOnly}
      defaultEmphasis="ghost"
      data-state={state}
      aria-label={iconOnly ? name : undefined}
      onClick={handleClick}
      render={() => (
        <>
          <span data-part="icon" ref={iconPart}>
            {renderSlotContent(icons[state])}
            {leaving && (
              <span key={leaving.id} aria-hidden="true">
                {renderSlotContent(leaving.icon)}
              </span>
            )}
          </span>
          {!iconOnly && <span data-part="label">{name}</span>}
          <span data-part="status" role="status">
            {status}
          </span>
        </>
      )}
    />
  );
}
