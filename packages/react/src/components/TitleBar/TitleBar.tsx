'use client';
// TitleBar: the bar at the top of a window or a panel. The controls slot at
// the start (WindowControls in Desk), the title, then trailing actions.
//
// Source: the `.dwin-bar` title bar in GoBanana `desktop/Window.tsx` and
// `desktop/desktop.css`: the lights, then the title as a file name, no
// divider. Window renders one; Dialog reuses it for the Desk window chrome,
// so it works on its own too.
//
// In right to left layouts a bar with controls keeps the lights at the top
// left and centers the title (the source, as macOS draws it). A bar with no
// controls mirrors like any other row.
import type { HTMLAttributes, ReactNode, Ref } from 'react';

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
  ref?: Ref<HTMLDivElement>;
}

/** A title bar: controls, title, actions. */
export function TitleBar({ title, as: Heading = 'h2', titleId, controls, actions, active = true, ...rest }: TitleBarProps) {
  return (
    <div {...rest} data-ds="title-bar" data-state={active ? 'active' : 'inactive'}>
      {controls !== undefined && controls !== null && controls !== false && <div data-part="controls">{controls}</div>}
      <Heading data-part="title" id={titleId}>
        {title}
      </Heading>
      {actions !== undefined && actions !== null && actions !== false && <div data-part="actions">{actions}</div>}
    </div>
  );
}
