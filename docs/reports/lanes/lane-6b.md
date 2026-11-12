# Lane 6B report: Floating

Branch `claude/ds-lane-6b`. Orders 1.6.5 Popover, 1.6.6 Tooltip, 1.6.7
HoverCard and 1.6.13 Tour, built in that order. One commit per component:

| Commit | Order | Component |
| --- | --- | --- |
| `wo-1.6.5: Popover` | 1.6.5 | Popover |
| `wo-1.6.6: Tooltip` | 1.6.6 | Tooltip |
| `wo-1.6.7: HoverCard` | 1.6.7 | HoverCard |
| `wo-1.6.13: Tour` | 1.6.13 | Tour |

Each component passed, before its commit: its unit tests, `npm run check`,
`npm run contract -- --framework react --component <Name>` (Popover 31,
Tooltip 21, HoverCard 31, Tour 31 checks, none failed or skipped),
screenshots in studio dark and light, desk dark and light, and desk dark
`dir=rtl&lang=ar` (in `docs/reports/shots/wave-1/<slug>/`), and one fresh
eyes review by a subagent. The generated files (barrels, `index.css`,
`manifests.gen.json`, `routes.gen.ts`) are committed as `npm run gen` wrote
them in the last commit; the lead regenerates on merge.

Setup: `npm install` and `npm run check` were green before any change.

Sources: GoBanana could not be fetched (adding the private repo was denied
in this session). Figma-Killer-2 was cloned and read (`Tooltip/`,
`InspectorPopover/`). Popover and Tooltip take their look from FK2 and the
dials table; HoverCard and Tour have no source by order. Each manifest says
so.

## Shared helper

`packages/react/src/components/Popover/FloatingLayer.tsx` (private, not in
the barrel) serves all four components:

- `ThemedPortal`: a portal on `<body>` that starts with a Theme copying
  every axis of the current Theme (the Dialog and Toaster pattern). It
  carries `data-<layer>-layer`; each component CSS makes it
  `display: contents`.
- `useLayerPresence(open)`: keeps the portal mounted until the Radix content
  has played its exit and left the DOM. Nothing waits on `animationend`;
  under reduced motion the animations are none.
- `physicalSide(side, dir)`: the public `side` prop is logical (`top`,
  `bottom`, `start`, `end`); `start` is the right side in Arabic. `align`
  needs no mapping: floating-ui reads the content's direction and mirrors it.
- `ArrowShape`: an SVG whose fill is the surface and whose stroke draws only
  the two outer edges, so the arrow joins the bordered surface cleanly.

## 1.6.5 Popover

Radix Popover, not modal. Root is the Radix Content (`data-ds="popover"`,
role dialog) with parts `arrow`, `title`, `close`, `body`, `footer`.

```tsx
<Popover open? defaultOpen?={false} onOpenChange? size?="md" /* sm | md | lg */>
  <PopoverTrigger><Button>Rename layer</Button></PopoverTrigger>
  <PopoverAnchor />                         {/* optional: position against another element */}
  <PopoverContent
    title?                                   // or <PopoverTitle> as a child
    side?="bottom"                           // top | bottom | start | end
    align?="center"                          // start | center | end
    sideOffset?={8}
    arrow?={true}
    close?={true}
    closeLabel?="Close popover"              // Arabic: إغلاق النافذة
    hideWhenDetached?={false}
    {...RadixContentProps} ref className style>
    <PopoverBody>...</PopoverBody>
    <PopoverFooter><PopoverClose><Button>Cancel rename</Button></PopoverClose></PopoverFooter>
  </PopoverContent>
</Popover>
```

Decisions:

- Focus on open: `data-autofocus`, else the first field in the body (inputs,
  selects, textareas and switch, checkbox, radio, combobox, slider roles),
  else the first footer action, else the root. Never the close control
  first. `dialogInitialFocus` from `dialog-focus.ts` was not reused: it
  keys on `[data-part="panel"]`, which a popover does not have.
- Focus return: Radix returns to the trigger; with only a `PopoverAnchor`,
  focus goes back to the element that had it on open.
- z-index `z.menu` (9800): above a Dialog (9500), below toasts (10000).
- Widths: sm 240 (`tooltip.width.max`), md 320 (`menu.width.min` times 1.6),
  lg 440 (`dialog.width.md`). See token gaps.
- Desk: glass recipe (`packages/styles/desk/recipes/Popover.css`), the same
  material as Desk toasts.
- Motion `menu-scale`: grows from 97% (`scale.press`) out of the Radix
  transform origin and moves 4px away from the trigger.

Review: no blockers. Fixed: the wider field selector, a stable ref callback
(an inline consumer ref no longer unmounts the portal mid exit), the anchor
only focus return, `hideWhenDetached` as an opt in prop, the Tab wording in
the manifest (the popover renders at the end of the page, so Tab past it
leaves the page content), the `data-side` note, the Arabic close label (was a
calque), demo copy, four more tests. Left open: Tab out of the last control
does not jump back to the trigger (manifest says so); the enter scale
borrows `scale.press` (token gap below).

