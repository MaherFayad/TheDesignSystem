# Android and Material audit

Status: analysis only. No source file was changed. Date: 2026-11-15.
Evidence: `docs/reports/audit/shots/material/` (contact sheets in PNG, computed
measurements in JSON). Screenshots of Google's pages stayed in a scratch
folder and are not in the repo.

## Verdict

The Android variant gets a fair number of sizes right, because order 1.25
read Material's token files: 40dp pill buttons with 14px labels, 48dp
targets everywhere, a 52 by 32 switch whose dot grows from 16 to 24, an 18dp
checkbox with a 2dp edge and a 40dp state layer, a 56dp filled field with an
active indicator, start aligned 24px dialog titles, a 32 by 4 sheet handle in
a 48dp target and a pill behind the current tab. But it is Material 3 as it
stood in 2022, drawn in another style's colour, type and shape, and it
misses almost everything that makes an Android app feel like Android in
2026. There are no colour roles or tonal surfaces (one primary and a fixed
palette per style), the ripple shows only after the finger lifts (nothing in
a 600ms hold), corner radii are arithmetic on the style's tokens (a "28dp"
dialog measures 24 in Neutral, the "16dp" FAB 12), the snackbar sits on top of
the navigation bar and the FAB on its last item, the system back gesture
leaves the page with a sheet open, the page is not edge to edge, the same
bottom bar runs across a 1280 wide tablet, and none of Material 3 Expressive
is there: no spring motion, no shape morph, no five button sizes, no FAB menu,
toolbars, flexible app bars, loading indicator or new menus. Under Liquid or
Desk the style recipes beat the platform, so "Android" turns into an iOS
capsule tab bar or a window with traffic lights. For the web, Google's own
Material Web library is in maintenance mode and does not implement
Expressive, so a Material look on the web has to be built on the system's
own components. My recommendation is both a platform variant that owns
behaviour and a separate Material based style that owns the look, with the
contract extended for colour roles, a shape scale, state opacities, elevation
levels and spring tokens.

## How this was checked

- Research: Google's Material Design site rendered in headless Chromium
  (Playwright 1.63, Chrome 153), 120 pages, plus the site's own token
  database files (`/_dsm/data/dsdb-m3/2026-10-13_06-10-19/*.json`, design
  system revision dated 2026-05-27), which hold every system and component
  token behind the tables on the pages. Values below come from those files
  with the public context (audience `3p`, font `static`, platform `android`,
  scheme `light`) unless a context is named.
- Android developer pages, Chrome and MDN pages for the web platform, the
  Material Web repository (through `raw.githubusercontent.com`) and npm
  metadata for licences and versions.
- System: the local gallery (`apps/gallery-react`, Vite on port 5242), 33
  components at `platform=android` in Neutral light, Neutral dark and Liquid
  light on the Playwright `Pixel 10` descriptor (360 by 732, scale 3,
  touch), and the same 33 at 1440 by 900 with `platform=web` in Neutral light.
  The six screens of `/platforms/screen` on the Pixel in Neutral light and
  dark, Liquid light and Desk dark, and on the `Galaxy Tab S9` descriptor
  (640 by 1024) and a 1280 by 800 touch tablet.
- Touch through Chrome DevTools touch events: a 600ms hold on a button with
  samples of the ripple layer, a hold on the switch, tap to focus the floating
  label field, open and drag the sheet from the body and from the handle, tap
  the handle, browser back with a dialog and with a sheet open, swipe the
  toast, long press a context menu tile and a tooltip trigger.
- Computed styles and boxes from `getComputedStyle` and
  `getBoundingClientRect` (CSS px), and `document.getAnimations()` for
  durations and curves. Every image was read.

## Sources

Fetched means the page was rendered and read on 2026-11-15. Material pages
print no date of their own; the token database the pages load is the
2026-10-13 export of design system revision 2026-05-27.

| URL | Title | Date or version stated | Status |
| --- | --- | --- | --- |
| https://m3.material.io/ | Material Design 3 | I/O 2026 posts, May 19, 2026 | fetched |
| https://m3.material.io/blog/whats-new-at-io26 | What's new at Google I/O 2026 | May 19, 2026 | fetched |
| https://m3.material.io/blog/material-is-compose-first | Material Android is Compose-first | May 19, 2026 | fetched |
| https://m3.material.io/blog/building-with-m3-expressive | Building with M3 Expressive | not stated | fetched |
| https://m3.material.io/blog/m3-expressive-motion-theming | M3 Expressive motion | not stated | fetched |
| https://m3.material.io/develop/web | Web | not stated, says maintenance mode | fetched |
| https://m3.material.io/styles/color/roles | Color roles | not stated | fetched |
| https://m3.material.io/styles/color/system/how-the-system-works | Color system | not stated | fetched (load timed out, text read) |
| https://m3.material.io/styles/color/dynamic/choosing-a-source | Dynamic color | not stated | fetched |
| https://m3.material.io/styles/color/static/baseline | Static color | not stated | fetched |
| https://m3.material.io/styles/typography/type-scale-tokens | Type scale tokens | not stated | fetched |
| https://m3.material.io/styles/typography/applying-type | Applying type | not stated | fetched |
| https://m3.material.io/styles/shape/corner-radius-scale | Corner radius scale | not stated | fetched |
| https://m3.material.io/styles/shape/overview-principles | Shape | not stated | fetched |
| https://m3.material.io/styles/shape/shape-morph | Shape morph | not stated | fetched |
| https://m3.material.io/styles/motion/overview/how-it-works | Motion physics system | "May 2025" | fetched |
| https://m3.material.io/styles/motion/overview/specs | Motion physics specs and web curves | not stated | fetched |
| https://m3.material.io/styles/motion/easing-and-duration/tokens-specs | Easing and duration tokens | says no longer maintained | fetched |
| https://m3.material.io/styles/motion/transitions/transition-patterns | Transitions | not stated | fetched |
| https://m3.material.io/styles/elevation/applying-elevation | Elevation | not stated | fetched |
| https://m3.material.io/styles/elevation/tokens | Elevation tokens | not stated | fetched |
| https://m3.material.io/styles/icons/applying-icons | Icons | not stated | fetched |
| https://m3.material.io/styles/spacing/tokens | Spacing tokens | not stated | fetched |
| https://m3.material.io/foundations/interaction/states/state-layers | State layers | not stated | fetched |
| https://m3.material.io/foundations/interaction/states/applying-states | Applying states | not stated | fetched |
| https://m3.material.io/foundations/layout/breakpoints/overview (and compact, medium, expanded, large-extra-large) | Breakpoints | not stated | fetched |
| https://m3.material.io/foundations/layout/canonical-examples/overview (and list-detail, supporting-pane, feed) | Canonical examples | not stated | fetched |
| https://m3.material.io/foundations/layout/scaffold/overview (and bars, rails, panes) | Scaffold | not stated | fetched |
| https://m3.material.io/foundations/layout/layout-overview/adaptive-design | Adaptive design | not stated | fetched |
| https://m3.material.io/foundations/usability/applying-m-3-expressive | Applying M3 Expressive | not stated | fetched |
| https://m3.material.io/components/{name}/guidelines and /specs for app-bars, toolbars, navigation-bar, navigation-rail, navigation-drawer, tabs, buttons, all-buttons, button-groups, split-button, icon-buttons, segmented-buttons, floating-action-button, extended-fab, fab-menu, chips, text-fields, menus, dialogs, bottom-sheets, side-sheets, snackbar, switch, checkbox, radio-button, sliders, progress-indicators, loading-indicator, cards, lists, divider, search, date-pickers, time-pickers, tooltips, badges, carousel | Component pages | not stated | fetched (all-buttons/guidelines 404, overview read) |
| https://m3.material.io/_dsm/data/dsdb-m3/2026-10-13_06-10-19/ (COLOR, TYPOGRAPHY, ELEVATION, MEASUREMENT, OPACITY, TOKEN_TYPE_UNSPECIFIED and 34 TOKEN_TABLE files) | The token data behind the pages | export 2026-10-13, revision 2026-05-27 | fetched |
| https://developer.android.com/develop/ui/views/layout/edge-to-edge | Edge to edge | last updated 2026-11-10 | fetched |
| https://developer.android.com/develop/ui/compose/system/insets | Insets | 2026-11-10 | fetched |
| https://developer.android.com/design/ui/mobile/guides/foundations/system-bars | System bars | 2026-11-10 | fetched |
| https://developer.android.com/develop/ui/views/touch-and-input/gestures/gesturenav | Gesture navigation | 2026-10-28 | fetched |
| https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture | Predictive back | 2026-10-28 | fetched |
| https://developer.android.com/design/ui/mobile/guides/patterns/predictive-back | Predictive back design | 2024-10-24 | fetched |
| https://developer.android.com/develop/ui/views/haptics/haptics-principles | Haptics principles | 2026-10-26 | fetched |
| https://developer.android.com/develop/ui/views/haptics/haptic-feedback | Haptic feedback | 2026-10-26 | fetched |
| https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes | Window size classes | 2026-11-10 | fetched |
| https://developer.android.com/about/versions/16/behavior-changes-16 | Android 16 behaviour changes | 2026-10-28 | fetched |
| https://developer.android.com/guide/topics/large-screens | Large screens | not stated | fetched |
| https://developer.chrome.com/docs/css-ui/edge-to-edge | Chrome on Android edge to edge | 2025-02-28 | fetched |
| https://developer.chrome.com/blog/viewport-resize-behavior | Viewport resize behaviour | 2022-10-28 | fetched |
| https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate | Navigator.vibrate | "Limited availability" | fetched |
| https://developer.mozilla.org/en-US/docs/Web/API/CloseWatcher | CloseWatcher | "Limited availability" | fetched |
| https://developer.mozilla.org/en-US/docs/Web/CSS/env | env() | not stated | fetched |
| https://raw.githubusercontent.com/material-components/material-web/main/README.md, docs/roadmap.md, docs/size.md, docs/theming/README.md, ripple/internal/ripple.ts, focus/internal/_focus-ring.scss, tokens/_md-sys-state.scss | Material Web | v2.5.0 on npm (2026-07-15), docs reviewed 2026-07-31, size table 2025-08-20, tokens v0.192 | fetched |
| https://registry.npmjs.org/@material/web | npm metadata | 2.5.0, Apache-2.0, deps lit, tslib, @lit/context | fetched |
| https://raw.githubusercontent.com/material-components/material-web/main/LICENSE | Licence | Apache 2.0 | fetched |
| https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/OFL.txt | Roboto licence | SIL OFL 1.1 | fetched |
| https://raw.githubusercontent.com/google/fonts/main/ofl/robotoflex/OFL.txt | Roboto Flex licence | SIL OFL 1.1 | fetched |
| https://raw.githubusercontent.com/google/material-design-icons/master/LICENSE | Material Symbols and Icons licence | Apache 2.0 | fetched |
| https://registry.npmjs.org/@material/material-color-utilities | Colour utilities | 0.4.0, Apache-2.0, no dependencies | fetched |

