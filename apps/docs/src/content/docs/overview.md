---
title: Overview of the docs
description: What the system is, what it covers and how these docs are built.
---

The system is a design system with one component contract, several style
packs and three frameworks. A component has one manifest, one CSS file shared
by React and Angular, and a style function for React Native. A style pack
changes tokens, recipes, icons and motion. It never changes markup or
behavior.

## Try it in the browser

- [Open the component gallery](gallery:/): every React demo, with a bar to
  change the style, scheme, density, direction and language.
- [Open the interactions page](gallery:/interactions): one card per
  interaction, such as press, focus, open and close.
- [Open every demo on one page](gallery:/all).

### What to test

- Styles: switch between Neutral, Studio and Desk. Markup and behavior stay
  the same; tokens, recipes, icons and motion change. Try a
  [Button in Desk, dark](gallery:/c/button?style=desk&scheme=dark).
- Scheme: light and dark, in each style.
- Density: compact, default and comfortable.
- Arabic, right to left: set direction to `rtl` and language to `ar`, or
  open the [Arabic docs](/ar/). Layout mirrors, icons that point flip, and
  the Arabic demo copy shows.
- On a component page, the preview has the same settings above it, and a
  link to open it as a full gallery page.

## What is in the box

| Package | Holds |
| --- | --- |
| `@the-system/tokens` | DTCG tokens and their CSS, native and Figma outputs |
| `@the-system/css` | Reset, base and one CSS file per component |
| `@the-system/styles` | Style packs: token values, recipes, icons, motion |
| `@the-system/react` | React 19 components |
| `@the-system/angular` | Angular components on the same CSS |
| `@the-system/native` | React Native components on generated theme objects |
| `@the-system/shared` | Pure TypeScript logic shared by every framework |

## How to read a component page

Every component page is generated from its manifest in
`packages/manifest/src/component/` and from its demo files. The sections come
in a fixed order: the title and a one line summary, the status in React,
Angular and React Native, a live preview with settings for style, scheme,
platform, density, direction and language, then one section per demo case
(variants, one item, many items, long text, Arabic, loading, disabled and so
on), each with a live preview and the real example code for each framework.
After the examples: when to use it, when not to, what to use instead,
anatomy, props, states, accessibility with the WCAG 2.2 criteria, content
rules in English and Arabic, tokens, motion and common mistakes. A framework
that is not ready shows as planned.

## For agents

- [`/llms.txt`](/llms.txt) lists every guide and every component, with a link
  to its Markdown twin.
- [`/llms-full.txt`](/llms-full.txt) is every English page in one file.
- Every page has a twin at the same path with `.md` at the end, for example
  [`/components/button.md`](/components/button.md).

## Where to start

- [Tokens](/foundations/tokens/) and [runtime axes](/foundations/axes/)
- [Styles](/styles/)
- [Framework setup](/frameworks/setup/)
- [English content](/content/english/) and [Arabic content](/content/arabic/)
- [Accessibility](/accessibility/)
- [Components](/components/)
