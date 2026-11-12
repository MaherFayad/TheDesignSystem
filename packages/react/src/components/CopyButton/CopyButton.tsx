'use client';
// CopyButton: copies a value to the clipboard and confirms it. On the Button
// base. A visually hidden status says the result once, and after the hold
// time (delay.feedback) the button returns to idle. Source: GoBanana site
// `CopyButton.tsx`, `CodeBlock.tsx` and `copy-text.ts` (the failure selects
// the visible text).
//
// The confirmation (interaction copy-swap, order 1.23, proposed) is CSS in
// CopyButton.css, driven by data-state. Every glyph and every word is in the
// DOM from the first paint, so nothing mounts or waits:
//
//   - The icon part holds the copy, check and warning glyphs of the style's
//     icon set, stacked in one grid cell. The copy glyph closes into its
//     centre, the check wipes in along its strokes, the warning pops in.
//   - The label part holds the three words ("Copy link", "Copied", "Could
//     not copy") stacked in one grid cell, so the button always keeps the
//     width of the widest and the width never animates. The words roll up
//     through the button like a counter. The others are aria-hidden, and
//     the button's aria-label is the idle word, so the accessible name
//     never changes.
//   - The icon only form shows a small bubble above the button with the
//     result word. It rises and fades. aria-hidden: decoration only.
//   - The status (role status, polite) gets the result word once per copy:
//     each copy writes a new text node, so a second copy is heard again, and
//     going back to idle empties it.
//
// A second copy while the result shows restarts the hold time, draws the
// check again and replays the bubble; it never leaves a stuck state.
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { IconName } from '@the-system/icons';
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

/** The glyph of each state, in the order they stack. */
const icons: Record<CopyButtonState, IconName> = { idle: 'copy', copied: 'check', failed: 'warning' };
const STATES: readonly CopyButtonState[] = ['idle', 'copied', 'failed'];

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
  /** What the label rolls to and the status says after a copy. Default "Copied" ("تم النسخ"). */
  copiedLabel?: string;
  /** What the label rolls to and the status says after a failure. Default "Could not copy" ("تعذر النسخ"). */
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
  const defaults = lang.startsWith('ar') ? copyButtonLabels.ar : copyButtonLabels.en;
  const words: Record<CopyButtonState, string> = {
    idle: label ?? defaults.label,
    copied: copiedLabel ?? defaults.copied,
    failed: failedLabel ?? defaults.failed,
  };
  const [state, setState] = useState<CopyButtonState>('idle');
  // Counts the results. It keys the check, the bubble and the status text,
  // so a second copy replays them; 0 means nothing has happened yet, so the
  // idle word does not roll in on the first paint.
  const [count, setCount] = useState(0);
  // The last result, so the bubble keeps its word while it fades out.
  const [last, setLast] = useState<Exclude<CopyButtonState, 'idle'>>('copied');
  const el = useRef<HTMLButtonElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const ok = await copyToClipboard(value);
    if (ok) onCopied?.(value);
    else {
      selectTextOf(target);
      onCopyFailed?.(value);
    }
    const next = ok ? 'copied' : 'failed';
    setState(next);
    setLast(next);
    setCount((n) => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), readTimeToken(el.current, HOLD_TOKEN));
  };

  const status = state === 'idle' ? '' : words[state];
  /** The word that shows now rolls in, except the idle word on the first paint. */
  const rolls = (s: CopyButtonState) => s === state && (s !== 'idle' || count > 0);

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
      // The name is always the idle word, also with a visible label: the
      // status inside the button would otherwise join the name while it
      // speaks ("Copy link Copied"), and the rolling words are aria-hidden.
      aria-label={words.idle}
      onClick={handleClick}
      render={() => (
        <>
          <span data-part="icon">
            {STATES.map((s) => (
              <span key={s === 'idle' ? s : `${s}-${count}`} data-copy-glyph={s}>
                {renderSlotContent(icons[s])}
              </span>
            ))}
          </span>
          {!iconOnly && (
            <span data-part="label">
              {STATES.map((s) => (
                <span key={s} data-copy-label={s} data-roll={rolls(s) ? '' : undefined} aria-hidden={s === 'idle' ? undefined : true}>
                  {words[s]}
                </span>
              ))}
            </span>
          )}
          {iconOnly && (
            <span key={count} data-part="bubble" aria-hidden="true">
              {words[last]}
            </span>
          )}
          <span data-part="status" role="status">
            {status && <span key={count}>{status}</span>}
          </span>
        </>
      )}
    />
  );
}
