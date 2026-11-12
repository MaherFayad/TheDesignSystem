# Review: batch 8, layout (lanes 8A, 8B, 8C)

Fresh eyes review by ds-qa on branch `claude/ds-review-8`, cut from
`claude/relaxed-hypatia-7gseap` at `d4bd73e`. No source file was edited.

Reviewed: Stack, Grid, Container, AspectRatio, Separator, Surface, Section,
Bento, ScrollArea, ResizablePanels, SplitView. PageShell was not built (see
the last component section).

Method: read the contracts, PLAN.md 3.4, 3.5, 3.8, 6 and 12, the batch 8
work orders, then every component file, CSS file, manifest, demo and test.
Ran the React gallery and tested in headless Chromium with Playwright: 320px
overflow sweep in all three styles, LTR and RTL; keyboard, pointer and touch
drags on the handles; SplitView focus flow at 360px; ScrollArea keyboard
scrolling and focus; forced colors emulation; density on the gap steps;
screenshots of every demo in Neutral. Contrast of the line and thumb tokens
was computed from the built tokens on body and surface 1 to 5. The lane
reports were read last.

Severity: **blocker** must be fixed before the component is accepted.
**note** is worth fixing but does not hold the component.

## Gate results

| Command | Result |
| --- | --- |
| `npm install` | ok |
| `npm run check` | green, all 12 steps |
| `npm run contract -- --framework react --component Stack,Grid,Container,AspectRatio,Separator,Surface,Section,Bento,ScrollArea,ResizablePanels,SplitView` | **red**: 310 passed, 2 failed, 22 skipped. Both failures are ScrollArea "no sideways scroll at 320px", en ltr and ar rtl. Every other component passes. |
| `npm run a11y` (whole gallery, 600 axe runs on 45 pages) | **red**: 576 pass, 24 fail. No axe violation anywhere. The 24 failures are harness timeouts: Section (12) and Accordion (12) "open" passes wait 30s for a `[data-demo-trigger]` that does not exist. Every batch 8 page passes axe in all six style and scheme pairs, en ltr and ar rtl. |

Skipped contract checks: the keyboard map of the seven components with no
keys (expected), and 15 Section checks ("target size open", "axe open"),
because the suite treats a manifest that lists `open` and `closed` as an
overlay with a trigger.

The `npm run a11y` run rewrote `docs/reports/a11y-react.json` and `.md`; I
restored both, so this branch carries only the review.

## Stack: pass

- note: `packages/react/src/components/Stack/space.ts:1` `SpaceStep` lives in
  the Stack folder and Grid and Container import it from there
  (`Grid.tsx:11`, `Container.tsx:12`), while Surface declares its own,
  shorter list (`Surface.tsx:22`). Move it to `@the-system/shared` as the
  lane 8A report asks.
- note: `Stack.tsx:15` the prop is `direction` with `block` and `inline`,
  stamped as `data-orientation` `vertical` and `horizontal`. Separator and
  ResizablePanels take `orientation` with `horizontal` and `vertical`. See
  "one convention", item 3.
- note: `Stack.css:72` and on: twenty attribute rules per gap step. The same
  block is repeated in Grid (twice), Container and Surface. Works, but a
  sixth layout component will copy it again. See "one convention", item 1.
- Checked and fine: data-ds, no parts, `data-wrap` empty when true, ref as
  prop, rest spread, `className` and `style` pass through, `as` with list
  role for `ul` and `ol`, `asChild` through Slot, no `"use client"` needed,
  logical words only, gap follows density (compact 5.5px, default 7.0px,
  comfortable 9.0px for `s` at 1100px wide), nothing overflows at 320px.

## Grid: pass

