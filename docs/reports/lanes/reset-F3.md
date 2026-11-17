# Lane report: F3, the iOS look after the first three test screens

Order F3 (Liquid and Neutral, light and dark, `ios`, and `android` where a
request names it). Proposed until the owner signs it. Not committed by me.

Sheets with the reference left and ours before and after are in scratch only,
since they hold Mobbin, vendor and kit crops:
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/f3/sheets/`
(`1-longpress*.png`, `1-inbox*.png`, `2-settings-a.png`, `2-end-a.png`,
`3-ml-a.png`, `x-duo2.png`, `p2-*.png`, `9-dates.png`, `9-wheel-colour.png`,
`final-*.png`). Our own captures, each under 500 KB, with no reference in
them, are in `docs/reports/reset/F3/` (the three screens on the phone in both
styles and schemes, Arabic, the inner screen in landscape, and the long press
menu, filter menu and banner states).

## Files

| File | What |
| --- | --- |
| `packages/css/src/platform/ios.css` | Light panel tint back to 74, the letter halo gone; pushed form heading; bar buttons at `start`; the bar group, the accessory and the compact form; bar and toolbar glyphs 22; the neutral fill capsule 48; the page grounds; List rows (chevron, press fill, hairlines, wrapped rows, control rows, swipe room); section headers; the pop-up value in rows; the modality gated field line; the toast line; sidebar and split view; the light danger label; dates, wheels and colours |
| `packages/css/src/platform/ios-refraction.css` | Panels dense frosted in both tiers (no bend in front of the blur); the denser action sheet in both schemes; Neutral's dark tier 1 tints mixed from the gray ladder; a bar with an accessory gives up its own filter like a bar with a disc; `start`, the bar group and the accessory in every glass list |
| `packages/css/src/platform/ios-shell.css` | No header hairline or padding, main 16 at the sides, no footer hairline; the header beside the navigation column; the bar room grows by the accessory; the accessory in the column and beside a hand placed column |
| `packages/css/src/platform/android.css` | Ripple on action rows; dates, wheels and colours |
| `packages/css/src/components/List.css` | The swipe menu room only while shown (the C3 request) |
| `packages/styles/neutral/recipes/Button.css` | On ios, a soft neutral button is the kit's gray capsule (it was white, and navy in dark) |
| `packages/shared/src/refraction.ts`, `refraction-dom.test.ts` | `start`, the back button, the bar group and the accessory are tracked; the buttons inside a group are not |

## Status per item

| Item | Status |
| --- | --- |
| 1 Panels dense, halo gone, danger label | done |
| 2 Top bar, page padding, grounds, bottom room | partly: the settings screen's own 4 and its sticky bar holder are screen requests (1); no collapsing title (request 5) |
| 3 Bar forms (start, back disc, group, accessory, compact, neutral fill) | done; the compact bar keeps one platter (see the iPhone list) |
| 4 List rows and section headers | done |
| 5 Pop-up value, swipe room, field line, toast line | done |
| 6 Neutral dark gray on black | done in our CSS; the screen host's drawn frame stays navy (request 3) |
| 7 Sidebar and split view | partly: tint row, quiet divider and the header beside a PageShell column done; the settings split view's title over its list is a request (4) |
| 8 Glyphs 22, capsules 48 | done |
| 9 Dates, wheels, colours, android | partly: iOS and android rules in; the android time dialog boxes not done (request 6); the android contract run not run |

## What changed per item

1. **Panels.** The light tint of the menu, the long press menu, the action
   sheet and the toast is 74 percent again and the letter halo (and its three
   fallback resets) is gone. 74 alone was not enough: with the low blur of
   order F2 the text behind still read through the rows. Panels now take a
   heavy blur (backdrop blur times 4) in both tiers. In tier 1 the bend no
   longer runs in front of that blur: measured in Chromium, a chain of the
   SVG bend and then a blur left the content behind sharp (the filter menu
   over the inbox read through its rows); under this much frost the bend does
   not show anyway. Bars and buttons keep the clear glass and the bend. The
   action sheet is denser (92 light, 97 dark) and its danger label darker in
   light and lighter in dark: over black content behind the light sheet the
   label went from 2.0 (L2) to 5.82; over white behind the dark sheet from
   3.46 to 4.92.
2. **Top bar and page.** No hairline under the PageShell header and no
   header padding of its own, so the back button is 16 in and the large title
   20 in (34 bold, row gap 0, the brand form the same). Main has 16 at the
   sides. Page ground: a shell holding a grouped list or grouped field set
   (`List` variant inset or divided, `Fieldset` variant inset) takes the
   grouped gray, every other shell the white plain ground; dark is black in
   both. The bar room after the content grows by the accessory (48 and 8) when
   a full bar has one, and in the side column main keeps the accessory's room.
3. **Bar forms.** Glass on `start` as on `end` (the back button is a 44 glass
   disc). The bar group is one glass capsule (rim, shadow, blur, bend) with
   clear round buttons in it; in the column it stands with 48 items. The
   accessory is its own glass capsule 48 tall, 8 over the full bar, across the
   bar and its disc; in the compact bar the current tab is a 54 disc with its
   label hidden from view and the accessory takes the rest of the platter; in
   the column it is fixed at the foot of the content, from the content's 16 to
   12 before the column. The soft neutral fill capsule is the kit's plain
   gray, 48 tall, label at 17.
4. **List rows.** The chevron only on linked rows without `data-no-chevron`,
   with its room as `--_list-padding-end`; press fill on action rows; the
   grouped cards use the flush grid line mechanism for their hairlines (at the
   text, past a start glyph at its real size, to the card's end); a row
   without a start part pulls its hairline and a control back by the gap; the
   chevron of a wrapped row sits on the first line band. Section headers 17
   regular in the secondary colour; a plain list's sections run on with 8
   between them (was 24). Titles stay regular 17.
5. **In rows.** The pop-up value in a list row is regular weight in the
   secondary label colour; the standalone pop-up keeps the tint and the
   semibold. The swipe menu room only on hover, focus or with its menu open,
   in `ios.css` and in base `List.css`. The grouped field line is hidden under
   `:root[data-modality='pointer']` only. The toast takes `--_toast-line` on
   ios.
6. **Neutral dark.** The navy came from the PageShell, which paints
   `color.bg-body` (navy in Neutral) over the Theme's black; the screen host
   draws the page through a PageShell, the gallery's own demos mostly do not.
   On ios the shell's ground is now black in dark in both styles. Also gray
   now: Neutral's tier 1 dark tints (they mixed `material.glass-solid`, navy
   in Neutral), its dark bottom toolbar, and its soft neutral buttons.
7. **Wide shells.** The selected sidebar row and the selected row of a split
   view's list are the tint fill with white text and glyphs (4.62 to 5.41,
   measured); the sidebar border, the PageShell column border and the split
   view's resting line are the quiet hairline. With a PageShell navigation
   column the header sits beside the column (grid areas only), so the large
   title starts at the content. The settings screen's split view is inside
   main, so CSS cannot move its title (a request).
8. Bar button glyphs and bottom toolbar glyphs 22; toolbar glyphs in the
   glyph blue (a mini player in the accessory keeps the text colour). The menu
   section label size was already the kit's. Capsules 48 only for the soft
   neutral fill (the references' Play and Shuffle); the 44 default is kept.
9. **Dates, wheels, colours.** Calendar: 44 days, title 17, arrows in the
   tint, the selected day a disc in the label colour (black light, white
   dark) with the number in the opposite colour (17.87 to 21). Date chips 34,
   small corner, 11 side room, 17 regular, the kit's gray, no border, the open
   chip in the tint; the date popover has no arrow; the inline time row has the
   hairline and 11 of room; date and time fields 44. Wheel: large digits,
   wider columns, small band corner, the tertiary gray band. Colour: the thin
   track, the small capital label, smaller row discs, a small grid corner, the
   field as the filled gray field, a white thumb ring on the tracks and the
   area, and the M9.20 picker rules. Android: the calendar, wheel, chip,
   field, swatch and picker rules as requested.

## Decisions I made

1. Panels are dense frosted glass with no bend; bars and buttons keep the
   clear glass with the bend. `refraction.ts` still tracks the panels (the
   filters are mounted but the panels do not read them now); dropping them is
   a small follow up.
2. Page grounds: grouped gray when the shell holds an inset or divided List
   or an inset Fieldset, else white; black in dark.
3. "The label colour" of the pop-up value in a row: I used the secondary
   label colour (`color.text-muted`), as both settings references draw it;
   the primary text colour is a one token change if the lead meant that.
4. The swatch selection ring keeps its colour: a white ring as the kit draws
   it would fall under 3:1 on a white surface (1.4.11). The thumbs of the
   tracks and the area take the white ring.
5. Plain list sections 8 apart (the order said about 40 less; there was 24).
6. The light danger label of the action sheet is a quarter darker, the dark
   one nearly half lighter; the sheet is denser in both schemes.

## Verdict per screen part (reference against ours, after)

Music library (reference: the vendor's songs list and long press menu).

| Part | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| Back disc and bar group | close | close | close | close |
| Large title | close | close | close | close |
| Play and Shuffle capsules | close (tint label, our glyph outline) | close | close | close |
| Song rows and sections | same family (our current row keeps its fill) | same family | same family | same family |
| Index bar | close | close | close | close |
| Long press menu | close | close | close | close |
| Compact bar, mini player, search | same family (the platter holds the disc and the capsule; the reference draws three shapes) | same family | same family | same family |
| Page ground | close (white) | close | close | close (black, was navy) |

Settings (references: a timer app's settings, a watch app's dark settings).

| Part | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| Large title | close | close | close | close |
| Grouped cards and hairlines | close | close | close | close (was navy page) |
| Section headers | close | close | close | close |
| Pop-up values | close | close | close | close |
| Edges (16) | not there until the screen drops its own 4 (now 20) | same | same | same |
| Tab bar | close | close | close | close |
| Inner screen, split view | same family (the title spans the sidebar) | same family | same family | same family |

Inbox swipe (reference: a news app's saved list).

| Part | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| Large title and filter disc | close | close | close | close |
| Rows and hairlines | same family | same family | same family | same family |
| Listen capsules | close | close | close (gray, was outlined) | close (was navy) |
| Filter menu | close (nothing reads through) | close | close | close |
| Banner | close | close | close | close |
| Bottom toolbar | close (glyphs 22 in the tint) | close | close | close (gray, was navy) |

## Contrast from pixels

Each label: a shot with it and one without, the backdrop read under the ink
and 2px round it. Test screens at 15 scroll positions, the /platforms screens
at 21, panels also in tier 2 at 11; the action sheet and selection menu over
their demo page, white, black and a colour stripe backdrop. Lowest value per
item, tiers together (text 4.5, glyphs 3).

| Item | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| Back glyph | 19.18 | 17.04 | 17.87 | 16.02 |
| Bar group glyph | 19.02 | 14.16 | 17.87 | 13.31 |
| Compact tab glyph, current | 5.17 | 5.51 | 5.39 | 5.46 |
| Accessory label | 8.38 | 7.93 | 6.09 | 6.47 |
| Accessory glyph | 8.38 | 7.93 | 6.10 | 6.47 |
| Search disc glyph | 7.96 | 6.45 | 7.45 | 6.34 |
| Long press menu row | 14.65 | 13.35 | 14.13 | 12.60 |
| Long press menu danger row | 5.59 | 5.61 | 6.13 | 6.65 |
| Long press menu glyph | 5.44 | 5.46 | 5.88 | 6.47 |
| Settings tab label | 5.15 | 6.73 | 6.80 | 6.61 |
| Settings tab label, current | 5.35 | 5.43 | 5.73 | 5.38 |
| Settings tab glyph | 5.15 | 6.73 | 6.81 | 6.21 |
| Tab glyph, current (/platforms) | 5.11 | 5.36 | 5.45 | 5.36 |
| Inbox filter disc glyph | 19.18 | 16.67 | 17.87 | 15.67 |
| Inbox toolbar glyph | 5.27 | 5.01 | 4.90 | 4.07 |
| Filter menu row | 6.26 | 7.18 | 14.04 | 12.71 |
| Filter menu glyph | 6.21 | 7.18 | 13.76 | 12.24 |
| Bar text button label (/platforms) | 7.13 | 8.06 | 6.86 | 7.58 |
| Dot on the platter | 8.45 | 8.39 | 7.63 | 7.58 |
| Menu row (/platforms) | 4.67 | 4.86 | 4.94 | 5.89 |
| Toast title | 13.11 | 13.54 | 12.64 | 12.58 |
| Toast close glyph | 6.24 | 6.59 | 6.05 | 7.53 |
| Sheet close glyph | 18.56 | 14.31 | 17.87 | 13.67 |
| Selection menu label | 10.06 | 10.42 | 10.48 | 10.34 |
| Action sheet item | 13.71 | 8.59 | 13.43 | 10.53 |
| Action sheet danger item, every backdrop | 5.82 | 4.92 | 6.14 | 6.41 |
| Action sheet title | 15.49 | 14.16 | 14.99 | 13.31 |
| Selected sidebar row and split view row | 5.41 | 4.62 | 5.17 | 4.72 |
| Calendar selected day | 19.67 | 21.00 | 17.87 | 19.74 |

The scan caught one regression of mine on the way: widening the bar button
selectors raised their weight over L2's dark text button rule (3.15); that
rule now has the same shape and holds again (8.06).

## Requests for other owners

1. Settings screen owner (`apps/gallery-react/src/ios-screens/settings.css`):
   drop the 4 the page adds at its sides (`settings-page`, the split panes):
   main gives 16 now, so cards sit at 20. Its tab bar holder is `sticky` in
   main's flow: at the end of the scroll the platform spacer comes after the
   bar and lifts it 96 above the bottom. Place it out of the flow (fixed, as
   the music library's dock) or in the shell footer; the platform keeps the
   room for a bar over the content.
2. Music library screen owner: the page grid can drop its own side padding
   for the same reason, and the playing row's current fill is not in the
   reference (the List marks `active`; a now playing mark would be closer).
3. Screen host owner (`apps/gallery-react/src/ios-screens.css`): the drawn
   camera, the Safari bars and the frame body use `color.bg-scrim-solid` and
   `color.bg-body`, navy in Neutral dark; `color.glass-backdrop-dark` would
   keep them black.
4. Lead or the SplitView owner: on the inner screen the settings title spans
   the split view's list; CSS cannot move it since the split view is in main
   (a heading slot in the secondary pane, or the PageShell column, would).
5. Lead: the Navbar has no scroll part, so the large title does not collapse
   into an inline title with a glass edge on scroll; content is clipped at
   main's top under the title instead (no band, no hairline).
6. Date picker owner: the android time dialog's two 72 by 80 boxes need to
   know the dialog's parts; not done here.
7. Lead: drop the panels from `REFRACTION_PARTS` if the frosted panels stay
   (decision 1), and record the page ground rule and the panel material in
   `DECISIONS.md` if wanted.

## Proof

Against this order's gallery server (port 5841, stopped at the end).

- iOS contract, List, Navbar, TabBar, Button, DropdownMenu, ContextMenu,
  Toast, ActionSheet, Select, Fieldset, Input: 565 passed, 20 skipped by
  profile, 8 failed (TabBar reflow at 320, fixed below). This run began
  mid order: the panel density, the danger label colours, the dark text
  button weight and the accessory content rules came after it and were not
  run through it again (only TabBar was).
- TabBar alone after the fix for its 320 reflow (the compact accessory and a
  hand placed column's accessory pushed the page sideways): 43 passed.
- iOS contract, Calendar, DatePicker, DateField, TimeField, WheelPicker,
  ColorSwatchPicker, ColorSlider, ColorField, ColorArea, ColorPicker,
  SplitView, PageShell: 556 passed.
- android contract (List, Calendar, WheelPicker, DatePicker, DateField,
  TimeField, ColorSwatchPicker, ColorField, ColorPicker): not run (the lead
  closed the round).
- `--device duo-outer --component TabBar,Navbar,PageShell`: 154 passed, 25
  skipped by profile, 1 failed: Navbar keyboard map, Studio dark, the outer
  screen in Safari (Enter and Space change nothing). It fails the same with
  the three ios files put back as they were before this order, so it is not
  from this order.
- `npx vitest run packages/lint packages/shared`: 51 files, 620 tests pass. `npm run typecheck` clean.
- Web: every changed selector in the four platform files carries
  `[data-platform='ios']` or `[data-platform='android']` (checked over the
  diff), the Neutral recipe rule is under `[data-platform='ios']`, so web is
  unchanged by them. The one web change is base `List.css`: a swipe row keeps
  the menu's room only while hovered, focused or with its menu open (the
  requested change).
- Not run: the full `npm run check` (the lead runs it).

## What still needs a real iPhone

- Whether Safari's backdrop blur of 24 on the panels reads as the platform's
  frost, and whether a bar without a backdrop filter (disc or accessory bars)
  lets the accessory and disc see the content in Safari as in Chromium.
- The compact bar: the platform draws the current tab, the player and search
  as three shapes on some screens; ours keeps the platter.
- Tier 2 (Safari) shows no bend at all, as before.
