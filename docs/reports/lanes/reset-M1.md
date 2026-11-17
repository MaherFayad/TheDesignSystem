# Lane report: M1 iOS phone surfaces

Order M1 of `docs/plan/reset-mobile.md`. Every look here is **proposed**
until the owner signs it on a phone. Not committed.

## Method

References are the vendor's own apps on Mobbin, platform `ios`, 393 CSS px
wide captures (1179 px at 3x; the wallet ones are 402 wide). They were kept
in a scratch folder outside the repo and measured there; nothing of them is
in this repo. Ours was captured on the React gallery at 393 by 852 with
`?platform=ios`, put beside the reference in a sheet, looked at, fixed and
captured again: four passes on the settings screen, three on the alert,
sheet, menu and toast screens, then dark, Neutral, Studio, Desk and Arabic.

References used (cite these, never copy them):

| Part | Reference |
| --- | --- |
| Tab bar, large title, round glass buttons, list rows | https://mobbin.com/screens/97b9afbb-a285-4693-bc73-efd070107178 |
| Round back and action buttons, large title, list | https://mobbin.com/screens/c5710dec-38e5-42eb-aeaa-125ae7ae0251 |
| Dark list | https://mobbin.com/screens/c5f56c6e-1acc-40d1-bd73-3f00539bcd22 |
| Grouped inset cards, wide capsule switches | https://mobbin.com/screens/f3ce79fa-8661-4833-a601-04c40cc95ef5 |
| Sheet: large top corners, round close, capsule primary | https://mobbin.com/screens/f47c250a-246c-4f45-86d9-d9b6bda422f3 |
| Sheet with a segmented control and a capsule primary | https://mobbin.com/screens/fc377805-7b0a-4357-bf4d-8d22caf32074 |
| Alert, two capsule actions in a row | https://mobbin.com/screens/0eda93cb-4d26-4d33-8210-2aee76bb1d91 |
| Alert, stacked capsule actions | https://mobbin.com/screens/2c211a27-d000-451b-8aaf-232a64502ccf |
| Alert, long message | https://mobbin.com/screens/7e640096-a0a1-4631-b95a-090487cf9c44 |
| Context menu | https://mobbin.com/screens/d09f35c1-c150-4580-b8a9-08fc8b7858fa |

The switch press (the thumb lifts into a raised lens while held, then
switches) is from the owner's ruling and from memory of the current system;
I did not fetch the vendor's guidance pages in this order, so no number of
the press is verified against a published source. The stills cannot show
it.

## Measurements (reference, at 393 wide)

| Part | Measured | Ours now |
| --- | --- | --- |
| Tab bar | capsule 352 by 62, 20 from the sides and the bottom edge, padding 4, lens 84 by 54, icons 28, labels about 10 | capsule 351 by 62, 20 in, padding 4, lens 86 by 54, icons 28, labels 11 (`type.label-small`, the nearest token) |
| Navigation bar | no fill; title 34 bold, 20 in; buttons 44 tall glass, 16 in, 8 apart, on the title's row | the same; the title link drops its underline and tint |
| Switch | track 63 by 28, thumb 38 by 24 | track 63 by 28, thumb 38 by 24 |
| Segmented control | 32 tall, capsule track, capsule thumb 2 in, label 13 | the same; the corner is the style's control corner, the thumb concentric |
| Grouped list | card 16 in, corner about 24, rows 48 to 52, text 17, subtitle 15, hairline from the text | rows 52, text 17, subtitle 15, glyph 24 in the tint, hairline from the text to the padding; corner is the style's panel corner (Liquid 22, Neutral 12) |
| Alert | 320 wide (36 in), corner about 34, title 17 semibold and message 15 at the leading edge 30 in, capsules 48 tall, 16 from the edges, 8 apart | 320 wide, corner 32, the rest the same; no icon |
| Sheet | top corners about 37, close 44 round at 16 by 16, primary capsule about 50 | top corners 38, close 44 round at 16 by 16, title 17 centred on its row, actions 50 tall full width capsules |
| Menu | about 250 wide, glass, rows 44 to 48, glyphs leading, no hairlines | min 250, the style's panel corner, rows 44, glyphs 20 leading, a band between groups |

## Per part

