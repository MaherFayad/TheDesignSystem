# Native audit: iOS and Android components

Status: research and analysis only. No source file was changed. Date:
2026-11-15. Evidence: `docs/reports/audit/shots/native/` (`versions.json`,
`jest-results.json`, `environment.json`, `npm-registry.json`,
`sources-fetched.json`, `web-export-measures.json` and three PNG files of the
web export).

## Verdict

No. The earlier audits judged phones through the web components in an
emulated browser, and nobody has checked native work on a device. What exists
on React Native is a theme provider and one button family (Button and
IconButton). They are tidy and well tested in jest, and they read the same
tokens as the web, but they are not built the way a good iOS or Android
component is built today: the press feedback is identical on both platforms
and runs through the JavaScript thread, Android has no ripple, there are no
haptics, the type is the desktop web scale (a 12 point label where iOS uses 17
and Material uses 14), the platform axis changes nothing but the touch slop,
the theme does not follow the system dark mode by default, and the Liquid theme
asks the device for a font called "Segoe UI". More important for the owner's
question: the plan builds the whole native set in JavaScript, and that cannot
give a real iOS or Android app. Since the plan was written, Expo SDK 58 has
made native tabs and native toolbars stable and ships `@expo/ui`, which
renders real SwiftUI and Jetpack Compose views (menus, sheets, pickers, date
pickers, alerts, navigation) from React. The platform vendors both say the
same thing: use the standard components and you get the current material
(Liquid Glass on iOS 26 and later, Material 3 and its Expressive update on
Android) for free; custom chrome fights it. The recommendation is a hybrid:
navigation chrome, tab bar, sheets, menus, pickers and alerts as real platform
views, brand controls drawn from tokens in JavaScript with a per platform
behaviour profile. That needs the owner to widen the dependency allow list.

## 1. Audit of what exists

### How it is built

| Part | Files | How it works |
| --- | --- | --- |
| ThemeProvider | `packages/native/src/theme/ThemeProvider.tsx`, `system.ts`, `resolve.ts`, `hooks.ts` | A context provider with no view of its own. Resolves the axes with the shared `resolveTheme`, then picks `themes[style][scheme]` from `@the-system/tokens/native`, merges density, swaps glass for `glass-solid` under more contrast or reduce transparency, and caches per combination. The root reads `Platform.OS`, `I18nManager.isRTL`, `AccessibilityInfo` (reduce motion, reduce transparency and darker system colours on iOS, high text contrast on Android) and `useColorScheme` only when `followSystem` is set. |
| Button | `components/Button/Button.tsx`, `ButtonBase.tsx`, `Button.styles.ts` | React Native core `Pressable` wrapped by `Animated.createAnimatedComponent` (Reanimated 4.7). Press in and out are JS callbacks: they set React state (`pressed`) for the pressed colours and start a `withSpring` scale on a shared value. Styles: a pure function ports the CSS cascade into `StyleSheet.create`, memoised per theme object and variant key, with a style pack recipe merged over the base (only Desk has one). `hitSlop` grows the touch area to `size.touch.ios` (44) or `size.touch.android` (48). |
| IconButton | `components/IconButton/IconButton.tsx` | The same `ButtonRoot`, a square of the control height, `label` becomes `accessibilityLabel`. |
| Gallery | `apps/gallery-native/src/App.tsx` | Expo app, `SafeAreaProvider` and `SafeAreaView`, a scroll view of system Buttons for axis controls. Proven so far only through `expo export --platform web` screenshots. |

No Gesture Handler, no `@rn-primitives/*`, no haptics, no glass, no blur, no
navigation library and no status bar handling are used or installed
(`shots/native/versions.json`).

### What ran here

| Check | Result |
| --- | --- |
| `npm run check` in `packages/native` (tsc and jest, preset `jest-expo/ios`) | Pass, 60 of 60 |
| The same jest suite under `jest-expo/android` | 59 of 60. `ThemeProvider.test.tsx:30` expects `platform: 'ios'`; the suite only ever runs as iOS in `npm run check` (`jest.config.cjs:14`) |
| Gallery typecheck | Pass |
| `expo export --platform web` | Builds, 654 modules, 1.5 MB |
| `expo export --platform android` and `--platform ios` | Both build Hermes bytecode bundles (3 MB). This proves the JavaScript compiles for both engines, nothing more |
| `npx expo-doctor` | 18 of 20: two React copies (19.3.0 and 19.3.1, a known workspace trade off, see the gallery README), `expo` 58.0.24 one patch behind 58.0.25 |
| Android emulator | Cannot run: no `adb`, no SDK, no `/dev/kvm` (`shots/native/environment.json`) |
| iOS | Cannot build on Linux |

A web export renders the React Native components through `react-native-web`
in Chromium. It proves token values and layout, not native look or feel: no
UIKit or Android view is involved, so press timing, ripple, haptics, glass,
system fonts, Dynamic Type, VoiceOver, TalkBack and safe areas are all
untested. The three PNG files in `shots/native/` are kept only as a record of
the measured values below.

### Judged against a good React Native component today

