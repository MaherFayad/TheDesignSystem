# Order 1.29, lane "actions and navigation"

Fix round 1 after the round 3 interaction review. Gallery on port 5182
(dev) and a production build on 5282 (after) and 5283 (HEAD, before) for the
Playwright probes. Not committed.

All numbers below were taken on a shared machine that other lanes loaded to a
one minute average of 8 to 47 while this ran. Every perf JSON records
`loadAvg1m`; the lead reruns `perf.cjs` on a quiet machine. The probes that
assert a pass or fail (hit area, tabs ink, copy swap, pagination forced
colors) do not depend on timing and are reliable here.

## Proof run at the end

- `npx vitest run` on every file this lane owns: 172 passed (the motion
  helpers and the fifteen React components). tsc clean (`tsc --noEmit -p
  tsconfig.json`).
- `npm run contract -- --framework react --component Button`: 37 passed, 0
  failed (anatomy in four styles with the new `hit` part, variant and state
  attributes, the keyboard map, target size in three densities and four
  styles, no sideways scroll, axe in light and dark, en and ar). IconButton,
  CloseButton, CopyButton and FloatingActionButton were run the same way
  (see "Contract" below).
- `npm run check` was not run whole: it runs every lane's work and the
  toggles lane's files, which this lane's shared change deliberately breaks
  until that lane catches up (see "Changes needed from the lead"). The steps
  this lane owns are green above.

## Blockers

### B1: the soft Tabs pill no longer paints over a label

- Fix: `packages/css/src/components/Tabs.css`. The list is its own stacking
  context (`isolation: isolate`) and the indicator sits under every trigger
  with `z-index: calc(0 - var(--ds-z-raised))` (a token, not a raw value),
  as SegmentedControl does. The `indicator` part name and the private
  properties are unchanged.
- Test: `tabs-ink.probe.cjs` (B1 block). On the tab-slide stage the soft
  Tabs pill slides from General to Members; every animation is paused at 12
  points of the slide; the leaving label (General) is shot as drawn and with
  it and its ink twin hidden, and the contrast of the text pixels against
  the pixels under them is the frame's contrast. A frame passes when it stays
  within 10% of the lower of the label's two rests (active before, inactive
  after). Every style, light and dark.
- Evidence: `tabs-ink.before.json` fails in Desk and Liquid light and dark
  (the leaving label drops to 1.0:1, a pill painted over the text), 3 of 8
  rows FAIL. `tabs-ink.after.json`: all 8 pass (Desk light min over the slide
  4.44, Liquid light 5.39, and so on).

### B2: no ink under forced colors; the selected label stays readable

- Fix: `packages/motion/src/helpers/nav-ink.ts` (`planInk`/`playInk` return
  early when `matchMedia('(forced-colors: active)')` matches or the pill is
  not drawn). Two styles also drew the active label in a system color that
  vanished on the forced-colors fill: `Tabs.css` sets the soft active
  trigger to `CanvasText` (the pill is a frame on Canvas there), and
  `SegmentedControl.css` swaps the item transition to `transform` only under
  forced colors so the fill and text step between Highlight and HighlightText
  at once.
- Test: `tabs-ink.probe.cjs` (B2 block): under emulated forced colors the
  SegmentedControl and the soft Tabs slide; no `label-ink` twin may be drawn
  and the selected labels (Week, Members) keep 4.5:1 on every frame. Also a
  vitest, `nav-ink.test.ts` "B2: draws no ink under forced colors" and "draws
  no ink when the pill is not drawn".
- Evidence: `tabs-ink.before.json` B2 rows: twins drawn 6 (Neutral) and 9
  (Desk), min selected label 1.29 and 1.25. `tabs-ink.after.json`: twins 0,
  min 9.61 and 11.31. The two vitest cases fail on the HEAD `nav-ink.ts`
  (ran against `git show HEAD:` copy) and pass after.

### B14: tab-slide no longer thrashes layout

- Fix: the ink and the slide now read every box and colour before any write,
  build each twin once and keep it for the next slide, and skip a label the
  pill never passes.
  - `packages/motion/src/helpers/nav-ink.ts`: `planInk(opts)` does every read
    and returns a writer; `playInk` is `planInk` then the writer, so the old
    call site keeps working. The switch property is read first, before any
    box. Twins are cached per part (`twinCache`) and reused while the part's
    markup is unchanged; only their inline look is rewritten. A part whose
    box never falls inside the slide's travel span gets no twin.
  - `packages/motion/src/helpers/indicator.ts`: `planFollow`/`planSlide`/
    `startSlide` split the reads from the one write, and `inFrame(job)` runs
    every list's reads of a commit in one microtask, then every write, so a
    press costs one style and layout pass instead of one per list.
  - `Tabs.tsx`, `SegmentedControl.tsx` and `Navbar.tsx` call `inFrame` and
    pass the plan's reads in, the writes out.
