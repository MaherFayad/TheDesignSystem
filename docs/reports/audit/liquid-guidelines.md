# Liquid against the vendor's glass guidance and its real components

Status: analysis only. No source file was changed. Date: 2026-11-15.
Evidence: `docs/reports/audit/shots/liquid/` (contact sheets in `sheets/`,
measurements in `data/`). Scope: the `liquid` style on phone (`platform=ios`,
393 wide, touch) and desktop (`platform=web`, 1440 wide), light and dark, over
a plain page and over a busy colourful backdrop; the vendor's written guidance;
its framework components on phone, tablet and desktop; and what the vendor
itself ships on the web.

## Verdict

Liquid is a good frosted style and a weak copy of the platform's glass
material. The material itself is honest and legible: every glass surface
measures 4.5:1 or better for text over a white, a black and five saturated
backdrops, and every accessibility mode falls back to a solid surface. It is
also already as strong as what the vendor ships on its own web pages, which use
the same `blur` plus `saturate` recipe and no refraction at all. What is
missing is the part that makes the platform's version feel like glass and not
like frosted plastic: the fill is fixed at 84 percent (light) and 90 percent
(dark) because nothing adapts to what is behind it, so the glass hides the
content it is meant to let through; there is no lensing at the edges, no light
that moves, no switch between light and dark glass by backdrop. The bigger gap
is structure, not optics. On a phone, the top bar is a web header with an
underlined link, the toolbar is one long capsule instead of grouped capsules,
the tab bar does not shrink, there is no search tab, sheets are flush to the
screen edge with a desktop footer, popovers float on a phone, menus show
keyboard shortcuts on touch, and nothing grows out of the control that opened
it. On a desktop, the window body is glass (content, which the guidance
forbids), the window controls sit at the trailing end, the sidebar is a solid
card, and there is no unified toolbar, inspector, table, outline view or
settings window. To reach the platform's level the work is about 30 percent
material tokens and 70 percent component structure and behaviour: an adaptive
material with a thinner fill, grouped and shrinking bars, a navigation bar with
a large title, inset sheets, overlays that morph out of their source, a
concentric radius rule in the contract, and a desktop form with its own parts.

## Sources

All vendor pages were fetched on 2026-11-15 through the documentation JSON
endpoints (`developer.apple.com/tutorials/data/<path>.json`), which hold the
same text the client renders. The date is the latest entry in each page's own
change log; "none" means the page has no change log. Framework symbols state
the release that introduced them.

| URL | Title | Date or version stated | Status |
| --- | --- | --- | --- |
| https://developer.apple.com/design/human-interface-guidelines/materials | Materials | 2025-09-09, updated for the glass material | fetched |
| https://developer.apple.com/design/human-interface-guidelines/color | Color (section Liquid Glass color) | 2025-12-16 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/typography | Typography | 2025-12-16 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/layout | Layout | 2026-09-09 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/icons | Icons | 2025-06-09 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/app-icons | App icons | 2026-10-28 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/motion | Motion | 2025-09-09, added guidance for the glass material | fetched |
| https://developer.apple.com/design/human-interface-guidelines/accessibility | Accessibility | 2025-06-09 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/dark-mode | Dark Mode | 2024-08-06 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/design-principles | Design principles | 2026-06-08 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/toolbars | Toolbars (includes the navigation bar) | 2025-12-16 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/tab-bars | Tab bars | 2026-06-08 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/sidebars | Sidebars | 2026-06-08 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/search-fields | Search fields | 2026-06-08 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/searching | Searching | 2026-06-08 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/scroll-views | Scroll views (scroll edge effects) | 2026-06-08 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/sheets | Sheets | 2026-03-24 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/popovers | Popovers | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/alerts | Alerts | 2024-02-02 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/action-sheets | Action sheets | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/menus | Menus | 2026-06-08 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/context-menus | Context menus | 2023-12-05 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/edit-menus | Edit menus | 2023-06-21 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/buttons | Buttons | 2025-12-16, updated for the glass material | fetched |
| https://developer.apple.com/design/human-interface-guidelines/toggles | Toggles | 2024-03-29 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/sliders | Sliders | 2023-06-21 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/segmented-controls | Segmented controls | 2023-06-21 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/pickers | Pickers | 2023-06-05 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/steppers | Steppers | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/page-controls | Page controls | 2023-06-21 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/progress-indicators | Progress indicators | 2023-09-12 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/gauges | Gauges | 2022-09-23 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/disclosure-controls | Disclosure controls | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/labels | Labels | 2023-06-05 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/text-fields | Text fields | 2023-06-05 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/lists-and-tables | Lists and tables | 2023-06-21 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/activity-views | Activity views (share sheet) | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/windows | Windows | 2025-06-09 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/panels | Panels | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/split-views | Split views | 2025-06-09 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/tab-views | Tab views | 2023-06-05 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/the-menu-bar | The menu bar | 2025-06-09 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/dock-menus | Dock menus | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/designing-for-macos | Designing for macOS | 2026-10-28 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/pointing-devices | Pointing devices | 2026-10-28 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/focus-and-selection | Focus and selection | 2023-10-24 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/keyboards | Keyboards | 2025-06-09 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/settings | Settings | 2024-06-10 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons | Pop-up buttons | 2023-10-24 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons | Pull-down buttons | 2022-09-14 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/combo-boxes | Combo boxes | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/color-wells | Color wells | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/path-controls | Path controls | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/token-fields | Token fields | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/outline-views | Outline views | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/column-views | Column views | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/boxes | Boxes | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/image-wells | Image wells | none | fetched |
| https://developer.apple.com/design/human-interface-guidelines/gestures | Gestures | 2026-10-28 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/modality | Modality | 2023-12-05 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/playing-haptics | Playing haptics | 2024-05-07 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/going-full-screen | Going full screen | 2025-06-09 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo | Designing for iPhone Duo | 2026-09-09, new page | fetched |
| https://developer.apple.com/design/human-interface-guidelines/widgets | Widgets | 2026-10-13 | fetched |
| https://developer.apple.com/design/human-interface-guidelines/notifications | Notifications | 2023-10-24 | fetched |
| https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass | Adopting Liquid Glass | article, no date; covers the 26 releases | fetched |
| https://developer.apple.com/documentation/technologyoverviews/liquid-glass | Liquid Glass (overview) | no date | fetched |
| https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views | Applying Liquid Glass to custom views | article | fetched |
| https://developer.apple.com/documentation/swiftui/landmarks-building-an-app-with-liquid-glass | Landmarks: Building an app with Liquid Glass | sample, release 27.0 | fetched |
| https://developer.apple.com/documentation/swiftui/glass | Glass (regular, clear, identity, tint, interactive) | release 26.0 | fetched |
| https://developer.apple.com/documentation/swiftui/glasseffectcontainer | GlassEffectContainer | release 26.0 | fetched |
| https://developer.apple.com/documentation/swiftui/glasseffecttransition | GlassEffectTransition (matchedGeometry, materialize) | release 26.0 | fetched |
| https://developer.apple.com/documentation/swiftui/view/glasseffectunion(id:namespace:) | glassEffectUnion | release 26.0 | fetched |
| https://developer.apple.com/documentation/swiftui/concentricrectangle | ConcentricRectangle | release 26.0 | fetched |
| https://developer.apple.com/documentation/swiftui/scrolledgeeffectstyle | ScrollEdgeEffectStyle (automatic, hard, soft) | release 26.0 | fetched |
| https://developer.apple.com/documentation/swiftui/tabbarminimizebehavior | TabBarMinimizeBehavior | release 26.0 | fetched |
| https://developer.apple.com/documentation/swiftui/view/backgroundextensioneffect() | backgroundExtensionEffect | release 26.0 | fetched |
| https://developer.apple.com/documentation/swiftui/toolbarspacer | ToolbarSpacer | release 26.0 | fetched |
| https://developer.apple.com/documentation/uikit/uiglasseffect | UIGlassEffect | release 26.0 | fetched |
| https://developer.apple.com/documentation/appkit/nsglasseffectview | NSGlassEffectView | release 26.0 | fetched |
| https://developer.apple.com/documentation/uikit/uiscrolledgeeffect | UIScrollEdgeEffect | release 26.0 | fetched |
| https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ | WebKit Features in Safari 26.0 | Safari 26.0 | fetched |
| https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/ | News from WWDC25: web technology in Safari 26 beta | 2025 | fetched |
| https://bugs.webkit.org/show_bug.cgi?id=245510 | backdrop-filter: url(#svg) does not work with feDisplacementMap | status NEW | fetched (REST search) |
| https://bugzilla.mozilla.org/show_bug.cgi?id=1961378 | backdrop-filter ignored when an SVG url filter falls back to a blob image | status NEW | fetched (REST search) |
| https://github.com/mdn/browser-compat-data (css/properties/backdrop-filter, filter, corner-shape, anchor-name, animation-timeline, at-rules/media, view-transition, starting-style, types/color) | MDN browser compat data | main branch on 2026-11-15 | fetched |
| https://github.com/Fyrd/caniuse (css-backdrop-filter) | Can I use data | Chrome 160, Safari 27.3, Firefox 163 | fetched |
| https://www.apple.com/ | Vendor main site, global navigation | live | measured in headless Chromium |
| https://music.apple.com/us/new | Vendor music web player | live | measured |
| https://apps.apple.com/us/iphone/today | Vendor app marketplace web pages | live | measured |
| https://tv.apple.com/ | Vendor TV web player (signed out) | live | measured |
| https://www.icloud.com/ | Vendor cloud web apps (sign in page only) | live | measured |
| https://developer.apple.com/design/human-interface-guidelines/materials | Vendor documentation chrome | live | measured |

