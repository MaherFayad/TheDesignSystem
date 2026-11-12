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
import { useMotion } from '../../internal/motion';
import { Button } from '../Button';
import type { AvatarProps, AvatarSize } from '../Avatar';
import { popMark, useDigitRoll } from '../Stat/useDigitRoll';
import { useFlipList } from './useFlipList';

/** The items that move: the avatars and the overflow, never a ghost on its way out. */
const movers = (root: HTMLElement) => [...root.querySelectorAll(':scope > [data-part]:not([inert])')];

export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /**
   * The name of the group, read before the avatars: "5 people",
   * "Shared with 5 people". Required.
   */
  label: string;
  /** The Avatar elements. The group sets size and data-part item on each element child, so pass only Avatars. */
  children: ReactNode;
  /** The size of every avatar and of the count, from size.control: xs 24, sm 28, md 32, lg 44 px at default density. Default md. */
  size?: AvatarSize;
  /** How many avatars show before the count. Default 4. */
  max?: number;
  /** The full number of people when it is more than the avatars passed (a server count). Default the number of children. */
  total?: number;
  /**
   * The words for the count, for assistive tech: the visible text is "+N".
   * Default `${n} more`. When the count is a Button its name is "+N, "
   * followed by these words, so the name starts with the visible text.
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
  const countWords = overflowLabel ? overflowLabel(hidden) : `${hidden} more`;
  // avatar-group-change (order 1.22): avatars that join pop in, avatars that leave shrink away, the rest
  // slide to their new place (FLIP), and the overflow count rolls and pops.
  const motion = useMotion();
  const mode = motion.mode('avatar-group-change');
  const signature = `${shown.map((a) => String(a.key)).join('|')}|${hidden > 0 ? 'more' : ''}`;
  const own = useFlipList<HTMLDivElement>(movers, signature, mode);
  const countRef = useDigitRoll<HTMLElement>(hidden > 0 ? count : undefined, mode, (_d, host) => popMark(host.closest('[data-part="overflow"]'), mode), hidden);
  const setRef = (node: HTMLDivElement | null) => {
    own.current = node;
    if (typeof ref === 'function') return ref(node);
    if (ref) ref.current = node;
  };

  return (
    <div {...rest} ref={setRef} data-ds="avatar-group" data-size={size} role="group" aria-label={label}>
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
            aria-label={`${count}, ${countWords}`}
            onClick={onOverflowClick}
          >
            <bdi dir="ltr" ref={countRef}>
              {count}
            </bdi>
          </Button>
        ) : (
          <span data-part="overflow" role="img" aria-label={countWords}>
            <bdi aria-hidden="true" dir="ltr" ref={countRef}>
              {count}
            </bdi>
          </span>
        ))}
    </div>
  );
}
