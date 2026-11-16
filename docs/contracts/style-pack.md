# Style pack contract

A style is a pack that plugs into the component contract. Full detail:
section 3.7 of PLAN.md.

```text
packages/styles/<id>/
  style.json            id, name, schemes, defaults, icon set, motion preset, optional parts, fonts, dials
  tokens.dark.json      semantic and component tokens, DTCG
  tokens.light.json
  recipes/<Component>.css     web: only rules tokens cannot express
  native/<Component>.ts       React Native: style adjustments
  icons.ts              maps system icon names to glyphs of one icon set
  motion.ts             named pattern presets for this style
  figma.json            mode names and variant switches
```

## What a style may change

| Kind of difference | Lives in |
| --- | --- |
| A value | Tokens |
| The way an existing part is drawn | A recipe in the style pack |
| A part only one style shows | An optional part, off by default, turned on in `style.json` |
| Behavior | Never in a style. It becomes a prop. |

Never markup. Never behavior. If a style cannot be built without touching a
framework package, the contract is wrong: report it.

## Recipes (web)

```css
@layer ds.recipes {
  [data-style='desk'] [data-ds='button'][data-tone='accent'] { ... }
}
```

Recipes follow every rule in `anatomy.md`: tokens only, logical properties,
no `!important`. Write as few as possible. First try a component token.

## Styles and platforms (ruling 16)

Rule: when a style and a platform disagree on shape, the style wins on
controls and the platform wins on sheets, bars and alerts. The layers do
this (`anatomy.md`, "Cascade layers and the shape split"), so a recipe needs
no `[data-platform]` guard to keep its control shapes, and a guard cannot
keep a chrome shape against the platform.

- A recipe for a control (Button, Switch, Checkbox and the rest of the
  controls side) is drawn the same on every platform. The platform still
  sets the control's height, touch target and press feedback, because those
  come from platform tokens the recipe reads.
- A recipe for chrome (Sheet, Dialog, AlertDialog, Navbar, TabBar, Toast and
  the rest of the chrome side) paints it: colors, fonts, borders, shadow
  colors, material. On `ios`, `android` and `macos` the platform's geometry
  wins over the recipe's. On `web` the recipe's geometry stands.
- A style never sets a platform token name (`tokens.md`, "Platform layer").

Example: Liquid's capsule tab bar and round checkbox on an Android phone.

| Part | Side | Result on `android` |
| --- | --- | --- |
| Checkbox | Controls | Liquid's round check stays |
| TabBar | Chrome | The Android bar: 64 tall with a 56 by 32 indicator, in Liquid's colors and material |

Inside native chrome (React Native), Studio and Desk keep the platform's
bars and sheets and supply tint, fonts and content (ruling 10). A style that
draws its own native chrome turns on the optional part `chrome.drawn` in
`style.json`; it is off by default.

## Optional parts

A component renders an optional part only when the active style turns it on.
The Theme provider exposes the active `style.json` data through context, so a
component asks `useOptionalPart('window', 'controls')`. The same list drives
Angular and React Native.

## The twelve dials

Base, accent, depth, separation, radius, controls, density, type, icons,
chrome, motion, focus. See the table in section 3.7 of PLAN.md for the four
hand built styles. Arabic uses IBM Plex Sans Arabic in every style.

## Rules for glass (Liquid, and Desk windows)

- Glass is for the control and navigation layer only. Content stays solid.
- Glass never sits on glass.
- Under reduced transparency or more contrast, glass becomes a solid surface.
- Contrast is tested against the brightest and the darkest backdrop.
- The glass axis: `clear`, `regular` (default), `tinted`.

## Status

`style.json` adds two keys to the schema in PLAN.md: `status` (`stable` or
`proposed`) and `proposedSchemes` (a list of schemes still waiting for the
owner).

A new look is marked `"status": "proposed"` in `style.json` until the owner
approves it. Desk Light, Neutral and Liquid start as proposed.