Failed and worked around:
- `https://github.com/material-components/material-web` and
  `https://api.github.com/repos/material-components/material-web`: HTTP 403
  from the network policy. Read the same files through
  `raw.githubusercontent.com` and npm.
- `https://m3.material.io/foundations/layout/applying-layout/window-size-classes`:
  404 (old path). Read the breakpoints pages and the Android window size
  class page instead.
- `https://m3.material.io/foundations/building-for-all/accessibility`: 404,
  redirected to user needs. Target and contrast rules were read on the state
  layer, icon, chip and spacing pages.
- `https://developer.chrome.com/docs/web-platform/predictive-back`: 404. I
  found no Chrome page on predictive back for web pages; see "What I could not
  check".

## Material rules, compact reference

All values in dp (Android) or CSS px (web, 1dp equals 1px); type in sp
(web rem is sp divided by 16).

### Colour

- Five key colours (primary, secondary, tertiary, neutral, neutral variant)
  each give a tonal palette of tones 0 to 100; roles pick tones. Error has its
  own palette.
- Accent roles, each with an on colour and a container pair: `primary`,
  `on-primary`, `primary-container`, `on-primary-container`, and the same for
  `secondary`, `tertiary`, `error`. Fixed roles (`primary-fixed`,
  `primary-fixed-dim`, `on-primary-fixed`, `on-primary-fixed-variant`, and for
  secondary and tertiary) keep one value in both schemes.
- Surfaces: `surface`, `surface-dim`, `surface-bright`, and five containers
  `surface-container-lowest`, `-low`, `surface-container`, `-high`, `-highest`;
  `on-surface`, `on-surface-variant`, `outline`, `outline-variant`,
  `inverse-surface`, `inverse-on-surface`, `inverse-primary`, `scrim`,
  `shadow`.
- Baseline light, tone in brackets: primary #6750a4 (40), primary container
  #eaddff (90), surface #fef7ff (98), containers #ffffff (100), #f7f2fa (96),
  #f3edf7 (94), #ece6f0 (92), #e6e0e9 (90), on surface #1d1b20 (10), outline
  #79747e (50), outline variant #cac4d0 (80), inverse surface #322f35 (20).
  Dark: primary #d0bcff (80), surface #141218 (6), containers #0f0d13 (4),
  #1d1b20 (10), #211f26 (12), #2b2930 (17), #36343b (22).
- Elevation is shown by tone first: M3 uses surface container roles instead
  of tint overlays and keeps shadows for where protection is needed (FAB,
  menus, snackbar). The old `surface-tint` role remains but components map to
  container roles.
- Component roles: filled button `primary`; FAB `primary-container`; menu and
  navigation bar `surface-container`; dialog `surface-container-high`; filled
  field and filled card `surface-container-highest`; elevated card
  `surface-container-low`; plain tooltip and snackbar `inverse-surface` (with
  `inverse-primary` for the snackbar action); switch track on `primary`, off
  `surface-container-highest` with an `outline` edge and handle.
- Dynamic colour: a scheme is generated from a source colour picked by the
  user (wallpaper) or from content (an image); three contrast levels
  (standard, medium, high) remap the same roles.

### Type

Baseline, size/line height, weight, tracking in px (public `3p` context):

| Role | Size/line | Weight | Tracking |
| --- | --- | --- | --- |
| Display large, medium, small | 57/64, 45/52, 36/44 | 400 | -0.25, 0, 0 |
| Headline large, medium, small | 32/40, 28/36, 24/32 | 400 | 0 |
| Title large | 22/28 | 400 | 0 |
| Title medium, small | 16/24, 14/20 | 500 | 0.15, 0.1 |
| Body large, medium, small | 16/24, 14/20, 12/16 | 400 | 0.5, 0.25, 0.4 |
| Label large, medium, small | 14/20, 12/16, 11/16 | 500 | 0.1, 0.5, 0.5 |

- Emphasised set (Expressive): the same sizes; weight 500 for display,
  headline, title large and body; 700 for title medium, title small and every
  label. Used for selected items, primary actions, badges and the extended
  FAB; components do not use it by default.
- Brand and plain typeface tokens, both Roboto by default. Line height adapts
  to script: Arabic is in the "medium" group, about 7 percent taller.
- Scale built on 14 with a ratio of 1.125.

### Shape

- Corner scale: none 0, extra small 4, small 8, medium 12, large 16, large
  increased 20, extra large 28, extra large increased 32, extra extra large 48,
  full. Single side variants: extra small top, large top, start, end, extra
  large top.
- By component: buttons, icon buttons, chips' selection pills, sliders,
  segmented buttons, search bar, nav indicators, badges: full. Chips 8. Cards
  12. FAB 16 (small 12, medium 20, large 28). Menus 4 (Expressive vertical
  menus 16, items 12 first and last with 4 inner). Snackbar, plain tooltip,
  outlined field 4; filled field 4 top only. Rich tooltip 12. Dialog, carousel
  item, docked search view 28. Bottom sheet 28 top. Side sheet 16 on the
  inside edge (detached 16 all). Navigation drawer 16 on the end edge. List
  container 16, Expressive list item 4, pressed 16.
