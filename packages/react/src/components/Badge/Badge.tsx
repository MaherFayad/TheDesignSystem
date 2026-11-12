'use client';
// Badge: a small count or status label attached to something (unread 3,
// Beta). Not interactive: a pressable or removable token is a Chip.
//
// Sources: Figma-Killer-2 TagPill (the static form: a tinted pill, 18 and
// 20px tall at xs and sm, bold tight text). GoBanana dashboard.css and
// SiteNav.tsx could not be read in the lane session (no access to the
// repo). The tones and emphases follow Button so a badge and a button of
// the same tone read as one family.
//
// Motion (order 1.22, interaction badge-count, proposed): when the count
// changes after the first paint, its digits roll (the digit-roll primitive,
// up when it grew and down when it fell) and the badge pops: a dip to
// scale.anticipate, past rest to scale.pop, then rest. The drawn count is
// aria-hidden and the full count is read from a visually hidden copy, so a
// count is always drawn in the split form. A dot pops without a roll.
import { useCallback, useLayoutEffect, useRef, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { VisuallyHidden } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Emphasis, Size, Tone } from '@the-system/shared';
import { useMotion } from '../../internal/motion';
import { popMark, useDigitRoll } from '../Stat/useDigitRoll';

export type BadgeSize = Extract<Size, 'xs' | 'sm'>;
export type BadgeTone = Extract<Tone, 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>;
export type BadgeEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline'>;

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title'> {
  /** The visible label: Beta, New, Draft. With `count`, the count is shown instead. */
  children?: ReactNode;
  /** A number to show. Over `max` it shows "99+", and the full number goes to assistive tech. */
  count?: number;
  /** The largest count shown in full. Default 99. */
  max?: number;
  /**
   * The words assistive tech reads for a count, from the full number:
   * (n) => `${n} unread messages`. Default the number alone. Arabic: pass it.
   */
  countLabel?: (count: number) => string;
  /** The color family. Default neutral. */
  tone?: BadgeTone;
  /** solid is the loudest (an unread count), soft the default, outline the quietest. */
  emphasis?: BadgeEmphasis;
  /** About 16 (xs) and 20 (sm) px tall at default density; it follows the space tokens. Default sm. A badge is not a control, so it has no md. */
  size?: BadgeSize;
  /** Leading content in the icon part: a system icon name or a node. Hidden in the dot form. */
  start?: IconName | ReactElement;
  /** Draws only a dot. The label (or count words) stays for assistive tech. Default false. */
  dot?: boolean;
  ref?: Ref<HTMLSpanElement>;
}

/** The visible count text: the number, or "max+" over max. */
export function formatBadgeCount(count: number, max = 99): string {
  const whole = Math.max(0, Math.floor(count));
  return whole > max ? `${max}+` : String(whole);
}

/**
 * A static pill with a label or a count. Not focusable and no role: it is
 * read as text where it sits, so place it next to (or inside) the thing it
 * labels. A count over max shows "99+" and reads the full number.
 */
export function Badge({
  children,
  count,
  max = 99,
  countLabel,
  tone = 'neutral',
  emphasis = 'soft',
  size = 'sm',
  start,
  dot = false,
  ref,
  ...rest
}: BadgeProps) {
  const hasCount = typeof count === 'number' && Number.isFinite(count);
  const whole = hasCount ? Math.max(0, Math.floor(count)) : 0;
  const shown = hasCount ? formatBadgeCount(count, max) : undefined;
  const motion = useMotion();
  const mode = motion.mode('badge-count');
  const own = useRef<HTMLSpanElement>(null);
  // The badge pops with the roll. A badge placed with a transform of its own pops its label instead, so its place holds.
  const popBadge = useCallback(() => {
    const root = own.current;
    if (!root) return;
    const placed = typeof getComputedStyle === 'function' && getComputedStyle(root).transform !== 'none';
    popMark(placed ? root.querySelector(':scope > [data-part="label"]') : root, mode);
  }, [mode]);
  const countRef = useDigitRoll<HTMLElement>(hasCount && !dot ? shown : undefined, mode, popBadge, hasCount ? whole : undefined);
  // A dot has no digits: it only pops when the count changes.
  const lastCount = useRef(hasCount ? whole : undefined);
  useLayoutEffect(() => {
    const before = lastCount.current;
    lastCount.current = hasCount ? whole : undefined;
    if (dot && before !== undefined && hasCount && before !== whole) popBadge();
  }, [dot, hasCount, whole, popBadge]);
  // A count is isolated as left to right, so "99+" keeps the plus after the digits in Arabic too.
  const visible: ReactNode = hasCount ? (
    <bdi dir="ltr" ref={countRef}>
      {shown}
    </bdi>
  ) : (
    children
  );
  const spoken: ReactNode = hasCount ? (countLabel ? countLabel(whole) : String(whole)) : children;
  // A count is always split: the drawn digits roll, so they are hidden, and the full count is read.
  const split = hasCount;

  let label: ReactNode;
  if (dot) {
    label = <VisuallyHidden.Root data-part="label">{spoken}</VisuallyHidden.Root>;
  } else if (split) {
    label = (
      <span data-part="label">
        <span aria-hidden="true">{visible}</span>
        <VisuallyHidden.Root>{spoken}</VisuallyHidden.Root>
      </span>
    );
  } else {
    label = <span data-part="label">{visible}</span>;
  }

  return (
    <span
      {...rest}
      ref={(node) => {
        own.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      }}
      data-ds="badge"
      data-tone={tone}
      data-emphasis={emphasis}
      data-size={size}
      data-dot={dot ? '' : undefined}
    >
      {start !== undefined && !dot && (
        <span data-part="icon" aria-hidden="true">
          {typeof start === 'string' ? <Icon name={start} size="sm" /> : start}
        </span>
      )}
      {label}
    </span>
  );
}
