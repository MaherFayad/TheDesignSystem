# Round 2, lane F6: the Desk pack

Lane: ds-style. Files: `packages/styles/desk/**` only, plus
`packages/styles/desk/index.css` rewritten by `npx tsx scripts/gen-index.ts`
and the token build output (`packages/tokens/dist`, not in git). All new
looks stay proposed. Nothing committed.

Numbering: findings 1 to 19 are the headings of `reset-P1-Q2.md`. The plan
gives F1 "Q2 4 and 13" and F4 "Q2 6 and 7" by the ranked list of that
report: those are findings 2 and 13 (F1) and 7 and 8 (F4); "Q2 8" for F8 is
finding 3.

## Q2 findings

1. Banner solid action ink: fixed. New `recipes/Banner.css`: the actions of a
   solid banner take the banner's on-solid ink on a clear pill. "Open status
   page" 2.19:1 to 6.47:1 (light ios, `#ffffff` on `#b91c1c`) and 6.41:1
   (dark web, `#111827` on `#f87171`); the Arabic warning action 2.80 to
   5.02:1 (light), 1.73 to 8.26:1 (dark). Computed, composited.
2. SegmentedControl unselected labels on ios light: passed on to F1
   (`packages/css/src/platform/ios.css` line 319, the overlay 10 track).
3. Music library Play all and Shuffle all: passed on to F8 (the screen
   buttons); the cause is `packages/css/src/components/Button.css` 619 to
   628, not the pack.
4. Danger text on dark windows: fixed by the token.
   `tokens.dark.json` `color.state.danger.text` `#f87171` to `#fc8f8f`
   (`color.state.danger.border` and `solid` unchanged). Pixel, dark:
   Dialog title 4.36 to 5.52:1 (ios), 4.49 to 5.60:1 (web); Dialog footer
   "Delete project" on ios 4.37 to 4.97:1 (median, 4.82:1 on the brightest
   glow pixels); AlertDialog footer "Delete board" on ios 4.50 to 5.05:1. A
   first try at `#fa8383` left the ios footer at 4.54:1 (4.40:1 on the glow),
   so the value went one step further. Other uses only gain (every danger
   text pair in dark sits on a dark fill): Field errors 9.46:1 or more,
   the contrast gate green.
5. Fields in a grouped well: fixed. `recipes/Input.css`: the pill corner and
   the fill no longer reach `[data-variant='plain']`; a plain field takes
   the 3px ring corner of Input.css and `padding-inline: space.xs` (5px).
   AlertDialog "Add a link" (ios light): 999px and 0px to 3px and 5px; the
   ring now clears the first letter (sheet `after/05-*`). The lone field
   keeps its pill (ios: 999px, control fill).
6. DatePicker chip invalid and open: fixed. New `recipes/DatePicker.css`
   restates the placeholder, open and invalid states over Desk's neutral
   recipe. Invalid: `#262522` to `#991b1b` in light (5.69:1 on the chip;
   the danger text was 4.43:1 there, so light takes danger on-tint) and
   `#fc8f8f` in dark (8.27:1). Open: the primary ink (`#765700`, 5.92:1 in
   light; `#ffd84d`, 9.92:1 in dark) and a 2px gold edge, so open differs
   from rest by more than color.
7. Empty title bar on a Popover with no title: passed on to F4
   (`packages/react/src/components/Popover/Popover.tsx` 338 to 352).
8. Sheet title bar controls on ios: passed on to F4 (`Sheet.tsx` 637 to 660)
   and F1 (`ios.css` 3619 to 3640).
9. TabBar on web: fixed. `recipes/TabBar.css`: on web and macos the bar is a
   Desk glass pill (glass material, blur 24px with saturation, the glass
   hairline all round, the light edge, window soft lift, inset from the
   edges); a bar with the accessory row takes the card corner so the pill
   end does not cut the accessory. Measured: radius 0 to 999px, background
   `rgb(248, 247, 245)` to `rgba(31, 31, 31, 0.72)` (dark), backdrop filter
   none to `blur(24px) saturate(1.3)`. Solid under reduced transparency,
   more contrast, forced colors. ios and android keep their bar shape.
10. One selected mark: fixed. `recipes/List.css` (on F3's new
    `--_list-item-bg-active`, `--_list-item-fg-active`,
    `--_list-item-edge-active`), `recipes/Sidebar.css` (the existing
    `--_sidebar-item-*-active` properties; F3 added no new Sidebar names, so
    the edge rides on `--_sidebar-item-ring` while not focused),
    `recipes/Navbar.css` (`--_navbar-link-fg-active`). Current List row,
    Sidebar item and the Navbar phone menu (a Sidebar) item: gray overlay
    10 to the yellow fill, `#111827` ink (12.8:1), 1px gold edge `#987400`
    (3.36:1 against the light desk). Navbar web current link: `#765700`,
    6.7:1, over its gold edge and bold weight.