Searched for and not found: any vendor guidance on rendering the glass
material on the web or in CSS (webkit.org search for "glass" returned no post
about it; the Safari 26 notes add `contrast-color()`, anchor positioning and
scroll driven animations, which help, but say nothing about the material).

Unverified, from memory, marked where used: the current alert shape on phones
(rounder glass panel with capsule buttons), the desktop window corner radius
and toolbar height, the share sheet layout. The written guidance gives no
numbers for these and their figures were not measured.

## The rules, as a compact reference

Numbers come from the guidance text where it gives them, from its figures
where marked "figure" (measured in a scratch folder, see
`data/vendor-figures.json`, proportions of a 402 point wide phone), and from
the framework symbols otherwise. The guidance publishes no blur radius, no
saturation and no fill opacity; those are system internals.

### Where the material goes

1. The material is the control and navigation layer only: tab bars,
   toolbars, sidebars, sheets, popovers, menus, alerts and controls. It floats
   above content; content scrolls and peeks under it.
2. Never in the content layer. Content backgrounds use the standard materials
   (ultra thin, thin, regular, thick) or solid colour. The one exception: a
   control in content with a transient interactive part (slider and toggle
   knobs) turns into glass while it is touched.
3. Use it sparingly on custom controls; standard components pick it up
   automatically. Glass never sits on glass: do not overlap or layer glass
   elements.
4. Two variants: regular (blurs and adjusts luminosity, default, for text
   heavy parts such as alerts, sidebars, popovers) and clear (highly
   translucent, only over photos and video). Over bright content clear glass
   takes a 35 percent dark dimming layer; over dark content or media with its
   own dimming, none.
5. A third value, identity, turns the effect off; a tint makes "stained"
   glass for emphasis; an interactive flag makes it react to touch and pointer.

### Layers

| Layer | What | Material |
| --- | --- | --- |
| Content | lists, cards, media, app background | solid or standard materials |
| Scroll edge | a blur and fade of content under floating controls, one per pane, automatic, soft or hard style | not a material, not decorative |
| Controls and navigation | bars, sidebars, inspectors, floating buttons, tab bar | glass, regular by default |
| Overlays | menus, popovers, sheets, alerts, action sheets | glass; a sheet at full height turns more opaque |
| Background extension | content mirrored and blurred under a sidebar or inspector | a blur of content, not glass |

### Optics (behaviour, no published numbers)

- Blurs and adjusts the luminosity of what is behind; reflects colour and light
  of surrounding content; reacts to touch and pointer in real time.
- No colour of its own: it takes colour from content. Small elements (toolbars,
  tab bars) switch between a light and a dark look by what is behind them,
  and their symbols and text go monochrome, dark over light content and light
  over dark. Large elements (sidebars) are more opaque.
- Colour on glass is for one prominent action (the accent goes on the
  background of a prominent button), never on several controls, and not the
  same hue as the content under it.
- Touch gives a stronger reaction than a trackpad.

### Shape

- Capsules and circles for controls; "rounder forms" that nestle into the
  corners of windows and displays.
- Concentric corners: an inner corner shares the centre of its container's
  corner, so inner radius equals outer radius minus the inset, with a minimum
  so far corners do not go square. System sheets and popovers do this
  automatically; bar items are concentric with the bar.
- Sheets have a larger radius; a half sheet is inset from the screen edge and
  its bottom corners follow the display (figure: about 5 pt inset, about 34 pt
  top corners).
- Sections in lists and forms have a larger radius and larger row height and
  padding than before; section headers are title case, no longer all caps.

### Sizes and type

| | Phone and tablet | Desktop |
| --- | --- | --- |
| Default control size | 44 by 44 pt | 28 by 28 pt |
| Minimum control size | 28 by 28 pt | 20 by 20 pt |
| Padding around a bezelled control | about 12 pt | about 12 pt |
| Padding around a bare symbol | about 24 pt | about 24 pt |
| Default text size | 17 pt | 13 pt |
| Minimum text size | 11 pt | 10 pt |
| Type ramp (default) | large title 34, title 1 28, title 2 22, title 3 20, headline 17 semibold, body 17, callout 16, subhead 15, footnote 13, caption 12 and 11 | large title 26, title 1 22, title 2 17, title 3 15, headline 13 bold, body 13, callout 12, subhead 11, footnote and captions 10 |
| Weights | regular to bold; avoid ultralight, thin, light | same |
| Contrast | 4.5:1 minimum, 7:1 for small custom text | same |
| Tab bar (figure) | about 62 pt tall, 86 percent of the width, inset about 27 pt; current item a lens capsule inset about 4 pt | not used |
| Top toolbar groups (figure) | capsules about 49 pt tall, inset about 28 pt from the edges | in the window frame, items without bezels |
| Extra large control size | new option for buttons | new option |

### Bars and navigation

