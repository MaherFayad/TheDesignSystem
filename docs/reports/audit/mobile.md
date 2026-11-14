# Mobile audit

Status: analysis only. No source file was changed. Date: 2026-11-14.
Screens: `docs/reports/audit/shots/mobile/` (96 phone screens in `matrix/`,
touch runs in `touch/`, component pages in `pages/`, contact sheets in
`sheets/`).

## Verdict

The owner is right on both counts. What exists for phones is a web component
set with a platform skin on top: the `ios` and `android` layers change
heights, radii, press feedback and where overlays come from, and a few parts
are genuinely good (the Sheet drag with detents, velocity and a rubber band;
the toast swipe; the iOS compact alert; the Liquid floating tab bar). But the
things that make an app feel like a phone app are not there. There is no
navigation stack, no large title, no action sheet, no wheel or date picker,
no pull to refresh, no swipe actions on rows, no carousel or page indicator,
no full screen modal, no safe area handling that works on a real iPhone (the
viewport meta lacks `viewport-fit=cover`, so every `env(safe-area-inset-*)`
in the CSS resolves to 0), and no haptics. Of the 12 part mobile family in
PLAN.md section 8, none is built. React Native has two components (Button,
IconButton). On top of that the screens are composed like web pages: an inset
top bar with an underlined link for a title, 16px icons in the tab bar, 14px
sheet titles, desktop dialog footers inside sheets, keyboard shortcut hints
in a long press menu, a five field form squeezed into a 270pt iOS alert, and
a snackbar that covers the bottom navigation on Android. The fix is not more
platform CSS; it is a real mobile family and phone templates built as screens.

## How this was checked

- Local gallery (`apps/gallery-react`, Vite on port 5233), the same build
  the live site serves. Playwright 1.63, Chromium, device descriptors
  `iPhone 17 Pro` (402 by 681 viewport with browser bars, scale 3) and
  `Pixel 9` (360 by 732, scale 3.5), touch on.
- The six phone screens of `/platforms/screen` (settings, form, alert, menu,
  sheet, toast) in Neutral, Liquid, Desk and Studio, light and dark, `ios`
  and `android`: 96 screens, all read through the contact sheets
  `sheets/<screen>-<platform>.jpg`.
- Touch driven with Chrome DevTools touch events (real `pointerType: touch`):
  sheet open by tap, drag between detents, rubber band, drag from the title
  and from the body, flick to close; toast swipe; drawer swipe; tap focus;
  long press on a row and on a context menu tile; tooltip tap and long press.
- Measurements read from the DOM with `getBoundingClientRect` and
  `getComputedStyle` (values below are CSS px).
- Current conventions checked against Apple's public guidance pages for
  sheets, tab bars and typography (text styles: body 17, headline 17
  semibold, large title 34, caption 2 at 11; sheets: medium and large
  detents, a grabber, swipe down to dismiss expected, full screen for
  multistep tasks; tab bar floats on glass, filled icons, five or fewer
  tabs). Material values are those already checked against token files in
  `docs/reports/platforms.md`.

## Inventory

Legend: **good** exists and holds up on a phone; **squeezed** exists but is a
desktop component scaled down; **partial** exists with real phone behaviour
but missing key parts; **missing** not built. Frameworks: R React, A
Angular, N React Native.

