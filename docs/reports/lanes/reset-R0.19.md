# Lane report: R0.19 Density keeps control heights on `macos`

Order R0.19, from the R0.14 rulings on `macos` in `DECISIONS.md`, item 1, and
R0.14 "Left open" item 1. Not committed.

## The fault

`packages/tokens/src/platform/macos.json` had no density values. The shared
density blocks (`[data-density='compact']` and `[data-density='comfortable']`)
come after `[data-platform='macos']` in the layer, so in Neutral and Liquid,
whose own density is comfortable, the md control became 36 instead of the
platform's 28.

## What I built

- `packages/tokens/src/platform/macos.json`: each of `size.control.xs`, `sm`,
  `md` and `lg` gains `$extensions["ds.density"]` with `compact` and
  `comfortable` equal to the platform value (20, 22, 28 and 32px), the same
  shape `ios` and `android` use (R0.13 decision 7). Each `$description` gains
  one sentence that names the rule and where it comes from. No value changed.
- The build needed no change. It already writes
  `[data-platform='<id>'][data-density='<d>']` after the shared density blocks,
  and `platformDensities[<id>][<d>]` in `dist/native/index.ts`, for any
  platform token with `ds.density`.
- `packages/tokens/tests/platform.test.ts`: the density test now covers
  `ios`, `android` and `macos`, and a new test checks the macos blocks hold
  exactly the four control sizes at 28 for md, come after the shared density
  block, and appear in `platformDensities.macos` on native.
- Snapshots updated: `packages/tokens/tests/__snapshots__/tokens.css` and
  `native.index.ts.snap`.

The DTCG spec at designtokens.org is still 2025.10 as the stable version;
`$extensions` takes a vendor key and any JSON, which is what `ds.density` is.

## Built CSS, before and after

Every built file was compared, the "before" built from a copy of the source
with the macos change taken out. 44 of 50 files are byte for byte the same.
The six that differ are `css/tokens.css`, the four `css/<style>.css` files and
`native/index.ts`.

Declaration by declaration, each of the five CSS files has 0 removed, 0
changed and 8 added. The 8 are the only new declarations:

```css
[data-platform='macos'][data-density='comfortable'] { --ds-size-control-lg: 32px; --ds-size-control-md: 28px; --ds-size-control-sm: 22px; --ds-size-control-xs: 20px; }
[data-platform='macos'][data-density='compact'] { --ds-size-control-lg: 32px; --ds-size-control-md: 28px; --ds-size-control-sm: 22px; --ds-size-control-xs: 20px; }
```

`native/index.ts` gains `platformDensities.macos.compact` and `.comfortable`
with the same four numbers. Nothing applies outside `data-platform="macos"`
with `data-density` set to compact or comfortable.

What that means for computed values, on `macos` only:

| Density | xs | sm | md | lg |
| --- | --- | --- | --- | --- |
| compact, before | 24 | 24 | 28 | 40 |
| comfortable, before | 28 | 32 | 36 | 48 |
| every density, after | 20 | 22 | 28 | 32 |

Anything that reads these variables on macos follows, such as the title bar
(`size.control.md`) and the switch (`size.control.sm`), which R0.14 measured
at 36 and 56 by 32 in Neutral and Liquid comfortable.

## Measured

React gallery dev server, Chromium at 1440 by 900, light scheme, `/c/button`,
`/c/input` and `/c/select`, the `data-size="md"` element of each (the Select
trigger). "Own" means no `density` key, so the style's own density is stamped.

| Platform | Style | Density | Button | Input | Select trigger |
| --- | --- | --- | --- | --- | --- |
| macos | Neutral | own (comfortable) | 28 | 28 | 28 |
| macos | Liquid | own (comfortable) | 28 | 28 | 28 |
| macos | Desk | own (default) | 28 | 28 | 28 |
| macos | Studio | own (default) | 28 | 28 | 28 |
| macos | all four | compact, default, comfortable | 28 | 28 | 28 |
| web | Neutral | own (comfortable) | 36 | 36 | 36 |
| web | Liquid | own (comfortable) | 36 | 36 | 36 |
| web | Neutral, Liquid, Studio | compact, default, comfortable | 28, 32, 36 | 28, 32, 36 | 28, 32, 36 |
| web | Desk | compact, default, comfortable | 31, 36, 41 | 31, 36, 41 | 31, 36, 41 |

Web is as before: no declaration that reaches `platform=web` changed. Desk on
web is taller than the token because of its own recipe, also as before.

## Decisions

- The macos values in every density are the platform's own values, so `xs`
  stays 20 under compact, where the shared compact block would have raised it
  to 24 (`size.target-min` on the web). That follows the ruling, which says
  the platform's sizes hold in every density. `size.target-min` on macos stays
  24 and is not touched.
- I did not change the build. Its comment and the generated doc comment on
  `platformDensities` still say "on ios and android". That text is
  descriptive only; changing it would touch the build and the native
  snapshot for wording.

## Contract text for the lead

`docs/contracts/tokens.md`, "Order of the layer", the Density row names `ios`
and `android` alone. I may not edit that file. Replacement for the "Sets" cell:

> Density values. On `ios`, `android` and `macos` density never changes the platform's control sizes; the build writes the platform's own density values where it has them, as `[data-platform='<id>'][data-density='<d>']`.

## Check

See the order report for the result of `npm run check`.

## Left open

- `docs/contracts/tokens.md`, the Density row, for the lead (text above).
- The build comment and the `platformDensities` doc comment name `ios` and
  `android` only (wording, see "Decisions").
- R0.13 decision 7 says "macos and web follow the shared density blocks". It
  is a past report and stays as written; `DECISIONS.md` R0.14 item 1
  supersedes it.
