---
title: Styles
description: The style packs and what a style may change.
---

A style pack is a folder under `packages/styles/<id>/`. It holds token values
for dark and light, a `style.json`, web recipes in CSS, native recipes in
TypeScript, an icon map and motion values.

| Style | Status | Look |
| --- | --- | --- |
| `studio` | Stable | Flat overlay fills, pixel icons, dense rows. Dark first. |
| `desk` | Stable | Pill controls, a yellow primary action, glass windows. |
| `neutral` | Proposed | Filled primary, outline secondary, soft gray surfaces. The galleries and docs open on it. |
| `liquid` | Planned | Glass bars and capsule controls, with solid fallbacks. |
| `paper` | Planned | Built with the style generator from the twelve dials. |

## What a style may change

- Tokens, recipes, icons, motion presets and optional parts.
- Never markup and never behavior. If a style needs a markup change, the
  contract is wrong and gets fixed for every style.

## Picking a style at run time

```tsx
<Theme style="desk" scheme="light">{children}</Theme>
```

Every component page shows what each style changes, from the `styles` field
of its manifest. The preview on that page has a style switch.
