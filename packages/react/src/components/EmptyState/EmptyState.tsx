// EmptyState: a place with no content yet that says what to do next.
//
// Sources: Figma-Killer-2 `EmptyState/` (icon, title, description, action;
// a centered form that fills its parent; a larger size for whole panels).
// GoBanana `.st-empty` and admin `Empty` could not be read in this session;
// values come from the dials table in PLAN.md section 3.7.
//
//   <div data-ds="empty-state" data-size [role="status"]>
//     <span data-part="icon" aria-hidden="true"><svg data-ds="icon"/></span>
//     <h3 data-part="title">No boards yet</h3>
//     <div data-part="body">What to do next, and how</div>
//     <div data-part="actions"><Button/>...</div>
//
// Shares icon, title, body and actions with ErrorState (order 1.5.11), in
// the same order; ErrorState adds details and its own states.
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Size } from '@the-system/shared';

export type EmptyStateSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type EmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** sm: inside a list or a card. md: a panel. lg: a whole page or view. Default md. */
  size?: EmptyStateSize;
  /** A system icon name (16px at sm, 24px at md and lg) or a node, drawn above the title and hidden from assistive tech. */
  icon?: IconName | ReactElement;
  /** What is empty, as a heading: No boards yet. Required. */
  title: ReactNode;
  /** The heading level of the title. Default 3. */
  headingLevel?: EmptyStateHeadingLevel;
  /** The body: what to do next, and the mechanism (Create a board, or drag a file onto this page). */
  children?: ReactNode;
  /** One or two Buttons. The first is the main action, a verb plus a noun. */
  actions?: ReactNode;
  /**
   * Adds role="status", so a screen reader announces the empty state when it
   * replaces content (a search with no results, a list emptied by a filter).
   * Leave it off for a place that is empty when the page opens. Some screen
   * readers miss a region that mounts with its content; for a sure
   * announcement, mount it inside a live region already on the page.
   * Default false.
   */
  live?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** A place with no content yet: an icon, a title, what to do next, and the actions that do it. */
export function EmptyState({
  size = 'md',
  icon,
  title,
  headingLevel = 3,
  children,
  actions,
  live = false,
  ...rest
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div role={live ? 'status' : undefined} {...rest} data-ds="empty-state" data-size={size}>
      {icon !== undefined && (
        <span data-part="icon" aria-hidden="true">
          {typeof icon === 'string' ? <Icon name={icon} size={size === 'sm' ? 'md' : 'lg'} /> : icon}
        </span>
      )}
      <Heading data-part="title">{title}</Heading>
      {children != null && children !== false && <div data-part="body">{children}</div>}
      {actions != null && actions !== false && <div data-part="actions">{actions}</div>}
    </div>
  );
}