| Need on a phone | React | Angular | Native | Notes from the code and the run |
| --- | --- | --- | --- | --- |
| Bottom sheet with detents and drag | partial | missing | missing | `Sheet.tsx`: detents (fractions or px), drag on the handle with pointer capture, speed over the last 100ms, settle by position and speed, rubber band a third of travel (measured `-36px` past the top), flick closes. Drag works only from the handle strip (top about 40px), not from the body; at the half detent the footer actions sit below the screen (`touch/sheet-detent0-*`). No non modal detent (page stays usable), no background scale, panel never insets from the screen edge. |
| Modal sheet (page sheet) and full screen cover | missing | missing | missing | `overlaySizes` stop at `2xl`; no full screen size. On iOS a form Dialog becomes a 270pt alert (`sheets/dialog-form.jpg`). |
| Action sheet | missing | missing | missing | Family item in PLAN 8. DropdownMenu stands in. |
| Alert | good (ios), squeezed (android) | partial (Dialog only) | missing | iOS: 270 wide, centred, hairline split actions. Android: 28 radius, 24px title, but the cancel action draws as an outlined pill with a focus ring on open. |
| Popup and popover on a phone | squeezed | missing | missing | Popover opens a 240px floating card with a form and two small buttons (`pages/popover-open-*`). No sheet form on a phone. |
| Snackbar and toast | partial | partial | missing | Swipe works (ios up, android sideways; both closed). iOS banner keeps the web layout (bell icon, outlined 32px action under the title). Android snackbar sits on top of the tab bar (`toast` at y 646, tab bar at y 639). |
| Bottom navigation and tab bar | partial | missing | missing | Liquid floats a glass capsule; others are a flat strip. Icons 16px on both platforms. |
| Top app bar, large collapsing title | squeezed | missing | missing | Navbar is a website header: title is a `Link` with an underline (15px, 17 in Liquid), not sticky (`position: relative`), no large title part, Android shows a hamburger. |
| Navigation stack and back gesture | missing | missing | missing | No push, pop, back button, edge swipe, or shared title transition. |
| Search bar | squeezed | partial | missing | SearchField is a form input. No search in the bar, no cancel, no scope bar, no search tab. |
| Segmented control | good | partial | missing | iOS sliding lifted segment; Android outlined segmented buttons. |
| Picker and wheel picker | missing | missing | missing | Select opens a 224px floating listbox on both platforms (`pages/select-open-*`). |
| Date and time picker | missing | missing | missing | `/c/date` and `/c/carousel` return "No demo at this address". Wave 2 work. |
| Pull to refresh | missing | missing | missing | |
| Swipe actions on rows | missing | missing | missing | List rows show inline trash icon buttons instead (`pages/list-*`). |
| Long press and context menu | squeezed | missing | missing | Radix ContextMenu opens on long press, but shows keyboard shortcuts (Enter, F2, Ctrl+D, Del) on a phone; no lifted preview, no blur of the page. |
| List rows and grouped inset lists | partial | missing | missing | `variant="inset"` with separators from the text and chevrons. Rows 60px for one line on iOS (convention 44), 64 on Android (56). |
| Section headers and footers | missing | missing | missing | List has no header or footer part; groups are unlabelled. |
| Cards | squeezed | missing | missing | Web cards with an image box and a "more" button. |
| Chips | good | missing | missing | 36 tall, 32 drawn on Android, removable. |
| Floating action button | partial | partial | missing | Exists; overlaps the tab bar's last item on Android in every style, and the Liquid tab bar on iOS (`sheets/form-*`). |
| Speed dial | missing | missing | missing | |
| Stepper (plus and minus) | missing | missing | missing | `Stepper` is a step indicator; NumberField has optional steppers but is a form field. |
| Slider | good | good | missing | Platform shapes are right. |
| Switch | good | good | missing | Best part of the set. |
| Checkbox, radio | good | good | missing | Round checks on iOS (except Studio: square). |
| Text fields with a keyboard toolbar | squeezed | partial | missing | 16px input text (no iOS zoom). No `inputmode`, `enterkeyhint` or `autocomplete` set by the system, no accessory bar, no next and previous. |
| OTP entry | partial | partial | missing | Exists; needs `autocomplete="one-time-code"` check on device. |
| Keyboard avoidance | missing | missing | missing | No `visualViewport` or `interactive-widget` use; sheets and dialogs autofocus the first field, so the keyboard opens over the footer on open. |
| Safe areas and home indicator | missing in effect | missing | missing | CSS reads `env(safe-area-inset-*)` in Dialog, TabBar, Lightbox, CommandPalette, but `index.html` and the docs `Layout.astro` say `width=device-width, initial-scale=1` with no `viewport-fit=cover`, so on an iPhone those are 0 and the page never extends under the bars. |
| Haptics hooks | missing | missing | missing | No `vibrate`, no haptic event names in shared or motion. |
| Skeletons | good | good | missing | |
| Empty states | squeezed | partial | missing | Desktop composition (icon, two buttons side by side). |
| Page indicator and carousel | missing | missing | missing | |
| Onboarding | missing | missing | missing | Tour (coach marks) and FormWizard exist; no paged onboarding. |
| Permission prompts | missing | missing | missing | ConsentField exists for forms only. |
| Banners | squeezed | partial | missing | Web banners with a close cross. |
| Badges | good | missing | missing | |
| Avatars | good | missing | missing | |
| Media viewer | partial | missing | missing | Lightbox: `touch-action: pan-y pinch-zoom`, sideways swipe, safe area padding. |
| Bottom toolbar | missing | missing | missing | Toolbar is a top toolbar. |
| Drawer navigation | partial | missing | missing | Drawer swipe closes from its handle strip (ios: closed); on Android a swipe on the panel body did nothing, and the drawer fills the whole 360px screen with no scrim edge. |

