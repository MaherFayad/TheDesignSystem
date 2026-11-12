'use client';
// Avatar: a person or a workspace as an image, initials or an icon.
//
// Behavior: Radix Avatar. The image loads in the background; the fallback
// (initials, else the icon) shows when there is no image, when it fails, or
// after `fallbackDelay` while it loads.
//
// Sources: GoBanana `.mail-avatar` and AccountWindow could not be read in
// the lane session (no access to the repo); designed from Figma-Killer-2
// TagPill (the tinted accent from a name), the dials table in PLAN.md 3.7
// and Button (sizes from size.control).
//
// The status part is a StatusDot root carrying data-part="status", with its
// label visually hidden. Avatar.css draws one shape per status on it, so the
// status never rests on color alone (WCAG 1.4.1), forced colors included.
import { useState, type CSSProperties, type HTMLAttributes, type ReactElement, type Ref } from 'react';
import { Avatar as RadixAvatar } from 'radix-ui';
import { Icon, type IconName } from '@the-system/icons/react';
import { hasArabic, initials, toneIndex, type Shape, type Size, type Tone } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { StatusDot } from '../StatusDot';

export type AvatarSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type AvatarShape = Extract<Shape, 'default' | 'square'>;
/** The tones of the status part: online, away, busy, offline. */
export type AvatarStatusTone = Extract<Tone, 'success' | 'warning' | 'danger' | 'neutral'>;
/** The loading state of the image, stamped as data-state on the root. */
export type AvatarState = 'loading' | 'loaded' | 'error';

/** English words for each status tone, used when statusLabel is not set. */
export const avatarStatusLabel: Record<AvatarStatusTone, string> = {
  success: 'Online',
  warning: 'Away',
  danger: 'Busy',
  neutral: 'Offline',
};

/** Arabic words for each status tone, used under an Arabic Theme when statusLabel is not set. */
export const avatarStatusLabelAr: Record<AvatarStatusTone, string> = {
  success: 'متصل',
  warning: 'غير متواجد',
  danger: 'مشغول',
  neutral: 'غير متصل',
};

const iconSize: Record<AvatarSize, 'sm' | 'md' | 'lg'> = { xs: 'sm', sm: 'sm', md: 'md', lg: 'lg' };

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children'> {
  /**
   * The person or workspace name. It is the accessible name of the avatar,
   * the source of the initials and of the fallback color. Required. An
   * empty name has nothing to say: the avatar is then decorative, and a
   * warning shows in development.
   */
  name: string;
  /** The image URL. Without it, the fallback shows at once. */
  src?: string;
  /** xs 24, sm 28, md 32, lg 44 px, from size.control. Default md. */
  size?: AvatarSize;
  /** default is a circle; square has the small radius, for workspaces and teams. Default default. */
  shape?: AvatarShape;
  /** Shown in the fallback in place of the initials (a workspace or a bot): a system icon name or a node. */
  icon?: IconName | ReactElement;
  /**
   * The name is already written next to the avatar: the avatar is hidden
   * from assistive tech so the name is not read twice. Default false.
   */
  decorative?: boolean;
  /** Adds the status part, a dot on the end corner, in this tone. */
  status?: AvatarStatusTone;
  /** The status in words, added to the accessible name. Default from the tone: Online, Away, Busy, Offline, or the Arabic words under an Arabic Theme. */
  statusLabel?: string;
  /** Milliseconds before the fallback shows while the image loads, so a fast image does not flash initials. Default 600 with src. */
  fallbackDelay?: number;
  /** Called when the image state changes. */
  onStateChange?: (state: AvatarState) => void;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * A round (or square) picture of a person or a workspace. The root is
 * `role="img"` named by `name`; the image inside has an empty alt, so the
 * name is read once whether the image or the initials show. With
 * `decorative`, the whole avatar is hidden from assistive tech.
 */
export function Avatar({
  name,
  src,
  size = 'md',
  shape = 'default',
  icon,
  decorative = false,
  status,
  statusLabel,
  fallbackDelay,
  onStateChange,
  style,
  ref,
  ...rest
}: AvatarProps) {
  const [state, setState] = useState<AvatarState>('loading');
  const { lang } = useTheme();
  const unnamed = name.trim() === '';
  if (process.env.NODE_ENV !== 'production' && unnamed && !decorative) {
    console.warn('Avatar: the name is empty, so the avatar is drawn as decorative. Pass the person or workspace name.');
  }
  const hidden = decorative || unnamed;
  const letters = initials(name);
  const hue = toneIndex(name);
  const words = lang.startsWith('ar') ? avatarStatusLabelAr : avatarStatusLabel;
  const statusWords = status ? (statusLabel ?? words[status]) : undefined;
  const separator = hasArabic(`${name}${statusWords ?? ''}`) ? '، ' : ', ';
  const accessibleName = statusWords ? `${name}${separator}${statusWords}` : name;
  const fallbackIcon: IconName | ReactElement | undefined = icon ?? (letters === '' ? 'user' : undefined);

  const hueStyle = {
    '--_avatar-hue': `var(--ds-color-accent-${hue})`,
    ...style,
  } as CSSProperties;

  return (
    <RadixAvatar.Root
      {...rest}
      ref={ref}
      data-ds="avatar"
      data-size={size}
      data-shape={shape}
      data-state={src ? state : undefined}
      role={hidden ? undefined : 'img'}
      aria-label={hidden ? undefined : accessibleName}
      aria-hidden={hidden ? true : undefined}
      style={hueStyle}
    >
      {src && (
        <RadixAvatar.Image
          data-part="image"
          src={src}
          alt=""
          onLoadingStatusChange={(next) => {
            const mapped: AvatarState = next === 'idle' ? 'loading' : next;
            setState(mapped);
            onStateChange?.(mapped);
          }}
        />
      )}
      <RadixAvatar.Fallback data-part="fallback" aria-hidden="true" delayMs={src ? (fallbackDelay ?? 600) : undefined}>
        {fallbackIcon === undefined ? (
          letters
        ) : typeof fallbackIcon === 'string' ? (
          <Icon name={fallbackIcon} size={iconSize[size]} />
        ) : (
          fallbackIcon
        )}
      </RadixAvatar.Fallback>
      {status && <StatusDot data-part="status" tone={status} size="sm" label={statusWords} hideLabel aria-hidden="true" />}
    </RadixAvatar.Root>
  );
}
