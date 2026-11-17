# iPhone Duo orders (owner, 2026-11-17)

The owner asked: "and support and designs for iphone duo also don't forget
it". iPhone Duo is the vendor's folding iPhone, announced in September 2026.
This file is the research, the model choice and the work orders. Nothing in
it is built yet, and every look it leads to is proposed until the owner
signs it on a phone.

Binding: `DECISIONS.md` sections "Platform looks on the web follow each
vendor's web language", "The iOS glass switch: Liquid and Neutral" and
ruling 16 (style wins on controls, platform wins on sheets, bars and
alerts); `docs/plan/reset-mobile.md` (M1 to M6), whose iOS phone layer this
builds on; `docs/reports/lanes/reset-M1.md` for the iPhone measurements.

Method, as in `reset-mobile.md`: pictures first. Every part is accepted with
a reference capture beside ours at the same size. References for this file
are the vendor's iOS and iPadOS 27 community kit in Figma (file key
`Cltzs6FZW3N5yiC1x1cpQJ`) and the vendor's published pages linked below. The
kit's licence allows no copying, extracting or redistributing: we observe
proportions and behaviour, keep captures in scratch outside the repo, and
copy no asset, glyph, text, layer name or image into the repo. Our device
frames are our own drawings. No vendor marks, no vendor fonts, no vendor
symbols, Lucide icons stay, the style id stays `liquid`.

## 1. Sources

Primary sources (the vendor, WebKit, MDN data, the Chrome protocol):

