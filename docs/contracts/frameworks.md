# Framework contract

Full detail: sections 3.1 and 3.5 of PLAN.md.

## Layers

| Layer | Shared | Per framework |
| --- | --- | --- |
| Tokens | DTCG JSON, one build | CSS variables (web), theme objects (native) |
| Look | `packages/css`, used by React and Angular byte for byte | Native: a style function per component |
| Logic | `packages/shared`, pure TypeScript | None |
| Behavior | Anatomy and keyboard map in the manifest | Radix (React), CDK and Angular Aria (Angular), RN Primitives (native) |

- Anything that can be pure TypeScript goes in `packages/shared`.
- React writes the component CSS. Angular may not change it. If the Angular
  DOM cannot match the CSS, that is a contract bug: stop and report.
- React Native never imports from `packages/css`.

## React

- React 19: `ref` is a prop, no `forwardRef`.
- Interactive files start with `"use client"`.
- No `window` access at module scope.
- Behavior from `radix-ui` (the unified package). No primitives marked Preview.
- Files: `packages/react/src/components/<Name>/` with `<Name>.tsx`,
  `<Name>.test.tsx`, `<Name>.demo.tsx`, `index.ts`.
- Props spread onto the root. `className` and `style` pass through.
- The one exception is `Theme`: its `style` prop is the style axis, so inline
  styles pass through a `css` prop. The Angular `dsTheme` input has the same
  names.
- Under reduced motion every duration token is 0ms, so `transitionend` and
  `animationend` may never fire. Never wait on those events. Use the Web
  Animations API `finished` promise, or act at once when the duration is 0.

## Angular

- Standalone components, signal inputs (`input()`), OnPush, zoneless safe.
- Attribute selectors so the host is the part: `button[dsButton]`,
  `[dsDialogTitle]`. No wrapper element that React does not have.
- Host bindings set `data-ds`, `data-part` and the variant and state
  attributes. Input names equal the React prop names.
- Behavior from `@angular/cdk` first, then `@angular/aria`. Angular Aria is
  imported only inside `packages/angular/src/behavior/`.
- Direction through the CDK `Directionality`.
- Findings from the wave 0 proof, now rules:
  - The theme style is written `dsTheme="<id>"`. A static `style="desk"` is
    parsed by the compiler as inline CSS and never reaches the input.
  - Angular leaves the selector marker and static input attributes on the
    host. Each directive removes them (`internal/host.ts`), so the DOM equals
    React's attribute for attribute. A static `disabled` would otherwise
    become the native attribute.
  - Names that cannot equal React's: `asChild` has no form (`a[dsButton]` is
    the link form). `onOpenChange` is the `openChange` output of `[(open)]`.
    Node props (`start`, `end`, `icon`, `title`) take an icon name or a
    `TemplateRef`. Handlers a component must detect (`onClose` on
    WindowControls) are function inputs.
  - DI follows declaration, not projection. A theme inside a component
    template does not scope projected content.
  - Overlays: no CDK Dialog and no CDK FocusTrap, because both insert
    elements inside the root. Use a CDK `ComponentPortal` whose host is the
    themed portal wrapper, and wrap Tab by hand with `InteractivityChecker`.
  - A dialog title that React lifts from children is the `title` input.
- Files: `packages/angular/src/components/<name>/` with `<name>.ts`,
  `<name>.spec.ts`, `<name>.demo.ts`, `index.ts`.

## React Native

- Same component names, prop names and values as React.
- `testID="ds-<component>-<part>"`. States through `accessibilityState`.
- Behavior from `@rn-primitives/*`. Animation from Reanimated 4.
- Styles: `create<Component>Styles(theme, variants)` in `<Component>.styles.ts`
  with `StyleSheet`. No inline color or size literals. A gate enforces this.
- Style recipes: `packages/styles/<id>/native/<Component>.ts`.
- Touch targets: 44pt on iOS, 48dp on Android.
- Respect safe areas, the keyboard, font scale to 200%, reduce motion and
  reduce transparency.
- RTL through `I18nManager`. A direction change needs an app restart.
- Glass: `expo-glass-effect` when available, otherwise the designed fallback.

### Hybrid native build (ruling 8)

Rule: chrome is the system's own view; brand controls are drawn from tokens.

- Chrome uses the platform's system views: navigation, the tab bar, sheets,
  menus, pickers and alerts (`react-native-screens`, `expo-router`,
  `@expo/ui`). The system draws their shape and behavior. The style supplies
  tint, fonts and content.
- Brand controls (Button, Switch, Checkbox, Slider, Input and the rest of the
  controls list in `anatomy.md`) are drawn by us from the token theme object
  for the active style, scheme and platform. Each has a behavior profile per
  platform: press feedback, haptic kind, touch target and travel.
- The token build has a platform layer (`tokens.md`, "Platform layer"). A
  native theme object is keyed `themes[style][scheme][platform]`.
- Studio and Desk keep the platform's bars and sheets inside native chrome
  and supply tint, fonts and content (ruling 10). Drawn chrome is an opt in:
  the optional part `chrome.drawn` in `style.json`, off by default.
- Icons in native tab bars and toolbars are our own (Lucide,
  pixelarticons) rendered to images (ruling 11). No vendor symbol set.
- Native text uses the platform font in every style until the owner
  approves a font loader and font files.

