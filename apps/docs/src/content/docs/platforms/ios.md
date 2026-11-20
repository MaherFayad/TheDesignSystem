---
title: iOS
description: What an iPhone screen is made of, and which component to use for each part. The glass, the owner rulings for this platform and the foldable iPhone.
---

On `ios` the components keep their names, props and markup. The platform
layer changes sizes, shapes, where overlays come from and how the bars sit.
Every iOS look on this page is proposed until the owner signs it on a phone.

- [Open the iOS test screens](gallery:/screens/ios): whole screens built
  only from system components, each beside the reference it was measured
  against.
- [Open the foldable iPhone frames](gallery:/platforms/duo): our own drawn
  frames of the outer and inner screens, in Safari size and full screen,
  flat and folded.
- [Open the platform screens](gallery:/platforms): the same screens on web,
  iOS and Android.

## What the platform calls a thing, and what to use here

The left column says what a person sees on an iPhone, in plain words. The
middle column is the component to use. Nothing here is iOS only: each one
also has a web and an Android form, described on its page.

| On an iPhone | Use here | Notes |
| --- | --- | --- |
| A card of fields, one field per row, as in a settings screen | [Fieldset](/components/fieldset/) with `variant="inset"`, holding [Input](/components/input/) with `variant="plain"` | `clearable` adds the round clear button while editing. Each field keeps a visible label. |
| A grouped list with small text above and below each group | [List](/components/list/) with `ListSection` | The section header and footer sit outside the card. |
| A column of letters beside a long list | [SectionIndex](/components/section-index/) | Press a key to jump, move along the column to scrub. Arabic shows the Arabic letters. |
| A value in the accent colour that opens a short list | [Select](/components/select/) with `emphasis="ghost"` | The value with an up and down glyph; the list is the platform menu. |
| A gray capsule of minus and plus beside a number | [NumberField](/components/number-field/) with `variant="stepper"` | The number stays visible as text before the capsule. |
| A row of icon actions at the top of a menu | [DropdownMenu](/components/dropdown-menu/) or [ContextMenu](/components/context-menu/) with `DropdownMenuQuickActions` or `ContextMenuQuickActions` | Two to four actions, each an icon above a short label, never icon only. |
| An alert that asks for a short value | [AlertDialog](/components/alert-dialog/) with `AlertDialogBody` | One or two fields, drawn as the card of field rows above. |
| The action an alert runs on Return | `AlertDialogAction` with `primary` | One per alert. It is filled in the accent colour. |
| A round check at the top of a sheet that saves and closes it | [Sheet](/components/sheet/) with `SheetConfirm` | Its label is the accessible name. On web and Android it is a text button. |
| Actions revealed by sliding a list row sideways | [SwipeActions](/components/swipe-actions/) | A menu button holds the same actions for anyone who does not swipe. |
| A notice that drops in from the top | [Toast](/components/toast/) | On `ios` it draws as a banner: `start` for an icon or avatar, `meta` for a time. A timed banner has no close button; `toast({ closable: false })` asks for that anywhere. |
| A round search item beside the tab bar | [TabBar](/components/tab-bar/) with `TabBarSearch` | A destination like any tab. On web and Android it is the last item of the bar. |
| A row of small dots under a set of pages | [Pagination](/components/pagination/) with `variant="dots"` | On `ios` the dots sit on a small platter. |
| A card of stacked actions that opens from the button that names the object | [ActionSheet](/components/action-sheet/) | Cancel comes last. On Android it is a bottom sheet of rows. |
| The cut, copy and paste capsule over a selection | [SelectionMenu](/components/selection-menu/) | For selections the app draws. Never inside a native text field, which keeps the browser's menu. |
| The share sheet | [SharePanel](/components/share-panel/) and `share()` | The system sheet comes first. See [Share](#share). |
| A month calendar | [Calendar](/components/calendar/) | Gregorian or Umm al-Qura. Values are ISO dates in both. |
| A time wheel | [WheelPicker](/components/wheel-picker/) | One to three columns, each a spinbutton. |
| A date typed in parts | [DateField](/components/date-field/) | Day, month and year segments in the order of the locale. |
| A time typed in parts | [TimeField](/components/time-field/) | Hour, minute and, in a 12 hour locale, the day period. |
| A row with a date chip and a time chip | [DatePicker](/components/date-picker/) | On `ios` the date chip opens the Calendar and the time chip opens the wheel, each in a popover. |
| One colour shown as a square or a disc | [ColorSwatch](/components/color-swatch/) | Read by a name such as "Blue, dark", never by the hex code alone. |
| A grid of colours to pick from | [ColorSwatchPicker](/components/color-swatch-picker/) | Our own palette, not the platform's values. |
| A slider for opacity, hue or one channel | [ColorSlider](/components/color-slider/) | Arrow keys and a press on the track work without a drag. |
| A colour typed as a hex code | [ColorField](/components/color-field/) | The typed path beside every drag. |
| A square of colour with one thumb | [ColorArea](/components/color-area/) | Two hidden sliders, one per channel. |
| The colour panel with its grid, spectrum and sliders | [ColorPicker](/components/color-picker/) | On `ios` it opens in a Sheet; on web in a Popover. |
| A small arrow from a popover to its control | [Popover](/components/popover/) | The `arrow` part. Android hides it. |
| A busy indicator | [Spinner](/components/spinner/) | It stays a ring. A form with spokes waits on an owner decision. |

## Share

The system share sheet comes first. Call `share()` from
`@the-system/shared` on a click or a key press. Where the browser has the
system sheet and it can take the item, the system sheet opens; that is
Safari on iOS and macOS, Chrome on Android, and Chrome and Edge on Windows
and ChromeOS. It needs a secure page and a user gesture.

```ts
import { share } from '@the-system/shared';

const result = await share({ title: 'Weekend plan', url });
if (result === 'fallback') setPanelOpen(true);
```

`share()` answers with one of three words:

- `system`: the system sheet took it.
- `cancelled`: the person closed the system sheet. Do nothing. Never open
  the panel on top.
- `fallback`: there is no system sheet here, or it cannot take the item.
  Open the app's panel.

[SharePanel](/components/share-panel/) is the fallback, and the place for
the app's own targets: its people, Copy link and its own actions. A page
cannot list the device's apps or contacts, so the panel never tries to
copy the system sheet. It always offers More options, which calls the
system sheet where there is one. `SharePanel` does this for you with
`system="prefer"`, the default; `system="never"` always opens the panel.

## The glass

Only the control and navigation layer is glass: the tab bar, the buttons of
the top bar and of sheets, menus, the action sheet, the toast banner, the
thumb of a segmented control and the switch thumb while it is held. Content
stays solid, calendar days and colour swatches included. Glass never sits
on glass. Menus and other panels of text use a denser, frosted glass so
their rows stay easy to read.

### Which styles take it

- Liquid and Neutral opt in on `ios`. The strength that ships is
  `regular`. Which strength to keep is still open for the owner.
- Studio and Desk keep their own solid paint on `ios`. They take the
  platform's sizes and shapes, never its material.

### Two tiers of refraction

The glass bends the content near its edge, as the thick rim of a lens does,
and leaves the middle nearly clear.

| Tier | What it draws | Where |
| --- | --- | --- |
| 1 | A real bend near the edge, from an SVG filter in the backdrop, with a soft glare | Chromium browsers only. A probe turns it on after the filters are mounted, by setting `data-refraction="true"` on the document element. |
| 2 | A low blur in the middle and a brighter band along the edge, with no bend | The first paint, and every other browser that paints a backdrop filter. Safari on iOS gets this tier. |

Safari parses the SVG filter but paints nothing, so a feature query cannot
tell the tiers apart; the probe does. Tier 2 has only been seen forced in
Chromium so far, not yet on an iPhone.

### When glass turns solid

| The person or browser asks for | What the glass does |
| --- | --- |
| Reduced transparency, `@media (prefers-reduced-transparency: reduce)` | Solid surface paint, the edge band gone |
| More contrast, `@media (prefers-contrast: more)`, or `contrast="more"` on the Theme | Solid surface paint, the edge band gone |
| Forced colours, `@media (forced-colors: active)` | Solid paint, and the system colours take over |
| No backdrop filter in the browser | Solid surface paint |

Reduced motion changes nothing here: the glass does not move.

Contrast is measured from pixels over the lightest and the darkest demo
content, in light and dark: text and glyphs on glass at 4.5:1 (WCAG 2.2,
1.4.3) and the edges and glyphs that a person needs to see a control at 3:1
(1.4.11). The solid fallbacks above exist so a person who needs more
contrast or less movement behind the text gets it from their own setting.

## Rules for this platform

These are owner rulings. Do not change them in a style or an app.

- The switch on `ios` is green when on, from
  `color.state.success.platform`, with a plain off track and no outline.
  The owner waived the 3:1 outline here; the state is also told by the
  thumb's position and by the switch's role and state.
- Control shapes are told apart by their fill and a soft shadow, not by a
  stroke.
- Neutral follows the platform for colour and corners on `ios`.
- Kept by the lead: filled buttons in dark keep the darker tint so white
  labels stay at 4.5:1; page dots keep a wider current dot; index keys and
  dots keep 24 by 24 targets (2.5.8).

## Foldable iPhone

Every fact in this section about the device and about Safari is taken from
the vendor's public documentation (the device's tech specs, its human
interface guidelines page and its developer overview) and from WebKit's
notes for Safari 27.1, as of the plan's date, 17 November 2026. The
vendor sells the device as iPhone Duo. Nothing here was checked on a real
device, and every look is proposed.

