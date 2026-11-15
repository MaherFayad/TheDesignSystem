# Audit summary, 2026-11-14

The owner tested the live site and said the system looks bad in many ways,
does not look or work like the two source repos, is not premium on mobile,
lacks mobile components, and has no interactions to speak of. Four audits
checked each point. All four agree with the owner.

Reports: `fidelity-gobanana.md`, `fidelity-figma-killer-2.md`, `mobile.md`,
`interactions.md`, `liquid-guidelines.md` and `material-guidelines.md`, each
with evidence under `shots/`.

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

## Two platform audits, added on 2026-11-15

- **Liquid against the platform's glass guidance, components and web**
  (`liquid-guidelines.md`). A good frosted style, a weak copy of the
  material. About 30 percent of the gap is tokens, 70 percent is component
  structure. Adaptivity 1, desktop form 1, optics 2, phone bars 2. It
  already matches what the vendor ships on its own web pages.
- **Android against Material 3 and its Expressive update**
  (`material-guidelines.md`). Sizes are often right; the feel is not.
  Average 1.4 of 5. Back gesture 0, React Native 0. Recommends both a
  platform variant for behaviour and a Material based style for look, built
  on the system's own components (the official web components are in
  maintenance mode).

More decisions for the owner:

6. Does the platform axis gain a `macos` value?
7. Is there a sixth style built on Material's colour roles, type and shape,
   and what is its id?
8. May `@material/material-color-utilities` (Apache 2.0) be added to
   generate colour schemes from a seed colour?
9. Which wins when a style and a platform disagree on shape: today the
   style recipe erases the platform's.

## Native audit, added on 2026-11-15

- **Native iOS and Android components** (`native.md`). The earlier audits
  judged phones through web components in an emulated browser. This one
  covers the React Native package itself. Verdict: not built right, and
  never checked on a device. ThemeProvider, Button and IconButton share the
  web tokens and pass 60 of 60 jest tests, but press feedback is the same on
  both platforms and runs on the JS thread, Android has no ripple, there are
  no haptics, type follows the desktop web scale (a 12 to 14 point label
  where iOS uses 17), the platform changes only the hit slop, dark mode does
  not follow the system by default, and the Liquid theme asks the device for
  `Segoe UI`. 28 defects are listed by file and line.
- **The plan itself is the larger fault.** It draws every native part in
  JavaScript. Navigation transitions, sheet physics, menus, pickers and the
  system glass cannot be imitated well, and both vendors say to use standard
  components to get them. The installed Expo SDK ships stable native tabs
  and a package that renders SwiftUI and Jetpack Compose views from React.
- **Nothing native could be verified here.** The container has no Android
  SDK or emulator and cannot build iOS. A web export or a passing jest run
  proves nothing about native look or feel.

Options: A, draw everything in JavaScript (the plan as written); B, hybrid,
with system views for chrome (navigation, tab bar, sheets, menus, pickers,
alerts) and brand controls drawn from tokens with a behaviour profile per
platform; C, separate SwiftUI and Compose libraries generated from the
tokens. The audit recommends B, plus a platform layer in the token build.

More decisions for the owner:

10. Native build approach: A, B or C. B needs these added to the allow list,
    all MIT: `react-native-screens`, one router (`expo-router` or React
    Navigation with the native stack), `@expo/ui`,
    `react-native-keyboard-controller`, `expo-status-bar`.
11. Inside native chrome, do Studio and Desk keep the platform's bars and
    sheets and supply only tint, fonts and content (recommended), or draw
    their own chrome?
12. Icons in native tab bars and toolbars: the plan forbids the iOS system
    symbol set, so the icons package would render Lucide and pixel icons to
    images for native chrome. Confirm, or allow Material Symbols (Apache
    2.0) on Android.
13. Device verification: an Expo account with cloud builds, and either an
    Apple developer account or Expo Go, so native work can be checked on an
    emulator, a simulator and the owner's phones. Without this, no native
    component can honestly be marked done.
