# Token contract

Source of truth: DTCG JSON in git. CSS, theme objects, types and Figma
variables are build outputs. Full detail: section 3.6 of PLAN.md.

## Files

| Path | Holds |
| --- | --- |
| `packages/tokens/src/base/*.json` | Values shared by every style: space, size, font scale, duration, ease, z, border width |
| `packages/tokens/src/contract.json` | The list of semantic names every style must fill, and the names every platform must fill |
| `packages/tokens/src/platform/<id>.json` | Platform tokens for `web`, `ios`, `android` and `macos` (see "Platform layer") |
| `packages/styles/<id>/tokens.dark.json` | Semantic and component tokens for one style, dark scheme |
| `packages/styles/<id>/tokens.light.json` | The same for light |
| `packages/tokens/build.ts` | The build. Owned by ds-tokens. |
| `packages/tokens/dist/` | Outputs. Not committed. |

## Format

DTCG, as published at designtokens.org on the day of the work. If the spec
differs from the shapes in PLAN.md, the spec wins and DECISIONS.md records it.

```json
{
  "color": {
    "bg": {
      "surface": {
        "$type": "color",
        "$value": { "colorSpace": "srgb", "components": [0.106, 0.106, 0.106], "alpha": 1, "hex": "#1b1b1b" },
        "$description": "Darker parent of tile cards, sidebar fill"
      }
    }
  },
  "size": { "control": { "md": { "$type": "dimension", "$value": { "value": 32, "unit": "px" } } } },
  "duration": { "base": { "$type": "duration", "$value": { "value": 120, "unit": "ms" } } }
}
```

- Fluid values: `$value` is the max in px. `$extensions["ds.fluid"]` holds
  `{ "min", "max", "minViewport": 380, "maxViewport": 1440 }`. The CSS build
  emits `clamp()`. The native build uses the max.
- Shadows, typography and cubic beziers use the DTCG composite types.
- Aliases use the DTCG reference syntax `{color.bg.surface}`.
- Keep every "A11y change" note from the source as part of `$description`.

## Where we follow the spec, and where we differ

Checked against DTCG 2025.10, the first stable version (28 October 2025).

- Dimensions allow only `px` and `rem`. Values in `em` or `vh` are
  `$type: "number"` with `$extensions["ds.unit"]` holding the unit.
- The color `hex` fallback has 6 digits. Alpha is its own field.
- The spec has no spring type. A spring is a group of three number tokens:
  `stiffness`, `damping`, `mass`.
- The build supports curly brace aliases and group `$type` inheritance.
  `$ref`, `$extends` and `$root` are not supported yet.
- The spec recommends reverse domain extension keys and the `.tokens.json`
  file extension. We keep `ds.fluid`, `ds.unit` and `tokens.dark.json`.

## Contract file

`packages/tokens/src/contract.json` lists each group with `names` (from
section 3.6 of PLAN.md) and `added` (names added so no source token is
dropped). Every style must fill both lists. Density overrides live in
`packages/tokens/src/density/compact.json` and `comfortable.json`.

Arabic line heights are their own tokens (`font.leading.arabic.*`).
`base.css` switches to them under `:lang(ar)`.

## Names

- CSS variable prefix: `--ds-`. Path `color.bg.surface` becomes
  `--ds-color-bg-surface`. The prefix comes from `ds.config.json`.
- Component tokens: `<component>.<part>.<property>.<variant>`, for example
  `button.height.md`. They default to a semantic alias.
- The semantic names are fixed by the table in section 3.6 of PLAN.md and by
  `packages/tokens/src/contract.json`. Extend only by adding to the contract
  file. Never invent a name inside a style.

## Selectors (web)

Token selectors are compounds on one element, the Theme element:

```css
@layer ds.tokens {
  [data-style='studio'][data-scheme='dark'] { --ds-color-bg-surface: #1b1b1b; }
  [data-density='compact'] { --ds-size-control-md: 28px; }
}
```

Base tokens that never change sit on `:root, [data-style]`.

## Build outputs

| Output | Path |
| --- | --- |
| Layered CSS, one selector per style and scheme | `packages/tokens/dist/css/tokens.css` and `dist/css/<style>.css` |
| Typed theme objects for React Native | `packages/tokens/dist/native/<style>.<scheme>.ts` and `dist/native/index.ts` |
| TypeScript types for token names | `packages/tokens/dist/types/tokens.d.ts` |
| One flat JSON per mode for Figma | `packages/tokens/dist/figma/<style>.<scheme>.json` |
| Tailwind v4 `@theme` bridge for consumers | `packages/tokens/dist/tailwind/theme.css` |

The build is deterministic: sorted keys, no timestamps. Snapshot tests cover
the CSS and the theme objects.

## Platform layer (ruling 8)

Rule: each platform has one token file, `packages/tokens/src/platform/<id>.json`
for `web`, `ios`, `android` and `macos`. A platform file fills only the
platform names below. A style file never sets a platform name, and a
platform file never sets a style name, so no name has two owners.

What a platform may set:

| Kind | Names |
| --- | --- |
| Type ramp | `type.<role>` composites (see "Platform names") |
| Control heights | `size.control.*`, `size.touch.*`, `size.target-min` |
| Corner scale | `shape.corner.*` |
| State opacities | `opacity.state.*` |
| Elevation levels | `elevation.level0` to `elevation.level5`, geometry only |
| Spring numbers | `spring.spatial.*`, `spring.effects.*` |
| Insets | `inset.*` |
| System font mapping | native only: which family the platform font is, for `font.family.*` |

What a platform may never set:

