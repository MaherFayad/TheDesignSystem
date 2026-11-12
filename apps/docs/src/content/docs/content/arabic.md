---
title: Arabic content
description: The two registers, Gulf modern standard Arabic and white Saudi dialect, and the Arabic rules.
sidebar:
  order: 2
---

The system writes Arabic in two registers. Each product picks one and keeps
it.

| Register | Where | Sounds like |
| --- | --- | --- |
| Gulf modern standard Arabic | Docs prose, formal products, government and finance | فصحى مبسطة: clear, short sentences, no ornament |
| White Saudi dialect | Product UI copy and every demo in the galleries | Everyday Saudi speech that any Gulf reader follows |

These docs use Gulf modern standard Arabic for the chrome and the headings.
Demo copy inside the previews uses white Saudi dialect.

## Rules for both registers

- Noun form labels, not the imperative: حفظ التغييرات, not احفظ التغييرات.
- No diacritics.
- Western digits (0 to 9) by default.
- The Arabic comma (،) in running text.
- No uppercase and no italics for emphasis. Use weight.
- Zero letter spacing and a taller line height. The `font.leading.arabic.*`
  tokens apply under `:lang(ar)`.
- Latin runs inside Arabic, such as product names and code, go through the
  `Bidi` component (an isolate), so punctuation lands on the right side.
- Localize, never translate word for word. Write the Arabic first when the
  screen is Arabic first.

## Direction

- `lang="ar"` on a Theme sets `dir="rtl"`.
- Arrow keys follow the reading direction.
- Directional icons carry a mirror flag. Brand marks, clocks and media
  controls never mirror.

## Manifests and these docs

Manifests carry Arabic copy rules in `content.ar`, but no Arabic prose yet.
Until they do, the Arabic component pages show the manifest prose in English
inside a left to right isolate.
