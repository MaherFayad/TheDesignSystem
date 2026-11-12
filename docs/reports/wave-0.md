# Wave 0 report: the spike

Date: 2026-11-12. Status: Gate 0 passed, with open items for the owner.

## Gate 0

| Condition | Result | Evidence |
| --- | --- | --- |
| The two example apps render the five components from the packages | Pass | Next smoke 10 of 10, Vite smoke 11 of 11, on production builds. `docs/reports/consumers.md` |
| The Angular screenshots match React's | Pass | 15 of 15 images with 0 differing pixels; the matrix compare adds 40 pairs, all 0. `docs/reports/angular-proof.md` |
| The React Native Button reads its look from the same tokens | Pass | Fills, text colors, borders, height and radius match in five modes. `docs/reports/native-proof.md` |
| `npm run check` | Pass | 12 of 12 steps: tokens, gen, typecheck, eslint, manifests, vitest, and the Angular, native and consumer checks |
| Contract suite, React | Pass | 229 pass, 3 skipped, 0 fail |
| Contract suite, Angular | Pass | 73 of 73, the same suite with no special cases |
| Axe sweep, React gallery | Pass | 112 runs, 0 violations, English and Arabic, overlays open and closed |
| Screenshot matrix | Pass | 108 shots, byte equal across two runs. `docs/reports/matrix-wave-0.md` |

Not verified in this wave: anything on a real device. The React Native
screenshots come from the web export. iOS is with the owner.

## What works

- **Tokens.** 427 GoBanana tokens and 50 Figma-Killer-2 tokens are mapped to
  DTCG 2025.10. One build writes five outputs: layered CSS, typed theme
  objects for React Native, token name types, flat JSON per mode for Figma,
  and a Tailwind bridge. The build is deterministic and snapshot tested.
- **Two styles, four modes.** Studio dark and light, Desk dark, and Desk
  light as a proposal.
- **Components in React.** Icon, Button, IconButton, Field, Input, Dialog,
  Toast, Window, TitleBar, WindowControls, plus Theme and Bidi. Each was
  built, reviewed by a fresh agent, and fixed.
- **Angular.** Theme, Button, IconButton and Dialog on the shared CSS with no
  CSS change.
- **React Native.** ThemeProvider, Button and IconButton on the generated
  theme objects, in an Expo gallery.
- **Gates.** Fourteen rules run in `npm run check`, each with a failing
  fixture: contrast, contract completeness, token vocabulary, no raw color or
  value, logical properties, no dash, no native title, no Tailwind, button
  primitive, native style literals, transform and opacity only, no
  `!important`, no public token declared, forced colors fallback.
- **Contract suite.** Generated from the manifests. It runs against any
  gallery URL and is what proved the Angular DOM.

## What the contract could not express, and what changed

Each item is now written into `docs/contracts/`.

| Finding | Change |
| --- | --- |
| The DTCG spec allows only `px` and `rem` dimensions and has no spring type | `em` and `vh` values are numbers with a `ds.unit` extension. A spring is a group of three numbers. |
| 64 source tokens had no semantic name | Added under `added` in `contract.json`. Later rounds added names the components needed: disabled opacity, a fixed 16px size, primary tint, solid state fills, window sizes, scales, breakpoints, grain opacity. |
| `Theme` cannot take inline styles through `style`, since `style` is the style axis | Inline styles go through `css`. |
| Button and Input were built with different habits | "One convention for component CSS and props": private `--_component-*` properties, states swap properties, fixed pseudo element roles, focus and disabled rules, `start` and `end`, prop spread, shared axis types. |
| A recipe could not override a component property declared in another file | Component CSS declares only private properties. Public `--ds-*` names come only from the token build. The gate enforces both. |
| A nested component is often a named part of its parent | A root may carry its parent's `data-part`. A part belongs to the nearest ancestor root. A manifest lists only its own parts. |
| Window needs states the shared list does not have | A component may add boolean state attributes when its manifest lists them. |
| Under reduced motion every duration is 0ms, so `transitionend` never fires | Never wait on those events. Use the animation's `finished` promise. |
| The manifest schema lacked a place for suite hints and sub components | Added `parts` and `contract` (trigger, optional parts, skipped axe rules, key hints). |

## What the Angular proof taught

- The shared CSS holds. Angular reaches the same DOM through attribute
  selectors, with no wrapper elements.