- Any color, including the color inside a shadow. An elevation level holds
  offset, blur and spread; its color is an alias to a style token from the
  `color` groups of the contract.
- A font family on the web. On the web `type.<role>` aliases the style's
  `font.family.*`. On native the system font mapping turns a system stack
  into the platform font (`undefined` in the theme object), never the first
  named family of the stack.
- Surface material: `color.material.*`, `color.glass.*` and `blur.*`.
- Radius roles (`radius.field`, `radius.card` and the rest). Those are the
  style's. A platform asks for a corner by the scale, `shape.corner.*`.

`web.json` holds the values the base files give today, so a page on `web`
looks as it did before the layer existed.

Example, part of `packages/tokens/src/platform/ios.json`:

```json
{
  "type": {
    "body-large": {
      "$type": "typography",
      "$value": {
        "fontFamily": "{font.family.sans}",
        "fontSize": { "value": 17, "unit": "px" },
        "fontWeight": 400,
        "letterSpacing": { "value": 0, "unit": "px" },
        "lineHeight": 1.294
      },
      "$description": "Body text, 17 over 22. Source: liquid audit, type ramp by platform."
    }
  },
  "size": { "control": { "md": { "$type": "dimension", "$value": { "value": 44, "unit": "px" } } } },
  "shape": { "corner": { "large": { "$type": "dimension", "$value": { "value": 16, "unit": "px" } } } },
  "opacity": { "state": { "pressed": { "$type": "number", "$value": 0.1 } } },
  "inset": {
    "safe": {
      "top": {
        "$type": "dimension",
        "$value": { "value": 0, "unit": "px" },
        "$extensions": { "ds.env": "safe-area-inset-top" }
      }
    }
  }
}
```

The values above show the shape. Order R0.13 sets each value from the
audits' measured tables and cites the line it comes from.

### Order of the layer

Inside `@layer ds.tokens`, on the Theme element, later rows win:

| Step | Selector | Sets |
| --- | --- | --- |
| Base | `:root, [data-style]` | Base values, and the `web` values of the platform names |
| Style and scheme | `[data-style='<id>'][data-scheme='<s>']` | Style names |
| Platform | `[data-platform='<id>']` | Platform names |
| Density | `[data-density='<d>']` | Density values. On `ios` and `android` density never takes a control below the platform's touch target; the build writes the platform's own density values where it has them, as `[data-platform='<id>'][data-density='<d>']`. |
| Contrast | `[data-contrast='more']` and the media queries | Solid materials, stronger borders |

```css
@layer ds.tokens {
  [data-platform='ios'] { --ds-size-control-md: 44px; --ds-shape-corner-large: 16px; }
  [data-platform='ios'] { --ds-inset-safe-top: env(safe-area-inset-top, 0px); }
}
```

### Native

The native build writes one theme object per style, scheme and platform,
exported as `themes[style][scheme][platform]` from `dist/native/index.ts`.
Springs are numbers (stiffness, damping, mass) on native and baked
`linear()` eases with a duration on the web. An inset token is 0 in the
theme object; the safe area provider supplies the live value.

## Platform names

Added to `contract.json` by order R0.13. Every platform fills every name in
this list, except where a row says the name is shared.

| Group | Names | Notes |
| --- | --- | --- |
| `shape.corner` | `none`, `extra-small`, `small`, `medium`, `large`, `large-increased`, `extra-large`, `extra-large-increased`, `extra-extra-large`, `full` | A corner scale a platform can ask for by step. `none` is 0, `full` is a capsule. |
| `opacity.state` | `hover`, `focus`, `pressed`, `dragged`, `disabled-container` | Opacity of a state layer over a control. `opacity.disabled` stays the content value. |
| `elevation` | `level0` to `level5` | Shadow composites on the web (geometry from the platform, color from the style); an elevation number on native. Beside the style's existing elevation names. |
| `spring.spatial` | `fast`, `default`, `slow` | Springs for movement. Each is the group of `stiffness`, `damping`, `mass`. |
| `spring.effects` | `fast`, `default`, `slow` | Springs for color and opacity, which do not overshoot. |
| `inset.safe` | `top`, `bottom`, `start`, `end` | Fed by `env(safe-area-inset-*)` through `$extensions["ds.env"]`. The build maps `start` and `end` to left and right by `dir`. |
| `inset` | `keyboard` | Fed by `env(keyboard-inset-height)`. |
| `breakpoint` | `compact`, `medium`, `expanded`, `large`, `extra-large` | Shared, in `src/base/breakpoint.json`, not per platform: 0, 600, 840, 1200 and 1600px. |
| `type` | `display-large`, `display-medium`, `display-small`, `headline-large`, `headline-medium`, `headline-small`, `title-large`, `title-medium`, `title-small`, `body-large`, `body-medium`, `body-small`, `label-large`, `label-medium`, `label-small` | One `typography` composite per role per platform, fixed, not fluid. The CSS build writes one variable per field: `--ds-type-<role>-font-family`, `-font-size`, `-font-weight`, `-letter-spacing`, `-line-height`. Components and styles name a role, never a size step, when the text should follow the platform. |

Example: a phone title that follows the platform.

```css
[data-ds='navigation-bar'] > [data-part='title'] {
  font-size: var(--ds-type-title-large-font-size);
  line-height: var(--ds-type-title-large-line-height);
}
```

On `ios` that is the iOS title size, on `android` the Material title large,
and on `macos` the desktop title, with the style's font family in all three.

## Gates that read tokens

Contrast pairs (4.5:1 text, 3:1 UI) per style and scheme. Every semantic name
filled in every style and scheme. Every platform name filled in every
platform, and no color, web font family or material in a platform file. No
raw values in component CSS.