## 1.6.6 Tooltip

Radix Tooltip. Root is the Radix Content (`data-ds="tooltip"`, role
tooltip), parts `arrow` and `shortcut`.

```tsx
<TooltipProvider delayDuration?={500} skipDelayDuration?={300}>   {/* one near the app root */}
  <Tooltip
    content="Copy link"                      // required: describes, never names
    shortcut?="Ctrl+L"                       // text until Kbd (1.9.5) exists; always ltr
    side?="top" align?="center" sideOffset?={6} arrow?={true}
    open? defaultOpen?={false} onOpenChange?
    delayDuration?                           // from the provider by default
    disabled?={false}                        // trigger stays mounted, tooltip off
    className? style? ref? contentProps?>
    <IconButton icon="link" label="Copy link" />
  </Tooltip>
</TooltipProvider>
```

Decisions:

- A Tooltip with no `TooltipProvider` above it renders its own, so it always
  works (each then keeps its own delay). See changes needed: a provider in
  Theme.
- WCAG 1.4.13: hoverable (no `pointer-events: none`), dismissable (Escape,
  focus stays on the trigger), persistent.
- Never the only name: the trigger keeps its label. When the hint is the
  same string as the trigger's `label` or `aria-label` (the IconButton case)
  it is not wired as `aria-describedby`, so it is not read twice. Dev builds
  warn once when a trigger has no name.
- `hideWhenDetached` on by default: a tooltip never floats on alone.
- The shortcut keys sit in `<bdi dir="ltr">` inside the part, so the part
  keeps the parent's direction and its logical margin works in Arabic.
- States: the Radix values `delayed-open`, `instant-open`, `closed`. Because
  a click closes a tooltip, the contract suite's click trigger does not fit;
  the demo shows some tooltips open with the `open` prop (static examples),
  next to live ones. `contract.trigger` is not set.
- Native: `not-applicable` (nothing hovers on touch).
- Motion `fade-rise`: fades in on `duration.fast` while moving 4px away.

Review: one blocker, fixed. Toggling `disabled` returned the bare child,
which remounted the trigger and lost focus; Root and Trigger now always
render. Also fixed: the unnamed trigger warning (once, non empty strings
only), the double read of a repeated label, `TooltipProvider` moved out of
`props` into the react note, `user-select: none` removed, the forced colors
shadow, the studio motion wording, demo copy (Arabic hint now in noun form).
Left open: tests for hover onto the tooltip and Escape inside an open
Popover.

## 1.6.7 HoverCard

Radix HoverCard. Root is the Radix Content (`data-ds="hover-card"`), parts
`arrow` and `body` (children go in the body).

```tsx
<HoverCard open? defaultOpen?={false} onOpenChange? size?="md" /* sm | md */
           openDelay?={500} closeDelay?={300}>
  <HoverCardTrigger><a href="/people/sara">Sara Ahmed</a></HoverCardTrigger>
  <HoverCardContent side?="bottom" align?="start" sideOffset?={8} arrow?={true}
                    hideWhenDetached?={true} {...RadixContentProps}>
    ...preview...
  </HoverCardContent>
</HoverCard>
```

Decisions:

- Keyboard focus on the trigger opens at once; Radix waits `openDelay` on
  focus as on hover, so the trigger sets open on focus itself.
- Radix sets `tabindex="-1"` on links inside the card: the card is never the
  only way to reach them (manifest note and `avoidWhen`).
- The demo uses `openDelay={0}` and real links in running text, with
  `data-demo-trigger`, so the contract suite opens a card with one hover and
  the inline exception of the target size check applies.

Review: one blocker, fixed. The docs said focus opens at once while Radix
delayed it; focus now opens at once, with a fake timer test. Also fixed: the
role text (no role), a note on scrolling cards, a dead reduced transparency
block, an RTL `side="end"` row in the demo, the handle in `<bdi>`. Left open:
tests for blur close and the hoverable move onto the card.

## 1.6.13 Tour

Radix Popover anchored to each step's target through a virtual anchor.

```tsx
<Tour
  steps={[{ target: '#share' /* selector | ref | () => element */, title: 'Share with your team',
            body?: '...', side?: 'bottom', align?: 'center' }]}
  open? defaultOpen?={false} onOpenChange?
  step? defaultStep?={0} onStepChange?
  onFinish?
  size?="md"                                 // sm | md
  labels?={{ next, back, skip, finish, progress: (current, total) => string }}
  className? style? />
```

Anatomy, changed from the order with the reason: root (`data-ds="tour"`, a
fixed layer over the viewport that takes no pointer), `highlight`, `panel`
(the Radix Content, role dialog), `arrow`, `title`, `body`, `footer`,
`progress`, `skip`, `back`, `next`. The ring must sit outside the Radix
wrapper (positioned with a transform) and still belong to the tour, as
Dialog's backdrop does; so the root is the layer and the content is part
`panel`. `footer` is the row for progress and buttons.

Decisions:

- Never blocks the page: no backdrop, the root and the ring take no pointer,
  an outside click or focus does not end the tour. Skip tour is on every
  step. Escape ends it.