| Concern | Today | Good practice (sources in section 3) | Grade |
| --- | --- | --- | --- |
| Press feedback, iOS | Scale spring from `spring.press`, colour swap through React state | Highlight or opacity dim at once under the finger, run on the platform | Partial |
| Press feedback, Android | The same as iOS. No ripple anywhere | Ripple from the touch point. Gesture Handler 3 `Touchable` draws the ripple and the opacity, underlay and scale animations on the platform; core `Pressable` has `android_ripple`, which since React Native 0.86 accepts `PlatformColor` | Missing |
| Thread | `onPressIn` and `onPressOut` run in JS, then `setPressed` re-renders the button | Gesture Handler recognises touches natively; the docs say core touchables need a round trip to JS that delays the ripple | Weak |
| Studio press | `scale.press` is 1 in Studio (`studio.dark.ts:898`), so the only feedback is a colour change through React state | Visible feedback within a frame | Weak |
| Haptics | None | `expo-haptics` (an allowed optional peer): `selectionAsync`, `impactAsync`, `notificationAsync`, and on Android `performAndroidHapticsAsync` with `confirm`, `context-click`, `drag-start` and more, which needs no vibrate permission | Missing |
| Target size | `hitSlop` to 44 or 48 around a 24 to 32 point drawn box | Hit slop is accepted, but TalkBack and accessibility scanners measure the view bounds (from memory, unverified), and slop overlaps neighbours (the native proof saw this with sm buttons) | Partial |
| Role and state | `accessibilityRole="button"`, `accessibilityState` disabled and busy, loading as `accessibilityValue` | Right. React Native now also offers `role` and `aria-*` props; not a defect | Good |
| Large content viewer | Not set on IconButton | `accessibilityShowsLargeContentViewer` and `accessibilityLargeContentTitle` exist in React Native 0.88 (`types_generated/.../ViewAccessibility.d.ts:168`) and are what iOS uses for icon only bar buttons at large text sizes | Missing |
| Dynamic Type | Never turns font scaling off, height is a minimum: good. One line with an ellipsis by default, no `maxFontSizeMultiplier` policy, icons do not scale | Labels wrap at accessibility sizes; a ceiling only where layout cannot grow | Partial |
| Right to left | `paddingStart` and `paddingEnd`, `start` and `end`, `direction` on the root, mirrored icons by theme direction | Right. Whether `direction` lays out on Android was not checked on a device | Good |
| Dark mode | Scheme from the style default; device scheme only with `followSystem` (default false) while `app.json` says `userInterfaceStyle: "automatic"`, so system chrome and the keyboard follow the device and content does not | Follow the system by default, opt out per app | Defect |
| High contrast | More contrast swaps glass for solid; no border or text change for buttons | iOS darker system colours and Android high text contrast read: good start | Partial |
| Bold text, cross fade | Not read | `isBoldTextEnabled`, `prefersCrossFadeTransitions` exist in 0.88 | Missing |
| Reduce motion | Scale off; the spinner stops | Keep progress indicators moving or replace with a non moving cue; a stopped spinner reads as frozen | Partial |
| Reduce transparency | Read on iOS, glass becomes solid in the theme | Right | Good |
| Safe areas, keyboard | Not the components' job; the gallery uses `SafeAreaView`. No keyboard handling exists in the package | Provider level parts | Not started |
| Platform shape and type | One look for both platforms; Liquid asks for "Segoe UI" | System font per platform; iOS text styles (body 17), Material type roles (label large 14); platform button heights | Defect |
| New Architecture | React Native 0.88 is New Architecture only (since 0.82); Reanimated 4 requires it. No legacy API is used | Ready | Good |
| Animation thread | Scale runs as a Reanimated worklet: good. Colours go through React state | Drive pressed colours from a shared value or the platform | Partial |
| Testability | Jest with expected values read from the theme objects: very good. But every button has the same `testID` and a consumer `testID` is overwritten | Unique, overridable test ids for Maestro or Detox | Defect |
| Bundle | Source exports, no `sideEffects` field, every icon glyph bundled (48 KB of generated data) and parsed at run time with a cache | Acceptable for now | Note |

### Defects by file and line

Blocker: wrong on a phone or blocks the next step. Note: worth fixing.

| # | File and line | Finding | Level |
| --- | --- | --- | --- |
| 1 | `packages/native/src/components/Button/ButtonBase.tsx:74`, `:134` to `:170` | Core `Pressable` with JS press callbacks. No `android_ripple`, no platform branch: iOS and Android get the same scale. Use Gesture Handler 3 `Touchable` (ripple on Android, opacity or underlay on iOS, on the platform) | Blocker |
| 2 | `ButtonBase.tsx:115`, `:145`, `:150`, `:164` to `:165` | Pressed and hovered colours come from React state, so each press re-renders the button on the JS thread. Under load the colour lags the finger | Blocker |
| 3 | `ButtonBase.tsx` (whole file) | No haptics hook. Nothing in `packages/shared` or the theme names haptic events | Blocker |
| 4 | `ButtonBase.tsx:41`, `:134` to `:141` | `disabled` is removed from the Pressable props and never passed, so the Pressable stays enabled while disabled or loading and only a JS guard blocks presses; a ripple or native feedback added later would still fire | Note |
| 5 | `ButtonBase.tsx:135` to `:136` | `testID` is set after the spread, so a consumer `testID` is overwritten, and every button shares `ds-button` | Blocker for device tests |
| 6 | `ButtonBase.tsx:162` to `:169` | No focus style (`onFocus` and `onBlur` are not used). Android draws no focus indicator for a Pressable, so keyboard and switch access users see nothing | Blocker |
| 7 | `ButtonBase.tsx:174` | `animating={!reduceMotion}` freezes the loading spinner | Note |
| 8 | `IconButton/IconButton.tsx:324` to `:329` | No `accessibilityShowsLargeContentViewer` or `accessibilityLargeContentTitle` for the icon only button | Note |
| 9 | `Button/Button.tsx:262` | One line with an ellipsis is the default, so at accessibility text sizes a label is cut rather than wrapped; no `maxFontSizeMultiplier` policy anywhere | Note |
| 10 | `Button/Button.styles.ts:216` to `:226` | Button metrics come from the web desktop scale: md is 32 high with `font.size.s` (12 in Studio, 14 in Liquid). iOS body and button text is 17, Material label large is 14 and buttons are 40 high | Blocker |
| 11 | `Button.styles.ts:39`, `:365` | `platform` is read only for the touch target. Shape, type, weight and feedback never change per platform | Blocker |
| 12 | `Button.styles.ts:311`, `:341` | Font family from the theme (`Inter Variable`, `Instrument Sans`, `Segoe UI`) while the default `FontSource` is `theme` (`ThemeProvider.tsx:64`). On a device those families are not registered, so text falls back with a warning, or an error in development on iOS (from memory, unverified) | Blocker |
| 13 | `Button.styles.ts:343` | `fontWeight` 700 with a custom family needs a file per weight on Android | Note |
| 14 | `Button.styles.ts:366` to `:367`, `:391` | Touch size from `hitSlop` only, drawn box 24 to 32. Slop overlaps neighbours closer than the slop; scanners and TalkBack use view bounds (unverified) | Note |
| 15 | `packages/native/src/theme/ThemeProvider.tsx:55` | `followSystem` defaults to false: the app ignores the system appearance while the system chrome follows it | Blocker |
| 16 | `ThemeProvider.tsx:60` to `:77` | Font scale (`useWindowDimensions().fontScale`), bold text and cross fade are not read, so no component can adapt to them | Note |
| 17 | `theme/system.ts:40` | Settings start as all false until the promises resolve, so the first frame ignores reduce motion and reduce transparency | Note |
| 18 | `packages/tokens/dist/native/index.ts:17` to `:22` (written by `packages/tokens/build.ts`) | Theme objects are keyed by style and scheme only. There is no platform layer, so the `platform` axis cannot change any value on native | Blocker |
| 19 | `packages/tokens/dist/native/liquid.light.ts:584` to `:590` (and every style, `mono`) | The build takes the first named family of a CSS system stack: Liquid's sans becomes `Segoe UI` and every style's mono `SFMono-Regular`. On iOS and Android a system stack must map to `undefined` (the platform font) | Blocker |
| 20 | `liquid.light.ts:436` to `:438` | `ease.spring-*` are CSS `linear()` strings in a native theme object; a native consumer needs springs as physics numbers (they exist under `spring`) or numeric points | Note |
| 21 | `theme/resolve.ts:71` to `:73` | A style without native theme objects (Paper) silently draws as Studio | Note |
| 22 | `theme/recipes.ts:30` to `:32`, `theme/icons.ts:9` to `:12` | Only Desk has a native recipe and only Studio and Desk icon packs: Neutral and Liquid on native are the base look, not their designed look | Note |
| 23 | `packages/native/package.json:15` to `:28` | `react-native`, `react-native-reanimated`, `react-native-worklets` and `react-native-svg` are dev dependencies only, with no `peerDependencies`. A consumer gets no install signal | Blocker for consumers |
| 24 | `packages/native/jest.config.cjs:14`, `src/theme/ThemeProvider.test.tsx:30` | Tests run under the iOS preset only; the Android run fails one test that hard codes `ios` | Note |
| 25 | `apps/gallery-native/src/App.tsx:45` to `:46` | No `GestureHandlerRootView`, no `StatusBar` from `expo-status-bar`; nothing sets the status bar style per scheme on an edge to edge Android | Note |
| 26 | `apps/gallery-native/src/App.tsx:128` | The selected axis option is announced through `accessibilityHint="Selected"` instead of `accessibilityState={{ selected: true }}` in a radio group | Note |
| 27 | `packages/manifest/src/component/Button.manifest.json:330` | Native `status: "ready"` while Neutral and Liquid have no native look and Android has no ripple; the web Button has since gained the round 3 press motion the native one lacks | Note |
| 28 | `docs/reports/ios-check.md` (section 2) | The iPhone steps depend on Expo Go for SDK 58. The SDK 58 post (2026-10-15) said Expo Go would ship "within a few weeks"; whether it is in the App Store today was not checked. A development build is the reliable route | Note |

