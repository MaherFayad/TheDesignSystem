# Consumer: Vite

A small Boards screen built only from `@the-system/react`, the way a Vite and
React product such as Figma-Killer-2 would use the system: CSS Modules for
the app's own layout, style, scheme and language in the URL.

```sh
npm run dev -w @the-system/consumer-vite     # tokens build, then vite
npm run smoke -w @the-system/consumer-vite   # build, vite preview, Playwright
npm run check -w @the-system/consumer-vite   # tsc
```

## Install and import

```json
"dependencies": {
  "@the-system/react": "0.0.0",
  "@the-system/tokens": "0.0.0",
  "@the-system/css": "0.0.0",
  "@the-system/styles": "0.0.0",
  "react": "^19.3.1",
  "react-dom": "^19.3.1"
},
"devDependencies": { "vite": "^8.3.8", "@vitejs/plugin-react": "^6.3.0" }
```

Import components from the package entry point only:

```tsx
import { Button, Dialog, Field, Input, Theme, Toaster, Window, toast } from '@the-system/react';
```

The packages export TypeScript and CSS source; Vite compiles it with no extra
config. The token CSS is a build output (`packages/tokens/dist`, not
committed): the `predev` and `prebuild` scripts run the token build first.

## CSS import order

In `src/main.tsx`, before anything else:

```ts
import '@the-system/tokens/css'; // tokens for every style
import '@the-system/css';        // reset, base, components
import '@the-system/styles';     // recipes and fonts for every style
```

Your CSS Modules come after, through the components that import them. They
are outside any `@layer`, so they win over the system layers without
`!important`. `Boards.module.css` shows it: `.create` gives the "Create board"
Button a small radius over the pill from `Button.css`, and the smoke test
checks it.

Pass a module class to a component through `className`. It lands on the
component root (for Input, on the bordered box; the native input gets the
other props).

`src/vite-env.d.ts` declares the three CSS entry points, which have no type
declarations of their own.

## Theme and Toaster

- `src/display.ts` reads `?style=&scheme=&lang=` and stamps `<html>` with
  `themeAttributes` before React renders, so the first paint is themed and
  `lang` and `dir` are right.
- `App` renders one root `<Theme>` with the same axes. It gives the
  components their context and the Dialog and Toaster portals copy it.
- One `<Toaster />` sits inside that root Theme, before anything that can
  open a dialog.
