# DU1: the placement prop in React

Order DU1 of `docs/plan/reset-duo.md`, option (a) of section 4. Working
answers from the lead: (a) plus (c), the `auto` threshold of section 5.1 as
written, no second column beside Safari's own on the outer screen in
portrait, one type ramp.

## Names CSS reads (for DU2)

| Hook | Where | Values |
| --- | --- | --- |
| `data-placement` | the TabBar root (`[data-ds='tab-bar']`), the Navbar root (`[data-ds='navbar']`), the PageShell root (`[data-ds='page-shell']`) | `bottom` or `side`; absent for `auto` |
| Container name `ds-shell` | the PageShell root, `[data-ds='page-shell']` | the container the `auto` queries hang on |

The names are the ones the plan gives (section 4 and section 11 item 1);
none was left open. The React side stamps no inline style: the container
declaration is CSS and belongs to DU2 (see "For DU2" below).

A TabBar or Navbar inside a PageShell carries its own `data-placement`, so a
rule can target the bar directly (`[data-ds='tab-bar'][data-placement='side']`)
without a descendant selector from the shell. Under `auto` nothing is
stamped anywhere, and the CSS writes the side layout inside
`@container ds-shell (inline-size >= 27.5rem) and (block-size <= 43.75rem)`.

## What was built

- `placement?: 'auto' | 'bottom' | 'side'` on `TabBar`, `Navbar` and
  `PageShell`. PageShell defaults to `auto` and passes its value down through
  a context; a bar with no placement of its own takes the nearest
  PageShell's, else `auto`. A bar's own value wins, `auto` included. A nested
  PageShell resets to its own value.
- `data-placement` stamped only when the resolved value is not `auto`, on the
  client and in the server render. No JavaScript measures anything during
  render, so hydration matches.
- TabBar keys: every item stays a tab stop in every placement. Arrow keys
  move along the bar as it is drawn, wrapping: Left and Right in a row
  (flipped in right to left), Up and Down in a column (not flipped). Home and
  End go to the first and last item. Wrong axis keys do nothing, so they
  still scroll. The axis comes from `side` or `bottom`; under `auto` it is
  read from where the first two items sit at the moment of the key press
  (one under the other is a column), never during render. Modified keys and
  an event the app already handled are left alone.
- Navbar: only the attribute. The brand and the links stay in the top row in
  every placement (plan 5.2: text buttons stay in the top row), so Radix
  NavigationMenu keeps its horizontal orientation and arrow keys. The end
  actions (or, under breakpoint.tablet, the menu button) are what the column
  takes; they are tab stops.
- Focus order: placement never changes the DOM. In a PageShell the order is
  skip link, header (Navbar: brand, links, end actions, menu button), nav,
  main, aside, footer (TabBar). That is the top row, the top of the column,
  the content, then the tab bar at the bottom of the column.
- Manifests for TabBar, Navbar, PageShell: the `placement` prop with its
  values and when to use `side` by hand (never in a desktop app or under
  `macos`), `data-placement=bottom|side` under `states`, the TabBar keyboard
  map, a11y notes, mistakes. `npm run gen` run.
- Demos: a `side` row in the variants case of each, in English and Arabic
  (TabBar, Navbar), and a phone shell with a Navbar and a TabBar in the
  PageShell variants case, English and Arabic. Without DU2's CSS they draw as
  today.

## Decisions

1. No `aria-orientation` on the TabBar. ARIA 1.2 does not allow it on the
   `navigation` role, axe flags it (`aria-allowed-attr`), and the bar stays a
   nav of links with `aria-current` (it is not a tablist). Every item is
   reached with Tab in every placement, so the axis need not be announced.
   The arrow keys are a help, with no roving tab index.
2. No `data-orientation` on the TabBar either: under `auto` the axis is not
   known at render, and a second attribute that is only sometimes right would
   mislead the CSS. CSS reads `data-placement` and the container query.
3. The context lives in a small module, `PageShell/placement.ts`, imported by
   TabBar and Navbar (the same way Pagination imports `TabBar/pressOrigin`).
   It is not in any barrel. The types are exported from the component files
   as `TabBarPlacement` and `NavbarPlacement`, but the handwritten
   `index.ts` files (not mine to edit) do not export them yet.
4. Arrow keys were added to the bottom bar too, not only the column, so the
   keys are the same whatever `auto` resolves to.

## Tests

`npx vitest run packages/react/src/components/{TabBar,Navbar,PageShell}`:
4 files, 61 tests, all pass. New cases:

- TabBar: no attribute for `auto` (client and `renderToString`, alone and in
  a PageShell); `bottom` and `side` stamped (client and server); inherited
  from PageShell for each value; own value wins, `auto` included; same
  links, names, labels and tab stops in every value, and no
  `aria-orientation`; keys in `side`, `bottom`, `bottom` in RTL, `side` in
  RTL, Home and End, `auto` as a row and as a column (item rects mocked),
  modified and handled keys left alone.