- Top toolbar (the navigation bar on phones): title, a circular Back button
  with the standard symbol and no "Back" text, actions as borderless symbols in
  capsule groups. Leading: back and sidebar toggle, then title; centre: common
  controls; trailing: inspector toggles, search, the More menu, and one
  prominent primary action such as Done. At most about three groups. Text
  buttons and symbol buttons never share a group. Large title on phones that
  turns into the standard title on scroll and back at the top.
- Toolbar items hide as whole items; the system moves overflow into a menu on
  tablet and desktop.
- Tab bar: floats over content at the bottom of the phone screen, filled
  symbols with one word labels, a red badge for critical news, never hidden,
  never disabled, five or fewer tabs. It can minimise on scroll down or up
  (the current tab becomes a circle at the leading corner, an accessory such
  as a mini player moves inline), and expands on scroll back or a tap. A
  search tab sits apart at the trailing end. On tablets it sits at the top and
  can turn into a sidebar.
- Search on phones: a search tab (standard or button look), a field in a
  bottom toolbar that slides up above the keyboard, a toolbar button at the
  top, or inline above a list. On tablet and desktop: trailing end of the
  toolbar, or top of the sidebar.
- Sidebar: floats as glass over content in a split view; content extends
  under it by scrolling or by the background extension effect; at most two
  levels; icons in the accent colour; desktop sizes small, medium and large
  follow a system setting.
- Inspector: a trailing column of a split view, also glass, with its own
  toggle in the toolbar.

### Overlays

- Sheets: one at a time; Cancel at the leading edge of the sheet's top bar,
  Done at the trailing edge, never Cancel, Done and Back together; medium and
  large detents with a grabber that drags and taps through detents; swipe down
  to dismiss, with an action sheet to confirm unsaved changes; a circular
  close button at the top leading corner in the figures. Desktop sheets are
  cards that float on the parent window and dim it.
- Popovers: tablet and desktop only; on a compact phone use a sheet. The arrow
  points at the source; one at a time; nothing over it but an alert; resize it
  with animation; on desktop it can detach into a panel.
- Action sheets now originate from the control that triggered them, not from
  the bottom edge, and leave the rest of the interface usable. Destructive
  choices at the top, Cancel at the bottom, no scrolling.
- Menus: glass; common actions carry icons, all items of a group or none; on
  phones three layouts (small: a row of four icons on top; medium: a row of
  three icons with labels; large: a plain list). Buttons morph into the menus
  and popovers they open.
- Context menus: long press on phones, secondary click on desktop; a preview
  of the item lifts out of the content and the screen dims; the first actions
  match the row's swipe actions; destructive items last.
- Alerts: rare; default button trailing in a row or top of a stack; Cancel
  never default; destructive style only for actions people did not choose.

### Motion

- System components carry their own motion. Custom motion is brief, precise,
  optional, cancellable, follows the gesture, and is avoided on frequent
  interactions.
- Controls "come to life" when touched: slider and toggle knobs turn into
  glass while held; buttons morph into menus and popovers.
- Glass shapes within a container blend when they come within the container's
  spacing and morph apart or together as they move (matched geometry); far
  apart ones use a materialise transition. Both do more than fade.
- No published durations or springs.
- Reduce Motion: replace movement with fades, remove zoom and scale, keep
  meaning.

### Accessibility modes

- Reduce Transparency and Increase Contrast change or remove the effects;
  people can also pick a preferred look for the material in system settings.
- Increase Contrast needs a higher contrast colour for every custom colour,
  in light and dark.
- Reduce Motion removes the fluid morphing.

### Desktop conventions

- Window: a frame (title bar and toolbar, rarely a bottom bar) and a body.
  Close, minimise and zoom at the leading top; coloured only on the key
  window, grey on others; inactive windows drop their materials. Rounder
  corners. No custom window frames or controls.
- Toolbar in the frame, unified with the title, items without bezels; every
  toolbar command also in the menu bar; customisable on tablet and desktop.
- Menu bar: the app menu then File, Edit, View, Window, Help in the standard
  order with standard shortcuts; one word titles; items stay visible and
  disable instead of hiding.
- Settings: opened from the app menu with Command and comma; a toolbar of
  panes that stays visible, title follows the pane, minimise and zoom dimmed,
  last pane restored.
- Panels: float over the window for inspectors and adjustments; small title
  bar; hidden when the app is inactive; HUD style only for media.
- Controls in the body only, not in the frame: switches for emphasis,
  checkboxes (square, with a mixed state) for hierarchies of settings, radio
  buttons for two to five choices, push buttons with an ellipsis when they open
  another view, help buttons, square buttons under a list.
- Tables sort by column header click, resize columns, may alternate row
  colours; outline views for hierarchy.
- Focus: a ring around text and search fields, a highlight in lists; full
  keyboard access reaches every control; standard shortcuts.
- Pointer: hover reveals hidden or minimised controls; on tablets a glass
  highlight shape materialises under the pointer.
- Do not put critical controls at the bottom of a window or a sidebar.
- New in October 2026: touch on Mac displays. Larger tap targets and controls
  that expand on touch, while size and density stay tuned for pointer and
  keyboard.

## What the vendor ships on the web

Measured on 2026-11-15 in headless Chromium at 1440 by 900 and on a 393 wide
phone with touch (`data/vendor-web.json`; screenshots kept only in a scratch
folder).

| Surface | Material | Shape | Notes |
| --- | --- | --- | --- |
| Main site global navigation | `saturate(1.8) blur(20px)`, white at 80 percent | full width bar, 44 tall (48 on phone), square | its open menu dims the page with `blur(20px)` over grey at 40 percent |
| Music web player sidebar | `saturate(2.2) blur(16px)`, `#f5f5f7` at 55 percent | 260 wide, full height, attached, square | on the phone the same material is the 52 tall top bar |
| Music web player mini player (phone) | same, 55 percent | floating capsule 369 by 52, inset 12, `radius: 1000px`, shadow `0 10px 40px` black at 10 percent | the web's nearest thing to a floating glass tab bar |
| Music web player small round buttons | `saturate(1.6) blur(60px)`, grey 40 percent | 30 circle | over artwork |
| Music web player shelf arrows, volume | `saturate(1.9 to 2) blur(60px)`, white 48 to 60 percent | capsules | |
| App marketplace "get" capsules over art | `saturate(1.8) blur(10px)`, white at 25 percent | capsule 64 by 32 | the web form of clear glass |
| App marketplace text protection on art | `blur(34px) brightness(0.95) saturate(1.6) contrast(1.1)` with black 18 percent | square band under text | a legibility layer, not a control |
| TV web player, cloud sign in, developer documentation | none at load | | plain surfaces |

Across all six: no SVG filter of any kind, no displacement, no edge
highlight, no specular light, no adaptive light and dark switch. Transitions
are 100 to 320ms eases (`0.1s ease-in`, `0.32s cubic-bezier(0.4, ...)`), no
springs. Body text 17px on marketing and documentation pages, 13px in the
web apps, which mirror the desktop type ramp (12, 13, 15, 17 bold, 34 bold).
Font stacks name the vendor's own font first and fall back to
`-apple-system` and `system-ui`; the system's `system-ui` first stack draws the
same font on the vendor's devices without naming it.

