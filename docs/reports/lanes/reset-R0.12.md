# R0.12 Platform detection in Angular

Order: `docs/plan/reset.md`, section 4, R0.12. Lane: ds-angular. Depends on
R0.10 and its review. Status: built, waiting on the owner (the same device
check as R0.10, HUMAN GATE).

Contract: `docs/contracts/frameworks.md`, "Platform axis", with lead
decisions 12 (a root theme with no `platform` is `auto`) and 13 (the
`ds-platform` storage key).

## Files changed

- `packages/angular/src/theme/theme.ts`:
  - New `DsDevicePlatform` (root service): the platform `auto` resolves to
    on this device, as a signal. Under server rendering
    (`isPlatformServer`) it is `web` and `navigator` is never read. In the
    browser it reads `navigator` once, through the shared `detectPlatform`
    and `deviceOf`, when the first `dsTheme` asks for it, never at module
    scope.
  - `dsTheme`'s `platform` input takes `PlatformInput` (`auto` included).
    `value` passes the device to the shared `resolveTheme` as
    `{ platform: device }`, the same call as React's Theme, so: a value
    wins; `auto` asks the device at any depth; no input takes the parent's
    value; the outermost `dsTheme` with none is `auto`. `auto` is never
    stamped.
- `packages/angular/src/theme/resolve.ts`: re-exports the shared platform
  names (`detectPlatform`, `deviceOf`, `resolvePlatform`, `platformInputOf`,
  `platformChoice`, `isPlatform`, `platforms`, `PLATFORM_QUERY_KEY`,
  `PLATFORM_STORAGE_KEY`, and the types `DeviceInfo`, `PlatformSources`,
  `ThemeRootDefaults`), as React's `resolve.ts` does. `applyDocumentTheme`
  takes `ThemeInput` and an optional third argument, the root defaults, so
  `<html>` gets the same detected value.
- `packages/angular/src/theme/types.ts`: exports `PlatformInput` and
  `ThemeInput`.
- `packages/angular/src/theme/theme.spec.ts`: 6 new tests (below).
- `apps/gallery-angular/src/app/axes.ts`: platform values from `platforms`
  (`macos` added); `readStoredPlatform`, `storePlatform`, `readPlatform`,
  `platformNote`, the same as the React gallery's, on the shared
  `platformInputOf` and `platformChoice` and the shared keys.
- `apps/gallery-angular/src/app/app.ts`: the root `dsTheme` gets the URL
  key, then the stored choice, then `auto`; `<html>` is stamped with the
  same resolved value; the bar shows "Auto: <detected>" in the Platform
  select, selects a stored choice, stores a choice made there (Auto clears
  it), and has the same `output[data-gallery="platform-detected"]` line as
  React ("Detected ios", or "Detected ios, showing web from the address").

No second resolver: every decision goes through
`packages/shared/src/platform.ts` and `resolveTheme` in
`packages/shared/src/theme.ts`.

## Acceptance

Evidence: `docs/reports/reset/R0.12/` (`probe.mjs`, `probe-output.txt`,
`devices.json`, `iphone-switch-travel.webm`, `iphone-switch.png`).

### dsTheme takes `platform="auto"` through the shared resolver (unit, `theme.spec.ts`)

| Test | Result |
| --- | --- |
| Root with no platform on an iPhone agent stamps `ios`; a child with none inherits `ios`; a nested `auto` gives `ios`; a nested `web` gives `web` | pass |
| `auto` on an Android agent stamps `android`; no element carries `data-platform="auto"` | pass |
| An explicit `web` or `macos` wins over the iPhone device and children inherit it; a nested `auto` under `web` still asks the device (`ios`) | pass |
| A Mac Safari agent resolves `auto` to `web`, never `macos` | pass |
| Server rendering (`PLATFORM_ID` server) with an iPhone agent: the device is `web`, `navigator.userAgent` is never read, root and nested `auto` stamp `web` | pass |
| `applyDocumentTheme` takes the device as the root default (`auto` and no input follow it, `web` wins) | pass |

The R0.10 resolver fixtures (iPhone Safari, iPad in desktop mode, Android
Chrome, Mac Safari, Mac Chrome, Windows Chrome, Linux Firefox and the rest)
live in `packages/shared/src/platform.test.ts` and run in `vitest`; Angular
calls the same functions.

### The R0.10 device descriptor tests against the Angular gallery

`node docs/reports/reset/R0.12/probe.mjs <angular gallery url> <out>`, the
R0.10 probe unchanged apart from its header and one filter (below), on
`/c/switch`, desktop Chromium engine. Every profile passed every check.

| Profile | No query | `<html>` | Client hints | maxTouchPoints | Checks |
| --- | --- | --- | --- | --- | --- |
| iPhone 15 descriptor | ios | ios | iOS | 1 | all pass |
| iPhone SE descriptor | ios | ios | iOS | 1 | all pass |
| Pixel 7 descriptor | android | android | Android | 1 | all pass |
| Galaxy S9+ descriptor | android | android | Android | 1 | all pass |
| iPad Pro 11 descriptor | ios | ios | iOS | 1 | all pass |
| iPad desktop mode as iPadOS Safari reports it (Mac agent, 5 touch points, no hints) | ios | ios | none | 5 | all pass |
| Mac Safari agent with touch, raw Chromium emulation | web | web | macOS | 1 | all pass |
| Desktop Chrome descriptor | web | web | Windows | 0 | all pass |
| Desktop Safari descriptor | web | web | macOS | 0 | all pass |
| Default headless Chromium | web | web | Linux | 0 | all pass |

