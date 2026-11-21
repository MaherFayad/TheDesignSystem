# Order Z2: the mobile components in Desk

Lane: ds-style. Style: `desk`. Scope from `docs/plan/reset-mobile.md`, Z1
and Z2. Mid order the lead moved Calendar, the colour group, DateField,
DatePicker, TimeField, WheelPicker, Stepper and Slider to order Z4. They were
captured before that and nothing in them was edited here.

## How it was checked

- Every component of the scope on its gallery page, in Desk, light and dark,
  English and Arabic, on `platform=ios` at 390 by 844 and on `platform=web`
  at 1280 by 800, full page, plus the first overlays opened by their demo
  triggers (ActionSheet, AlertDialog, Sheet, Dialog, Toast, SelectionMenu,
  SharePanel). 31 components, 352 pictures before.
- The ten iOS test screens in the phone frame, Desk, light and dark, English
  and Arabic (40 pictures before, 40 after), against Liquid light as the
  reference for states and layout.
- axe (`color-contrast`, `target-size`) on every component page and on the
  open overlays, Desk only, both platforms, both schemes, both languages, and
  on the ten screens. Violations found: one, the TabBar search field on ios
  (below). axe cannot measure text on the glass; those cases were read by
  eye and with the contrast gate.

Sheets (outside the repo), each labelled with style, component and phase:
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/z2/sheets/`,
`before-<Component>[-ios|-web].png`, `after-<Component>-ios|web.png`,
`before-screen-<id>.png`, `after-screen-<id>.png`.

## Defects

| Component | Axis | What | Result |
| --- | --- | --- | --- |
| Sheet (and SharePanel, which opens in it) | ios, all | The Desk title bar kept its own 10px inset under the 38px sheet corner: the first letter of the title touched the curve, and the title sat 6px left of the description and the body (16px). | Fixed, `recipes/Dialog.css`: on ios the title bar takes `--_dialog-padding`. |
| AlertDialog | ios, all | The title in the title bar started at 10px while the description started at 30px; the description touched the bar's lower edge. | Fixed, same rule, plus a gap under the bar (`margin-block-end`, since ios.css in `ds.chrome` zeroes the description's top padding and wins over a recipe padding). |
| Dialog | ios, all | Same misalignment; the description touched the bar. | Fixed, same rules. |
| SegmentedControl | ios and web, dark | The thumb (surface 3 on an overlay track on ios, overlay on overlay on web) was close to the track: the selection read by the label weight alone. | Fixed, new `recipes/SegmentedControl.css`: the thumb is Desk's yellow pill with the gold edge and the light edge, as soft Tabs; the selected label takes the primary text. Shows in the settings and booking screens too. |
| TabBar | web, both | The current item was the base gray pill and bright text; on ios Desk already marks it in the primary. A base shape where Desk marks selection in its yellow. | Fixed, new `recipes/TabBar.css`: `--_tab-bar-fg-active` is the primary on surface on every platform. Pill and bold weight stay. |
| Toast | ios, all | A toast with a title only: the title sat at the top of the ios banner's three rows, 4.5px above the middle of the 28px icon tile. The Desk recipe means it to sit on the tile's middle. | Fixed, `recipes/Toast.css`: a title with no description and no action spans the rows and centres. Web is unchanged in effect (it was already centred). |
| Dialog | ios | The window lights show on a phone dialog. ios.css hides them only for AlertDialog and Sheet. | Shared, not fixed: `packages/css/src/platform/ios.css` line 3232 (selector lacks `[data-ds='dialog']`). |
| Sheet, SharePanel, AlertDialog title bar | ios, Arabic | The title bar keeps the macOS right to left layout (title centred, close at the right) although ios hides the lights; in English the title is at the start. Mixed alignment between the languages. | Shared, not fixed: `packages/css/src/components/TitleBar.css` line 103 matches `:has(> [data-part='controls'])` even when the controls are `display: none`. |
| Navbar | ios, all styles | The large brand title that wraps ("Northwind design studio", the Arabic one) overlaps its own lines. The same in Liquid and Neutral. | Shared, not fixed: `packages/css/src/components/Link.css` line 275 (standalone link line height is the 24px target) wins inside the brand set by `packages/css/src/platform/ios.css` lines 2627 to 2645. |
| TabBar | ios, demo | axe target size: in the case "The search field while the bar sits in the side column" the two fields (English, Arabic) overlap by 28px. The same overlap shows in Liquid (36px fields, axe passes there); Desk's 44px fields make it fail. | Shared, not fixed: `packages/react/src/components/TabBar/TabBar.demo.tsx` line 212 with the foot placement in `packages/css/src/platform/ios.css`. |
| TabBar | ios, demo | The accessory row overlaps the label text of the case above it. The same in Liquid. | Shared, not fixed: the demo layout, `TabBar.demo.tsx`. |

Checked and left alone (they read as Desk and work): ActionSheet, Banner,
List, SectionIndex, SelectionMenu, SwipeActions, Navbar (apart from the line
above), PageShell, Pager, SearchField, SplitView, and the ten screens. The
known Desk dark glass failures of the contrast gate (text subtle on glass,
glass tinted, dock and title bar) were not reopened.

## Files changed

- `packages/styles/desk/recipes/Dialog.css` (ios title bar inset and gap)
- `packages/styles/desk/recipes/Toast.css` (title alone centred)
- `packages/styles/desk/recipes/SegmentedControl.css` (new)
- `packages/styles/desk/recipes/TabBar.css` (new)
- `packages/styles/desk/index.css` (generated by `npx tsx scripts/gen-index.ts`: the two new imports)

No file of the Z4 group was touched.

## Decisions

- Desk's segmented thumb is the yellow pill of soft Tabs, not a stronger
  gray: Desk marks every selection in its primary, and the switches and
  tabs on the same screens are already yellow.
- The ios title bar fixes use a `[data-platform='ios']` guard in the
  recipe: the title bar is Desk's own optional part, and ios.css sets no
  inset for it.

## Commands and results

- `npm run typecheck`: passed, no output.
- `npx vitest run packages/styles packages/css`: 1 file, 4 tests passed.
- `npx vitest run packages/lint` (the gates: no raw color, no dash, tokens,
  logical properties, forced colors, contrast): 19 files, 109 tests passed;
  the contrast gate lists its 4 known Desk dark failures.
- Contract runs, `DS_CONTRACT_WORKERS=2 npm run contract -- --framework react --platform <p> --component <Name>`:

CONTRACT_RESULTS

## Not checked

- Android and macOS platforms, the duo frames, reduced transparency, more
  contrast and forced colors were not captured (the recipes keep the base
  fallbacks; the forced colors gate passes).
- Overlays beyond the first two or three demo triggers of each component.
- The Angular gallery.
- Hover and pressed states, and motion.
