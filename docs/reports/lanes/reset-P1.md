# Lane report: P1, what the lead found on the latest iOS sheets

Order P1 (Liquid and Neutral, light and dark, `ios`), plus three CSS only
items the coordinator added while it ran: SharePanel (M9.12), SelectionMenu
(M9.11) and ActionSheet (M9.10). Proposed until the owner signs it. Not
committed by me.

Sheets (reference left, ours before and after) are in scratch only, since
they hold kit and vendor crops:
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/sheets/`
(`p1-1-rows.png`, `p1-1-alert.png`, `p1-2-outer-safari.png`,
`p1-3-switch-tier{1,2}.png`, `p1-4-tabbar-tier{1,2}.png`,
`p1-4-tabbar-1x.png`, `p1-share-panel.jpg`, `p1-selection-menu.png`,
`p1-action-sheet.png`). Our own captures, under 500 KB each, are in
`docs/reports/reset/P1/`.

## Files

| File | What |
| --- | --- |
| `packages/css/src/platform/ios.css` | Point 1 (no ring box on a plain field in a grouped row or the alert well, caret in the tint, the row's lower edge as the focus mark); SharePanel geometry and paint, the share sheet header; SelectionMenu values and the menu glass lists; ActionSheet glass lists, solid fallbacks, card geometry and capsule paint |
| `packages/css/src/platform/ios-refraction.css` | Point 4 (the tab bar's bend runs twice); the dark tab bar tint 74 to 84 percent (tier 1); the menu lists take the selection menu and the action sheet panel |
| `packages/css/src/platform/ios-shell.css` | Point 2 (room after the content for a bar over main) |
| `packages/css/src/platform/android.css` | SharePanel, SelectionMenu (text toolbar), ActionSheet |
| `packages/styles/{liquid,neutral}/recipes/Switch.css` | Point 3 (held off lens over white, light only); point 5 (the switch reads the new green) |
| `packages/styles/{liquid,neutral}/recipes/DropdownMenu.css` | SelectionMenu in the root menu lists, kept a capsule; Liquid's platter on ios |
| `packages/tokens/src/contract.json` | `success.platform` added to `color.state` |
| `packages/styles/{liquid,neutral,studio,desk}/tokens.{light,dark}.json` | the new token in every style (the build requires every style to fill a contract name) |
| `packages/tokens/tests/__snapshots__/` | updated for the new token only (40 lines, all `platform`) |

The token build was run (`npx tsx packages/tokens/build.ts`), so
`packages/tokens/dist` is current. `npm run gen` was not run: no new file
was added, so no barrel changes.

## Verdict per point

| Point | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| 1 Grouped field rows, focus | close | close | close | close |
| 1 Alert field well, focus | close | close | close | close |
| 2 Outer screen in Safari, bar over the list | same family | same family | same family | same family |
| 3 Held off switch over white | close | unchanged (close) | close | unchanged (close) |
| 4 Tab bar bend (tier 1) | close | close | close | close |
| 5 Platform green | same as kit | same as kit | same as kit | same as kit |
| SharePanel | close | close (no kit dark) | close | close (no kit dark) |
| SelectionMenu | same family | same family | same family | same family |
| ActionSheet | close | close (no kit dark) | close | close (no kit dark) |

### 1. Focus in grouped field rows and the alert well

The kit shows only the caret in the tint. No keyboard or pointer flag
exists in the system (searched the CSS, `packages/shared`, React and
Angular for `data-input`, `data-focus-source`, modality and similar: none),
and a text field always matches `:focus-visible`, so pointer and keyboard
focus cannot be told apart in CSS. Chosen: the ring box is gone on a plain
field in an inset Fieldset row and in the alert's well; the caret takes the
tint (`caret-color: color.primary.on-surface`); the row label keeps its
focused tint (Field.css); and every focus draws the row's lower edge in the
tint, 2px (`border.width.strong`), across the row's text width, as an inset
shadow on the row. The transparent outline of Input.css stays, so forced
colors still gets a box. This mark is one thing the kit does not draw.

Contrast of the mark from pixels (WCAG 2.2 1.4.11, 3:1; 2.4.7 visible):

| Where | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| Mark against the row above it (card) | 7.00 | 7.69 | 7.08 | 7.66 |
| Mark against the next row's hairline | 5.61 | 5.29 | 5.67 | 5.27 |
| Mark against the alert well | 5.72 | 6.19 | 6.21 | 5.03 |

### 2. The outer screen in Safari (382 by 580)

`ios-shell.css`: a main that holds a tab bar placed over it (not in the side
column) gets a spacer after its content (`::after`, so a page that zeroes
main's padding keeps it; the gallery does) as tall as the bar, its margin
over the bottom inset and a 10 gap: 94 at 382 by 580; and the same scroll
padding at the end, so a focused control scrolls clear of the bar (2.4.11).
Under the side column (side placement, or auto when the shell is wide and
short) there is no spacer.

At the end of the content the last row now sits 110 above the bar (16
before). The 16 came from the gallery's own phone body padding (100);
with both, the end has about 194 of room: request below.

At rest (scroll 0) the bar still sits over the Account row, as content
under a bar does. Tier 1 (Chromium only) squeezes a text line that sits in
the bar's top band into a smear (before and after alike: the flat side band
is 23 of the bar's 64); tier 2, what Safari on iOS gets, shows it blurred and
whole (`p1-2-outer-safari.png`, last column). The cure is in the map, not
in CSS: tried in the page with a redrawn map, a flat side band of 12 and a
cap band of 30 keeps `sara@example.com` and `Privacy` readable under the bar
at rest and still bends the blue button round both caps (request to the
shared owner below; pictures in scratch `p1/map/cmp.png`).

### 3. Held off switch over white

Read the kit again (file Cltzs6FZW3N5yiC1x1cpQJ, Toggles 507:24690, symbol
"State=Pressed, Is On=False", rendered alone over white): the lens is the
gray track seen through, a lighter rim band, a faint darker lower edge and a
soft shadow below. Ours drew a light rim only, which over the white card was
a white ring round a gray pill. Now, light only, held off: a soft shade
inside the edge (10px, 12 percent dark), a faint darker lower edge (1px down,
2px blur, 26 percent dark), the top light at 70 percent, and a two step lift
(1 by 3 and 4 by 14, 14 percent). No ring, no stroke. Dark keeps its rule.
Tested three steps (`p1/sw/cmpB.png`). Verdict close: it reads as glass over
a light surface; the kit's lens is a darker gray because its off track is.

### 4. Tab bar bend

CSS cannot change the map, but it can run it twice:
`backdrop-filter: url(map) url(map) blur() saturate()` on the tab bar only.
Each pass moves inward and never backward (G2's profile 1.6 by depth 0.6
keeps the slope under 1), so the two together never fold. At 1x the blue
button's edge now sweeps up round both caps and the slider line curves
visibly (`p1-4-tabbar-1x.png`); nothing tears. A third pass was not tried:
the glare doubles too, and at two passes the light labels already lost 0.5.
The pure scale route (the map's `scale` times 1.6, tried in the page) bends
about as much, but needs `refraction.ts`.

Labels from pixels, 31 scroll positions over the settings screen (lightest
and darkest demo content), tier 1, before / after:

| Item | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| Tab label | 6.76 / 6.22 | 4.73 / 6.42 | 5.71 / 5.57 | 4.01 / 5.33 |
| Tab label, current | 5.87 / 5.87 | 5.62 / 5.62 | 6.22 / 6.22 | 5.45 / 5.51 |
| Tab glyph | 6.95 / 6.37 | 6.00 / 7.16 | 6.52 / 5.64 | 4.75 / 5.51 |
| Tab glyph, current | 5.87 / 5.87 | 5.62 / 5.62 | 6.22 / 6.22 | 5.51 / 5.51 |

The finer scan found the dark tab label under 4.5 before this order (Neutral
4.01, Liquid 4.73 was the lowest; G2's six positions missed it). The dark bar's
tier 1 tint goes from 74 to 84 percent; both pass now. The navigation bar's
text button ("Bar button label") measures 2.96 to 3.15 in dark at some
scroll positions, before and after: not touched here, listed below.

### 5. The platform green

Token: `color.state.success.platform` (CSS `--ds-color-state-success-platform`).
The build refuses colours in platform files, and a style may set a colour
only if the contract names it, so the name is in `contract.json` under
`color.state` `added`, and every style fills it: Liquid and Neutral light
`#34c759`, dark `#30d158`; Studio and Desk alias `{color.state.success.solid}`
(their switch is their own). The Liquid and Neutral iOS switch rules read
it; the window zoom mix is gone.