What is good and should stay: the CSS cascade port with tests that read
expected values from the theme objects; logical styles; the theme cache; the
honest handling of direction before and after a restart; icons hidden from
assistive tech inside buttons; reduce transparency feeding solid materials.

## 2. Research

### Installed versions and what they support

| Package | Installed | Expo SDK 58 expects | Notes |
| --- | --- | --- | --- |
| `expo` | 58.0.24 | 58.0.25 | SDK 58 released 2026-10-15, React Native 0.88, built with the iOS 27 SDK |
| `react-native` | 0.88.1 | 0.88 | Released 2026-10-19. New Architecture only since 0.82. 0.86 (2026-06-11) fixed edge to edge on Android 15 and later, `KeyboardAvoidingView` under edge to edge, and lets `android_ripple` take `PlatformColor`. 0.88 adds variable fonts and W3C event dispatching |
| `react` (native workspaces) | 19.3.0 | 19.3.0 | Root keeps 19.3.1 for the web |
| `react-native-reanimated` | 4.7.1 | 4.7.1 | Supports React Native 0.86 to 0.88, worklets 0.13, New Architecture only |
| `react-native-worklets` | 0.13.0 | 0.13.0 | |
| `react-native-gesture-handler` | not installed | ~3.3.0 (registry latest 3.5.0) | On the allow list. Version 3 has a hook API and a new `Touchable` that replaces the old buttons; the old `RectButton` family is deprecated |
| `react-native-safe-area-context` | 5.11.1 | ~5.11.1 | On the allow list |
| `react-native-svg` | 15.16.0 | 15.16.0 | |
| `expo-glass-effect` | not installed | ~58.0.5 | Optional peer on the allow list |
| `expo-blur`, `expo-haptics` | not installed | ~58.0.6, ~58.0.8 | Optional peers on the allow list |
| `@expo/ui` | not installed | ~58.0.28 | Not on the allow list |
| `react-native-screens`, `expo-router` | not installed | ~4.30.1, ~58.0.31 | Not on the allow list |
| `@rn-primitives/*` | not installed | | On the allow list, never used |

### (a) Drawn in JavaScript on React Native primitives

What the plan describes. Fidelity: controls can match a brand exactly, and
with Gesture Handler 3 `Touchable` and Reanimated springs the press, drag and
sheet physics can be close. What it cannot get: the system navigation
transition and edge swipe, the large title collapse, the Liquid Glass
material and its morphing between controls (a `GlassView` behind a drawn bar
is the material, but not the system bar's scroll edge effect, grouping or
morph), the native sheet with its detents, background scale and keyboard
behaviour, the context menu lift and preview, the system wheel and date
picker, and the free accessibility behaviour of system controls (VoiceOver
rotor items, large content viewer on bars, TalkBack actions, predictive back
animations). Each of those would be imitated and then chased every year.
Token and manifest fit: perfect. Theming across styles: perfect. Cost: high
and permanent. Licences: all on the allow list.

### (b) Expo native UI packages

`@expo/ui` 58.0.28, MIT, included in Expo Go. Components are wrapped in a
`Host`; inside it the native toolkit lays out (no Yoga), and React Native
views can be hosted inside native ones through `RNHostView`.

- SwiftUI (`@expo/ui/swift-ui`): Alert, BottomSheet, Button, ColorPicker,
  ConfirmationDialog, ContextMenu, ControlGroup, DatePicker, DisclosureGroup,
  Form, Gauge, Label, LazyHStack, LazyVStack, List, Menu, NavigationSplitView,
  NavigationStack, Picker, Popover, ProgressView, Section, SecureField, Slider,
  SwipeActions, TabView, TextField, Toggle, Toolbar and layout parts. SDK 58
  added the navigation parts, a recycling `List` and lazy stacks.
- Jetpack Compose (`@expo/ui/jetpack-compose`): AlertDialog, Badge, Button,
  Card, Carousel, Checkbox, Chip, DateTimePicker, DockedSearchBar,
  DropdownMenu, ExposedDropdownMenuBox, FloatingActionButton,
  HorizontalFloatingToolbar, HorizontalPager, IconButton, LazyColumn,
  ListItem, LoadingIndicator, Material colours (with dynamic colour),
  ModalBottomSheet, NavigationBar, PullToRefreshBox, RadioButton, SearchBar,
  SegmentedButton, Slider, Snackbar, SplitButtonLayout, Switch, TextField,
  ToggleButton, Tooltip, TopAppBar. On Material 3 for Compose 1.5.0-beta01 in
  SDK 58. Several of these (LoadingIndicator, SplitButtonLayout,
  HorizontalFloatingToolbar, ToggleButton) are Expressive components by name,
  but the docs never say "Expressive".
