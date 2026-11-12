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
| `web` | Browsers, React and Angular. The default on the web. |
| `ios` | React Native on iOS, or a web screen that should read as iOS |
| `android` | React Native on Android, or a web screen that should read as Android |

Set it on the root Theme: `<Theme platform="ios">`. The Theme writes
`data-platform` on its element, and a component reads it only where the
platforms really differ. On the web today that is Rail, which takes the tab
bar shape of each platform. On React Native the provider reads the device
platform when the prop is not set, and the theme objects carry the platform
sizes.

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
