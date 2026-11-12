# Decisions

Newest first inside each section. Each entry has a date and the reasoning.

## Environment (2026-11-12)

1. **Cloud Linux container, not Windows.** The prompt assumed
   `C:\Users\Admin\Documents\GitHub`. This session runs in a Linux cloud
   container. Source repos are cloned read only next to this repo:
   - GoBanana: `/home/user/gobanana` (commit 216625c)
   - Figma-Killer-2: `/home/user/maherfayad-stack/figma-killer-2` (commit 51b1994)
   They sit outside this repo, so nothing of theirs can be committed here.
   A later session must clone them again. `.reference/` stays in `.gitignore`
   for a local setup that prefers the in-repo path.
2. **Git.** The folder arrived as an empty git repo with a remote `origin`
   and the session branch `claude/relaxed-hypatia-7gseap`. The prompt says
   `git init`, branch `main`, no remote, never push. We commit on the session
   branch, one commit per green work order, and do not push. Pushing stays a
   HUMAN GATE. Risk the owner should know: the container is temporary, so
   unpushed commits are lost when it is reclaimed. Asked on 2026-11-12. The owner answered the same day: push the session
   branch to `origin` after each wave. Nothing else is pushed.
3. **Models.** Main agent: claude-fable-5-2 at medium (confirmed from the
   session record). Subagents: claude-opus-5-5 at medium. The Agent tool takes
   the alias `opus` plus effort `medium`, and `.claude/settings.json` forces
   the full id through `CLAUDE_CODE_SUBAGENT_MODEL`.
4. **Android emulator and iOS.** No `adb` here. React Native screenshots come
   from the web export only. iOS stays a HUMAN GATE.

## Structure (2026-11-12)

1. **Placeholders in one file.** `ds.config.json` holds the name, the package
   scope, the CSS prefix and the CLI name. The token build and the generators
   read it. Package names still repeat the scope, so a rename is this file
   plus a find and replace of `@the-system/`. A rename script comes with the
   release wave.
2. **Packages export source.** During development every package exports its
   TypeScript and CSS source (`exports` points at `src`). Vite, Vitest, Next
   (`transpilePackages`) and the Angular builder compile it. Compiled `dist`
   builds come with the release wave. Reason: no build step between a
   subagent's edit and the gallery.
3. **Playwright pinned to 1.63.0** to match the Chromium that is installed in
   the container.
4. **Dev tools outside the "use freely" list:** `typescript-eslint` (needed to
   lint TypeScript), `ajv` (manifest schema validation), `@types/*`,
   `@testing-library/user-event`, `@testing-library/jest-dom`. All dev only,
   none ships.
5. **Workspace `check` scripts.** `npm run check` runs the root steps, then
   `npm run check` in every workspace that defines one. Angular and React
   Native packages hook their own test runners in that way.
6. **Manifest additions.** The schema adds three optional keys the prompt did
   not list: `parts` (named sub components), `contract` (hints for the
   generated contract suite) and, for templates, `regions`, `uses`, `data`.

## Tokens (2026-11-12)

1. **DTCG 2025.10 is the format.** Differences from the shapes in PLAN.md are
   listed in `docs/contracts/tokens.md`. The spec wins: `em` and `vh` values
   are numbers with a `ds.unit` extension, and springs are groups of numbers.
2. **64 names added to the contract** under `added` in `contract.json`, so
   that no source token is dropped (overlay and scrim steps, glass variants,
   `text.placeholder`, `state.*.on-tint`, chart ordinal colors, Arabic
   leading, extra durations and eases). The mapping is in
   `docs/contracts/token-mapping.md`.
3. **Studio primary is neutral.** The yellow primary applies to Desk only, as
   the dials table says.
4. **First pass values with no source:** chart categorical 7 and 8,
   sequential 7, diverging, status critical, the info state, Desk glass-clear
   and glass-tinted, the three springs. They are reviewed with the charts
   (wave 2) and with Liquid.

## Theme and styles (2026-11-12)

1. **`Theme` takes inline styles through `css`.** Its `style` prop is the
   style axis. Recorded in `docs/contracts/frameworks.md`.
2. **`style.json` gains `status` and `proposedSchemes`.** They mark looks that
   wait for the owner. Desk has `proposedSchemes: ["light"]`.
3. **`defaultDensity` is `default` for Studio and Desk.** The base token
   values are the source values of each look. The words compact and roomy in
   the dials table describe how the look reads, not the axis value.
4. **Arabic: only small text moves one step up.** Body text keeps its step.
5. **Import order for consumers.** Only CSS outside layers is certain to win.
   A consumer that uses its own layers imports the system first.

## Components (2026-11-12)

1. **Toasts above a modal dialog.** While a modal dialog is open, toasts stay
   visible, are read by screen readers and can be clicked, but keyboard focus
   stays in the dialog, so F8 and Tab do not reach them. A trick that broke
   the focus trap was removed after review because it silenced other focus
   handlers on the page. To compensate, error toasts and toasts with an
   action never time out, so they are still there when the dialog closes.
2. **The toast store owns time, not Radix.** Durations: 4s, warning 6s,
   danger and action toasts stay until closed. `toast.configure` lets an app
   lengthen them (WCAG 2.2.1).
3. **Window lights keep their order in RTL** (close, minimize, zoom from the
   left) and show idle dots at rest, as the source does.
4. **Dialog has a `panel` part.** The root is a fixed layer that holds the
   backdrop and the panel, so the backdrop belongs to the dialog.

## Conflicts between the prompt and a source repo

None yet.

## React Aria Components 1.22.1 (order 1.2.0, 2026-11-12)

Installed `react-aria-components@1.22.1`, exact, in `@the-system/react`. It is
on the allow list in section 4 of the plan. It brings no second React copy.
It is used only where an order names it (NumberField, ScrubInput, later the
date family).

