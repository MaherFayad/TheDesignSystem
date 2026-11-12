# Registry

A shadcn registry of the React components, the theme, the core files and one
`registry:style` item per style pack. Built from the manifests and the source
folders by `build.ts`.

```sh
npx tsx packages/tokens/build.ts      # the style items read dist/css/<style>.css
npx tsx packages/registry/build.ts    # writes registry.json, files/, public/r/
npx tsx packages/registry/serve.ts --port 4000
```

## Use it from an app

Add the namespace to the app's `components.json`, then add items with the
shadcn CLI (checked with `shadcn@4.23.0`):

```json
{
  "tailwind": { "config": "", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
  "registries": { "@ds": "http://localhost:4000/r/{name}.json" }
}
```

```sh
npx shadcn@4.23.0 add @ds/button @ds/dialog
```

Keep `cssVariables` set to `true`. With `false`, the CLI rewrites string
literals as class lists and turns the icon `viewBox` `'0 0 24 24'` into
`'0 24'`.

Then, once at the app root:

```ts
import './components/ds/ds.css';
import './components/ds/style-studio.css';
```

and wrap the app in `Theme` from `@/components/ds/react/theme`.

## Layout

Every file lands under `ds/` inside the components alias, with the repo layout
kept, so relative imports between components work unchanged. The build makes
three changes to the copies:

- imports of `@the-system/*` become relative paths into `ds/`;
- each component `index.ts` gets one side effect import of its CSS file;
- each CSS file starts with the layer order line.

## Items

| Item | Type | Holds |
| --- | --- | --- |
| `core` | `registry:lib` | shared logic, icons, motion, style data, reset and base CSS, `ds/ds.css` |
| `theme` | `registry:ui` | Theme, Bidi, hooks; needs `core` and the default style |
| `style-<id>` | `registry:style` | tokens for one style, fonts, recipes, `ds/style-<id>.css` |
| `<kebab>` | `registry:ui` | one component folder (no tests, no demos) and its CSS |
| template `<kebab>` | `registry:block` | when templates arrive in `packages/react/src/templates/` |

`registry.json` is the catalog (no contents). `public/r/` holds the served
items and is not committed.

## Schemas

`schema/registry.json` and `schema/registry-item.json` are copies of the
shadcn schemas (MIT, shadcn/ui), fetched on 2026-11-12 from
`ui.shadcn.com/schema/`. The test validates every item against them.