What this proves: on the web the vendor ships frosted bars and capsules, not
the full material. Liquid already matches or exceeds that on every surface.

## The system as measured

From `data/measure.json` and `data/modes.json` (light scheme quoted; dark
holds the same geometry).

| Part | Phone (ios) | Desktop (web) |
| --- | --- | --- |
| Glass fill, regular | white `#fbfbfd` at 84 percent (dark `#1e1e22` at 90) | same |
| Glass fill, strong (dialogs, sheets) | 92 percent (dark 94) | same |
| Filter | `blur(20px) saturate(1.8)`; strong `blur(32px)`; window `blur(24px)` | same |
| Edge | inset 1px white at 90 percent top and start, 1px black at 8 percent outside | same |
| Shadow | two layers, up to `0 14px 40px` at 14 percent (menus) and `0 24px 64px` at 18 percent (dialogs) | same |
| Lens (selected tab, segment, held thumb) | white 62 percent, `brightness(1.12) saturate(1.6)`, 1px white rim | same |
| Font | `system-ui` stack; body 15, controls 16 (ios) | body 15, controls 14 |
| Button | capsule 44 tall, 16px label 600 | capsule 36 tall, 14px label 600 |
| IconButton icon | 16 in a 44 circle | 16 in a 36 circle |
| Tab bar | capsule 337 by 59 (86 percent of 393), pad 4, icons 16 | 372 by 61 |
| Toolbar | one capsule 355 by 40, icons 16, separators inside | 375 by 42 |
| Navbar | rectangle 361 by 50, glass, radius 0, title a link | 1404 by 56 |
| Menu | 250 wide, radius 22, pad 6, rows 44 at 16px, row radius 16 | 231 wide, rows 14px |
| Popover | 240 wide, radius 22, pad 18 | 240, pad 14 |
| Dialog and alert | 270 wide, radius 24, title 16 semibold, hairline split footer 45 tall | 360 wide, capsule buttons in a 16 padded footer |
| Sheet | 393 wide, flush to the edges, radius 28 top only, title 14 semibold, grabber 36 by 5 | 640 wide, title 16 |
| Segmented control | track radius 12, pad 2, segment radius 9 (ios) | capsule track, capsule segment |
| Switch | 76 by 44 target, capsule thumb 40 by 27 | 32 by 16 track, 18 by 12 thumb |
| Slider | 4px track, 44 thumb target | 2px track, 24 thumb |
| SearchField | root 28 tall, inner field 44 | 28 tall |
| Input | 44 tall, radius 12, solid white | 28 tall |
| Sidebar | solid white, 260 wide, selected row grey with a start accent bar | same |
| Window | glass body at 84 percent, radius 24, 36 tall title bar, zoom and close at the trailing end | same |
| Dock | glass, radius 22 (not a capsule) | 401 by 64 |
| Menubar | glass at 88 percent, 36 tall, square | same |

Accessibility modes (CDP media emulation, phone): under reduced
transparency and more contrast every bar, menu, popover and dialog loses its
filter and takes the solid `#f7f7fa`; the dialog backdrop becomes a plain
scrim; under forced colours surfaces become `Canvas` with `CanvasText`
borders; under reduced motion no animation runs on open
(`sheets/accessibility-modes.png`). Caveat: Safari does not support
`prefers-reduced-transparency` (MDN data: Chrome 118, Safari no, Firefox
behind a flag), so on the vendor's own devices the system setting never
reaches the page; only `prefers-contrast` (Safari 14.1) does.

Open motion (phone): the menu grows from scale 0.4 at its top start corner,
which is the trigger's corner, with a clip, over 496ms on the spring curve,
rows following over 375ms; the popover grows from its arrow tip; the dialog
settles from scale 1.15 in the centre over 496ms; the sheet slides up from the
bottom edge. Nothing starts from the trigger's own shape and size, and the
trigger does not change when its panel opens.

Contrast (`data/contrast.txt`; backdrop pushed through `saturate(1.8)`
first, then the fill composited, worst of white, black, yellow, red, green,
cyan, blue and mid grey):

| Fill | Default text | Muted text | Tint text |
| --- | --- | --- | --- |
| Light regular, 84 percent | 11.22 (over black) | 5.88 | 4.67 |
| Dark regular, 90 percent | 10.46 (over white) | 6.02 | 5.56 |
| Clear with the 40 percent dim, white text | 4.85 light, 5.09 dark (over white) | | |
| Clear without the dim, white text | 2.01 (over white), 2.85 (over yellow) | | |
| Light regular at 60 percent, fixed | 5.73 | 3.00, fails | |
| Adaptive light or dark at 60 percent, switch at backdrop luminance 0.14 | 9.34 | 4.90 | |
| Adaptive at 50 percent | 8.11 | 4.25, fails for muted | |

The fixed glass must stay at 84 and 90 percent because it has to survive the
opposite extreme. Adaptive switching, the way the platform's small bars work,
lets the fill drop to 60 percent and keep muted text above 4.5:1. That is the
single biggest step toward glass that looks like glass.

## Scorecard (0 to 5)

