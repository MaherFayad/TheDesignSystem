# Lane report: R0.13 Token platform layer

Order R0.13 of `docs/plan/reset.md`, built to `docs/contracts/tokens.md`,
"Platform layer (ruling 8)" and "Platform names". Not committed.

## What I built

- Four platform token files, `packages/tokens/src/platform/{web,ios,android,macos}.json`.
  Each fills the same 66 platform names and nothing else.
- A `platform` section in `packages/tokens/src/contract.json` (ids and the
  platform name groups), and five shared breakpoints added to the style
  contract's `breakpoint` group and to `src/base/breakpoint.json`.
- `size.control.*`, `size.target-min` and `size.touch.*` moved out of
  `src/base/size.json` into the platform files (one owner per name). The web
  file holds the same values and descriptions, so the base CSS is unchanged.
- `packages/tokens/build.ts`:
  - loads and checks the platform files: every platform name filled, no other
    name, no colour (a shadow colour must alias a `color.*` token), no font
    family (a role's `fontFamily` must alias `font.family.*`), no material;
    a style that sets a platform name fails the build;
  - the DTCG `typography` composite type: five CSS variables per role
    (`--ds-type-<role>-font-family`, `-font-size`, `-font-weight`,
    `-letter-spacing`, `-line-height`), five Figma variables, and a React
    Native text style on native (line height in px);
  - CSS: the web values in `:root, [data-style]`, then style blocks, then one
    `[data-platform='<id>']` block per platform, then density, then
    `[data-platform='ios'|'android'][data-density='<d>']` blocks that keep the
    platform's control sizes, then reduced motion and contrast;
  - springs: numbers on native; on the web each platform spring also gets a
    baked `--ds-spring-<scheme>-<speed>-easing` (`linear()`) and
    `-duration`, with the same model and settings as the style springs; the
    durations go to 0ms under reduced motion (the reduced motion block now
    also lists `[data-platform]`);
  - insets: `env(safe-area-inset-*, 0px)` and `env(keyboard-inset-height, 0px)`
    from `$extensions["ds.env"]`; `start` and `end` map to left and right, and
    swap in a `:dir(rtl)` block; native gets 0;
  - elevation levels: shadow composites on the web, and the elevation number
    from `$extensions["ds.elevation"]` on native;
  - native theme objects per style, scheme and platform:
    `dist/native/<style>.<scheme>.ts` (web, as before) and
    `dist/native/<platform>/<style>.<scheme>.ts`; `dist/native/index.ts`
    exports `themes[style][scheme][platform]`, `Platform`, `PlatformThemes`
    and `platformDensities`;
  - system font mapping on native (defect 19): a stack that starts with a CSS
    keyword maps to the platform font (`undefined`, or the family in the
    platform's `$extensions["ds.systemFont"]`; android mono and serif are the
    Android generic names `monospace` and `serif`); a stack that starts with a
    named family keeps it; Figma keeps the first named family;
  - defect 20: `ease.*` strings (CSS `linear()` and `steps()` curves) are left
    out of native themes; native springs come from `spring.*`.
- Tests: `tests/platform.test.ts` (new, 33 tests), `tests/build.test.ts`
  updated, 24 new native snapshots plus the updated CSS and native snapshots.
- Evidence: `docs/reports/reset/R0.13/platform-values.md`, every platform
  value with the audit line or vendor page it comes from.

## New token names

Per platform (each of web, ios, android and macos fills all 66):

| Group | Names | Count |
| --- | --- | --- |
| `size` | `control.xs`, `sm`, `md`, `lg`, `target-min`, `touch.ios`, `touch.android` (moved, not new) | 7 |
| `shape.corner` | `none` to `full` | 10 |
| `opacity.state` | `hover`, `focus`, `pressed`, `dragged`, `disabled-container` | 5 |
| `elevation` | `level0` to `level5` | 6 |
| `spring.spatial` | `fast`, `default`, `slow`, each `stiffness`, `damping`, `mass` | 9 |
| `spring.effects` | the same | 9 |
| `inset` | `safe.top`, `safe.bottom`, `safe.start`, `safe.end`, `keyboard` | 5 |
| `type` | 15 roles, `display-large` to `label-small` | 15 |

59 names are new per platform, 66 filled. CSS variables per platform block:
138 (the 15 roles become 75 fields; the 6 springs add 12 baked variables).
Shared, in base: `breakpoint.compact` 0, `medium` 600, `expanded` 840,
`large` 1200, `extra-large` 1600 (px).

## Sources by family

| Family | web | ios | android | macos |
| --- | --- | --- | --- | --- |
| Type ramp | Material baseline (material audit lines 189 to 194); the web has no vendor ramp | HIG typography, Large (default) Dynamic Type table, fetched; liquid audit line 227 | Material baseline, material audit lines 189 to 194 | HIG typography, macOS text styles table, fetched; liquid audit line 227 |
| Control heights | unchanged base values | HIG accessibility (44 default, 28 minimum, fetched); 34 and 50 unverified | Material buttons 32, 40, 56 (material audit line 259); 36 unverified | HIG accessibility (28 default, 20 minimum, fetched); 22 from liquid audit line 733; 32 unverified |
| Corner scale | material audit line 206 | no vendor scale; shared Material steps | material audit line 206 | no vendor scale; shared Material steps |
| State opacities | material audit line 226 | no vendor values; shared | material audit line 226 | no vendor values; shared |
| Elevation | material audit line 242; geometry from Material Web `elevation/internal/_elevation.scss` (fetched) | no vendor levels; shared geometry | as web | no vendor levels; shared geometry |
| Springs | Material standard scheme, material audit lines 300 to 303 | SwiftUI docs (fetched): `interactiveSpring()` 0.15/0.86, `spring()` 0.5/0.825, `smooth` 0.5/no bounce, `Animation.default` 0.55/1.0; slow spatial and fast effects derived | as web | as ios |
| Insets | contract, `env()` | same | same | same |

The fetched vendor URLs are in each token's `$description`. The DTCG format
was checked against the published Format Module 2025.10 at
designtokens.org (typography: `fontFamily`, `fontSize`, `fontWeight`,
`letterSpacing`, `lineHeight` as a multiplier).

Values from memory, unverified: ios `size.control.sm` 34 and `lg` 50; android
`size.control.sm` 36 (one density step under 40); macos `size.control.lg` 32.
Derived, no vendor value: ios and macos `spring.spatial.slow` (the `spring()`
damping at 1.5 times its response) and `spring.effects.fast` (the
`interactiveSpring()` response with no bounce).

## Acceptance

| Check | Result |
| --- | --- |
| Snapshot tests for CSS and native objects | pass: `tokens.css`, 8 web and 24 platform native snapshots, `native.index.ts` |
| Evidence table of every platform value with its source line | `docs/reports/reset/R0.13/platform-values.md` |
| No native theme names `Segoe UI` or `SFMono-Regular` | pass: `grep -rl "Segoe UI\|SFMono-Regular" packages/tokens/dist/native` finds nothing; a test checks every native file |
| `dist/native/index.ts` exposes `themes[style][scheme][platform]` | pass, test and runtime probe |
| Deterministic build (two runs, byte equal) | pass, the existing test writes two builds and compares every file |
| `npm run check` | see "Check" below |

## Check

`npm run check` passes every step that reads my files: tokens build, gen,
typecheck, eslint, manifests and the token tests. It is not fully green
because of two files other orders own:

1. `packages/lint/src/gates/no-raw-value.test.ts:35` expects the breakpoint
   list to be exactly `phone`, `tablet`, `desktop`. This order adds the five
   shared breakpoints the contract names, so the expected object needs
   `compact: 0, medium: 600, expanded: 840, large: 1200, 'extra-large': 1600`.
   The gate itself works with them.
2. `packages/native` typecheck: `src/components/Button/Button.styles.ts:365`
   passes a `Platform` that now includes `macos` (R0.10's change to
   `packages/shared/src/theme.ts`) to `touchTargetOf` in
   `src/theme/units.ts:19`, which takes only web, ios and android. Native
   jest, run alone, passes 60 of 60 with the new token output.

## Existing output that changed

- CSS: no existing variable changed value (compared declaration by declaration
  against the build before this order). The density blocks now come after the
  style blocks and before the new platform density blocks, and the reduced
  motion selector list gained `[data-platform]`; the declarations are the
  same.
- Native web theme objects (`dist/native/<style>.<scheme>.ts`):
  `font.family.mono` is `undefined` in every style (was `SFMono-Regular`);
  Liquid `font.family.sans` and `display` are `undefined` (were `Segoe UI`);
  `ease.spring-soft`, `spring-snappy` and `spring-bouncy` are gone from every
  native theme and from the `Theme` type (nothing in `packages/native` reads
  them). New keys are added.
- `dist/native/index.ts`: `themes[style][scheme]` is still the web theme (a
  copy of it), now with `web`, `ios`, `android` and `macos` keys beside the
  token roots. `themes.studio.dark` is no longer the same object as the
  `studioDark` export; native tests compare against `themes`, so they pass.
- Figma: new variables; the size variables keep their values, two gained a
  description.
- Tailwind: `--shadow-level0` to `level5` and the five breakpoints added.
  `custom-media.css`: the five breakpoints added.

## Decisions I made

1. **`themes[style][scheme]` keeps working.** The contract asks for
   `themes[style][scheme][platform]`, and `packages/native` (owned by R5.2)
   reads `themes[style][scheme]` as a theme. Each scheme entry is the web
   theme spread with the four platform themes as keys, typed
   `PlatformThemes = Theme & { [P in Platform]: Theme }`. R5.2 can switch to
   the platform key and the flat form can go later.
2. **Platform theme files sit in folders** (`native/ios/studio.dark.ts`), not
   beside the web file as `studio.dark.ios.ts`: React Native's platform
   extensions resolve `./studio.dark` to `studio.dark.ios.ts` on iOS, which
   broke every native test until I moved them.
3. **The web takes the Material values** for the new names (type ramp, corner
   scale, state opacities, elevation, springs): it is the one vendor that
   publishes them for the web. No web component reads them yet, so nothing
   looks different.
4. **ios and macos share the Material corner scale, state opacities and
   elevation geometry**: the vendor publishes none. Each token says so.
5. **iOS and macOS tracking is 0**: the HIG says the system font adjusts
   tracking at every size, and on the web the style's own font is used.
6. **Elevation colour** aliases the style's `color.bg.scrim-30` (key shadow,
   0.3 as in Material Web) and `scrim-20` (ambient; Material Web uses 0.15,
   and the contract has no 0.15 step). A shadow token for elevation colour
   would need a contract name every style fills.
