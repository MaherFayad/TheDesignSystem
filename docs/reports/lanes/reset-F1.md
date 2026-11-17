# Lane report: F1 iOS fixes from the M7 audit (CSS and tokens only)

Order F1, ds-style. Every look here is proposed until the owner signs on a
phone. Scope: `[data-platform='ios']`, Liquid and Neutral, light and dark.
No React, Angular, gallery TypeScript, `android.css`, contract or decision
file was edited. Nothing was committed.

## Files changed

- `packages/css/src/platform/ios.css`
- `packages/styles/liquid/recipes/Switch.css`, `Slider.css`, `Input.css`,
  `DropdownMenu.css`, `Popover.css`, `SegmentedControl.css`
- `packages/styles/neutral/recipes/Switch.css`, `Input.css`,
  `DropdownMenu.css`, `Popover.css`, `Dialog.css`, `Button.css`,
  `Checkbox.css`
- Our own captures: `docs/reports/reset/F1/*.png` (ours only, before and
  after; no kit image)

Not changed: `packages/tokens/src/platform/ios.json` (a platform file may
never set a colour, the token build refuses it, so the colour fixes could not
go there; see the token request), and the iOS block of
`apps/gallery-react/src/platforms.css` (nothing needed).

How a style opts in. Liquid and Neutral set `--_ios-glass` on their iOS
root (order M6). Rules that give the platform's look in full sit in
`ios.css` under `@container style(--_ios-glass: ...)`, so Studio and Desk
keep their own paint. Where a Liquid or Neutral recipe sets the same private
property (recipes come after the platform layer), the recipe repeats it or
reverts it with `revert-layer` under a `[data-platform='ios']` guard.

