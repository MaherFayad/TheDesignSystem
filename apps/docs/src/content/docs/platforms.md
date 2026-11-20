---
title: Platforms
description: Web, iOS and Android. One contract, one set of props, a platform axis that adjusts sizes, fonts and feel.
---

The system runs on the web through React and Angular, and on iOS and Android
through React Native. A component has the same name, props and values on
every platform. What changes is set by the `platform` axis and by the
framework.

## The platform axis

| Value | Where it applies |
| --- | --- |
| `web` | Desktop and laptop browsers, and every device `auto` does not detect. What a server renders. |
| `ios` | iPhone and iPad, in the browser and in React Native |
| `android` | Android phones and tablets, in the browser and in React Native |
| `macos` | Desktop conventions of macOS. Chosen only by an explicit value. |
| `auto` | An input only. It resolves to `ios` on an iPhone or iPad, `android` on an Android device and `web` everywhere else. |

The [iOS page](/platforms/ios/) maps what an iPhone screen is made of to
the components here, and covers the glass and the foldable iPhone.

The outermost Theme with no `platform` prop is `auto`. The server render says
`web` and the detected value is stamped once on mount. An app that wants no
detection passes `platform="web"`. The Theme writes `data-platform` on its
element, and a component reads it only where the platforms really differ. On
React Native `auto` follows the device, and the theme objects carry the
platform sizes.

### On this site

The platform switch in the top bar starts on Auto, which shows the platform
detected for your device, for example "Auto: iOS" on an iPhone. Pick a
platform to see every page and every preview with it; the choice is kept on
every page until you pick Auto again. An address with `?platform=android`
shows that platform for that page only, over the choice.

## By framework

| Framework | Package | Looks | Behavior |
| --- | --- | --- | --- |
| React | `@the-system/react` | `@the-system/css`, shared with Angular | Radix and React Aria |
| Angular | `@the-system/angular` | The same CSS, byte for byte | Angular CDK and Angular Aria |
| React Native | `@the-system/native` | Generated theme objects and a style function per component | RN Primitives |

The [coverage page](/frameworks/coverage/) lists what is ready in each
framework.

## Targets and type per platform

- Targets: 24px on the web (WCAG 2.2, 2.5.8), 44px in touch templates, 44pt
  on iOS, 48dp on Android.
- Native text scales to 200% with the system setting. Never fix a height on a
  text container.
- Right to left: the web follows `dir` on the Theme; React Native follows
  `I18nManager` and needs an app restart after a change.