| Pair | Light | Dark | Kit |
| --- | --- | --- | --- |
| White thumb on the green | 2.22 | 2.02 | same values |
| Green against the card (white, `#1c1c1c`) | 2.22 | 8.43 | |
| Before: white on the old green `#28c840` | 2.23 | | |

Both light pairs are under 3:1, as the kit is; the owner's ruling waived the
3:1 outline for this control on ios (recipe comment). The on state still
shows the thumb's place and the track fill change; the switch is also named
and its state read out.

### 6. CSS only items still open from the looks report

The Popover collision padding on a phone (kit 16, ours 8) is the React prop
`collisionPadding` (`Popover.tsx` default 8), not a CSS value: request. The
"partly" item in M9.5 (the android fast scroll bubble) needs `data-key` in
markup. Nothing else marked partly is CSS only.

## The three added items

### SharePanel (M9.12)

Names checked against `SharePanel.css`. ios, ds.platform: tiles, items and
preview 66 (`size.control-lg * 1.5`), item width plus `space.xs`, preview
corner `shape.corner-medium`, target corner `shape.corner-large`, avatars
66 through `--_avatar-size`. Liquid and Neutral: no hairline between rows
(the kit parts them by space) and the action circles on the platform's
quiet fill (8 percent dark in light, 14 percent light in dark), not glass:
glass over the light sheet vanished. Target tiles keep the style's fill.
ios, ds.chrome: the share sheet's title at the leading top and the round
close at the trailing top, as the kit (the M1 sheet keeps its close at the
start). android: tiles 48, target corner large, no hairline. Verdict close
(light), close by the kit's ladders (dark).

