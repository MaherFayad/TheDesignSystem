# Lane 8C: Panes

Branch `claude/ds-lane-8c`. Built in order: ScrollArea (1.8.7),
ResizablePanels (1.8.8), SplitView (1.8.9). PageShell (1.8.12) is not built:
it needs SkipLink (1.7.11) and Drawer, and neither is on the base branch (see
"What I could not do").

For each built component: `npm run check` is green,
`npm run contract -- --framework react --component <Name>` is green (21
passed, 0 failed, 0 skipped), and screenshots are in
`docs/reports/shots/wave-1/<slug>/` (studio dark and light, desk dark and
light, desk dark rtl ar). Extra shots: `resizable-panels/studio-light-focus.png`
(a handle with keyboard focus after two arrows) and `split-view/*-360.png`
(360px wide, where the auto layout stacks).

Sources: Figma-Killer-2 was cloned and read (`FilterBar.tsx` for the edge
fades). GoBanana was not attached in this session, so `TableScroll`,
`MailApp.tsx` and `desktop.css` were not read. The file headers say so, and
the designs follow the order, the dials table and the token scale.

Every component had one fresh eyes review by a separate claude-opus-5-5
agent at medium effort; the findings and what was done are listed per
component.

## ScrollArea (wo-1.8.7)

Radix ScrollArea: native scrolling, Radix hides the native bars and draws
its own, the vertical bar on the inline end (left in RTL). Edge fades on the
side that still has content, as in FK2 FilterBar.

```ts
interface ScrollAreaProps extends Omit<ComponentProps<'div'>, 'dir'> {
  orientation?: 'vertical' | 'horizontal' | 'both';   // default vertical; data-orientation
  size?: 'sm' | 'md';                                  // default md; scrollbar 4px or 6px
  scrollbars?: 'auto' | 'always' | 'scroll' | 'hover'; // default auto (the Radix type)
  fades?: boolean;                                     // default true
  label?: string;          // name of the focusable viewport; default "Scrollable content" / محتوى قابل للتمرير
  focusable?: boolean | 'auto';                        // default auto
  viewportRef?: Ref<HTMLDivElement>;
  onScroll?: UIEventHandler<HTMLDivElement>;
}
```

States on the root: `data-orientation`, `data-overflow-start`,
`data-overflow-end`. Parts: viewport, scrollbar, thumb, corner, fade-start,
fade-end.

Decisions:

- The viewport joins the tab order (tabindex 0, role region, named) only
  when its content overflows and nothing inside can take focus. With
  focusable children the browser scrolls them into view.
- Default `scrollbars="auto"`, not the Radix default hover: a visible bar
  says the area scrolls.
- The fades are overlay parts that fade into `--_scroll-area-fade-color`,
  the body color by default. A mask on the viewport would not need a color,
  but the order asks for fade parts, and only opacity may animate. A parent
  on another surface sets the private property from its own CSS.
- With `both`, fades and overflow states follow the block axis only.
- The focus ring is the root's outline, outside the root, so the fades and
  the scrollbar cannot cover it.
- Motion: `fade-rise` (its opacity half) for the fades.

Review: fixed the three blockers (aria-label on a div with no role, the
focus ring covered by the fades, the thumb hover writing `background`
instead of swapping a property) and the notes on fade opacity as a property,
focusable only on overflow, `summary` and `[inert]` in the focusable check,
the wide notes label. Left open: the thumb contrast (token question below),
the private names `-ring-color` and `-ring-width` (the ring is an outline,
not a shadow, so the contract's `-ring` does not fit; written in the CSS
header).

## ResizablePanels (wo-1.8.8)

Hand built on the WAI-ARIA window splitter. The math is pure TypeScript in
`packages/shared/src/resize.ts` (`panelLimits`, `evenSizes`, `clampSizes`,
`resizeBy`, `resizeToEdge`, `collapseTarget`, `collapsePanel`,
`expandPanel`, `isCollapsed`, `roundSizes`, `RESIZE_STEP`), with
`resize.test.ts`.

```ts
interface ResizablePanelsProps extends Omit<ComponentProps<'div'>, 'dir' | 'onChange'> {
  orientation?: 'horizontal' | 'vertical';   // default horizontal (side by side)
  sizes?: number[];                          // controlled, percent
  defaultSizes?: number[];
  onSizesChange?: (sizes: number[]) => void; // every change, during a drag too
  onLayout?: (sizes: number[]) => void;      // settled: drag end, each key
  step?: number;                             // default 5 (percent)
}
interface ResizablePanelProps extends ComponentProps<'div'> {
  defaultSize?: number; min?: number; max?: number;      // percent; min 0, max 100
  collapsible?: boolean; collapsedSize?: number;         // default false, 0
}
interface ResizableHandleProps extends Omit<ComponentProps<'div'>, 'children'> {
  label?: string;   // default "Resize panels" / تغيير حجم الأقسام
}
```

Keys on a handle: ArrowLeft and ArrowRight (horizontal, on screen, so they
flip in RTL) or ArrowUp and ArrowDown (vertical) by the step; Home and End
to the far ends; Enter collapses the collapsible panel next to it and
restores its last size; an arrow that grows a collapsed panel opens it. A
double click does what Enter does. `contract.keys` hints: arrows, Home, End
and Enter as `value-changes`.

Decisions:

- Sizes are flex grow factors on a 0 basis, so the 1px handles come out of
  the room first.
- The handle takes 1px of layout and spreads its 24px target over both
  panels with negative margins. The root isolates its stacking and the
  handle sits on `z.dropdown` inside it, so the next panel cannot paint over
  the target. No token names that layer (gap below).
