# Audit summary, 2026-11-14

The owner tested the live site and said the system looks bad in many ways,
does not look or work like the two source repos, is not premium on mobile,
lacks mobile components, and has no interactions to speak of. Four audits
checked each point. All four agree with the owner.

Reports: `fidelity-gobanana.md`, `fidelity-figma-killer-2.md`, `mobile.md`,
`interactions.md`, each with evidence under `shots/`.

## Root causes

1. **Components were built, screens were not.** The identity of both sources
   lives in their screens: the GoBanana desk (menu bar, glass windows, dock,
   phone home screen) and canvas editor; the Figma-Killer-2 editor shell
   (rail, layer tree, canvas sheet, inspector). None exists in the system.
2. **The styles drifted away from their sources.** Orders 1.24 and 1.28 made
   Studio square, outlined and shadowless to separate it from Desk. Orders
   1.21 to 1.29 gave Desk tracking on labels, 36px pills, title bars on
   dialogs, decorated toasts and an overshoot spring. The sources have none
   of these.
3. **Mobile was a skin.** No part of the mobile family exists. React Native
   has two components. Safe areas resolve to zero.
4. **Motion is present but not perceivable.** In the default style a press is
   a 2 percent dip over 70ms that shows only after the finger lifts. The
   reviews proved presence on zoomed stills, not perception on a phone.
5. **Progress was measured in tests passed.** No check compared the result
   with the sources or with what a person sees and feels.

## Scores (0 to 5)

| Area | GoBanana (Desk) | Figma-Killer-2 (Studio) | Mobile |
| --- | --- | --- | --- |
| Shell or navigation | 1 | 1 | 1 |
| Type | 2 | 3 | 2 |
| Colour | 4 | 2 | 3 |
| Shape | 3 | 1 | 3 |
| Density | 2 | 3 | 3 |
| Controls | 2 | 1 | 3 |
| Overlays | 2 | 1 | 2 |
| Motion | 1 | 1 | 3 |
| Coverage | | | 1 |
| React Native | | | 0 |

## What holds up

Tokens, the type and space scales, the contract and manifests, the keyboard
models, the Angular DOM parity, ScrubInput, the Sheet's drag physics, Toast
swipe, the Liquid tab bar, the gates and the docs pipeline.

## Decisions the owner must make before any build

1. Do Studio and Desk return to their sources exactly, undoing the
   separation and decoration of orders 1.24 to 1.29?
2. Where a source falls below WCAG 2.2 non text contrast (Figma-Killer-2's
   20 percent control border), does fidelity or the 3:1 rule win?
3. Where does rich motion live, given the sources are quiet (120 to 140ms
   eases) and the owner also wants the feel of the two reference sites?
4. Is mobile a web target, a React Native target, or both, and in what order?
5. Does the system ship the source screens as templates (desk, editor)?
