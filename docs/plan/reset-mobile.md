# Mobile fix orders (owner, 2026-11-16)

The owner judged the phone platform layer wrong throughout and said: "only
do the mobile fixes now, just the iOS and android". These two orders replace
R0.22 and come before everything else in `docs/plan/reset.md`. Nothing else
runs: no desktop, no gate review, no R1.

Binding: `DECISIONS.md`, sections "Platform looks on the web follow each
vendor's web language" and "The iOS glass switch: Liquid and Neutral", and
ruling 16 (style wins on controls, platform wins on sheets, bars and
alerts). Owner feedback: `docs/plan/reset-followups.md`, from "Owner feedback
on the R0 screenshots" to the end.

Method for both orders. Work from pictures, not from tables: put a
reference capture beside ours at the same width for every part, look at
both, fix, and repeat until a person would call them the same family. A
measured match with a picture that looks wrong is a fail. References are
third party screenshots: keep them in scratch outside the repo, cite their
links in the report, and copy no artwork, icons, marks, fonts or text.
Lucide icons stay. The style id stays `liquid`.

## M1 iOS phone surfaces (ds-style)

References: the vendor's own music and wallet apps on Mobbin, platform
`ios` (the connector tool is `mcp__Mobbin__search_screens`).

Scope, on the gallery's `/platforms` screens and the component pages, at
393 by 852, light and dark, LTR and Arabic RTL:

1. Tab bar: a floating capsule inset from the edges, glass, a soft lens on
   the current item, icon and label sizes as in the reference.
2. Navigation bar: no bar fill; round glass buttons over content; large
   title that sits in the content.
3. Switch: wide capsule track and capsule thumb. In Liquid and Neutral the
   thumb lifts into a raised glass lens while the finger is down (from
   `pointerdown`), then switches. Studio and Desk keep their own switch
   with press feedback under the finger.
4. Segmented control and tabs: capsule track with a capsule thumb; never a
   square block in a round track, in any style.
5. Grouped list: inset cards with large corners, hairlines between rows,
   row height and type as in the reference.
6. Alert: compact rounded card with stacked capsule actions.
7. Sheet: large top corners, a round glass close button, capsule primary
   action, grabber only where the sheet has detents. A sheet always has a
   visible close control.
8. Menu and toast in the same family.

Styles: Liquid and Neutral take the platform look in full. Studio and Desk
keep their control shapes and colours and take the chrome geometry.

Files: `packages/css/src/platform/ios.css`,
`packages/tokens/src/platform/ios.json`, the Liquid and Neutral recipes,
and the base CSS and React markup of TabBar, Navbar, Switch,
SegmentedControl, List, AlertDialog, Sheet, Menu and Toast where a part is
missing. The gallery `/platforms` screen for `ios`.

## M2 Android phone surfaces (ds-style)

References: Material 3 for the web, captured in a browser from Google's own
web component catalogue and guidance pages.

Scope, same screens, at 412 by 915: navigation bar (80 tall, 64 by 32
active indicator pill, 24 icons, label below), top app bar, switch
(52 by 32 track, thumb that grows when on and when pressed), segmented
buttons and tabs, lists, dialog (28 corners, text actions at the end),
bottom sheet (28 top corners, drag handle), menu, snackbar, state layers
and ripple from `pointerdown`.

Files: `packages/css/src/platform/android.css` and
`packages/tokens/src/platform/android.json` only. Where a style recipe
breaks the platform's form on chrome (Liquid's lens on the navigation bar
item), `android.css` may reset that paint in `ds.chrome` for this order.
Anything that needs a shared component file or a recipe goes in the report
for the lead.

## Acceptance, both orders

- A sheet per part: reference left, ours right, same width, light and dark.
  The lead looks at every sheet before the owner does.
- The 320px reflow check and the contract run pass for every component
  touched, on the platform; `platform=web` renders as before (zero change,
  or each change listed).
- WCAG 2.2: contrast 1.4.3 and 1.4.11, target size 2.5.8 with the platform
  touch target on controls, reduced motion.
- `npm run check` passes.
- A recording pack (`npm run record`) for Switch, tab bar, alert, sheet.
- The owner signs on a phone. Until then every look is proposed.

## Fix round 1 (after the lead looked at the sheets)

Three small orders, disjoint files. Agents do not commit.

- **M3, recipes on android (ds-style).** Neutral switch off paint on android
  (track `bg.overlay-10`, small thumb in `border.control-hover`, no thumb
  shadow, no thumb edge rule, hover rule off android). Neutral toast on
  android: inverse surface, light text, no border, text button action; check
  contrast in both schemes. Liquid segmented control on android: clear track,
  outline in `border.control-hover`, selected fill `primary.tint-hover`, no
  thumb shadow, no indicator filter. Files: `packages/styles/neutral/recipes/
  {Switch,Toast}.css`, `packages/styles/liquid/recipes/SegmentedControl.css`.
  Proof: reference beside ours for the three parts, web and ios unchanged.
- **M4, press from touch down in React (ds-component).** Set `data-pressed`
  from `pointerdown` to `pointerup`, `pointercancel` and lost capture on
  Button (ButtonBase), Chip, the TabBar item, the linked List row and
  Pagination pages, the way `Switch/drag.ts` does. Add the state to each
  manifest. Tests for each. No CSS files.
- **M5, Angular parity (ds-angular).** The same `data-pressed` on the Angular
  switch and on the Angular forms of the M4 components, and the sheet close
  button in the title bar on phones when window controls are on, matching
  React `Sheet.tsx`.

Known and left alone: the Angular test suite has timing tests that fail on
some runs with no Angular change (dropdown menu exit copy, switch drag). Not
part of the mobile fixes.
