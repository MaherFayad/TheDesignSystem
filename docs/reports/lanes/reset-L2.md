# Lane report: L2, search disc, page dots, the refraction map, contrast

Order L2 (Liquid and Neutral, light and dark, `ios` and `android`). Proposed
until the owner signs it. Not committed by me.

Sheets with the reference left and ours before and after are in scratch only,
since they hold kit and vendor crops:
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/l2/sheets/`
(`l2-1-search-bar.png`, `l2-1-search-column.png`, `l2-1-dots-android.png`,
`l2-2-map.png`, `l2-3-bar-button.png`, `l2-4-gallery-searchfield.png`).
References: the kit file Cltzs6FZW3N5yiC1x1cpQJ (Tab Bars 507:24689, Page
Controls 507:24679, crops by order M9.9), the vendor's music app on Mobbin,
and `m1-ios/ref/z-library-tabbar-3x.png`. Our own before and after pictures
(no reference column), each under 500 KB, are in `docs/reports/reset/L2/`.

## Files

| File | What |
| --- | --- |
| `packages/css/src/platform/ios.css` | Search disc paint (M1 and the clear material lists: shadow, rim, the three strengths, fallbacks, more contrast, no backdrop filter), its current state, its geometry, the expanded field; dots platter; the dark text button tint; the dark danger label of the action sheet |
| `packages/css/src/platform/ios-refraction.css` | The disc in tier 2 and tier 1 and the fallbacks; a bar that holds a disc gives up its own backdrop filter (tier 1 glass in its `::before`); the dark tier 2 tint of such a bar; the light menu tint in tier 1 |
| `packages/css/src/platform/ios-shell.css` | Item rules cover the search part; the disc in the column (hand placed and docked); the bar and disc centred as one on a wide shell |
| `packages/css/src/platform/android.css` | Every tab bar item rule covers the search part |
| `packages/styles/{liquid,neutral}/recipes/Input.css` | The Input inside a SearchField has no fill on any platform; off ios the field takes the style's surface |
| `packages/shared/src/refraction.ts`, `refraction.test.ts`, `refraction-dom.test.ts` | Bar band 12 and cap band 30; the disc, the selection menu and the action sheet panel are tracked |
| `apps/gallery-react/src/Platforms.tsx`, `platforms.css` | The settings screen uses `TabBarSearch` (last) and shows page dots under the cards |
| `apps/gallery-react/src/Duo.tsx`, `duo.css` | The Duo screen uses `TabBarSearch`; the phone body in the shell ends on its own padding |

`refraction-dom.ts` needed no change: it reads `REFRACTION_SELECTOR`.

## Verdict per point

| Point | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| 1 Search disc in the bar | close | close (no kit dark) | close | close (no kit dark) |
| 1 Search disc in the column | close | close | close | close |
| 1 Expanded field | same family | same family | same family | same family |
| 1 Dots on ios | same family | same family | same family | same family |
| 1 Android search item and dots | unchanged in look (rules extended) | same | same | same |
| 2 Refraction map | close | close | close | close |
| 3 Bar text button | passes | passes (was 3.15) | passes | passes (was 2.96) |
| 4 Duo end room | fixed | fixed | fixed | fixed |
| 4 SearchField box (web, android) | fixed | fixed | fixed | fixed |

### 1. Search item and page dots

The M9.9 rules were applied with every name checked against `TabBar.css`
and `Pagination.css`, with these changes:

- **Backdrop root.** Measured in Chromium: the disc, a child of the bar
  drawn outside the bar's box, sees nothing behind it while the bar has a
  backdrop filter (a probe with `backdrop-filter: invert(1)` on the disc drew
  flat white). So a bar that holds a resting disc gives up its own filter and
  isolates; in tier 1 its `::before` carries the same bend (border box,
  under the content); in tier 2 its middle is the content under the tint,
  with the edge band kept. The disc then has its own glass, bend and band.
  Over stripes it now shows the content blurred and bent, as the kit does.
- **Disc size.** As tall as the bar (64 with the edges at 393), 8 after the
  capsule; the bar leaves that room at its inline end. On a shell 600 or
  wider the capsule and disc are centred as one.
- **Column.** 48 round (as the lead asked; the M9.9 sketch made it as wide as
  the capsule), 12 under the capsule and centred on it. Docked, the capsule's
  foot is raised by 48 and 12. The disc is `position: fixed` on the shell,
  not absolute on the capsule, so the capsule keeps its scroll on a short
  shell: on the outer screen in landscape (382 tall) the first try (capsule
  not scrolling) put the capsule over the second top action. Now the capsule
  is 114 tall and scrolls, the disc sits at the foot, nothing overlaps.
- **Current disc.** The lens as a white layer vanished on the white disc, so
  the current disc differed by the glyph's tint alone (WCAG 2.2 1.4.1). It
  keeps the M1 10 percent overlay over its glass (gray in light, lighter in
  dark) and the lens's top light.
- **Expanded.** The tabs are icon only squares as tall as an item; where the
  field needs room they narrow down to the icon box (28, never under 24),
  and the field keeps half the capsule (`TabBar.css`). The M9.9 sketch let
  the field go to zero: in the long Arabic case at 320 the input was 21 wide
  (contract target size failed), and four tabs plus the field overflowed the
  capsule (335 in 319). Now 39 wide tabs at 393 with four tabs, under the
  platform's 44: reported below.
- **Dots.** Platter in `material.glass` with the glass blur, 2 inline
  padding, at least `size.target-min` tall; the current dot stays wider (lead
  decision). No platter on android (the base has none).
- **Android.** Every tab bar item rule in `android.css`, `ios.css` and
  `ios-shell.css` now covers `[data-part='search']`: height, icon size, font
  size, the Arabic step, the pill, focus, the current reset, and the ripple
  and state layers (the ripple and state layers only at rest: an expanded
  search holds a field).

### 2. Refraction map

`refraction.ts`: a bar is a capsule at least three times as long as it is
tall (or as wide, for a column). Its flat sides take a band of 12 (or the
old share of the short side when that is less) and its caps a band of 30,
never past the cap radius; the band runs from one to the other with how much
the edge faces along the long side. Every other shape keeps the old map.
The tab bar's map goes from a flat band of 23 to 12 and a cap of 27.2 to 30
(scale 32.6 to 36). The selection menu, the action sheet panel and the
search disc are tracked now, so they bend in tier 1. Tests: a new block for
bars (detection, bands, a resting text line untouched, the fold check on the
bar) and a DOM test for the three new parts.

Double pass: kept. With the new map one pass and two passes look almost the
same at 3x; two bend the button edge round the caps a little more, closer to
the reference, and a resting line of text under the bar ("Brand review",
"Text size") stays readable in both. The before column is not at the same
content as the after column at equal scroll, because the settings screen
gained a dots row.

### 3. Contrast

The bar's text button in dark: its tint goes from 54 to 86 percent, text
buttons only (round icon buttons keep the clearer glass). Lowest 8.06
(Liquid) and 7.58 (Neutral), from 3.15 and 2.96.

The full scan (every label on glass, 31 scroll positions over the settings,
menu, toast and sheet screens; the selection menu and action sheet over
their demo page, white, black and a colour stripe backdrop) found three more
under the bar, all fixed:

- Dark tab labels in tier 2 fell to 3.64 (Liquid) and 3.85 (Neutral) once a
  disc bar lost its low blur; a disc bar in dark tier 2 takes the tier 1
  tint (84 percent): 6.73 and 5.71.
- The light menu row, Liquid tier 1: 4.30. The light menu's tier 1 tint goes
  from 64 to 72 percent: 4.63 (tier 2 is 4.55 unchanged).
- The action sheet's dark danger label over the demo page: 4.23 (Liquid).
  Its mix of the bright text color goes from a fifth to a third: 4.88.

Lowest value per item, tiers 1 and 2 together (text 4.5, glyphs and dots 3):

| Item | Liquid light | Liquid dark | Neutral light | Neutral dark |
| --- | --- | --- | --- | --- |
| Tab label | 5.15 | 6.73 | 5.92 | 5.71 |
| Tab label, current (lens) | 5.11 | 5.29 | 5.44 | 5.20 |
| Tab glyph | 5.15 | 6.73 | 5.24 | 5.59 |
| Tab glyph, current (lens) | 5.09 | 5.31 | 5.45 | 5.23 |
| Search disc glyph | 7.96 | 8.03 | 7.45 | 6.69 |
| Search disc glyph, current (demo row, plain page) | 5.50 | 4.60 | 5.78 | 4.00 |
| Bar text button label | 7.13 | 8.06 | 6.86 | 7.58 |
| Dot on the platter | 8.45 | 8.39 | 7.63 | 7.58 |
| Dot on the platter, current | 18.87 | 17.17 | 17.87 | 13.50 |
| Menu row | 4.55 | 4.79 | 4.68 | 4.90 |
| Menu glyph | 4.23 | 4.70 | 4.44 | 4.78 |
| Toast title | 9.08 | 11.20 | 8.69 | 10.53 |
| Toast close glyph | 4.89 | 6.37 | 4.38 | 6.67 |
| Sheet close glyph | 18.56 | 14.31 | 17.87 | 13.67 |
| Selection menu label | 6.28 | 9.48 | 6.17 | 7.64 |
| Action sheet item | 10.74 | 8.19 | 12.32 | 9.73 |
| Action sheet title | 7.35 | 11.03 | 7.09 | 8.76 |
| Action sheet danger item (demo page) | 4.55 | 4.88 | 5.04 | 5.52 |

Method: for each label, one shot with it and one without it (colour
transparent for text, hidden for glyphs, transitions off); the backdrop is
read under the ink and 2px round it. The dots are read at scroll 0 only (they
leave the screen after that). The scanner first misread colours that
Chromium computes as `color(srgb ...)`; fixed before these numbers.

Stress case, not fixed: the danger label over a solid backdrop of the other
scheme (black behind a light sheet, white behind a dark one, or the stripes)
drops to 2.01 (Liquid light), 3.46 (Liquid dark), 2.14 (Neutral light), 3.92
(Neutral dark). Every other action sheet label stays over 7 there.

### 4. Gallery

- Duo: the phone body in the shell ends on its own padding (`space.3xl`, as
  on its other sides) and not on the /platforms bar room. The end now has 28
  between the last row and the bar (P1 measured about 194 of empty room).
  Kept the base padding, not zero, so a column placement (no spacer) still
  has room.
- SearchField, Neutral, web, Arabic: the cause is in the recipes. Both
  Liquid and Neutral `Input.css` give every Input the surface fill, and only
  ios cleared it for the Input inside a SearchField, so web and android drew
  a white box inside the field in both styles. The nested Input has no fill
  on every platform now, and off ios the SearchField takes the style's field
  surface (white, as their other fields). ios unchanged.

## Decisions I made

1. A bar holding a resting disc has no backdrop filter of its own (tier 1:
   in its `::before`; tier 2: the middle without the low blur), so the disc
   is real glass. Bars without a disc are unchanged.
2. The docked disc is fixed on the shell, so the capsule keeps its scroll.
3. The column disc is 48 round, per the order, not as wide as the capsule.
4. The current disc keeps the 10 percent overlay, not a white lens.
5. The expanded field keeps half the capsule; tabs narrow to the icon box.
6. The double pass stays.
7. Contrast fixes raise tints, never blur: the dark text button (86), the
   dark tier 2 disc bar (84), the light tier 1 menu (72), the dark danger
   label (a third of the bright text color).
8. The settings screen of /platforms and the Duo screen use `TabBarSearch`
   (last, as in the vendor app), and the settings screen shows page dots, so
   both can be checked on the platform screens.

## Requests for other owners

1. Lead: four tabs and an expanded search field at 393 give tabs of 39
   (under the platform's 44, over the 24 target). The vendor's app folds the
   other tabs into one disc while the field is open; that needs markup.
2. Lead or the PageShell owner: on a shell too short for the column (the
   outer screen in landscape), the capsule scrolls and its tier 2 band and
   rim (`::before`, `::after`) scroll with the content (seen before this
   order too).
3. Component owner (`TabBar.css`): the expanded search in the side column has
   no column form (it keeps a row inside a 56 wide capsule).
4. Lead: the danger label over solid content of the other scheme (stress
   values above) stays under 4.5; a scrim or a denser panel would fix it.
5. Lead: record the bar band (12, cap 30) and the tracked parts in
   `DECISIONS.md` if wanted.

## Proof

Against this order's gallery server (port 5731, stopped at the end).

- `npm run contract -- --framework react --platform ios --component TabBar`:
  42 passed, 2 skipped (by profile); `--component Pagination`: 43 passed.
- `--platform android --component TabBar,Pagination`: 86 passed.
- `--platform ios --component Navbar,DropdownMenu,Toast,SelectionMenu,ActionSheet,PageShell`:
  272 passed, 4 Toast checks timed out under load (three chains were running
  at once; I stopped my two extra ones); run again alone, `Toast,SelectionMenu`:
  126 passed.
- `--platform ios --device duo-outer --component TabBar,PageShell`: 104
  passed, 4 skipped (by profile).
- SearchField on web, android and ios: 43 passed each.
- `npx vitest run packages/lint packages/shared`: 51 files, 615 tests pass.
- Web unchanged by computed style: every element and its `::before` and
  `::after` (custom properties left out, since other agents change tokens
  while this runs), 9 components, Liquid and Neutral, light and dark, with
  this order's files in and out. The only differences that hold between two
  runs of the same files are the SearchField and its Input (intended, point
  4). Button and IconButton elements differ even between two runs of the
  same files (run to run noise), so they cannot be judged this way; my files
  have no rule that reaches a Button on web.
- Not run: the full `npm run check` (the lead runs it).

## What still needs a real iPhone

- Whether Safari treats a backdrop filter on the bar as a backdrop root for
  the disc as Chromium does (the disc gets its own glass either way now).
- Tier 2 shows no bend at all.
