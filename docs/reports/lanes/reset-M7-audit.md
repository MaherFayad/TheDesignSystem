# Lane report: M7 iOS audit against the vendor kit

Order M7, report only. No source file was edited. Every verdict here is
mine, by eye, from sheets with the kit on the left and ours on the right,
plus measurements read from the kit renders and from our computed styles.

## Method

- Source of truth: the vendor's iOS and iPadOS 27 community kit in Figma,
  file key `Cltzs6FZW3N5yiC1x1cpQJ`, read with the read tools only (session,
  metadata, screenshot). Nothing was written to Figma. No asset, glyph, text,
  colour variable name or component name of the kit is in this repo. Kit
  renders stay in the scratch folder named at the end; no kit image is in
  the repo.
- Kit renders are at 1x. Sizes below are CSS px read from the renders
  (pixel scans of edges) or from node sizes in the page metadata. Colours
  are pixel samples of the render; on glass parts they include what is
  behind, so they are only a guide.
- Ours: the React gallery on its own Vite server (port 5291, stopped at the
  end), `?platform=ios&style=<liquid|neutral>&scheme=<light|dark>&chrome=0`,
  viewport 393 by 852 at 2x, reduced motion. Screens:
  `/platforms/screen?screen=<settings|form|alert|menu|sheet|toast>`, and the
  component pages `/c/<slug>`. Geometry of ours is from
  `getBoundingClientRect` and computed style, not from pixels.
- Glass tint, rim, blur and the held switch lens are being rebuilt by M6.
  Where I note them they are marked "M6 in progress" and are not ranked.

## Kit foundations, measured (for the findings below)

From the Colors page, pixel samples of the light and dark halves:

| Role | Light | Dark |
| --- | --- | --- |
| Page under grouped content | #f2f2f7 | #000000 |
| Grouped card (first level) | #ffffff | #1c1c1e |
| Second level, elevated | #f2f2f7 | #2c2c2e |
| Third level, elevated | #ffffff | #3a3a3c |
| Opaque separator (full width) | #c6c6c8 | #38383a |
| Hairline inside a card (Text Fields page) | #e6e6e6 | #363638 |
| Tint | #0088ff | #0091ff |
| Destructive | #ff383c | #ff4245 |
| Switch on | #34c759 | #30d158 |
| Gray control fill (stepper, segmented track, bordered button) | #eeeeef | #1c1c1f |
| Selected segment | #ffffff | #59595b |
| Progress track | #e4e4e4 | #2b2b2e |

