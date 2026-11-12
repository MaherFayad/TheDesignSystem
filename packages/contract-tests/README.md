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
- JSON, full run: `docs/reports/contract-<framework>.json` (the Playwright JSON
  reporter).
- JSON, run narrowed with `--component`:
  `packages/contract-tests/.out/<pid>/contract-<framework>.partial.json`. The
  full report is left alone.
- Every run keeps its Playwright output in `packages/contract-tests/.out/<pid>/`
  and picks a free port again when another run takes it first, so several runs
  on one machine do not collide. `.out/` is scratch and is not committed.

Environment the spec reads: `DS_GALLERY_URL`, `DS_FRAMEWORK` (default
`react`), `DS_COMPONENT` (comma list), `DS_ROUTES` (set by run.ts),
`DS_CONTRACT_JSON`, `DS_CONTRACT_OUT` (the run folder), `DS_CONTRACT_WORKERS`
(default 4).

`src/server.ts` starts and stops a gallery on a free port. `run.ts`,
`scripts/shots.ts` and `scripts/a11y.ts` share it.

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
| `anatomy` | **anatomy**: a root exists; every part except `root` is found as `[data-part]` owned by some root; no owned `data-part` outside the anatomy; no root carries `data-part="root"` | every style, dark, en ltr |
| `contract.optionalParts`, `style.json` `optionalParts[<kebab>]` | parts that may be missing; a part a style pack lists is required in that style and optional in the others | anatomy |
| `props.size`, `props.tone`, `props.emphasis`, `props.shape` | **variant attributes**: manifest values are shared words; every root value is a shared word and is in the manifest; the `variants` case shows every manifest value at least once | default style, dark, en ltr |
| `states` | **state attributes**: boolean states (`data-disabled`, `data-loading`, `data-invalid`, `data-readonly`, `data-selected`, `data-dragging`, plus any other `data-*` in `states` except `data-state`, `data-orientation` and valued entries) have an empty value; a valued state written `data-<name>=<a>|<b>` in `states` (for example `data-level=low|medium|high`) carries one of its values; `data-state` values are in `states`; no state class (`is-*`, `*--disabled`, `active`, `disabled`, `selected`, `loading` and similar) on roots and parts | default style, dark, en ltr |
| `a11y.keys` | **keyboard map**, one generic check per key (below) | default style, dark, en ltr |
| (always) | disabled roots are out of the tab order or carry `aria-disabled="true"` | keyboard map |
| (always) | **target size**: every interactive element in a demo case, and in every root a trigger opens, is at least 24 by 24 CSS px | every style and every density (compact, default, comfortable), dark, en ltr; overlays also with each trigger in the variants case open, density default |
| (always) | **reflow**: no sideways scroll at 320px wide; no native `title` attribute | en ltr and ar rtl |
| `contract.skipAxeRules` | **axe** with `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`, minus these rules | every style and scheme in `packages/styles/*/style.json`, in en ltr and ar rtl |

### Part ownership

A part belongs to the nearest ancestor root, not counting the element itself.
The walk starts at the part's parent element, so a part on an element that is
itself a nested root (the close IconButton of a Window,
`data-ds="icon-button" data-part="close"`) counts for the outer root. Parts
inside a nested root (the `title` inside a TitleBar inside a Window) belong to
the nested component and are never counted for the outer one.

### Overlays

A component is an overlay when its `states` list `open` and `closed` and the
demo has a trigger (`contract.trigger`, else `[data-demo-trigger]`). Its root
is not in the DOM until a trigger opens it, and a demo may also hold static
examples (a Toast in the demo next to the toasts the Toaster shows). Before
each trigger click the suite marks every root on the page as seen; the roots
the click adds are the opened ones, wherever they render (a portal, or
`[data-ds="toaster"]`).

- Anatomy, variant attributes and state attributes: read from the static
  examples, plus every root opened by each trigger in turn (the triggers in
  the variants case, else all), each closed with Escape (or a reload) before
  the next. Opened roots from the variants case count for variant coverage.
- State attributes: a static example of an overlay stamps no `data-state`
  (other than `closed`).
- Tab and Shift+Tab: open the first trigger, then the key must move focus.
  When the manifest says modal (the role or the Tab entry names a modal, a
  trap, or "wraps from the last", and does not say "not modal") or the open
  root has `aria-modal="true"`, focus must be inside after opening and stay
  inside for every press around the loop.
- Escape: open the first trigger; only the roots it added count. When focus
  is not inside them, it is moved to their first tab stop first. They must
  close or leave the DOM.
- Axe: also runs with the first trigger's root open, in every style, scheme
  and direction, with reduced motion.

### Keyboard checks

Each `a11y.keys` entry is split into keys (`"Home, End"` gives Home and End).

| Key | Generic check | Runs when |
| --- | --- | --- |
| `Tab` | Tab from the top of the page reaches the first enabled root, or a control inside it (overlays: see above) | always |
| `Shift+Tab` | after Tab reaches it, Shift+Tab leaves it (overlays: see above) | always |
| `Enter`, `Space` | on the first enabled root that is a button element or `role="button"`, a click event fires | such a root exists; otherwise a note |
| `Escape` | open through `contract.trigger` or a `[data-demo-trigger]`; the roots the trigger added close or leave the DOM | `states` has `open` and `closed`; otherwise a note |
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

Scheme and direction do not change sizes, so they are not repeated. The
`platform=ios` (44pt) and `platform=android` (48dp) passes are not run for
the web; they belong to wave 2 with the touch templates.

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

`keys` hint shape (`schema.json` checks it):

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
- `physical`: for `moves` only. The arrow names a screen direction, so
  ArrowRight moves to the right in rtl too. Set it for a positioned object
  (a Window) whose arrows move what the person sees. Default false.
- `expect`:
  - `focus-moves`: the focused element changes.
  - `value-changes`: the focused value or `aria-valuenow` changes.
  - `state-changes`: `data-state`, `aria-checked`, `aria-selected`,
    `aria-expanded`, `aria-pressed`, `aria-valuenow` or `data-selected` on
    the focused element or its root changes, or `data-state` or a boolean
    state the manifest lists (`data-zoomed`) on any root of the component.
  - `click`: a click event fires on the focused element.
  - `closes`: the root that held focus leaves the page, hides or says
    `data-state="closed"`, or every open root closes.
  - `moves`: the root that holds focus moves at least 1px in the direction
    the arrow key names, read from `getBoundingClientRect`. ArrowRight is
    toward the inline end, so in rtl the sign flips; ArrowUp and ArrowDown
    never flip. For a Shift arrow, when the keyboard map says Shift moves
    further (a larger px number than the plain arrow, or the word
    "further"), a Shift press must move further than the plain arrow from
    the same place. Keys are pressed in en ltr.