- Focus moves to the panel on open and on every step (title, body and
  progress are read); it returns to the element that had it on start.
- The target scrolls into view on each step: smooth, or `auto` under reduced
  motion. The ring follows the target on scroll, resize and its own resize,
  in logical coordinates (RTL measured from the right edge).
- A missing target: the step shows in the middle of the viewport, with no
  ring and no arrow.
- Step state is local (`clampStep`), because `packages/shared/src/stepper.ts`
  (1.7.7, lane 4B) does not exist in this checkout. The props will not change
  when Tour moves onto it.
- Labels: Next step, Previous step, Skip tour, Finish tour, "Step 2 of 4";
  Arabic الخطوة التالية، الخطوة السابقة، تخطي الجولة، إنهاء الجولة، "الخطوة 2 من 4".

Review: see "Tour review" below.

## Token gaps

| Need | Used now | Proposed token |
| --- | --- | --- |
| Popover, HoverCard and Tour widths | `tooltip.width.max` (240), `calc(menu.width.min * 1.6)` (320), `dialog.width.md` (440) | `popover.width.sm`, `.md`, `.lg` |
| Enter scale of a menu or popover | `scale.press` (0.97, the GoBanana menu enter value) | `scale.menu-enter` |
| Layer of popovers, hover cards and tours | `z.menu` | `z.popover` (same value) if the lead wants it named |
| Tooltip radius | `radius.sm` | `tooltip.radius` if a style must differ |

## Changes needed from the lead

1. **IconButton shows its label in a Tooltip by default** (order 1.6.6
   acceptance). In `packages/react/src/components/IconButton/IconButton.tsx`:
   - Add to the imports: `import { Tooltip } from '../Tooltip';`
   - Add to `IconButtonProps`:
     ```ts
     /**
      * Shows the label in a Tooltip on hover and focus. Default true. false:
      * no tooltip (an IconButton already inside a labelled toolbar hint).
      */
     tooltip?: boolean;
     ```
   - Replace the function (lines 34 to 49) with:
     ```tsx
     export function IconButton({ icon, label, loading = false, loadingLabel = 'Loading', tooltip = true, ...rest }: IconButtonProps) {
       const button = (
         <ButtonRoot
           {...rest}
           ds="icon-button"
           defaultEmphasis="ghost"
           loading={loading}
           aria-label={label}
           render={() => (
             <>
               <span data-part="icon">{renderSlotContent(icon)}</span>
               {loading && <ButtonLoading label={loadingLabel} />}
             </>
           )}
         />
       );
       return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
     }
     ```
   - Replace the `label` doc line "Never the native title attribute; the
     Tooltip pairing arrives with Tooltip in wave 1." with "Shown in a Tooltip
     on hover and focus (tooltip prop)."
   - Manifest `IconButton.manifest.json`: add the `tooltip` prop (boolean,
     default true) and a note: "The label shows in a Tooltip; it is not read
     twice, because a tooltip that repeats the name is not wired as the
     description."
   - Caveat: Dialog's close control and the WindowControls lights are
     IconButtons; check that a tooltip on them is wanted (Desk lights may
     want `tooltip={false}`), and that the Dialog contract and screenshots
     stay unchanged when no pointer hovers.
   - A Tooltip wraps the IconButton as the Radix Trigger with `asChild`, so
     an IconButton inside `PopoverTrigger`, `DialogTrigger` or
     `RadixPopover.Close asChild` composes two Slots. I did not try this
     change (IconButton is not in my lane). Popover's own close button is an
     IconButton: run the Popover, Dialog and Window suites after the change.
2. **One TooltipProvider inside Theme.** In
   `packages/react/src/theme/Theme.tsx`, only at the root Theme (no parent
   Theme), wrap the children: inside `<Direction.Provider>`, put
   `<TooltipProvider>` (from `../components/Tooltip`) around
   `<IconSetContext ...>{children}</IconSetContext>`. Nested Themes and the
   portal Themes must not add another one (check `parent === null`).
   Tooltips work without it; with it, the skip delay is shared across the app.
3. **Motion catalog (1.11)**: Popover, HoverCard and Tour name
   `menu-scale`; Tooltip names `fade-rise`. Both ids are in the 1.11 list.
4. **Tour onto stepper.ts** once 1.7.7 is merged: replace `clampStep` and the
   local step state in `Tour.tsx` with the machine in free mode.
5. **Contract suite (optional)**: a hover trigger hint (`contract.hover`)
   would let Tooltip drop the static `open` examples.

## What I could not do

- GoBanana: `add_repo` was denied, so the GoBanana sources the orders name
  (desktop.css popover rules, `.st-menu`, studio `Tooltip.tsx`, css lines 530
  to 607) were not read. The look comes from FK2 and the dials table.
- Neutral: not built in this checkout; the components use tokens only and
  have no recipe for it.
- Kbd (1.9.5) does not exist: the tooltip shortcut is text.
- Angular and native: planned (native Tooltip and HoverCard are
  `not-applicable`).