- note: `packages/css/src/components/Grid.css:324` the phone fallback is a
  viewport media query. A `columns={4}` Grid inside a 300px pane on a wide
  screen keeps four tracks of 60px. The manifest says so and points to
  auto-fit, which is honest; a container query would be the fix (see "one
  convention", item 4).
- note: `Grid.css:258` a `GridItem span` larger than the column count adds
  implicit tracks and can push the grid wider than its box with
  `keepColumns`. A mistake entry exists; a clamp (`span min(n, columns)`) is
  not possible in CSS today, so keep the entry and add a dev warning in
  `Grid.tsx:81`.
- note: `Grid.css:16`, `:39`, `:43` the auto-fit minimums are fractions of
  breakpoint tokens. Fine as a stopgap; the `size.grid.item-min.*` tokens
  asked for in the lane report are the right home.
- note: `Grid.tsx:39` Grid has no `align` or `justify` while Stack does. A
  grid that centers its cells needs a className today.
- Checked and fine: one item and 200 items, long words (tracks are
  `minmax(0, 1fr)`), RTL fills from the right, list role on `ul`/`ol`,
  rowGap.

## Container: pass

- note: `Container.tsx:9` the order says `size`; the prop is `width`. The
  reason (size is the control axis) is sound and written down. Record it in
  DECISIONS.md so Angular uses the same name.
- note: `Container.css:46` a Container nested in another doubles the gutter.
  The manifest avoidWhen covers panels and cards but not a nested
  Container. Add one line.
- Checked and fine: the default `3xl` gutter is 16px at 320px in the
  default density, the max includes the gutter, no overflow at 320px,
  `as="main"` warning in the prop doc.

## AspectRatio: fix needed

- **blocker**: `packages/react/src/components/AspectRatio/AspectRatio.tsx:182`
  `className`, `style` and `ref` go to the inner root, which Radix positions
  absolutely over its wrapper. Any size or margin a consumer sets on the
  component lands on the inner box and breaks the ratio. Measured: with
  `style={{ inlineSize: 240 }}` on a 16:9 AspectRatio in an 1100px column,
  the root is 200 by 619 and the wrapper 1100 by 619. The wrapper also makes
  the React DOM differ from the Angular DOM the CSS comment plans for
  (`AspectRatio.css:15` to `:19`), which breaks "React and Angular render the
  same DOM". Recommendation: drop the Radix wrapper and render one `div`
  with `aspect-ratio: var(--_aspect-ratio-ratio)` set from the prop, which
  Angular can match attribute for attribute. That departs from the order
  ("Behavior: Radix AspectRatio"), so it is the lead's call; if Radix stays,
  the manifest must say plainly that layout styles go on a parent.
- note: `AspectRatio.css:15` the `[data-radix-aspect-ratio-wrapper]`
  selector styles an element no data-ds owns.
- note: `AspectRatio.css:30` `object-fit` has no effect on an inline `svg`;
  the manifest prop text already says so, the selector can drop `svg`.
- Checked and fine: bad ratios fall back to 16:9, media fills, no motion
  and the manifest says why, native aspect-ratio named as the plain
  alternative.

## Separator: pass

- note: `packages/css/src/components/Separator.css:78` the decorative line
  `color.border.subtle` measures 1.01 to 1.3 against surfaces 1 to 3 in
  every light scheme (Studio light on surface 3: 1.01, Neutral light on
  surface 3: 1.01). Decorative lines are exempt from 1.4.11, but a line no
  one can see is not a separator. Use `color.border.default` or the
  hairline for the decorative form.
- note: `Separator.tsx:10` and the manifest a11y note say
  `color.border.control` "meets 3:1 on every surface". Measured, it does not
  on surface 4 and 5 in Studio dark (2.85, 2.41), Desk dark (2.85, 2.41),
  Neutral dark (2.89, 2.39) and Neutral light (2.92 on surface 4, 2.58 on
  surface 5). Either fix the token or limit the claim to body and surface 1
  to 3.
- note: the order's anatomy is `root`, `label`; the build adds `line` and
  the states `data-decorative` and `data-labelled`. All are in the manifest,
  so this is documented, not a defect.
- Checked and fine: decorative gives `role="none"`, semantic gives
  `role="separator"` with `aria-orientation="vertical"` when vertical and a
  name from the label through `aria-labelledby`; forced colors draws
  CanvasText and GrayText borders.

## Surface: fix needed

- **blocker**: `packages/manifest/src/component/Surface.manifest.json`
  `motion` is null and nothing in the manifest says why. The brief requires
  a layout component that names no motion pattern to say why (Stack, Grid,
  Container, AspectRatio and Separator do it in `frameworks.react.note`).
  The reason is only in a CSS comment (`Surface.css:105`).
- note: `Surface.tsx:22` `SurfacePadding` drops `4xs` and `3xs` and is its
  own type, not `SpaceStep`. See "one convention", item 1.
- note: `Surface.tsx:42` `as="li"` is allowed but nothing gives the parent
  list its role. Fine alone; inconsistent with Stack and Grid.
- note: `elevation="card"` draws nothing in Studio and Desk (the token is a
  zero shadow). The manifest styles text says Studio is flat; add that
  `card` is invisible there so an agent does not pick it to separate boxes.
- Checked and fine: levels body to 5 read the right tokens in all six
  modes (Neutral light screenshot), the transparent 1px border keeps an
  edge in forced colors, content surfaces are solid in Desk (no glass
  token is read), the Liquid note is in the manifest.

## Section: pass

- note: the a11y gate fails on Section (12 timeouts) and the contract suite
  skips 15 Section checks, both because `states` lists `open` and `closed`
  and the tools read that as an overlay. The disclosure is already checked
  open by the default axe pass, so nothing is untested, but the gate is red.
  Fix in `scripts/a11y.ts`: skip the open pass when the demo has no trigger,
  as `contract.spec.ts:521` does. Accordion has the same failure.
- note: `packages/css/src/components/Section.css:294` the toggle has a
  negative start margin, so its hover fill and focus ring sit
  `space.2xs` past the section's start edge. In a parent that clips with no
  inline padding the ring is cut on that side. Documented in the CSS header;
  a manifest mistake entry would reach agents.
- note: `Section.css:291` `justify-content` and `text-align` on the toggle
  are written directly because Button has no private property for them. The
  lane 8B report asks for those properties; agree.
- Checked and fine: `level` is required and the demo uses h3 and h4 with no
  guess; the toggle is a system Button inside the heading with
  `aria-expanded` and `aria-controls`; Space and Enter toggle; the closed
  body leaves the tree; `landmark` is opt in and no demo floods the
  landmark list; chevron mirrors in RTL; the open motion uses transform and
  opacity only and Radix suppresses it on first mount; no glass in Desk (no
  fill at all), see `section-desk-dark.png`.

## Bento: fix needed

- **blocker**: `packages/manifest/src/component/Bento.manifest.json`
  `motion` is null with no reason given, as for Surface.
- note: `packages/react/src/components/Bento/Bento.tsx:42` `as="ul"` gets
  `list-style: none` (`Bento.css:90`) but no `role="list"`, so Safari drops
  the list the manifest promises ("announced as a list with its count").
  Stack and Grid add the role (`Stack.tsx:71`, `Grid.tsx:50`).
- note: `Bento.css:121` and `:128` the column drop to 2 and 1 follows the
  viewport. The manifest says so in avoidWhen; see "one convention", item 4.
- note: `Bento.css:144` the forced colors tile edge is an `outline` at
  rest. It is not the transparent focus outline the convention forbids at
  rest, but it is the outline a focused tile would use. A transparent 1px
  border at rest, as Surface does, gives the same edge and leaves outline
  to focus.
- note: `Bento.css:71` the least row height reads `space.12xl`, a space
  token used as a size.
- note: the manifest insteadUse sends "Tiles the user drags or resizes" to
  ResizablePanels, which resizes panes, not tiles. Name no component, or a
  future dashboard grid.
- note: the demo has no `empty` case. An empty Bento collapses to nothing,
  which is fine, but the case should say so.
- Checked and fine: no dense packing, so reading order is visual order; one
  column at 320px with spans reset (`bento-320-rtl.png`); Studio 1px gap
  recipe; Neutral and Desk free tiles look right
  (`neutral-light-bento.png`).

## ScrollArea: fix needed

- **blocker**: the contract suite fails "no sideways scroll at 320px" in en
  and ar. Cause: the demo, not the component.
  `packages/react/src/components/ScrollArea/ScrollArea.demo.tsx:116` gives
  the "many" box a fixed `20rem` inline size, which with the demo padding
  is 334px wide at a 320px viewport (`scroll-area-320-overflow.png`). Use a
  max inline size.
- **blocker**: scrollbar thumb contrast. `scrollbar.thumb` measures under
  3:1 against every surface in every style and scheme: 1.50 to 2.74 in the
  dark schemes, 2.12 to 2.54 in the light ones. The thumb is the visible
  sign of position and of the scrollbar itself (WCAG 1.4.11). The manifest
  note says "on some surfaces"; it is all of them. The fix is a token
  change (lead or ds-style); until then the manifest must say "every
  surface".
- note: `ScrollArea.tsx:53` `scrollbars="scroll"` and `"hover"` hide the
  bars at rest. With `fades={false}` too, nothing shows that the area
  scrolls. Add a mistake entry, or keep fades on when the bars hide.
- note: `ScrollArea.tsx:202` a focusable viewport becomes `role="region"`
  with a default name "Scrollable content". Several unnamed scroll areas on
  a page give several regions with the same name. The default is better
  than none; the manifest should say to always pass `label`.
- note: the 4px and 6px thumbs are under 24px. WCAG 2.5.8 is met through
  the equivalent exception (wheel, touch, keys); say so in the manifest.
- Checked and fine: native scrolling, ArrowDown and PageDown scroll a
  focused viewport (0 to 67px), the viewport takes focus only when it
  overflows and holds nothing focusable, the ring is drawn on the root
  only inside a focus selector, the bar sits on the inline end and moves to
  the left in RTL, horizontal fades mirror, forced colors draws the thumb in
  CanvasText and hides the fades (`fc-scroll-area.png`), Neutral dark looks
  right (`sa-neutral-dark.png`).

## ResizablePanels: pass

Tested in Studio dark, LTR and RTL, 1100px wide, on the first handle of the
variants case (min 15, max 35):

| Action | LTR | RTL |
| --- | --- | --- |
| initial | value 22, x 239 | value 22, x 837 |
| ArrowRight | 27, handle moves right | 17, handle moves right |
| ArrowLeft | back to 22 | back to 22 |
| Home | 15 | 15, handle at the far right |
| End | 35 | 35 |
| Enter | collapses to 0, min becomes 0 | same |
| Enter again | restores 35 | same |
| mouse drag 100px right | handle follows (at max, stays) | handle follows, 35 to 26 |
| touch drag 100px right | handle 239 to 339 | |

The keys and the drag move the handle the same way on screen in both
directions. `role="separator"`, `aria-valuenow`, `-valuemin`, `-valuemax`,
`aria-controls` (resolves), `aria-orientation="vertical"` and a name are
all present. The handle is 24px wide, focus visible draws a 2px ring, forced
colors draws a Highlight outline (`fc-resizable-panels.png`), and
`touch-action: none` keeps touch drags from scrolling.

- note: `packages/css/src/components/ResizablePanels.css:102` `outline: none`
  at rest. Harmless on a div, but it is an outline outside a focus selector;
  drop it.
- note: `ResizablePanels.css:91` the handle uses `z.dropdown`. Agree with
  the lane report: add a `z.raised` token.
- note: limits are percents only. At 320px the editor demo gives Layers
  63px and Inspector 72px (`rp-320.png`). Nothing overflows, but a panel
  min in px (or in `size` tokens) is what an editor layout needs. Point
  narrow screens at SplitView in the manifest avoidWhen.
- note: `ResizablePanels.tsx:400` Escape during a drag does not cancel it;
  only `pointercancel` does. Not required by the window splitter pattern,
  but cheap.
- note: `ResizablePanels.css:72` panels clip with `overflow: hidden`, so a
  control at a panel edge loses part of its focus ring. The manifest says
  to keep content 11.5px from a handle; say also that panel content that
  scrolls belongs in a ScrollArea.
- note: the "Saved layout" demo shows the collapsed rail with its title cut
  to "Inspect". Give the rail an icon or no text.

## SplitView: pass

Tested at 360px in Neutral light: the detail opens with focus on the
secondary pane (named "Message", focus visible), Tab reaches the back
Button (118 by 32px), back returns focus to the list item that opened the
detail, and widening to 1100px switches to split. Screenshot:
`split-360-open.png`.

- note: `packages/react/src/components/SplitView/SplitView.tsx:45` the stack
  point is `48 * 16` px. A user who sets a larger default font size gets
  CSS breakpoints in their rem but this check in 16px. Read the root font
  size, or compare against `matchMedia('(width < 48rem)')` for the
  viewport plus the measured width.
- note: `SplitView.tsx:141` the first render is always split; a phone sees
  split, then stacked. In the browser the switch lands in a layout effect
  before paint; after server rendering it is a visible jump. Document it, or
  render with `layout="stacked"` until measured on narrow user agents.
- note: `SplitView.tsx:35` imports `useControllable` from the Window folder.
  Move it to a shared hooks folder (asked in the lane report).
- note: `SplitView.tsx:68` the doc for `onShowSecondaryChange` says it is
  called with true "when the app opens the detail through it", but nothing
  in SplitView sets true. Reword.
- note: Escape does not return to the list while stacked. Optional; the
  native navigation stack the manifest maps to has a back gesture.
- Checked and fine: both panes stay mounted with `hidden`, both are named
  regions, the handle and keys come from ResizablePanels, no sideways
  scroll at 320px.

## PageShell: not built, block is real but short lived

The order (1.8.12) makes `skip` a SkipLink root and the sidebar a Drawer
under `breakpoint.tablet`, and it depends on 1.7.11 SkipLink and 1.7.2
Sidebar. None of the three is on the base branch. The lane 8C report says
"no branch has a Drawer"; that is no longer true. Pushed and unmerged:

- `claude/ds-lane-6a` has `packages/react/src/components/Drawer`
  (`wo-1.6.3: drawer`).
- `claude/ds-lane-7a` has `Sidebar` (`wo-1.7.2, wo-1.7.3: sidebar and rail
  review fixes`).
- `claude/ds-lane-7c` has `SkipLink`.

So the block is real today and clears when lanes 6A, 7A and 7C merge.
Building PageShell before then would mean a hand made skip link and
sidebar that get thrown away. Schedule it right after those merges. Note
that Container and ResizablePanels already name PageShell in `insteadUse`,
so the registry points agents at a component that does not exist yet.

## Accessibility summary (WCAG 2.2 AA)

- axe: clean on all eleven pages, six style and scheme pairs, en ltr and
  ar rtl.
- 1.4.10: no sideways scroll at 320px in any style or direction, except
  the ScrollArea demo (blocker above).
- 1.4.11: thumb under 3:1 everywhere (blocker above); `border.control`
  under 3:1 on surface 4 and 5 in four of six modes, which reaches the
  semantic Separator and the resize handle line (notes above).
- 2.1.1 and 2.5.7: every handle drag has arrows, Home, End and Enter; the
  ScrollArea viewport takes focus when needed.
- 2.4.7: focus visible on handles, panes, the viewport ring and the
  Section toggle; forced colors fallbacks on all of them.
- 2.5.8: handles 24px, SplitView back Button 32px, Section toggle 32px.

## Manifests

All eleven validate. useWhen, avoidWhen and insteadUse are specific
enough for an agent to choose between Stack, Grid, Bento, SplitView and
ResizablePanels: each one names the others for the case it does not fit,
and Grid and Bento both state the viewport media query limit. Gaps:

- Surface and Bento: no reason for the missing motion pattern (blockers).
- insteadUse names components that do not exist yet: PageShell (Container,
  ResizablePanels, SplitView), Drawer (ResizablePanels, SplitView,
  ScrollArea), DataTable (ScrollArea), Table (Grid). Fine for a plan, but
  the registry and the MCP server will serve them as real. Mark them
  planned, or filter unbuilt names at generation.
- ScrollArea: the thumb note understates the contrast gap.
- Separator: the 3:1 claim is not true on surface 4 and 5.

## Tests

Unit tests exist for every component (3 to 13 each) and cover props,
states, keys and the pure resize math (`packages/shared/src/resize.test.ts`).
Bento has only 3: no test for `as="ul"` semantics, which would have caught
the missing list role. No test checks that a style or class set on
AspectRatio keeps the ratio.

## One convention

Inconsistencies across the batch, one recommendation each.

1. **Space steps.** Stack, Grid and Container take `SpaceStep` (`none`,
   `4xs` to `12xl`) from the Stack folder; Surface has its own list without
   `4xs` and `3xs`; Bento and Section take none. Recommendation: one
   `SpaceStep` type in `@the-system/shared`, used by every gap, padding and
   gutter prop, with the full list.
2. **Gap, padding and gutter words.** `gap` (Stack, Grid), `rowGap` (Grid),
   `gutter` (Container), `padding` (Surface); Bento fixes its gap at `l`
   with no prop; defaults are `s` (Stack), `l` (Grid, Bento), `xl`
   (Surface padding), `3xl` (Container gutter). Recommendation: keep the
   three words (gap between children, padding inside, gutter for the page
   edge), give Bento a `gap` prop with Grid's default, and list the
   defaults in one table in the docs.
3. **Direction words.** Stack takes `direction` `block` or `inline`;
   Separator and ResizablePanels take `orientation` `horizontal` or
   `vertical`; all stamp `data-orientation` `horizontal` or `vertical`.
   Recommendation: `orientation` with `horizontal` and `vertical` on every
   component, since the attribute already uses those words; Stack can keep
   `direction` as an alias for one release.
4. **Responsive rule.** Grid and Bento drop columns on the viewport width
   (media queries); SplitView stacks on its own width (ResizeObserver);
   none uses a container query. Recommendation: the layout follows its own
   box. Put `container-type: inline-size` on a wrapper the component owns
   (or on the parent through a documented part) and switch Grid and Bento
   to `@container` with the breakpoint tokens, the way SplitView already
   behaves; keep the media query only as the fallback.
5. **Span vocabulary.** `data-span` means a column count on GridItem (`2`,
   `full`) and a shape on BentoItem (`2x1`, `1x2`). Recommendation: GridItem
   keeps `span` and `rowSpan`; BentoItem takes the same two props with
   values 1 or 2, so one attribute word has one meaning.
6. **Lists.** Stack and Grid add `role="list"` to `ul` and `ol`; Bento does
   not; Surface allows `li` with no list parent. Recommendation: every
   layout that strips bullets sets the role, through one shared helper.
7. **The `as` prop.** Each component has its own element list (Stack 13,
   Grid 4, Container 6, Surface 8, Bento 3, Section none) and only Stack
   and AspectRatio take `asChild`. Recommendation: one shared
   `LayoutElement` type for Stack, Grid, Container, Surface and Bento, and
   `asChild` on all of them or none.
8. **Built in names.** ScrollArea, ResizablePanels and SplitView each carry
   an en and ar label table and the same `lang === 'ar' ||
   lang.startsWith('ar-')` test. Recommendation: one `useBuiltinLabel`
   helper (or a strings file) so the next component does not copy it and
   new languages land in one place.
9. **Private property names.** `--_grid-gap` and `--_stack-gap` follow the
   convention; `--_container-padding-inline`, `--_surface-padding`,
   `--_grid-min`, `--_container-max`, `--_scroll-area-ring-color` and
   `-ring-width` are outside the listed names. Recommendation: add `max`,
   `min`, `padding` and `ring-color`, `ring-width` (for outline rings) to the
   list in anatomy.md, so the names are law rather than exceptions.
10. **Motion statement.** Five layout manifests explain a null motion in
    `frameworks.react.note`; Surface and Bento do not. Recommendation: a
    manifest key (`motionNote`, or a schema rule that a null `motion` needs
    a reason) so the validator enforces it.
11. **Size tokens borrowed from other scales.** Grid and Container derive
    widths from breakpoints, Bento uses `space.12xl` for a row height, the
    handle uses `z.dropdown`. Recommendation: add `size.container.*`,
    `size.grid.item-min.*`, `size.bento.row` and `z.raised`, as the lane
    reports ask.

## Screenshots

`docs/reports/reviews/shots/batch-8/`:

- `scroll-area-320-overflow.png`: the ScrollArea demo wider than a 320px
  viewport.
- `rp-320.png`: the editor layout at 320px, panels at 63, 153 and 72px.
- `split-360-open.png`: SplitView stacked with the detail open and focus on
  the pane.
- `fc-resizable-panels.png`, `fc-scroll-area.png`: forced colors.
- `section-desk-dark.png`, `bento-320-rtl.png`, `sa-neutral-dark.png`.
- `neutral-light-<slug>.png` for all eleven components: the Neutral look,
  which the builders could not see. Nothing in Neutral looked wrong: the
  surface steps, tile gaps, handle lines and section hairlines all read
  from tokens and render as intended.