Verdicts are mine, by eye, beside the reference sheets.

### Tab bar
- Matched: floating capsule over the content (the gallery's iOS phone places
  it fixed over the body so rows scroll under it), the inset, the height,
  the concentric lens, icon and label sizes, text color at rest and the tint
  on the current item, strong glass with a fallback that keeps 4.5:1 for the
  current label on the lens over black or white content with no blur.
- Still differs: Lucide line icons where the reference uses filled symbols
  (a hard limit); labels 11 not 10 (no 10 token on the platform); the lens
  is a flat gray glass, no refraction.
- Verdict: same family.

### Navigation bar
- Matched: no bar fill or rule, a large title on the content at the leading
  edge, round and capsule glass buttons 44 tall.
- Still differs: the large title does not collapse into a small centred
  title on scroll (the Navbar has no scroll part; that is component work),
  and the gallery bar has no back button (the screen is a root screen).
- Verdict: same family at rest; not there for the scroll behaviour.

### Switch
- Matched: the wide capsule and the capsule thumb; the press now starts on
  `pointerdown` (`data-pressed`, see below). In Liquid and Neutral the held
  thumb grows by 1.4, stretches a little toward its travel and turns into a
  clear lens with a rim and a lift, then switches on release; reduced
  motion keeps the clear lens and drops the growth and travel. Studio and
  Desk keep their own switch with a stretch under the finger and no glass.
- Still differs: Liquid's off track keeps its outline and the off thumb its
  2px edge in light (the 3:1 ruling, DECISIONS item 2), where the reference
  has none; in light the raised lens is a white blob with a soft shadow, not
  the refracting glass of the system.
- Verdict: close.

### Segmented control and tabs
- Matched: 32 tall capsule track with a capsule thumb in Liquid; soft Tabs
  read the same. The track takes the style's control corner by its shape
  axis and the thumb's corner is concentric, so a square block in a round
  track cannot happen in any style.
- Still differs: every size is 32 on iOS (the platform has one size).
- Verdict: same family.

### Grouped list
- Matched: white card on the gray page, rows, type, tinted glyphs, hairlines,
  chevron.
- Still differs: the corner is the style's (Liquid 22, Neutral 12), the
  reference is about 24; Neutral would need its own List recipe to take the
  platform corner, which I did not add (fewest recipes).
- Verdict: same family in Liquid, close in Neutral.

### Alert
- Matched: width, corner, leading text, capsule actions side by side for
  two and stacked for three, no icon, plain title, danger in the action
  label, no frosted page behind in Liquid.
- Still differs: the panel is the style's glass, a little whiter than the
  reference; Studio keeps its title band and Desk its yellow title bar (they
  keep their paint).
- Verdict: same family.

### Sheet
- Matched: 38 top corners, a round glass close at the top leading corner
  (it moves to the right in Arabic), a title centred on that row, content 16
  in, full width capsule actions. No grabber without detents; the top strip
  still drags.
- Still differs: the sheet is as tall as its content, edge to edge; the
  current system insets a medium detent sheet from the screen edges.
- Verdict: same family.

### Menu and toast
- Matched: glass card, panel corner, 44 rows at 17, leading glyphs at 20, no
  hairlines; the toast is a rounded card from the top with 28 corners.
- Still differs: the system has no toast; ours is a banner in the menu's
  family. No preview lift or dimming for a context menu.
- Verdict: close.

## Component and markup changes

- Switch: a new root state `data-pressed` from `pointerdown` to `pointerup`,
  `pointercancel`, lost capture or a mouse leaving before a drag
  (`markPressed` in `packages/motion/src/helpers/switch-drag.ts`, wired in
  `packages/react/src/components/Switch/drag.ts`). Every press rule of
  `Switch.css` reads it beside `:active`. Listed in the Switch manifest.
- Sheet: on `ios` and `android`, a style that turns on the title bar and its
  window controls (Desk) now also renders the close button in the title bar,
  since the platform CSS hides the window controls there. A phone sheet
  always shows a close control.
- Angular needs the same two changes: set `data-pressed` on the switch root
  from `pointerdown` to `pointerup`, `pointercancel`, lost capture and
  `pointerleave` before a drag (the helper is in `@the-system/motion`), and
  render the sheet's close button in the title bar on phones when the
  window controls are on.

