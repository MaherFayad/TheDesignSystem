# Reset P2, lane F7: Neutral and Liquid packs

Lane: F7, `packages/styles/neutral/**`, `packages/styles/liquid/**`.
Sheets and scripts: `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p2/f7/`.
Gallery on port 5327, stopped when done.

## Findings taken

| Finding | Result |
| --- | --- |
| Q5 F1, Neutral iOS soft Buttons, no focus (blocker) | Fixed. `neutral/recipes/Button.css` 93: `--_button-shadow: none` is now `0 0 transparent`. Computed focus shadow is now `rgba(0,0,0,0) 0 0 0 0, <ring>`. Pixel crops, focused against unfocused, Neutral iOS: ActionSheet (Anchored, Center, Bottom, No danger action), AlertDialog (Leave the board sm and md, New folder, Add a link), Sheet (Open sm, md, lg sheet, the icon button, and Discard invite inside the open sheet): 4018 to 12880 changed px each, ring change 4.74:1 light, 9.22:1 dark. |
| Other `none` shadows in the packs | Not a defect. Searched both packs. The other `none` shadow values (`--_toast-shadow`, `--_command-palette-item-shadow`, `--_menu-item-shadow`, `--_list-box-option-shadow`, `--_segmented-control-thumb-shadow`, `--_select-item-shadow`, and the `box-shadow: none` in neutral Toast 114 and liquid TabBar 179) are each used alone in `box-shadow`, never in a list (grep of `packages/css/src`). No token in `liquid.css` or `neutral.css` resolves to `none`. Left as is. |
| Q3 5, Liquid light Slider and RangeSlider handle on android (major) | Fixed. `liquid/recipes/Slider.css`: on android the pack shows the thumb's `::after` again, sized to the 4 by 44 bar (the same insets as the platform's focus ring in `android.css` 529 to 537), radius xs. The light edge is `color.border.control` `#70737e`: 4.26:1 on the page `#f2f3f7`, 3.23:1 on the empty track `#d3d5dd`, 4.73:1 against the white bar (was 1.1:1 and 1.45:1). Dark unchanged in look (white on dark, 17:1). The rule names `[data-platform='android']` only, so iOS and web are untouched. It also fixes a second defect: while held, Liquid sets the bar fill transparent and the hidden `::after` took the lens with it, so the bar disappeared on android while dragged; now the lens shows (pictures `held-liquid-android-*.png`). |
| Q5 F9, ColorPicker tabs ring 2.36:1 in Liquid dark (major) | Passed on to F3. Re-measured: ring `#5a9dff` over Liquid's lens `rgb(94,94,101)` is 2.36:1. The cause is the one colour inset ring in `packages/css/src/components/Tabs.css` 66: Neutral (no Tabs recipe) and Desk fail the same way, so a Liquid only ring would hide the component fix. F3 has it in its order. |
| Q5 F13, Liquid slider thumb under forced colors (minor) | Passed on to F1. The band is the iOS capsule `::after` in `packages/css/src/platform/ios.css` 293 to 299 (`background-color: var(--ds-color-glass-backdrop-bright)` becomes Canvas over the Highlight disc that `Slider.css` 480 paints); the pack's iOS rule only sets a shadow, which forced colors drops. |
| Q4 12 (F13 in the Q4 text), SearchField placeholder cut in Neutral and Liquid | Passed on to F3: `packages/css/src/components/Input.css` 222 `text-overflow: clip`. No pack rule involved. |
| Q1 F11, F16, F17 and Q2 12 (shared with Liquid) | Passed on: causes are in `platform/ios.css` (611, after 3300, 3011 to 3020) and the music library screen, owned by F1 and F8. No pack rule involved. |
| Q3 component table, neutral and liquid columns (2, 7, 8, 10, 11, 13, 14, 16, 17) | Passed on to F2 (`android.css`) and F3 (`TabBar.css` 200 to 213, `DateField.css`); only 5 has its cause in a pack (fixed above). |

## Item 5, own audit (iOS, Liquid and Neutral, light and dark)

Sweep: 32 mobile set components, 2 styles, 2 schemes (128 pages), each at
rest and with the first demo overlay opened by keyboard. Per page: axe
`color-contrast` (1.4.3), sideways overflow of every `[data-ds]` box and of
the page, and every Tab stop (up to 30, 16 in the overlay) cropped focused
and blurred. Flagged stops were checked by eye and against Studio.

- 1.4.3: 0 axe violations on all 128 pages, rest and open.
- Layout: page width 390 everywhere, no part outside the screen.
- Focus: about 2900 stops. Flags in both packs were checked: the rings on
  Calendar previous, SegmentedControl items, TabBar search, ColorPicker
  trigger, ColorSwatchPicker add, ColorSlider are present at 4.7:1 or more
  (the sweep caught them mid transition). SectionIndex rows, WheelPicker
  columns and the ColorSwatchPicker list flag the same in Studio, so they
  are not pack causes; the SectionIndex row ring shows on a direct check.
  ColorArea at 2.7 to 2.8:1 is Q5 F8, F3's.
- New findings with a cause in these packs: none beyond the held android
  handle above (major, fixed).
- New, not a pack cause, minor: on SectionIndex iOS the section letter "C"
  sits under the line "One section: every key goes to it" (Neutral light,
  picture `pairs/probe2c.png`); likely Q3 17 or the demo, for F3 or F8 to
  confirm.

## Files

- `packages/styles/neutral/recipes/Button.css` (line 93 and a one line note)
- `packages/styles/liquid/recipes/Slider.css` (new android block before the iOS block)

No new files, so `gen-index.ts` has nothing to rewrite.

## Commands

- `npm run typecheck`: pass.
- `npx vitest run packages/styles packages/css packages/lint --testTimeout=120000`: 21 files, 116 tests pass (4 known Desk dark glass notes).
- `DS_CONTRACT_WORKERS=1 npm run contract -- --framework react --platform ios --component Button`: 43 passed.
- same, `--component Slider`: first run 1 failed with `net::ERR_INSUFFICIENT_RESOURCES` on Studio dark Arabic while my sweeps ran; re-run 43 passed.
- same, `--component RangeSlider`: 43 passed.

## Not done

- Hover and press were not swept on every component; press opacity is Q5
  F11 (F1's), hover has no role on a touch screen.
- Selected states were measured only as the demos show them at rest.
- Arabic and forced colors were not swept in item 5.
- The full `npm run check` was not run, as ordered.
