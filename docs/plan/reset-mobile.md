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

## M6, iOS glass material (owner: "I don't see the glass effect in iOS at all but outlines")

Cause, measured by the lead: the glass tokens the iOS chrome uses are 84 to
94 percent opaque (`material.glass` 0.84, `material.glass-strong` 0.92 in
Liquid light), so the blur behind them cannot be seen, and the demo screen
has nothing coloured behind the bars. What is left to the eye is the border.

Owner agent: ds-style. Scope: `packages/css/src/platform/ios.css`, the Liquid
and Neutral recipes that repaint iOS chrome, the iOS block of
`apps/gallery-react/src/platforms.css` and the gallery's iOS phone screen
content. No new token names; build the material from existing tokens with
`color-mix()` and `calc()`.

- **Material.** On `ios` in Liquid and Neutral, the tab bar, its lens, the
  navigation and sheet buttons, the menu, the toast banner, the segmented
  thumb and the held switch lens are clear glass: a low tint (start near 30
  percent of `material.glass-solid` in light, lower in dark), a real
  backdrop blur with saturation, a bright rim on the upper edge and a faint
  dark rim on the lower edge drawn with inset shadows or a masked gradient
  ring (not a flat one colour border), a soft inner glow, and a soft drop
  shadow. The lens of the current tab is brighter than the bar.
- **Three strengths.** Build `clear`, `regular` and `frosted` as one private
  property on the iOS root so the owner can pick; ship the one closest to the
  reference as the default.
- **Content behind.** The gallery iOS phone screen gets our own coloured
  content that scrolls under the bars (generated gradients and shapes, no
  third party art), so the glass has something to show.
- **Fallbacks stay.** `prefers-reduced-transparency`, `prefers-contrast:
  more`, forced colours and no backdrop filter support keep the solid
  material.
- **Contrast.** Labels on the glass meet 4.5:1 (WCAG 2.2 1.4.3) and glyphs
  3:1 (1.4.11) over the lightest and the darkest content of the demo; measure
  from pixels, not from tokens. If clear glass cannot meet it, raise the tint
  only as far as needed and say so.
- **Refraction.** An SVG displacement filter in `backdrop-filter` works in
  Chromium and not in Safari on iOS. Do not ship it as the look; note it as
  an optional later step.

Acceptance: sheets with the reference left and ours right over coloured
content, light and dark, at 1x and at 3x on the tab bar, the navigation
buttons, the menu and the held switch; the three strengths side by side;
`platform=web` and `platform=android` unchanged by computed style;
`npm run contract -- --framework react --platform ios` for TabBar, Navbar,
DropdownMenu, Toast, Switch, SegmentedControl, Sheet; `npm run check`.

## Owner additions (2026-11-17)

The owner gave the vendor's own iOS and iPadOS 27 community kit in Figma
(file key `Cltzs6FZW3N5yiC1x1cpQJ`) as the source for what the iOS components
are, asked that dark mode be checked against the references as well as
light, and asked for support and designs for the folding iPhone.

- **M7, audit (ds-qa, report only).** Coverage map of the kit's component
  families against ours, kit beside ours in Liquid and Neutral, light and
  dark, a verdict per family and scheme, a ranked fix list. Report:
  `docs/reports/lanes/reset-M7-audit.md`. Fix orders follow from it, after
  M6 lands, since both touch `ios.css`.
- **M8, folding iPhone plan (ds-architect).** Facts with sources, modelling
  options, component behaviour per screen and posture, orders. Plan:
  `docs/plan/reset-duo.md`. No code until the owner picks the model.

Use of the kit: read only, as a reference to look at and measure, the same
way as the Mobbin screens. Its licence allows no copying, extracting,
redistributing or derivative assets, and covers mock ups for the vendor's own
platforms only. So: no asset, glyph, text, variable or component name from it
enters the repo, no kit image is committed, and nothing is written to Figma.

- **M9, build every iOS family (owner: "make sure to replicate those all,
  and have them developed").** After M7 reports: one order per family the
  audit marks "not there" or "we do not have it", in the audit's rank order,
  each built in our own code with our own icons and type, in light and dark,
  Liquid and Neutral first. New components go through the contract (lead).
- **M10, test screens against Mobbin (owner: "make then test screens against
  mobbin references").** Whole screens composed only from our components,
  each rebuilt from one Mobbin reference of a native app (music, wallet,
  settings, fitness, and more as the families need), shown reference beside
  ours in light and dark at the phone size, and on the folding iPhone's outer
  and inner screens once M8 lands. Our own content, no third party artwork,
  text or marks; references stay in scratch with their Mobbin links cited.
  A screen is the acceptance test for the families on it.
