'use client';
// CopyButton: copies a value to the clipboard and confirms it. On the Button
// base. The icon swaps from copy to check (or to warning after a failure),
// a visually hidden status says the result once, and after the hold time
// the button returns to idle. Source: GoBanana site `CopyButton.tsx`,
// `CodeBlock.tsx` and `copy-text.ts` (the failure selects the visible text).
import { useEffect, useRef, useState, type MouseEvent, type Ref } from 'react';
import type { IconName } from '@the-system/icons';
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
 * How long the result shows before the button returns to idle. Hover intent
 * timing, not motion, so it is kept under reduced motion. Token gap: no
 * feedback hold token yet; delay.peek-hide is the nearest.
 */
const HOLD_TOKEN = '--ds-delay-peek-hide';

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
    setState(ok ? 'copied' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), readTimeToken(el.current, HOLD_TOKEN));
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
          <span data-part="icon">{renderSlotContent(icons[state])}</span>
          {!iconOnly && <span data-part="label">{name}</span>}
          <span data-part="status" role="status">
            {status}
          </span>
        </>
      )}
    />
  );
}