7. **Density on ios and android** keeps the platform control sizes in both
   densities (`$extensions["ds.density"]` in the platform file); macos and web
   follow the shared density blocks.
8. **Role to style mapping** for ios and macos (15 roles over 11 text styles):
   display large, medium, small are Large Title, Title 1, Title 2; headline
   large, medium, small are Title 1, Title 2, Title 3; title large is
   Headline; title medium and small are Callout and Subhead (macos: Body and
   Callout) at the emphasized semibold; body large, medium, small are Body,
   Subhead, Footnote (macos: Body, Callout, Subheadline); label large is Body;
   label medium and small are Caption 1 and Caption 2 (macos: Subheadline,
   Footnote).
9. Display and headline roles alias `font.family.display`, the rest
   `font.family.sans`.

## Left open

- The two failures in "Check", for the lead.
- iOS mono on native is `undefined` (the system sans): React Native on iOS has
  no generic monospace name, and naming a vendor family was out of bounds.
  R5.2 or the font loader decision should settle it.
- The unverified control heights above want a measurement on a device or a
  vendor page with numbers.
- `custom-media.css` now has `--ds-below-compact (width < 0px)`, which never
  matches. Harmless; the build writes one pair per breakpoint.
- The contract text says the build maps `start` and `end` "by `dir`"; I used
  `:dir(rtl)`, which matches the direction an element inherits.