- Universal (`@expo/ui`): BottomSheet, Button, Checkbox, Collapsible,
  FieldGroup, Icon, List, Picker, ScrollView, Slider, Switch, Text, TextInput,
  one tree that delegates to SwiftUI or Compose, with a web fallback.
- Stability: no alpha or beta label on the SDK 58 pages; Expo's own demo
  calls it production ready from SDK 56. The Compose layer sits on a beta of
  Material Compose. Treat it as young: pin it, wrap it in one folder.
- Theming: colours, fonts and shapes pass as props and modifiers; custom
  SwiftUI and Compose views can be added ("Extending with SwiftUI", "Extending
  with Jetpack Compose"), so the system can ship its own small native views
  where the stock ones are not enough.
- `expo-glass-effect` 58.0.5, MIT: `GlassView` (styles `regular`, `clear`,
  `none`, tint, interactive) and `GlassContainer` (merging by spacing) over
  `UIVisualEffectView`; iOS 26 and later only, a plain `View` elsewhere;
  `isLiquidGlassAvailable()` also honours the `UIDesignRequiresCompatibility`
  opt out but not Reduce Transparency, which must be read separately; do not
  animate its opacity below 1.
- Expo Router (`expo-router` 58.0.31): native tabs, toolbars and the standard
  navigation integration are stable in SDK 58. Native tabs use the system tab
  bar: Liquid Glass on iOS 26 and later, `minimizeBehavior="onScrollDown"`, a
  separate search tab, a bottom accessory; Material tabs on Android, at most
  five tabs, tabs defined statically. `Stack.Toolbar` gives the iOS header
  toolbar with Liquid Glass and needs `@expo/ui` on Android.

### (c) Packages for glass and platform chrome

| Need | Package, version, licence | Status and fidelity |
| --- | --- | --- |
| Glass material | `expo-glass-effect` 58.0.5, MIT | The real material for custom floating controls. Allowed |
| Glass, alternative | `@callstack/liquid-glass` 0.8.2, MIT | Pre 1.0. Not needed if Expo's is used |
| Navigation stack, large titles, header search, sheets with detents | `react-native-screens` 4.30.1 (5.0.0 in beta), MIT, through `@react-navigation/native-stack` 7.21.1 or `expo-router` Stack | `UINavigationController` and Android fragments: system push, edge swipe, large titles, `headerSearchBarOptions`, `presentation: 'formSheet'` with `sheetAllowedDetents`, grabber, corner radius, `pageSheet`, `fullScreenModal`. iOS 26 header items with glass are still marked unstable. Android sheets limited to three detents |
| Tab bar | `expo-router/native-tabs`, `react-native-bottom-tabs` 1.5.0 (MIT), React Navigation 8 (alpha, native tabs by default) | System tab bar with glass, minimise and search on iOS |
| Sheets in place | `@expo/ui` BottomSheet and ModalBottomSheet; `@lodev09/react-native-true-sheet` 4.1.0, MIT; `@gorhom/bottom-sheet` 5.2.14, MIT (drawn in JS, last published 2026-05) | Native sheets for real physics; Gorhom is the best drawn option |
| Menus and context menus | `@expo/ui` Menu, ContextMenu (SwiftUI) and DropdownMenu (Compose); `@react-native-menu/menu` 2.1.2, MIT (UIMenu and Android popup); `zeego` 3.0.6 (last published 2025-03) | `@expo/ui` ContextMenu gives the lifted preview |
| Pickers | `@expo/ui` Picker; `@react-native-picker/picker` 2.11.4, MIT | iOS wheel and menu pickers |
| Date and time | `@expo/ui` DatePicker and DateTimePicker; `@react-native-community/datetimepicker` 9.3.0, MIT (SDK 58 bundles 9.2.1) | System pickers. Umm al-Qura support through these was not checked |
| Keyboard | `react-native-keyboard-controller` 1.23.0, MIT (SDK bundles 1.22.7) | Frame by frame keyboard tracking, interactive dismiss, toolbar; core `KeyboardAvoidingView` is fixed for edge to edge since 0.86 |
| Pull to refresh | React Native core `RefreshControl` | Native, no new dependency |
| Alerts and action sheets | React Native core `Alert.alert`, `ActionSheetIOS`; `@expo/ui` Alert, ConfirmationDialog, AlertDialog | Native, core needs no new dependency |
| Haptics | `expo-haptics` 58.0.8, MIT; `react-native-pulsar` 1.7.0, MIT (recommended by Expo for patterns and worklet haptics) | Expo's is allowed |

### (d) Material 3 on Android from React Native

- Google: Material Android is Compose first (blog, 2026-05-19). Material
  Views 1.14.0 brings Expressive to Views and is the last feature release;
  Material Compose 1.5.0, due later in 2026, promotes the Expressive APIs to
  stable.
- `react-native-paper` 5.15.4, MIT, Material 3 drawn in JS, maintained
  (published 2026-11-09). 6.0 is in alpha with Expressive buttons, FAB and
  switch work; not stable. Its theme is its own, not this system's tokens.
- `@expo/ui/jetpack-compose`: real Compose Material 3 components, Material
  colours with dynamic colour, Expressive components by name. The most
  faithful route from React today.
- Dynamic colour without Compose: `PlatformColor` with Android colour
  resources (React Native docs; the `system_accent1_*` names are from memory,
  unverified), or `@pchmn/expo-material3-theme` 1.4.0, MIT. Scheme generation
  at build time: `@material/material-color-utilities` 0.4.0, Apache 2.0.
- Edge to edge: enforced on Android 15 and later once an app targets SDK 35
  (Android developers). React Native 0.86 fixed the remaining edge to edge
  issues. Content must take insets from `react-native-safe-area-context`.
- Predictive back: Android 15 shows the system back to home, cross task and
  cross activity animations for apps that opt in; on Android 16 with target
  SDK 36 it is the default. React Native keeps `BackHandler` working and
  supports the back to home animation (React Native community discussion for
  0.81, search result, not an official page); in app predictive animation
  between screens through `react-native-screens` is unverified. Must be
  checked on a device.

### (e) Two native libraries, SwiftUI and Compose

The token build would emit Swift and Kotlin theme files (colour assets,
type, shape, spring numbers) next to the TypeScript objects, and the manifests
would gain `swiftui` and `compose` blocks. Each component is written twice
more, natively. Optional thin React Native wrappers through the Expo Modules
API (Swift and Kotlin modules, Fabric views). Fidelity: the best possible:
every system behaviour, material and accessibility trait. Fit with tokens and
manifests: good if the build emits both. Cost: three implementations of every
component plus parity tests, an iOS build machine (macOS) in CI, Swift and
Kotlin skills. Risk: drift between three codebases. Licences: none new. Allow
list: no runtime dependency, but a new toolchain and a scope change (the plan
names three frameworks).

### What the vendors and navigation libraries recommend now

- Apple (Adopting Liquid Glass, fetched): standard SwiftUI, UIKit and AppKit
  components pick up Liquid Glass automatically, including bars, sheets,
  popovers and controls; reduce custom backgrounds in controls and navigation,
  because they interfere with the material and the scroll edge effect; test
  with accessibility settings.
- Apple sheets (HIG, fetched): system detents (medium about half, large),
  grabber, swipe down to dismiss, confirm with an action sheet when there are
  unsaved changes, full screen modal for long or multistep tasks.
- Apple tab bars (HIG, fetched): the tab bar floats on Liquid Glass, can
  minimise on scroll with an accessory, can carry a search tab, five tabs or
  fewer.
- Google: Compose first; edge to edge enforced; predictive back on by
  default for target SDK 36.
- React Navigation 7 (stable) and Expo Router (SDK 58): the native stack is
  the recommended stack (native transitions and gestures); native tabs are
  stable in Expo Router and the default in React Navigation 8 (alpha since
  2025-12-19).
- Lists: core `FlatList` and `SectionList` are adequate; `@shopify/flash-list`
  2.3.2 is bundled by SDK 58; `@expo/ui` now has a recycling native `List`.
- Keyboard: `react-native-keyboard-controller` is bundled by SDK 58 and is
  the common choice; core `KeyboardAvoidingView` works again under edge to
  edge since 0.86.

## 3. Sources

All fetched on 2026-11-15 with headless Chromium (Playwright 1.63) or a page
fetch, unless marked. Full list with status codes:
`shots/native/sources-fetched.json`. Package versions from the npm registry:
`shots/native/npm-registry.json`.

| URL | Title | Version or date | State |
| --- | --- | --- | --- |
| https://docs.expo.dev/versions/latest/sdk/ui/ | Expo UI | SDK 58, ~58.0.28 | fetched |
| https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/ | SwiftUI (Expo UI) | SDK 58 | fetched |
| https://docs.expo.dev/versions/latest/sdk/ui/jetpack-compose/ | Jetpack Compose (Expo UI) | SDK 58 | fetched |
| https://docs.expo.dev/versions/latest/sdk/ui/universal/ | Universal (Expo UI) | SDK 58 | fetched |
| https://docs.expo.dev/versions/latest/sdk/ui/jetpack-compose/material-colors/ | Material colours | | 404, the content was read from the Expo UI overview instead |
| https://docs.expo.dev/versions/latest/sdk/glass-effect/ | GlassEffect | SDK 58, ~58.0.5 | fetched |
| https://expo.dev/changelog | Expo changelog | SDK 58 2026-10-15, SDK 57 2026-06-30, SDK 56 2026-05-21 | fetched |
| https://expo.dev/changelog/sdk-58 | Expo SDK 58 | 2026-10-15 | fetched |
| https://docs.expo.dev/router/advanced/native-tabs/ | Native tabs | page dated 2026-11-10 | fetched |
| https://docs.expo.dev/router/advanced/stack/ | Stack | SDK 58 | fetched |
| https://docs.expo.dev/versions/latest/sdk/haptics/ | Haptics | SDK 58 | fetched |
| https://docs.expo.dev/develop/user-interface/system-bars/ | System bars | current | fetched |
| https://docs.expo.dev/develop/user-interface/safe-areas/ | Safe areas | current | fetched |
| https://docs.expo.dev/modules/overview/ | Expo Modules API | current | fetched |
| https://docs.expo.dev/eas/workflows/examples/e2e-tests/ | E2E tests on Expo Workflows with Maestro | current | fetched |
| https://reactnavigation.org/docs/native-stack-navigator/ | Native Stack Navigator | 7.x | fetched |
| https://reactnavigation.org/blog/ | React Navigation blog | 8.0 alpha 2025-12-19, progress 2026-07-08 | fetched |
| https://reactnative.dev/blog/2026/10/19/react-native-0.88 | React Native 0.88 | 2026-10-19 | fetched |
| https://reactnative.dev/blog/2026/06/11/react-native-0.86 | React Native 0.86 | 2026-06-11 | fetched |
| https://reactnative.dev/blog/2025/10/08/react-native-0.82 | React Native 0.82, New Architecture only | 2025-10-08 | fetched |
| https://reactnative.dev/docs/pressable | Pressable | current | fetched |
| https://reactnative.dev/docs/platformcolor | PlatformColor | current | fetched |
| https://reactnative.dev/docs/backhandler | BackHandler | current (no predictive back text) | fetched |
| https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/ | Reanimated compatibility | 4.x | fetched |
| https://docs.swmansion.com/react-native-gesture-handler/docs/ | Gesture Handler docs root | 3.x | timed out (45 s); the pages below loaded |
| https://docs.swmansion.com/react-native-gesture-handler/docs/components/touchable | Touchable | 3.x | fetched |
| https://docs.swmansion.com/react-native-gesture-handler/docs/components/pressable | Pressable (Gesture Handler) | 3.x | fetched |
| https://docs.swmansion.com/react-native-gesture-handler/docs/components/buttons | Buttons (deprecated) | 3.x | fetched |
| https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3 | Upgrading to Gesture Handler 3 | 3.x | fetched |
| https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass | Adopting Liquid Glass | current | fetched |
| https://developer.apple.com/design/human-interface-guidelines/sheets | Sheets | current | fetched |
| https://developer.apple.com/design/human-interface-guidelines/tab-bars | Tab bars | current | fetched |
| https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture | Predictive back gesture | current | fetched |
| https://developer.android.com/develop/ui/views/layout/edge-to-edge | Edge to edge | current | fetched |
| https://developer.android.com/develop/ui/compose/designsystems/material3 | Material 3 in Compose | current | fetched |
| https://m3.material.io/blog/material-is-compose-first | Material Android is Compose first | 2026-05-19 | fetched |
| https://m3.material.io/blog/building-with-m3-expressive | Start building with Material 3 Expressive | 2025-05-13 | fetched |
| https://callstack.github.io/react-native-paper/ | React Native Paper | 5.x stable, 6.x preview | fetched |
| https://rnprimitives.com/ | rn-primitives | current | fetched |
| https://kirillzyusko.github.io/react-native-keyboard-controller/ | Keyboard Controller | current | fetched |
| https://newreleases.io/project/npm/react-native-paper/release/6.0.0-alpha.2 | Paper 6.0.0 alpha notes | 2026 | search result only, unverified |
| https://github.com/software-mansion/react-native-screens/discussions/2540 | Predictive back in react-native-screens | | search result only, unverified |
| https://github.com/react-native-community/discussions-and-proposals/discussions/921 | Android 16 changes impacting React Native | 0.81 | search result only (mirror), unverified |
| `node_modules/expo/bundledNativeModules.json` | Expo SDK 58 bundled versions | 58.0.24 | read locally |
| `node_modules/react-native/types_generated/` | React Native 0.88.1 types | 0.88.1 | read locally |

From memory and unverified: TalkBack and scanners measuring view bounds rather
than hit slop; iOS error on an unregistered font family; Android
`system_accent1_*` colour names; Umm al-Qura support in the native date
pickers; whether `direction` styles lay out on Android; KVM on hosted CI
Linux runners.

## 4. The three options

| | A. Drawn in JavaScript (the plan as written) | B. Hybrid: platform chrome, drawn brand controls (recommended) | C. Two native libraries |
| --- | --- | --- | --- |
| What | Every part on React Native views, Reanimated, Gesture Handler, rn-primitives; `GlassView` behind drawn bars | Navigation, tab bar, sheets, menus, pickers, date, alerts, pull to refresh as system views through react-native-screens, Expo Router or React Navigation, `@expo/ui` and core APIs; buttons, fields, chips, cards, toggles and feedback drawn from tokens with a per platform behaviour profile | SwiftUI and Compose packages generated from the same tokens and manifests, optional React Native wrappers |
| Real glass | Material only, behind drawn bars; no system scroll edge, grouping or morph | Yes on bars, tab bar, sheets, menus; `GlassView` for drawn floating controls | Yes |
| Real transitions, back gesture | Imitated | Yes (native stack); predictive back to be checked | Yes |
| Real sheet physics | Imitated (Gorhom is close) | Yes | Yes |
| Real haptics | `expo-haptics` calls we choose | System haptics inside system views, `expo-haptics` in drawn ones | Yes |
| Real accessibility | Only what we write | System behaviour in chrome; ours in controls | Yes |
| One token contract | Yes | Yes for drawn parts; system views take colour, tint, font and shape where the API allows, and nothing on iOS 26 bar backgrounds | Yes, with Swift and Kotlin emitters |
| One manifest | Yes | Yes, with a `native.implementation` field per platform | Needs two more framework blocks |
| Non platform styles | Full control | Content and controls in the style, chrome in the platform with the style's tint; a drawn chrome mode for apps that insist | Full control, but the work doubles |
| Maintenance | High, chasing each OS release | Medium; Apple and Google update the chrome | Highest: three codebases |
| Risk | Looks dated each autumn | Young `@expo/ui` (pin and isolate), React Navigation 8 in alpha | Skills, a macOS CI, parity drift |
| Licences | Allowed set | All MIT; one Apache 2.0 if colour utilities are added | No new runtime ones |
| Allow list | No change | Add react-native-screens, one router (`expo-router` or `@react-navigation/native` and `native-stack`), `@expo/ui`, `react-native-keyboard-controller`, `expo-status-bar`; optional `@react-native-community/datetimepicker`, `@react-native-menu/menu` | Scope change, new toolchains |

Recommendation: **B**. It is the only option that gives a real iOS app and a
real Android app this year at a cost the project can carry, and it follows
both vendors' advice. Take one piece of C now: have the token build emit the
platform values (type ramp, control heights, radii, spring numbers, system
font mapping) as a platform layer, so the step to native code later is a build
target rather than a rewrite.

## 5. Component by component

Key: **P** platform view (the API named), **J** drawn in JavaScript from
tokens, **W** wrap the named package. Every J part uses Gesture Handler 3
`Touchable` for press (ripple on Android, highlight or opacity on iOS), the
`haptic(kind)` hook, logical styles and the platform profile of the theme.

### Plan section 8 mobile family

| Component | Build | Reason |
| --- | --- | --- |
| NavigationStack | P: native stack (react-native-screens via Expo Router Stack or `@react-navigation/native-stack`) | System push, edge swipe and back; cannot be faked well |
| NavigationBar | P: native header (large title, search, toolbar items, scroll edge effect) | Liquid Glass and title collapse come with it; a drawn header mode for Studio and Desk |
| ActionSheet | P: iOS `ConfirmationDialog` (`@expo/ui`) or core `ActionSheetIOS`; Android Material modal bottom sheet with a list (`@expo/ui` ModalBottomSheet) | Android has no action sheet; the sheet list is its form |
| SwipeActions | W: Gesture Handler `ReanimatedSwipeable` (allowed), with `accessibilityActions` | Rows live in React Native lists; SwiftUI SwipeActions only works inside a SwiftUI List |
| PullToRefresh | P: core `RefreshControl` | Native already, tint from tokens |
| SafeArea | W: `react-native-safe-area-context` (allowed) | Standard |
| KeyboardAvoider | W: `react-native-keyboard-controller` (gate); core `KeyboardAvoidingView` as the fallback | Interactive dismiss and toolbar |
| WheelPicker | P: iOS wheel `Picker` (`@expo/ui` or `@react-native-picker/picker`); Android: a menu or a sheet list | Android has no wheel convention |
| LongPressMenu | P: `@expo/ui` ContextMenu (iOS, lifted preview) and DropdownMenu on long press (Compose) | The lift and blur cannot be faked well |
| BottomToolbar | P on iOS (`Stack.Toolbar`), J or Compose HorizontalFloatingToolbar on Android | Glass toolbar on iOS |
| PageIndicator | J | Simple dots, style owned |
| ScrollEdge | P with native bars (scroll edge effect); J only in drawn chrome mode | Comes with the system bars |

### Native subset of plan section 8 (React Native core)

| Component | Build | Reason |
| --- | --- | --- |
| Button, IconButton, ButtonGroup, SplitButton, ToggleButton, ToggleGroup, CloseButton, CopyButton, Link | J | Brand controls; platform profile for height, type and feedback |
| SegmentedControl | J; P (`@expo/ui` Picker segmented, Compose SegmentedButton) in a platform style | Styles draw their own; Liquid and a Material style may use the system one |
| FloatingActionButton, SpeedDial | J | Style owned; lift above the tab bar |
| Field, Label, Input, Textarea, PasswordField, NumberField, SearchField (in content), PhoneField, OTPField, InputGroup, InlineEdit, FieldError, Fieldset, Form, FormWizard | J on core `TextInput` | The text engine, autofill and keyboard are native already; set `textContentType`, `autoComplete`, `keyboardType`, `enterKeyHint` |
| Checkbox, CheckboxGroup, RadioGroup, RadioCard, Switch, Slider, RangeSlider, Rating | J (rn-primitives behaviour, Gesture Handler for drags) | Brand controls; a platform style may later map Switch and Slider to `@expo/ui` |
| Select | P menu: `@expo/ui` Menu or Picker (iOS), ExposedDropdownMenuBox (Compose); trigger drawn in J | Pull down menu physics and placement |
| Combobox, Autocomplete, MultiSelect, TagField, ListBox | J content inside a P sheet | Filtering is ours, the container is the system sheet |
| FilterBar, ConsentField | J | Content |
| Alert (inline), Banner, Callout, ProgressBar, ProgressCircle, Meter, Skeleton, StatusDot, ErrorState, EmptyState, NotificationCenter | J | Content surfaces, style owned |
| Spinner | P: core `ActivityIndicator` (as today); Compose LoadingIndicator in a Material style | Native already |
| Toast, Snackbar | J | No iOS system toast; Compose Snackbar needs a host per screen. Place above the tab bar; announce once |
| Dialog on a phone, Sheet | P: native stack `formSheet` and `pageSheet` for routes; `@expo/ui` BottomSheet and ModalBottomSheet in place; content in J | Real detents, grabber, swipe to dismiss, keyboard behaviour |
| AlertDialog | P: core `Alert.alert`, or `@expo/ui` Alert and AlertDialog | The system alert is the alert |
| Popover | P: sheet on a phone, `@expo/ui` Popover on iPad | HIG |
| DropdownMenu, ContextMenu | P: `@expo/ui` Menu and ContextMenu, Compose DropdownMenu (or `@react-native-menu/menu`) | System menus with glass |
| Tooltip | J long press hint; Compose Tooltip in a Material style | No iOS tooltip on a phone |
| TabBar | P: native tabs (`expo-router/native-tabs` or `react-native-bottom-tabs`) | Glass, minimise, search tab; drawn mode for Studio and Desk |
| Tabs (in content) | J | Style owned |
| List, ListSection | J on core `SectionList` (FlashList later); `@expo/ui` List for settings screens in a platform style | Rows carry brand content; grouped inset per platform |
| Card, Avatar, Badge, Chip, Accordion | J | Content |

### Missing phone parts from `mobile.md`

| Component | Build | Reason |
| --- | --- | --- |
| PageSheet and FullScreenModal | P: native stack presentations | Modal transitions and swipe to dismiss |
| SearchBar | P: `headerSearchBarOptions` and the native tabs search role; J SearchField in content | System search placement on iOS 26 |
| DatePicker (phone), TimeField | P: `@expo/ui` DatePicker (SwiftUI) and DateTimePicker (Compose), or `@react-native-community/datetimepicker` | System pickers; Hijri support to be checked, else J calendar |
| Calendar (inline month) | J on `@internationalized/date` | Hijri and RTL owned by the system |
| Carousel | J (paged ScrollView with Reanimated); Compose Carousel in a Material style | Content |
| Onboarding, PermissionPrompt | J | Screens; the OS draws the real permission dialog |
| QuantityStepper | J | No suitable stock view |
| Haptics | W: `expo-haptics`; `performAndroidHapticsAsync` on Android | Allowed |
| Glass surface | W: `expo-glass-effect` with `GlassContainer`, solid under Reduce Transparency | Allowed |
| Drawer | J (Gesture Handler Reanimated drawer layout) | Allowed |
| Lightbox | J with Gesture Handler pinch | Allowed |

### How a style that is not a platform look behaves in native chrome

Chrome follows the platform; content follows the style.

- Studio and Desk inside native chrome: bars, tab bar, sheets, menus and
  alerts stay system views. The style supplies the tint (Desk yellow, Studio
  neutral), the title font where the API takes one and the fonts are loaded as
  TTF or OTF files, icons as images from the system icon set, and the content
  surface colour. On iOS 26 and later bar backgrounds are the system's (Apple
  asks apps to remove custom bar backgrounds; Expo's native tabs ignore
  background colour there). On Android the bars take the style's surface and
  on surface colours as Material colour roles.