Example: a Desk screen on an iPhone.

```tsx
<ThemeProvider style="desk" scheme="dark" platform="auto">
  {/* System tab bar and navigation bar, tinted with Desk's accent, our own
      icons as images. */}
  <Tabs screenOptions={{ tabBarActiveTintColor: theme.color.primary.fill }} />
  {/* Drawn from themes.desk.dark.ios: Desk's colors, the iOS control height
      and the iOS press profile (dim, light haptic). */}
  <Button tone="accent">Save board</Button>
</ThemeProvider>
```

## Runtime axes

| Axis | Web attribute | Values |
| --- | --- | --- |
| Style | `data-style` | `studio`, `desk`, `neutral`, `liquid`, `paper`, any custom id |
| Scheme | `data-scheme` | `dark`, `light` |
| Density | `data-density` | `compact`, `default`, `comfortable` |
| Contrast | `data-contrast` | `default`, `more` |
| Platform | `data-platform` | `web`, `ios`, `android`, `macos` (input also takes `auto`) |
| Glass | `data-glass` | `clear`, `regular`, `tinted` |
| Direction and language | `dir`, `lang` | `ltr` or `rtl`, `en` or `ar` |

On React Native a `ThemeProvider` passes the resolved theme object through
context and takes the same axis names as props.

## Platform axis (rulings 7 and 13)

A platform carries the conventions of a device family: proportion, touch
target, type ramp, control shape, press feedback, where overlays come from
and how chrome is laid out. It never carries brand. Colors, font family on
the web and surface material stay with the style (`tokens.md`, "Platform
layer").

| Value | For |
| --- | --- |
| `web` | Desktop and laptop browsers, and every device `auto` does not detect. What the server renders. |
| `ios` | iPhone and iPad, in the browser and in native builds |
| `android` | Android phones and tablets, in the browser and in native builds |
| `macos` | Desktop conventions of macOS: body text 13, controls about 22 to 28 tall by size, square checkboxes with a mixed state, window controls at the leading top, sheets that drop from the top of the window |
| `auto` | An input only. It resolves to one of the four values above and is never stamped. |

Rule: `data-platform` on a Theme element always holds one of `web`, `ios`,
`android` or `macos`. A selector never tests for `auto`.

### Resolution order

Rule: the platform resolves from the first of these that gives a value.

1. An explicit prop on `Theme`, `dsTheme` or `ThemeProvider` that is not
   `auto`.
2. In the galleries and the docs site only: the URL key `platform`
   (`?platform=android`). An unknown value is ignored.
3. In the galleries and the docs site only: the stored choice, kept in
   `localStorage` under the key `ds-platform`. Only a choice the person made
   in a platform switcher is stored. Choosing `auto` clears it.
4. The device, through the shared resolver in `packages/shared/src/platform.ts`.
   This step runs only when the input is `auto`.
5. Otherwise `web`.

A Theme with no `platform` prop takes its parent's resolved value, and the
outermost Theme with none is `auto` (ruling 7). The server render uses `web`
and the detected value is stamped once on mount. An app that wants no
detection passes `platform="web"`.

### What `auto` detects (ruling 7, and plan approval 2)

Rule: `auto` gives `ios` or `android` on those devices and `web` everywhere
else. It never gives `macos`. `macos` is chosen only by override (a prop,
the URL key or the stored choice).

Rule: `ios` covers the foldable iPhone (proposed, `docs/plan/reset-duo.md`).
`auto` never detects a model and never reads `screen` sizes. Layout on this
device comes from size (the `ds-shell` container), the safe area insets,
each side on its own, and, when present, device posture and viewport
segments.

- `ios`: an iPhone or iPod, an iPad, and an iPad in desktop mode, which
  reports a Mac agent with `navigator.maxTouchPoints` above 1.
- `android`: user agent client hints with platform `Android`, or an Android
  user agent string.
- On React Native, `auto` follows `Platform.OS` (`ios` or `android`).
- On the web the resolver reads `navigator` only after mount, never at
  module scope. The server and the first client render after it use the
  prop (step 1) or the URL key (step 2), else `web`, so hydration matches.
  The stored choice (step 3) and the device (step 4) are read only after
  mount and stamped once.

Example, the gallery on an iPhone:

```tsx
// No prop wins, so the URL key is read first.
<Theme platform="auto" style="liquid" scheme="light">
  <Switch label="Wi-Fi" />
</Theme>
```

| Visit | Stamped |
| --- | --- |
| `/c/switch` on an iPhone, nothing stored | `data-platform="ios"` |
| `/c/switch` on a Pixel, nothing stored | `data-platform="android"` |
| `/c/switch` on a Mac, nothing stored | `data-platform="web"` |
| `/c/switch?platform=macos` on a Mac | `data-platform="macos"` |
| `/c/switch?platform=web` on an iPhone | `data-platform="web"` |
| `/c/switch` on an iPhone after the person chose `android` in the switcher | `data-platform="android"` |
| `<Theme platform="web">` on an iPhone, any URL | `data-platform="web"` |

## Package imports

Packages export source during development (see DECISIONS.md).

```ts
import { Button, Theme } from '@the-system/react';
import '@the-system/tokens/css';      // tokens for every style
import '@the-system/css';             // reset, base, components
import '@the-system/styles';          // recipes for every style
```
