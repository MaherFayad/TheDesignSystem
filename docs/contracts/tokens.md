# Token contract

Source of truth: DTCG JSON in git. CSS, theme objects, types and Figma
variables are build outputs. Full detail: section 3.6 of PLAN.md.

## Files

| Path | Holds |
| --- | --- |
| `packages/tokens/src/base/*.json` | Values shared by every style: space, size, font scale, duration, ease, z, border width |
| `packages/tokens/src/contract.json` | The list of semantic names every style must fill |
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

## Gates that read tokens

Contrast pairs (4.5:1 text, 3:1 UI) per style and scheme. Every semantic name
filled in every style and scheme. No raw values in component CSS.
