'use client';
// TitleBar: the bar at the top of a window or a panel. The controls slot at
// the start (WindowControls in Desk), the title, then trailing actions.
//
// Source: the `.dwin-bar` title bar in GoBanana `desktop/Window.tsx` and
// `desktop/desktop.css`: the lights, then the title as a file name, no
// divider, a transparent bar. Window renders one; Dialog reuses it for the
// Desk window chrome, so it works on its own too.
//
// With `moveLabel`, the title sits in a move handle (part `move`): a focusable
// group named by the label, described by `moveHint`. A Window listens for the
// arrow keys there. This is the source's "Move window" title button, without
// a bare button: the handle is a drag surface, not an action. While the
// handle has keyboard focus the title shows in full (TitleBar.css).
//
// In right to left layouts a bar with controls keeps the lights at the top
// left and centers the title (the source, as macOS draws it). A bar with no
// controls mirrors like any other row.
import { useId, type HTMLAttributes, type ReactNode, type Ref } from 'react';

export type TitleBarHeading = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';

export interface TitleBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** The title. A string, or a node (a file name with a Bidi run). Truncates with an ellipsis. */
  title?: ReactNode;
  /** The element of the title. Default h2. Use div when the page has its own heading for this content. */
  as?: TitleBarHeading;
  /** id of the title element, so a window or dialog can point aria-labelledby at it. */
  titleId?: string;
  /** The start slot: WindowControls. */
  controls?: ReactNode;
  /** The end slot: IconButtons and small Buttons. */
  actions?: ReactNode;
  /** Whether the window has focus. Sets data-state active or inactive. Default true. */
  active?: boolean;
  /**
   * Puts the title in a focusable move handle (part `move`) named by this
   * label, for example "Move window". Leave it out for a bar that does not
   * move.
   */
  moveLabel?: string;
  /** The description of the move handle: the keys. Default "Arrow keys move the window. Shift moves it further." */
  moveHint?: string;
  ref?: Ref<HTMLDivElement>;
}

const present = (node: ReactNode) => node !== undefined && node !== null && node !== false;

/** A title bar: controls, title, actions. */
export function TitleBar({
  title,
  as: Heading = 'h2',
  titleId,
  controls,
  actions,
  active = true,
  moveLabel,
  moveHint = 'Arrow keys move the window. Shift moves it further.',
  ...rest
}: TitleBarProps) {
  const hintId = `${useId()}-move-hint`;
  const heading = (
    <Heading data-part="title" id={titleId}>
      {title}
    </Heading>
  );
  return (
    <div {...rest} data-ds="title-bar" data-state={active ? 'active' : 'inactive'}>
      {present(controls) && <div data-part="controls">{controls}</div>}
      {moveLabel ? (
        <div data-part="move" role="group" tabIndex={0} aria-label={moveLabel} aria-describedby={hintId}>
          {heading}
          <span id={hintId} hidden>
            {moveHint}
          </span>
        </div>
      ) : (
        heading
      )}
      {present(actions) && <div data-part="actions">{actions}</div>}
    </div>
  );
}