- The theme style is `dsTheme="desk"`. A static `style="desk"` is parsed as
  inline CSS and silently ignored.
- Angular leaves static attributes on the host, so each directive removes
  them. Without that a static `disabled` becomes the native attribute.
- The CDK Dialog and the CDK FocusTrap both insert elements inside the root
  and break the shared selectors. The dialog uses a CDK portal and wraps Tab
  by hand.
- Some names cannot equal React's: `asChild` has no form, `onOpenChange` is
  an output, a lifted dialog title is an input.
- Angular Aria is stable in version 22 but has no Dialog or Button pattern.
  It was not installed.

## What the React Native proof taught

- The theme objects are enough to port a component's look without reading
  the CSS variables.
- Fluid tokens differ by design: the web clamps toward the minimum on a
  phone, native uses the maximum. Native buttons come out about 11 percent
  wider. The build now exports the minimums so wave 2 can choose.
- React Native 0.88 needs React 19.3.0 exactly while the web packages use
  19.3.1. The native workspaces keep their own nested copy.
- Not possible on touch: hover, the roll label, a token focus ring.
- The native style literal gate skips `*.styles.ts`, so it cannot prove
  those files take every value from the theme.

## Decisions that differ from the plan

| Plan | What was done | Why |
| --- | --- | --- |
| Toasts render above an open dialog | They are visible, read aloud and clickable, but keyboard focus stays in the dialog | The trick that let the keyboard through silenced other focus handlers. Error toasts and toasts with an action never time out, so they are still there when the dialog closes. |
| Window lights | Idle dots at rest, colors on hover and focus, unmirrored in RTL | The source and the platform convention |
| Default size | `md` (32px) in every component | The size table in the plan, although the sources default to 28px |
| `git init`, branch `main`, never push | Session branch, pushed after each wave | Cloud container, and the owner's answer on 2026-11-12 |

## Side by side

- React and Angular: `docs/reports/shots/angular/`
- React web and React Native: `docs/reports/shots/native/`
- Desk dark and Desk light: `docs/reports/shots/desk-light/`
- Full matrix: `docs/reports/shots/matrix/react/index.md`
- Consumers: `docs/reports/shots/consumers/`

## Known gaps carried into wave 1

**First orders of wave 1**

1. Components adopt the round 3 tokens (window sizes, scales, durations,
   grain, breakpoints) and drop their "token gap" comments. The raw value
   gate must first allow a breakpoint literal in a media query.
2. Move theme resolution and the dialog focus rule into `packages/shared`.
   Both are written twice today.
3. Package fixes found by the consumers: type declarations for the CSS entry
   points, one `playwright-core` version, the Inter font URLs under webpack,
   and a dialog focus fallback when the return target is gone.
4. The native title gate wrongly flags a `[title]` binding on a system
   directive.
5. A `moves` expectation in the contract suite so Window's arrow keys are
   checked, not only noted.

**Manifest gaps** (they matter because wave 1 generates the docs from
manifests): the `toast()` call shape, the need for a root `Theme` when only
`<html>` is stamped, `WindowLayer`, a form inside a dialog, and Window labels
that stay English under `lang="ar"`.

**Visual findings from the matrix** (none fails a gate): English demo copy in
Arabic mode, the toast count badge wrapping in Studio, a clipped placeholder
in the horizontal Field demo, input adornments about 2px above the baseline,
tight padding in the xs pill input, and the Icon demo using browser default
headings.

**Other**

- No motion catalog yet. Manifests name patterns that order 1.11 defines.
- Icons: 52 system names. `mail` is missing.
- Densities are screenshotted for controls only.
- Liquid, Neutral and Paper do not exist yet.

## Waiting on the owner

1. **Desk Light approval.** `docs/reports/desk-light.md`. Three choices, each
   with a recommendation: warm or neutral desk, how strong the gold border on
   the yellow primary is, and the window light colors on a light title bar.
2. **Desk dark glass over bright content.** Muted and subtle text on glass
   measures 3.04 to 4.33, and window text over a white backdrop 3.02 to
   3.37. These are the GoBanana values and stay as known failures in the
   contrast gate. Change the values, or confirm bright content never sits
   behind Desk glass.
3. **iPhone check.** Steps in `docs/reports/ios-check.md`.