## Web and Android

- `platform=web`: computed style compare of every `[data-ds]` and
  `[data-part]` element (23 properties, both pseudo elements and the box),
  the working tree against HEAD, on `/c/<id>` for switch, sheet,
  alert-dialog, dialog, tab-bar, navbar, list, segmented-control, tabs,
  dropdown-menu, toast and drawer, and the five `/platforms/screen` screens,
  in all four styles, plus a held switch on `/c/switch` in all four styles:
  72 pages, **zero change**.
- `android`: `android.css` and `android.json` were not touched. Two shared
  changes reach Android: the switch press rules now also start from
  `pointerdown` (`data-pressed`), and a Desk sheet now shows its close
  button in the title bar.

## Checks

- Contract run, `--platform ios --tag ios-M1`
  (`docs/reports/contract-react-ios-M1.json`): AlertDialog, Dialog, Drawer,
  DropdownMenu, Sheet and Toast 63 passed each; List, SegmentedControl,
  Switch, TabBar and Tabs 43 passed each; Navbar 43 passed and 20 skipped
  (open checks with no menu to open). No failure. The 96 tests "no sideways
  scroll at 320px" (the reflow check, every style, ltr and Arabic) all pass.
  Two small edits landed while the run was going (the tab bar's strong
  glass, the sheet's drag strip); the gallery serves source, so the later
  tests ran on them.
- `npm run check`: every step passes. A Switch test that looked a rule up
  by its selector text now names the two selector rule, and a new test
  checks `data-pressed` from pointerdown.
- Recording pack `packs/M1.json`: switch, dialog open (the alert form) and
  sheet drag, Liquid and Neutral, iPhone frame, light and dark: 12 clips
  recorded in `docs/reports/reset/M1/record/`, sign sheet
  `docs/reports/reset/signoff/M1.md`. The switch clips show the first change
  17ms after the finger lands, while it is down: the lens shows on press. The clip
  list has no tab bar press and no AlertDialog open: two clips the lead may
  add to `packages/contract-tests/src/record/clips.ts`, which this order
  does not own.

## Evidence

`docs/reports/reset/M1/`, ours only, 393 wide:

- `settings-<style>-<scheme>.png`: tab bar, navigation bar, switch,
  segmented control and list. Liquid light and dark, Neutral light, Studio
  and Desk light.
- `alert-*`, `sheet-*`, `menu-*`, `toast-*`, `tabs-*`,
  `segmented-control-*`: the same styles and schemes.
- `*-liquid-light-ar.png`: Arabic, right to left.
- `switch-press-<style>-<scheme>.png`: rest, held, released, at 3x.

## Decisions I made

1. Paint of the bars and sheet buttons (glass, lens, text colors) is in
   `ds.platform`, so a style recipe still repaints it; Liquid repaints the
   lens, the navbar and the dialog backdrop in its own recipes under an
   `ios` guard.
2. Chrome lengths read fixed tokens (`space.fixed.*`, `size.*`,
   `shape.corner.*`, `type.*`) composed with `calc()`, so the chrome is equal
   in every style and density. No platform token was added.
3. The glass lens of the switch is drawn by the Liquid and Neutral recipes;
   the platform file draws the plain press Studio and Desk keep.
4. The 3:1 ruling keeps Liquid's off switch edge in light.

## M6

Order M6 of `docs/plan/reset-mobile.md`, the iOS glass material, after the
owner said "I don't see the glass effect in iOS at all but outlines".
Proposed until the owner signs it on a phone. Not committed by me.

### What changed

- `packages/css/src/platform/ios.css`: a new section, "the clear material
  (order M6, proposed)", in `ds.platform`. On the tab bar and its lens, the
  navigation bar's buttons, the sheet's close button, the menu, the toast
  banner and the segmented thumb: a tint of the style's solid glass mixed
  with `transparent` (lifted with white in dark), a backdrop blur of the
  style's `blur.backdrop` times a step with saturation, a rim of inset
  shadows (bright upper edge, fainter lower edge and ring, a soft inner glow,
  a dark hairline outside) and the style's glass lift. The flat border is
  transparent while the material is on. Small chrome is clearer than panels,
  as in the vendor's kit. No new token name; `color-mix()` and `calc()` over
  tokens only.
- One private property picks the strength: `--_ios-glass` is `clear`,
  `regular` or `frosted`, read with style queries
  (`@container style(--_ios-glass: ...)`). A style opts in by setting it.
  Liquid and Neutral set `regular` on their root in their Switch recipes,
  after DECISIONS.md, the iOS glass switch. Studio and Desk do not set it.
- Fallbacks: under `prefers-reduced-transparency`, `prefers-contrast: more`,
  `[data-contrast='more']`, forced colors and no `backdrop-filter`, every
  part takes back the solid paint of M1 (checked in light and dark, both
  styles, from computed styles).
- `packages/styles/liquid/recipes/TabBar.css`: on ios Liquid hands back its
  edge, shadow, blur and lens (`revert-layer`) and drops the scroll edge
  fade, which read as fog over the content. Its contrast rules still win.
- `packages/styles/liquid/recipes/Toast.css`: on ios Liquid hands back its
  blur.
- `packages/styles/{liquid,neutral}/recipes/Switch.css`: the opt in, and the
  held lens rim is the same material (thin bright edge, inner shade, lift).
  The lens ring that keeps 3:1 on the track is a hairline on the held iOS
  lens (it was 2px); white on the on fill it measures 3.68 Liquid light,
  3.41 Liquid dark, 3.98 Neutral light, 3.67 Neutral dark. The thumb tint
  while held is 8% (was 12%).
- `apps/gallery-react/src/Platforms.tsx` and `platforms.css`: our own
  coloured content on the iOS phone screen (gradient covers and simple shapes
  in the chart tokens' colours, two cards, four tiles, a list, a wide
  banner), hidden on the other platforms. On ios the navigation bar stays at
  the top so content scrolls under its buttons, and the large title fades on
  scroll where the browser has scroll linked animation.

### References

- The vendor's own apps on Mobbin (the M1 crops, kept in scratch):
  https://mobbin.com/screens/97b9afbb-a285-4693-bc73-efd070107178 (light tab
  bar, buttons), https://mobbin.com/screens/c5f56c6e-1acc-40d1-bd73-3f00539bcd22
  (dark list, bottom glass buttons),
  https://mobbin.com/screens/d09f35c1-c150-4580-b8a9-08fc8b7858fa (context
  menu), https://mobbin.com/screens/fc377805-7b0a-4357-bf4d-8d22caf32074
  (segmented control), https://mobbin.com/screens/f3ce79fa-8661-4833-a601-04c40cc95ef5
  (switch), https://mobbin.com/screens/f47c250a-246c-4f45-86d9-d9b6bda422f3
  (sheet close), and the blue playlist screen used in M1.