- Expressive buttons are round or square. Square sizes take 12, 12, 16, 28,
  28 (xs to xl). Pressed, the corner morphs to 8 (xs, s), 12 (m), 16 (l, xl)
  on the fast spatial spring; selected toggles swap round and square.
- A library of 35 shapes with shape morph, used in the loading indicator and
  the standard button group.

### State layers and ripple

- A layer in the content colour over the container: hover 0.08, focus 0.10,
  pressed 0.10, dragged 0.16 (current tokens; Material Web still ships 0.12 for
  focus and pressed from token version 0.192). Disabled: container 0.12,
  content 0.38.
- Selection controls (switch, checkbox, radio, slider): a 40dp circular
  layer inside a 48dp target.
- Ripple, as Material Web implements it: begins on press from the touch
  point, but a touch waits 150ms first so a scroll does not ripple; starts at
  20 percent of the larger side and grows past the far corner with a soft
  radial edge over 450ms on the standard curve; a press shows for at least
  225ms; fades out over about 375ms.
- Focus ring: 3dp, 2dp outside the shape; on keyboard focus it grows to 8dp
  and settles at 3dp over 600ms on the emphasised curve.

### Elevation

- Levels 0, 1, 3, 6, 8, 12dp. Hover raises a button by one level. Defaults:
  elevated button and card 1, filled button 0 (1 on hover), menus, navigation
  bar, app bar on scroll and rich tooltip 3, FAB, dialog, snackbar and search
  bar 6, standard bottom sheet and modal side sheet 1.

### Targets and spacing

- Targets at least 48 by 48dp (pointer targets 44). An 8dp gap between
  chips. A 24dp icon takes a 48dp target, a 20dp icon 40.
- Spacing tokens on an 8dp scale: 0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32,
  36, 40, 48, 56, 64, 72.
- Window margins: 16dp compact, 24dp medium and above.

### Components (dp)

| Component | Numbers |
| --- | --- |
| Buttons (Expressive) | xs 32, s 40 (default), m 56, l 96, xl 136 tall; sides 12, 16, 24, 48, 64; icon 20, 20, 24, 32, 40; icon gap 4, 8, 8, 12, 16; label 14/500, 14/500, 16/500, 24/400, 32/400; outline 1, 1, 1, 2, 3. Kinds: elevated, filled, tonal, outlined, text. Toggle buttons change colour and shape when selected. |
| Icon buttons | 40 default (xs 32, m 56, l 96, xl 136), icon 24 (32 at l, 40 at xl), round or square (12, 16, 28), pressed corner 8, 12, 16; narrow, default and wide widths. |
| Button groups | standard: 8 gap, a pressed button widens by 15 percent on the fast spring and its neighbours give way; connected: 2 gap, inner corners 8 (4 when pressed, half the height when selected). |
| Split button | 40 (s), 56, 96; 2dp gap; inner corners 4 (8 at l), 12 pressed, half the height when the menu is open; trailing icon 22 to 38. |
| Segmented buttons | 40 tall, full corners, 1dp outline, 18 icon, label 14/500; a check icon on selected segments. |
| FAB | 56 with corner 16, icon 24 (small 40 and 12, medium 80 and 20 with icon 28, large 96 and 28 with icon 36); elevation 6 (lowered 1); `primary-container`. |
| Extended FAB | 56, corner 16, sides 16 and 20, icon gap 12, label 14/500; medium 80 (label 22), large 96 (label 24). |
| FAB menu | replaces the speed dial; close button 56 round; items 56 tall pills, sides 24, icon 24, gap 8, label 16/500; 4dp between items. |
| Chips | 32 tall, corner 8, 1dp outline at rest, icon 18, label 14/500. |
| Switch | track 52 by 32, 2dp outline off; handle 16 off, 24 on or with an icon, 28 pressed; icon 16. |
| Checkbox, radio | box 18 with corner 2 and a 2dp edge; radio icon 20; 40 state layer. |
| Slider (Expressive) | handle 4 wide, 44 tall (2 wide while pressed), 6dp gap each side; track 16 (xs), 24 (s), 40 (m), 56 (l), 96 (xl); inner corner 2, outer full; value label 28 tall; stop indicators. |
| Text fields | 56 tall; filled: top corners 4, active indicator 1 (2 focused); outlined: corner 4, outline 1 (2 focused); input 16/24; label 16 resting, 12 floated (body small); supporting text 12/16; icons 24. |
| Menus | baseline: corner 4, items 48 tall, label 14, icons 24, elevation 3. Expressive vertical menus: corner 16, items 44 tall, 2dp gaps between groups, group corner 8. |
| Dialog | corner 28, elevation 6, headline 24/32, supporting 14/20, actions label 14/500 as text buttons; full screen dialog for forms on compact windows with a 56dp header, 22/28 title. |
| Bottom sheet | top corners 28, handle 32 by 4 at 0.4 opacity, `surface-container-low`, elevation 1; full width up to 640, wider windows get 56dp top and side margins. |
| Side sheet | docked 256 wide (up to 400), modal 16 inside corners, title 22/28. |
| Snackbar | 48 one line, 68 two lines (the guideline text says 48 to 64), corner 4, `inverse-surface`, text 14/20, one text action, elevation 6. |
| Navigation bar (Expressive) | 64 tall, items vertical in compact (indicator 56 by 32) and horizontal in medium (indicator 40 tall, 16 sides); icons 24, label 12/16; filled icon for the current item. The baseline bar was 80 with a 64 by 32 indicator. |
| Navigation rail (Expressive) | collapsed 96 (narrow 80), 44 top space, items 64 tall, indicator 56 by 32; expanded 220 to 360, standard or modal (corner 16, elevation 3). |
| Navigation drawer | 360 wide, items 56, full indicator, scrim 0.4. No longer recommended in Expressive: use the expanded rail. |
| Top app bar | small 64 with a 22/28 title; medium flexible 112 (136 with a subtitle); large flexible 120 (152); search app bar with a 56 tall full pill; colour fill on scroll instead of a shadow. Medium and large baseline bars are no longer recommended. |
| Toolbars | docked and floating, 64 tall, at least 16dp outside padding; the bottom app bar is no longer recommended. |
| Tabs | 48 tall (64 with icon and label), label 14/500, primary indicator 3 with a 3dp top corner; secondary 2. |
| Lists | rows 56, 72 and 88; 16 sides; label 16/24, supporting 14/20; leading icon 24, avatar 40, image 56. |
| Cards | corner 12; elevated (1), filled, outlined (1dp). |
| Progress | linear 4 (thick 8), 4dp gap between indicator and track, stop indicator 4; circular 40 (48 with a wave); waves with amplitude 3 and wavelength 40 (linear). |
| Loading indicator | 48 container, 38 indicator, morphing shapes; for waits under five seconds; replaces most indeterminate circular indicators. |
| Search | bar 56 full pill, elevation 6; full screen view header 72. |
| Tooltips | plain: corner 4, 12/16 text, `inverse-surface`; rich: corner 12, subhead 14/20, an action. |
| Badges | small 6, large 16 with 11/16 label. |
| Carousel | items with corner 28. |
| Date picker | modal full screen on compact windows; docked and input variants. |

### Motion

- Physics system (Expressive, May 2025): springs in two schemes, each with
  spatial and effects tokens at three speeds. Stiffness and damping ratio:

| Token | Expressive | Standard |
| --- | --- | --- |
| Fast spatial | 800, 0.6 | 1400, 0.9 |
| Default spatial | 380, 0.8 | 700, 0.9 |
| Slow spatial | 200, 0.8 | 300, 0.9 |
| Fast, default, slow effects | 3800, 1600, 800, damping 1 | same |

- Spatial springs move, scale, rotate and reshape (they overshoot); effects
  springs change colour and opacity (no overshoot). Fast for small parts
  (switch, buttons), default for partial screen (bottom sheet, expanded rail),
  slow for full screen.