### Never detect a model

There is no foldable platform and no device switch. The device is an
iPhone, so `auto` resolves to `ios` as on any iPhone. Respond to size and,
when the browser reports them, to segments:

- Lay out from the size of the page shell, through container queries.
- Read each safe area side on its own. On this device start and end often
  differ.
- When the browser reports two viewport segments, keep overlays out of the
  fold.
- Never read the user agent for a model, never branch on `screen.width`,
  never guess from pixel counts. WebKit asks pages not to sniff.

### The sizes a page can get

Safari's page sizes in CSS pixels. The height is the small and the large
viewport height. The last column is what `placement="auto"` gives.

| Screen | Width | Height | `auto` gives |
| --- | --- | --- | --- |
| Outer, portrait | 382 | 580 to 618 | Bottom |
| Outer, landscape | 594 | 368 to 406 | Side |
| Inner, portrait | 669 | 867 to 902 | Bottom |
| Inner, landscape | 951 | 585 to 620 | Side |
| Inner, two windows side by side | 385 | 571 to 609 | Bottom |
| Partly folded | Not published | Not published | Size decides |

Full screen, the outer screen is 466 by 678 points and the inner screen 669
by 951. The gallery frames show both, for native apps and in case Safari
later lets a page reach the whole screen.

### What Safari keeps for itself

