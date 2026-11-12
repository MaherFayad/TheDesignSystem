# Agent rules

These rules apply to the lead and to every subagent.

## Roles

- The lead plans, assigns, checks, commits and keeps state. Subagents build.
- A subagent gets one work order. It edits only the files the order lists.
- The lead alone edits: root config, `STATE.md`, `PLAN.md`, `DECISIONS.md`,
  `AGENTS.md`, `CLAUDE.md`, `docs/contracts/` and anything a script generates.
- Generated files (never edit by hand): every `src/index.ts` barrel in a
  component package, `packages/css/src/index.css`, `packages/styles/index.css`,
  `packages/styles/<id>/index.css`, `packages/manifest/manifests.gen.json`,
  every `*.gen.ts`. Run `npm run gen` instead.
- Subagents do not commit. The lead commits when the order is green.
- Never push. Never rewrite history. Never write to the source repos.

## Source material (read only)

- GoBanana: `/home/user/gobanana`
- Figma-Killer-2: `/home/user/maherfayad-stack/figma-killer-2`
- Never read, copy or adapt anything under Figma-Killer-2's
  `vendor/alm-design-system`. It belongs to a third party.
- For structure, PLAN.md wins. For visual values, the source repo wins.

## The loop for one work order

1. Read the work order in `docs/plan/wave-N.md`.
2. Read the contract docs it names, then the source files it names.
3. Build inside the owned files.
4. Run `npm run check`. Fix what fails inside your files. If a failure comes
   from a file you do not own, stop and report it.
5. Return a short report: what you built, what you could not do, and any
   decision you made.

## Writing rules (code comments and docs included)

- Never use an em dash or an en dash. A gate fails the build on either.
- Plain words. Sentence case. No marketing adjectives. No exclamation marks.
- English UI copy: sentence case. Buttons are a verb plus a noun. Never "OK",
  "Continue", "Confirm" or "Yes".
- Arabic demo copy: white Saudi dialect, noun form labels, no diacritics.
  Read `/home/user/gobanana/docs/arabic-copy-cookbook.md` first.

## Hard rules

- Tokens only in component CSS. No raw color, spacing, radius, font size,
  shadow, duration or z-index.
- Logical properties only. No `left`, `right`, `margin-left` and so on.
- Only `transform` and `opacity` animate. No animation library on the web.
- No `!important`. No Tailwind. No CSS-in-JS.
- No bare `<button>` outside the Button implementation.
- No native `title` attribute for hints. Use Tooltip.
- A style pack may change tokens, recipes, icons, motion presets and optional
  parts. Never markup. Never behavior.
- Runtime dependencies come from the allow list in section 4 of PLAN.md.
  Anything else is a HUMAN GATE: stop and report.
- Apple: the style id is `liquid`. No SF fonts by file, no SF Symbols, no
  Apple marks.

## Models

Every subagent runs as claude-opus-5-5 at medium effort. If you start another
session, pass `--model claude-opus-5-5 --effort medium`.

## HUMAN GATE

If your order hits a gate from section 0.3 of PLAN.md, do not act on it.
Report it so the lead can log it under "Waiting on owner" in STATE.md.