Angular has 60 components (`packages/angular/src/components`): actions,
inputs, selection, forms, feedback, dialog, dropdown menu, toast, title bar
and window controls. It has no Sheet, Drawer, TabBar, Navbar, List, Popover,
ContextMenu or Card.

React Native has exactly two components, from the wave 0 proof:
- `packages/native/src/components/Button/` (`Button.tsx`, `ButtonBase.tsx`,
  `Button.styles.ts`, `Button.test.tsx`, `Button.demo.tsx`, `index.ts`)
- `packages/native/src/components/IconButton/` (`IconButton.tsx`,
  `IconButton.demo.tsx`, `index.ts`)

plus the theme in `packages/native/src/theme/` and the Expo gallery in
`apps/gallery-native/`. No sheet, toast, list, tab bar or navigation exists
there, so there is nothing native to compare on a phone.

## Scorecard (0 to 5)

| Area | Score | Evidence |
| --- | --- | --- |
| Component coverage for phones | 1 | 0 of the 12 mobile family parts; no action sheet, picker, date, pull to refresh, swipe rows, stack, carousel. |
| Type on a phone | 2 | Body 16px (iOS body is 17), sheet title 14px semibold, navbar title 15px, iOS alert actions 14px, no large title; Liquid row description 17px is larger than its 16px title. |
| Touch targets and spacing | 3 | Targets pass 44 and 48; but content is inset 34px from the screen edge (16 gallery plus 18 body padding) where iOS uses 16 to 20, rows are 60 and 64 tall for one line. |
| Corner radii and nesting | 3 | Liquid follows inner equals outer minus padding (menu 22, rows 16); sheet panel 28 top only, flush to the screen; Studio sheets and alerts square on iOS. |
| Depth and materials | 3 | Liquid glass bars and sheets are convincing; Neutral and Studio bars are flat white boxes; overlays blur the whole page into a grey wash. |
| Colour | 3 | Each style keeps its colour; Neutral blue title links and underlines read as web links. |
| Icons | 1 | Tab bar icons 16 by 16 on both platforms (Material 24dp, iOS tab glyphs about 25 to 28pt), 1.5px line icons where iOS tab bars use filled glyphs. |
| List and form density | 3 | Inset groups and chevrons are right; no section headers, no value column, labels above fields like a web form, three buttons in a row in a form. |
| Navigation chrome | 1 | Inset non sticky header with an underlined link title, a text "Edit list" button, Android hamburger; no back, no large title, no bar that collapses. |
| Sheets and alerts composition | 2 | iOS alert good; sheets carry a desktop header with a cross plus a two button footer at the end; Desk adds window lights to sheets and alerts on a phone; a form Dialog on iOS becomes a 270pt alert. |
| Motion and gesture | 3 | Sheet drag, detents, rubber band and flick are real and toast swipe is real; no drag from content, no edge swipe back, no row swipe, no pull to refresh, no momentum of the page under a sheet. |
| One handed reach | 2 | Primary actions at the top (header Edit list) or below a half detent; FAB collides with the tab bar; menus open from the top. |
| Safe areas | 1 | `viewport-fit=cover` missing, so every safe area rule is 0 on iOS; screens are framed by gallery padding, not by insets. |
| Dark mode | 3 | Every style has a true dark scheme; Liquid dark is pure black and holds; Desk dark sheets and alerts lose separation from the blurred page. |
| React Native | 0 | Two components; no phone screen can be built. |
| Angular on a phone | 1 | No sheet, drawer, tab bar, navbar or list. |

## Findings

### 1. The screens read as web pages

`sheets/settings-ios.jpg`, `sheets/settings-android.jpg`

- The top bar is a white box 370 by 50 placed 16px in and 20px down from
  the screen edge (gallery padding with `chrome=0`), so it floats like a web
  header, not edge to edge under the status bar. It is `position: relative`
  and scrolls away (`touch/settings-scrolled-*`).
- The title is a `Link` with an underline: 15px weight 600 on iOS Neutral
  (17 in Liquid), 15px weight 400 on Android. iOS uses a 17 semibold title or
  a 34 large title; Material uses a 22sp title. A blue underlined title is the
  single strongest "this is a website" cue.
