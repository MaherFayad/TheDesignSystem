# R0.11 Platform detection in the docs site

Status: built, waiting on the owner (device check on real phones).

Contract: `docs/contracts/frameworks.md`, "Platform axis", with lead
decisions 12 and 13. Follows R0.10: the same resolver
(`packages/shared/src/platform.ts`), the URL key `platform` and the storage
key `ds-platform`.

## Files changed

All under `apps/docs/`.

- `src/lib/platform.ts` (new): reads the source of
  `packages/shared/src/platform.ts` at build time (`?raw`), strips its types
  with TypeScript's `transpileModule` and inlines it in the head script, so
  the docs run the shared resolver itself and have no second one. The build
  fails if the shared file gains a runtime import or drops an export the
  script uses. Also the switch items and the CSS that shows the current value.
- `src/components/Layout.astro`: the head script stamps `data-platform`
  (URL key, else stored choice, else device, else web), plus
  `data-platform-detected`, `data-platform-choice` and `data-platform-source`
  on `<html>` before the first paint; the built HTML keeps `data-platform="web"`.
  New Platform switch in the top bar. The site style switch is now compact
  (icon only below 720px). The old `ds-docs-platform` reading is gone.
- `src/components/Menu.astro`: an item may carry `details`, label variants
  CSS picks from an attribute on `<html>` (the auto item reads "Auto: iOS").
- `src/components/ComponentPage.astro`: the Platform switch of the preview
  settings offers auto, web, ios, android and macos and is the same setting
  as the top bar.
- `public/docs.js`: picking a platform stores it under `ds-platform` (auto
  removes the key) and drops `platform` from the address; re-resolves with
  the shared resolver left on `window.dsPlatform`; every preview iframe gets
  the resolved value; gallery links carry `platform` only for an explicit
  choice (on auto they name none, so the gallery detects the device of
  whoever opens them); another tab's change is followed; the old
  `ds-docs-platform` key is removed; announcements and type ahead read only
  the visible label variant.
- `src/styles/docs.css`: the top bar on touch platforms (see "Decisions").
- `src/lib/i18n.ts`: `platform`, `auto`, `macos` labels; the preview note
  now says previews follow the platform too.
- `src/content/docs/platforms.md`, `src/content/docs/ar/platforms.md`: the
  axis table matches the contract (macos, auto) and a short "On this site"
  section.
- `scripts/proof/platform.mjs`, `scripts/proof/bar-widths.mjs` (new): the
  probes behind this report.

## Acceptance

Evidence in `docs/reports/reset/R0.11/`: `probe.json` (profiles and
overrides), `probe-axe.json`, `bar-widths.json`, and `topbar-<phone>-<lang>.png`
with `-menu` variants for iPhone 15 and Pixel 7 in English and Arabic.
Measured against the bundled site (docs plus gallery under `/gallery/`),
Chromium with Playwright device descriptors (WebKit is not installed).

### The top bar shows the detected platform and an override: pass

The Platform switch reads "Auto: iOS" on an iPhone, "Auto: Android" on a
Pixel, "Auto: Web" on a desktop (1440px and up). Below 1440px the button shows
only the platform in use ("iOS"); "Auto:" stays in its accessible name and in
the open menu, where the auto item reads "Auto: iOS" checked, followed by
Web, iOS, Android and macOS. See `topbar-iphone-en.png`,
`topbar-pixel-en-menu.png`, `topbar-iphone-ar-menu.png` ("تلقائي: iOS").

### Detection, no query, nothing stored (`/components/switch/`): pass

| Profile | Client hints | maxTouchPoints | `<html>` | Stamped when `<body>` parsed | Preview iframe | Top bar shift |
| --- | --- | --- | --- | --- | --- | --- |
| iPhone 15 | iOS | 1 | ios | ios | ios | 0 |
| iPhone SE | iOS | 1 | ios | ios | ios | 0 |
| Pixel 7 | Android | 1 | android | android | android | 0 |
| Galaxy S9+ | Android | 1 | android | android | android | 0 |
| iPad Pro 11 | iOS | 1 | ios | ios | ios | 0 |
| iPad desktop mode (Mac agent, 5 touch points, no hints) | none | 5 | ios | ios | ios | 0 |
| Desktop Chrome | Windows | 0 | web | web | web | 0 |
| Desktop Safari | macOS | 0 | web | web | web | 0 |
| Default headless Chromium | Linux | 0 | web | web | web | 0 |

"Stamped when `<body>` parsed": a mutation observer installed before any page
script recorded `data-platform` at the moment `<body>` was inserted, so before
any content could paint. No later change of `data-platform` on any profile
(no flash of web on a phone). The platform button kept the same box from load
to settle, and no layout shift entry had a source inside the top bar. No
console error or warning, no horizontal scroll on any profile.

The acceptance line "Playwright with the iPhone descriptor shows
`data-platform="ios"` inside a preview with no query": the iframe's Theme
element holds `ios` (its src carries `platform=ios`, the resolved value).

