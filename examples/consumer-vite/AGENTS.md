<!-- ds:init start. Written by `ds init`. A new run replaces the text up to the end marker. -->

# Agent rules: The system

This app is React with Vite on The system. DESIGN.md holds the setup. The full reference for agents is `/llms.txt` on the docs site.

## Before you write UI

1. Find the component: `npx ds search <what it is for>`.
2. Read it: `npx ds docs <Name>` (use when, avoid when, use instead, keys, mistakes).
3. Add it if the app does not have it: `npx ds add <Name> --framework react`.

## Rules

- System components only. No bare `<button>`, `<input>`, `<select>` or `<dialog>` where a system component exists.
- Never import `radix-ui` or `react-aria-components` in app code. The system component wires the behavior, the anatomy and the tokens.
- Tokens only. Colors, spacing, radius, font sizes, shadows, durations and z-index come from `--ds-*` variables (or the native theme). No raw values.
- Never declare a `--ds-*` variable in app CSS. Change a style through its pack, not by overriding tokens.
- Logical properties only: `margin-inline-start`, `inset-inline-end`, `padding-block`. Never `left`, `right`, `margin-left` and the like.
- Props for size, tone, emphasis and shape take only the values in the component manifest.
- No native `title` attribute for hints. Use Tooltip.
- Only `transform` and `opacity` animate. No animation library on the web.

## Copy

- English: sentence case. Buttons are a verb plus a noun: "Save draft", "Delete board". Never "OK", "Continue", "Confirm" or "Yes".
- An empty state says what to do next. An error names what happened and how to fix it.
- Never an em dash or an en dash. No exclamation marks.

## Arabic

- Pick one register for the product and keep it: Gulf modern standard Arabic or white Saudi dialect.
- Noun form labels, no diacritics, Western digits, the Arabic comma in running text.
- Set `lang="ar"` on the theme root; the direction follows. Latin runs inside Arabic text go through `Bidi`.
- No uppercase or italics for emphasis, no letter spacing. Directional icons mirror; brand marks, clocks and media controls do not.

## Accessibility (WCAG 2.2 AA)

- Targets at least 24 by 24 px on the web, 44 px in touch layouts. Every drag has a button or key path.
- Text at 4.5:1, control borders and focus rings at 3:1. Never remove the focus ring.
- Toasts and status changes announce once. A dialog has a title.

## Check your work

```sh
npx ds doctor src
npx ds doctor --json   # { apiVersion, type: "doctor.report", data: { findings, summary } }
```

Exit code 0 is clean, 1 means an error finding: fix every error before you finish. Then run the app in English and in Arabic, dark and light.

<!-- ds:init end -->