- On the outer screen, Safari's tab bar is at the bottom and the system
  puts its own controls in a column at the right in portrait. The page does
  not extend behind that column; Safari fills it with the page's
  background colour. `viewport-fit=cover` does not reach it in Safari 27.1,
  and WebKit says this may change.
- On the inner screen, Safari's tab bar is at the top, as on a tablet.
- So on the outer screen in portrait the page is 382 wide beside Safari's
  column, and our tab bar stays at the bottom there. There is never a
  second column.

### The `placement` prop

[PageShell](/components/page-shell/), [TabBar](/components/tab-bar/) and
[Navbar](/components/navbar/) take `placement`:

| Value | What it does |
| --- | --- |
| `auto` | The default. CSS decides from the page shell's size, with no script, so the server render matches. On `ios`, a shell at least 440 wide and at most 700 tall gets the side column; any other shell keeps the bars at the top and bottom. |
| `bottom` | Bars stay at the top and bottom whatever the size. |
| `side` | The side column whatever the size. Only for a phone or foldable screen that must always have it, such as a fixed device frame or a landscape only screen. Never in a desktop app, a desktop web page or under `macos`. |

PageShell passes its value down; a TabBar or Navbar with its own value
wins. The attribute `data-placement` is written only when the value is not
`auto`. The page shell is a size container named `ds-shell`.

The 440 by 700 rule also gives the column to an ordinary iPhone page in
Safari in landscape. This is an open owner decision.

### The side column

- It sits at the right edge, 84 wide when it includes the safe area, with
  items 48 by 48 and 12 from the column's edges.
- The Navbar's icon actions go to the top of the column as round buttons;
  text buttons and segmented controls stay in the top row. The title stays
  at the top of the content.
- The TabBar becomes a vertical capsule at the bottom of the column, icons
  only. Each label stays the link's accessible name.
- The content gets a margin and scroll padding equal to the column, so no
  row and no focused control sits under it (WCAG 2.2, 2.4.11).
- Moving between bottom and side on a resize switches at once; it never
  animates layout.
- In Arabic the column stays at the right, as the vendor's guidelines say
  for native apps. Whether Safari keeps it there for web pages is not
  verified, and the side for Arabic is an open owner decision.

Not built yet: a tooltip on the icon only tabs, the search item under the
tab capsule, collapsing the tab bar to one button on a short screen, and
moving extra actions into a menu.

### The fold and the feature flags

| Feature | State in Safari on iOS 27.1 | State elsewhere |
| --- | --- | --- |
| Width, height and container queries | Shipped | Shipped |
| `env(safe-area-inset-*)` | Shipped; the values on this device are not published | Shipped |
| `device-posture` and `navigator.devicePosture` | Behind the feature flag `DevicePostureEnabled`, off by default | Chrome 132 |
| `horizontal-viewport-segments`, `vertical-viewport-segments`, `env(viewport-segment-*)`, `window.viewport.segments` | Behind the feature flag `ViewportSegmentsEnabled`, off by default | Chrome 138 |

With the flags off a page cannot see the fold at all, so every layout must
work from size alone. The fold rules are an extra on top:

- Built: a sheet moves out of the fold when two segments are known. In
  landscape it sits in the start segment; in portrait its top stays below
  the fold.
- Planned, not built: alerts, toasts and menus that avoid the fold, and a
  `data-segment` attribute on AlertDialog, Dialog and Sheet.

### Not verified

These come from the plan's list of things no source confirms:

- The safe area values Safari reports on each screen and orientation.
- `devicePixelRatio` on the inner screen (expected 3).
- The user agent string. Only a third party simulator report exists.
- How Home Screen web apps lay out on this device.
- Safari page sizes while partly folded.
- Which side the column takes in the second landscape orientation of the
  outer screen.
- Whether web pages keep the column on the same side in Arabic.
- The width of the fold band. 40 points is seen in the vendor's design kit
  only.
- A hinge angle API, named only in secondary posts.
- Whether React Native libraries draw the side column on the 27.1 SDK.