The kit's dark ladder is written as `color-mix()` of the glass backdrop
tokens (white and black in every style): 11 percent white for the grouped
card and the glass tint (kit #1c1c1e, ours #1c1c1c), 17 for the elevated
surface (#2c2c2e, ours #2b2b2b), 23 for the next step (#3a3a3c, ours
#3b3b3b), 22 for the hairline (#38383a, ours #383838); the light hairline is
10 percent black (#e6e6e6). A private ladder property on the root was tried
first and failed the token vocabulary gate (a private property must be
declared on a component root), so the mixes are written out.

## Item 0, first (owner): the glass edge and the control strokes

The glass rim. The M6 stack of hard 1px inset lines, the even inset ring,
the outer dark ring and the tight 1 to 2px elevation layer are gone from the
tab bar, the navigation and sheet buttons, the menu, the toast, the current
tab lens and the segmented thumb. In their place:

- A rim drawn by `::after` on each glass part: a 1px ring cut out of the
  middle by a mask, painted with a 135 degree gradient (225 in right to
  left) that is brightest on the upper leading arc, fades to nothing by 30
  percent, and comes back fainter after 70 percent on the lower trailing arc.
  Light: white 100 then 45 percent. Dark: white 30 then 10 percent, so dark
  has a faint light edge and no dark ring. The press shade layer of a button
  is its `::after`; on iOS the shade is transparent, so the glass buttons lend
  it to the rim.
- One wide, low drop shadow from tokens (offset 8, blur 36, black 10 percent
  light and 24 percent dark; buttons offset 4, blur 24).
- The inset glow was removed, not lowered: it stops at the 1px border, and
  the border band without it read as a ring (measured: #f3f5fa band between
  #e9eaee outside and #fcfcfd inside).
- Current tab lens: soft fill, no ring and no lower line, a blurred top light
  only (white 45 percent light, 10 percent dark).
- Segmented thumb: the same rim plus one soft low shadow.
- Held switch lens (both Switch recipes): ring width 0, no inset ring, no
  hard lines; a blurred top light, a soft inner shade at the bottom and one
  soft lift.
- Fallbacks: under reduced transparency, more contrast, forced colours and
  without backdrop filter the rim is `content: none` and the solid paint of
  M6 comes back with its border.

By eye, 4x crops (`edge-*.png` below): light, the rim reads as light catching
the upper leading arc and a faint lower trailing arc; between them there is
no line. Dark, the black ring and the gray inner line are gone; a faint light
edge shows on the curved ends only. I could no longer trace a continuous line
around the tab bar, the buttons, the lens or the thumb in either scheme.

Note: while I worked, order F2 landed `packages/css/src/platform/ios-
refraction.css` (not mine) with an edge band and an SVG displacement on the
same parts. In Chromium it adds a bright band inside the menu's edge (seen on
`edge-menu.png`, the white strip at the inline ends); that band is F2's, not
the rim. F2's file also fails the token vocabulary gate today (see Check).

Contrast does not rest on the rim (WCAG 2.2 1.4.11 is met by the label and
glyph on the bar): tab bar label 15.56 (Liquid light), 12.84 (Liquid dark),
14.92 (Neutral light), 10.98 (Neutral dark); current label in the tint 6.60,
5.78, 7.08, 5.60. All from pixels over the demo content.

Control strokes (owner: shapes separate by fill and a soft shadow, not by a
stroke). Sweep on iOS in Liquid and Neutral:

| Control | What I did | Measured boundary |
| --- | --- | --- |
| Switch | No track edge, no thumb ring, no thumb edge in off, on, held, disabled; off track plain gray (light 9 percent black #e8e8e8, dark 28 percent white #474747); white thumb with one soft low shadow. Invalid and read only keep their edge. | On green vs white card 2.23:1, vs dark card 7.94:1. Off track vs card 1.23:1 light, 1.83:1 dark (waived by the owner). Thumb on off track 1.23:1 light, 9.29:1 dark. |
| Slider | White capsule thumb 38 by 24, no stroke, one soft shadow; track 6 tall, no outline (light 11 percent black #e3e3e3, dark 24 percent white #3d3d3d). Liquid light lost its control edge on the thumb. | Track vs white 1.28:1, vs page 1.16:1; dark 1.93:1. Fill vs track 4.21:1 light, 2.35:1 dark (Liquid). For the lead: the kit has the same. |
| Checkbox and radio circle (empty) | Kit Lists page shows a thin 1px light gray ring (#c7c7cc, measured). Matched: 1px at 22 percent black (#c7c7c7) light, 30 percent white (#4d4d4d) dark. Neutral's filled background inside the empty circle removed; Neutral's checked fill is now the tint, not ink. Invalid keeps the danger ring. | 1.69:1 light, 2.02:1 dark. For the lead: under 3:1, as in the kit; the row and its label carry the target. |
| SearchField | Border removed; gray capsule (`bg.overlay-10`). | Capsule vs page 1.23:1 light, 1.21:1 dark. For the lead: as in the kit. |
| Segmented track | Already no border. Track now kit gray. | Track vs page 1.06:1 light, 1.23:1 dark; dark thumb vs track 2.43:1. |
| Progress track | No border before or after. | 1.16:1 light, 1.48:1 dark. |
| Buttons | Neutral alone-standing buttons are capsules; Neutral actions in sheets and alerts take the platform's gray capsule with no edge. Left: the outline emphasis keeps its border (the border is what that emphasis is). | Labels 10.5:1 or more. |
| Text field (Input) | Left boxed with its border. Reason: a field standing on the page has no other boundary; the borderless row look needs fields inside a grouped list, which today's markup does not give (request below). | Not changed. |
| NumberField (stepper) | Left: other shape, a decision for the lead (audit rank). | Not changed. |

## Fix list, item by item

Verdict by eye, kit left and ours right, light and dark.

| Rank | Item | State | Light | Dark |
| --- | --- | --- | --- | --- |
| 0 | Glass edge (owner, priority) | done | same family | same family |
| 1 | SearchField bug: Input rule reached the nested Input; a box stuck out of the capsule | done. `ios.css` input rule now `:not([data-part])`; Liquid and Neutral Input recipes clear the surface fill of the nested Input on iOS; default size is a 36 tall gray capsule, no border, text 17 | same family | same family |
| 2 | Switch: platform green, plain gray off track, no edge, no ring | done (green is the closest token, see request) | same | same |
| 3 | Neutral dark gray on black, kit corners, capsule buttons | partly. Page black (Theme), grouped card #1c1c1c, alert #2b2b2b, sheet #1c1c1c, popover #2b2b2b, glass tint from the gray ladder (both styles), hairlines, list 26, menu 26, popover 34, buttons and toolbar capsules, no header or footer band. Left: Neutral's text grays stay slightly blue (#e4e9f0, #b4bdcb), since no recipe can redefine `text.*` and each component would need its own rule | close | close |
| 4 | Menu group separator as a thin inset hairline | done (1px, inset by the row padding both sides, 6 above and below, kit hairline colour) | same | same |
| 5 | Text fields as borderless rows in a grouped list | not done: the form and sheet screens put fields in `Field`, not in a List; markup does not allow it (request) | other shape | other shape |
| 6 | Alert: 300 wide, capsules 14 in, corner 34, dark capsule colour | done. Dark capsules are the light glass gray (#3b3b3b) on the panel. Left: the visible focus ring on open in the captures is `:focus-visible` from Radix's programmatic focus with no pointer used (a real tap does not show it) | same family | close (Liquid's panel keeps a faint glass border) |
| 7 | List rows 52, corner 24 to 26 | done: row padding 4, so a row holding a 44 target is 52 (was 56); corner 26. Selection as a trailing check outside edit mode is demo markup (request) | same family | same family |
| 8 | Slider: white capsule thumb on a 6 tall track | done | same | same |
| 9 | Segmented dark: #1c1c1f track, solid #59595b thumb, inset 2 | done (track #1c1c1c, thumb #595959). Light track #ededed | same | same |
| 10 | Progress 4 tall, visible dark track | done (track #2b2b2b dark, #e3e3e3 light) | same | same |
| 11 | Sheet: medium detent floating with all corners round and a grabber; Neutral footer band | partly. Grabber shows with detents (already in M1 rules); Neutral band gone; Neutral footer actions are gray capsules. Not done: the floating medium form. With detents the panel is as tall as the largest detent and moved by one transform, so its bottom corners are off screen; a floating form needs the panel to know it is at a medium detent (request) | close | close |
| 12 | Toast height | partly: corner 24 (was 28), padding 8 (was 12). The banner is still taller than the kit's 64 because of its close button and action, which are markup (request) | other shape | other shape |
| 13 | Popover corner 34 and large soft shadow | done (CSS part). Arrow is a new part (request) | close | close |
| 14 | Neutral buttons as capsules | done (owner ruling). Sizes 34 and 50 rows not added | close | close |
| 15 | Glyph blue | done for glyphs only: list leading glyphs, menu and select checks. Light: the fill blue (Liquid #0a66d6 5.41:1 on white, Neutral #2563eb 5.17:1). Dark: fill mixed 60 percent toward the light tint (Liquid #448af1 4.80:1 on #1c1c1c, Neutral #5285f4 5.06:1). Text tint and the tab bar label unchanged (they hold 4.5:1); filled buttons keep the darker fill (lead's exception: white on Liquid dark fill 4.62:1, on the kit's #0091ff it would be 3.23:1) | close | close |
| 16 | Select as pop-up button | not done: new variant (lead) | | |
| 17 | Toolbar: capsule | partly: capsule corner for both styles. The Liquid light selected ring and the Neutral toolbar paint not touched | | |
| 18 | Empty state full width capsule | not done (layout of the demo; lead) | | |

## Requests for the lead

Tokens:

- A platform green for the switch on fill: `color.state.success.platform`
  (or `color.switch.on`) in the Liquid and Neutral token files, light
  #34c759, dark #30d158. Today: `color.window.light-zoom` (#28c840) in light,
  and that mixed 75 percent with `color.state.success.fill` in dark (#2bcb56).
- Optional: named tokens for the kit's dark ladder in Liquid and Neutral, so
  the `color-mix()` steps in `ios.css` become names.

Markup, props, parts, components:

- AlertDialog: a prop that marks the default action, so the tint filled
  capsule can be the default and not only `emphasis=solid tone=accent`.
- Popover: an arrow part (contract change).
- Sheet: a trailing round confirm button in the header (new part).
- Sheet: an attribute or working value that says the current detent is not
  the largest (for example `data-detent-last`), so the medium sheet can float
  6 in with all corners round.
- Toast: a banner form with no close button and no inline action (the action
  opens from a press), to reach the kit's 64 tall banner.
- Text fields as rows of a grouped card: a field list (Field or Input as List
  rows), then `ios.css` can draw them borderless at 52.
- List demo: a plain trailing check for a chosen row outside edit mode.
- Missing families from the audit: page control, date and time picker,
  colour picker, share panel, edit menu capsule, swipe actions, index bar,
  separate search tab, quick action row in menus, stepper without a value.

## Proof

Sheets (scratch, kit left and ours right; not in the repo):
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/f1/`
- Families, kit then before and after for Liquid and Neutral, light row and
  dark row: `alerts.png`, `buttons.png`, `lists.png`, `menus.png`,
  `notifications.png`, `progress.png`, `search-fields.png`,
  `segmented-controls.png`, `sheets.png`, `sliders.png`, `tab-bars.png`,
  `text-fields.png`, `toggles.png`.
- Edge sheets at 4x, reference then before and after: `edge-tabbar.png`,
  `edge-navbutton.png`, `edge-lens.png`, `edge-menu.png`,
  `edge-segmented.png`, `edge-switch.png`, `edge-switch-off.png`,
  `edge-switch-held.png`, `edge-slider.png`, `edge-circle.png`.
- Our own captures in the repo: `docs/reports/reset/F1/` (same names, ours
  only, every file under 200 KB).

Contrast for text, from pixels at 393 by 852 (Liquid light, Liquid dark,
Neutral light, Neutral dark): list title 16.81, 14.47, 15.56, 13.97; list
subtitle 8.81, 8.33, 7.63, 8.99; segmented selected label 18.38, 7.00, 17.72,
6.58; segmented other label 7.53, 8.33, 6.52, 8.99; search placeholder 6.54,
8.50, 5.76, 9.18; alert message 8.16, 8.21, 7.63, 7.47; alert action label
14.80, 11.20, 14.47, 10.53; menu row over the coloured content 12.47, 11.86,
12.22, 9.75. Boundaries are in the stroke table above.

Web and android unchanged: computed style of every `[data-ds]` and
`[data-part]` element and its two pseudo elements (49 properties: geometry,
paint, shadow, mask, content and the private properties this order touches)
on 18 component pages (switch, slider, search field, segmented control,
progress bar, list, dropdown menu, popover, alert dialog, sheet, toast,
button, checkbox, radio group, input, toolbar, tab bar, navbar), Liquid and
Neutral, light and dark, with the files before this order and after: 144
page runs, 111960 elements, 0 differences.

Contract, `npm run contract -- --framework react --platform ios`:
first run for AlertDialog, Button, Checkbox, ContextMenu, Dialog,
DropdownMenu, Input, List, Navbar, Popover, ProgressBar, RadioGroup,
SearchField, SegmentedControl, Sheet and the first 31 Slider cases: all
passed, 0 failed (the run hit my own 28 minute time limit inside Slider).
Second run for Slider, Switch, TabBar, Toast, Toolbar: Switch 43 passed,
TabBar 43, Toast 63, Toolbar 43 (20 skipped), Slider 42 passed and 1 failed:
"keyboard map", a 90 second timeout in `page.goto` waiting for the demo to
attach while other agents loaded the machine. The same case passed in the
first run (1.1 minutes); the failure is a load timeout, not a style.

Check, `npm run check`: tokens build, gen, eslint, manifests, vitest (227
files, 2977 tests, the lint gates among them), angular, native, docs,
gallery and consumer checks all passed. Typecheck failed on
`packages/react/src/components/SwipeActions/SwipeActions.test.tsx` line 25
(TS2345), a file another agent was writing during the run (changed at 11:55,
mid run). I reran `tsc --noEmit -p tsconfig.json` alone right after: no
errors. No file of this order is TypeScript.

## Decisions I made

- The platform's look in full is opted into through the M6 `--_ios-glass`
  style query, so Studio and Desk are not touched by the colour and corner
  rules. Geometry that is the platform's for every style changed for all
  four: the nested Input fix, list row padding 4, alert width 300 and corner
  34 and capsule inset 14, toast corner 24 and padding 8, the menu hairline.
- The dark gray ladder also replaces Liquid's dark glass tint base
  (#1c1c1f to #1c1c1c): not visible.
- The rim lends the glass buttons' press shade layer; F2 already reads it as
  "the rim".
