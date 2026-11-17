# Lane report: DU4 folding iPhone profiles and fold emulation

Order DU4 of `docs/plan/reset-duo.md`, as narrowed by the lead: device
profiles in the contract harness, emulation of the fold, the posture and
asymmetric safe areas in Chromium, a reflow check at the outer screen's
Safari width, a self test, and skipped checks for DU2. Not committed.

## What was run to find out what works

Playwright 1.63.0 as installed (no other version, no `playwright install`).
Bundled Chromium 153.0.8010.12, both the headless shell and the full build
give the same results. Each command was sent through a DevTools protocol
session on a page at 951 by 669 on a secure origin, then the page was read
with `matchMedia`, `env()` and the JavaScript APIs.

| Command | Accepted | Effect on the page |
| --- | --- | --- |
| `Emulation.setSafeAreaInsetsOverride` | yes | `env(safe-area-inset-*)` report the values, each side on its own; they stay after a navigation and after the session detaches |
| `Emulation.setDevicePostureOverride` (`folded`) | yes | `(device-posture: folded)` matches and `navigator.devicePosture.type` is `folded`. After a navigation the media feature stays folded but `navigator.devicePosture.type` reads `continuous` again; a detach clears both |
| `Emulation.setDisplayFeaturesOverride` | yes | none: one segment, `env(viewport-segment-*)` empty, with or without a device metrics override |
| `Emulation.setDeviceMetricsOverride` with `displayFeature` (deprecated field) | yes | `(horizontal-viewport-segments: 2)` or `(vertical-viewport-segments: 2)` match, `env(viewport-segment-width 0 0)` is 455 and `env(viewport-segment-left 1 0)` is 495 (or the height and top pair in portrait), `window.viewport.segments` lists both. It survives a Playwright `setViewportSize` to the same size and a navigation; a detach clears it |

So: the safe area and the posture are emulated with their own commands, the
fold with the device metrics command, and the session stays open while the
page lives. `src/fold.test.ts` runs the same probe on every check and prints
the table, so a later Chromium that changes this shows up in the log.

WebKit: Playwright's WebKit build is not installed (only `chromium`,
`chromium_headless_shell` and `ffmpeg` are), and WebKit has no protocol for
any of the three overrides. The plan's "WebKit runs the profiles without
overrides" was not run here.

## Stand in (not emulation)

`standInDuo(page, profile)` in `packages/contract-tests/src/fold.ts`, for an
engine without the protocol or for layout rules tested on their own. It
writes on the html element `data-ds-test-fold` (`vertical` or `horizontal`),
`data-ds-test-posture` (`folded`), `--ds-test-fold-offset` and
`--ds-test-fold-size`, and inline `--ds-inset-safe-top`, `-bottom`, `-start`
and `-end` on the html element and every `[data-style]` element, start and
end by each element's direction. `env()` and the media features do not move,
so a rule that reads only them sees nothing. `applyDuo` uses it by itself
when the browser is not Chromium. The attribute and variable names are mine;
DU3's gallery only fold attribute should use the same names, or the lead
picks one and I align.

## Profiles and flags

Eleven profiles, from the plan's facts table, on the iPhone 15 Pro descriptor
(user agent, touch, mobile), device scale factor 3:

| Name | Size | Safe area top, right, bottom, left | Fold, posture | Source |
| --- | --- | --- | --- | --- |
| `duo-outer-portrait-safari` (`duo-outer`) | 382 by 580 | 0 | none | S8 |
| `duo-outer-landscape-safari` | 594 by 368 | 0 | none | S8 |
| `duo-inner-portrait-safari` (`duo-inner`) | 669 by 867 | 0 | none | S8 |
| `duo-inner-landscape-safari` | 951 by 585 | 0 | none | S8 |
| `duo-inner-split-safari` | 385 by 571 | 0 | none | S8 |
| `duo-outer-portrait-full` | 466 by 678 | 0, 84, 0, 0 | none | K, S1 |
| `duo-outer-landscape-full` | 678 by 466 | 0, 84, 0, 0 | none | K, S1 |
| `duo-inner-portrait-full` | 669 by 951 | 84, 0, 95, 0 | none | K |
| `duo-inner-landscape-full` | 951 by 669 | 0, 84, 0, 0 | none | K |
| `duo-inner-portrait-folded` | 669 by 951 | 84, 0, 95, 0 | band 40 at 455, across; folded | K |
| `duo-inner-landscape-folded` (`duo-folded`) | 951 by 669 | 0, 84, 0, 0 | band 40 at 455, down; folded | K |

