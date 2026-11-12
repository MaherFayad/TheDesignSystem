'use client';
// Callout: a static note inside content (a tip, a caution in docs). Hand
// built, with no live role: it is read in reading order with the content
// around it.
//
// Sources: Figma-Killer-2 `ui/components/Alert/` (the static box), the
// Alert in this repo for the icon column and the tone words. GoBanana
// `.st-alert` could not be read in this session.
//
// Anatomy: root [data-ds=callout] with data-tone and data-emphasis, and the
// parts icon, title and body. The root is a div with role note, or an aside
// with `as="aside"`. Either way it is named by the tone word on the icon and
// the title, so the name reads "Tip: Use the keyboard".
import { useId, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { Icon } from '@the-system/icons/react';
import type { IconName } from '@the-system/icons';
import type { Emphasis, Tone } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { messageIcons, wordsFor } from '../Alert/messageTones';

export type CalloutTone = Tone;
export type CalloutEmphasis = Extract<Emphasis, 'soft' | 'outline'>;

/** The tone word of each tone, by language. It is the accessible name of the icon and starts the callout's name. */
export const calloutLabels = {
  en: { tone: { neutral: 'Note', accent: 'Tip', info: 'Information', success: 'Success', warning: 'Warning', danger: 'Caution' } },
  ar: { tone: { neutral: 'ملاحظة', accent: 'نصيحة', info: 'معلومة', success: 'نجاح', warning: 'تنبيه', danger: 'تحذير' } },
} as const;

/** No `title` attribute: the title prop is the callout's heading, and hints come from Tooltip. */
export interface CalloutProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'role'> {
  /** The color, the icon and the tone word. Default neutral. */
  tone?: CalloutTone;
  /** soft is a tinted box, outline a tone border on the surface. Default soft. */
  emphasis?: CalloutEmphasis;
  /** A short line that sums up the note. Optional: without it the tone word names the callout. */
  title?: ReactNode;
  /** The note: text, paragraphs, a short list, links or code. */
  children?: ReactNode;
  /** A system icon name or a node in place of the tone icon. */
  icon?: IconName | ReactElement;
  /** The word the icon says. Default the tone word in the page language (Note, Tip, Caution). */
  toneLabel?: string;
  /**
   * div renders role note, for a note inside running content. aside renders
   * a complementary landmark, for a note beside the main content that a
   * person may want to jump to. Default div.
   */
  as?: 'div' | 'aside';
  ref?: Ref<HTMLElement>;
}

/** A static note inside content. */
export function Callout({
  tone = 'neutral',
  emphasis = 'soft',
  title,
  children,
  icon,
  toneLabel,
  as = 'div',
  lang,
  id,
  ref,
  ...rest
}: CalloutProps) {
  const theme = useTheme();
  const words = wordsFor(calloutLabels, lang ?? theme.lang);
  const word = toneLabel ?? words.tone[tone];
  const auto = useId();
  const base = id ?? `ds-callout-${auto.replace(/:/g, '')}`;
  const iconId = `${base}-icon`;
  const titleId = `${base}-title`;
  const hasTitle = title !== undefined && title !== null && title !== '';
  const Root = as;
  return (
    <Root
      {...rest}
      // One element type per `as`; both are HTMLElements, so the ref fits either.
      ref={ref as Ref<HTMLDivElement>}
      id={id}
      lang={lang}
      role={as === 'div' ? 'note' : undefined}
      aria-labelledby={rest['aria-label'] !== undefined ? undefined : hasTitle ? `${iconId} ${titleId}` : iconId}
      data-ds="callout"
      data-tone={tone}
      data-emphasis={emphasis}
    >
      {icon === undefined || typeof icon === 'string' ? (
        <span data-part="icon">
          <Icon id={iconId} name={icon ?? messageIcons[tone]} size="md" label={word} />
        </span>
      ) : (
        // A node in place of the icon: the part carries the tone word, so the node may stay decorative.
        <span data-part="icon" id={iconId} role="img" aria-label={word}>
          {icon}
        </span>
      )}
      {hasTitle && (
        <div data-part="title" id={titleId}>
          {title}
        </div>
      )}
      {children !== undefined && children !== null && children !== '' && <div data-part="body">{children}</div>}
    </Root>
  );
}
