---
title: Runtime axes
description: Style, scheme, density, contrast, platform, glass, direction and language.
sidebar:
  order: 2
---

A `Theme` (React) or `dsTheme` (Angular) element stamps every axis on itself
and resolves anything not passed from the nearest parent. On React Native a
`ThemeProvider` passes the resolved theme object through context and takes
the same axis names as props.

| Axis | Web attribute | Values |
| --- | --- | --- |
| Style | `data-style` | `studio`, `desk`, `neutral`, `liquid`, `paper`, any custom id |
| Scheme | `data-scheme` | `dark`, `light` |
| Density | `data-density` | `compact`, `default`, `comfortable` |
| Contrast | `data-contrast` | `default`, `more` |
| Platform | `data-platform` | `web`, `ios`, `android` |
| Glass | `data-glass` | `clear`, `regular`, `tinted` |
| Direction and language | `dir`, `lang` | `ltr` or `rtl`, `en` or `ar` |

## Rules

- `lang="ar"` alone gives `dir="rtl"`. Pass `dir` only to override it.
- A scheme the style does not list falls back to the style's default scheme.
- The Theme's own fallback style is `studio`. The gallery and these docs open
  on `neutral`.
- A custom style id paints nothing until you ship token CSS for it.

## The gallery URL

The React and Angular galleries read the axes from the query string:

```text
/c/<component>?style=&scheme=&density=&platform=&dir=&lang=&contrast=&glass=
```

`chrome=0` hides the gallery bar and `case=<id>` shows one demo case. The
preview on every component page is this URL in an iframe.