- No desktop metaphors on a phone: no window lights, no grain on chrome, no
  menu bar or dock (as `mobile.md` already found).
- Drawn chrome mode, opt in per app: NavigationBar renders a JS header inside
  the native stack (keeps the push transition and back gesture, loses glass
  and the large title collapse); TabBar renders a JS tab bar. Documented as a
  trade, not the default.
- Liquid: on iOS 26 and later the system chrome is the Liquid look; drawn
  floating controls use `GlassView`. On Android Liquid uses the designed solid
  fallback (plan 3.5), or the owner chooses a Material style for Android.
- The manifest records per component and platform which path is used
  (`platform-view`, `drawn`, `wrapped:<package>`), so docs and `ds doctor`
  can say it.

## 6. Verifying native work honestly

| What | Where | Proves |
| --- | --- | --- |
| Typecheck, jest under both `jest-expo/ios` and `jest-expo/android` presets | Here and any CI | Props, states, roles, token values, platform branches |
| `expo export --platform ios` and `--platform android` | Here | The JavaScript compiles to Hermes for each platform; nothing visual |
| `expo-doctor`, a lint rule for platform rules (no literal colours, `testID` present and overridable, `accessibilityRole` from the manifest) | Here | Configuration and code hygiene |
| Web export screenshots | Here | Token values only. Never cited as native evidence |
| Android emulator | Not here: no `adb`, no SDK, no KVM. Possible in the owner's CI on a Linux runner with KVM (unverified for the runner type) or in EAS Workflows | Android views, ripple, insets, TalkBack basics, Maestro flows and screenshots |
| iOS simulator | Not here. EAS Build (simulator profile) plus EAS Workflows with Maestro, or a macOS CI runner | UIKit views, glass rendering (simulator only), layout, Maestro screenshots |
| Real devices | Owner, or a device farm | Haptics, real glass performance, VoiceOver and TalkBack gestures, Dynamic Type, predictive back, keyboard, notch and home indicator |