- N30 (same row): `indicator.ts` `slideFrames` divides the translate by
  `zoomOf(layer)` (`Element.currentCSSZoom`), and `nav-ink.ts` scales the
  slide boxes back up by the same zoom, so the ink no longer leads the pill
  under CSS zoom.
- Test: `nav-ink.test.ts`, order 1.29 block: reads happen before the first
  write; twins are built once and reused; a label the pill never passes gets
  no twin; the switch-off path costs one read and nothing else; N30 maps a
  box under zoom. Six of the seven fail on the HEAD `nav-ink.ts` and all pass
  after. The CPU evidence: a V8 profile at 4x on a quiet machine put
  `playInk` self time at 411ms before (the figure the review measured) and
  17ms after.
- `perf.cjs` (rewritten, order 1.29): CDP 4x CPU throttle, 390 by 844 touch,
  triggers one interaction on `/interactions?focus=<id>&style=<s>&chrome=0`,
  traces the trigger plus 1200ms, writes per id the main thread long tasks
  (and the longtask observer), the compositor frames by state, the rAF gaps,
  and the machine load. It takes a list of ids (`--ids a,b,c` or positional)
  and `--runs n`, so the lead reruns it on the 18 interactions of the review
  table.
- Evidence (committed): `perf.before.{liquid,neutral}.json`,
  `perf.after.{liquid,neutral}.json` (dev build) and
  `perf.before.prod.{liquid,neutral}.json`,
  `perf.after.prod.{liquid,neutral}.json` (production build). The production
  pairs were taken back to back at the same load: Liquid tab-slide largest
  long task 1618ms before to 505ms after (load about 46), Neutral 1140ms to
  297ms (before load 41, after 21), while `button-press` held at 77 to 84ms
  in both. The absolute numbers are inflated by the shared load; the ratio
  and the profile are the real evidence.

### B10: the 44/48 hit area of the button family takes presses again

- Fix: a new `hit` part.
  - `packages/react/src/components/Button/ButtonBase.tsx`: `withLeaving`
    renders one fragment shape in both branches (also angular-sync item 5)
    and ends it with `<span data-part="hit" aria-hidden="true" />` for every
    family root except Chip (which has no glow and keeps its `::before` hit
    area).
  - `packages/css/src/components/Button.css`: the hit part is `display:
    none` off platform.
  - `packages/css/src/platform/ios.css` and `android.css`: the hit part (not
    the glow `::before`) grows to 44/48 with `pointer-events: auto`. The glow
    `::before` keeps the control's box. Chip keeps its `::before` hit area.
    Only the button-family hit rules in these files were touched (read before
    each edit; the nav rules and other lanes' rules were left alone).
  - The five family manifests gained `hit` in `anatomy`.
- Test: `hit-area.probe.cjs`. On a phone viewport, for Button, IconButton,
  CloseButton, CopyButton, ToggleButton and FloatingActionButton on iOS and
  Android, every root drawn smaller than the target is hit tested 1px inside
  the target on each short axis with `elementFromPoint`; a point passes when
  it lands on the root, is "claimed" by a neighbour control (a spacing case),
  or is dead. It also checks the glow `::before` never grows past the
  control's box. Run on a production build (a dev server reloads demos while
  other files change; the probe counts skipped roots).
- Evidence: `hit-area.before.{neutral,liquid}.json` (HEAD build): hundreds of
  dead points and the glow grows on every small control (for example iOS
  IconButton 32 of 32 dead, glow grows 8). `hit-area.after.{neutral,liquid}
  .json`: 0 dead, 0 glow-grows across all six components on both platforms.

## Ten weakest

- #3 `tab-slide`: B1, B2, B14, N30 above.
- #10 `copy-swap` (N4): `CopyButton.css` clips the label cell to the inside
  of the border on both axes (`clip-path: inset(... + border ...)`), so a
  rolling word never crosses the top border, and the leaving word fades on
  `duration.fast` with `ease.out` while it rolls, so the two words no longer
  sit whole at once. Test: `copy-swap.probe.cjs`, five styles and Arabic:
  `copy-swap.before.json` shows border pixels up to 71 (Desk, Liquid) and an
  overlap; `copy-swap.after.json` shows 0 border pixels everywhere and the
  overlap shortened. Clipboard permissions are granted and long hold timers
  dropped so the button holds its result while the frames are shot.