- The vendor's iOS and iPadOS 27 community kit in Figma, read only (pages
  Materials, Tab Bars, Menus, Toggles), for measurements. No asset, name or
  image of it is in the repo.

Measured from pixels: the kit's small glass over gray stripes is about 50%
white in light and a light gray at about 18% in dark; its medium and large
panels are about 73% white in light; its menu over a blue band is about 72%
near white in light and lets some blue through in dark. The music app's
light tab bar is about 58% white over a dark photo; its dark glass buttons
lift black content to about #24. The rim in the kit is a bright inner line
on both long edges with a dark hairline outside it and a glow band inside.

### Strength shipped

`regular`, the closest to the references: bars and buttons 52% of the
solid glass in light (kit small glass about 50%, music app about 58%), panels
74% (kit menu about 72%); dark bars 62% of the solid glass lifted 10% white,
dark panels 89%. `clear` (34%, 56% panels) is closest to the kit's small
glass in dark but fails label contrast (below). `frosted` (72%, 86%) passes
everything and reads as a white pill again. The owner picks by changing the
one value in the two Switch recipes.

### Verdict by eye (reference left, ours right, light and dark rows)

- Tab bar: same family. Colour and blurred shapes show through, the rim and
  lift read as glass, not an outline. Differs: our lens in light is a denser
  white glass where the reference lens is a clearer gray (needed for 4.5:1
  on the tint label); the reference's lighter blur keeps text behind more
  legible; no refraction at the ends.