What the owner has to do:

1. Create an Expo account and allow EAS for this repo (a HUMAN GATE: it
   needs credentials and pushes builds to a service).
2. For iOS on a device: either Expo Go for SDK 58 if it is in the App Store
   now (check the version it names), or an Apple developer account for a
   development build. `@expo/ui` and `expo-glass-effect` are in Expo Go;
   anything outside Expo Go needs a development build.
3. For Android: install a development build APK from EAS on any Android 15
   or 16 phone; no Mac needed.
4. Run the checklists below and send back screenshots or screen recordings.

Minimal device checklist, iOS (iPhone on iOS 26 or later):

```text
[ ] Push a screen: system slide, edge swipe back follows the finger
[ ] Large title collapses on scroll; bar shows the scroll edge effect
[ ] Tab bar is glass, minimises on scroll, search tab works
[ ] Sheet: medium and large detents, grabber, swipe down closes, keyboard does not cover the primary action
[ ] Context menu lifts the row with a preview; menus are glass
[ ] Button press: highlight under the finger at once; light haptic where named
[ ] Settings, Accessibility: Reduce Transparency makes glass solid; Reduce Motion stops springs; Bold Text bolds labels
[ ] Larger Text at the largest size: labels wrap, nothing clips; long press an icon button in a bar shows the large content viewer
[ ] VoiceOver: each control reads label, role and state; selected options read "selected"
[ ] Dark mode follows the system; Arabic and right to left after restart
[ ] Notch and home indicator never cover content or controls
```

