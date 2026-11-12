'use client';
// Alert: a message about the page or a section that stays until it is fixed
// or dismissed (a form error summary, a sync problem). Hand built.
//
// Sources: Figma-Killer-2 `ui/components/Alert/` (a bordered box with a
// tone border, a bold title and a body). GoBanana `.st-alert` could not be
// read in this session; the look follows the Toast parts in this repo.
//
// Anatomy: root [data-ds=alert] with data-tone, data-emphasis and
// data-size, and the parts icon, title, body, actions and close. close is
// a CloseButton carrying data-part="close" next to its own data-ds.
//
// Live role: none by default, because an alert that is on the page when it
// loads is read with the page. `live` is for an alert mounted after load:
// role alert (assertive) for danger, role status (polite) for the rest.
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Icon } from '@the-system/icons/react';
import type { IconName } from '@the-system/icons';
import type { Emphasis, Size, Tone } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { CloseButton } from '../CloseButton';
import { messageIcons, wordsFor } from './messageTones';

export type AlertTone = Tone;
export type AlertEmphasis = Extract<Emphasis, 'soft' | 'outline' | 'solid'>;
export type AlertSize = Extract<Size, 'sm' | 'md'>;

/** Default words of the alert chrome, by language. The tone word is the accessible name of the icon. */
export const alertLabels = {
  en: {
    close: 'Dismiss alert',
    tone: { neutral: 'Notice', accent: 'Notice', info: 'Information', success: 'Success', warning: 'Warning', danger: 'Error' },
  },
  ar: {
    close: 'إغلاق الرسالة',
    tone: { neutral: 'إشعار', accent: 'إشعار', info: 'معلومة', success: 'نجاح', warning: 'تنبيه', danger: 'خطأ' },
  },
} as const;

/** No `title` attribute: the title prop is the alert's first line (a div, not a heading), and hints come from Tooltip. */
export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  /** The color, the icon and the tone word. Default neutral. */
  tone?: AlertTone;
  /** soft is a tinted box, outline a tone border on the surface, solid a full tone fill. Default soft. */
  emphasis?: AlertEmphasis;
  /** Default md. sm for a dense panel or an inspector. */
  size?: AlertSize;
  /** One line that names the problem or the result: Could not sync 3 files. Required. */
  title: ReactNode;
  /** The body: what it means and what to do next. Text, a short list or links. */
  children?: ReactNode;
  /** Buttons that fix the problem, at most two, verb plus noun. Rendered in the actions part. */
  actions?: ReactNode;
  /** A system icon name or a node in place of the tone icon. */
  icon?: IconName | ReactElement;
  /** The word the icon says to assistive tech. Default the tone word in the page language (Error, Warning). */
  toneLabel?: string;
  /**
   * The alert is mounted after the page loaded and must be announced: role
   * alert for danger, role status for the other tones. Leave it off for an
   * alert that is on the page at load. Default false.
   */
  live?: boolean;
  /** Renders the close button and is called by it. Without it the alert has no close button. */
  onClose?: () => void;
  /** The accessible name of the close button. Default "Dismiss alert", or Arabic under lang ar. */
  closeLabel?: string;
  ref?: Ref<HTMLDivElement>;
}

/** A message about the page or a section that stays until it is fixed or dismissed. */
export function Alert({
  tone = 'neutral',
  emphasis = 'soft',
  size = 'md',
  title,
  children,
  actions,
  icon,
  toneLabel,
  live = false,
  onClose,
  closeLabel,
  lang,
  ...rest
}: AlertProps) {
  const theme = useTheme();
  const words = wordsFor(alertLabels, lang ?? theme.lang);
  const role = live ? (tone === 'danger' ? 'alert' : 'status') : undefined;
  // An empty toneLabel falls back to the tone word: the icon always has a name.
  const word = toneLabel || words.tone[tone];
  return (
    <div
      {...rest}
      lang={lang}
      role={role}
      aria-atomic={role === 'status' ? true : rest['aria-atomic']}
      data-ds="alert"
      data-tone={tone}
      data-emphasis={emphasis}
      data-size={size}
    >
      {icon === undefined || typeof icon === 'string' ? (
        <span data-part="icon">
          <Icon name={icon ?? messageIcons[tone]} size="md" label={word} />
        </span>
      ) : (
        // A node in place of the icon: the part carries the tone word, so the node may stay decorative.
        <span data-part="icon" role="img" aria-label={word}>
          {icon}
        </span>
      )}
      <div data-part="title">{title}</div>
      {children !== undefined && children !== null && children !== '' && <div data-part="body">{children}</div>}
      {actions !== undefined && actions !== null && <div data-part="actions">{actions}</div>}
      {onClose && (
        <CloseButton data-part="close" label={closeLabel ?? words.close} size="xs" onClick={onClose} />
      )}
    </div>
  );
}