- Web conversions published by Material for when a spring is not possible:
  expressive fast spatial `cubic-bezier(0.42, 1.67, 0.21, 0.90)` over 350ms,
  default spatial `(0.38, 1.21, 0.22, 1.00)` 500ms, slow spatial
  `(0.39, 1.29, 0.35, 0.98)` 650ms; effects `(0.31, 0.94, 0.34, 1.00)` 150ms,
  `(0.34, 0.80, 0.34, 1.00)` 200ms, `(0.34, 0.88, 0.34, 1.00)` 300ms; standard
  spatial `(0.27, 1.06, 0.18, 1.00)` at 350, 500 and 750ms.
- Legacy easing and duration (still used for transitions, no longer
  maintained): standard `cubic-bezier(0.2, 0, 0, 1)`, standard decelerate
  `(0, 0, 0, 1)`, standard accelerate `(0.3, 0, 1, 1)`, emphasised decelerate
  `(0.05, 0.7, 0.1, 1)`, emphasised accelerate `(0.3, 0, 0.8, 0.15)`; the
  emphasised curve is a two segment path on Android and falls back to
  standard in CSS. Durations: short 50, 100, 150, 200; medium 250, 300, 350,
  400; long 450, 500, 550, 600; extra long 700, 800, 900, 1000ms.
- Navigation bar: the indicator grows from the icon's centre on one axis and
  the icon fills when an item becomes current.

### Bottom sheets and snackbars

- Standard sheets sit beside the content with no scrim; modal sheets block it,
  open at no more than 50 percent of the height, scroll inside once pulled up,
  and close by an item, the scrim, a swipe down or a close control in a full
  height sheet. The handle can be dragged or selected; selecting it cycles the
  preset heights or closes, and a single pointer path is required when
  heights cannot be dragged. Modal sheets are for phones; larger windows may
  use a side sheet. On Android a predictive back swipe detaches the sheet from
  the side edges.
- Snackbars: one at a time, toward the bottom, in front of content but never
  in front of navigation or a FAB; above a FAB; nudged up by docked toolbars;
  full width only when there is no persistent navigation; no icons, one text
  action, no inline links; auto dismiss after 4 to 10 seconds only without an
  action, and on the web only with inline feedback too; consecutive snackbars
  replace, never stack; do not animate the FAB with them.

### Navigation by window size

| Class | Width | Navigation | Layout |
| --- | --- | --- | --- |
| Compact | under 600 | navigation bar (or modal expanded rail) | one pane, 16 margins |
| Medium | 600 to 839 | bar with horizontal items, or a collapsed rail | one pane, 24 margins |
| Expanded | 840 to 1199 | rail, never a bar | two panes often, 24 margins |
| Large | 1200 to 1599 | rail, expanded where it fits | two panes, fixed pane 412 |
| Extra large | 1600 and up | expanded rail | two or three panes |

Height classes: compact under 480, medium 480 to 899, expanded 900 and up.
Canonical layouts: list detail, supporting pane, feed. Never a bar and a rail
at once; the rail is never horizontal; the bar holds three to five items with
labels; re-selecting the current item scrolls to the top.

### Android platform

- Edge to edge is enforced from Android 15 for apps targeting it, and from
  Android 16 the opt out is gone. Predictive back system animations are on by
  default for apps targeting Android 16; the back preview scales the outgoing
  surface to 90 percent with an 8dp margin and fades through at 35 percent of
  the gesture.
- Android 16 ignores orientation and resizability limits on displays at least
  600dp wide: every app must adapt.
- Haptics: prefer clear, short effects from the action based constants
  (confirm, reject, clock tick, toggle and so on); given buzzy haptics or none,
  choose none; stronger effects for bigger events.
- Chrome on Android draws edge to edge from version 135 on small screens; a
  page opts in with `viewport-fit=cover` and pads bottom fixed content with
  `env(safe-area-inset-bottom)`; Chrome shows a "chin" over the gesture bar
  until a page opts in. Since Chrome 108 the keyboard resizes only the visual
  viewport unless the page sets `interactive-widget=resizes-content`.

### Material on the web

- The Material site says Material Web Components are in maintenance mode,
  "Material 3 Expressive is not implemented on Web". The repository says
  maintenance mode pending new maintainers; the roadmap lists app bars,
  navigation bar, rail and drawer, bottom sheet, snackbar, tooltip, search,
  segmented button, date and time pickers, card and badge as never built.
- Version 2.5.0 (2026-07-15), built on Lit, shadow DOM web components,
  themed through `--md-sys-color-*`, `--md-sys-typescale-*`, `--md-sys-shape-*`
  and per component `--md-<component>-*` custom properties, with
  `--md-ref-typeface-brand` and `-plain`; `--md-ref-palette-*` is not
  supported. Size: 72.1kb gzip for everything, 53.7kb for the common set,
  about 6 to 19kb per component.
- The physics motion system is "compatible" on the web through the published
  curve conversions.

## Scorecard

0 is absent, 5 is at the level of current Material on Android. Scores are
for `platform=android` in Neutral unless noted.