- A panel collapsed to 0 is `inert`, so its controls leave the tab order.
- A cancelled drag puts the sizes back; a press with no move reports no
  layout. No storage in the component: `onLayout` is the persistence hook.
- `aria-valuemin` and `aria-valuemax` are what Home and End reach.
- Children may sit inside fragments and arrays; a panel wrapped in another
  component is not found (manifest note).
- Motion: `drag-drop`. Sizes never animate; only the grip fades.

Review: fixed the three blockers (a collapsible panel with min 0 never
counted as collapsed, panels inside fragments lost their index, the rest
line at `border.subtle` was under 3:1, now `border.control`) and the notes
on valuemin and valuemax, cancel and no move drags, `expandPanel` leaving a
panel under its min, a case that starts collapsed with a rail, the cut
titles in too-many, and the native framework block. Left open: the 24px
target reaches 11.5px into each panel, so the focus ring can sit over panel
content at the edge (manifest note).

## SplitView (wo-1.8.9)

Built on the ResizablePanels group. `ResizablePanels.tsx` exports the base
`PanelGroup` (props of ResizablePanels plus `ds` and `panelParts`), and
SplitView renders it under `data-ds="split-view"` with the panes as parts
`primary` and `secondary`. Following rule 10 of anatomy.md, the shared rules
live in `ResizablePanels.css` (selectors on both roots); `SplitView.css` is
the thin file for what differs.

```ts
interface SplitViewProps extends Omit<ComponentProps<'div'>, 'dir'> {
  primary: ReactNode;                 // the list
  secondary: ReactNode;               // the detail or an empty state
  showSecondary?: boolean;            // controlled, with onShowSecondaryChange
  defaultShowSecondary?: boolean;     // default false
  onShowSecondaryChange?: (show: boolean) => void;
  layout?: 'auto' | 'split' | 'stacked';  // default auto: split from 48rem of its own width
  defaultSizes?: [number, number];    // default [35, 65]
  onLayout?: (sizes: number[]) => void;
  primaryMin?: number;                // default 25
  primaryMax?: number;                // default 50
  secondaryMin?: number;              // default 35
  primaryLabel?: string;              // pane region name; default "List" / القائمة
  secondaryLabel?: string;            // default "Detail" / التفاصيل
  handleLabel?: string;               // default "Resize list" / تغيير حجم القائمة
  backLabel?: string;                 // default "Return to list" / الرجوع للقائمة
}
export function splitViewState(layout, width, rootFontPx, showSecondary): 'split' | 'primary' | 'secondary';
```

Decisions:

- The width is the root's own (ResizeObserver), not the window's, so a
  SplitView in a narrow window or panel stacks there.
- Both panes stay mounted while stacked; the hidden one has `hidden`, so the
  list keeps its scroll position.
- Stacked: focus moves into the detail when it opens; back returns focus to
  the last element focused in the list (the item that opened the detail),
  else the list pane. Narrowing into stacked with focus in the pane that
  hides moves focus to the pane that stays.
- The 48rem check uses 16px per rem, as media queries do. The first render,
  before the width is measured and on the server, is split (manifest note).
- `contract.keys` hints for the handle arrows, Home and End, as on
  ResizablePanels.
- Anatomy adds `handle-grip`: the grip of the shared handle is owned by the
  SplitView root, so the manifest lists it.
- The back Button is a system Button (`data-ds="button"`, `data-part="back"`,
  start icon `arrow-back`, which mirrors in RTL).

Review: no blockers. Fixed the notes on recording the opener (now the last
focus in the list), focus left in a pane that hides, unnamed panes (default
names now), the back label (a verb: Return to list), the Arabic imperative
(اختار, dialect), the full token list, the key hints, and the rem base.
Noted in the CSS header: a pane's focus is an outline inside it, not a
`::before` layer, since a layer would sit under the pane's scrolling content.
Left open: SplitView imports `useControllable` from the Window folder (see
"Changes needed from the lead").

## PageShell (wo-1.8.12): not built

The order's anatomy makes `skip` a SkipLink root and the sidebar a Drawer
under `breakpoint.tablet`. Neither exists on `claude/relaxed-hypatia-7gseap`:
SkipLink is on the unmerged branch `claude/ds-lane-7c`, and no branch has a
Drawer. The brief says to skip a component that truly needs one that does
not exist, so PageShell waits for 1.7.11 and Drawer to merge.

## Token gaps

- `scrollbar.size.sm`: ScrollArea sm is `calc(scrollbar.size * 2 / 3)`.
- A z token for a layer that sits just above its siblings inside an
  isolated group (`z.raised` or `z.handle`). The handle uses `z.dropdown`.
- `scrollbar.thumb` contrast: about 2.3:1 on Studio light and 2.7:1 on
  Studio dark, under 3:1 (WCAG 1.4.11). The thumb is a pointer aid and the
  keyboard path does not need it, but base.css native scrollbars use the
  same tokens, so it is a token change for ds-tokens.

## Changes needed from the lead

- Run `npm run gen` on merge (the barrels, `packages/css/src/index.css`,
  `routes.gen.ts` and `manifests.gen.json` were regenerated and committed on
  this branch, but the lead's merge with other lanes needs a fresh run).
- `packages/shared/src/index.ts` gains `export * from './resize';` through
  gen.
- Route the token questions above to ds-tokens.
- Move `packages/react/src/components/Window/useControllable.ts` to a shared
  place (for example `packages/react/src/internal/useControllable.ts`) and
  update its importers: Window, Dialog and now SplitView
  (`SplitView.tsx`, the line `import { useControllable } from '../Window/useControllable';`).
  It is a private helper of another component today; Dialog already
  imports it the same way.

## What I could not do

- PageShell, as above.
- GoBanana sources were not read.