Minimal device checklist, Android (Android 15 or 16, gesture navigation):

```text
[ ] Edge to edge: content under transparent bars, nothing under the gesture bar
[ ] Button press: ripple from the touch point at once; confirm haptic where named
[ ] Back gesture shows the predictive back to home preview at the root; back closes sheets and dialogs first
[ ] Bottom navigation is Material, five tabs or fewer, labels and 24dp icons
[ ] Sheet: drag, detents, scrim, back closes it
[ ] Menus and date picker are Material components
[ ] Font size and display size at the largest: nothing clips
[ ] TalkBack: label, role and state read; double tap activates; swipe actions offer a menu path
[ ] Dark theme and high contrast text follow the system
[ ] Arabic and right to left after restart
```

## 7. Dependencies and licences

| Package | Version | Licence | On the allow list | Needs the owner |
| --- | --- | --- | --- | --- |
| `react-native-gesture-handler` | 3.x (SDK 58: ~3.3.0) | MIT | yes | no |
| `react-native-safe-area-context` | 5.11.1 | MIT | yes | no |
| `expo-haptics`, `expo-glass-effect`, `expo-blur` | 58.0.x | MIT | yes, optional peers | no |
| `@rn-primitives/*` | 1.5.x | MIT | yes | no |
| `react-native-screens` | 4.30.1 | MIT | no | yes |
| `expo-router` or `@react-navigation/native` with `native-stack` | 58.0.31, or 7.5.2 and 7.21.1 | MIT | no | yes, pick one |
| `@expo/ui` | 58.0.28 | MIT | no | yes |
| `react-native-keyboard-controller` | 1.23.0 | MIT | no | yes |
| `expo-status-bar`, `expo-navigation-bar` | 58.0.x | MIT | no | yes (small) |
| `@react-native-community/datetimepicker` | 9.3.0 | MIT | no | optional, if `@expo/ui` is not used for dates |
| `@react-native-menu/menu` | 2.1.2 | MIT | no | optional, if `@expo/ui` is not used for menus |
| `@material/material-color-utilities` | 0.4.0 | Apache 2.0 | no | optional, build time, already asked in `summary.md` |
| `@pchmn/expo-material3-theme` | 1.4.0 | MIT | no | optional, dynamic colour without Compose |
| `react-native-paper` | 5.15.4 | MIT | no | not recommended: its own theme and look |
| `@gorhom/bottom-sheet` | 5.2.14 | MIT | no | not recommended if native sheets are used |
| Material Symbols (for native tab icons on Android) | | Apache 2.0 | no | owner, already raised in `material-guidelines.md`; otherwise render Lucide or pixel icons to images |

