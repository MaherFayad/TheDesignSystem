# Consumer: Next.js

A small Boards screen built only from `@the-system/react`, the way a
Next.js product such as GoBanana would use the system: app router, plain CSS,
English and Arabic as route segments, style and scheme from cookies.

```sh
npm run dev -w @the-system/consumer-next     # tokens build, then next dev
npm run smoke -w @the-system/consumer-next   # build, next start, Playwright
npm run check -w @the-system/consumer-next   # next typegen and tsc
```

## Install and import

Depend on the packages and on React 19:

```json
"dependencies": {
  "@the-system/react": "0.0.0",
  "@the-system/tokens": "0.0.0",
  "@the-system/css": "0.0.0",
  "@the-system/styles": "0.0.0",
  "next": "^16.4.6",
  "react": "^19.3.1",
  "react-dom": "^19.3.1"
}
```

Import components from the package entry point only:

```tsx
import { Button, Dialog, Field, Input, Theme, Toaster, Window, toast } from '@the-system/react';
```

The token CSS is a build output (`packages/tokens/dist`, not committed). Run
`npm run build -w @the-system/tokens` before the app builds. The `predev` and
`prebuild` scripts here do it.

## CSS import order

Import the system first, in this order, then your own CSS:

```ts
import '@the-system/tokens/css'; // tokens for every style
import '@the-system/css';        // reset, base, components
import '@the-system/styles';     // recipes and fonts for every style
import './app.css';              // your CSS, outside any @layer
```

The system CSS lives in layers (`ds.reset` to `ds.overrides`). CSS outside
layers always wins over layered CSS, so your rules beat a component's base
rule without `!important`. If you use layers of your own, import the system
first so its layer order is declared first.

Each CSS entry point carries a `types` condition, so TypeScript resolves
these imports with no declaration of your own.

## Theme and Toaster

- Stamp `<html>` with `themeAttributes({ style, scheme, lang })` in the root
  layout. It is a pure function, safe in a server component, and gives the
  first paint its theme, `lang` and `dir`.
- Also render a root `<Theme>` inside `<body>`. `<html>` attributes alone give
  no React context: `useTheme`, and the Dialog and Toaster portals that copy
  the axes, need the Theme element.
- Mount one `<Toaster />` inside that root Theme, before anything that can
  open a dialog. Call `toast()` from anywhere.

## Next specifics

- `transpilePackages` lists every `@the-system/*` package, because the
  packages export TypeScript and CSS source.
- Server components by default. The screen (`components/BoardsScreen.tsx`)
  is the one client component. The layout imports `Theme`, `Toaster` and
  `themeAttributes` from the same barrel; Next keeps the client components
  client side.
- Locales are a route segment: `app/[locale]/layout.tsx` is the root layout,
  `/` redirects to `/en` in `next.config.ts`.
- Style and scheme come from the `boards-style` and `boards-scheme` cookies,
  read in the layout, so the server render matches the client and nothing
  flashes. The switch writes the cookie and calls `router.refresh()`.
- `agentRules: false` keeps `next dev` from writing an `AGENTS.md` here.
- Built and tested with Turbopack, the Next 16 default. `next build
  --webpack` builds too.
