---
title: Overview
description: What the system is, what it covers and how these docs are built.
---

The system is a design system with one component contract, several style
packs and three frameworks. A component has one manifest, one CSS file shared
by React and Angular, and a style function for React Native. A style pack
changes tokens, recipes, icons and motion. It never changes markup or
behavior.

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
`packages/manifest/src/component/`. The sections come in a fixed order: the
summary, a live preview, when to use it, when not to, what to use instead,
anatomy and variants, content rules, accessibility, common mistakes, styles
and a code tab per framework. A framework that is not ready shows as planned.

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
