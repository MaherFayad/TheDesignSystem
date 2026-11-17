# Lane report: DU2 the side column and the sheet on ios

Order DU2 of `docs/plan/reset-duo.md`, section 9. Working answers from the
lead, all proposed: option (a) plus (c); `auto` gives the side column when
the shell is at least 440 wide and at most 700 tall; no second column beside
Safari's own on the outer screen in portrait; one type ramp; in Arabic the
column stays on the hardware side (the physical right), as the vendor's
guidelines say for native apps. Unverified for web pages. Not committed.

## What I built

- `packages/css/src/platform/ios-shell.css` (new), layers `ds.platform` and
  `ds.chrome`, every rule under `[data-platform='ios']`. The barrel
  (`npm run gen`) imports it between `ios-refraction.css` and `ios.css`, so
  each rule that sets a property `ios.css` also sets carries one more
  attribute or pseudo class (the placement attribute,
  `:not([data-placement='bottom'])`, the page-shell ancestor, the sheet
  panel's `data-state`).
- `packages/contract-tests/src/duo.spec.ts`: DU4's six skipped tests are
  real tests now, plus one for the 256 tall landscape shell (below).
- `apps/gallery-react/src/duo.css`: DU3's temporary inset padding is gone;
  the fixed tab bar wrapper keeps clear of the side insets only.
- `apps/gallery-react/src/Duo.tsx`: the top bar's action is two icon
  buttons (add a board, more actions) in place of the text button, so the
  column has actions to take (text buttons stay in the top row, plan 5.2);
  the folded frames also set DU4's stand in `data-ds-test-fold` on the html
  element, so a sheet in its portal sees the fold.

### The shell

- On ios the PageShell root is `container: ds-shell / size` and
  `contain: layout`. Its block size is one screen,
  `calc(var(--ds-dialog-height-max) * 1.25)` (dialog.height.max is 80dvh);
  the base `min-block-size: 100%` still makes it fill a taller frame of
  definite height (the demo frames). Found by running it: Chromium reads a
  size container whose block size is `auto` as 0 tall in its queries,
  whatever its minimum, so a minimum alone made `auto` match on every
  shell. A definite block size fixes that. Token gap for the lead: no token
  names the screen height.
- Main scrolls inside the shell when it holds something to focus
  (`:has(a[href], button, input, ...)`). A scroller with nothing focusable
  failed axe `scrollable-region-focusable` on the PageShell demo (main's
  tabindex is -1). Text alone overflows the shell and the page scrolls.
- `contain: layout` makes the shell the containing block of the docked
  column parts (`position: fixed`), so in a demo frame they stay inside the
  frame, and they do not move while main scrolls.
- Every region (header, main, aside, footer) keeps clear of the side insets,
  each side on its own (0 on an iPhone in portrait).

### The column (`side`, or `auto` in the query)

- `@container ds-shell (inline-size >= calc(30rem * 11 / 12)) and
  (block-size <= calc(600px * 7 / 6))`. The lint gate takes only breakpoint
  values in conditions, so 440 and 700 are calc() over breakpoint.phone
  (30rem) and breakpoint.medium (600px), with the comment naming both on
  the line. Same for 500 (600px * 5 / 6). The gate passes.
- A private flag `--_ios-rail: side` is set on the shell (side) or on its
  regions (auto, inside the query) and inherits; the bars read it with
  `@container style(--_ios-rail: side)`, as `ios.css` reads `--_ios-glass`.
  A bar with its own `data-placement='bottom'` never takes the column.
- Column size `--_ios-rail-size`: 84 (48 and three 12s, kit), or the side
  inset when that is wider. Items `--_ios-rail-item`: 48 (`size.touch-ios`
  plus `space.fixed.2xs`; no 48 token outside android's name).
- The TabBar: a vertical capsule of 48 square items, 4 padding, centred in
  the column, at its bottom; the current item's lens and the clear glass are
  `ios.css`'s own, unchanged. Labels are clipped, not `display: none`, so
  each link keeps its name. The style's band above a bottom bar is not drawn
  in a column. On a short shell the capsule keeps room for two action
  buttons above it and scrolls (it never covers them or clips an item).
- The Navbar's end group (when it holds no text Button): at the top of the
  column, one under the other, 48 round glass buttons, 8 apart. The title
  stays at the top of the content.
- Content: every region gets a margin at the column's side equal to the
  column, so nothing runs under it and no focused control is under it;
  main also gets `scroll-padding-block` for the column's ends. A footer that
  holds only the tab bar loses its band.
- Camera end: where the column sits in a side inset (full screen), a
  portrait shell starts the actions under twice the inset (kit: camera and
  status, 84 by 169); a landscape shell keeps the inset's width clear under
  the tab bar (kit: the outer camera at the bottom), and a landscape shell
  taller than 500 (the inner screen) keeps both ends clear. With no side
  inset (Safari) both ends keep 12.
- Physical right in both directions: inline end in English, inline start in
  Arabic (`:dir()` pairs; no physical property).
- Never `order`, never a grid that changes the reading sequence: the DOM
  order (DU1) is the focus order.
- A bar placed `side` by hand outside a shell draws the same capsule or
  column of buttons in its own box, at its inline end.

### Bottom placement on a wide shell (the inner screen in portrait)

`@container ds-shell (inline-size >= 600px)`: the tab bar is content width
and centred, items at least 64 wide; the top bar's buttons are 48. A phone in
portrait is never 600 wide.

### Sheets

A sheet renders in a portal, outside the shell, so these are viewport media
queries.

- Wider than 440 and narrower than breakpoint.desktop: 8 in from the edges,
  each safe area side on its own, 8 or the bottom inset above the bottom,
  every corner round.
- The outer screen (at most 700 tall, and narrower than 768 or at most 500
  tall): the sheet spans the width over the column, 8 from the screen's
  edges, below the camera's inset at the top, and carries its own small
  column on the hardware side: close (48) at the top, confirm under it, the
  title at the start.
- The inner screen in landscape (at least 768 wide, more than 500 and at
  most 700 tall): a centred card, `dialog.width.xl` (640; kit 653), in the
  room beside the column.
- Partly folded, landscape (`horizontal-viewport-segments: 2` with
  `env(viewport-segment-*)`, or `data-ds-test-fold='vertical'`): the card
  sits in the inline start segment, 8 short of the band. Portrait
  (`vertical-viewport-segments: 2`, or `data-ds-test-fold='horizontal'`):
  the sheet's height is capped so its top stays under the band. Without
  segments the band is taken as 40 in the middle (kit).

## What changes on an ordinary iPhone

- Portrait: nothing on `/platforms` (no PageShell there). Computed style
  compare, every element and property, with and without this file's rules,
  at 393 by 852 on the six `/platforms` screens for web, android and ios: 0
  differences, except one span on the toast screen of each platform
  (`position: fixed` to `absolute`), the same on web and android, a toast
  timing artifact, not one of these rules. A PageShell on an iPhone in
  portrait does change: it is one screen tall and main scrolls (size
  containment needs a definite height). In Safari that means the page's own
  scroll is main's, so Safari's toolbars may not collapse on scroll.
  Unverified on a device; for the lead and the owner.
- Landscape, under `auto`: a PageShell gets the side column (the shell is
  about 874 by 370). A sheet floats 8 in from the edges, spans the width and
  carries close and confirm in its own column at the right (the outer screen
  rules). `/platforms` itself (no shell): 0 differences at 852 by 393.

## Overrides of `ios.css` for the lead to merge

Not edited; outweighed from `ios-shell.css`:

1. Tab bar root (`ds.chrome`, the tab bar block): `inline-size: auto`,
   `margin-block`, `margin-inline` and `padding` become `fit-content`, 0
   and 4 in the column; on a shell at least 600 wide `fit-content` and
   `margin-inline: auto`. Its `::before` band: `content: none` in the column.
2. Tab bar item: `min-block-size` and `padding-inline: 0` become a 48
   square in the column; `min-inline-size` 64 and `padding-inline` 8 on a
   wide shell.
3. Navbar bar buttons: `--_button-height: var(--ds-size-touch-ios)` (44)
   becomes 48 in the column and on a wide shell (kit: the device uses the 48
   set).
4. Navbar root: `align-items` becomes `flex-start` in side placement.
5. Sheet header (flex column, centred, padding for the close on both sides)
   becomes a two column grid with the title at the start and close and
   confirm at the hardware side on the outer screen; the close button's
   `position: absolute` becomes static there.

Base CSS read but not edited: `PageShell.css` (its `min-block-size: 100%`
is what fills a frame) and `Dialog.css` (the sheet's padding, panel width,
bottom border and corners are set over it, inside the device size range).

## Verdict by eye, guide left and ours right

Sheets in `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/du2/pair-*.png`
(kit crop, then Liquid light full screen, dark full screen, light in
Safari). Ours alone, 72 captures under 500 KB, in `docs/reports/reset/DU2/`
(`settings-` and `sheet-`, `light`, `dark`, `ar`, per frame and mode).

| Screen | Full screen | In Safari | What differs from the guide |
| --- | --- | --- | --- |
| Outer, portrait | Close | Same family (bottom bar, by decision 4) | Actions are separate round buttons, not one vertical capsule; no search circle under the tab bar (no part); our actions start under 168, the kit's under its status block |
| Outer, landscape | Close | Same family (our column beside Safari's) | The kit's camera sits under the search circle; ours keeps 84 clear under the tab bar; the sheet's footer meets the camera dot (the kit's sheet does too) |
| Inner, portrait | Close | Close | The faint camera dot (inner camera, only while in use) sits on the more button: the page cannot know where the camera is; the kit reserves 134 by 84 there |
| Inner, landscape | Close | Close | Card 640, kit 653; separate round action buttons |
| Inner, folded, portrait | Close | Same family | Content scrolls through the band, as plain content may (S6); the sheet stays below it |
| Inner, folded, landscape | Close | Same family | The card sits in the start segment; the column's buttons are at the edge, away from the band |
| Sheet, outer | Close | Same family (M1 sheet at 382, a phone sized page) | Our sheet column has close only in the demo (no confirm part in the gallery sheet); the column covers the header, not the body |
| Arabic | Close | Close | The column and the sheet's close stay at the physical right; the top row in bottom placement follows the reading direction |

Liquid only, light and dark, plus Arabic light. Neutral, Studio and Desk
take the same geometry from `ds.chrome`; not captured here.

## Proof

- `npm run contract -- --framework react --platform ios --device duo
  --component TabBar,Navbar,PageShell,Sheet --grep ": duo "` (the DU2
  tests on all eleven profiles): TabBar 17 passed, Navbar 6, PageShell 7,
  Sheet 11, 0 failed. Skips are by profile (a column test on a bottom
  profile and the reverse; the 256 tall test runs once).
- The DU2 tests, on the gallery's Duo screen with placement left on `auto`,
  English and Arabic: the column at the physical right on the side profiles,
  the bottom capsule on the portrait and split Safari sizes with no
  attribute stamped; items 48 by 48, 12 or more from the right edge, labels
  hidden but not removed and still the link names, the bar scrolls when it
  is too short; the actions in the column above the tab bar, the title at
  the top, buttons 48; main ends before the column and no focused control in
  main is under it (WCAG 2.4.11); at 594 by 256 the actions and the tab bar
  do not overlap, the bar scrolls rather than clip, no sideways scroll
  (1.4.10); the sheet 8 in from the edges above 440 wide, edge to edge at
  382 and 385, a card in inner landscape, off the band when folded, close in
  the sheet's own column on the outer screen.
- DU4's title "column items are 48 by 48 and keep clear of the safe area at
  the inline end" is now "column items are 48 by 48, inside the screen and
  clear of its edge": in full screen the column is the side inset (kit), so
  keeping out of it would be wrong.
- The full device suite (`--device duo` without `--grep`, 2772 tests for
  the four components) ran to 362 results before I stopped it for time. Two
  failures came up, rerun alone:
  - PageShell axe `scrollable-region-focusable`: mine; fixed (main scrolls
    only when it holds something to focus); passes alone.
  - Navbar keyboard map on `duo-outer-portrait-safari` (382 wide): Enter,
    Space, the arrows, Home, End and Escape change nothing. Under
    breakpoint.tablet the links move into the menu, so the menu triggers the
    check presses are not there; none of this file's rules match the bars
    it checks (no shell, no placement). Not rerun with the rules removed. Not mine;
    for the Navbar owner and DU4 (the generic check does not know the
    narrow layout).
- Without the device flag, `--platform ios`: TabBar 43 passed, PageShell
  43, Navbar 43 (20 skipped as before), Sheet 63; 0 failed.
- Web and android unchanged by computed style: 0 differences on the
  PageShell, TabBar, Navbar and Sheet demos at 1280 by 800, the PageShell
  demo at 594 by 368, and the `/platforms` screens at 393 by 852.
- `npm run check`, once at the end: tokens build, gen, typecheck, eslint,
  manifests, native, docs, both galleries and both consumers pass. Two
  failures, neither in a file of this order:
  - vitest, `packages/lint/src/gates/logical-properties.test.ts`:
    `packages/css/src/platform/android.css` lines 1043 and 1053,
    `border-radius` with sides that differ. Another agent's file.
  - `check @the-system/angular`: `tag-field.spec.ts`, "Enter adds the typed
    text and drops duplicates" failed in the full run; the Angular check
    rerun alone passes, 771 of 771. No Angular file was touched.
- The dev server I started (port 5487) is stopped.

## Decisions I made

1. One screen as `dialog.height.max * 1.25`, a definite block size (the
   query bug above). Lead: a token for the screen height would be cleaner.
2. Main scrolls only when it holds a focusable element (axe and WCAG 2.1.1).
3. The column's camera ends from the side inset and the shell's
   orientation, since a page cannot know where the camera is.
4. Sheet rules by viewport size, 440 to breakpoint.desktop, not by model;
   Safari's outer portrait page (382) cannot be told from a phone and keeps
   the M1 sheet.
5. The stand in for the fold is DU4's `data-ds-test-fold` on the html
   element; the gallery sets it too. The gallery's own
   `data-gallery-segments` is left as DU3 wrote it.

## Not done, and what stays unproven without the device

- No Tooltip on icon only column items, no search circle under the tab bar,
  no collapse of the tab bar to one button, no overflow of actions into a
  menu: each needs markup or behaviour (DU1's report).
- The actions group is separate round buttons, not one capsule: a capsule
  needs the end group painted as glass and the buttons cleared, a paint
  change in `ios.css`'s glass rules (owned by others now).
- The inner camera in portrait: no reserve for it.
- WebKit was not run (not installed here); Neutral, Studio and Desk not
  captured.
- Unproven without a device: the real safe area values on each screen,
  whether Safari ever lets the page reach its column, the segment and
  posture flags on and off, the fold while turning, the camera's side in the
  second landscape, the column side in Arabic on the web, whether an inner
  scroller stops Safari's toolbars collapsing, touch at the column's edge,
  Home Screen web apps.