Flags:

- `npm run contract -- ... --device <name>[,<name>]` or `--device duo` for
  all. One Playwright project per profile. Report name gets the profile, or
  `duo` for several.
- `npm run shots -- ... --device <one name> [--platform ios]`. Output in
  `docs/reports/shots/matrix/<framework>-<device>/` and the work folder of the
  same name; the base matrix is not touched. Shots stay at scale 1.

With `--device`, the contract suite's `open()` applies the profile after each
load and fails when a value did not take effect, and `src/duo.spec.ts` adds the
profile check on the gallery page, reflow at the profile's size (every style,
en ltr and ar rtl; 382 by 580 with `duo-outer`), and these skipped tests for
DU2: TabBar side column at the inline end, TabBar bottom capsule on the
portrait and split Safari sizes, TabBar column items 48 by 48 clear of the
inset, Navbar actions in the column, PageShell content and scroll padding at
the inline end, Sheet 8 in from the edges. Each title ends "(DU2 switches
this on)". Without `--device`, `duo.spec.ts` defines no test.

## Proof

- `npx vitest run packages/contract-tests/src/fold.test.ts`: 22 passed.
- `npm run contract -- --framework react --platform ios --component TabBar`:
  43 passed, the same tests as before (no Duo test without the flag).
- `npm run contract -- --framework react --platform ios --component TabBar
  --device duo-outer,duo-outer-portrait-full,duo-inner-landscape-folded`:
  156 passed, 9 skipped (the DU2 tests).
- `npm run shots -- --component TabBar --style liquid --scheme light --device
  duo-inner-landscape-folded --platform ios` into a scratch folder: 2 shots,
  951 wide, stable.

## Not done

- `npm run record -- --device` and `packs/DU.json` (plan DU4): the lead's
  brief named contract and shots; the record harness still knows only
  `pixel` and `iphone`.
- The 256 tall reflow check for the side column in landscape (plan section 7)
  waits for DU2's column.

## Human gate: what a real device check must still cover

Nothing in this table can be proven in Chromium. It needs a real iPhone Duo,
a Mac with the vendor's device simulator, or a device cloud (owner decision 5).

| What | Why emulation cannot answer it | What to record on the device |
| --- | --- | --- |
| Safe area values in Safari, each screen and orientation | Not published; the Safari profiles use 0 and the full screen ones the kit's guides | `env(safe-area-inset-*)` with and without `viewport-fit=cover`, outer and inner, portrait and both landscapes |
| Safari page sizes | From WebKit's post (S8); toolbars hidden and shown change the height | `innerWidth`, `innerHeight`, `visualViewport` sizes in each pose, both toolbar states |
| Page sizes while partly folded | Not published | The same readings with the device partly folded |
| `devicePixelRatio` on the inner screen | Expected 3, unverified | `devicePixelRatio` on both screens |
| Whether Safari ever lets the page reach its side column | WebKit says it may change | A page with `viewport-fit=cover` and a coloured edge: where the colour ends |
| Feature flags off (the default) | Chromium always has the APIs | `device-posture`, `horizontal-viewport-segments`, `env(viewport-segment-*)`, `navigator.devicePosture`, `window.viewport` all absent or single segment |
| Feature flags on (`DevicePostureEnabled`, `ViewportSegmentsEnabled`) | The emulated fold is Chromium's model of a display feature | Segment rectangles, band size (kit says 40), offset, and what changes while turning |
| The fold while turning | Emulation is a fixed state | Posture and segment change events, no layout jump that animates layout |
| Which side the column takes in the second landscape | The kit draws only one | Camera top left: column left or right |
| Arabic: column side on the web | No source for web pages | Same page in `dir=rtl` |
| Touch on the column and near the fold | Emulated touch is exact | Hit targets of 48 at the edge and next to the band |
| Home Screen web apps | No source | Standalone page sizes and insets on both screens |
| User agent | Only a simulator report | `navigator.userAgent`, that `auto` still gives `ios` |
| WebKit layout with no overrides | Playwright WebKit is not installed here | The gallery Duo screens in Safari with the flags off |
