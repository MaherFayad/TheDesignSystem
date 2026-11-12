---
title: Tokens
description: DTCG tokens, their names, the CSS variable prefix and the build outputs.
sidebar:
  order: 1
---

Tokens are the only source of color, space, size, radius, type, shadow,
duration and z order. They are DTCG JSON in git. CSS variables, React Native
theme objects, types and Figma variables are build outputs.

## Files

| Path | Holds |
| --- | --- |
| `packages/tokens/src/base/*.json` | Values every style shares: space, size, font scale, duration, ease, z, border width |
| `packages/tokens/src/contract.json` | The semantic names every style must fill |
| `packages/styles/<id>/tokens.dark.json` | Semantic and component tokens of one style, dark scheme |
| `packages/styles/<id>/tokens.light.json` | The same for light |

## Names

- A path such as `color.bg.surface` becomes the CSS variable
  `--ds-color-bg-surface`.
- Component tokens follow `<component>.<part>.<property>.<variant>`, for
  example `button.height.md`, and default to a semantic alias.
- A style never invents a name. New names are added to the contract file.

## Selectors

Token selectors are compounds on one element, the Theme element:

```css
@layer ds.tokens {
  [data-style='studio'][data-scheme='dark'] { --ds-color-bg-surface: #1b1b1b; }
  [data-density='compact'] { --ds-size-control-md: 28px; }
}
```

## Build outputs

| Output | Path |
| --- | --- |
| Layered CSS | `packages/tokens/dist/css/tokens.css` and `dist/css/<style>.css` |
| React Native theme objects | `packages/tokens/dist/native/<style>.<scheme>.ts` |
| Types for token names | `packages/tokens/dist/types/tokens.d.ts` |
| One JSON per mode for Figma | `packages/tokens/dist/figma/<style>.<scheme>.json` |
| Tailwind v4 bridge for consumers | `packages/tokens/dist/tailwind/theme.css` |

Run `npm run build` (or `npx tsx packages/tokens/build.ts`) to write them.

## Rules for component CSS

- Tokens only: no raw color, spacing, radius, font size, shadow, duration or
  z index.
- Logical properties only.
- Only `transform` and `opacity` animate. Under reduced motion every duration
  is 0ms.
