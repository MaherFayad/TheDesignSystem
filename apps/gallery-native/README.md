# Native gallery

An Expo app that shows every React Native demo of `@the-system/native` inside
a `ThemeProvider`, with a control for each axis: style, scheme, density,
contrast, direction and language. The controls are system Buttons.

The screen list is `src/screens.gen.ts`, written by `npm run gen` from the
`packages/native/src/components/<Name>/<Name>.demo.tsx` files. Do not edit it.

## Run it

From the repo root, once:

```sh
npm install
npx tsx packages/tokens/build.ts
```

Then, in this folder:

| Command | Does |
| --- | --- |
| `npm run start` | Expo dev server. Scan the QR code with Expo Go (SDK 58). |
| `npm run web` | The same app in a browser. |
| `npm run export:web` | A static web build in `dist/`. Serve it from its root. |
| `npm run check` | Typecheck. Part of `npm run check` at the repo root. |

The iPhone steps for the owner are in `docs/reports/ios-check.md`.

## Query string (web)

On the web the axes also come from the query string, so screenshots can be
scripted:

```text
/?style=desk&scheme=light&dir=rtl&lang=ar&screen=Button&case=variants&chrome=0
```

- `screen`: a screen name from `screens.gen.ts`, for example `Button`.
- `case`: show one demo case only (`variants`, `one`, `many`, `loading` ...).
- `chrome=0`: hide the controls.

## Direction

The system components lay themselves out from the theme's `dir` at once (a
`direction` style on their own box). On a device, the system views (scroll
views, natural text alignment) follow `I18nManager`, and a change there needs
an app restart. The direction control calls `I18nManager.forceRTL` so the next
launch matches. On the web export the direction comes from the query string
and applies at once.

## Fonts

The style packs ship woff2 files through fontsource. iOS and Android cannot
register woff2, so on a device the gallery passes `fonts="system"` to the
ThemeProvider and text uses the platform font. The web export copies the
woff2 files into `public/fonts` (`scripts/fonts.mjs`, run by `export:web` and
`web`) and registers them under the family names of the theme objects
(`src/fonts.web.ts`).

## Two React versions in one workspace

The web packages at the repo root use `react` and `react-dom` 19.3.1. Expo SDK
58 pins React Native 0.88.1, whose renderer throws unless `react` is exactly
19.3.0. npm workspaces hoist one copy, so:

- This app pins `react` and `react-dom` to `19.3.0` (exact). The root keeps
  19.3.1, so npm installs the 19.3.0 copies in `apps/gallery-native/node_modules`.
  `packages/native` pins `react` 19.3.0 as a dev dependency for its tests, and
  gets its own nested copy the same way.
- Everything else (react-native, react-native-web, expo, reanimated, svg) is
  hoisted to the root `node_modules` once.
- `metro.config.js` watches the repo root, looks in this app's
  `node_modules` before the root's, and resolves every import of `react` and
  `react-dom` from this app, whichever file asks (react-native and
  react-native-web live at the root, where a plain lookup would find 19.3.1).
  The bundle holds one React, 19.3.0.
- `packages/native/jest.config.cjs` does the same for its tests with
  `moduleNameMapper`.
- The root `npm run check` (vitest and typecheck for the web packages) keeps
  using 19.3.1. Keep the exact pins: a caret range would let npm dedupe the
  native copies to 19.3.1 and React Native would fail at start.

When Expo moves to a React version equal to the root one, drop the pins, the
`resolveRequest` override and the `moduleNameMapper`.
