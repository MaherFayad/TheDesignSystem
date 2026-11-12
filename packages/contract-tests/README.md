# Contract suite

One Playwright suite, generated from the manifests, that runs against any
gallery URL. React and Angular render the same DOM on the same routes, so the
same file checks both. It relies only on the gallery URL contract and the
anatomy attributes (`data-ds`, `data-part`, `data-size` and the rest), never
on framework details.

## Run it

```sh
npm run contract -- --framework react                 # starts the React gallery on a free port
npm run contract -- --framework react --component Button,Input
npm run contract -- --framework react --url http://localhost:5203
npm run contract -- --framework angular               # skips with a note until apps/gallery-angular exists
```

`run.ts` starts the gallery (React: `vite` in `apps/gallery-react` with `PORT`
set; Angular: `npm run dev -- --port <port>` in `apps/gallery-angular`), waits
for it, opens `/c/<kebab>` for each ready component to see which ones have a
demo, runs `npx playwright test --config packages/contract-tests/playwright.config.ts`,
stops the server it started and exits with the test status.

- Human list: stdout (the list reporter), then one summary line per component.
- JSON: `docs/reports/contract-<framework>.json` (the Playwright JSON reporter).

Environment the spec reads: `DS_GALLERY_URL`, `DS_FRAMEWORK` (default
`react`), `DS_COMPONENT` (comma list), `DS_ROUTES` (set by run.ts),
`DS_CONTRACT_JSON`, `DS_CONTRACT_WORKERS` (default 4).

Unit tests for the helpers: `src/lib.test.ts` and `src/page.test.ts` run in
Vitest with `npm run check`. The Playwright suite is not part of check.

## Which components

Every manifest of kind `component` whose `frameworks.<framework>.status` is
`ready`. A component whose `/c/<kebab>` renders no `[data-demo-case]` is
skipped with a note (for example Theme and Bidi, which have no demo). A demo
that fails to render reads the same way, so the note says both.

Every test title starts with the component name.

## Manifest keys and the checks they drive

| Manifest key | Check | Runs in |
| --- | --- | --- |
| `name` | `data-ds="<kebab name>"` is the root selector; the route is `/c/<kebab>` | all |
| `anatomy` | **anatomy**: a root exists; every part except `root` is found as `[data-part]` owned by some root; no owned `data-part` outside the anatomy; no root carries `data-part="root"` | default style, dark, en ltr |
| `contract.optionalParts`, `style.json` `optionalParts[<kebab>]` | parts that may be missing | anatomy |
| `props.size`, `props.tone`, `props.emphasis`, `props.shape` | **variant attributes**: manifest values are shared words; every root value is a shared word and is in the manifest; the `variants` case shows every manifest value at least once | default style, dark, en ltr |
| `states` | **state attributes**: boolean states (`data-disabled`, `data-loading`, `data-invalid`, `data-readonly`, `data-selected`, `data-dragging`, plus any other `data-*` in `states` except `data-state` and `data-orientation`) have an empty value; `data-state` values are in `states`; no state class (`is-*`, `*--disabled`, `active`, `disabled`, `selected`, `loading` and similar) on roots and parts | default style, dark, en ltr |
| `a11y.keys` | **keyboard map**, one generic check per key (below) | default style, dark, en ltr |
| (always) | disabled roots are out of the tab order or carry `aria-disabled="true"` | keyboard map |
| (always) | **target size**: every interactive element in a demo case is at least 24 by 24 CSS px | default style, dark, en ltr |
| (always) | **reflow**: no sideways scroll at 320px wide; no native `title` attribute | en ltr and ar rtl |
| `contract.skipAxeRules` | **axe** with `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`, minus these rules | every style and scheme in `packages/styles/*/style.json`, in en ltr and ar rtl |

### Part ownership

A part belongs to the nearest ancestor with `data-ds`. The walk starts at the
part's parent element, so a part on an element that is itself a nested root
(an IconButton that is a Dialog's `close`) belongs to the outer root. Parts of
nested components (an Icon inside an Input) are never counted for the outer
component.

### Keyboard checks

Each `a11y.keys` entry is split into keys (`"Home, End"` gives Home and End).

| Key | Generic check | Runs when |
| --- | --- | --- |
| `Tab` | Tab from the top of the page reaches the first enabled root, or a control inside it | always |
| `Shift+Tab` | after Tab reaches it, Shift+Tab leaves it | always |
| `Enter`, `Space` | on the first enabled root that is a button element or `role="button"`, a click event fires | such a root exists; otherwise a note |
| `Escape` | open through `contract.trigger` or a `[data-demo-trigger]`, wait for a root with `data-state="open"`, press Escape, the root closes or leaves the DOM | `states` has `open` and `closed`; otherwise a note |
| any other key | only through a `contract.keys` hint | the hint exists; otherwise a note |

A `contract.keys` hint wins over the generic check for its key.

### Target size

Ported from GoBanana's `design-target-size` gate (WCAG 2.5.8). The size is
`getBoundingClientRect`, padding included, widened by an absolutely
positioned `::before` or `::after`. Disabled, hidden and visually hidden
elements are skipped. The inline exception holds for a link in running text.
The spacing exception is not taken, because the anatomy contract asks for 24px
controls. One case is measured, not assumed: when an undersized element is
the only interactive element of a root that is 24px or more, the suite clicks
inside the root outside the element, and counts the root as the hit area only
when that click focuses the element (an input inside its box).

### Axe

Color contrast lines name the element, the owning component, both colors, the
ratio and the ratio needed.

## Contract hints a manifest may carry

Under `contract` in the manifest:

| Key | Type | Meaning |
| --- | --- | --- |
| `trigger` | selector | Clicked to open the component before the anatomy, state and Escape checks |
| `optionalParts` | string list | Parts that may be missing from the demo |
| `skipAxeRules` | string list | Axe rule ids to skip, with the reason in the manifest's notes |
| `keys` | object, key name to hint | A key check the generic ones do not cover (arrow keys, Home, End) |

`keys` hint shape (not in `schema.json` yet; the suite works without it):

```json
"contract": {
  "keys": {
    "ArrowDown": { "focus": "[data-part='item']", "case": "many", "expect": "focus-moves" }
  }
}
```

- `focus`: a selector inside the demo to focus first. Default: the first
  enabled root, or the first tab stop inside it.
- `case`: a demo case id to look in. Default: the whole demo.
- `expect`: `focus-moves`, `value-changes` (the focused value or
  `aria-valuenow`), `state-changes` (`data-state`, `aria-checked`,
  `aria-selected`, `aria-expanded`, `aria-pressed`, `aria-valuenow` or
  `data-selected` on the focused element or its root), `click` (a click
  event fires on the focused element) or `closes` (an open root closes).