- Navigation buttons: same family in both schemes.
- Menu: same family; colour carried in light, a dark glass with a little
  colour in dark. Differs: a little denser in dark than the kit (contrast).
- Toast banner: same family as the menu (the system has no toast).
- Sheet close: same family.
- Segmented thumb: close. It sits on its own track, so there is little
  behind to show.
- Held switch: close. Thin bright rim, inner shade and lift now; the kit's
  lens reaches farther past the track (M1 geometry, scale 1.4) and shows a
  refraction band we do not draw.

### Contrast, from pixels (WCAG 2.2 1.4.3 and 1.4.11)

Probe: each label or glyph is captured as is and with its text and glyph
transparent; the text color is compared with every backdrop pixel in its
box, at six scroll positions over the lightest and darkest content of the
demo (white cards, the gradient covers, the black or navy page). Minimum
per item, `regular`:

| Item | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| Tab label | 7.68 | 5.86 | 7.41 | 5.15 |
| Tab label, current (tint on lens) | 5.25 | 5.40 | 5.63 | 4.55 |
| Tab glyph | 7.94 | 4.02 | 6.88 | 4.59 |
| Tab glyph, current | 5.26 | 5.41 | 5.65 | 4.55 |
| Bar button label | 10.60 | 6.94 | 10.02 | 5.16 |
| Menu item | 4.59 | 4.75 | 4.85 | 4.87 |
| Menu glyph | 4.78 | 4.81 | 5.05 | 4.96 |
| Toast title | 14.38 | 14.12 | 14.20 | 11.01 |
| Toast close glyph | 7.55 | 7.18 | 6.81 | 6.38 |
| Sheet close glyph | 12.88 | 5.08 | 12.55 | 4.18 |

Tints raised only for contrast: the lens (to 60% light, 90% dark) and the
dark panels (84% to 89%). `clear` fails: menu items 3.19 to 3.85, dark bar
button label 2.57 to 3.57, Neutral dark tab label 4.03, Liquid dark tab glyph
2.24. `frosted` passes everything (lowest 4.69).

### Studio and Desk

They never used the glass material on iOS chrome (their glass tokens are
their solid surface and their blur is 0) and do not opt in, so they keep the
M1 paint. Computed style compare against the pre M6 commit, ios, Studio
and Desk, 36 pages: no paint property changed; the only changes are boxes,
height, inset and the navbar's sticky position on the gallery phone
screens, from the new content.

### Checks

- `platform=web` and `platform=android`: computed style compare (23
  properties, pseudo elements and boxes) against the pre M6 commit, 72 pages
  each, four styles, a held switch included: zero change.
- `npm run contract -- --framework react --platform ios --component
  TabBar,Navbar,DropdownMenu,Toast,Switch,SegmentedControl,Sheet --tag
  ios-M6`: DropdownMenu, Sheet and Toast 63 passed each; SegmentedControl,
  Switch and TabBar 43 each; Navbar 43 passed and 20 skipped, as in M1. The
  320px reflow tests pass. Report `docs/reports/contract-react-ios-M6.json`.
- `npm run check`: every step passes.

### Evidence

`docs/reports/reset/M6/`, ours only, each under 500 KB:
`screen-<screen>-<style>-<scheme>.png` (settings scrolled so colour sits
behind the bars, menu, sheet, toast; all four styles, light and dark),
`<style>-<scheme>-<part>.png` 3x crops (tabbar, nav, menu, switch held,
toast, close), `strengths-liquid-<scheme>.png` (clear, regular, frosted),
`before-settings-liquid-light.png`, and
`fallback-reduced-transparency-liquid-light.png`.

### Decisions I made

1. The material is in `ios.css`, gated by a style query on `--_ios-glass`,
   which the style sets. Material belongs to the style, so the style opts in;
   the platform file names no style. The lint reads `var()` only, so the
   style query reading a private property no component declares passes; the
   lead may want the gate checked by a rule.
2. A browser without style queries for custom properties gets the M1 paint.
3. The order asked for a lens brighter than the bar: in light the reference
   lens is grayer and clearer, but a clear lens put the tint label at 3.09,
   so the lens is a denser glass in both schemes.
4. Refraction with an SVG displacement map in `backdrop-filter` works in
   Chromium only; not shipped, left as an optional later step.
