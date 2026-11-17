# Lane report: DU3 device frames in the gallery

Order DU3 of `docs/plan/reset-duo.md`, section 9. React gallery only.
Proposed: every look here waits for the owner and a check on a real device.

## What I built

- `apps/gallery-react/src/Duo.tsx` (new): the page `/platforms/duo` and the
  screen inside each frame, `/platforms/duo/screen`.
- `apps/gallery-react/src/duo.css` (new): the frames and the screen, tokens
  only. Device geometry comes from `Duo.tsx` as unitless point numbers in
  `--duo-*` custom properties, multiplied by the `--ds-space-px` token, the
  way `/platforms` keeps its frame sizes in markup.
- `apps/gallery-react/src/App.tsx`: the two routes and a "Foldable iPhone"
  link in the gallery bar (route registration, as the order allowed).

Six frames, each in two modes: outer screen portrait (466 by 678) and
landscape (678 by 466), inner screen portrait (669 by 951) and landscape (951
by 669), and the inner screen partly folded in both orientations.

- In Safari: the iframe is the page Safari gives (382 by 580, 594 by 368,
  669 by 867, 951 by 585). The rest of the screen is Safari's chrome, drawn
  as plain shapes in the page background colour, `inert` and `aria-hidden`:
  the side column on the outer screen, the status strip and the bottom bar
  on the outer screen, the top bar on the inner screen.
- Full screen: the iframe is the whole screen. The screen's own Theme
  element carries the inset override, and on the folded frames the fold
  attribute.

The frames are our own drawings: a dark body with rounded corners (the hinge
side square on the outer screen), the screen, a plain dot for the camera
(faint on the inner screen, which shows its camera only while in use), a
dashed 40 point band for the fold. No kit image, glyph, layer name or text is
in the repo.

The screen inside is a `PageShell` (the plan's size container `ds-shell`)
holding the iOS phone demo of `/platforms`: the top bar with "Edit list", the
M6 coloured content, a segmented control, an inset list, a "Share board"
button that opens a Sheet, and the tab bar. English and Arabic copy.

## URL keys

On `/platforms/duo`, beside the usual axes (`style`, `scheme`, `density`,
`dir`, `lang`, `contrast`, `glass`, `chrome`):

| Key | Values | Left out |
| --- | --- | --- |
| `screen` | `outer`, `inner` | both |
| `orient` | `portrait`, `landscape` | both |
| `fold` | `flat`, `folded` | both |
| `mode` | `safari`, `full` | both |
| `view` | `settings`, `sheet` (the sheet open) | `settings` |
| `placement` | `auto`, `bottom`, `side` | `auto` |

The page has a select per key, as the gallery bar has per axis. The frames
always run on `platform=ios`. The screen route takes `frame` (one of
`outer-portrait`, `outer-landscape`, `inner-portrait`, `inner-landscape`,
`inner-folded-portrait`, `inner-folded-landscape`) with `mode`, `view` and
`placement`.

Gallery only overrides on the screen's Theme element:

- Full screen: `--ds-inset-safe-top`, `-bottom`, `-start`, `-end`. Outer
  screen: right 84 in both orientations. Inner portrait: top 24, bottom 20.
  Inner landscape: right 84, bottom 20.
- Folded: `data-gallery-segments="horizontal"` (landscape, a band down the
  middle: what `(horizontal-viewport-segments: 2)` turns on) or `"vertical"`
  (portrait, a band across), with `--gallery-fold-start` and
  `--gallery-fold-size` measured from the page's own edge (455.5 and 40 full
  screen; 371.5 in Safari portrait, where Safari's top bar takes 84).

## What renders now, and what waits

- Renders now: every frame and mode, both schemes, the four styles, left to
  right and Arabic, the sheet. DU1 landed while I worked: `placement` on the
  page reaches PageShell, TabBar and Navbar (`data-placement` checked in the
  frame for `side` and `bottom`, absent for `auto`). Nothing to switch on.
- Waits for DU2: the side column itself, the `ds-shell` container (computed
  `container-name` is `none` today), the 48 point bars, the content width
  tab bar on the inner screen and the sheet geometry. Today every frame
  shows the M1 top bar and the floating tab bar at the bottom, whatever the
  placement.
- Until DU2 pads by the insets, `duo.css` pads the phone screen by the
  emulated insets in full screen mode, and the fixed tab bar pads on its own.
  These rules are the gallery's and can go when DU2 lands.
- Waits for DU6: anything that reads `data-gallery-segments`. Only the drawn
  band shows the fold today.

## Decisions I made

1. Safari's chrome split. The plan gives Safari's page width and small and
   large viewport heights, not where the chrome sits. Outer screen: a status
   strip of 60 on top (screen height less the large viewport height), a bar
   of 38 at the bottom, and the 84 column at the right. Inner screen: a bar
   of 84 on top, as on an iPad.
2. Partly folded in Safari uses the flat page sizes; the caption says the
   folded size is not published.
3. Full screen insets on the inner screen are 24 on top and 20 at the bottom
   in portrait, not the plan's 84 and 95: those are our own bars' guides in
   the kit, and an inset of 84 would push the top bar under a blank strip.
   Unverified, like every inset here.
4. Insets are emulated physically, as the device would report them: the
   column is on the right, so it is `--ds-inset-safe-end` in English and
   `--ds-inset-safe-start` in Arabic. Where our own column goes in Arabic is
   owner decision 3, for DU2.
5. Camera dots: outer portrait at the top of the column, outer landscape at
   its bottom (kit), inner portrait top right, inner landscape at the top of
   the column. On outer landscape Safari's column shapes sit at the top so
   the camera stays clear.
6. `Platforms.tsx` does not export its art pieces and is not mine to edit, so
   `Duo.tsx` repeats the markup; the drawing is the shared `platforms.css`.
7. The dark body: a black body vanishes on the black dark page, so in dark
   the body takes `--ds-color-bg-surface-3`.

## What looks wrong, by eye

- Outer landscape and inner landscape: the floating tab bar covers much of a
  short screen (368 tall in Safari). Expected until DU2's `auto` rule moves
  it to the side.
- Inner portrait full screen: the faint camera dot sits on the "Edit list"
  button. DU2's top bar must keep clear of the camera region.
- Inner screen: the tab bar runs the full width; the kit keeps it content
  width and centred (DU2).
- Folded frames: content runs through the band, as plain scrolling content
  may (S6); the top bar's button and the sheet do not avoid it yet (DU6).
- Outer full screen with the sheet open: the sheet spans the column area, as
  the kit shows; its own small column is DU2's.
- The safe area values, Safari's chrome split and the folded Safari size are
  all unverified (plan section 12).

## Screenshots

`docs/reports/reset/DU3/`, 74 files, each under 500 KB, at 1x:

- `<frame>-<mode>-liquid-<light|dark>.png`: the 24 base pictures, every
  frame and mode in Liquid light and dark.
- `...-view-sheet.png`: the same 24 with the sheet open.
- `...-dir-rtl-lang-ar.png`: the 24 in Arabic, right to left.
- `outer-portrait-full-liquid-<light|dark>-placement-side.png`: the side
  placement forced (renders as bottom until DU2).

## Checks

See the order's report for the `npm run check` result.
