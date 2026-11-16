# Compare harness

Side by side acceptance (ruling 5, `docs/plan/reset.md` section 3). One
command runs one pair:

```sh
npm run compare -- --pair gb-button-desk
npm run compare -- --list
npm run compare -- --pair gb-dialog-desk --system-url http://localhost:5173   # a gallery that is already running
npm run compare -- --pair fk2-menu-studio --out /tmp/menu                     # write somewhere else
```

It starts the source and the React gallery on free ports, opens both in the
same Chromium at the pair's viewport and scheme, runs each side's setup steps,
waits until finite animations end, probes every region and writes to
`docs/reports/reset/compare/<id>/`:

| File | What |
| --- | --- |
| `source.png`, `system.png` | the two captures, one viewport each |
| `sheet.png` | each region cropped, source left and system right (crops of 400px or less at 2x), then the table |
| `table.md` | every probed property: source value, system value, difference, tolerance, result |
| `result.json` | the same, with the notes on how each side was served |

Exit code: 0 when every row passes or is allowed, 1 when a row fails, 2 when
the harness could not run. It stops every server it started.

## The sources

Both source repos are read only. The harness reads files there and runs
`git rev-parse` and `git status`; it writes only in the scratch folder:
`DS_COMPARE_SCRATCH`, else `<tmp>/ds-compare`. It refuses a scratch folder
inside this repo or inside either source repo. `DS_GB_ROOT` and `DS_FK2_ROOT`
move the source repos.

- **GoBanana** runs from a copy of `banana-server` in the scratch folder
  (without `node_modules`, `.next` and `.git`), installed with
  `npm ci --ignore-scripts`, served by `next dev` with the repo's own end to end
  bypass: `E2E_AUTH_BYPASS=1 ADMIN_FIXTURES=1 DATABASE_URL=` (its
  `playwright.config.ts`). The copy and the install are redone only when the
  source commit, its uncommitted changes or its lockfile change. A first run
  takes about 75 seconds; later runs about 30.
- **Figma-Killer-2** cannot run as an app: it needs a third party package
  from its vendor folder at install, which this project may not read. The
  harness writes `fk2/screens.jsx` and an `index.html` to the scratch folder
  and serves them with Vite from this repo. `@ui/*`, `@core/*` and `@fk2/*`
  point into FK2's `src`; React and Inter come from this repo through a link.
  Any import that resolves into FK2's vendor folder becomes an empty module,
  and the dev server may read only the scratch folder, FK2's `src` and this
  repo's `node_modules`. FK2's pixel icons become empty boxes of the same
  size. Each FK2 pair says `"reconstruction": true`: the components and CSS
  are FK2's own, the composition and the strings are the harness's.
- **The system** is the React gallery (`apps/gallery-react`, vite dev), or the
  address given with `--system-url`.

GoBanana's site pages (the `(site)` layout: desk, Finder, pricing) run
`GpuProbe`, which marks the page `data-gpu="software"` in headless Chromium and
turns every live blur off. The Studio primitives page `/__design` has no such
probe, so the sample pairs need nothing. A pair on a site page removes the
mark with the setup step
`{ "attr": { "selector": "html", "name": "data-gpu", "value": null } }`, so
computed CSS shows the designed blur; the run notes say when the mark was
there on load. The software GPU still draws blur differently from a real
one, so a glass region is compared by its CSS, and a pixel probe on it
(`"pixels": { "glass": true }`) is never run; it shows as allowed with that
reason.

## A pair file

`pairs/<id>.json`, checked against `pair.schema.json` and by `pairs.ts`. The id
starts with the source repo (`gb-` or `fk2-`).

- `audit`: the audit file, shot and finding the pair answers.
- `source`: `repo`, `screen` (a path on the source server), `how` (how a person
  reaches the screen), `reconstruction`, `setup` steps.
- `system`: `url` (a gallery path) and `setup` steps.
- `viewport`, `scheme`, `reducedMotion` (default `no-preference`).
- `tolerance`: `{ "profile": "default" }`, with `tighten` to lower a value. A
  looser value is refused.
- `regions`: each has an `id`, a `kind` (`control`, `part` or `region`, which
  picks the box tolerance), a CSS selector per side (the first visible match,
  or `nth`), `probes`, and optionally `pixels` and `crop: false`.
- `allowed`: `{ region, probe, reason }` for a value that differs on purpose
  (the 3:1 alpha of ruling 2, the 2px focus ring, the accessible toast
  timing). A failing row it names reads "allowed" with the reason.

A probe is a property name read on the region root (`"height"`,
`"border-radius"`, `"background-color"`), or an object:

```json
{ "id": "header fill", "property": "background-color", "source": ".st-dialog-header", "system": "[data-part='titlebar']" }
{ "id": "window lights", "property": "count", "source": null, "system": "[data-ds='window-controls']" }
{ "id": "scrim fill", "property": "background-color", "pseudo": { "source": "::backdrop" } }
```

A sub selector is relative to the region root. `null` says the part does not
exist on that side on purpose ("absent"). `count` counts visible matches.

Setup steps (Playwright selectors, so `role=button[name="Share canvas"]`
works): `click`, `hover`, `focus`, `press`, `wait`, `waitMs`, and
`attr: { selector, name, value }` (`value: null` removes the attribute).

## Tolerances

The default profile is the table in plan section 3. How each kind of value is
compared (`tolerance.ts`):

| Value | Compared as |
| --- | --- |
| width, height, x, y, padding, margin, gap | px; 1px for a control or part, 2px for a screen region |
| colour (fill, text, border) | Delta E 2000 after compositing each colour on black and on white; the larger counts, so alpha differences show |
| box-shadow | same number of layers; each length within 1px, each colour within Delta E 2 |
| border-radius | the rendered radius (clamped to half the short side, so 999px and 9999px pills read the same), equal |
| border width, font size | equal |
| font weight | equal |
| line height | 1px; `normal` matches only `normal` |
| letter spacing | in em at the element's own font size; `normal` is 0; 0.01em |
| duration | the longest of the list; 10ms or 10 percent, the larger |
| easing | the first curve; each control point within 0.02; `steps()` and `linear()` only equal |
| transform | translate within 1px, scale within 0.01 |
| pixels | at most 3 percent of the region's pixels differ at pixelmatch threshold 0.1, with text runs, images, SVG, canvas and video painted over on both crops |
| anything else | the same string |

## Tests

`compare.test.ts` runs in Vitest with `npm run check`: the tolerance table,
each comparison, the pixel probe, the pair files, the page probe in Chromium
on a fixture, and the isolation rules (no harness file names a path in FK2's
vendor folder; no scratch folder inside a repo).
