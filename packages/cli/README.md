# ds

The command line of the system. No CLI library: `node:util` `parseArgs`. The
name comes from `cliName` in `ds.config.json`.

```sh
node packages/cli/bin/ds.mjs --help    # runs the TypeScript source through tsx
```

| Command | Does | `type` |
| --- | --- | --- |
| `ds search <words> [--framework <fw>]` | Finds components by what they are for | `search.results` |
| `ds docs <name>` | Use when, avoid when, use instead, anatomy, keys, mistakes | `docs.page` |
| `ds manifest <name>` | The manifest | `manifest` |
| `ds add <name> --framework react\|angular\|native` | Adds a component to the app in the current folder | `add.result` |
| `ds style list` | The style packs | `style.list` |
| `ds style check <id>` | Contract, contrast, icon map and font checks | `style.check` |
| `ds doctor [path]` | The checker of order 1.12 | `doctor.report` |

Every command takes `--json` and prints `{ "apiVersion": 1, "type", "data" }`.
Errors print `{ "apiVersion": 1, "type": "error", "data": { "code", "message" } }`.

Exit codes: 0 done; 1 the answer is a failure (doctor findings, a failing
style, files that differ in `ds add`); 2 a usage or lookup error.

| Code | When |
| --- | --- |
| `DS_E_USAGE` | Wrong arguments |
| `DS_E_NOT_FOUND` | No such component; `data.suggestions` lists close names |
| `DS_E_FRAMEWORK` | Unknown framework, or the component does not exist there (`not-applicable`) |
| `DS_E_NOT_READY` | The component is `planned` for that framework; `data.readyIn` |
| `DS_E_STYLE` | No such style |
| `DS_E_REGISTRY` | A `--registry` URL cannot be read |
| `DS_E_CONFIG` | A config file cannot be read |

## ds add

- React: the registry items of `packages/registry` (built in memory, or read
  from `--registry http://host/r`). Writes the item and every item it depends
  on under `<components alias>/ds/`, adds that folder to `exclude` in
  `ds.doctor.json`, and prints the install command and the imports. A file
  that differs is left alone and reported as a conflict unless `--overwrite`.
  The same files come from `npx shadcn@4.23.0 add @ds/<name>`.
- Angular and native: copies the component folder and every file it reaches
  through relative imports to `src/ds/<framework>/`, and prints the CSS and
  theme imports. Imports of `@the-system/*` packages stay.
- `--dry-run` lists the files without writing.