## Notes

- N7 `button-result`: `Button.tsx` renders the result word beside the glyph
  (`data-result-label`); `Button.css` lays the result part out as a flex row
  with the word clipped to an ellipsis, takes the success or danger tone in
  the button's own emphasis while the result shows, draws the error cross in
  the time of one stroke (each stroke over half of `duration.morph`), and
  fades the glyph on `duration.fast` on the way back so it is gone before the
  label returns. The `button-result` row in
  `packages/motion/src/interactions/buttons.ts` was updated to match. Stage
  copy in `actions.tsx`: the error label is "Not saved" (it fit; "Could not
  save" clipped).
- N22: overlays, skipped.
- N32 (dot Badge pops): `Badge.tsx` throttles the pop to at most three a
  second (`POP_GAP_MS`). Test `Badge.test.tsx`: ten count changes in 594ms
  draw at most two pops; fails on HEAD (ten), passes after.
- N34 (`sidebar-collapse` labels): `Sidebar.tsx` `wipeLabels` compresses the
  stagger and the wipe so the last label is whole within 400ms whatever the
  style spring, with one read for the whole list. Test `Sidebar.test.tsx`
  drives Desk's long tokens and asserts every wipe ends by 400ms and the
  stagger still varies; fails on HEAD (610ms), passes after. The
  `sidebar-collapse` row in `navigation.ts` was updated.
- N35 (Pagination across wrapped lines): `Pagination.tsx` fades the pill in
  at its new place (`ds-motion:pagination-fade`) instead of sliding when the
  new slot sits on another line (box centres more than half a row apart);
  it still slides on the same line. Test `Pagination.test.tsx` mocks a
  wrapped layout: a same-line change slides, a wrapped change fades. Fails on
  HEAD, passes after. The `pagination-roll` row in `navigation.ts` was
  updated.
- N37 (Navbar ink never plays): the component is correct. With the gallery's
  own `a:not([data-ds])` colour override neutralised, the Navbar ink plays
  (2 to 3 twins) and the rest and current link colours differ in every style
  (checked in Desk, Neutral, Studio, Liquid). The blocker is a gallery
  stylesheet, not this lane (see "Changes needed from the lead").
- N40 (forced-colors Pagination current): `Pagination.css` sets the current
  page's `border-color: Highlight` on the element itself and matches the
  `:has()` selector that hid the border while the pill draws, so a style's
  recipe no longer outranks it. Test `pagination-forced.probe.cjs`: the
  current page's border must be Highlight and differ from the others, in four
  styles. `pagination-forced.before.json`: all four FAIL. `.after.json`: all
  four pass.
- N41 (Arabic stage copy): `navigation.tsx` `Play` takes an `ar` label read
  from `useTheme().lang` (white Saudi dialect, verbal nouns, no diacritics:
  "تحريك كل المؤشرات", "تخطي ثلاث صفحات", and so on). "Jump three pages" was
  the one in this lane's files. "Live visitors" and "Since 9:00" are in
  `feedback.tsx` (another lane): see below.

## angular-sync-3 section 6 item 5

`ButtonBase.tsx` `withLeaving` returns the same fragment shape in both
branches (`<>{parts}{spinnerLeaving && <span data-part="spinner" .../>}{hit}</>`),
so the parts are not remounted when the leaving spinner goes. Test
`Button.test.tsx` "keeps the label element while the spinner leaves and after
it has gone": the same label node is kept through the leaving spinner to
rest. Fails on HEAD (the node is remounted), passes after.

## Hooks added

- `hit` part on Button, IconButton, CloseButton, CopyButton,
  FloatingActionButton and ToggleButton (every ButtonRoot family member but
  Chip). Element: an empty `<span data-part="hit" aria-hidden="true">` last
  in the root. Default: `display: none`. Who sets it: `platform/ios.css` and
  `platform/android.css` grow it to the 44/48 target with `pointer-events:
  auto`.
- `data-result-label` on Button's `result` part: the ending in words beside
  the glyph (visually present, the status says it once). Set by `Button.tsx`.
- No private property or part was renamed or removed. `--_tabs-ink`,
  `--_segmented-control-ink`, `--_navbar-ink`, the `indicator` and
  `label-ink` parts and the private properties are all unchanged.
- New exports from `@the-system/motion` (additive): `planInk`, `frameBoxes`,
  `InkSlide`, `InkPlanOptions`, `forcedColors` (nav-ink); `planSlide`,
  `startSlide`, `SlidePlan`, `planFollow`, `FollowPlan`, `inFrame`,
  `FrameJob`, `zoomOf` (indicator). `playInk`, `followIndicator`, `slideTo`
  stay, so Angular's current callers are unchanged and get B2 and N30 for
  free through the shared `playInk` and `slideFrames`.

## DOM changes for the Angular parity lane

- The button family (Button, IconButton, CloseButton, CopyButton,
  FloatingActionButton, ToggleButton) must render a last child
  `<span data-part="hit" aria-hidden="true">` in the root, except Chip. The
  shared CSS already drives it.
- Button must render the result word as `<span data-result-label>` inside the
  `result` part.
- The Tabs list CSS (`isolation`, the indicator `z-index`) is shared, so
  Angular gets B1 with no DOM change.
- Angular's SegmentedControl and ToggleGroup already call the shared
  `playInk`, so they get B2 (forced colors) with no change; passing the
  `indicator` element to `playInk` would also give them the "pill not drawn"
  skip, but that is optional.

## Changes needed from the lead (other lanes)

1. Toggles lane: `ToggleButton` and `ToggleGroup` render through this lane's
   shared `ButtonBase`, so they now carry the `hit` part (correct: B10 lists
   ToggleButton, and the `hit-area` probe shows it passing). Their manifests
   need `hit` added to `anatomy`, and their child-shape unit tests
   (`ToggleButton.test.tsx` "renders a native button with the anatomy": the
   children are now `['state-layer', 'start', 'label', 'hit']`;
   `ToggleGroup.test.tsx` "renders the icon only form": the item children are
   now `[null, 'icon', 'hit']`) need the `hit` entry. Until then those two
   files are red; this lane does not own them.
2. Styles or gallery lane (N37): `apps/gallery-react/src/gallery.css` has
   `[data-gallery='root'] a:not([data-ds])` set `color: var(--ds-color-text-link)`,
   which wins over the Navbar's own link colours (the link is an `<a
   data-part="link">` with no `data-ds`), so rest and current compute to one
   colour and the Navbar ink reads nothing to cross. Exclude the navigation
   link parts from that rule (for example `:not([data-part])`) so the Navbar
   and Sidebar links keep their own colours. Not this lane's file.
3. N41 leftovers outside this lane: `apps/gallery-react/src/interactions/feedback.tsx`
   still shows "Live visitors", "Since 9:00" (and likely other Stat copy) in
   English on the Arabic stage. That file belongs to another lane.

## Files changed (this lane)

- `packages/motion/src/helpers/nav-ink.ts`, `indicator.ts` and their tests
  (`nav-ink.test.ts`, `indicator.test.ts` unchanged, still green).
- `packages/motion/src/interactions/buttons.ts` (button-result row),
  `navigation.ts` (pagination-roll, sidebar-collapse rows).
- React: `Button/ButtonBase.tsx`, `Button/Button.tsx`, `Button/Button.test.tsx`,
  `Tabs/Tabs.tsx`, `Tabs/Tabs.test.tsx`, `SegmentedControl/SegmentedControl.tsx`,
  `SegmentedControl/SegmentedControl.test.tsx`, `Navbar/Navbar.tsx`,
  `Pagination/Pagination.tsx`, `Pagination/Pagination.test.tsx`,
  `Sidebar/Sidebar.tsx`, `Sidebar/Sidebar.test.tsx`, `Badge/Badge.tsx`,
  `Badge/Badge.test.tsx`.
- CSS: `components/Button.css`, `CopyButton.css`, `Tabs.css`,
  `SegmentedControl.css`, `Pagination.css`; `platform/ios.css`,
  `platform/android.css` (button-family hit rules only).
- Manifests: `Button`, `IconButton`, `CloseButton`, `CopyButton`,
  `FloatingActionButton` (added `hit`).
- Gallery: `apps/gallery-react/src/interactions/navigation.tsx` (Arabic Play
  labels), `actions.tsx` (button-result error label "Not saved").
- Probes and JSON under `docs/reports/fixes/interactions-3/`: `perf.cjs`,
  `hit-area.probe.cjs`, `tabs-ink.probe.cjs`, `copy-swap.probe.cjs`,
  `pagination-forced.probe.cjs` and their before/after JSON.

## What is left

- The toggles lane and the gallery/styles lane changes above (items 1 to 3).
- `npm run check` whole was not run to green because of item 1 and other
  lanes' in-flight work; this lane's own steps are green.
- The perf absolutes need a rerun on a quiet machine; `perf.cjs` and the
  before/after JSON (with `loadAvg1m`) are in place for it.
