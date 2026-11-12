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

## Conflicts between the prompt and a source repo

None yet.