### SelectionMenu (M9.11)

Root menu lists only (the surface: tint, filter, shadow, rim, fallbacks),
not the item rules, take `[data-ds='selection-menu']`: 26 in `ios.css`, 12 in
`ios-refraction.css`, 12 in the Liquid recipe, 6 in Neutral's. Each recipe
then keeps the capsule (`--_menu-radius: radius.pill`, `--_menu-padding: 0`)
on every platform but android, where the Material toolbar's small corner
stays. Liquid on ios: the platter is `material.glass-hover`. ios.css and
android.css values as asked. The selection menu takes the low blur of tier 1
but no bend: `refraction.ts` does not list it (request). Capsule 352 by 46
for four entries (kit 238 by 44 for three; ours has a 1px edge each side).

Labels from pixels, over text and over a coloured gradient: ios tier 2
lowest 9.84 (Neutral light, colour), tier 1 lowest 8.94; android lowest
11.77. Verdict same family.

### ActionSheet (M9.10)

ios, ds.chrome, every placement but bottom: 300 wide
(`dialog.width.sm - 6 * space.fixed.l`), the alert's corner (34), title and
words 20 in and 16 from the top (measured on the kit, a little under the 24
the coordinator gave), items 48 tall, full corner, 12 in from the card, 8
apart, text 17, title at title large, description at body medium in the
default text color. The item paint sits in ds.chrome so a style's Button
recipe does not tint it (ruling 16): the alert's gray capsule, danger as the
danger text color on the gray capsule at rest, hover and press, cancel at
regular weight. In dark the danger red measured 4.30 on the capsule
(Liquid): it takes a fifth of the bright text color.
ios, ds.platform: the panel joins every clear material list the menus are
in (tint, filter, shadow, transparent border, the rim with its right to left
and dark forms), `ios-refraction.css` (low blur and band; no bend, not in
`refraction.ts`), and solid fallbacks that read `--_action-sheet-bg`,
`-border-color`, `-shadow`.
android: top corners extra large only, rows 48 with no corner and no gap,
12 inline padding, the Sheet's surface (`bg.surface`) and scrim (`bg.scrim`).