The checks on every profile: `?platform=web`, `macos`, `android` and `ios`
each stamp that value; `?platform=windows` and `?platform=auto` fall
through to the device; picking android in the bar stores
`ds-platform=android` and a load with no query then stamps android with
source `stored` ("Detected ios, showing android from your choice");
`?platform=web` wins over the stored choice ("showing web from the
address"); picking Auto removes the key and the next load returns to the
device; the Platform options read "Auto: <device>", web, ios, android,
macos.

The one filter: the "clean" check (no console error or warning) leaves out
NG0912, a dev mode warning that the Angular dev server prints 60 times per
profile because two interaction stages are defined twice
(`ds-stage-radio-pop` and others, in both
`apps/gallery-angular/src/app/interactions/toggles.ts` and `selection.ts`).
It does not come from the platform code. No other console error or warning
was seen on any profile.

Recording, iPhone 15 frame (`iphone-switch-travel.webm`), Liquid light,
`/c/switch?chrome=0`, stamped `ios`: thumb travel 17.4px on each tap (on
and back), as React's 17.4px against the 17px of `motion` cause k. The same
switch in desktop Chromium resolves to `web` and travels 4px.

### Angular contract run

`npm run contract -- --framework angular` against the Angular gallery with
this change: 3987 passed, 24 failed, 76 skipped (1.1h, load average 26 to
28 on 4 cores; a first attempt died when the disk filled up and is not
counted). The shared `docs/reports/contract-angular.json` was put back as it
was, so this run does not change it.

The failing components, each rerun alone with
`--component DropdownMenu,ErrorState,Field,FilterBar,Input,OTPField,PasswordField`:

| Component | Full run | Alone | Cause |
| --- | --- | --- | --- |
| DropdownMenu | 3 axe failures, Desk dark | 87 pass | load |
| ErrorState | 2 axe failures, Desk | 67 pass | load |
| Field | target size, Liquid compact | 67 pass | load |
| FilterBar | axe open, Desk light | 67 pass, 20 skipped | load |
| Input | axe, Desk dark rtl | 67 pass | load |
| PasswordField | 320px reflow, 2 cases | 67 pass | load |
| OTPField | 320px reflow, 14 cases on `ios` and `android` | 53 pass, the same 14 fail | shared CSS, see below |

OTPField: "no sideways scroll at 320px" fails on `platform=ios` and
`platform=android` in every style, and React fails the same 14 cases
(`npm run contract -- --framework react --component OTPField`: 53 passed, 14
failed). The contract test sets the platform through the URL key, which the
Angular gallery already read before this order, so the failure is in the
shared CSS or the platform tokens (six cells wider than 320px with the
phone sizes), not in the Angular port. Owner: the platform token and style
lanes (R0.13, R0.14) or the OTPField owner; not fixed here.

`npm run contract -- --framework angular --component ToggleGroup`: 67
passed (R0.4).

### npm run check

Full run after both orders, alone on the machine for the Angular steps:
every step passed.

| Step | Result |
| --- | --- |
| tokens build, gen, typecheck, eslint, manifests | pass |
| vitest | pass, 209 files, 2733 tests |
| check @the-system/angular | pass, 111 files, 753 tests (the `tag-field.spec.ts` "Enter adds the typed text" test passed) |
| check native, docs, gallery-angular, gallery-native, consumer-next, consumer-vite | pass |

## Decisions made

- Under server rendering the device is `web`. In the browser the device
  signal is filled once when the first `dsTheme` is created, so a client
  only render (the gallery) paints the detected value in its first frame,
  as React's client only render does. A hydrated page keeps the server's
  nodes and its first client change detection stamps the detected value
  once: Angular hydration matches nodes, not attribute values, so there is
  no mismatch and no extra pass is needed. The navigator is never read at
  module scope.
- The shell header carries its own `dsTheme`, so the shell's input for the
  detection state is named `detection`, not `platform` (a `platform`
  binding would reach the header's `dsTheme`).
- As in React, a nested `dsTheme` with `platform="auto"` asks the device
  again, even under a parent with an explicit value.
- `applyDocumentTheme` gained a third, optional argument (root defaults)
  rather than reading the device itself, so it stays pure and safe on a
  server.

## Open and not done

- OTPField overflows 320px on `ios` and `android`, in React and Angular
  alike (above). Shared CSS or tokens; not in this order's files.
- The NG0912 warnings above: two stage components defined twice in the
  gallery's interactions folder. Outside this order's change; not fixed.
- WebKit is not installed, so the iPhone and iPad profiles run in Chromium
  with the descriptor's agent, as in R0.10.
- The device check on real phones (HUMAN GATE): the R0.10 script, on the
  Angular preview, `/c/switch`.
