# Round 2, lane F2: the android platform file

One file changed: `packages/css/src/platform/android.css`. All looks stay
proposed. Measured on the gallery at port 5322, React, `platform=android`,
412 by 915, English, `dir=ltr`, `chrome=0`, light, in studio, desk, neutral
and liquid, the way lane Q3 measured. Before and after pictures and the raw
numbers (`before.json`, `after*.json`, `colon*.json`) are in
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p2/f2/`
(below as `f2/`); side by side sheets are `f2/sheet-*.png` (before on top,
after under it). The file as it was is kept as `f2/android.before.css`.

## One line per Q3 finding

1. SearchField inner box. Fixed. The field rules skip an Input that is a
   part (`:not([data-part])`), as `ios.css` does. Inner Input now equals the
   field in all four styles (xs to lg: 48, 48, 48, 56 root and input, same
   y, fill transparent); was 56 tall, 12 above and below, rgb(233, 233, 233).
   Lines 643 to 681, 1217. Sheet `f2/sheet-F01.png`.
2. TabBar expanded search. Fixed. Capsule 48 tall, input 48 at the same y in
   all four styles (was input 56 over a 40 capsule); text box 144.8 (studio,
   desk) and 137.8 (neutral, liquid), was 112.8 and 101.7; the four items 48
   wide, were 46 and 45.5. Lines 643 to 681, 1351 to 1354. Sheet
   `f2/sheet-F02.png`.
3. Desk Input bowl. Passed on to F6: the bowl is Desk's pill
   `--_input-radius` (`packages/styles/desk/recipes/Input.css` 27 to 29)
   against the filled field's square top corners (`android.css` 655 to 663).
   Not changed here.
4. Desk Dialog lights. Fixed. The two step rule of `ios.css`: minimize and
   zoom hide always, all three hide once the title bar has a close control.
   Desk's title bar already carries a close button (sm, 40 with its 48 hit
   part), so no light shows now; was close, minimize, zoom at 24. Studio,
   Neutral, Liquid unchanged. Lines 1526 to 1545. `f2/sheet-F04.png`.
5. Liquid slider handle. Passed on to F7 (`packages/styles/liquid/recipes/Slider.css` 25 to 27).
6. Desk time dialog band. Passed on to F6 (`packages/styles/desk/recipes/TimeField.css` 12 to 15).
7. Time dialog focus fill. Fixed. The focused box reads
   `--_date-field-segment-bg-focus` again: studio rgba(10, 10, 10, 0.2), desk
   rgba(255, 216, 77, 0.36), neutral rgba(37, 99, 235, 0.14), liquid
   rgba(10, 102, 214, 0.16); the other boxes keep surface 3. Under forced
   colors it is Highlight. The colon now uses the font's case sensitive
   forms: it sits at the digits' middle in desk, neutral and liquid; Studio's
   font has no such forms, so its colon is unchanged. Lines 1820 to 1838,
   1844 to 1847. `f2/sheet-F07.png`, `f2/colon-sheet.png`.
8. Icon button glyph at sm and lg. Fixed. icon-button page: sm 40 by 40
   with a 24 glyph, lg 58 by 56 (66 in neutral) with a 24 glyph, was 16 at
   both; xs keeps 16 (32 container). Sized buttons that are a part of
   another component keep their parent's glyph. Lines 111 to 123. The Navbar
   lg demo case did not lay out in my runs (box 0), so it was read on the
   icon-button page only.
9. Desk light selected yellow. Passed on to F6 (`packages/styles/desk/tokens.light.json` 588 to 595).
10. ActionSheet center and anchored. Fixed. The bottom sheet geometry is
    guarded by `[data-placement='bottom']`. Center: 28 at all four corners,
    the component's rows (studio 2 px corner, neutral 8, desk and liquid
    pill) with their gap (6 to 8). Anchored: the 4 px menu corner, same rows.
    Was 28, 28, 0, 0 with square rows and no gap. Bottom unchanged: 28, 28,
    0, 0, rows square, no gap. Lines 1690 to 1726. `f2/sheet-F10-center.png`.
11. ActionSheet Cancel on the edge. Fixed. The bottom panel keeps 16 plus
    `--ds-inset-safe-bottom` under the last row: Cancel 851 to 899 of 915 in
    all four styles, was 867 to 915. Lines 1716 to 1722.
    `f2/sheet-F10-bottom.png`.
12. Studio alert band. Passed on to F5 (`packages/styles/studio/recipes/Dialog.css` 75 to 82).
13. SegmentedControl shape. Fixed. The pill is set only when the shape is
    not default or square. neutral default 8 px, pill 999, square 6; liquid
    square 10; desk square 6 (desk default stays 999 because Desk's
    `radius.control` is the pill); studio 2 px for all (its recipe). Was 999
    for every shape. Lines 545 to 569. `f2/sheet-F13.png`.
14. Sheet half height footer. Fixed on android. With detents the panel keeps
    the room it is moved down by empty at its end, so the footer stays on the
    screen and the body scrolls: footer 851 to 915 of 915 in all four styles,
    was 1284 to 1352. Lines 1575 to 1584. `f2/sheet-F14-half.png`. The same
    gap is in every platform: passed on to F3 for `Dialog.css` 850 to 855.
15. Desk SwipeActions pills. Passed on to F6: Desk's button radius
    (ds.recipes) wins over `android.css` 1168 (`--_swipe-actions-radius: 0`,
    ds.platform), as ruling 16 says for a control. Whether square ends are a
    platform rule or a style choice is the lead's call.
16. Targets under 48. Fixed in part. ColorSlider thumb 48 by 48 (was 32);
    ColorArea thumb 48 by 48 (was 36); DateField and TimeField segments 48
    wide (were 24 to 27); SearchField root 48, lg 56 (was 32, 36, 40);
    TabBar items 48 beside the expanded field (were 46); Desk lights gone
    (finding 4); PasswordField root 56 at every size, as the android Input
    (was 32 to 40, with the same 56 inner box as finding 1). Lines 684 to
    698, 1222 to 1242, 1351 to 1354. Not fixed: ColorSwatchPicker grid
    cells may now grow to 48, but the demo's 12 column grids stay 32 because
    12 cells of 48 do not fit 380; SectionIndex keys stay 24 by 24 (the file
    keeps Material's fast scroll strip, and 48 keys would make finding 17
    worse).
17. SectionIndex overlap. Passed on: `SectionIndex.css` 25 (F3) and the demo
    layout (F8).

## Commands

- `npm run typecheck`: passed, no errors.
- `npx vitest run packages/css packages/lint packages/styles --testTimeout=120000`:
  21 files, 116 tests passed (the 4 known desk dark glass contrast notes
  printed as before).
- `DS_CONTRACT_WORKERS=1 npm run contract -- --framework react --platform android --component <Name>`:
  results below.

CONTRACT_RESULTS

## What I did not do

- Dark scheme and Arabic were not re-measured; every change is geometry or
  a token already used in both schemes.
- Hover, press and the ripple were not checked.
- The gallery reloaded often while other lanes edited (F4's Calendar export
  broke pages for a minute); runs were repeated until each style gave a
  value.