Also for the owner: native tab and toolbar icons take SF Symbols, Material
Symbols, assets or images. The plan forbids SF Symbols, so the icons package
needs a build step that renders the system icons to images (PNG or PDF) for
native chrome. The plan's ban on NativeWind, Uniwind and Unistyles stands;
nothing here needs them.

## 8. The ten changes that matter most, in order

1. Owner decision: option B, and the allow list additions in section 7.
   Without it the native set can only be option A.
2. A platform layer in the token build: native theme objects by style,
   scheme and platform, with the iOS text styles (17 body, 34 large title) and
   Material type roles, platform control heights and radii, and system font
   stacks mapped to `undefined` instead of `Segoe UI` and `SFMono-Regular`.
3. ThemeProvider: follow the system scheme by default; read font scale, bold
   text and cross fade; `fonts="system"` by default on iOS and Android until
   the style fonts ship as TTF or OTF.
4. Rebuild the Button press on Gesture Handler 3 `Touchable`: ripple on
   Android, highlight on iOS, pressed colours on the platform or a shared
   value, `disabled` passed through, a visible focus state, overridable test
   ids; then the `haptic(kind)` hook in `packages/shared` with `expo-haptics`
   behind it.
5. An app root part: `GestureHandlerRootView`, `SafeAreaProvider`, status
   and navigation bar style per scheme, edge to edge insets, keyboard
   provider. Declare `peerDependencies` in `packages/native/package.json`.
6. NavigationStack, NavigationBar and TabBar on the native stack and native
   tabs, with the icon to image pipeline and the drawn chrome mode.
7. Sheets, menus, context menus, alerts, pickers and date pickers as
   platform views through `@expo/ui` and core APIs, isolated in one folder
   (`packages/native/src/platform/`) and pinned.
8. Manifests: a per platform `implementation` field and an honest native
   status; jest under both presets; a lint rule for overridable `testID`.
9. Device CI: EAS Build plus Maestro flows on an Android emulator and an iOS
   simulator for every native component, with screenshots per style and
   scheme.
10. The owner runs the two device checklists once per wave, and each native
    component is marked done only after its device row is green.

## 9. What I could not check

- Anything on a device or simulator: press timing, ripple, haptics, glass,
  system fonts, Dynamic Type, VoiceOver, TalkBack, predictive back, keyboard
  and safe areas. No emulator can run here (no KVM, no Android SDK) and iOS
  cannot be built on Linux.
- Whether Expo Go for SDK 58 is in the App Store and Google Play today.
- `@expo/ui` behaviour in practice: how far colours, fonts and shapes from
  tokens reach into each SwiftUI and Compose component; RTL inside a `Host`;
  Hijri calendars in the native date pickers.
- In app predictive back animations through `react-native-screens`; only
  search results were found, no official page.
- Whether TalkBack and accessibility scanners count `hitSlop`, and whether an
  unregistered font family raises an error on iOS in development: both from
  memory.
- Whether the `direction` style lays out on Android.
- The Gesture Handler docs root page timed out; the component pages loaded.
- React Navigation 8 details beyond its alpha status and native tabs by
  default.
- Material 3 Expressive coverage inside `@expo/ui` by component: the docs do
  not use the word.