- The trailing action "Edit list" is a ghost Button, 14px.
- Tab bar icons are 16 by 16 in every style and platform. Labels are 10px on
  iOS (right) and 13px on Android (Material is 12).
- Content gutters are 34px (16 plus 18). Row titles truncate ("Sync over
  mobile d...", "Show previe...") because of that gutter and a 76 by 44
  switch box.
- Android navbar in the component page shows a hamburger (`pages/navbar-*`),
  a desktop collapse pattern; phone apps use a bottom bar or a drawer edge.

### 2. Overlays are desktop overlays with a skin

`sheets/sheet-ios.jpg`, `sheets/sheet-android.jpg`, `sheets/alert-*.jpg`,
`sheets/dialog-form.jpg`, `sheets/menu-*.jpg`

- Sheet: header is title (14px, weight 600, start aligned) plus a 27 by 32
  drawn cross; body; footer with "Discard invite" and "Send invite" at the
  inline end, 44 tall (40 on Android). A phone sheet puts Cancel and the
  action in the bar or a full width primary at the bottom, and the title at
  17 semibold centred (iOS) or 22 (Material).
- Sheet panel spans the full width (x 0, 402 wide), radius 28 on the top
  only. Current iOS sheets float inset with large radii on all corners at the
  medium detent.
- On open the first input is focused and shows a focus ring
  (`:focus-visible` true). On a phone that raises the keyboard at once over
  the footer.
- Desk draws a yellow title bar with three window lights on sheets and
  alerts on a phone (`sheets/sheet-ios.jpg` bottom left). That is a desktop
  window metaphor in a phone overlay.
- Form Dialog on iOS: 270 wide by 545 tall, labels centred above fields,
  two split actions at the bottom (`touch/dialog-form-ios-neutral-light.png`).
  Five fields belong in a page sheet or full screen modal with Cancel and
  Create in the bar. On Android the same dialog is 304 wide; Material asks
  for a full screen dialog for forms on a phone.
- Android alert: title 24px weight 400 and 28 radius are right, but "Keep
  board" is an outlined pill with a visible focus ring; Material dialog
  actions are text buttons.
- Menus: iOS menu 250 wide, 44 rows, 17px text, radius 22 in Liquid, is
  close. Android 175 wide, 48 rows, 14px. Both open from a top trigger.
- Select opens a 224px floating listbox anchored to the trigger on both
  platforms. On a phone this should be a menu (iOS pull down), a wheel, or a
  sheet with a list.
- Popover holds a form (rename layer) in a 240px card. On a phone this is a
  sheet.
- Context menu on long press: opens, but lists Enter, F2, Ctrl+D and Del
  shortcuts and a submenu chevron; no lifted preview of the pressed item.

### 3. Toasts and the bottom of the screen

`sheets/toast-*.jpg`, `sheets/form-*.jpg`

- Android snackbar: 328 by 70 at y 646, on top of the tab bar that starts at
  y 639, in every style. In Liquid it also covers the floating capsule. It
  must sit above the navigation bar.
- iOS banner: 370 by 90 at the top, with a bell icon, the title, an outlined
  89 by 32 "Undo move" button under it, and a close cross. Reads as a web
  notification.
- FAB: on Android it sits on the last tab item (Settings) in every style; on
  iOS Liquid it overlaps the floating tab bar. It needs to lift above the
  bar by the bar height plus a gap.

### 4. Gesture and touch behaviour

`touch/` and `sheets/touch-sheet.jpg`, `sheets/touch-other.jpg`

| Behaviour | Result |
| --- | --- |
| Sheet drag between detents | Works. Tap on trigger, drag handle up 260px: settles at detent 1 (panel y 340 to 24). |
| Rubber band past the top | Works, a third of the travel. |
| Flick down to close | Works on both platforms. |
| Drag from the body of a sheet | Does nothing. Native sheets drag from anywhere when the content is scrolled to the top. |
| Actions at the half detent | Footer is below the screen edge; the primary action cannot be reached without expanding. |
| Scroll chaining behind a sheet | None: body `overflow: hidden`, sheet body `overscroll-behavior: contain`, page `scrollY` stayed 0 under a swipe on the backdrop. Good. |
| Toast swipe | Works: iOS up, Android sideways; both closed. |
| Drawer swipe | iOS (bottom drawer): handle strip swipe closes. Android (end side): a swipe on the panel body does not close; the panel fills the full 360px. |
| 300ms delay | None: `width=device-width` removes it. `touch-action: manipulation` is not set, so double tap zoom is still live on non button targets. |
| Hover only affordances | Hover rules are gated with `@media (hover: hover)` in most component files (16 gates); List rows still show trash icon buttons inline, which is the desktop affordance made visible. |
| Focus ring on tap | Tapping a Button leaves `:focus-visible` false: correct. Opening an overlay focuses its first field with a visible ring: wrong on a phone. |
| Tap highlight | `-webkit-tap-highlight-color` is transparent on Button, Chip, Tabs, TabBar, SegmentedControl; list row links, Switch, Checkbox and the Slider thumb keep the default blue flash (`rgba(51, 181, 229, 0.4)`). |
| Text selection on long press | A 900ms press on a row title selected nothing in Chromium; `user-select` is `auto` on body, rows, switches and checkboxes, so Safari will select row text and show the callout. `-webkit-touch-callout` is never set. |
| Overscroll | `overscroll-behavior` is `auto` on html and body: the page bounces and Chrome pull to refresh reloads the app. |
| Keyboard covering fields | Not handled: no `visualViewport` listener, no `interactive-widget=resizes-content`, no keyboard inset variable. Sheets autofocus inputs on open. |
| Viewport units and browser bars | Phone frame uses `min-block-size: 100dvh` and dialogs `80dvh`: correct. |
| Momentum | Native momentum is left to the browser (fine); there is no scroll linked chrome (bar shrink, tab bar minimise, large title collapse). |
| Tooltip on touch | Not available: a tap or a long press on a trigger changes nothing (`platforms.md`, "Weak differences"). |
| Haptics | None anywhere. |

### 5. Per style on a phone

- Liquid is the only style that reads as a current phone app: glass navbar
  (`blur(20px) saturate(1.8)`), floating capsule tab bar 346 by 59 with the
  current item as a lens, sheets on strong glass with `blur(32px)`, radius
  22 lists. It still has 16px tab icons, the underlined title and the web
  sheet footer.
- Neutral reads as a responsive SaaS page: flat white bars, blue links,
  12px radius lists.
- Desk carries desktop metaphors onto the phone: window lights on sheets
  and alerts, grain, a full blur of the page under every overlay.
- Studio is consistent but square: square checks on iOS, square sheets,
  black block buttons; fine for a pro tool, not for a consumer phone app.
- Dark: all four hold contrast. Desk dark overlays lose their edge against
  the blurred black page.

## Proposed mobile component set

Wraps an existing component (W) or new (N). Each needs React, Angular on the
same CSS, and React Native.

| Name | W or N | One line |
| --- | --- | --- |
| NavigationStack | N | Push and pop screens with a shared bar, back button, edge swipe back on iOS and system back on Android, state per tab. |
| NavigationBar | W Navbar | Sticky edge to edge bar with leading back, centred or start title, trailing actions, a large title part that collapses on scroll, search slot, scroll edge material. |
| TabBar (phone) | W TabBar | 24px filled icons, safe area inset, minimise on scroll, search tab, raises toasts and FAB above it. |
| BottomSheet | W Sheet | Inset floating panel at the medium detent, drag from content at scroll top, non modal detents, actions in the bar or pinned above the home indicator at every detent. |
| PageSheet and FullScreenModal | W Dialog | Bar with Cancel, title, primary; replaces the alert form of Dialog on phones. |
| ActionSheet | N | Bottom list of actions with a separate cancel, destructive in red; the phone form of DropdownMenu. |
| Alert | W AlertDialog | Keep iOS; Android text actions; never a form. |
| Snackbar and Banner | W Toast | Android one line above the nav bar, iOS compact banner from the top with no icon frame. |
| SwipeActions | N | Leading and trailing row actions with full swipe, a button path and VoiceOver actions. |
| PullToRefresh | N | Spinner from the top edge with rubber band; overscroll contained elsewhere. |
| ListSection | W List | Inset group with header, footer, value column, disclosure, and a 44 or 56 row height. |
| WheelPicker | N | iOS wheel with snap and haptic tick; the phone form of Select. |
| DatePicker (phone) | N | Inline calendar in a sheet plus wheel time, Hijri option. |
| SearchBar | W SearchField | In the bar or the tab bar, cancel action, scope chips, recent list. |
| LongPressMenu | W ContextMenu | Lifted preview, blurred page, no shortcuts on touch. |
| SafeArea | N | Insets as CSS variables and a provider; requires `viewport-fit=cover`. |
| KeyboardAvoider | N | `visualViewport` inset variable, field scroll into view, accessory bar with previous, next and done. |
| BottomToolbar | W Toolbar | Bottom placement with safe area, two to five actions. |
| PageIndicator and Carousel | N | Paged scroll snap with dots; for onboarding and media. |
| Onboarding | N | Paged screens with a primary at the bottom and a skip. |
| PermissionPrompt | N | Pre prompt screen or sheet that explains before the system asks. |
| ScrollEdge | N | Scroll linked material and title change for bars. |
| SpeedDial | W FloatingActionButton | FAB that fans out two to four labelled actions. |
| QuantityStepper | W NumberField | Minus, value, plus in one capsule. |
| Haptics | N | `haptic(kind)` with selection, impact, success and warning: no op on the web, Expo Haptics on native. |

### What a phone demo app must prove

One app, four tabs, built only from system parts, in all four styles, both
platforms, light and dark, English and Arabic:
1. Home: large title that collapses, pull to refresh, list sections with
   swipe actions, a FAB that clears the tab bar.
2. Search: search bar in the bar, scope chips, results, empty state.
3. Detail: pushed onto the stack, back by button, edge swipe and system
   back, share opens an action sheet, a long press menu with a preview.
4. Create: full screen modal form with a keyboard toolbar, a date picker
   and a wheel picker, a discard confirm when swiped down with changes.
5. Settings: grouped inset list with section headers, switches, a medium
   detent sheet that stays usable at half height, a snackbar with undo.
6. Onboarding on first launch with a page indicator and a permission
   pre prompt.
Proof: run on an iPhone in Safari added to the home screen, on an Android
phone in Chrome, and as an Expo build; screen recordings of each gesture;
safe areas visible under the notch and home indicator; contract tests for
each gesture's button path.

## Ten changes in order of effect on perceived quality

1. Add `viewport-fit=cover` to the gallery and docs viewport meta and build
   a SafeArea part, so bars run under the status bar and above the home
   indicator. Remove the gallery padding around phone screens.
2. Rebuild the top bar as NavigationBar: edge to edge, sticky, plain text
   title (17 semibold iOS, 22 Material), back button, large title that
   collapses on scroll. No underlined link titles.
3. Tab bar icons to 24px with filled forms for the current tab; lift
   toasts and the FAB above the tab bar.
4. Recompose sheets for phones: 17px title, actions in the bar or a full
   width bottom primary pinned above the safe area at every detent, inset
   floating panel at the medium detent, drag from content at scroll top,
   no autofocus on open.
5. Phone forms of overlays: ActionSheet for menus, a sheet or wheel for
   Select, a sheet for Popover, PageSheet or full screen for form Dialogs.
6. NavigationStack with push, pop and edge swipe back.
7. Row gestures and list structure: SwipeActions, ListSection headers and
   footers, 44 and 56 row heights, value column, no inline icon buttons.
8. Gutter and type scale on phones: 16 to 20px screen margins, 17px body on
   iOS, a phone text ramp (34, 22, 17, 15, 13, 11).
9. Touch hygiene in base CSS: transparent tap highlight and
   `touch-action: manipulation` on all controls, `user-select: none` and
   `-webkit-touch-callout: none` on interactive rows, `overscroll-behavior:
   none` on the app root, KeyboardAvoider, haptics hooks.
10. Remove desktop metaphors on phones: no window lights on sheets and
    alerts in Desk, no shortcut hints in touch menus, no hamburger on
    Android navbars.

## What I could not check

- Real devices. Chromium emulates the iPhone viewport but not Safari: safe
  area insets, the virtual keyboard, rubber band overscroll, text selection
  callouts and the bottom URL bar were judged from code and CSS, not seen.
- Haptics, VoiceOver and TalkBack gestures.
- The React Native gallery on a device (only two components exist).
- Angular on a phone (no phone components to open).
- The live URL was not driven; the local gallery is the same source. The
  live site has the same viewport meta (`width=device-width,
  initial-scale=1`), checked with curl.
- Whether a long press context menu stays open after the finger lifts: it
  opened while held; my state check after release was not conclusive.
- Tooltip on touch: the demo shows tooltips open by default, so the tap test
  could not tell a change; the platforms report says long press is not
  wired.