- Navbar: no attribute for `auto` (client and server); each value stamped
  and inherited; own value wins; same parts, tab order and horizontal
  orientation in `side`.
- PageShell: no attribute anywhere for `auto` (client and server); each
  value on the root and passed to a TabBar and a Navbar (three attributes in
  the server render); same parts and tab order in `side`; a nested shell
  does not pass its parent's value on.

WCAG 2.2 criteria these tests cover: 2.1.1 Keyboard, 2.4.3 Focus order,
1.3.2 Meaningful sequence, 1.3.4 Orientation (no placement removes or locks
a part), 4.1.2 Name, role, value (labels stay the link names). Not covered
here, because they are layout drawn by DU2's CSS and need a browser: 2.5.8
Target size (48 by 48 column items) and 2.4.11 Focus not obscured (scroll
padding at the inline end). The contract runs of section 7 prove those.

## Proof

- `npm run typecheck`: no error in the touched files. One error at the time
  of the run in `packages/contract-tests/src/fold.ts` (line 145, `screen` on
  `DeviceDescriptor`), a DU4 file being written by another agent.
- `npx eslint` on the three folders: clean.
- `npx tsx packages/manifest/validate.ts`: 111 manifests, 0 errors.
- `npm run check`: tokens build, gen, typecheck, eslint, manifests, native,
  docs, the galleries and both consumers pass. Three failures, none in a DU1
  file, each rerun alone:
  - vitest, `packages/lint/src/gates/token-vocabulary.test.ts`:
    `--_ios-refraction` used in `packages/css/src/platform/ios-refraction.css`
    lines 74 to 85 is declared in no component file. Fails again alone. That
    CSS belongs to another agent.
  - vitest, `ProgressCircle.test.tsx`: ENOENT while loading during the full
    run (other agents writing files). Passes alone, 16 of 16.
  - `check @the-system/angular`: exited non zero in the full run with 771 of
    771 tests passing; passes alone (exit 0). No Angular file was touched.

## For DU2

- Declare the container in CSS, for example in `ios.css`:
  `[data-platform='ios'] [data-ds='page-shell'] { container: ds-shell / size; }`.
  `size` containment means the shell no longer takes its height from its
  content, and PageShell today uses `min-block-size: 100%`. Scope it to
  `ios` so `web`, `android` and `macos` keep their computed style, and make
  sure the shell has a definite block size there (a full screen app, or the
  gallery frame), or it collapses.
- Never reorder parts with `order` or a grid that changes the reading
  sequence: the focus order above is the column's top to bottom order.
- Hide the TabBar label in the column with `data-visually-hidden` style
  rules (clip), never `display: none`, so it stays the link name.

## Contract edits for the lead

`docs/contracts/anatomy.md`, convention 11, add a row to the table:

| PageShell, TabBar, Navbar | `data-placement` (`bottom`, `side`; absent for `auto`) |

and add this paragraph after the table:

> `placement` (`auto`, `bottom`, `side`) on PageShell, TabBar and Navbar
> says where the bars of a phone shell sit. `auto` is the default and stamps
> nothing: the CSS decides with a container query on the PageShell root,
> which is a size container named `ds-shell`. `bottom` and `side` stamp
> `data-placement`. PageShell passes its value to every TabBar and Navbar
> inside that sets none; a bar's own value wins. The column is a placement
> of existing parts: no new part, and the DOM order never changes with
> placement. No framework measures the layout during render to choose a
> placement.

`docs/contracts/frameworks.md`, under "Platform axis", after the table:

> Rule: `ios` covers the foldable iPhone. `auto` never detects a model and
> never reads `screen` sizes. Layout on this device comes from size (the
> `ds-shell` container), the safe area insets, each side on its own, and,
> when present, device posture and viewport segments.

`docs/contracts/tokens.md`, under `inset.safe`:

> On the foldable iPhone `inset.safe.start` and `inset.safe.end` differ. No
> rule may assume opposite insets are equal.

## Could not do

- A Tooltip with the label for icon only items in the column (plan 5.2).
  A Tooltip is markup, and under `auto` only the CSS knows the bar is a
  column, so it cannot be added without measuring. Options for the lead:
  always wrap items in a Tooltip that the CSS shows only in the column, or
  add it for `side` only. Not built; noted in the manifest.
- The search button below the tab capsule and the collapse to one button
  when the column is too short (plan 5.2) need new parts or behaviour; they
  are not in DU1.
- Public type exports: `TabBarPlacement` and `NavbarPlacement` are not in
  the component `index.ts` files, which this order may not edit.
