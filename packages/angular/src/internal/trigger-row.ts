// A List row as the trigger of an overlay (order C5 item 4, C6 item 5;
// anatomy.md, "List row as a trigger"). The Angular form of React's
// splitTrigger in packages/react/src/components/List/List.tsx.
//
//   <li dsListItem dsActionSheetTrigger title="Remove pass" tone="danger"></li>
//   <li dsListItem dsDialogTrigger title="Rename board"></li>
//
// A trigger directive put on the same `li[dsListItem]` finds the row here
// (self only, so a trigger on a button inside the row's actions is an
// ordinary trigger). It then stamps nothing on the li: the row becomes an
// action row and draws the trigger's id, aria-haspopup, aria-expanded,
// aria-controls and data-state on its title, which takes the button role
// and the trigger's handlers; the owner's trigger element (focus return,
// the anchor of an anchored overlay) is the title. A linked row or a
// control row is never a trigger: put the trigger on a button in its
// actions.
import { effect, inject, type Signal } from '@angular/core';

/** What a trigger draws on the row's title. */
export interface TriggerRowAttrs {
  id: string | null;
  haspopup: string;
  expanded: boolean;
  controls: string | null;
  state: 'open' | 'closed';
}

/** The trigger's handlers, run on the title. The row runs none while it is disabled. */
export interface TriggerRowHandlers {
  click?: (event: MouseEvent) => void;
  keydown?: (event: KeyboardEvent) => void;
  pointerdown?: (event: PointerEvent) => void;
}

/** A row that can carry a trigger. DsListItem provides it. */
export abstract class TriggerRow {
  /** The row's action title while it is rendered. */
  abstract readonly titleElement: Signal<HTMLElement | null>;
  /** Makes the row the trigger. */
  abstract connect(attrs: () => TriggerRowAttrs, handlers: TriggerRowHandlers): void;
}

/** The row this trigger sits on, or null when the trigger's element is not a List row. */
export function injectTriggerRow(): TriggerRow | null {
  return inject(TriggerRow, { self: true, optional: true });
}

/** Keeps the owner's trigger element on the row's title while it is rendered. Call in an injection context. */
export function followTriggerTitle(row: TriggerRow, set: (el: HTMLElement) => void): void {
  effect(() => {
    const title = row.titleElement();
    if (title) set(title);
  });
}