| Key | Source |
| --- | --- |
| S1 | Tech specs: https://www.apple.com/iphone-duo/specs/ |
| S2 | Newsroom, launch: https://www.apple.com/newsroom/2026/09/apple-unveils-iphone-duo/ |
| S3 | HIG, Designing for iPhone Duo (new page, 9 September 2026): https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo (text read from https://developer.apple.com/tutorials/data/design/human-interface-guidelines/designing-for-iphone-duo.md) |
| S4 | Developer overview, Preparing your app for iPhone Duo: https://developer.apple.com/documentation/technologyoverviews/preparing-your-app-for-iphone-duo (text read from https://developer.apple.com/tutorials/data/documentation/TechnologyOverviews/preparing-your-app-for-iphone-duo.md) |
| S5 | Tech talk, Prepare your app for iPhone Duo: https://developer.apple.com/videos/play/tech-talks/111461/ |
| S6 | Tech talk, Design for iPhone Duo: https://developer.apple.com/videos/play/tech-talks/111466/ |
| S7 | App Store Connect screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications |
| S8 | WebKit, WebKit Features for Safari 27.1 (23 October 2026): https://webkit.org/blog/18486/webkit-features-for-safari-27-1/ |
| S9 | MDN browser compat data, media features: https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/media.json ; env(): https://github.com/mdn/browser-compat-data/blob/main/css/types/env.json ; DevicePosture: https://github.com/mdn/browser-compat-data/blob/main/api/DevicePosture.json |
| S10 | MDN, device-posture: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/device-posture ; horizontal-viewport-segments: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/horizontal-viewport-segments |
| S11 | Chrome DevTools Protocol, Emulation domain (source JSON): https://github.com/ChromeDevTools/devtools-protocol/blob/master/json/browser_protocol.json |
| K | The kit in Figma, file `Cltzs6FZW3N5yiC1x1cpQJ`: Layout Guides `12892:60611`, Product Bezels `507:24672`, Examples `0:3329` (the device's section `12886:17523`), Tab Bars `507:24689`, Toolbars `507:25993`, Sheets `507:24684`, Sidebars `507:26013`. Read with metadata and screenshots only. |

Secondary sources (used only where marked unverified):

| Key | Source |
| --- | --- |
| T1 | https://blakecrosley.com/blog/iphone-duo-for-developers (points, scale and the SDK timeline; cites S1, S5, S7) |
| T2 | https://ppc.land/safari-27-1-on-iphone-duo-runs-web-pages-from-382-to-951-pixels-wide/ |
| T3 | https://9to5mac.com/2026/10/23/apple-exploring-fix-for-safaris-cramped-layout-on-the-iphone-duos-outer-display/ |
| T4 | https://www.testmuai.com/blog/iphone-duo-real-device-cloud/ (user agent from a simulator) |

Marks used below: **V** verified by a primary source (named), **K** seen in
the kit only, **U** unverified.

## 2. Facts

| Fact | Value | Source | Mark |
| --- | --- | --- | --- |
| Outer display | 5.4 inch OLED, 1398 by 2034 pixels at 460 ppi | S1 | V |
| Inner display | 7.6 inch folding OLED, 1878 by 2670 pixels at 430 ppi, under display front camera | S1 | V |
| Outer screen in points | 466 by 678 portrait, 678 by 466 landscape; exactly 1398 by 2034 at 3x | K, S1 arithmetic, S7 (screenshot 1398 by 2034) | V |
| Inner screen in points | 669 by 951 portrait, 951 by 669 landscape | K; S8 gives inner page widths of 669 and 951 CSS px | V |
| Why 1878 by 2670 is not a whole scale | The inner screen renders at 3x, 2007 by 2853 pixels (the App Store screenshot size, S7), and that image is scaled down by about 0.936 to the 1878 by 2670 panel, so one point is about 2.81 panel pixels. Layout uses points: 669 by 951. Never lay out from 1878 or 2670. | S7, S8 (669 and 951 CSS px); the downscale itself is arithmetic, also in T1 | V for the 3x render size and the CSS widths; U for `devicePixelRatio` on the device (expected 3) |
| Aspect ratio | Outer 0.687, inner 0.703. The newsroom says both share the same aspect ratio; they are close, not equal. | S2, S1 arithmetic | V |
| Size open and closed | Open 164.6 by 117.8 mm, 5.2 mm thick; closed 84.1 by 117.8 mm, 11.3 mm | S1 | V |
| Postures | Closed (outer screen), fully open (inner), partly folded like a book or a laptop, propped, standing on an edge (six poses in an illustration) | S3, S4 | V |
| Size classes | Compact width on the outer screen, regular width on the inner screen | S3 | V |
| Bars on the side | On the outer screen, and on the inner screen in landscape, toolbars, tab bars and navigation controls move to a vertical column on the side, with the camera cut out and status area at its top. Inner portrait keeps horizontal bars. | S3, S4, S6, K | V |
| Order in the column | Back or close at the top, then prominent actions, then the other toolbar groups; items from a top bar go to the top, from a bottom bar to the bottom; the tab bar sits at the bottom of the column; overflow collapses items into one menu, bottom first | S3, S6 | V |
| Column side | Aligned with the hardware: same position relative to the outer camera. It can be on the left in landscape and in Split View (each app puts controls on its outer edge). | S3, S5 | V |
| Right to left | The column stays on the same side in right to left languages (it does not mirror) | S3 | V for native apps; U for web pages (no source) |
| Safe areas | Often asymmetric; vertical bars give leading and trailing insets, horizontal bars top and bottom insets; never assume opposite sides are equal | S5, S3 | V |
| Reserved regions | Three kinds named in the docs: the outer camera (always present), the inner camera (only while active), the folding region (only when partly folded). Kinds in the API: division (the fold) and occlusion (a camera). | S3, S4 | V |
| Fold band size | A band 40 points wide across the middle of the inner screen (455.5 to 495.5 on the 951 axis) | K (Layout Guides, folded variants) | K |
| Fold behaviour | Content moves away from the centre while partly folded; buttons move aside; in portrait, interactive elements move to the bottom half; scrollable content does not need to avoid the band; sheets slide over so they do not rest in the fold; alerts, menus and toolbar buttons avoid it too | S6, S3 | V |
| Kit column metrics | Column 84 wide; buttons 48 by 48 with 12 to the column edges; a vertical button group 48 wide; the tab bar a vertical capsule 48 wide, about 50 per tab; search a separate 48 circle below it; minimized tab bar is one 48 button | K (Tab Bars `12887:20935`, Toolbars `12883:6008`, Layout Guides) | K |
| Kit top bar | 84 tall, buttons 48 tall at 24 from the top, title at 20 from the leading edge; status area sits in the same row at the trailing end on inner portrait; on the device bars use the 48 point button set, not the 44 point iPhone set | K (Toolbars) | K |
| Kit margins | Layout margin 20 on the screen, 16 inside sheets | K | K |
| Kit sheets | Inset 8 from the screen edges; small detent is an 80 tall bar with close and done; medium about 356 tall; large below the top bar; full screen | K (Examples, sheets frame `12886:17616`) | K |
| Safari page sizes, CSS px (width, small and large viewport height) | Outer portrait 382, 580, 618. Outer landscape 594, 368, 406. Inner portrait 669, 867, 902. Inner landscape 951, 585, 620. Inner, two windows side by side 385, 571, 609. Partly folded: not published. | S8 | V |
| Safari chrome | Outer screen: Safari's tab bar at the bottom, and iOS puts controls in a column on the right in portrait; web content does not extend behind that column; Safari fills it with the page's background colour. Inner screen: Safari's tab bar at the top, like iPad. Note 466 minus 382 and 678 minus 594 are both 84, the kit's column width. | S8 | V |
| Older apps | Built with Xcode 26 or older: the app keeps clear of the status bar and camera (outer) and runs at a familiar size and aspect on the inner screen. With the iOS 27 SDK: extends to the left of the status area on the inner screen. With the iOS 27.1 SDK: extends to the screen edge and bar buttons lay out vertically under the status area. | S4, S5 | V |
| 27.1 APIs | Reserved regions (`ReservedRegion`, `reservedRegions(kind:options:)`), arrangement views (`ArrangementView`, `UIArrangementViewController`), vertical bar controls (`toolbarVerticalBehavior`, `preferredVerticalBarBehavior`, `toolbarVerticalEdge`, `verticalBarEdge`, `axisBehavior`, `visibilityPriority`), sheet placement (`presentationPlacement`, `preferredPlacement`) | S3, S4 | V (names); U for the hinge angle API named in secondary posts |
| Date the 27.1 SDK shipped | Xcode 27.1 beta 18 September, release 15 October 2026 | T1 | U |

### 2.1 What the kit shows per screen (K, verify on the device)

| Screen | Bars | Safe areas and regions (points) |
| --- | --- | --- |
| Outer portrait, 466 by 678 | Column at the trailing (right) edge: camera, status, a vertical action group, gap, vertical tab bar, search | Trailing inset 84 full height; camera region 84 by 169 at the top of the column; leading margin 20 |
| Outer landscape, 678 by 466 | Column at the right: overflow button at the top, tab bar, search; camera at the bottom right; status hidden in the guide frame | Trailing inset 84; the bezel page draws the other landscape, camera top left: which side the column takes there is not shown (open question 4) |
| Inner portrait, 669 by 951 | Top bar 84 (back, title, action group, status at the trailing end); floating tab bar centred at the bottom with labels, search beside it | Top 84, bottom 95, margins 20 each side, reserved region 134 by 84 at the top right |
| Inner landscape, 951 by 669 | Column at the right as on the outer screen; a title row at the top of the content | Trailing inset 84; region 84 by 119 at the top of the column |
| Inner, partly folded, both orientations | Same bars as unfolded | Plus the 40 point band across the fold |

The lead's notes, checked against the kit:

- Right: the four screen sizes, the folded and sheet variants, the column
  on outer portrait, outer landscape and inner landscape, the top bar and
  bottom tab bar on inner portrait, the fold band, the three overlay kinds.
- Partly wrong: on the outer screen a sheet does not leave the column
  showing. The sheet spans the full width, 8 in from the edges, over the
  column area, and carries its own small column (close at the top, then
  share). Only the camera and status stay visible above it. A full screen
  sheet stops just short of the camera (S6).
- Partly wrong: the status area is not at the top of the column in outer
  landscape; the camera is at the bottom of the column there.
- Right with one addition: on the inner landscape screen the medium and
  large sheets are a centred floating card (653 wide, 8 from the bottom).
  When partly folded the card moves to the leading half (468 wide). In the
  kit that card ends about 20 points inside the fold band; trust S6 ("slide
  over to avoid resting in the fold") over the frame.
- Added: the small detent is a floating bar, centred, 80 tall; alerts sit
  centred in the content area beside the column, and in the leading half
  when folded.
- Added: inside sheets on the inner screen the bars are horizontal (S6); on
  the outer screen they are vertical by default (S4).

## 3. What a web page in Safari can know

| Feature | State in Safari on iOS 27.1 | Source | Mark | Use in the system |
| --- | --- | --- | --- | --- |
| Width and height media queries, container queries | Shipped. The page sees the sizes in section 2. | S8, S9 | V | The dependable base. Every layout rule here starts from size. |
| `env(safe-area-inset-*)` | Shipped since Safari 11; on this device no published values per screen or orientation. Safari does not extend the page behind the side column, so the column is outside the viewport, not an inset. | S9, S8 | V that it exists; U for values | Keep reading it through `inset.safe.*`; never assume start equals end. |
| `viewport-fit=cover` | Exists, but in Safari 27.1 it does not extend the page behind the side column; WebKit says it is looking for a better way and may change this. | S8, T3 | V | Our pages may set it; nothing may depend on it reaching the column. Plan for a later change: every bar already pads by the insets. |
| `device-posture` media feature, `navigator.devicePosture` | In Safari on iOS 27.1 behind a feature flag (`DevicePostureEnabled`), off by default. Shipped in Chrome 132. Not in Firefox or desktop Safari. | S8, S9, S10 | V | Progressive only. Nothing may need it. |
| `horizontal-viewport-segments`, `vertical-viewport-segments`, `env(viewport-segment-*)`, `window.viewport.segments` | In Safari on iOS 27.1 behind a feature flag (`ViewportSegmentsEnabled`), off by default. Shipped in Chrome 138. | S8, S9, S10 | V | Progressive only: when two segments exist, overlays and split content avoid the fold. With the flag off, a page cannot see the fold at all. |
| User agent and client hints | WebKit says do not sniff. No published string; a simulator report shows a plain iPhone string with nothing that names the foldable. Client hints are not in Safari. | S8, T4 | V for the advice; U for the string | `auto` keeps giving `ios`. We never detect the model and never branch on `screen.width`. |
| Safari's own chrome | Outer: tab bar at the bottom plus the side column; inner: tab bar at the top. | S8 | V | Explains why a page on the outer screen in portrait is 382 wide. |
| Home Screen web apps (standalone) | No source on how they lay out on this device. | none | U | Open question 5; test on the device. |

Plain summary: a page in Safari on the outer screen is a short phone page
(382 by 580) with Safari's column beside it; on the inner screen it is a
tablet page (669 or 951 wide). The fold is invisible to the page unless the
person turns on two feature flags. So the system designs on size first, and
treats posture and segments as an extra.

## 4. How the system models this

Three options. All three keep `data-platform` to the four values and keep
`auto` as it is (`frameworks.md`, "What `auto` detects").

### (a) No new axis: size and posture driven layout inside `ios` (recommended)

The device is an iPhone. Its difference is shape: short and wide screens,
an asymmetric column, a fold. On the web we lay out from what the page can
measure, inside the existing `ios` platform layer.

- A phone shell (PageShell) becomes a size container. `ios.css` places the
  bars by container queries: when the shell is wide and short, the TabBar
  and the Navbar's actions form a column at the inline end; otherwise bars
  stay as M1 drew them (top bar, floating capsule at the bottom).
- A behaviour prop picks the placement: `placement="auto" | "bottom" |
  "side"` on TabBar and Navbar (and PageShell, which passes it down).
  `auto` is CSS only (no JavaScript, so the server render matches). The
  prop stamps `data-placement` only when it is not `auto`.
- Private properties carry the column (`--_ios-rail-size`,
  `--_ios-rail-gap`), composed from existing fixed tokens with `calc()`, the
  way M1 composed the chrome (M1 decision 2). No new token name.
- Safe area: bars pad by `inset.safe.*` on each side on its own. Sheets,
  toasts and floating bars take the insets of the side they touch.
- Fold: progressive rules under `@media (horizontal-viewport-segments: 2)`
  and `(vertical-viewport-segments: 2)` with `env(viewport-segment-*)`, and
  a small pure helper in `packages/shared` that reads
  `window.viewport.segments` for overlays that position with JavaScript.

Costs:

| Area | Cost |
| --- | --- |
| Contracts | `anatomy.md`: the `placement` prop and `data-placement` on TabBar, Navbar and PageShell; PageShell is a size container named `ds-shell`. `frameworks.md`: one paragraph saying the foldable is `ios`, no model detection. `tokens.md`: none (a note that `inset.safe.start` and `end` differ). |
| Tokens | `packages/tokens/src/platform/ios.json`: no change. The 48 point bar buttons use an existing 48 value if one is a fixed token; if none fits, the order reports a token gap and the lead decides. |
| CSS layers | `ds.platform` rules in `ios.css` only; `web`, `android` and `macos` unchanged. Recipes repaint as today. |
| React | The prop, the attribute, tests and manifests for three components. |
| Angular | The same input and host attribute on the same three; the CSS is shared, so no new CSS. |
| React Native | The system tab bar and navigation bar draw the column themselves when the app is built with the 27.1 SDK (S4, S5) through `react-native-screens` and `expo-router`; this is U for those libraries and is the first thing ds-native checks. Our drawn controls read insets from `react-native-safe-area-context`, already allowed, each side on its own. Reserved regions and the hinge have no React Native API in our allow list: an Expo or native module for them is a HUMAN GATE. Drawn chrome (`chrome.drawn`, off by default) would need its own column; not in this plan. |

Trade offs: no new concept; works in every browser; honest about what the
page knows. It cannot reproduce the native column on the outer screen in
portrait in Safari, because Safari already owns that column (section 3).

### (b) A form factor axis beside platform

`data-form="phone" | "fold-outer" | "fold-inner"` stamped by the resolver
beside `data-platform`, with token and CSS blocks per form.

Costs: a new runtime axis in `frameworks.md`, PLAN 3.2 and every Theme and
`dsTheme`; a new resolver step that has nothing to read (no model in the
user agent, no client hints in Safari, posture behind a flag), so it would
have to guess from `screen` sizes, which is the model sniffing WebKit tells
us not to do; per form token files and build changes; parity in Angular and
a theme key in React Native (`themes[style][scheme][platform][form]`). It
breaks the moment the vendor ships a second foldable size.

Trade offs: exact native look per screen, but on a guess. Not recommended.

### (c) A named device preset for the gallery and docs only

Device frames in the gallery and docs that load a screen at the Duo sizes
and, in "full screen" mode, set the column, insets and fold band by gallery
only overrides (an inline override of the `inset.safe` variables on the
frame's Theme element, and the Chrome protocol overrides in tests). Nothing
ships in the packages.

Costs: gallery and harness files only; no contract change beyond the
gallery's own URL keys.

Recommendation: **(a) for the packages plus (c) for the gallery, docs and
tests.** (c) alone shows pictures but ships nothing; (a) alone has no place
to show the device.

## 5. Component behaviour

Screens below are the page sizes Safari gives (section 2), plus the full
screen sizes the gallery frames show for native and for a future
`viewport-fit` change. Light and dark: every rule is geometry; paint stays
with the style and M6's glass, in both schemes, with the solid fallbacks
for reduced transparency, more contrast and forced colours. Contrast is
measured from pixels over the lightest and darkest demo content in both
schemes (1.4.3, 1.4.11).

### 5.1 Placement rule for `auto` (proposal, owner decision 2)

Side column when the shell is at least 440 wide and at most 700 tall
(`@container ds-shell (inline-size >= 27.5rem) and (block-size <= 43.75rem)`),
otherwise bottom. Checked against every size we know:

| Shell | Size | `auto` gives | Native on the device (S3, K) |
| --- | --- | --- | --- |
| Safari, outer portrait | 382 by 580 | bottom | side (Safari's own column is already there) |
| Safari, outer landscape | 594 by 368 | side | side |
| Safari, inner portrait | 669 by 867 | bottom | bottom |
| Safari, inner landscape | 951 by 585 | side | side |
| Safari, split window | 385 by 571 | bottom | side on the window's outer edge |
| Full screen frame, outer portrait | 466 by 678 | side | side |
| Full screen frame, inner portrait | 669 by 951 | bottom | bottom |
| Full screen frame, inner landscape | 951 by 669 | side | side |
| Any iPhone, portrait | 402 by 874 | bottom | bottom |
| Any iPhone, Safari landscape | about 874 by 370 | side | horizontal bars (a change from today; decision 2) |

### 5.2 Per component

| Component | Bottom placement (inner portrait, phone) | Side placement (outer, inner landscape) | Partly folded (only when segments are known) |
| --- | --- | --- | --- |
| TabBar | M1 floating capsule, centred, inset from the edges, labels below icons; on the inner screen it stays content width and centred, not full width (K) | A vertical capsule at the inline end, at the bottom of the column, icons only, 48 square items (K), the current item's lens as in M1; the label becomes the accessible name and a Tooltip on hover or focus; search, when present, a separate round button below; when the column is too short, the tab bar collapses to one button that opens the tabs (HIG "minimize", S3) | Unchanged in landscape (the column is at the edge, away from the fold); in portrait the bar stays in the bottom half |
| Navbar and toolbar | M1: no bar fill, round glass buttons on the title row, large title in the content; on the inner screen the buttons are 48 tall (K) | The title stays at the top of the content; back or close goes to the top of the column, then prominent actions, then the other groups as one vertical capsule; text buttons and segmented controls stay in the top row (S6); overflow from the bottom of the column up into the Toolbar's existing "more" menu | Buttons in the top row move off the band (landscape: they sit in the leading segment's row, or in the column) |
| Sheet and Drawer (bottom) | Outer and phone: M1 sheet from the bottom, 8 in from the edges on this device (K), detents small (a floating 80 tall bar with close and done), medium, large, full. Inner portrait: the same, full width less 8. | Outer: full width less 8, over the column area; the sheet's own close and actions form a small column at its inline end; a full screen sheet stops below the camera region. Inner landscape: a centred card about two thirds of the width (653 of 951 in K), 8 from the bottom; small detent a centred floating bar. Bars inside sheets on the inner screen are horizontal (S6). | Landscape: the card moves into the inline start segment and its width is that segment less the margins; it never crosses the band. Portrait: the sheet stays in the bottom segment. |
| Drawer (side) | Unchanged | Opens from the inline start edge so it never covers the column; never wider than the space beside the column | Never wider than one segment |
| AlertDialog and Dialog | M1 compact card, centred | Centred in the content area beside the column (the column's width is left out of the centring) | Landscape: centred in the inline start segment (K shows the leading half). Portrait: in the bottom segment (S6, interactive elements go to the bottom half). |
| DropdownMenu, ContextMenu, Popover, Tooltip | M1 | Collision padding on the column side equals the column; menus opened from the column open toward the inline start, aligned to the trigger's block position | The fold band is a collision boundary: a menu never straddles it; it flips to the trigger's segment (S6 lists menus among the parts that avoid the fold) |
| List and grouped content | Inset cards with M1 corners; margin 16 phone, 20 on the inner screen (K layout margin 20) | Content padding at the inline end equals the column plus the margin; no row runs under the column | Scrolling lists may cross the band (S6); a list beside a detail splits at the band with even widths (SplitView, slice 2) |
| Toast | M1 banner from the top, centred | Centred in the content area beside the column, at the top | Landscape: in the inline start segment; portrait: toasts with an action button in the bottom segment above the tab bar, plain toasts in the top segment |
| FloatingActionButton | Above the tab bar | Joins the column above the tab bar, or sits at the content's block end and inline end beside the column | Off the band |
| Anything else | Must keep clear of the camera region and, when known, of the fold band; no interactive element sits in the band | | |

### 5.3 Right to left

The vendor's rule for native apps: the column stays on the same physical
side in right to left languages, because it follows the camera, and it can
be on the left in landscape and Split View (S3, S5; V).

A web page cannot know which side the camera is on, and in Safari the
system column is outside the page anyway. Our proposal for the web: the
page column follows the reading direction (inline end: right in English,
left in Arabic), so it uses logical properties like every other rule. The
alternative is a physical right column in both directions, which needs an
entry in the logical properties allow list. Owner decision 3. React Native
gets the vendor's rule from the system bars without work from us.

Arabic copy in the demo screens follows the cookbook: white Saudi dialect,
noun labels, no diacritics. Labels hidden in the column still exist as
accessible names in Arabic.

## 6. Gallery and docs

- A new gallery page `/platforms/duo` (React first), our own drawn frames:
  a rounded rectangle with the hinge side square on the outer screen, a
  plain dot for the camera, a dashed band for the fold. No vendor artwork,
  no bezel images, no status bar glyphs from the kit.
- Frames, each in both orientations: outer, inner, inner partly folded.
  Two modes per frame:
  - "In Safari": the iframe is the Safari page size from S8 (for example
    382 by 580 inside a 466 by 678 frame), the rest of the frame drawn as a
    plain column in the page background colour, as Safari does.
  - "Full screen": the iframe is the whole screen (466 by 678 and so on),
    the frame sets the column inset on the Theme element through a gallery
    only override of `--ds-inset-safe-end` (and top and bottom on inner
    portrait), and draws the camera region.
- Partly folded frames draw the band and, for the screen inside, set the
  gallery override of the fold segments (a gallery only data attribute that
  turns on the same layout the segment media query turns on). Real segment
  media queries are proven in tests with the Chrome protocol (section 7).
- Demo screens with the column: the M1 settings screen (tab bar, navbar
  actions, grouped list), the sheet screen (all four detents), the alert
  screen, a menu opened from the column, a toast. Our own coloured content
  scrolls under the bars (M6), so the glass shows.
- Axes as today: style, scheme, density, direction and language, URL keys.
  New URL keys for the gallery only: `screen` (outer, inner), `fold`
  (flat, folded), `mode` (safari, full).
- Docs: a "Foldable iPhone" section on the iOS platform page and a short
  note on the TabBar, Navbar, Sheet, AlertDialog and Toast pages: what
  `placement` does, what a page in Safari can and cannot know, the feature
  flags, and that a model is never detected.

## 7. Tests and gates

- Profiles: the record and contract harnesses gain Duo profiles. Playwright
  has no Duo device descriptor; we define our own from `iPhone 15 Pro`
  (touch, mobile) with the viewport set per screen and mode, and device
  scale 3. Ten profiles: outer and inner, portrait and landscape, Safari and
  full screen, plus inner folded in both orientations (full screen).
- Fold emulation in Chromium through a CDP session (S11, experimental
  commands, check that the bundled Chromium of Playwright 1.63 has them):
  `Emulation.setDisplayFeaturesOverride` with a vertical feature at offset
  455 and mask 40 (landscape) or a horizontal one (portrait),
  `Emulation.setDevicePostureOverride` with `folded`, and
  `Emulation.setSafeAreaInsetsOverride` for the column and the top and
  bottom insets. Each test asserts first that the override took effect
  (`matchMedia('(horizontal-viewport-segments: 2)')`), so a missing command
  fails loudly instead of passing.
- WebKit (the one Playwright WebKit download, owner approval 9): runs the
  same screens without posture or segments, which is what Safari does with
  the flags off. This is the default case and must look right on its own.
- Reflow (1.4.10): no sideways scroll at 320 wide, at 382 and 385 wide, and
  at 256 tall for the side column in landscape (the column scrolls or
  collapses; it never clips a control).
- Contract runs: `npm run contract -- --framework react --platform ios`
  per Duo profile for TabBar, Navbar, Toolbar, Sheet, Drawer, AlertDialog,
  Dialog, DropdownMenu, Popover, List, Toast; with `placement` forced to
  `bottom` and to `side` and left on `auto`.
- Unchanged elsewhere: computed style compare, working tree against HEAD,
  on `platform=web`, `android` and `macos`, and on `ios` at 393 by 852 (the
  M1 screens): zero change, or each change listed.
- Recording pack `packs/DU.json`: tab bar press in the column, sheet rising
  on the outer screen, sheet card on the inner landscape, sheet moving to a
  segment when folded, alert in a segment, menu from the column; Liquid and
  Neutral, light and dark.
- What cannot be proven here (HUMAN GATE, checking on a real phone): the
  real safe area values in Safari on each screen; whether Safari ever lets
  the page reach the column; the feature flags on and off; the fold while
  turning; touch on the column; Home Screen web apps; React Native system
  bars on the 27.1 SDK. The owner's machine is Windows and the vendor's
  device simulator (Device Hub in Xcode 27.1, S3, S8) needs a Mac, so the
  check needs a real iPhone Duo, a Mac, or a device cloud (owner decision 5).

## 8. Accessibility (WCAG 2.2)

| Criterion | Where it applies |
| --- | --- |
| 2.5.8 Target size (minimum) | Every column item is 48 by 48 (above 24, and above `size.target` 44 on `ios`); spacing between column items keeps 24 by 24 clear circles apart; the collapsed tab bar button is 48 |
| 1.4.10 Reflow | 320 wide and 256 tall checks above; nothing in the column is cut off; overflow goes to the "more" menu, not off screen |
| 1.3.4 Orientation | No order locks orientation; every screen works in portrait and landscape on both screens |
| 2.4.11 Focus not obscured (minimum) | The content reserves `scroll-padding-inline-end` equal to the column and `scroll-padding-block` for the top bar and bottom tab bar (PLAN 12 already asks this of floating bars); focus never lands under the column; when the fold is known, overlays never put a focused control in the band, and `scroll-margin` keeps a focused row out of it |
| 2.4.7 Focus visible | The 2px ring shows fully on column items (no clipping by the capsule) |
| 1.4.3, 1.4.11 Contrast | Labels and glyphs on the column glass, both schemes, over the lightest and darkest content, measured from pixels |
| 1.1.1, 4.1.2 Name, role, value | Icon only column items keep their visible label as the accessible name; `aria-current` on the current tab as today; tab order follows the column top to bottom, after the content's top row |
| 2.5.7 Dragging movements | Sheet detents keep their button path in every placement |
| 2.3.3 Animation from interactions | Moving bars between bottom and side on resize does not animate layout; it switches, and under reduced motion nothing moves |

## 9. Work orders

Ids `DU1` to `DU10`. Agents do not commit. Every subagent runs as
claude-opus-5-5 at medium. Each order reads `AGENTS.md`, `docs/contracts/`,
`reset-mobile.md`, `reset-M1.md` and this file first. The lead makes the
contract edits in section 11 before any order starts.

References for every order: the kit frames named in each order, captured
with the Figma read tools (metadata and screenshots only, never design
context or variables, never a write) into a scratch folder outside the
repo, and the primary pages in section 1. A sheet per part: reference left,
ours right, same size, light and dark. Measured but wrong to the eye is a
fail.

### First slice: React, the tab bar, the top bar and the sheet

Goal: the owner sees the tab bar, the top bar and the sheet right on the
outer and inner screens, in React, in Liquid and Neutral, light and dark,
English and Arabic. Batch 1 runs DU1, DU2, DU3 and DU4 at once; their files
do not overlap.

**DU1 Placement prop in React (ds-component)**

- Goal: `placement` on TabBar, Navbar and PageShell (`auto` default,
  `bottom`, `side`); PageShell passes it down through its context; the
  attribute `data-placement` is stamped only when not `auto`. PageShell's
  root gets the container name the contract sets. No CSS.
- Files owned: `packages/react/src/components/{TabBar,Navbar,PageShell}/`
  (the `.tsx`, `.test.tsx`, `.demo.tsx` files; not `index.ts`), and the three
  manifests under `packages/manifest/src/`.
- Forbidden: every CSS file, barrels, generated files, contracts.
- Inputs: `anatomy.md` (after the lead's edit), `manifest.md`,
  `frameworks.md` (React rules).
- Acceptance: tests for each value and for inheritance from PageShell; the
  server render has no `data-placement` for `auto`; manifests list the prop
  and its values with when to use `side` by hand (never in a desktop app);
  `npm run check`.

**DU2 The column and the sheet on `ios` (ds-style)**

- Reference pictures first: K Layout Guides `12892:62244`, `12892:62245`,
  `12892:62246`, `12892:62247`, the sheet variants `12892:62240` to
  `12892:62243`, Examples sheets `12886:17616`, tab bars `12887:21801`,
  toolbars `12887:23253`, Tab Bars `12887:20935`, Toolbars `12883:6008`.
- Goal: in `ios.css`, the `auto` rule of section 5.1, and the side layout:
  the Navbar's actions and the TabBar as one column at the inline end
  (column 84 including the safe area in full screen mode, items 48, 12 to
  the column edges, a vertical group capsule for actions, the tab capsule
  at the bottom, search below it), the title at the top of the content,
  content padding and scroll padding at the inline end. The inner portrait
  top bar with 48 buttons and the centred tab capsule. The sheet: 8 in from
  the edges on this device's sizes, the small detent bar, the outer sheet
  with its own small column, the centred card in inner landscape. Same DOM
  as today: the column is a placement of existing parts. If a part cannot
  be placed without a markup change, stop and report it to the lead as a
  contract bug.
- Files owned: `packages/css/src/platform/ios.css`, and the base CSS of
  TabBar, Navbar, PageShell and Sheet in `packages/css/src/components/`
  only where `ios.css` cannot reach (list each rule in the report).
- Forbidden: `packages/tokens/`, recipes, React and Angular files, the
  gallery.
- Acceptance: sheets per part, ours beside the kit, at each Duo size, in
  Liquid and Neutral, light and dark, English and Arabic; Studio and Desk
  take the geometry and keep their paint (ruling 16); `platform=web`,
  `android`, `macos` and the M1 `ios` screens at 393 by 852 unchanged by
  computed style; reflow checks of section 7; `npm run check`.

**DU3 Device frames in the gallery (ds-docs)**

- Goal: the `/platforms/duo` page of section 6: our own frames for outer,
  inner and inner folded, both orientations, the two modes, the URL keys,
  the demo screens with our own coloured content. The full screen mode sets
  the inset override on the frame's Theme element; the folded frame sets the
  gallery only fold attribute.
- Files owned: `apps/gallery-react/src/Duo.tsx` (new), `apps/gallery-react/src/duo.css`
  (new), and the Duo screens inside them. The lead adds the route and runs
  `npm run gen`.
- Forbidden: `Platforms.tsx` and `platforms.css` (DU2 and M6 territory),
  packages, generated files.
- Acceptance: a picture of every frame and mode, light and dark, English
  and Arabic; no vendor image, glyph, text or name in the repo (a search of
  the diff for the kit's layer names finds none); `npm run check`.

**DU4 Duo profiles and fold emulation in the harness (ds-qa)**

- Goal: the ten profiles of section 7 for `npm run contract` and
  `npm run record` (a `--device` value per profile); a helper that opens a
  CDP session and applies the display feature, posture and safe area
  overrides, and asserts they took effect; the pack `packs/DU.json`.
- Files owned: `packages/contract-tests/src/record/screen.ts`,
  `packages/contract-tests/src/record/packs/DU.json` (new),
  `packages/contract-tests/src/fold.ts` (new), and its test.
- Forbidden: `record/clips.ts` (the lead adds the clips), component source,
  CSS.
- Acceptance: a test proves each override changes `matchMedia` and
  `env()` in Chromium, or reports which command the bundled Chromium lacks;
  WebKit runs the profiles without overrides; `npm run check`.

Then: the lead runs `npm run contract` and `npm run record -- --order DU`
on DU2 and DU3, ds-qa reviews against this file, the owner looks.

### Second slice: overlays, the fold, the other frameworks

Batch 2: DU5, DU6, DU7 at once. Batch 3: DU8, DU9, DU10.

**DU5 Fold and column aware overlays in React (ds-component)**

- Reference pictures first: K Examples alerts `12956:22765`, sheets
  `12886:17616` (folded rows).
- Goal: a pure helper in `packages/shared/src/fold.ts` that turns
  `window.viewport.segments` (or nothing) into segments and a band, with
  tests; a React hook that reads it after mount and on `resize` and posture
  change; Popover, DropdownMenu, ContextMenu and Tooltip take the column and
  the band as collision padding and boundary; AlertDialog, Dialog and Sheet
  get a `data-segment` attribute (`start`, `end`, `top`, `bottom`) when two
  segments exist, for the CSS to place them.
- Files owned: `packages/shared/src/fold.ts` (new) and test; the `.tsx` and
  tests of Popover, DropdownMenu, ContextMenu, Tooltip, AlertDialog, Dialog,
  Sheet; their manifests.
- Acceptance: tests with segments and without; nothing changes when the
  API is absent; `npm run check`.

**DU6 Fold, list, toast and drawer CSS on `ios` (ds-style)**

- Goal: section 5.2 rows for List, Toast, Drawer, AlertDialog, Dialog and
  the folded sheet, under the segment media queries and DU5's
  `data-segment`; SplitView splits at the band with even widths.
- Files owned: `packages/css/src/platform/ios.css` (after DU2 is accepted),
  base CSS of List, Toast, Drawer, SplitView where `ios.css` cannot reach.
- Acceptance: sheets beside the kit's folded frames; the Chromium fold
  emulation passes; WebKit without flags looks as in the first slice.

**DU7 Angular parity (ds-angular)**

- Goal: the `placement` input and `data-placement` host attribute on the
  Angular TabBar, Navbar and PageShell, and DU5's segment attribute on the
  Angular overlays, using the shared helper.
- Files owned: `packages/angular/src/components/{tab-bar,navbar,page-shell}/`
  and the overlay directories DU5 touched, minus barrels.
- Acceptance: the DOM equals React's attribute for attribute on the Duo
  profiles; the Angular gallery shows the outer and inner frames.

**DU8 React Native on the device (ds-native)**

- Goal: find out, with sources, whether `react-native-screens` and
  `expo-router` native tabs and stacks produce the vendor's side column
  when built with the iOS 27.1 SDK on Expo's cloud builds, and whether the
  Expo SDK in use builds with Xcode 27.1. Make our drawn controls read
  each safe area side on its own. Do not add a module for reserved regions
  or the hinge: report it as a HUMAN GATE with the candidate package.
- Files owned: `packages/native/src/` files for TabBar, Navbar and Sheet
  styles and the native gallery Duo screen.
- Acceptance: a written answer per library, verified or not; unit tests
  for asymmetric insets; nothing in the theme objects changes.

**DU9 Docs (ds-docs)**

- Goal: section 6 docs: the foldable section on the iOS platform page and
  the notes on the component pages, with the feature flags and the "never
  detect a model" rule.
- Files owned: `apps/docs/` pages for the iOS platform, TabBar, Navbar,
  Sheet, AlertDialog, Toast.

**DU10 Review and device script (ds-qa)**

- Goal: review DU1 to DU9 against this file and the contracts; write the
  device script for the owner's phone check (Safari with the flags off and
  on, each screen and pose, Arabic, a Home Screen web app, the React Native
  gallery).
- Files owned: `docs/reports/reset/DU/` (new).

## 10. Decisions for the owner

1. Model: (a) size and posture inside `ios` plus (c) gallery frames, as
   recommended; or (b) a form factor axis.
2. The `auto` rule: side column when the shell is at least 440 wide and at
   most 700 tall. This also gives a side column to an ordinary iPhone page
   in Safari in landscape, which today has bars at the top and bottom.
   Keep it, or limit `auto` to shells at least 560 tall in the other axis.
3. Arabic on the web: the page's column follows the reading direction
   (left in Arabic), or stays on the right as the vendor's native column
   does.
4. In Safari on the outer screen in portrait the page is 382 wide beside
   Safari's own column. `auto` keeps our tab bar at the bottom there (no
   second column). Confirm.
5. Device check: a real iPhone Duo, a Mac with Xcode 27.1 (the device
   simulator), or a paid device cloud. Until one exists, every Duo look
   stays proposed.
6. The fold on the web: build the progressive rules now (they work only
   with Safari's feature flags on or in Chrome on foldables), or wait until
   Safari ships the APIs by default.
7. React Native: accept the system column from native tabs and stacks as
   the Duo look for Studio and Desk too (ruling 10), and defer a drawn
   column.
8. Large titles: the kit's large title on the device is shorter than on an
   iPhone (34 against 41 tall frames). Keep one `ios` type ramp (option a),
   or ask for a Duo size.

## 11. Contract edits for the lead

1. `docs/contracts/anatomy.md`: `placement` on TabBar, Navbar and
   PageShell (`auto`, `bottom`, `side`), `data-placement` stamped only when
   not `auto`; PageShell root is a size container named `ds-shell`; the
   column is a placement of existing parts, no new part; `data-segment` on
   AlertDialog, Dialog and Sheet (second slice).
2. `docs/contracts/frameworks.md`, platform axis: `ios` covers the foldable
   iPhone; `auto` never detects a model, never reads `screen` sizes; layout
   on this device comes from size, safe areas and, when present, posture and
   viewport segments.
3. `docs/contracts/tokens.md`, platform names: a note under `inset.safe`
   that `start` and `end` differ on this device and no rule may assume
   them equal. No new names in option (a).
4. `DECISIONS.md`: the owner's answers to section 10, and "the kit is a
   reference under the same terms as the Mobbin captures: observe, never
   copy".
5. PLAN section 12 table, 2.4.11 row: add "and the side column on phones;
   overlays avoid the fold band when it is known".
6. `packages/contract-tests/src/record/clips.ts`: the Duo clips of section 7.
7. Gallery route for `/platforms/duo`, then `npm run gen`.
8. STATE.md "Waiting on owner": decisions 1 to 8, and the device check
   gate.

## 12. Not verified

- The safe area values Safari reports on each screen and orientation.
- `devicePixelRatio` on the inner screen (expected 3).
- The user agent string (only a third party simulator report, T4).
- How Home Screen web apps lay out on this device.
- Safari page sizes while partly folded.
- Which side the column takes in the second landscape orientation of the
  outer screen (camera at the top left in the kit's bezel drawing).
- Whether web pages keep the column on the same side in Arabic.
- The 40 point fold band (kit only; the vendor's pages give no width).
- The hinge angle API named in secondary posts.
- React Native libraries producing the side column on the 27.1 SDK.
- Whether the bundled Chromium of Playwright 1.63 has the three
  experimental emulation commands.