| Area | Score | Evidence |
| --- | --- | --- |
| Colour roles and dynamic colour | 1 | One `color.primary` (#2563eb) and an 8 percent `primary.tint`; no container and on container pairs, no secondary or tertiary, no surface container ladder, no inverse primary; schemes are fixed hex per style; nothing generates a scheme from a source colour. |
| Type | 2 | Inter at fluid sizes: label 14/500 and body 16 match, but the app bar title is 20 (22 in Material) and grows to 21 at 640 wide and 23.4 at 1280, no per role tracking (button letter spacing `normal`), no emphasised set. |
| Shape | 2 | Pills and 4dp top field corners are right; dialog 24 (28), FAB 12 (16), menu 8 (4, or 16 Expressive), tooltip 6 (4), sheet 24 (28); no corner scale, no shape morph. |
| State layers and ripple | 2 | Ripple from the touch point exists (`--_button-ripple-x` 12px measured), but during a 600ms hold `:active` stayed false and the layer at 0; it appears at release, hard edged, grows in about 150ms, at 0.12 (0.10 now). Switch pressed growth never shows under touch. |
| Elevation | 1 | Shadows only (menus `0 6px 16px` at 0.1, dialogs two shadows); surfaces are white on a grey page; no tonal levels, no fill change on scroll. |
| Navigation by window size | 1 | The same 4 item bottom bar spans 328, 607 and 1245 px; Rail is not adapted for Android (72 wide, 16px icons, an edge bar indicator) and nothing switches between them. |
| Top app bar | 1 | A 64 tall inset box 16px from the edges, `position: relative`, title a link at 20/400, a hamburger; no flexible, medium or large bar, no scroll fill. |
| Edge to edge and insets (web) | 1 | Viewport meta `width=device-width, initial-scale=1` (no `viewport-fit=cover`, no `interactive-widget`), no `theme-color`, `overscroll-behavior: auto` on html and body. |
| Back gesture | 0 | Browser back with a dialog or a sheet open left the page (URL changed, overlay gone); no history entry, no close watcher, no predictive preview. |
| Text fields | 2 | 56 filled field with a bottom indicator, but filled in white (`bg.surface-3` is #eff1f4 in tokens, white measured on the Neutral page), labels sit above by default; the opt in floating label rises out of the box and stays 13px; a full focus ring and the indicator both show. |
| Bottom sheets | 2 | Handle 32 by 4 in a 60 by 48 target, drags and flicks closed, 640 max at 1280; but no drag from the body, a tap on the handle does nothing, a 14/600 title with a close cross and a two button footer, the first field autofocused with a ring, a blurred navy scrim; no standard (non modal) sheet. |
| Snackbar | 1 | 328 by 70 at y 646 over a bar starting at y 639; white with an icon, a close cross and an outlined action; corner 12. Swipe away works. |
| FAB and FAB menu | 1 | 56 square with corner 12, 16px icon, saturated primary; sits at y 656 on the bar's last item; sizes md and lg are identical; no FAB menu. |
| Buttons and icon buttons | 2 | 40 pills with 14/500 labels; icon buttons are 58 by 40 pills with 16px icons (40 round with 24 in Material); toggle selected is a thick ring; one size scale; split button is a joined rectangle. |
| Selection controls | 3 | Switch, checkbox and radio proportions follow Material, with a 40 state layer; but density "comfortable" makes the track 58.5 by 36, the track colour changes in one step, and the press never shows on touch. |
| Motion | 1 | Sheet, dialog and toast enter in 180ms; tabs and switch 158ms on Neutral's critically damped spring; `ease.emphasized` is `cubic-bezier(0.16, 1, 0.3, 1)`, not Material's; no Material springs, no overshoot, no shape morph. |
| Component coverage | 1 | Missing: FAB menu, docked and floating toolbars, flexible app bars, search bar and view, date and time pickers, carousel, loading indicator, button groups, full screen dialog, standard sheet, rich tooltip; SearchField is broken on Android (a 56 tall inner field inside a 28 tall box). |
| Accessibility | 3 | 48dp targets hold, contrast passes, forced colours handled; against it: snackbar over navigation, focus rings on touch focused fields, autofocus in sheets, long press menus that close when the finger lifts, no back. |
| Platform under other styles | 1 | Liquid on Android draws a floating glass capsule bar, round checkboxes and white pill FABs; Desk draws window lights on the sheet. Recipes beat the platform layer. |
| Material on the web (Neutral at 1440) | 1 | By design it is not Material: 36 tall buttons with corner 8, 13px controls, 28 to 36 tall fields, outlined chips at 13/600. |
| React Native on Android | 0 | Two components (Button, IconButton). |

Average: 1.4 out of 5.

## Detailed comparison

Gap words: same, close, different, missing, wrong (wrong means it breaks a
Material rule or is a defect).

### Colour

- Guidance: roles from tonal palettes; accent roles in container pairs;
  surfaces as a five step container ladder that also carries elevation; three
  contrast levels; dynamic colour from a source.
- System: the contract has `color.bg` body, surface, surface-2 to 5,
  overlays and scrims; `color.primary` fill, fill-hover, fill-pressed, text,
  border, tint, tint-hover, on-surface; `color.state.*` with fill, text,
  border, tints, solids; ten categorical accents. Neutral light: body
  #f4f5f7, surface #ffffff, surface-2 #f8f9fa, surface-3 #eff1f4, inverse
  #0f1729, primary #2563eb, scrim `rgb(15 23 41 / 0.3)`.
- Gap: different. There is a light hierarchy of surfaces, which maps onto the
  container ladder, but there is no second or third accent role, no
  container pair (the tint is an alpha wash, not a tone), no inverse primary
  or inverse on surface, and no way to derive a scheme from a seed. `contrast
  more` exists as an axis, which is close to Material's contrast levels in
  intent.
- Fix: add colour roles to the contract (see proposal a) and a build step
  that generates a scheme from one source colour. The Android platform should
  never set colour; a Material based style fills the roles.

### Type

- Guidance: fixed sp sizes per role, per role tracking and line height, an
  emphasised set, Roboto as both brand and plain typeface.
- System: Inter (`--ds-font-family-sans`), a fluid scale whose max values are
  9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 40, 56 and which shrinks at 360
  (`font.size.xl` renders 14). Android picks steps: buttons 14/500, inputs 16,
  dialog titles 24/400, app bar title `4xl` at 20/400, tab labels 12.
- Gap: close at phone width for body and labels; different for titles (no
  22), for tracking (none), for line height (ratios, not role pairs) and for
  behaviour (the scale grows with the window; Material's does not). The
  gallery's default Android font is Inter, not the device font.
- Fix: type role tokens with fixed size, line height, weight and tracking;
  the Material style uses the platform system font (Roboto on Android without
  shipping a file) or bundled Roboto if the owner approves.

### Shape

- Guidance: an absolute corner scale; each component names a step;
  Expressive adds round or square buttons and corner morph on press and
  selection.
- System: `android.css` builds corners from the style's role radii: dialog
  `radius.card + radius.panel` (24 in Neutral, 42 in Liquid, 0 in Studio),
  FAB `radius.card` (12 Neutral), menu `radius.xs`, but Neutral's recipes win
  and draw the menu at 8.
- Gap: wrong for the dialog, FAB, sheet and menu in Neutral; missing for the
  morph.
- Fix: a `shape.corner.*` scale in the contract (none to extra extra large
  and full) that the platform can read, and a press and selected corner hook
  per button (`--_button-radius-pressed`, `--_button-radius-selected`) that a
  spring can drive.

### State layers and ripple

- Guidance: one layer in the content colour at 0.08, 0.10, 0.10, 0.16; the
  ripple starts under the finger after 150ms, grows from 20 percent of the
  larger side over 450ms with a soft edge, and holds at least 225ms.
- System (`touch-android-neutral-light.json`): the press hook writes the
  touch point (12px, 10px) on `pointerdown`, but the drawing waits for
  `:active`, which in Chromium touch emulation starts only at `touchend`:
  samples at 0, 50, 150, 300 and 600ms of a hold all show opacity 0; at
  release the circle reaches 78 percent of its radius in 60ms and 140 percent
  by 150ms, then fades over about 350ms. Pressed opacity 0.12. A hard edged
  `clip-path` circle. No hover or focus layer on buttons (the press shade is
  off); the switch's 40dp layer and pressed growth never appeared during a
  250ms hold.
- Gap: wrong timing, close shape, old opacity.
- Fix: a pressed state set by the component on `pointerdown` (after a 150ms
  touch delay that cancels on scroll, immediately for mouse and keys) and held
  for at least 225ms; a `state-layer` part and a `ripple` part in the anatomy;
  the ripple grows by `transform: scale` of a radial gradient from the press
  point, which the motion rule allows.

### Elevation

- Guidance: tone first, shadow when needed; six levels.
- System: role named shadows (`elevation.menu`, `dialog`, `card` and so on);
  Neutral menus and dialogs float white on a grey page.
- Gap: different.
- Fix: `elevation.level0` to `level5` shadow tokens next to the role tokens,
  and surface roles per component in the Material style; the app bar fills to
  `surface-container` on scroll.

### Navigation model by window size

- Guidance: bar below 600, bar or collapsed rail to 839, rail from 840, an
  expanded rail from 1200 where it fits; never both.
- System: TabBar on Android is 80 to 93 tall with a 64 by 32 pill (the
  baseline bar; the current bar is 64 with a 56 by 32 indicator), icons 16 at
  `md` and 24 at `lg`, labels 12. At 640 and 1280 wide the same bar spans the
  window (`screens-large.png`). Rail is unchanged on Android: 72 wide, 16px
  icons, 10px labels, a bar on its inline start edge; Sidebar is a pill
  drawer with 56 rows.
- Gap: missing (no adaptive switch), different (bar size, icon size),
  missing (expanded rail, modal rail).
- Fix: a navigation suite component that takes one list of destinations and
  renders bar, rail, expanded rail or modal rail by window class, with the
  current Material sizes and filled or heavier icons for the current item.

### Edge to edge and insets on the web

- Guidance: draw under the system bars, pad with insets; on the web, opt in
  with `viewport-fit=cover` and use `env(safe-area-inset-*)`.
- System: neither the gallery nor the docs opt in; a few components read
  `env()` but resolve to 0; `overscroll-behavior` is `auto`, so a pull at the
  top reloads in Chrome; no `theme-color`.
- Gap: missing.
- Fix: viewport meta with `viewport-fit=cover` and
  `interactive-widget=resizes-content` in the gallery and docs (lead owned
  files), inset tokens (`--ds-inset-block-end` and so on) fed by `env()`, and
  `overscroll-behavior-y: none` on the app root of a phone template.

### Back gesture

- Guidance: back closes the top modal surface first; predictive back previews
  the result while the finger moves.
- System: `page.goBack()` with the md dialog open went from `/c/dialog` to the
  previous page; with a sheet open, the same. On a phone that is the back
  gesture leaving the app.
- Gap: wrong.
- Fix: every modal surface (Dialog, AlertDialog, Sheet, Drawer, menus,
  popovers, the FAB menu) registers a close watcher where the browser has one
  and otherwise pushes a history entry on open and closes on `popstate`. A
  real predictive preview is not possible on the web today (see "What I could
  not check"); on React Native it is.

### Text fields

- Guidance: filled 56 on `surface-container-highest`, the label inside at 16
  that floats to 12 at the top of the box, a 1dp indicator that turns 2dp
  `primary` on focus, no extra ring for a touch focus; outlined with the label
  notched into the outline.
- System: 56dp boxes with a bottom line; in Neutral light the fill renders
  white on the grey page; labels sit above the field unless `floating` is set;
  with `floating`, the label rests inside at 13px and on focus jumps 23.5px
  above the box, still 13px (`fields-1.png`, `touch-overlays.png`); a full 2px
  ring and the indicator both show on focus. Select draws an up and down
  chevron pair. SearchField on Android draws its inner field 56 tall inside a
  28 tall box (`fields-2.png`, measured boxes 28 against 56).
- Gap: different (label), wrong (SearchField), close (heights).
- Fix: floating label inside the input root (component change), 16 to 12 on
  the emphasised curve, no ring when the field was focused by touch, the
  SearchField excluded from the platform field rule and given the 56 search
  bar shape.

### Bottom sheets and snackbars

- Sheets: see the scorecard. The Material behaviours missing are a drag
  from the content at scroll top, handle selection to cycle heights, a
  standard sheet with no scrim, no autofocus, a plain scrim with no blur, and
  the 28 corner. The title bar with a cross and a desktop footer is a
  composition issue the mobile audit already raised.
- Snackbar: on top of the navigation bar in every style
  (`screens-phone.png`), white with an icon and a close cross. Material: above
  the bar and above the FAB, `inverse-surface`, one text action, no icon. The
  Liquid and Desk versions are worse: a glass card and a yellow pill action.

### FAB and its menu

- FAB: right size, wrong corner (12), small icon (16), wrong role (saturated
  primary instead of a primary container), and it covers the "Settings" tab
  (fixed at y 656, bar from y 639). `size="lg"` renders the same 56 as `md`.
- Missing: the FAB menu (which replaces the speed dial), the small, medium and
  large FAB sizes, and the rule that a FAB sits above the bar and the
  snackbar above the FAB.

### Motion

- Guidance: springs, fast spatial for small controls, default spatial for
  sheets and the expanded rail, effects springs for colour and opacity; on
  the web, the published curves.
- System: overlays enter in 180ms (Neutral's `duration.window-open`; the
  contract says 300), the switch thumb and tabs in 158ms on Neutral's
  critically damped spring, the switch track colour in one step, menus 150ms,
  and `ease.emphasized` is `cubic-bezier(0.16, 1, 0.3, 1)`. The platform asks
  for `ease.emphasized` and `duration.window-open`, but the style supplies the
  values, so Android motion is whatever the style says.
- Gap: different. This is the same finding as the interactions audit: too
  short to be seen, and here also not Material's character.
- Fix: platform motion tokens that do not depend on the style (spring tokens
  baked to `linear()` from the stiffness and damping in the reference), and
  the Material style using the expressive scheme.

### Missing components

Against the Material catalogue: FAB menu, docked toolbar, floating toolbar,
flexible app bars (small, medium, large) with scroll behaviour, search bar and
search view, button group (standard with neighbour push, connected), split
button in Material form, loading indicator, Expressive progress (gaps, stop
indicator, wave), carousel, date picker, time picker, full screen dialog,
standard bottom sheet, side sheet as such (Drawer is a full width panel on a
phone), rich tooltip, navigation suite. Badges exist as status pills; the
Material badge (6 dot, 16 count) is close to the dot and count variants.

## Structural recommendation

The owner's words, "android, with google material for web", point at two
things: the system's Android experience, and a Material look that also works
on the web.

### Option 1: a platform variant only (today)

- Case: one axis, works under every style, no new style to keep.
- Cost: it cannot reach Material. Colour roles, tonal elevation, type roles
  and the corner scale are look, which the plan gives to styles, so the
  platform borrows the style's values and lands on 24 instead of 28, white
  instead of a tonal container, Inter instead of the device font. And because
  recipes sit above `ds.platform`, Liquid and Desk erase the Android shapes.
- Verdict: right for behaviour, wrong as the only answer.

### Option 2: a Material based style only

- Case: colour roles, tonal surfaces, the type scale and the corner scale in
  one pack, usable on the web, the closest to "Material for web".
- Cost: a style may not change behaviour, so ripple timing, back, sheet
  gestures, snackbar placement, insets, the navigation suite and haptics
  cannot live there. On iOS the same style would look Material, which may or
  may not be wanted.
- Verdict: necessary for the look, not enough for Android.

### Option 3: both (recommended)

- The platform variant owns behaviour and proportion that do not depend on
  brand: press state and ripple timing, the state layer part, target sizes,
  back handling, edge to edge insets, snackbar and FAB placement, the
  navigation suite by window size, sheet gestures and heights, haptic events,
  the motion scheme (springs) and Material's absolute sizes and corners for
  controls. It reads platform tokens, not style tokens, for those values.
- A Material based style owns look: colour roles from a source colour,
  surface containers, type roles, the corner scale for content surfaces,
  elevation levels, icon weights. It works on the web and on Android.
- Under any other style on Android, users get Android behaviour and that
  style's colour and type; under the Material style on Android, they get the
  whole thing.
- Cost: contract additions (colour roles, shape scale, type roles, state
  opacities, elevation levels, spring tokens, inset tokens), a lead decision on
  the layer order so platform shape and behaviour hooks are not beaten by
  recipes (hook-wiring "Changes needed" item 3 is still open), new component
  parts and props, a new style pack, and the navigation suite and missing
  components. Roughly: one contract order, one platform order, one style order,
  then component orders by priority.
- Naming: the plan names the Apple inspired style `liquid` and forbids Apple
  marks. The same care applies here: "Material" and "Material Design" are
  Google's names. A neutral id such as `tonal` with a description that says it
  follows Google's public Material 3 guidance is safer; the owner decides.

### The web: own components or the official web components

Build on the system's own components and tokens. Do not wrap `@material/web`.

| Factor | Own components | Wrap `@material/web` |
| --- | --- | --- |
| Status | maintained here | maintenance mode, no new features, no Expressive |
| Coverage | everything the system has | no navigation bar, rail, drawer, app bar, sheets, snackbar, tooltip, search, segmented button, date or time picker, card, badge |
| Dependencies | none new | `lit`, `@lit/context`, `tslib`: not on the allow list (HUMAN GATE) |
| Bundle | CSS already shipped | 72.1kb gzip for all, 53.7 for the common set, on top of the system |
| Theming | cascade layers, `data-*` axes, the token contract | shadow DOM; `--md-*` custom properties only; no `--md-ref-palette`; recipes and the anatomy contract cannot reach inside |
| Behaviour | Radix on React, the CDK on Angular, one manifest | a second behaviour layer that conflicts with the plan's decision |
| Accessibility | the system's gates and contract tests | good, but outside the contract suite |
| Tokens | ships 0.10 pressed opacity once updated | ships token version 0.192 (0.12) |

What can be learned from it without copying code: the ripple's state machine
(touch delay, minimum press, soft edge), the focus ring's grow and settle, and
the `--md-sys-*` naming, which a consumer bridge could map onto `--ds-*` for
teams that already theme with Material names.

## Proposal

### (a) Token mapping and contract gaps

Colour, Material role to system token:

| Material role | System token today | Gap |
| --- | --- | --- |
| primary, on-primary | `color.primary.fill`, `color.text.on-primary` | none |
| primary-container, on-primary-container | `color.primary.tint` is an alpha wash | add `color.primary.container`, `color.primary.on-container` |
| secondary, tertiary and their containers | none (accents are categorical) | add `color.secondary.*`, `color.tertiary.*` |
| error, error-container, on-error-container | `color.state.danger.solid`, `tint-20`, `on-tint` | close; add `container` names for parity |
| surface | `color.bg.surface` | none |
| surface-dim, surface-bright | none | add |
| surface-container-lowest to highest | `color.bg.surface` to `surface-5` | close: map in order; document that `surface-N` is a container ladder |
| on-surface, on-surface-variant | `color.text.bright` or `default`, `color.text.muted` | close |
| outline, outline-variant | `color.border.control`, `color.border.subtle` | close |
| inverse-surface, inverse-on-surface, inverse-primary | `color.bg.inverse` only | add `color.text.on-inverse`, `color.primary.on-inverse` |
| scrim | `color.bg.scrim` | value: Material scrims are black at about 32 percent with no blur (the opacity is from memory, unverified; the bottom sheet page says Android sets it) |
| primary-fixed and friends | none | add only if the Material style needs them |

Type, Material role to the nearest `font.size` step at phone width (the
system's sizes are fluid, Material's are fixed):

| Role | Material | System step | Gap |
| --- | --- | --- | --- |
| Display large | 57/64 | `7xl` 56 | close |
| Display medium, small | 45/52, 36/44 | none (40 is `6xl`) | add |
| Headline large | 32/40 | none | add |
| Headline medium, small | 28/36, 24/32 | `5xl` 28, `4xl` 24 | sizes close, line heights missing |
| Title large | 22/28 | none (`3xl` 20) | add |
| Title medium, small | 16/24 500, 14/20 500 | `xl` 16, `l` 14 | tracking missing |
| Body large, medium, small | 16/24, 14/20, 12/16 | `xl`, `l`, `s` | tracking missing |
| Label large, medium, small | 14/20, 12/16, 11/16, 500 | `l`, `s`, `xs` | tracking missing |

Contract gap: a `type.<role>` composite group (size, line height, weight,
tracking, fixed not fluid) with an emphasised weight per role, so a platform
and a style can name roles instead of size steps.

Shape: none 0, extra small 4, small 8, medium 12, large 16, large increased
20, extra large 28, extra large increased 32, extra extra large 48, full. The
contract's `radius` names are roles (`field`, `panel`, `card`, `sheet`), so a
style can fill them, but a platform cannot ask for "28". Gap: add
`shape.corner.none` to `shape.corner.full`.

State: add `opacity.state.hover` 0.08, `focus` 0.10, `pressed` 0.10,
`dragged` 0.16, `disabled-container` 0.12 (0.38 for content exists as
`opacity.disabled`).

Elevation: add `elevation.level0` to `level5` (0, 1, 3, 6, 8, 12dp as shadows
on the web, as elevation on native).

Motion: the contract's `spring` group has stiffness, damping and mass per
named spring. Add `spring.spatial.fast`, `default`, `slow` and
`spring.effects.fast`, `default`, `slow` per motion scheme, with damping as a
ratio (check the build's current unit before mapping), and baked `linear()`
eases and durations for CSS. Map the legacy curves to `ease.standard`
`(0.2, 0, 0, 1)`, `ease.emphasized-decelerate` `(0.05, 0.7, 0.1, 1)`,
`ease.emphasized-accelerate` `(0.3, 0, 0.8, 0.15)`.

Layout: add `breakpoint.compact`, `medium` 600, `expanded` 840, `large` 1200,
`extra-large` 1600, window margins 16 and 24, and inset tokens fed by `env()`.

Platform tokens (the token gap list in `platforms.md`, now with the current
values): button heights 32, 40, 56, 96, 136; field 56; navigation bar 64 with a
56 by 32 indicator; rail 96 or 80; app bar 64, 112, 120; FAB 40, 56, 80, 96
with corners 12, 16, 20, 28.

### (b) Component changes in priority order

1. Button family: press state from `pointerdown`; ripple and state layer
   parts; icon buttons 40 round with 24 icons (today 58 by 40 pills with 16);
   five sizes on Android; round and square shapes with a pressed and selected
   corner morph; toggles change colour and shape when selected, not a ring;
   0.10 pressed.
2. Toast as snackbar on Android: `inverse-surface`, no icon, one text action,
   48 or 68 tall, corner 4, placed above the navigation bar and above a FAB,
   one at a time.
3. FloatingActionButton: corner 16, 24 icon, primary container, real small,
   medium and large sizes, placed above the bar; add a FAB menu.
4. Navigation: a navigation suite over TabBar and Rail with the current bar
   (64, 56 by 32 indicator, 24 icons, filled or heavier current icon) and rail
   (96 or 80, expanded and modal), switching by window class.
5. Navbar as a top app bar on Android: edge to edge, sticky, plain text title
   at 22/28, scroll fill, flexible medium and large titles; no hamburger on
   compact (the bar or a modal rail carries navigation).
6. Sheet: drag from content at scroll top, handle selection cycles heights,
   standard (non modal) variant, corner 28, plain scrim, no autofocus, actions
   in content not a desktop footer on compact.
7. Dialog and AlertDialog: corner 28 from the shape scale, text button
   actions in every style (today Neutral's outlined secondary wins), a full
   screen dialog for forms on compact windows.
8. Field, Input, Select, SearchField: label inside the box by default on
   Android, 16 floating to 12, no ring on touch focus, a single drop down icon
   on Select, SearchField as a 56 search bar (fix the 56 inside 28 defect).
9. Menus: Expressive vertical menu shape (16 corner, 44 rows, grouped with
   gaps) or the baseline 4 corner, chosen by token; hide keyboard hints on
   touch; long press menus stay open after the finger lifts.
10. Slider and progress: handle gap of 6, inner corner 2, stop indicators,
    sizes xs to xl; progress gap of 4 and stop indicator; add the loading
    indicator.
11. Switch, Checkbox, Radio: press shown on touch, track colour on the effects
    spring, sizes not inflated by the comfortable density on Android.
12. Chips, segmented buttons: 32 chips; check icon on selected segments.
13. Tooltip: long press on touch, plain at 12/16 corner 4, rich variant.
14. Lists: 56, 72, 88 rows, Expressive segmented groups, no inline trash
    buttons on touch.
15. New: toolbars (docked and floating), button group, Material split button,
    search view, date and time pickers, carousel, side sheet sizing for the
    Drawer.

### (c) What must change in components, not only CSS

| Need | Component | Hook |
| --- | --- | --- |
| Press under the finger | every pressable | `data-pressed` set on `pointerdown` (150ms delay for touch, cancelled on move or scroll; none for mouse and keys), held at least 225ms, cleared on `pointerup`, `pointercancel`, `pointerleave`; CSS reads it instead of `:active` |
| Ripple origin and growth | Button family, Chip, list rows, nav items, menu items | a `ripple` part (or `::after` contract) with `--_x-press-x`, `-y` and `--_x-ripple-size`, grown by `transform` from 20 percent of the larger side |
| State layer | the same, plus selection controls | a `state-layer` part with opacity from `opacity.state.*` |
| Floating label | Field, Input, Select | `[data-part='label']` inside the input root and `data-filled` on the root |
| Corner morph | Button, IconButton, ToggleButton, SplitButton, ButtonGroup | `--_button-radius-pressed`, `--_button-radius-selected`, driven by a spring |
| Neighbour push | ButtonGroup | `data-pressed` on the item and a width share the group animates |
| Sheet behaviour | Sheet | drag from body when scrolled to top, `onHandleActivate` cycling detents, `modal={false}`, `autoFocus` off by default on touch, max width 640 with 56 margins |
| Back | every modal surface | close watcher or a history entry while open |
| Snackbar placement | Toaster, TabBar, FAB, toolbars | `--ds-inset-bottom-navigation` and `--ds-inset-fab` written by the bar and FAB while mounted; toaster stacks above both; `position="auto"` per platform |
| Window class | Theme | `data-window` (`compact` to `extra-large`) from a resize observer, so CSS and the navigation suite switch without media queries in every file |
| Navigation suite | new | one destination list, renders bar, rail or expanded rail |
| Haptics | shared | `haptic('confirm' | 'reject' | 'tick' | 'toggle' | 'long-press')`: a short `navigator.vibrate` on Android web where supported, Expo Haptics on native, nothing elsewhere; off when the theme says so |
| Insets | Theme, templates | inset tokens from `env()`, with `viewport-fit=cover` in the host page |
| Tooltip on touch | Tooltip | open on a 500ms long press for touch pointers |

### (d) What the demos should show

Phone demo (Pixel size, Android platform, the Material based style and one
other style, light and dark, English and Arabic):
1. Edge to edge under the status bar and the gesture bar, padded by insets.
2. A flexible top app bar that collapses from large to small on scroll and
   fills with `surface-container`.
3. A list with a FAB above a 64dp navigation bar; tapping a row shows the
   ripple from the finger while it is held.
4. Delete a row: a snackbar with Undo rises above the bar and the FAB moves
   up with it, one at a time.
5. The FAB opens a FAB menu; one item opens a full screen dialog form with a
   date picker.
6. A modal bottom sheet at half height that drags from the handle or the
   content, cycles heights on a handle tap, and closes on system back.
7. Search: the search bar expands into a full screen search view.
8. Settings: switches, a slider, segmented buttons; Expressive spring motion
   visible at normal speed.
9. A seed colour picker that regenerates the whole scheme (the dynamic colour
   stand in for the web).
10. Haptic ticks on the switch and the slider on an Android phone.

Large screen demo (tablet and desktop widths, resizing live):
1. A window class badge; at 600 the bar switches to horizontal items or a
   collapsed rail; at 840 a rail and a list detail layout; at 1200 an
   expanded rail.
2. The bottom sheet becomes a side sheet at expanded widths.
3. The snackbar holds one line at the bottom start or centre.
4. Proof: screen recordings on a real Android phone and tablet, the contract
   suite run per window class, and the perception gates from the
   interactions audit.

### (e) React Native on Android

Native gets what the web can only imitate. What it needs:
- Theme objects per platform with the Material roles, type roles, corner scale
  and spring tokens (the token build already writes native themes).
- `Pressable` with `android_ripple` for the ripple and the state layer
  (borderless for icon buttons), `react-native-reanimated` springs with
  stiffness and damping ratio from the tokens, gesture handler sheets with
  detents. All on the allow list.
- `react-native-safe-area-context` for insets (allowed); edge to edge is the
  Android 15 and 16 default for apps targeting them.
- Back: React Native's `BackHandler` for modal surfaces; whether it supports
  the predictive back callback in the Expo version in use is unverified and
  must be checked.
- Haptics through `expo-haptics` (an allowed optional peer); its Android
  specific API names are from memory, unverified.
- Dynamic colour: Android 12 and later expose system colours that native
  code can read; the exact React Native route (`PlatformColor` names) is from
  memory, unverified.
- The system font on Android is Roboto, so no font file is needed.
- Components, in order: Button family, FAB and FAB menu, navigation bar and
  rail, top app bar, snackbar, bottom sheet, dialog and full screen dialog,
  text fields, switch, checkbox, radio, slider, list, chips, search, menu.
  Today there are two.

### (f) Licences and owner decisions

| Item | Licence | URL | Gives | Costs | Decision |
| --- | --- | --- | --- | --- | --- |
| Material Web (`@material/web` 2.5.0) | Apache License 2.0 | https://raw.githubusercontent.com/material-components/material-web/main/LICENSE | ready made components with Material's ripple and focus ring | Lit and two more dependencies, maintenance mode, no Expressive, shadow DOM theming, 72kb | not recommended; owner gate if wanted |
| Roboto | SIL Open Font License 1.1 | https://github.com/google/fonts/blob/main/ofl/roboto/OFL.txt | the Material typeface on every platform | a font file per weight or the variable font (`@fontsource-variable/roboto` 5.3.0, OFL-1.1, not on the font allow list) | owner; the system font on Android needs no file |
| Roboto Flex | SIL Open Font License 1.1 | https://github.com/google/fonts/blob/main/ofl/robotoflex/OFL.txt | width and grade axes for emphasised styles | a large variable file | owner |
| Material Symbols | Apache License 2.0 (the repository LICENSE; the `@fontsource-variable/material-symbols-outlined` package metadata says OFL-1.1, so check the packaged files before use) | https://github.com/google/material-design-icons/blob/master/LICENSE | filled and outlined forms (the bar's current item needs a filled icon), weight, grade and optical size axes, 24dp design grid | a third icon set; the plan fixes two (`pixelarticons`, `lucide-static`) | owner; without it, use Lucide with a heavier stroke for the current item, as Material allows |
| `@material/material-color-utilities` 0.4.0 | Apache License 2.0 | https://www.npmjs.com/package/@material/material-color-utilities | the HCT colour space and scheme generation for dynamic colour | not on the dev or runtime list | owner; at build time only, or write the algorithm |

Also for the owner:
- Approve option 3 and the new style pack (it is a new look, so it starts
  "proposed").
- The style id and wording that avoid presenting the system as a Google
  product.
- Contract additions in `docs/contracts/` and the layer decision (lead
  owned).
- Whether Android under other styles keeps the style's motion (today) or
  switches to Material springs.
- Whether the gallery's automatic "comfortable" density on touch should apply
  to Android, since it inflates Material's sizes by 4px.

## The ten changes that matter most

1. Press under the finger: a pressed state from `pointerdown` with Material's
   touch delay and minimum press, and a soft edged ripple that grows from the
   touch point over about 450ms. Today nothing shows until the finger lifts.
2. Back closes overlays: every modal surface takes the system back gesture
   (close watcher or history entry) instead of leaving the page.
3. Snackbar and FAB placement: snackbar above the navigation bar and above the
   FAB, the FAB above the bar, one snackbar at a time, inverse surface, no
   icon.
4. Colour roles in the contract and a scheme generated from a source colour:
   primary, secondary, tertiary with containers, the surface container ladder,
   inverse roles.
5. A navigation suite: the current 64dp bar with a 56 by 32 indicator and 24dp
   icons on compact windows, a rail from 840, an expanded rail from 1200.
6. The corner scale and Material's absolute control sizes in platform tokens,
   with the layer decision that stops style recipes from erasing them (Liquid's
   capsule bar and round checks on Android today).
7. The top app bar: edge to edge with `viewport-fit=cover` and insets, sticky,
   a plain 22/28 title, scroll fill, flexible collapsing titles.
8. Text fields: label inside the box by default, 16 to 12, no ring on touch
   focus, the SearchField defect fixed, a 56 search bar.
9. Motion on Material springs: fast spatial for controls, default spatial for
   sheets, effects for colour, baked to `linear()` from the reference values;
   no 158ms and 180ms changes.
10. Expressive components that carry the feel: five button sizes with corner
    morph, FAB menu, button groups, floating toolbar, loading indicator, full
    screen dialog, standard bottom sheet.

## What I could not check

- Real Android hardware: Chrome's edge to edge chin, the gesture bar, the
  keyboard, haptics (`navigator.vibrate`) and the timing of `:active` under a
  real finger. The ripple delay was measured in Chromium touch emulation; a
  real device may light `:active` sooner during a hold, but nothing in the
  code sets a pressed state on `pointerdown`.
- Predictive back for web pages in Chrome on Android: I found no current
  Chrome documentation (one guessed URL returned 404). Whether Chrome sends the
  back gesture to a page's close watcher is from memory, unverified.
- Values shown only in images on the Material site: toolbar measurements
  beyond the 64dp height and 16dp padding stated in text, the bottom sheet
  scrim opacity (the page says Android sets it; 32 percent is from memory),
  and transition pattern timings.
- Material's own pages render the token tables in collapsed widgets; I read
  the values from the token database files those widgets load, with the public
  `3p` context. Where Google first party values differ (for example tracking
  0 for Google Sans), I used the public ones.
- Dynamic colour from a wallpaper is an Android system feature; on the web
  only a seed colour picker can stand in. Not built or measured.
- Angular on Android (no phone components) and React Native (two components).
- Studio on Android; Liquid and Desk were seen on the six screens and the
  component sheets, not measured in detail.
- The long press context menu closed when the finger lifted in emulation;
  this may be an emulation artifact and needs a device check.
- Whether Neutral's white filled field comes from a recipe or from the
  platform reading `bg.surface-3` against a different page token was not
  traced to the line.
