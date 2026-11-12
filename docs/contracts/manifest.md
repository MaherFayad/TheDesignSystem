# Manifest contract

One manifest per component, pattern and template. One manifest serves all
frameworks. Docs, llms files, the registry, the CLI, the MCP server, the
checker and the contract suite are generated from manifests.

- File: `packages/manifest/src/<kind>/<Name>.manifest.json`
- Schema: `packages/manifest/schema.json`
- Validator: `npx tsx packages/manifest/validate.ts` (part of `npm run check`)
- All manifests in one file: `packages/manifest/manifests.gen.json` (generated)

## Required keys

`name`, `kind`, `family`, `summary`, `useWhen`, `avoidWhen`, `insteadUse`,
`frameworks`, `since`. `useWhen`, `avoidWhen` and `insteadUse` may not be
empty. `frameworks` has `react`, `angular` and `native`, each with a `status`
of `ready`, `planned` or `not-applicable`.

## Keys

| Key | Meaning |
| --- | --- |
| `anatomy` | Part names. The first is `root`. They equal the `data-part` values. |
| `parts` | Named sub components, for example `{ "DialogTitle": "title" }` |
| `slots` | For a part that takes children: `accepts` (`any`, `text` or a list of component names), `max`, `min` |
| `props` | Prop name to its values. The shared axes use the shared words only. |
| `states` | Values of `data-state`, plus the boolean state attributes in use |
| `a11y` | `role`, `focus`, `keys` (the keyboard map), `announce`, `native` |
| `content` | Copy rules for `en` and `ar` |
| `tokens` | Token paths the component reads |
| `motion` | A pattern id from `packages/motion` (`PATTERN_IDS` in `core.ts`), or `none`. The schema enum is written by `npm run gen`. Leave the key out only for layout components; write `none` for a component that has no motion |
| `styles` | What a style changes, in words, per style id |
| `mistakes` | Pairs of `wrong` and `right` |
| `contract` | Hints for the contract suite: `trigger`, `optionalParts`, `skipAxeRules` |

## Ownership

The React agent writes the manifest. The Angular and native agents edit only
their own block under `frameworks`. A `frameworks.<x>.example` names a file in
that framework's component folder.

See section 3.8 of PLAN.md for a full example.