11. DatePicker on web, date chip and time field in two treatments: passed
    on, not fixed. The height gap at lg comes from the size mapping in
    `packages/css/src/components/DatePicker.css` (F3); the audit's cause in
    `desk/recipes/TimeField.css` is unconfirmed and a paint change alone
    would not line them up.
12. Navbar bar group focus on ios, shared: passed on to F1 (`ios.css` 3011
    to 3020).
13. Stepper digits: passed on to F1 (`ios.css` 758).
14. TabBar long labels on ios: passed on to F3
    (`packages/css/src/components/TabBar.css` label width).
15. SplitView ring clip: passed on to F3 (`SplitView.css`).
16. Text selection: fixed. `recipes/Window.css`: `::selection` in Desk's
    yellow `#ffd84d` with `#111827` (12.82:1) in both schemes; forced colors
    keep the system pair.
17. Sheet grabber, two heads: fixed. `recipes/Dialog.css`: the title bar runs
    up under the grabber's strip (target min, the touch size on android) and
    the grabber is drawn over it in the gold, so the sheet has one head.
    Checked ios with detents, web and android dark (sheet `after/17-*`).
    ios without detents was already one head.
18. PageShell navigation sheet: passed on to F3 (`PageShell.css`, the
    Sidebar keeps its width in the drawer).
19. DatePicker inline calendars on web: passed on to F8 (the demo).

## Q3 and Q5 items

- Q3 3, Desk Input on android: fixed. `recipes/Input.css`: Desk sets no
  corner and no fill on android, so the platform's filled field stands.
  Radii 3, 3, 999, 999 to 3, 3, 0, 0; fill `rgb(240, 239, 236)` (surface 3).
- Q3 6, TimeField band in the android time dialog: fixed.
  `recipes/TimeField.css`: the row fill is transparent there. Band
  `rgba(18, 18, 17, 0.06)` to `rgba(0, 0, 0, 0)`; the boxes stay.
- Q3 7, the focused box fill: not Desk's (android.css 1718), F2.
- Q3 9, selected states by the yellow alone (1.07:1): fixed by an edge.
  Calendar selected day: new `recipes/Calendar.css`, 1px gold inset edge,
  3.36:1 against the desk, ink 12.82:1. WheelPicker band:
  `recipes/WheelPicker.css` band edge `#987400` on ios and android.
  SegmentedControl: the Desk recipe already draws the gold inset edge on
  android too (measured `rgb(152, 116, 0) 0 0 0 1px inset`). TabBar pill:
  `recipes/TabBar.css`, the pill is the yellow with the gold edge and the
  ink of the yellow on the icon (android and web; ios has a lens, no pill).
- Q5 F10, TabBar search placeholder dark web: fixed. `recipes/TabBar.css`:
  muted text in dark, 3.28:1 to 5.77:1 (computed on the `#292929` well).
  The ios half is F1's.

## Files

New: `packages/styles/desk/recipes/Banner.css`, `Calendar.css`,
`DatePicker.css`, `List.css`, `Navbar.css`, `Sidebar.css`.
Changed: `packages/styles/desk/recipes/Input.css`, `TabBar.css`,
`Dialog.css`, `TimeField.css`, `WheelPicker.css`, `Window.css`,
`packages/styles/desk/tokens.dark.json`. Generated:
`packages/styles/desk/index.css` (six import lines).

## Commands

- `npm run typecheck`: passed.
- `npx vitest run packages/styles packages/css packages/lint packages/tokens
  --testTimeout=120000`: 175 passed, 2 failed. The contrast gate lists only
  its 4 known Desk dark failures. The 2 failures are the token snapshots in
  `packages/tokens/tests/build.test.ts` ("matches the CSS snapshot", "matches
  the theme object snapshots"); the only diff is `desk.dark`
  `state.danger.text` `#f87171` to `#fc8f8f`. The snapshot files are not
  mine: the lead updates them with `npx vitest run packages/tokens -u`.
- Contract: see the result lines below.

CONTRACT_RESULTS

## Sheets

`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p2/f6/`:
`before/` and `after/` (same names), and side by side `cmp-*.png`,
`chk1.png`.

## Not done

- Finding 11 (passed on, see above).
- Desk's neutral button recipe sets `--_button-bg` in `ds.recipes`, which
  also beats the hover and press swap of Button.css: a Desk neutral soft or
  solid button keeps its rest fill on hover. Not in the audit; not changed
  here. The Banner recipe adds its own hover and press veil.
- Arabic, reduced transparency and forced colors were read from the rules,
  not captured.
