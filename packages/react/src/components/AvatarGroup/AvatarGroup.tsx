'use client';
// AvatarGroup: a few overlapping avatars with a "+N" count for the rest.
//
// Hand built. No source in either repo: designed from the dials table in
// PLAN.md 3.7 (Studio and Desk both use the circle avatar on a flat step)
// and from Avatar. The group has a label ("5 people"); each avatar keeps
// its own name. The overflow is a plain count, or a Button when
// onOverflowClick is set (for example to open a Popover list once Popover
// exists).
import {
  Children,
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Button } from '../Button';
import type { AvatarProps, AvatarSize } from '../Avatar';

export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /**
   * The name of the group, read before the avatars: "5 people",
   * "Shared with 5 people". Required.
   */
  label: string;
  /** The Avatar elements. Their size is set by the group. */
  children: ReactNode;
  /** The size of every avatar and of the count: xs 24, sm 28, md 32, lg 44 px. Default md. */
  size?: AvatarSize;
  /** How many avatars show before the count. Default 4. */
  max?: number;
  /** The full number of people when it is more than the avatars passed (a server count). Default the number of children. */
  total?: number;
  /**
   * The words for the count, for assistive tech: the visible text is "+N".
   * Default `${n} more`, or `Show ${n} more` when the count is a Button.
   * Arabic: pass it, for example (n) => `${n} آخرين`.
   */
  overflowLabel?: (hidden: number) => string;
  /** Makes the count a Button, for example to open the full list in a Popover. */
  onOverflowClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Overlapping avatars in a `role="group"` named by `label`. The first
 * avatars show in reading order, each overlapping the one before it on the
 * start side, so the overlap flips in right to left layouts. The rest is a
 * "+N" count.
 */
export function AvatarGroup({
  label,
  children,
  size = 'md',
  max = 4,
  total,
  overflowLabel,
  onOverflowClick,
  ref,
  ...rest
}: AvatarGroupProps) {
  const avatars = Children.toArray(children).filter((child): child is ReactElement<AvatarProps> =>
    isValidElement(child),
  );
  const shown = avatars.slice(0, Math.max(0, Math.floor(max)));
  const hidden = Math.max(0, (total ?? avatars.length) - shown.length);
  // The plus stays before the digits in right to left layouts too: the count is isolated as left to right.
  const count = `+${hidden}`;
  const countWords = overflowLabel
    ? overflowLabel(hidden)
    : onOverflowClick
      ? `Show ${hidden} more`
      : `${hidden} more`;

  return (
    <div {...rest} ref={ref} data-ds="avatar-group" data-size={size} role="group" aria-label={label}>
      {shown.map((avatar) =>
        cloneElement(avatar, { size, 'data-part': 'item' } as Partial<AvatarProps> & { 'data-part': string }),
      )}
      {hidden > 0 &&
        (onOverflowClick ? (
          <Button
            data-part="overflow"
            size={size}
            shape="pill"
            emphasis="soft"
            aria-label={countWords}
            onClick={onOverflowClick}
          >
            <bdi dir="ltr">{count}</bdi>
          </Button>
        ) : (
          <span data-part="overflow" role="img" aria-label={countWords}>
            <bdi aria-hidden="true" dir="ltr">
              {count}
            </bdi>
          </span>
        ))}
    </div>
  );
}
