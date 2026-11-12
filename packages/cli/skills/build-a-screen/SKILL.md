---
name: build-a-screen
description: Build one screen of an app on The system (React, Angular or React Native) from system components, tokens and the copy rules. Use when asked to make a page, a screen, a form, a dialog flow or a layout in an app that has AGENTS.md from ds init.
---

# Build a screen

Read `AGENTS.md` and `DESIGN.md` in the app first. They hold the framework,
the imports and the rules. The full component reference is `/llms.txt` on the
docs site root.

## 1. Plan the screen in words

Write down, before any code:

- the task the person does on this screen, in one sentence;
- the regions (header, main, aside, footer) and what each holds;
- every state the screen can be in: empty, one item, many, far too many, very
  long text, long Arabic text, loading, error, disabled, read only. A screen
  that shows only the happy path is not done.

## 2. Pick a component for each part

For each part, find the component instead of writing markup:

```sh
npx ds search <what the part is for>
npx ds docs <Name>
```

Read "use when", "do not use when" and "use instead" in the docs answer. If
`insteadUse` points elsewhere, follow it. Add what the app lacks:

```sh
npx ds add <Name> --framework react     # or angular, native
```

A part with no system component: compose it from layout components (Stack,
Grid, Surface, Card) and style it with `--ds-*` tokens in a CSS Module or the
app stylesheet. Never rebuild a control the system has.

## 3. Write it

- One root `Theme` (`dsTheme` in Angular, `ThemeProvider` in React Native).
  Do not nest a second root.
- Props for size, tone, emphasis and shape: only the values `ds docs` lists.
- CSS: tokens only, logical properties only, only `transform` and `opacity`
  animate. App CSS sits outside the system layers.
- Hints go in Tooltip, never a native `title`.
- Copy: sentence case; buttons are a verb plus a noun ("Save draft"), never
  "OK", "Continue", "Confirm" or "Yes"; an empty state says what to do next;
  no em dash or en dash.
- Arabic: the product's one register, noun form labels, no diacritics,
  Western digits; Latin runs inside `Bidi`.

## 4. Check it

```sh
npx ds doctor src --json
```

Fix every finding with severity `error`. Then run the review-a-screen skill.
Report what you built, the components you used, and any part that has no
system component.
