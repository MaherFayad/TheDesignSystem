'use client';
// CopyButton: copies a value to the clipboard and confirms it. On the Button
// base. The icon swaps from copy to check (or to warning after a failure),
// a visually hidden status says the result once, and after the hold time
// the button returns to idle. Source: GoBanana site `CopyButton.tsx`,
// `CodeBlock.tsx` and `copy-text.ts` (the failure selects the visible text).
//
// The result morph (interaction copy-swap, order 1.22, primitive
// buttonMorph): when the icon changes, the old icon stays for one morph in
// an unnamed aria-hidden span after the new one, inside the icon part. The
// old icon rolls out while the new one arrives one stagger step later: the
// check turns in from a quarter turn back, grows past rest and settles, and
// the button swells once (scale.pop over duration.celebrate); the warning
// pops in and the button shakes once along the inline axis; the copy icon
// rolls back in from above when the result ends. The span rests at opacity
// 0 (Button.css) and goes when its exit settles. The clipboard write, the
// state and the status are never held back by it. With no Web Animations
// API, or a style that turns the morph off, no span is added.
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import type { IconName } from '@the-system/icons';
import { buttonMorph, settled, type MorphParts, type MorphState } from '@the-system/motion';
import { useMotion } from '../../internal/motion';
import { useTheme } from '../../theme/hooks';
import { ButtonRoot, renderSlotContent, setRef, type ButtonBaseProps } from '../Button/ButtonBase';
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

/** The icon that leaves during a morph, and the states the morph goes between. */
interface Leaving {
  id: number;
  icon: IconName;
  from: CopyButtonState;
  to: CopyButtonState;
}

/** The morph state of each copy state. */
const morphStates: Record<CopyButtonState, MorphState> = { idle: 'idle', copied: 'success', failed: 'error' };
/** The morph part that shows in each copy state. */
const morphSlots: Record<CopyButtonState, 'label' | 'success' | 'error'> = { idle: 'label', copied: 'success', failed: 'error' };

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
      setLeaving({ id: swaps.current, icon: icons[prev], from: prev, to: next });
    }
    setState(next);
  };

  // Plays the morph on the committed icons, before paint, so the old icon
  // never shows over the new one at rest. The new icon is the first child of
  // the icon part, the leaving copy the last.
  useLayoutEffect(() => {
    const part = iconPart.current;
    if (!leaving || !part) return;
    const incoming = part.firstElementChild;
    const outgoing = part.lastElementChild;
    const parts: MorphParts = { root: el.current };
    if (outgoing && outgoing !== incoming) parts[morphSlots[leaving.from]] = outgoing;
    if (incoming) parts[morphSlots[leaving.to]] = incoming;
    const played = buttonMorph(parts, morphStates[leaving.from], morphStates[leaving.to], { mode: motion.mode('copy-swap') });
    const exit = played.find((a) => (a.effect as KeyframeEffect | null)?.target === outgoing) ?? null;
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