### The choice is kept across pages and passed to every preview: pass

On iPhone 15 and Pixel 7 (each row also checks the preview iframe):

| Step | Result |
| --- | --- |
| `?platform=web` | web from the URL, button "Web", frame web |
| `?platform=macos` | macos from the URL, frame macos |
| `?platform=windows`, `?platform=auto` | ignored, device decides |
| Pick android (iPhone) or ios (Pixel) in the top bar | stored `ds-platform`, html and frame follow at once, "Open in gallery" carries it |
| Next page, `/components/button/` | stored choice, frame follows |
| Arabic page `/ar/components/button/` | stored choice kept |
| `?platform=web` over the stored choice | web from the URL |
| Pick macos on a keyed page | stored macos, `platform` removed from the address |
| Pick Auto | key removed, frame back to the device, gallery links name no platform |
| Next page | device again |
| Preview settings Platform switch | the same setting: the top bar follows |

Desktop Safari with `?platform=macos`: macos stamped, detected web, frame
macos. `auto` never gives macos.

### Axe on the sample pages in four styles: pass with one finding not from this order

Pages `/`, `/components/switch/` (also with the Platform menu open),
`/platforms/`, `/ar/components/switch/`; Neutral, Desk, Liquid, Studio;
light and dark; iPhone 15 (ios stamped) and Desktop Chrome (web). 80 runs,
79 clean. The one finding: Desk dark, iPhone, `/ar/components/switch/`,
`color-contrast` on one inactive code tab label (4.24:1). Rerun alone it
moves between tabs and reproduces with `?platform=web` (3.98:1, background
#424242): the label sits under the sticky Desk dark glass bar when axe
scrolls it there, and axe reads the bar as its background. It is not caused
by the platform; it belongs with ruling 18 (Desk dark glass rechecked, R1).

### Top bar at every width: pass

`bar-widths.json`: 96 cases, web, ios, android and macos at 320, 360, 393,
480, 600, 720, 834, 1024, 1180, 1280, 1366 and 1440px, English and Arabic.
No overlap of the bar's parts, nothing outside the viewport, no horizontal
scroll.

## Decisions made

- The head script runs the shared resolver inlined at build time, not a copy.
  It leaves it on `window.dsPlatform` for `docs.js`.
- The docs chrome itself takes the resolved platform (it is stamped on
  `<html>`, as the order text asks), so on a phone the bar draws the
  platform's 44pt or 48dp targets. To fit, on ios and android only: the
  search button becomes a square of the platform target below 720px, the
  brand name and the version badge give way (mark only) below 720 and 1024px
  respectively, and the compact switches keep only their icon below 1024px.
  On every platform: below 480px the brand name gives way and the style
  switch moves to the sidebar (it was already there at that width); below
  360px the bar gaps tighten (the 16px gutter stays); below 1024px the search
  button shrinks before the brand does. Web at 480px and up is unchanged
  apart from the new switch and the icon only style switch below 720px.
- The button of the Platform switch has a fixed width (all values stacked in
  one cell, as the other switches), so a change never moves the bar.
- A pick in a switcher stores the choice and removes `platform` from the
  address, so the pick takes effect on that page; Auto clears the key.
- Preview iframes get the resolved value explicitly (works when the gallery
  is on another origin); shareable gallery links carry only an explicit
  choice.
- The old preview key `ds-docs-platform` is removed, not migrated: it held a
  preview setting that defaulted to web, and carrying it over would switch
  off detection on phones.
- Arabic label for auto: "تلقائي".

## npm run check

| Step | Result |
| --- | --- |
| tokens build, gen, typecheck, eslint, manifests | pass |
| vitest | 750 of 753 in the full run. `PhoneField.test.tsx` timed out at 5.5s under load and passes alone (20 of 20). The other two are the Angular specs below. |
| check @the-system/angular | failed in the full run on `slider.motion.spec.ts` (2) and `dropdown-menu.round3.spec.ts` (1); both files pass alone (17 of 17). Timing specs on a loaded machine, not in this order's files. |
| docs, native, gallery-angular, gallery-native, consumer-next, consumer-vite | pass |

The machine ran other lanes' checks at the same time (load average above 20).

## Needs a real phone (device check)

Once the lead deploys the preview, on each phone with nothing stored:

1. iPhone, Safari: open `<preview>/components/switch/`. The bar shows "iOS";
   open the Platform menu: "Auto: iOS" is checked. The Switch preview draws
   the iOS switch. No flash of the web look while loading.
2. iPad, Safari in its default desktop mode: same page, "Auto: iOS".
3. Android phone, Chrome: "Android", menu "Auto: Android". Also with
   "Desktop site" on.
4. Pick Web in the menu, open another page: still Web. Pick Auto: back to the
   device.
5. Open `?platform=macos`: macOS for that page only.

What only a phone proves: real Safari (no client hints, WebKit layout of the
bar), the iPadOS desktop mode agent and touch count, Chrome's client hints in
desktop site mode, the first paint on a slow phone, and the bar under safe
areas (R4.3).
