// Badge: a small count or status label attached to something (unread 3,
// Beta). Not interactive: a pressable or removable token is a Chip.
//
// Sources: Figma-Killer-2 TagPill (the static form: a tinted pill, 18 and
// 20px tall at xs and sm, bold tight text). GoBanana dashboard.css and
// SiteNav.tsx could not be read in the lane session (no access to the
// repo). The tones and emphases follow Button so a badge and a button of
// the same tone read as one family.
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { VisuallyHidden } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Emphasis, Size, Tone } from '@the-system/shared';

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
  // A count is isolated as left to right, so "99+" keeps the plus after the digits in Arabic too.
  const visible: ReactNode = hasCount ? <bdi dir="ltr">{formatBadgeCount(count, max)}</bdi> : children;
  const whole = hasCount ? Math.max(0, Math.floor(count)) : 0;
  const spoken: ReactNode = hasCount ? (countLabel ? countLabel(whole) : String(whole)) : children;
  // The visible text and the spoken text differ for a capped count or a count with words.
  const split = hasCount && spoken !== formatBadgeCount(count, max);

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
      ref={ref}
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
