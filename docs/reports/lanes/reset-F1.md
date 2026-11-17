# Lane report: F1 iOS fixes from the M7 audit (CSS and tokens only)

Order F1, ds-style. Every look here is proposed until the owner signs on a
phone. Scope: `[data-platform='ios']`, Liquid and Neutral, light and dark.
No React, Angular, gallery TypeScript, `android.css`, contract or decision
file was edited. Nothing was committed.

## Files changed

- `packages/css/src/platform/ios.css`
- `packages/styles/liquid/recipes/Switch.css`, `Slider.css`, `Input.css`,
  `DropdownMenu.css`, `Popover.css`, `SegmentedControl.css`
- `packages/styles/neutral/recipes/Switch.css`, `Input.css`,
  `DropdownMenu.css`, `Popover.css`, `Dialog.css`, `Button.css`,
  `Checkbox.css`
- Our own captures: `docs/reports/reset/F1/*.png` (no kit image)

Not changed: `packages/tokens/src/platform/ios.json` (a platform may never
set a colour, so no colour could go there; see the token request below), and
the iOS block of `apps/gallery-react/src/platforms.css` (nothing needed).

How a style opts in. Liquid and Neutral set `--_ios-glass` on their iOS
root (order M6). Rules that give the platform's look in full sit in
`ios.css` under `@container style(--_ios-glass: ...)`, so Studio and Desk
keep their own paint. Where a Liquid or Neutral recipe sets the same private
property (recipes come after the platform layer), the recipe repeats or
reverts it under a `[data-platform='ios']` guard. Every grey of the kit's
dark ladder is a `color-mix()` of the glass backdrop tokens (white and black
in every style): 11 percent white for the grouped card and the glass tint
(kit #1c1c1e), 17 for the elevated surface (#2c2c2e), 23 for the next step
(#3a3a3c), 22 for the hairline (#38383a); the light hairline is 10 percent
black (#e6e6e6). A private ladder property was tried first and failed the
token vocabulary gate (a private property must be declared on a component
root), so the mixes are written out.

## Item 0 (priority from the owner): the glass edge and control strokes

See the section of that name below the table.

DIFF_PLACEHOLDER
