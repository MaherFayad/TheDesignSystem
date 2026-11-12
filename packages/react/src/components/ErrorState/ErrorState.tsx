'use client';
// ErrorState: a section or page that failed to load, with a way forward.
//
// Sources: Figma-Killer-2 `ui/components/EmptyState/` (the centered column,
// icon above title above description above action). GoBanana (`.st-empty`,
// `LoadError`, `NotFoundView`) was not reachable from the lane session.
//
// Anatomy: root [data-ds=error-state] with data-size and data-state (error,
// retrying), and the parts icon, title, body, actions (the retry Button
// first, carrying data-part="retry"), details (a native disclosure), summary
// (its toggle) and code (the error code). EmptyState follows the same parts.
//
// The disclosure is a native details element: it needs no script, it is
// keyboard ready, and its summary is not a bare button. The refresh icon on
// retry is a circle and is not mirrored in RTL.
import { useId, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import type { Size } from '@the-system/shared';
import type { IconName } from '@the-system/icons';
import { Icon } from '@the-system/icons/react';
import { Button } from '../Button';

export type ErrorStateSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** Default words, by language. */
export const errorStateLabels = {
  en: {
    retry: 'Retry loading',
    retrying: 'Retrying',
    details: 'Error details',
    code: 'Error code',
  },
  ar: {
    retry: 'إعادة التحميل',
    retrying: 'جار إعادة المحاولة',
    details: 'تفاصيل الخطأ',
    code: 'رمز الخطأ',
  },
} as const;

/** The direction of a language tag, for an ErrorState whose copy is not in the page language. */
function dirFor(lang: string | undefined): 'ltr' | 'rtl' | undefined {
  if (lang === undefined) return undefined;
  return /^(ar|fa|he|ur)(-|$)/i.test(lang) ? 'rtl' : 'ltr';
}

function labelsFor(lang: string | undefined) {
  return lang !== undefined && /^ar(-|$)/i.test(lang) ? errorStateLabels.ar : errorStateLabels.en;
}

/** No `title` attribute: the title prop is the heading, and hints come from Tooltip. */
export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** What happened, naming the thing: Could not load members. */
  title: ReactNode;
  /** What to do next, and what is safe. */
  body?: ReactNode;
  /** A system icon name, a node, or false for none. Default "alert-circle". */
  icon?: IconName | ReactNode | false;
  /** The language of the copy when it differs from the page. Sets lang, dir and the default words. */
  lang?: string;
  /** Default md: a section. sm sits in a card or a panel, lg fills a page. */
  size?: ErrorStateSize;
  /** The heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Renders the retry Button first in the actions and is called by it. */
  onRetry?: () => void;
  /** The retry label: a verb plus a noun. Default "Retry loading", Arabic under lang ar. */
  retryLabel?: string;
  /** A retry is in flight: data-state="retrying" and the retry Button shows loading. Default false. */
  retrying?: boolean;
  /** The words the retry Button's hidden status says while retrying. Default "Retrying". */
  retryingLabel?: string;
  /** More actions after retry, Buttons with a verb plus a noun: Go to home. */
  actions?: ReactNode;
  /** The error code, shown inside the details disclosure: ERR_TIMEOUT 504. */
  code?: string;
  /** More detail inside the disclosure, after the code. */
  details?: ReactNode;
  /** The disclosure toggle. Default "Error details". */
  detailsLabel?: string;
  /** Renders the details open at first. Default false. */
  detailsOpen?: boolean;
  /**
   * Makes the root role="alert", so an error that replaces content after
   * load is read once (aria-atomic false, so the retry Button's status does
   * not read the whole error again). Default true. Set false for an error
   * present when the page loads; the root is then a group named by the title.
   */
  live?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function ErrorState({
  title,
  body,
  icon = 'alert-circle',
  size = 'md',
  headingLevel = 2,
  onRetry,
  retryLabel,
  retrying = false,
  retryingLabel,
  actions,
  code,
  details,
  detailsLabel,
  detailsOpen = false,
  live = true,
  lang,
  ...rest
}: ErrorStateProps) {
  const titleId = useId();
  const words = labelsFor(lang);
  const Heading = `h${headingLevel}` as const;
  const hasActions = onRetry !== undefined || actions !== undefined;
  const hasDetails = (code !== undefined && code !== '') || details !== undefined;
  return (
    <div
      role={live ? 'alert' : undefined}
      aria-labelledby={live ? undefined : titleId}
      {...rest}
      lang={lang}
      dir={rest.dir ?? dirFor(lang)}
      data-ds="error-state"
      data-size={size}
      data-state={retrying ? 'retrying' : 'error'}
    >
      {icon !== false && (
        <span data-part="icon" aria-hidden="true">
          {typeof icon === 'string' ? <Icon name={icon as IconName} size={size === 'lg' ? 'lg' : 'md'} /> : icon}
        </span>
      )}
      <Heading id={titleId} data-part="title">
        {title}
      </Heading>
      {body !== undefined && body !== '' && <p data-part="body">{body}</p>}
      {hasActions && (
        <div data-part="actions">
          {onRetry !== undefined && (
            <Button
              data-part="retry"
              tone="accent"
              emphasis="solid"
              size={size === 'sm' ? 'sm' : 'md'}
              start="refresh"
              loading={retrying}
              loadingLabel={retryingLabel ?? words.retrying}
              onClick={onRetry}
            >
              {retryLabel ?? words.retry}
            </Button>
          )}
          {actions}
        </div>
      )}
      {hasDetails && (
        <details data-part="details" open={detailsOpen || undefined}>
          <summary data-part="summary">
            {detailsLabel ?? words.details}
            <Icon name="chevron-down" size="sm" />
          </summary>
          {code !== undefined && code !== '' && (
            <p data-part="code">
              {words.code}: <code dir="ltr">{code}</code>
            </p>
          )}
          {details}
        </details>
      )}
    </div>
  );
}
