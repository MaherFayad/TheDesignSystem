# Order 1.29 brief for every subagent

You work inside the lead's session for order 1.29 (fix round 1 of 3 after the
round 3 interaction review), in `/home/user/TheDesignSystem` on branch
`claude/ds-order-1-29`. Other subagents edit other files in the same working
tree at the same time. Nobody watches: decide, note the decision, continue.

## Read first

- `CLAUDE.md`, `AGENTS.md`, the agent file for your role in `.claude/agents/`.
- `docs/contracts/anatomy.md` (DOM rules, "One convention for component CSS
  and props") and `docs/contracts/frameworks.md`. Skim `style-pack.md`.
- `docs/reports/reviews/interactions-3.md`: the blockers (Part 7), the ten
  weakest (Part 3) and the notes that name your files.
- `docs/reports/interactions-3.md`, "Hooks for styles and platforms": those
  names must stay stable. Never rename or remove an existing private
  property or part.

## Rules that stand

- Motion animates only `transform`, `opacity`, `clip-path`, stroke drawing,
  `filter`, `backdrop-filter`, colours and `box-shadow`. Never layout.
- Values from tokens. A recipe sets a duration only through a
  `--ds-duration-*` or `--ds-delay-*` token.
- A reduced motion form under both `@media (prefers-reduced-motion: reduce)`
  and `[data-motion='reduce']`.
- No more than three flashes a second. Never delay the action, block input,
  or move a target from under the pointer. The focus ring shows at once.
- Never wait on `transitionend` or `animationend`.
- Forced colors and `prefers-reduced-transparency` work. The contrast gate
  passes with no new known failures.
- Liquid style and the platform ids (`ios`, `android`): no vendor name, font
  file, symbol or asset.
- Angular DOM equals React DOM.
- Never an em dash or an en dash anywhere (a gate fails the build). Plain
  words, sentence case, no exclamation marks.
- Do not commit, do not push, do not edit `STATE.md`, `PLAN.md`,
  `DECISIONS.md`, `docs/contracts/` or generated files (run `npm run gen`).
- Each blocker fix gets a test that fails before the fix and passes after
  (vitest unit test next to the code, or a Playwright probe script committed
  under `docs/reports/fixes/interactions-3/` with its JSON output). Say in
  your report how you proved it failed first (for example by running it on
  `git stash` or reading the old value).
- Stay inside the files your order lists. If you need a change elsewhere,
  write it under "Changes needed from the lead" in your report. Before every
  edit of a file that another lane may also touch (platform files, gallery
  files), read it again so you do not overwrite another lane's edit.
- Run `npx vitest run <your test files>` and `npx tsc --noEmit -p
  tsconfig.json` often; run `npm run check` once at the end (it may fail on
  another lane's half done work: report which step and file, do not fix
  files you do not own).
- The gallery: `PORT=51xx npx vite --port 51xx --strictPort` in
  `apps/gallery-react` (pick the port your order names). Stage only mode:
  `/interactions?focus=<id>&style=<studio|desk|neutral|liquid>&scheme=light&chrome=0`,
  plus `&platform=ios|android`, `&dir=rtl&lang=ar`. Chromium and Playwright
  are preinstalled: never run `playwright install`.

## Report

Write your report to the path your order names: what you fixed, per blocker
the test and the evidence, hooks added (name, element, default, who sets
it), files changed, decisions, what you could not do and why, and changes
needed from the lead. Keep it short and exact.