| Area | Score | Evidence |
| --- | --- | --- |
| Material placement | 3 | Bars, menus, overlays are glass and content is solid, but the Window body is glass (`window` 84 percent fill) and the sidebar, which should float as glass, is a solid card. |
| Optical properties | 2 | Blur, saturation, top edge line and shadow only; 84 percent fill reads as frosted plastic; no lensing, no moving light. |
| Adaptivity | 1 | No light and dark switch by backdrop, no monochrome symbols on bars, tint only through saturation; the `tinted` level is a fixed blue cast. |
| Shape and concentricity | 3 | Capsules, menu 22 with 6 padding and 16 rows; but dialog 24 with 22 radius capsules in 16 padding, segment 9 in a 12 track with 2 padding, flush sheet, dock at 22. |
| Phone bars and navigation | 2 | Floating capsule tab bar at the right proportion; navbar is a web header with an underlined link; toolbar is one capsule, not groups; no large title, no back button, no minimise, no search tab, 16px icons. |
| Overlays | 2 | Menus close; sheet flush with a desktop footer and a 14px title; alert in the previous generation's shape; popover floats on a phone; menus list keyboard shortcuts on touch. |
| Motion | 2 | Springs exist and menus scale from the trigger corner, but no morph from the control, bars never shrink, sheets slide from the edge. |
| Type | 2 | Body 15 on both forms; the phone wants 17, the desktop 13; sheet title 14. |
| Control sizes | 3 | 44 on phone holds; desktop 36 is a web size, the platform's desktop default is 28; search field root is 28 on a phone. |
| Legibility | 4 | Every measured pair passes; paid for with opacity. |
| Accessibility modes | 4 | All fallbacks correct; reduced transparency cannot reach Safari pages; no user choice of glass look. |
| Desktop form | 1 | Window with glass body and trailing controls, no unified toolbar, no floating sidebar, no inspector, table, outline view or settings window. |
| Web fidelity (against the vendor's own web) | 4 | Same recipe as the vendor's sites, plus edge, shadow and lens; the vendor ships less. |

## Component inventory and verdicts

Verdicts: **matches**, **close**, **different**, **squeezed** (a form from
another platform scaled down), **missing**. "Liquid" means
`style=liquid`; "ios" means `platform=ios` on top of it.

### Phone and tablet

| Vendor component (phone, tablet form) | Liquid nearest (and on ios) | Verdict |
| --- | --- | --- |
| Top toolbar (navigation bar): floating capsule groups, title, circular back | Navbar: glass rectangle 50 tall, underlined link title, menu button | different |
| Large title that collapses on scroll | none | missing |
| Navigation stack with back and edge swipe | none | missing |
| Bottom toolbar with grouped capsules and fixed spacers | Toolbar: one capsule, inner separators, outlined on item | different |
| Prominent primary action (Done) tinted in the toolbar | Button solid in a toolbar, not styled for it | different |
| Tab bar floating over content | TabBar floating capsule, lens on the current item | close (icons 16 not filled, 59 tall) |
| Tab bar minimised on scroll with an inline accessory | none | missing |
| Search tab at the trailing end, standard and button looks | none | missing |
| Tab bar that adapts into a sidebar (tablet) | none | missing |
| Search field in a bottom toolbar that slides above the keyboard | SearchField: a form input | squeezed |
| Scope bar and search tokens | SegmentedControl, Chip, TagField | close |
| Sheet with medium and large detents, inset at medium, grabber, circular close, more opaque at full | Sheet: detents and drag, flush, 28 top only, cross plus footer | squeezed |
| Nonmodal sheet | none (Sheet is modal) | missing |
| Full screen modal | none | missing |
| Page and form sheets (tablet) | Dialog | close |
| Alert | AlertDialog on ios: 270 wide, hairline split actions | close to the previous generation; current shape unverified |
| Action sheet or confirmation dialog from its source | none; DropdownMenu stands in | missing |
| Pull down menu with small, medium and large layouts | DropdownMenu: 250 wide, 44 rows, icons, shortcuts shown on touch | close (layouts missing) |
| Context menu with a lifted preview and dimmed screen | ContextMenu on long press, no preview | squeezed |
| Edit menu | none | missing |
| Popover (tablet), sheet on a compact phone | Popover on both | close on tablet, wrong on phone |
| Wheel picker | none | missing |
| Date picker (compact, inline, wheels) | none | missing |
| Colour picker | none | missing |
| Pop up button and menu picker | Select: floating listbox | different |
| List, grouped inset, larger section radius and rows | List `variant="inset"`, 44 rows on ios | close |
| Swipe actions on rows | none | missing |
| Pull to refresh | none | missing |
| Section header and footer | none | missing |
| Toggle (switch) whose knob turns to glass while held | Switch with a lens thumb that stretches | matches |
| Slider whose thumb turns to glass while held | Slider with a lens thumb | close |
| Stepper (minus and plus) | NumberField steppers; Stepper is a step indicator | squeezed |
| Segmented control with a glass segment | SegmentedControl with a lens segment | close |
| Buttons: glass, prominent glass, clear glass, prominent clear; roles; extra large size | Button: solid, soft, outline, ghost, link; danger tone; sm to lg | close (no glass or clear styles, no extra large) |
| Text field | Input | close |
| Page control | none | missing |
| Progress bar and activity indicator | ProgressBar, Spinner | close |
| Gauge | Meter, ProgressCircle | close |
| Disclosure group | Accordion | close |
| Label | Label | matches |
| Share sheet (activity view) | none | missing |
| Notification banner | Toast | different |
| Widget and live activity styling | Tile, Card | different (out of scope) |
| Status bar and safe areas | none in effect (`viewport-fit=cover` missing, see the mobile audit) | missing |
| Image and collection views | Grid, Bento, Lightbox | close |
| Glass floating button | FloatingActionButton | close |
| Haptic feedback | none | missing |

### Desktop

| Vendor component (desktop form) | Liquid nearest | Verdict |
| --- | --- | --- |
| Window: frame and body, rounder corners, no glass on the body | Window: glass body at 84 percent, radius 24 | wrong (glass on content) |
| Close, minimise, zoom at the leading top, grey when not key | WindowControls exists (12px lights at the start); the Liquid Window demo shows zoom and close icons at the trailing end | different |
| Key, main and inactive window looks | TitleBar `active` prop | close |
| Unified title bar and toolbar | TitleBar and Toolbar are separate; no unified form | missing |
| Toolbar items without bezels, three groups, overflow menu, customisation | Toolbar with `overflow`; no customisation | close |
| Sidebar floating as glass, source list, sizes small to large | Sidebar: solid card, accent bar on the selected row | different |
| Inspector column | PageShell `aside`, ResizablePanels | squeezed |
| Split view with dividers | SplitView, ResizablePanels | close |
| Background extension under sidebar and inspector | none | missing |
| Tab view | Tabs | close |
| Menu bar with standard menus and shortcuts | Menubar: glass at 88 percent, 36 tall | close |
| Dock (system UI; apps provide Dock menus) | Dock: glass, radius 22, magnify | different (a system part, keep for demos only) |
| Popover, detachable into a panel | Popover | close (no detach) |
| Sheet as a card from the top of the parent window, window dimmed | Dialog in the centre; Sheet from the bottom | different |
| Alert with app icon, accessory, suppression checkbox | AlertDialog with icon | close |
| Settings window: toolbar of panes, Command and comma | none | missing |
| Panel and HUD panel | Window kinds | close |
| Table with sortable, resizable columns, alternating rows | none | missing |
| Outline view | none | missing |
| Column view | none | missing |
| Pop up button | Select | close |
| Pull down button | DropdownMenu with a trigger | close |
| Combo box | Combobox | matches |
| Checkbox, square with a mixed state | Checkbox: round in Liquid | different on desktop |
| Radio button | RadioGroup | close |
| Stepper (small up and down arrows) | NumberField | close |
| Level indicator | Meter, Rating | close |
| Colour well | none | missing |
| Path control | Breadcrumbs | close |
| Token field | TagField | close |
| Disclosure triangle | Accordion, Sidebar group trigger | close |
| Search field in the toolbar or top of the sidebar | SearchField | close |
| Image well | none | missing (low value) |
| Box | Fieldset, Surface | close |
| Help button, square buttons under a list | none | missing |
| Mini, small, regular and large control sizes | sm, md, lg | close |
| Focus ring around fields, highlight in lists | 2px tint ring, 2px gap everywhere | close |
| Pointer hover states, controls revealed on hover | hover fills gated by `(hover: hover)` | close |
| Full keyboard access and standard shortcuts | keyboard models in every component | matches |

### Web (what the vendor ships in the browser)

| Vendor web form | Liquid nearest | Verdict |
| --- | --- | --- |
| Frosted top bar, 44 tall, `blur(20px) saturate(1.8)`, 80 percent | Navbar | close (Liquid is heavier and adds an edge) |
| Frosted attached sidebar, 55 percent | Sidebar (solid) | different |
| Floating capsule player bar with a soft shadow | TabBar, Toolbar | matches |
| Clear capsules over artwork (25 percent, `blur(10px)`) | none | missing |
| Text protection band over artwork | none (Card has no scrim part) | missing |
| Round glass buttons over artwork | IconButton | close |
| Menu curtain that blurs the page | Dialog backdrop blur | close |

## Detailed comparison

### 1. Glass on content

- Guidance: never in the content layer; windows and app backgrounds are not
  glass.
- Liquid: the Window body is glass (`recipes` give Window `blur(24px)` and the
  84 percent fill); Card, List, Input, Sidebar are solid, which is right except
  for Sidebar.
- Gap: wrong for Window, different for Sidebar.
- Fix: Window body solid (`color.bg.surface`); only its toolbar band and a
  floating sidebar and inspector are glass. Sidebar becomes the large, more
  opaque glass.

### 2. Refraction and lensing

- Guidance: the material bends and reflects light at its edges and reacts to
  touch; no numbers.
- Liquid: none; the "lens" is a lighter fill with `brightness` and
  `saturate`.
- What CSS can do today: `backdrop-filter: url(#filter)` with an
  `feDisplacementMap` works only in Chromium. WebKit bug 245510 (status NEW)
  and Mozilla bug 1961378 (status NEW) record that it fails in Safari and
  Firefox. Without it, the honest tools are: a layered edge (an inner
  gradient border brighter at the top, darker at the bottom), an inner
  specular gradient that follows the pointer or device tilt, a slight
  `brightness` and `contrast` lift inside a 1 to 2px band (a second, smaller
  element with its own `backdrop-filter`), and a soft outer shadow. Cost: each
  extra backdrop layer is a second full blur pass of the area; on a
  mid range phone two or three bar sized layers are fine, page sized layers
  are not. Not measured on a device here.
- Gap: missing.
- Fix: a Chromium only `data-refraction` opt in for one or two hero surfaces
  (tab bar, a floating button), as PLAN.md 3.7 already allows; everywhere else
  the layered edge and moving highlight.

### 3. Adaptive tint and light and dark switching

- Guidance: no colour of its own; small bars switch light and dark by what is
  behind; symbols go monochrome.
- Liquid: fixed light glass in light scheme, fixed dark in dark; tinted level
  is a fixed blue.
- Gap: missing.
- Fix: a `useBackdropTone` hook on floating bars that reads the tone of what is
  under the bar (a `data-tone="light|dark"` declared by sections and media, or
  for same origin images one luminance sample at load), sets
  `data-backdrop-tone` on the bar, and the recipe swaps fill and ink with a
  200ms colour transition. With it the fill drops to 60 percent (table above).
  `contrast-color()` (Chrome 147, Safari 26, Firefox 146) can pick the ink
  where the fill is known.

### 4. Radii

- Guidance: concentric, inner equals outer minus inset, minimum radius,
  capsules for controls, larger sheet corners, half sheets inset.
- Liquid: holds in menus (22 minus 6 is 16 rows) and in capsule bars; breaks in
  dialogs (24 panel, capsule buttons 22 in 16 padding: concentric needs 8, or a
  panel of 38), the ios segmented control (12 track, 2 padding, 9 segment: 10
  expected), the sheet (flush, square bottom), the dock (22 in a capsule
  world), the toast (22 card).
- Gap: close, with five breaks.
- Fix: a contract rule and a token: `--ds-radius-inset` per container; children
  take `max(radius.min, outer minus inset)`. Panels that hold capsule buttons
  take `capsule height / 2 + padding` (alerts: 22 plus 14 is 36).
  `corner-shape: squircle` (Chrome 139, Safari 27.3) can give the continuous
  corner where supported, with round as the fallback.

### 5. Bars that float, group and shrink

- Guidance: top bar is floating capsule groups over content with a scroll edge
  effect; bottom tab bar minimises on scroll; search apart at the trailing end.
- Liquid: tab bar floats at the right proportion (86 percent of the width,
  close to the figure's 86 percent; 59 tall against about 62) and has a lens on
  the current item, but never shrinks and has no accessory or search slot; the
  toolbar is one long capsule with separators; the navbar is a full rectangle
  of glass with a link title.
- Gap: different.
- Fix: Toolbar groups (each group its own capsule, a fixed spacer between),
  borderless 20 to 22px symbols in 44 targets, at most three groups; a
  NavigationBar part with no background, a circular back button, a large
  title and a scroll edge band; TabBar minimise with a scroll hook, an
  `accessory` slot and a `search` item.

### 6. Overlays that grow from their source

- Guidance: buttons morph into menus and popovers; action sheets originate at
  the control; context menu previews lift out of the content.
- Liquid: menus scale from 0.4 at the trigger's corner (good), popovers from
  the arrow tip, dialogs from the centre, sheets from the edge; the trigger
  itself never changes; no preview.
- Gap: close for menus, different for the rest.
- Fix: a `morph` motion pattern: read the trigger box and radius, start the
  panel as a clip of that box with that radius (`clip-path: inset(... round
  r)`), animate clip, radius and scale to the panel on the soft spring, cross
  fade content in after 40 percent, and hide the trigger's own glass while
  open so one shape seems to become the other. Reverse on close. View
  transitions (Chrome 111, Safari 18, Firefox 144 for the same document API)
  can carry the shared element where the panel lives elsewhere in the DOM.

### 7. Motion

- Guidance: fluid, touch stronger than pointer, morph and materialise, no
  numbers.
- Liquid: three springs (soft 375ms, snappy 296ms with 2 percent overshoot,
  bouncy 496ms with about 10 percent), press 0.96, lenses that stretch. These
  are already at the perceivable level the interactions audit asked for.
- Gap: close in timing, missing in kind (no morph, no materialise, no blend of
  shapes within a group).
- Fix: the morph pattern above; a materialise pattern (blur 8px to 0, scale
  0.9 to 1, opacity) for glass that appears away from any source; a merge of
  neighbouring capsules when a toolbar group gains or loses an item (animate
  the group's width with `transform` on the inner items and a clip on the
  capsule).

### 8. Legibility

- Guidance: 4.5:1 minimum, 7:1 for small custom text; contrast on glass is the
  system's job, kept by blur, luminosity and the scroll edge effect.
- Liquid: passes everywhere, measured.
- Gap: same in outcome, different in method: Liquid buys it with opacity.
- Fix: adaptive tone (section 3) and a real scroll edge effect (a mask on the
  scroll container under the bar, not a painted band) to keep the outcome at a
  thinner fill.

### 9. Type

- Guidance: phones 17 body with a 34, 28, 22, 20, 17, 16, 15, 13, 12, 11
  ramp; desktops 13 body with 26, 22, 17, 15, 13, 12, 11, 10.
- Liquid: 15 body, 14 to 16 controls, 17 titles, on both forms.
- Gap: different on both.
- Fix: the platform axis sets the ramp: `ios` takes the phone ramp, a desktop
  value takes the desktop ramp. Liquid sets weights and tracking only.

### 10. Desktop form

See the next section.

## What a desktop form needs

Existing parts and how they compare:

| Part | Today in Liquid | Against the real one |
| --- | --- | --- |
| Window | glass body, radius 24, title bar 36 with trailing zoom and close | body must be solid; controls lead; title and toolbar unified |
| TitleBar | controls, move, title, actions; 36 tall | close as a part; needs a unified mode where the toolbar sits in it |
| WindowControls | 12px lights, 24 targets, at the start | close; grey when the window is not key |
| Toolbar | one capsule | needs groups, borderless items, overflow, the frame placement |
| Sidebar | solid card with an accent bar | needs the floating glass look, source list rows, disclosure groups, size step |
| PageShell | header, nav, main, aside | the skeleton of a split view; nothing floats |
| ResizablePanels, SplitView | dividers and keyboard resize | close |
| Menubar | 36 tall glass bar | close; belongs at the top of a desktop demo, full width |
| Dock | glass row with magnify | a system part; keep it for the desk template only |

Missing: an Inspector (trailing glass column with its own toolbar toggle), a
SourceList style of Sidebar, Table (sortable, resizable columns, alternating
rows, selection highlight), OutlineView (rows with disclosure), a
SettingsWindow template (toolbar of panes, title follows the pane), a
unified toolbar mode on TitleBar, PopUpButton and PullDownButton looks of
Select and DropdownMenu, square checkboxes on desktop, help and square
buttons, a ColourWell, toolbar customisation, and the background extension
effect.

The platform axis should gain `macos` beside `web`, `ios` and `android`.
Reasons: the desktop needs its own ramp (13 body), control heights (about 22
to 28 by size), square checkboxes, controls at the leading top of windows,
sheets that drop from the top of the window, and no hover only affordance
lost on touch. These are platform conventions, not style choices, which is
exactly what the axis carries today for `ios` and `android`. `web` stays the
neutral responsive form. This changes `docs/contracts/` and is a lead
decision.

## What Liquid on the web should be

The vendor's own web pages set the bar for what is accepted in a browser:
frosted bars and capsules from `blur` plus `saturate`, nothing more. Liquid
should go one step past that where it is cheap and safe, and no further.

Keep: `backdrop-filter: blur() saturate()` on bars, menus, popovers, sheets
and the floating tab bar; capsules; the 1px inner edge; the soft two layer
shadow; lens thumbs; springs.

Add: adaptive tone with a 60 percent fill on small bars; a moving specular
highlight driven by pointer position on desktop and by scroll or press point
on phones (no device motion permission prompt); a real scroll edge mask;
concentric radii; morph transitions.

Drop: the fixed blue `tinted` level for bars (keep tint for one prominent
button); glass on Window bodies and Dock as defaults; the painted scroll edge
band over photos.

Opt in only: SVG displacement refraction in Chromium for at most two surfaces,
behind `data-refraction`, off by default.

Fallback chain, in order:

1. Chromium with `data-refraction`: displacement plus blur plus saturation.
2. Any browser with `backdrop-filter` (Chrome 76, Safari 18 unprefixed and
   9 prefixed, Firefox 103): blur plus saturation, adaptive fill, edge,
   highlight, shadow.
3. No `backdrop-filter`, `prefers-reduced-transparency: reduce` (Chromium
   only), `prefers-contrast: more`, `data-contrast="more"`, a
   `data-transparency="reduce"` app setting (needed because Safari never
   reports the system setting), or glass over glass: the solid
   `glass-solid` with a 1px border.
4. Forced colours: `Canvas`, `CanvasText`, no shadow.
5. Reduced motion: no morph, no stretch; fades only.

## Proposal

### (a) Material specification

Layers as tokens (new names in `color.glass` and `blur`; values per scheme;
"fixed" is today's non adaptive fill, kept as the fallback when tone is
unknown).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `glass.fill.bar` (adaptive, tone light) | `#fbfbfd` at 60 percent | | tab bar, toolbar groups, nav buttons |
| `glass.fill.bar` (adaptive, tone dark) | | `#1e1e22` at 60 percent | same, swapped by backdrop |
| `glass.fill.bar-fixed` | 84 percent | 90 percent | tone unknown |
| `glass.fill.panel` | 84 percent | 90 percent | menus, popovers |
| `glass.fill.large` | 90 percent | 94 percent | sidebar, inspector, sheet at full height |
| `glass.fill.clear` | `#1c1d23` at 18 percent | black at 18 percent | over media only |
| `glass.dim.clear` | black at 35 percent | black at 35 percent | under clear glass over bright media |
| `glass.ink.on-light`, `on-dark` | `#1c1d23`, muted `#484a54` | `#ececf1`, muted `#b3b5bd` | monochrome symbols and text on bars |
| `blur.glass-bar` | 16px | 16px | bars (vendor web uses 16 to 20) |
| `blur.glass-panel` | 24px | 24px | menus, popovers |
| `blur.glass-large` | 40px | 40px | sheets, sidebar |
| `glass.saturate` | 1.8 | 1.6 | all |
| `glass.edge.top` | white at 70 percent | white at 22 percent | 1px inner line, top half |
| `glass.edge.bottom` | black at 6 percent | white at 6 percent | 1px inner line, bottom half |
| `glass.stroke` | black at 8 percent | white at 10 percent | 1px outer line |
| `glass.specular` | white at 45 percent, radius 60 percent of the shape | white at 18 percent | moving highlight |
| `glass.shadow` | `0 1px 2px` at 6, `0 8px 24px` at 10 percent | `0 1px 2px` at 30, `0 8px 24px` at 35 percent | floating bars |
| `glass.lens` | white at 50 percent | white at 18 percent | current tab, segment, held thumb |
| `radius.min-concentric` | 8px | 8px | floor for inner corners |
| `radius.sheet-top` | 34px | 34px | inset sheet |
| `space.sheet-inset` | 6px | 6px | medium detent |

Three glass levels stay (`clear`, `regular`, `tinted`) but `tinted` changes
meaning: a tint on one prominent control, not a cast on whole bars. A glass
level axis emitted by the token build (lead decision 2 of `liquid.md`) makes
these blocks free for recipes.

### (b) Recipe changes, in priority order

1. Window: solid body, glass only on a unified toolbar band.
2. Sidebar: large glass, floating with an 8 to 10px inset and concentric
   radius, selection as a lens row, no start accent bar.
3. TabBar: 24 to 26px filled icons on ios, 62 tall, monochrome ink by tone,
   lens current item; adaptive fill.
4. Toolbar: one capsule per group, borderless symbols, no outline on the on
   item (lens only), 44 targets on ios, 28 on desktop.
5. Navbar on ios: no bar background, title plain text 17 semibold, actions as
   capsule groups; scroll edge band only.
6. Sheet: inset 6 at the medium detent, 34 top corners, bottom corners
   concentric, more opaque at the large detent, title 17 semibold centred,
   circular close at the leading top.
7. AlertDialog and Dialog: concentric radius from the button capsules (about
   36), capsule actions side by side on ios (unverified against the current
   system alert).
8. DropdownMenu and ContextMenu: hide shortcuts on touch
   (`(hover: none) and (pointer: coarse)`), add the small and medium icon row
   layouts.
9. SegmentedControl on ios: capsule track and capsule segment, concentric.
10. Dock: capsule; Toast: capsule for one line (kept), concentric for more.
11. Checkbox on a desktop platform: square with a 4 to 5px radius and a mixed
    state.
12. Button: a `glass` and a `glass-prominent` emphasis for bars and floating
    actions; a `clear` emphasis over media.

### (c) Changes in components, not only in the style

- Contract: a concentric radius rule in `anatomy.md` (each container exposes
  `--_radius` and `--_inset`; children compute their own) and a `glass` part
  role so a recipe can find every glass layer.
- Hooks: `useBackdropTone` (tone under a floating element), `useScrollEdge`
  (mask and shrink state from the scroll container: `data-scrolled`,
  `data-scroll-direction`), `usePressPoint` (specular position for touch).
- Motion patterns: `morph` (trigger box to panel), `materialise`, `merge`
  (neighbouring capsules).
- New parts: TabBar `accessory` and `search` items with a minimised state;
  Toolbar `group` as its own capsule and a `spacer`; NavigationBar with
  `large-title` and `back`; Sheet `close` placement and a nonmodal mode;
  ActionSheet anchored to its source; Popover falls back to a Sheet on a
  compact phone.
- New components: Inspector, Table, OutlineView, SettingsWindow (template),
  WheelPicker, DatePicker, PageControl, SwipeActions, PullToRefresh,
  ShareSheet pattern, ColourWell.
- Platform axis: add `macos`; the gallery viewport meta gains
  `viewport-fit=cover` (already found by the mobile audit).
- An app level setting for glass: `data-transparency="reduce"` and a
  `data-glass-look="clear|tinted"` choice, since Safari never reports the
  system transparency setting.

### (d) Demo screens that prove it

Phone (393 wide, ios, light and dark, English and Arabic):

1. A photo led home: content under a minimised floating tab bar with a mini
   player accessory and a separate search circle; scrolling down shrinks it,
   up restores it.
2. A list screen: large title that collapses into a glass capsule title on
   scroll, a scroll edge blur under the top capsule groups, swipe actions on
   rows, a context menu with a lifted preview.
3. A share button that morphs into an anchored action sheet; a "more" button
   that morphs into a medium layout menu.
4. An inset sheet at the medium detent with content peeking at the edges,
   dragged to full height where it turns opaque.
5. Bars over a bright photo and over a dark one, showing the light and dark
   switch and the monochrome ink.

Desktop (1440 wide, macos):

1. A three column window: floating glass sidebar with a source list,
   content list, detail with a hero image extended under the sidebar and
   inspector; unified toolbar with three groups, search trailing, one
   prominent action; controls at the leading top; menu bar above.
2. The same window inactive (grey controls, no glass).
3. A settings window with a toolbar of panes.
4. A table with sortable columns and an outline view in the inspector.
5. A popover that detaches into a panel; a sheet that drops from the top of
   the window.

Proof: screenshots over plain, busy, bright and dark backdrops; the contrast
gate over the same set; a frame capture of each morph at 1x; a device run on a
phone and a mid range Android for blur cost.

### (e) Limits on the web, and the nearest honest form

| Platform feature | On the web | Nearest honest form |
| --- | --- | --- |
| Refraction and lensing at edges | Chromium only (SVG displacement in `backdrop-filter`); not in Safari or Firefox (bugs 245510 and 1961378) | layered edge lines and a moving specular gradient everywhere; opt in displacement in Chromium |
| Highlights that follow device motion | needs a motion permission on phones | follow pointer and press point; static highlight otherwise |
| Adaptive light and dark by backdrop | no API to read pixels behind an element | declared tone on sections and media, a luminance sample of same origin images |
| Shapes that blend and merge in a container | no metaball compositing | animate clip and radius of each capsule; let neighbours touch with a shared outline during the move |
| Concentric with the display corners | screen corner radius is unknown | a phone sheet token (34) and inset (6); `corner-shape: squircle` where supported |
| System transparency setting | not reported by Safari | an app setting and `prefers-contrast` |
| Blur cost | each `backdrop-filter` layer is a full blur pass | at most three bar sized layers and one panel at a time; no glass on long lists |
| The system font by name | not allowed (hard limits) | `system-ui` first stack, which draws the platform font on its devices |
| Haptics | Vibration API on Android only | a no op hook on iOS web |

### (f) Legal and licence boundaries

- May be studied: the public guidance pages, the developer documentation, the
  public behaviour and computed styles of public web pages, for principles,
  structure, proportion, behaviour and feel.
- May not be copied into the repo: any image, figure, icon, symbol, font file,
  sample code or passage of text from those pages or sites; no screenshot of a
  vendor page or figure (all kept in a scratch folder for this audit).
- Names: the style id stays `liquid` and the name "Liquid"; the vendor's
  product name for the material, its symbol set and its marks are not used in
  the product, tokens or docs prose. Platform values `ios` and `macos` name
  the platform the conventions belong to, which is descriptive use; the lead
  may prefer `desktop` if the owner wants no platform name in the API.
- Fonts: the platform system font stack only; no vendor font named or
  referenced by file in Liquid.
- Icons: `lucide-static` (ISC); the vendor's standard action icons may guide
  which concept goes where (share, delete), not the drawing.
- The numbers in this report are measurements and paraphrases; they carry no
  copyright, but the figures they come from stay out of the repo.

## The ten changes that matter most

1. Adaptive glass: `useBackdropTone` on floating bars, a 60 percent fill with
   monochrome ink that flips light and dark, keeping 4.5:1 (measured 4.90
   muted).
2. Window body solid, glass only on a unified toolbar; controls at the
   leading top. Ends glass on content.
3. Toolbar and top bar as grouped capsules over content with a real scroll
   edge mask; a NavigationBar with a circular back and a large title that
   collapses; no link title, no hamburger on phones.
4. Overlays that morph out of their source (menus, popovers, action sheets,
   sheets from a button), and back into it on close.
5. Sheets inset at the medium detent with 34 top corners, concentric bottom
   corners, an opaque large detent, a circular close and a 17 semibold title.
6. A concentric radius rule in the contract and a fix of the five breaks
   (dialog, ios segmented control, sheet, dock, toast).
7. TabBar minimise on scroll with an accessory slot and a separate search
   item; 24 to 26px filled icons.
8. Floating glass Sidebar and an Inspector, with the background extension
   effect, for the desktop form.
9. A `macos` platform value with the desktop type ramp (13 body), 28 tall
   controls, square checkboxes and the desktop components (Table,
   OutlineView, SettingsWindow).
10. The edge and light: a two tone inner edge, a moving specular highlight
    from pointer and press, and Chromium only displacement refraction as an
    opt in on at most two surfaces.

## Findings in passing

- `popover` on a phone: the field label "Layer name" sits against the title
  with no gap (`sheets/popover-phone.png`).
- `search-field` root measures 28 tall on a phone while its inner field is
  44 (`data/measure.json`, `search-field-phone-light-plain`).
- Menus show keyboard shortcuts on touch (also in the mobile audit).
- The gallery has no backdrop axis; this audit injected one in the harness.
  A `bg=plain|busy|bright|dark` gallery key would let every review see glass
  as it is meant to be seen.

## What I could not check

- A real phone or Mac. All runs were headless Chromium on Linux: Safari's
  rendering of `backdrop-filter`, its blur cost, the platform font, and the
  native look of the system's own components were not seen. The vendor's
  native components were judged from the written guidance, framework
  documentation and six figures, not from a device.
- The current shapes of alerts, the share sheet, desktop window corners and
  toolbar height: no numbers in the text and no figure measured. Marked
  unverified where used.
- Refraction cost and quality: the Chromium displacement path was not built
  or profiled here.
- The vendor's signed in web apps (cloud mail, notes, drive): only the sign in
  page was reachable without an account.
- Device motion highlights and haptics.
- The live deployed gallery; the local gallery on port 5241 was used.
- Figure measurements assume a 402 point wide phone; they are proportions
  first and points second.