Labels from pixels (tier 2 / tier 1): danger 4.55 / 4.51 (Liquid light),
5.25 (Liquid dark), 5.04 / 4.99 (Neutral light), 5.89 (Neutral dark); every
other label 9.76 or more. Verdict close.

## Decisions I made

1. Point 1: a 2px tint line on the focused row for every focus, since no
   modality flag exists. If the lead adds one (for example
   `data-focus-source` on the root), the line can be limited to keyboard.
2. Point 2: a spacer after main's content, not padding, because pages (the
   gallery included) zero main's padding.
3. Point 4: the bend runs twice in CSS rather than asking for a new map
   first; the dark bar's tint went up so the finer scan passes.
4. Point 5: the token is a style level semantic colour in `color.state`,
   filled by all four styles.
5. SharePanel: action circles on the quiet fill, not glass; share sheet
   close at the trailing end.
6. ActionSheet: item paint in ds.chrome; 20 inline padding as measured.

## Requests for other owners

1. Gallery (`apps/gallery-react/src/platforms.css` or `duo.css`): inside the
   Duo shell, drop the phone body's own bottom padding (100), since the
   iOS layer now gives the room; today the end has about 194.
2. `packages/shared/src/refraction.ts`: (a) a flat side band of about 12 and
   a cap band of about 30 on bars (tried in the page) keeps text under the
   middle of the tab bar readable at rest and bends the caps more; (b) add
   `[data-ds='selection-menu']` and `[data-ds='action-sheet'] [data-part='panel']`
   to `REFRACTION_PARTS` so they bend in tier 1.
3. Popover (React): `collisionPadding` 16 on a phone (kit), it is a prop.
4. A keyboard modality flag on the root (React and Angular), so a field's
   focus mark can follow the kit for touch.
5. Navbar text button label in dark tier 1 reaches 2.96 to 3.15 at some
   scroll positions of the settings screen (not changed by P1; owner of the
   navigation buttons' tint in `ios.css`, now me, can take it in a next
   order).
6. The lead to record `color.state.success.platform` and run `npm run gen`
   (registry `public/r/style-*.json` lists style tokens).

## Proof

All against this order's gallery server (port 5493, stopped at the end).

- `npm run contract -- --framework react --platform ios --component
  Input,Fieldset,AlertDialog,Switch,TabBar,PageShell,SharePanel`: 341
  passed, 0 failed (AlertDialog 63, Fieldset 43, Input 43, PageShell 43,
  SharePanel 63, Switch 43, TabBar 43).
- `--platform ios --component SelectionMenu,ActionSheet`: 63 and 63 passed.
- `--platform android --component SelectionMenu,ActionSheet,SharePanel`:
  63, 63 and 63 passed.
- `--platform ios --device duo-outer --component TabBar,PageShell`: TabBar
  52 passed, PageShell 51 passed, 2 skipped each (by profile), duo profile 1
  passed.
- Lint gates, `npx vitest run packages/lint`: 19 files, 104 tests pass (the
  four Desk contrast failures listed are known ones, reported in wave 0).
- Token tests, `npx vitest run packages/tokens packages/styles`: pass after
  the snapshot update (the only changed lines are the new token).
- Web and android unchanged by computed style: every element and its
  `::before` and `::after`, every property, with this order's files in and
  out (the eight CSS files swapped on disk for their text from before the
  order), on fieldset, alert dialog (one field open), switch, tab bar, page
  shell, input, share panel, action sheet and selection menu, Liquid and
  Neutral, light and dark: 72 pages. Zero differences on web and android
  except where intended: the android share panel, action sheet and
  selection menu (the new android rules), and the web selection menu (the
  Liquid and Neutral menu paint the component agent asked for, on every
  platform). One android page shell page differed in the after run only; run
  again twice with the order's files it matches the before run (0 of 7), a
  timing artifact.
- Not run: the full `npm run check` (the lead runs it), `npm run gen` (no
  new file).

## What still needs a real iPhone

- Tier 2 (Safari) shows no bend at all; the double pass is Chromium only.
- Whether the row's tint line reads as the kit's quiet focus to a touch
  user, and whether the spacer interferes with Safari's toolbar collapse.