Dark has two ladders on the Colors page, a base one (black, then
#1c1c1e, #2c2c2e) and an elevated one (#1c1c1e, #2c2c2e, #3a3a3c) for
sheets and popovers over the base.

Text styles page: the usual scale of large title, three titles, headline,
body, callout, subheadline, footnote and two captions. Our iOS body is 17,
subtitle 15, label 13, large title 34, which matches the default column.

## Coverage map

One row per distinct kit component. "Have" means a component of ours is
built for the same job and shape. "Other shape" means we cover the job with
a component of a different form.

| Kit page | Kit component (plain words) | Ours | Coverage |
| --- | --- | --- | --- |
| Action Sheets | Card of stacked actions with a title, anchored to the control that opened it | AlertDialog with stacked actions | Other shape |
| Activity Views | Share panel: people row, app row, action rows | none | Do not have |
| Alerts | Compact card, title, message, capsule actions side by side or stacked | AlertDialog | Have |
| Alerts | Alert with text fields in a grouped well | none (no field part) | Do not have |
| Buttons | Capsule buttons: filled tint, gray filled, plain; sizes 28, 34, 50; text, icon, both | Button, IconButton | Have |
| Buttons | Glass buttons over content, text and round icon | Button and IconButton in Liquid chrome (navbar, sheet close) | Have |
| Color Pickers | Colour panel with grid, spectrum, sliders, opacity, swatches | none | Do not have |
| Contextual Menus | Menu beside a lifted preview | ContextMenu | Have |
| Contextual Menus, Menus | Row of three icon and label quick actions at the top of a menu | none | Do not have |
| Date and Time Pickers | Inline month calendar with time row; compact date and time chips | none | Do not have |
| Empty States | Centred message, description, optional glyph, capsule primary action at the bottom | EmptyState | Have |
| Lists | Inset grouped rows: title, subtitle, detail, chevron, trailing controls | List | Have |
| Lists | Swipe actions | none | Do not have |
| Lists | Index bar | none | Do not have |
| Lists | Section header and footer text | Section heading outside the list | Other shape |
| Menus | Menu from a button: icon rows, groups, submenus, shortcuts | DropdownMenu | Have |
| Menus | Edit menu capsule (cut, copy, paste row) | none | Do not have |
| Notifications | Banner with app icon, title, message, time | Toast | Other shape |
| Page Controls | Dots on a small glass platter | none (Pagination is numbered) | Do not have |
| Popovers | Rounded panel with an arrow toward its source | Popover | Have |
| Pop-up Buttons | Plain tint label with an up and down glyph that opens a menu | Select (bordered field trigger) | Other shape |
| Progress Indicators | Thin bar | ProgressBar | Have |
| Progress Indicators | Spoked activity indicator | Spinner (ring) | Other shape |
| Segmented Controls | Capsule track, capsule thumb | SegmentedControl | Have |
| Sheets | Medium and large detent sheets, close and confirm round buttons, grabber | Sheet | Have |
| Sidebars | iPad sidebar list with search and section headings | Sidebar | Have |
| Sliders | Thin track, capsule thumb, optional end glyphs and ticks | Slider | Have |
| Steppers | Gray capsule with minus and plus, no value | NumberField (bordered field with value) | Other shape |
| Tab Bars | Floating capsule with a lens on the current tab | TabBar | Have |
| Tab Bars | Separate round search tab beside the bar | none | Do not have |
| Text Fields | Rows of fields inside a grouped card, clear button | Input (boxed field) | Other shape |
| Toolbars | Search field capsule | SearchField | Have |
| Toggles | Wide capsule switch, lens while held | Switch | Have |
| Toolbars | Bottom toolbar groups of round glass buttons | Toolbar | Have |
| Toolbars | Top bar: back button, title and subtitle, large title, trailing groups | Navbar | Have |

Foundations (Colors, Materials, Text Styles) are covered by tokens and are
used for the measurements above, not counted.

Counts: 35 component rows. Have 18. Other shape 7. Do not have 10.

## Sheets

One per family, kit left, ours right in Liquid then Neutral, light row on
top and dark row below. Where the kit page shows no dark sample the left
cell says so. All under
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/m7/sheets/`:
`alerts`, `action-sheets`, `buttons`, `buttons-glass`, `lists`,
`list-parts`, `menus`, `context-menus`, `notifications`, `popovers`,
`pop-up-buttons`, `progress`, `spinner`, `segmented-controls`, `sheets`,
`sidebars`, `sliders`, `steppers`, `tab-bars`, `text-fields`,
`search-fields`, `toggles`, `toolbars`, `navigation-bars`, `empty-states`
(each `.png`).

Kit pages with no dark sample of their own: Alerts (dark only for the action
capsules), Action Sheets, Sheets, Tab Bars, Toolbars, Contextual Menus,
Empty States, Pop-up Buttons. For those the dark verdict uses the Colors
page ladders and the dark samples of the same parts elsewhere in the kit.

## Verdicts per family

Format: verdict light / verdict dark, then the differences.

### Alerts: close / close

- Width: kit 300, ours 320. Kit inset from the card edge to the capsules 14,
  ours 16. Capsules 48 tall, 8 apart, side by side and stacked: same.
- Corner: kit about 34 to 36 (a continuous curve), ours 32.
- Default action: kit fills the default capsule with the tint (white label);
  cancel and destructive are gray capsules (destructive label red). Ours has
  no tint filled capsule; the cancel capsule shows a 2px focus ring on open
  (autofocus draws the visible ring), which reads as an outlined button the
  kit does not have.
- Dark: kit gray capsule is a light glass gray over the dimmed screen, the
  default capsule a lighter, brighter blue (sample #26aeff over the gray
  board). Ours Liquid dark: panel rgba(30, 30, 34, 0.94), capsules rgba
  white 10 percent, near black; reads darker and flatter than the kit.
  Neutral dark: navy panel and capsules (#222a3b family), not the neutral
  gray of the kit.
- Missing: text field well inside the alert (kit shows one and two field
  forms).
- Glass of the panel: M6 in progress.

### Action sheets: other shape / other shape

- Kit: the same 300 wide card as the alert, title and message at the
  leading edge, stacked 48 capsules 8 apart, no separate cancel group, and
  it sits next to the button that opened it (top trailing corner in the
  kit's phone example), not at the bottom.
- Ours: AlertDialog with stacked capsules gives the card; there is no
  anchored placement. A bottom sheet of actions would be wrong for this kit.

### Buttons: close / close (Liquid); not there / not there (Neutral)

- Kit sizes: 28, 34, 50 tall, all capsules; icon only buttons are circles of
  the same sizes. Ours Liquid: 44 capsules at 17 semibold, matching the
  50 size by look, no 28 and 34 rows on the page.
- Kit gray fill: light #eeeeef, dark #1c1c1f (a low gray on black). Ours
  Liquid soft neutral: light gray, dark #2c2c31 family, close.
- Kit tinted destructive soft: light #ffe3e3, dark #24090a. Ours: close in
  both.
- Disabled: kit turns every style into the gray fill with gray label.
  Not checked on ours in this run.
- Tint: kit #0088ff and #0091ff are brighter than ours (Liquid light
  rgb(10, 102, 214), dark rgb(32, 112, 232)). White text on #0088ff is
  about 3.6:1, below 4.5:1 for 17 semibold, so our darker tint is the
  WCAG choice. Keep it; note the visible difference.
- Neutral: 44 tall rounded rectangles with an 8 corner, 15 text, outlines.
  Not the kit family on iOS. Decision for the lead (see the fix list).

### Lists (grouped inset): same family / close (Liquid); close / not there (Neutral)

- Card inset: kit 20 (list example) and 16 (switch example) on a 402 wide
  screen; ours 18. Fine.
- Row height: kit 52 for one line, 68 for a row with a large image; two line
  rows stay near 52 to 60. Ours 56 for one line, 55 to 56 for two lines.
  4 px taller per row than the kit.
- Corner: kit about 24 to 26. Liquid 22, Neutral 12. Neutral reads square.
- Hairline: kit inside a card #e6e6e6 light, #363638 dark, from the text
  edge to the trailing edge. Ours Liquid #dcdde3 light, #38383f dark. Close.
- Selection: kit marks a chosen row with a plain tint check mark at the end;
  the filled circle with a check is the edit mode control. Ours shows the
  filled circle and an empty ring on every row, which is the kit's edit mode
  look. Neutral fills the circle in near black, not the tint.
- Dark: Liquid page #000000, card #1c1c1f: right. Neutral page #1b2232,
  card #222a3b, hairline #39445a: navy, not the kit's neutral grays.
- Leading glyphs: ours 24 in the tint, kit uses 28 by 20 symbol boxes or
  30 rounded images. Fine.
- Missing: swipe actions, index bar, section header and footer as list
  parts, row button (centred tint action row).

### Toggles (switch): close / close

- Size: kit 64 by 28, thumb 38 by 24, inset 2. Ours 63 by 28, thumb 38 by
  24. Same.
- On colour: kit green (#34c759 light, #30d158 dark). Ours the tint (blue)
  in both styles. The most visible colour difference on the settings screen.
- Off track: kit a plain gray fill with no edge (about #e5e5ea to #c5c5c7 in
  the render, #46464a dark), white thumb, no ring. Ours Liquid light: light
  track with a 1px edge and a 2px ring on the thumb (the 3:1 ruling).
  Neutral light: a dark gray track rgb(127, 135, 148), much heavier than the
  kit. Neutral dark: rgb(126, 138, 161), blue gray.
- Held lens: M6 in progress.

### Segmented controls: same family / close

- Track 32, kit thumb inset 2 and 28 tall; ours inset 3 and 26 tall.
- Labels: kit about 14, selected semibold. Ours 13 (Liquid) and 14
  (Neutral), selected 600, others 500. Fine.
- Light: kit track #eeeeef, thumb white. Ours Liquid rgb(236, 236, 241) and
  a near white glass thumb: same family.
- Dark: kit track #1c1c1f, thumb #59595b (a mid gray, solid). Ours Liquid
  track rgb(44, 44, 49) (lighter than the kit), thumb about #646467 at 88
  percent. Neutral dark: white 10 percent over navy and a blue gray thumb.
- Kit also has a large size, 50 tall. We have one size on iOS.

### Sheets: close / close

- Kit medium detent: the sheet floats 6 in from the sides and the bottom
  with all four corners rounded (the bottom ones follow the screen corner,
  about 50), it is glass, and it has a grabber 36 by 5 that is 6 below the
  top edge. Kit large detent: edge to edge, top corners about 34 to 38,
  solid card colour, grabber.
- Ours: edge to edge, top corners 38, no visible grabber (a 36 by 5 bar
  exists in the markup but is not shown without detents), close button 44
  round at 16 by 16: same.
- Kit header: title 17 semibold on the close button's row, and a round 44
  tint filled confirm button at the trailing corner. Ours puts a description
  under the title (centred, 15) and the actions as full width capsules at
  the bottom. Acceptable as content, but the kit's trailing confirm button
  is a missing pattern.
- Fields in our sheet are boxed inputs with a 2px focus ring; the kit puts
  fields in grouped card rows (see Text fields).
- Neutral light: the footer behind the two capsules is a different fill
  from the panel, so a band shows across the sheet.
- Dark: kit large sheet over a base screen uses the elevated ladder
  (#1c1c1e). Ours Liquid panel rgba(30, 30, 34, 0.94): right. Neutral
  #222a3b navy.

### Menus and context menus: close / close (Liquid); not there / not there (Neutral)

- Width: kit about 250, ours 250. Rows: kit about 40 to 44 with 17 text and
  20 glyphs; ours 44 at 17 in Liquid, 44 at 14 in Neutral.
- Corner: kit about 26 to 30. Liquid 22, Neutral 8.
- Groups: kit separates groups with a thin hairline inset from both sides,
  and uses a small gray heading for a titled group. Ours draws a 5 tall band
  across the full width (Liquid rgba black 8 percent, Neutral #e6e8ec). The
  band is the most visible difference.
- Missing: the quick action row of three icon and label buttons at the top,
  the lifted preview and dimmed screen of a context menu, and the edit menu
  capsule.
- Dark: kit menu is a dark glass gray. Ours Liquid matches the family;
  Neutral is navy. Glass tint: M6 in progress.

### Notifications (toast): other shape / other shape

- Kit banner: 64 tall (about 386 wide in the sample), corner about 22 to 26,
  a 38 rounded app icon 14 in from the leading edge, title 15 semibold and
  message 15 on two lines, time at the trailing top in secondary gray. No
  close button and no action button inside; actions open on press as a menu
  under it. Kit samples are dark glass only.
- Ours: 361 by 88, corner 28, a small bell glyph, a close button and an
  action capsule inside. Taller and busier than the kit. Our toast is a
  different job (an in app notice with undo), so this stays other shape; the
  height and the close button are what make it read wrong.

### Popovers: close / close

- Kit: white panel, corner about 34, a large soft shadow, and an arrow
  toward the source on any side. The dark sample on the kit page renders
  black on black, so I could not read the dark popover there.
- Ours: Liquid corner 22, Neutral 12 with a border; no arrow. The arrow is
  the missing part (contract change, see the fix list).
- In our open popover the field's focus ring is clipped at the inline end in
  Liquid light.

### Pop-up buttons: other shape / other shape

- Kit: borderless tint label 17 with a small up and down glyph, no box;
  opens a menu.
- Ours: Select as a bordered capsule (Liquid) or rounded box (Neutral) at
  44. A borderless variant of Select would match; decision for the lead.

### Progress: close / close (bar); other shape (indicator)

- Bar: kit 4 tall, light track #e4e4e4, dark #2b2b2e, fill the tint. Ours
  8 tall, Liquid light track #dbdce1, dark track white 10 percent which
  renders #1a1a1a on black, nearly invisible against the page.
- Indicator: kit uses spokes; ours a ring with an arc. Other shape. Keep
  ours (our own drawing, no vendor glyph).

### Sliders: close / close (Liquid); not there / not there (Neutral)

- Kit track 6 tall, light #e4e4e4, dark #3d3d41; thumb a white capsule
  38 by 24 with a soft shadow; held thumb grows to a glass capsule about
  58 by 38.
- Ours: track 4 tall; thumb a white disc about 36 round with a 1px edge in
  Liquid; a tint filled disc in Neutral (style recipe). The disc versus
  capsule thumb is the visible difference. Held lens: not built; M6 owns the
  glass part.

### Steppers: other shape / other shape

- Kit: 92 by 32 gray capsule (#eeeeef, dark #1c1c1f), minus and plus about
  17, a 1 by 18 divider (#d4d4d7, dark #36363b), no value, no border.
- Ours: NumberField, a bordered field with the value between the buttons.
  Different form. A stepper look for NumberField without a value is a
  decision for the lead.

### Tab bars: same family / same family

- Kit capsule bar about 62 tall; ours 353 by 64, 20 in. Lens, icons 28,
  labels 11 semibold: as M1 measured.
- Missing: the separate round search tab next to the bar (kit shows it on
  every row of the page). Glass: M6 in progress.

### Text fields: other shape / other shape

- Kit: fields are rows of a grouped card, 52 tall, 16 padding, 17 text, no
  border on the field, placeholder in tertiary gray, a round gray clear
  button at the trailing edge, hairlines #e6e6e6 and #363638 between rows,
  card white or #1c1c1e on #f2f2f7 or black.
- Ours: Input on iOS is a boxed field, 44 tall, corner 12 (panel corner),
  a fill and a 1px border, and a 2px focus ring. Reads as a web field.

### Search field: not there / not there (a bug)

- On iOS our SearchField is broken: the root stays 28 tall while the inner
  Input takes the iOS Input rule (44 tall, white or dark fill, corner 12),
  so a second box sticks out of the capsule in every style and scheme. Seen
  on `/c/search-field?platform=ios`. Cause: the rule
  `[data-platform='ios'] [data-ds='input']` in
  `packages/css/src/platform/ios.css` (line 337) also matches the Input
  nested in SearchField.
- Kit search field: a gray capsule about 36 tall with a leading search glyph,
  placeholder, trailing mic glyph; no border.

### Toolbars and navigation bar: close / close (Liquid); not there (Neutral toolbar)

- Kit bottom toolbar: groups of round 44 glass buttons, a glass capsule for
  each group. Liquid toolbar is a glass capsule with icon groups: close.
  Its selected item draws a ring in light, which the kit does not.
- Neutral toolbar on iOS is a rectangle with an 8 corner. Not the family.
- Navigation bar: large title 34 bold and round glass buttons: same as M1.
  Missing: back button with a chevron, and title with subtitle (kit shows
  two line titles left and centre aligned).

### Sidebars: close / close (iPad only)

- Kit is the iPad form: search capsule, section headings with a disclosure
  chevron, rows with detail. Ours has groups and counts; not a phone part.
  Not ranked.

### Empty states: close / close

- Kit: message 17 semibold, description 17 secondary, optional glyph in a
  tinted circle or a large glyph, and a full width capsule primary action
  near the bottom of the screen. Ours: a small boxed glyph, title, text and
  two buttons side by side under the text. Neutral uses rectangle buttons.

## Dark mode, on its own

- Liquid dark surfaces are right: page black, grouped card #1c1c1f, sheet
  and alert panels near #1e1e22, hairline #38383f. The gaps are in the
  controls: the segmented track is lighter than the kit (rgb(44, 44, 49)
  against #1c1c1f), the alert capsules are darker and flatter than the kit's
  glass grays, the switch on colour is blue not green, and the progress
  track nearly disappears.
- Neutral dark is navy throughout on iOS: page #1b2232, card #222a3b,
  hairline #39445a, segmented and switch tracks blue gray. The kit's dark is
  neutral gray on black. This is the largest dark gap and it is a style
  decision (see the fix list).
- Tint in dark: ours Liquid rgb(122, 176, 255) for glyphs and the current
  tab, rgb(32, 112, 232) for fills. Kit uses one tint, #0091ff, for both.
  Our light glyph blue reads pastel next to the kit.
- Disabled and pressed in dark were not compared in this run (see below).

## Ranked fix list

Size: S is a few lines in one file, M is one file with several rules, L is
more than one file or new markup. "Lead" marks a decision for the lead
(new component, new part, contract change, or a style ruling).

1. SearchField on iOS: stop the iOS Input rule from reaching the Input
   inside SearchField, and give SearchField its own iOS geometry (about 36
   tall gray capsule, no border). `packages/css/src/platform/ios.css`
   (input block, line 337). S. Visible in every style and scheme.
2. Switch on colour green on iOS in Liquid and Neutral, kit #34c759 and
   #30d158; and off track as a plain gray fill with no edge and no thumb
   ring, light and dark. `packages/css/src/platform/ios.css` (switch block,
   line 159) and `packages/styles/{liquid,neutral}/recipes/Switch.css`.
   M. Lead: the on colour is the style's tint today, and the off edge comes
   from the 3:1 ruling; a gray off track with no edge needs the ruling
   restated for iOS (the kit's off track against a white card is under 3:1).
3. Neutral on iOS, dark surfaces: take the platform's neutral gray ladder
   (black page, #1c1c1e card, #2c2c2e and #3a3a3c elevated, #38383a
   separators) instead of navy, and the platform corners (card 24 to 26,
   menu 26, toolbar capsule, button capsule). Files: the Neutral recipes and
   `packages/tokens/src/platform/ios.json`. L. Lead: the owner's ruling says
   Neutral follows the platform on phones where it sets no shape of its own;
   whether colour and corners count is for the lead.
4. Menu group separator: replace the 5 tall full width band with a hairline
   inset from both sides. `packages/css/src/platform/ios.css` (menu block)
   or the Liquid and Neutral DropdownMenu recipes. S.
5. Text fields on iOS: no border, no box, field rows in a grouped card look
   (52 rows, 16 padding, hairlines, round clear button), focus shown by the
   caret and a quiet ring only for keyboard focus. Input on iOS in
   `packages/css/src/platform/ios.css` and `packages/styles/{liquid,neutral}/recipes/Input.css`. M.
   A grouped field list (fields as list rows) is new markup: Lead.
6. Alert: 300 wide, capsules 14 in, corner 34; default action filled with
   the tint; no visible focus ring from autofocus on open for pointer users
   (keep it for keyboard). `packages/css/src/platform/ios.css` (alert
   block). S to M. The tint filled default needs AlertDialog to mark which
   action is the default: Lead if that is a new prop.
7. List rows 52 tall for one line, grouped card corner 24 to 26 in Liquid,
   selection as a plain trailing tint check outside edit mode.
   `packages/css/src/platform/ios.css` (list block) and the List demo. M.
8. Slider thumb a white capsule 38 by 24, track 6 tall, in Liquid and
   Neutral on iOS. `packages/css/src/platform/ios.css` (slider block, line
   218) and `packages/styles/{liquid}/recipes/Slider.css`; Neutral needs a
   Slider recipe or a platform rule that wins over its tint disc. M.
9. Segmented control dark: track #1c1c1f family, solid mid gray thumb
   (#59595b family); thumb inset 2 and 28 tall in both schemes.
   `packages/css/src/platform/ios.css` and
   `packages/styles/liquid/recipes/SegmentedControl.css`. S. Thumb glass:
   M6 in progress.
10. Progress bar 4 tall on iOS, dark track a visible gray (#2b2b2e family).
    `packages/css/src/platform/ios.css`. S.
11. Sheet: inset medium height sheets 6 from the sides and bottom with all
    corners rounded, show the grabber on sheets with detents, fix the
    Neutral light footer band, and offer a round confirm button at the
    trailing top corner. `packages/css/src/platform/ios.css` (sheet block),
    Neutral Dialog or Sheet recipe for the band. M. The trailing confirm
    button in the header is new markup: Lead.
12. Toast as a notification banner on iOS: 64 tall, corner 24, no close
    button by default, action on press. `packages/css/src/platform/ios.css`
    (toast block). M. Removing the close button is a behaviour change:
    Lead.
13. Popover arrow, corner 34, larger soft shadow. Arrow is a new part:
    Lead (contract change in `docs/contracts/anatomy.md` and the Popover
    manifest). Corner and shadow: S in `ios.css`.
14. Buttons in Neutral on iOS: capsules at 34 and 50 sizes. Neutral Button
    recipe. M. Lead (ruling 16, style wins on controls).
15. Tint in dark: one tint for glyphs and fills on iOS, near #0091ff, with a
    contrast check for white labels on filled buttons (likely fails 4.5:1 at
    17 semibold; then keep the darker fill and only align glyph blue).
    `packages/tokens/src/platform/ios.json`. S. Lead.
16. Select on iOS: a borderless tint trigger with an up and down glyph as
    the pop-up button look. Select recipe or `ios.css`. M. Lead (new
    variant).
17. Toolbar: drop the ring on the selected item in Liquid light; Neutral
    toolbar as a capsule. Liquid Toolbar recipe, Neutral needs one. S and M.
18. Empty state: primary action as a full width capsule near the bottom on
    phones; glyph without a box. `ios.css`. S to M.

Not there at all, each a new component for the lead: page control (dots),
date and time picker, colour picker, share panel, edit menu capsule, swipe
actions, index bar, separate search tab next to the tab bar, quick action
row in menus, stepper without a value (or a NumberField variant).

## What I could not read or did not do

- The kit's Examples page timed out once as a whole screenshot; I read its
  metadata and six of its phone screens (list, alert, action sheet, toggles,
  tab bar, menu) instead. Keyboard, lock screen and home screen examples
  were not read (out of scope).
- The kit renders at 1x only (the tool does not upscale), so hairline
  weights and radii are within a pixel or two.
- Dark samples are missing on several kit pages (listed under Sheets). The
  dark popover on the Popovers page renders black on black and could not be
  read.
- Pressed and disabled states of ours were not captured; the kit shows
  disabled for buttons, toggles and sliders. A follow up should capture ours
  held and disabled.
- Our open Select did not open in the capture (the trigger click timed out),
  so the Select sheet shows the closed triggers only.
- Studio and Desk were not audited (the order names Liquid and Neutral).
- `npm run check` was not run, as the order asked.

## Scratch files (outside the repo)

- Kit renders: `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/m7/kit/`
- Our captures: `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/m7/ours/`
- Sheets: `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/m7/sheets/`
- Capture and sheet scripts: `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/m7/tools/`
